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
  return Number(balance) + Number(salary) - Number(openInvoiceBalance) - Number(obligations)
}

// Build a 6-month forward projection series for the dashboard chart.
export function projectionSeries({
  startMonth,
  balance,
  salary,
  openInvoiceBalance,
  interestRate,
  obligations,
  months = 6,
}) {
  const out = []
  let running = Number(balance)
  let invoice = Number(openInvoiceBalance)

  for (let m = 1; m <= months; m++) {
    // payday: salary in, invoice paid (interest applied if it had to roll)
    running += Number(salary) - invoice - Number(obligations)
    // any negative cash this month means living on credit → next invoice grows,
    // and unpaid debt accrues interest.
    const shortfall = running < 0 ? Math.abs(running) : 0
    invoice = shortfall > 0 ? shortfall * (1 + Number(interestRate)) : 0

    out.push({
      label: monthLabel(addMonths(startMonth, m)),
      projected: Math.round(running * 100) / 100,
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
