// ──────────────────────────────────────────────────────────────────────────
//  Pure helpers — no Supabase, no React. Easy to read and reason about.
//  These encode the money rules you described.
// ──────────────────────────────────────────────────────────────────────────

export const BRL = (n) =>
  (Number(n) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })

// Parse a value as a LOCAL date. Date-only strings ("2026-07-01") are otherwise
// read as UTC midnight and slip to the previous day in negative-offset zones
// (e.g. UTC−3 / São Paulo), which shows the wrong month. Full timestamps and
// Date objects pass through unchanged.
export const parseDate = (d) => {
  if (d instanceof Date) return d
  if (typeof d === 'string') {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  return new Date(d)
}

export const monthKey = (d) => {
  const x = parseDate(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-01`
}

export const monthLabel = (d) =>
  parseDate(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

export const addMonths = (d, n) => {
  const x = parseDate(d)
  x.setMonth(x.getMonth() + n)
  return x
}

export const firstOfThisMonth = () => {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), 1)
}

// What the open invoice owes right now: this cycle's charges + carried debt − paid
export const invoiceBalance = (inv) =>
  inv ? Number(inv.total_amount) + Number(inv.carried_amount) - Number(inv.paid_amount) : 0

// Sum of monthly obligations (fixed bills + the per-cycle slice of installments)
export const monthlyObligations = (fixedBills, installments) => {
  const fixed = fixedBills
    .filter((b) => b.active)
    .reduce((s, b) => s + Number(b.amount), 0)
  const inst = installments
    .filter((i) => i.paid_count < i.total_count)
    .reduce((s, i) => s + Number(i.installment_amount), 0)
  return { fixed, inst, total: fixed + inst }
}

// ── Projection ────────────────────────────────────────────────────────────
// "Next month's balance, from my current balance, the current invoice and
//  next month's fixed bills."  On payday the open invoice is settled and the
//  salary lands; obligations leave through the month.
export function projectNextBalance({
  balance,
  salary,
  openInvoiceBalance,
  obligations,
}) {
  // o salário entra todo mês, então a projeção do próximo mês soma o salário
  // ao saldo atual e desconta a fatura em aberto e os compromissos do mês.
  return Number(balance) + Number(salary) - Number(openInvoiceBalance) - Number(obligations)
}

// "Dinheiro do mês": o que sobra APENAS do que você já tem hoje, depois de
// quitar a fatura em aberto e pagar os compromissos do mês (sem contar salário).
export function projectMoneyThisMonth({ balance, openInvoiceBalance, obligations }) {
  return Number(balance) - Number(openInvoiceBalance) - Number(obligations)
}

// Dias até o próximo pagamento (dia do salário). Se já passou neste mês,
// conta até o mesmo dia do mês seguinte.
export function daysUntilPayday(day = 5) {
  const now = new Date()
  const today = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const target = Math.min(Math.max(1, Number(day) || 5), daysInMonth)
  if (today <= target) return target - today
  return (daysInMonth - today) + target
}

// Compromissos ainda EM ABERTO neste mês (os que você AINDA NÃO pagou).
// Pagar uma conta já mexeu no saldo (dinheiro) ou na fatura (crédito), então
// ela não pode continuar pesando aqui — senão seria descontada duas vezes.
//   • conta fixa: em aberto se está ativa e não há pagamento registrado no mês.
//   • parcela: em aberto se ainda não quitou E a parcela deste mês não foi paga
//     (comparando quantas já deveriam ter sido pagas até agora com paid_count).
export function openObligationsThisMonth({ fixedBills, billPayments, installments, thisMonth }) {
  const paidFixedIds = new Set(
    (billPayments || [])
      .filter((p) => p.reference_month === thisMonth)
      .map((p) => p.fixed_bill_id)
  )
  const fixed = (fixedBills || [])
    .filter((b) => b.active && !paidFixedIds.has(b.id))
    .reduce((s, b) => s + Number(b.amount), 0)

  const now = parseDate(thisMonth)
  const inst = (installments || []).reduce((s, i) => {
    if (i.paid_count >= i.total_count) return s // quitada
    const start = i.start_date ? parseDate(i.start_date) : null
    let owedThisMonth
    if (!start || isNaN(start.getTime())) {
      owedThisMonth = true // sem data confiável: trata como em aberto
    } else {
      const monthsElapsed =
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
      if (monthsElapsed < 0) return s // ainda não começou
      const expectedByNow = Math.min(i.total_count, monthsElapsed + 1)
      owedThisMonth = i.paid_count < expectedByNow // ainda não pagou a deste mês
    }
    return owedThisMonth ? s + Number(i.installment_amount) : s
  }, 0)

  return { fixed, inst, total: fixed + inst }
}

// Build a 6-month forward projection for the dashboard chart.
//
// It projects your NET POSITION each month: the cash you'd have minus what you
// still owe on the card. Reading it as a single honest number avoids the old
// double-count (where a deficit sat in the balance AND was re-charged as an
// invoice next month).
//
//   net today        = balance − fatura em aberto
//   next month (m=1) = net + salário − compromissos     (current invoice paid on payday, no penalty)
//   later months     = if still negative, the debt rolls with interest first,
//                      then + salário − compromissos
//
// Installments drop out of "compromissos" once they finish; fixed bills stay.
export function projectionSeries({
  startMonth,
  balance,
  salary,
  openInvoiceBalance,
  interestRate,
  fixedTotal,
  installments = [], // [{ amount, remaining }]
  months = 6,
}) {
  const obligationsAt = (m) =>
    Number(fixedTotal) +
    installments.reduce(
      (s, i) => s + (m <= Number(i.remaining) ? Number(i.amount) : 0),
      0
    )

  const out = []
  let net = Number(balance) - Number(openInvoiceBalance) // net position today

  for (let m = 1; m <= months; m++) {
    // from the 2nd month on, any amount still owed (negative net) is debt that
    // accrues interest before the next payday.
    if (m > 1 && net < 0) net = net * (1 + Number(interestRate))
    // payday: salary in, that month's obligations out.
    net = net + Number(salary) - obligationsAt(m)
    out.push({
      label: monthLabel(addMonths(startMonth, m)),
      projected: Math.round(net * 100) / 100,
    })
  }
  return out
}

export const todayDay = () => new Date().getDate()

// colour token → hex for goal "boxes"
export const GOAL_COLORS = {
  currency: '#234A3C',
  brass: '#B0894A',
  oxblood: '#7E3030',
  sage: '#6E7558',
  ink: '#3A4A40',
}