import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import {
  monthKey, firstOfThisMonth, invoiceBalance, monthlyObligations, addMonths,
} from '../lib/finance'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [invoice, setInvoice] = useState(null)        // current open invoice
  const [allInvoices, setAllInvoices] = useState([])
  const [movements, setMovements] = useState([])
  const [fixedBills, setFixedBills] = useState([])
  const [billPayments, setBillPayments] = useState([])
  const [installments, setInstallments] = useState([])
  const [goals, setGoals] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

  const thisMonth = monthKey(firstOfThisMonth())

  // ── load everything ──────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!user) return
    const uid = user.id
    // ensure an open invoice exists for the current month
    await supabase.rpc('get_or_create_invoice', { p_month: thisMonth })

    const [p, inv, mv, fb, bp, ins, gl, sn] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('invoices').select('*').eq('user_id', uid).order('reference_month', { ascending: false }),
      supabase.from('movements').select('*').eq('user_id', uid).order('occurred_at', { ascending: false }).limit(200),
      supabase.from('fixed_bills').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('fixed_bill_payments').select('*').eq('user_id', uid),
      supabase.from('installments').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('goals').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('monthly_snapshots').select('*').eq('user_id', uid).order('reference_month'),
    ])

    setProfile(p.data)
    setAllInvoices(inv.data ?? [])
    setInvoice((inv.data ?? []).find((i) => i.reference_month === thisMonth) ?? null)
    setMovements(mv.data ?? [])
    setFixedBills(fb.data ?? [])
    setBillPayments(bp.data ?? [])
    setInstallments(ins.data ?? [])
    setGoals(gl.data ?? [])
    setSnapshots(sn.data ?? [])
    setLoading(false)
  }, [user, thisMonth])

  useEffect(() => { if (user) { setLoading(true); refresh() } }, [user, refresh])

  // ── small writers ────────────────────────────────────────────────────
  const setBalance = async (value) =>
    supabase.from('profiles').update({ balance: value }).eq('id', user.id)

  const bumpInvoice = async (delta) => {
    // grow the current open invoice's charges by `delta`.
    // a fresh charge means the invoice is no longer settled → reopen it.
    const cur = invoice ?? (await supabase.rpc('get_or_create_invoice', { p_month: thisMonth })).data
    await supabase.from('invoices')
      .update({ total_amount: Number(cur.total_amount) + Number(delta), status: 'open' })
      .eq('id', cur.id)
    return cur
  }

  const writeSnapshot = async (balanceEnd) => {
    const invBal = invoiceBalance(invoice)
    await supabase.from('monthly_snapshots').upsert({
      user_id: user.id,
      reference_month: thisMonth,
      balance_end: balanceEnd,
      salary: profile?.salary ?? 0,
      invoice_total: invBal,
    }, { onConflict: 'user_id,reference_month' })
  }

  // Spend cash. If it overdraws, the shortfall is charged to the card
  // ("no money = using credit"). Returns how much spilled onto the invoice.
  const spendCash = async (amount) => {
    const have = Number(profile.balance)
    const after = have - Number(amount)
    if (after < 0) {
      await setBalance(0)
      await bumpInvoice(Math.abs(after))
      await writeSnapshot(0)
      return Math.abs(after)
    }
    await setBalance(after)
    await writeSnapshot(after)
    return 0
  }

  // ── PROFILE ──────────────────────────────────────────────────────────
  const updateProfile = async (patch) => {
    await supabase.from('profiles').update(patch).eq('id', user.id)
    await refresh()
  }

  // ── MOVEMENTS ────────────────────────────────────────────────────────
  const addMovement = async ({ kind, method, amount, category, description }) => {
    amount = Number(amount)
    let spilled = 0
    let invoiceId = null

    if (kind === 'income') {
      // income always lands as cash (salary is separate & fixed)
      await setBalance(Number(profile.balance) + amount)
      await writeSnapshot(Number(profile.balance) + amount)
    } else if (method === 'credit') {
      const cur = await bumpInvoice(amount)
      invoiceId = cur.id
    } else {
      spilled = await spendCash(amount)
    }

    await supabase.from('movements').insert({
      user_id: user.id, kind, method, amount, category, description, invoice_id: invoiceId,
    })
    await refresh()
    return { spilled }
  }

  // ── INVOICE (fatura) ─────────────────────────────────────────────────
  const payInvoice = async (amount) => {
    if (!invoice) return
    const due = invoiceBalance(invoice)
    if (due <= 0) return
    // never pay more than what's owed
    const pay = Math.min(Number(amount), due)
    if (!pay || pay <= 0) return

    const newPaid = Number(invoice.paid_amount) + pay
    const fullyPaid = invoiceBalance({ ...invoice, paid_amount: newPaid }) <= 0.001
    await supabase.from('invoices').update({
      paid_amount: newPaid,
      status: fullyPaid ? 'paid' : 'open',
    }).eq('id', invoice.id)

    // paying the card comes straight out of your balance. You can't pay the
    // card with the card, so this is NOT routed through spendCash — the
    // balance simply drops (and may go negative if you were short).
    const newBalance = Number(profile.balance) - pay
    await setBalance(newBalance)
    await writeSnapshot(newBalance)

    await supabase.from('movements').insert({
      user_id: user.id, kind: 'expense', method: 'cash', amount: pay,
      category: 'Fatura', description: 'Pagamento de fatura', invoice_id: invoice.id,
    })
    await refresh()
  }

  const finalizeInvoice = async () => {
    if (!invoice) return
    await supabase.from('invoices').update({ status: 'finalized' }).eq('id', invoice.id)
    await refresh()
  }

  // not paid in full → roll remaining (with interest) into next month's invoice
  const rollInvoice = async () => {
    if (!invoice) return
    const remaining = invoiceBalance(invoice)
    if (remaining <= 0) return
    const withInterest = remaining * (1 + Number(invoice.interest_rate))
    const nextMonth = monthKey(addMonths(invoice.reference_month, 1))
    const { data: next } = await supabase.rpc('get_or_create_invoice', { p_month: nextMonth })
    await supabase.from('invoices').update({
      carried_amount: Number(next.carried_amount) + withInterest,
    }).eq('id', next.id)
    await supabase.from('invoices').update({ status: 'finalized' }).eq('id', invoice.id)
    await refresh()
  }

  // ── FIXED BILLS ──────────────────────────────────────────────────────
  const addFixedBill = async (b) => {
    await supabase.from('fixed_bills').insert({ user_id: user.id, ...b })
    await refresh()
  }
  const toggleFixedBill = async (id, active) => {
    await supabase.from('fixed_bills').update({ active }).eq('id', id)
    await refresh()
  }
  const deleteFixedBill = async (id) => {
    await supabase.from('fixed_bills').delete().eq('id', id)
    await refresh()
  }
  const payFixedBill = async (bill, via = 'cash') => {
    if (via === 'credit') await bumpInvoice(bill.amount)
    else await spendCash(bill.amount)
    await supabase.from('fixed_bill_payments').upsert({
      user_id: user.id, fixed_bill_id: bill.id, reference_month: thisMonth, paid_via: via,
    }, { onConflict: 'fixed_bill_id,reference_month' })
    await supabase.from('movements').insert({
      user_id: user.id, kind: 'expense', method: via, amount: bill.amount,
      category: 'Conta fixa', description: bill.name,
    })
    await refresh()
  }

  // ── INSTALLMENTS ─────────────────────────────────────────────────────
  const addInstallment = async (i) => {
    await supabase.from('installments').insert({ user_id: user.id, ...i })
    await refresh()
  }
  const deleteInstallment = async (id) => {
    await supabase.from('installments').delete().eq('id', id)
    await refresh()
  }
  const payInstallment = async (inst, via = 'cash') => {
    if (inst.paid_count >= inst.total_count) return
    if (via === 'credit') await bumpInvoice(inst.installment_amount)
    else await spendCash(inst.installment_amount)
    await supabase.from('installments')
      .update({ paid_count: inst.paid_count + 1 }).eq('id', inst.id)
    await supabase.from('movements').insert({
      user_id: user.id, kind: 'expense', method: via, amount: inst.installment_amount,
      category: 'Parcela', description: `${inst.name} (${inst.paid_count + 1}/${inst.total_count})`,
    })
    await refresh()
  }

  // ── GOALS (caixinhas) ────────────────────────────────────────────────
  const addGoal = async (g) => {
    await supabase.from('goals').insert({ user_id: user.id, ...g })
    await refresh()
  }
  const deleteGoal = async (id) => {
    await supabase.from('goals').delete().eq('id', id)
    await refresh()
  }
  const moveGoal = async (goal, amount, direction) => {
    amount = Number(amount)
    if (direction === 'deposit') {
      await spendCash(amount) // money leaves your balance into the box
      await supabase.from('goals')
        .update({ current_amount: Number(goal.current_amount) + amount }).eq('id', goal.id)
    } else {
      await setBalance(Number(profile.balance) + amount) // money returns to balance
      await supabase.from('goals')
        .update({ current_amount: Math.max(0, Number(goal.current_amount) - amount) }).eq('id', goal.id)
    }
    await refresh()
  }

  // ── derived ──────────────────────────────────────────────────────────
  const obligations = monthlyObligations(fixedBills, installments)
  const openInvoiceBalance = invoiceBalance(invoice)

  const value = {
    loading, profile, invoice, allInvoices, movements, fixedBills, billPayments,
    installments, goals, snapshots, thisMonth, obligations, openInvoiceBalance,
    refresh, updateProfile, addMovement, payInvoice, finalizeInvoice, rollInvoice,
    addFixedBill, toggleFixedBill, deleteFixedBill, payFixedBill,
    addInstallment, deleteInstallment, payInstallment,
    addGoal, deleteGoal, moveGoal,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => useContext(FinanceContext)
