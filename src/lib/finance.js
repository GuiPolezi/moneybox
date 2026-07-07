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
  // salário só entra como base quando o saldo está zerado (o salário É o saldo
  // de partida); havendo saldo, projeta-se a partir dele, sem somar os dois.
  const base = Number(balance) === 0 ? Number(salary) : Number(balance)
  return base - Number(openInvoiceBalance) - Number(obligations)
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