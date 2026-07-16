import { useMemo, useState, useEffect } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  AreaChart, Area, CartesianGrid, ReferenceLine, LabelList,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { useTheme } from '../context/ThemeContext'
import { Card, Money, Pill, Progress, EmptyState } from '../components/ui/primitives'
import { Bubbles, Glow } from '../components/Ornament'
import { IconWallet, IconTrend, IconCard, IconRepeat, IconCalendar, IconSparkle } from '../components/ui/icons'
import {
  BRL, monthLabel, firstOfThisMonth, projectNextBalance,
  projectMoneyThisMonth, daysUntilPayday, openObligationsThisMonth,
} from '../lib/finance'

/* Recharts precisa de cores concretas (não var()), então cada tema traz a sua. */
const CHART = {
  light: {
    grid: '#D4E8F0', axis: '#486A7C',
    pos: '#06A5C8', neg: '#E11D48', accent: '#84CC16',
    cats: ['#06A5C8', '#38BDF8', '#84CC16', '#22D3EE', '#8B5CF6', '#F59E0B', '#F43F5E'],
  },
  dark: {
    grid: '#203A48', axis: '#94B4C4',
    pos: '#22D3EE', neg: '#FB7185', accent: '#A3E635',
    cats: ['#22D3EE', '#38BDF8', '#A3E635', '#67E8F9', '#A78BFA', '#FBBF24', '#FB7185'],
  },
}

const compact = (n) => 'R$' + Math.round(n).toLocaleString('pt-BR')

function useIsNarrow(bp = 640) {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' ? window.innerWidth < bp : false
  )
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < bp)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [bp])
  return narrow
}

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Dashboard() {
  const {
    profile, openInvoiceBalance, obligations, snapshots, movements,
    fixedBills, billPayments, installments, thisMonth,
  } = useFinance()

  const { theme } = useTheme()
  const C = CHART[theme] ?? CHART.light
  const narrow = useIsNarrow()

  const balance = Number(profile?.balance ?? 0)
  const salary = Number(profile?.salary ?? 0)

  const balanceSeries = useMemo(
    () => snapshots.map((s) => ({
      label: monthLabel(s.reference_month),
      saldo: Number(s.balance_end),
    })),
    [snapshots]
  )

  const salarySeries = useMemo(() => {
    let acc = 0
    return snapshots.map((s) => {
      acc += Number(s.salary)
      return { label: monthLabel(s.reference_month), acumulado: acc, mes: Number(s.salary) }
    })
  }, [snapshots])

  const nextBalance = projectNextBalance({
    balance, salary, openInvoiceBalance, obligations: obligations.total,
  })

  const openObl = openObligationsThisMonth({ fixedBills, billPayments, installments, thisMonth })

  const moneyThisMonth = projectMoneyThisMonth({
    balance, openInvoiceBalance, obligations: openObl.total,
  })

  const paidObligations = Math.max(0, obligations.total - openObl.total)
  const paidPct = obligations.total > 0
    ? Math.round((paidObligations / obligations.total) * 100)
    : 0

  const salaryDay = profile?.salary_day ?? 5
  const daysToPay = daysUntilPayday(salaryDay)

  const categorySeries = useMemo(() => {
    const now = new Date()
    const map = {}
    movements.forEach((m) => {
      if (m.kind !== 'expense' || m.category === 'Fatura') return
      const d = new Date(m.occurred_at)
      if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return
      const key = m.category || 'Outros'
      map[key] = (map[key] || 0) + Number(m.amount)
    })
    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [movements])
  const categoryTotal = categorySeries.reduce((s, c) => s + c.total, 0)

  const healthy = moneyThisMonth >= 0

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Saudação ──────────────────────────────────────────────────── */}
      <header className="animate-rise">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand mb-1.5">
          {monthLabel(firstOfThisMonth())}
        </p>
        <h1 className="font-display text-3xl sm:text-[2.5rem] font-semibold leading-tight tracking-tight text-fg">
          {greeting()}, <span className="gradient-text">{profile?.display_name || 'por aqui'}</span>.
        </h1>
      </header>

      {/* ── HERÓI: o número que importa ───────────────────────────────── */}
      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-4 animate-rise">
        {/* Dinheiro do mês */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-lift
                        bg-gradient-to-br from-brand2 via-brand to-sky">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10" />
          <Bubbles count={6} />
          <div className="relative">
            <div className="flex items-center gap-2 text-onbrand/80">
              <IconSparkle size={16} />
              <span className="text-xs font-medium uppercase tracking-[0.18em]">Dinheiro do mês</span>
            </div>

            <Money
              value={moneyThisMonth}
              colored={false}
              className="block text-4xl sm:text-6xl mt-3 text-onbrand break-words tracking-tight"
            />

            <p className="text-onbrand/80 text-sm mt-2 max-w-md leading-relaxed">
              O que sobra hoje depois da fatura e dos compromissos em aberto.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1
                               rounded-full bg-white/20 text-onbrand backdrop-blur-sm border border-white/25">
                <IconCalendar size={12} />
                {daysToPay === 0
                  ? `salário cai hoje · dia ${salaryDay}`
                  : `${daysToPay} dia${daysToPay > 1 ? 's' : ''} até o salário · dia ${salaryDay}`}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1
                               rounded-full bg-white/20 text-onbrand backdrop-blur-sm border border-white/25">
                {healthy ? '✓ no azul' : '⚠ no vermelho'}
              </span>
            </div>
          </div>
        </div>

        {/* Projeção + progresso dos compromissos */}
        <div className="grid gap-4">
          <Card className="p-5 relative overflow-hidden" hover>
            <Glow className="-right-10 -top-16" size={200} opacity={0.25} />
            <div className="relative">
              <div className="flex items-center gap-2 text-muted">
                <IconTrend size={15} />
                <span className="text-[11px] font-medium uppercase tracking-[0.15em]">
                  Projeção próximo mês
                </span>
              </div>
              <Money value={nextBalance} className="block text-2xl sm:text-3xl mt-2" />
              <p className="text-[11px] text-subtle mt-1.5">
                saldo + salário − fatura − compromissos
              </p>
            </div>
          </Card>

          <Card className="p-5" hover>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-muted">
                <IconRepeat size={15} />
                <span className="text-[11px] font-medium uppercase tracking-[0.15em]">
                  Compromissos pagos
                </span>
              </div>
              <span className="figure text-sm font-semibold text-brand">{paidPct}%</span>
            </div>
            <Progress value={paidPct} />
            <div className="flex items-center justify-between mt-3 text-[11px] text-subtle">
              <span>Pago <Money value={paidObligations} className="text-[11px] text-muted" colored={false} /></span>
              <span>Aberto <Money value={openObl.total} className="text-[11px] text-muted" colored={false} /></span>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Indicadores ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Saldo atual"    value={balance}            Icon={IconWallet} tone={balance < 0 ? 'neg' : 'brand'} />
        <Stat label="Salário"        value={salary}             Icon={IconTrend}  tone="accent" hint="fixo por mês" />
        <Stat label="Fatura atual"   value={openInvoiceBalance} Icon={IconCard}   tone="warn"  hint="cartão · em aberto" />
        <Stat label="Compromissos"   value={obligations.total}  Icon={IconRepeat} tone="neg"   hint={`${paidPct}% pago no mês`} />
      </section>

      {/* ── Gráficos ──────────────────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 sm:p-6" hover>
          <ChartHead title="Saldo entre os meses" note="positivo ou negativo a cada mês" />
          {balanceSeries.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={balanceSeries} margin={{ left: -10, top: 6 }}>
                <defs>
                  <linearGradient id="barPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.pos} stopOpacity={1} />
                    <stop offset="100%" stopColor={C.pos} stopOpacity={0.45} />
                  </linearGradient>
                  <linearGradient id="barNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.neg} stopOpacity={1} />
                    <stop offset="100%" stopColor={C.neg} stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: C.axis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: C.axis }} axisLine={false} tickLine={false} tickFormatter={compact} width={66} />
                <Tooltip content={<AeroTooltip />} cursor={{ fill: `${C.pos}12` }} />
                <ReferenceLine y={0} stroke={C.axis} strokeOpacity={0.4} />
                <Bar dataKey="saldo" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={800}>
                  {balanceSeries.map((d, i) => (
                    <Cell key={i} fill={d.saldo < 0 ? 'url(#barNeg)' : 'url(#barPos)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </Card>

        <Card className="p-5 sm:p-6" hover>
          <ChartHead title="Salário acumulado" note="somado mês a mês ao longo do ano" />
          {salarySeries.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={salarySeries} margin={{ left: -10, top: 6 }}>
                <defs>
                  <linearGradient id="areaAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.accent} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: C.axis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: C.axis }} axisLine={false} tickLine={false} tickFormatter={compact} width={66} />
                <Tooltip content={<AeroTooltip />} />
                <Area
                  type="monotone" dataKey="acumulado"
                  stroke={C.accent} strokeWidth={2.5} fill="url(#areaAcc)"
                  dot={{ r: 3, fill: C.accent, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgba(255,255,255,.6)' }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </Card>

        {/* Gastos por categoria */}
        <Card className="p-5 sm:p-6 lg:col-span-2 flex flex-col" hover>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <ChartHead
              title="Gastos por categoria"
              note={`${monthLabel(firstOfThisMonth())} · para onde o dinheiro foi (fora pagamento de fatura)`}
              className="mb-0"
            />
            {categorySeries.length > 0 && (
              <div className="rounded-2xl px-4 py-2.5 bg-brand/[.07] border border-brand/15
                              flex flex-col items-start sm:items-end sm:min-w-[150px]">
                <span className="text-[10px] uppercase tracking-[0.15em] text-subtle">Total no mês</span>
                <Money value={categoryTotal} className="text-xl mt-0.5 text-fg" colored={false} />
              </div>
            )}
          </div>

          {categorySeries.length ? (
            <div className="flex-1 w-full">
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, categorySeries.length * (narrow ? 46 : 54))}
              >
                <BarChart
                  data={categorySeries}
                  layout="vertical"
                  margin={{ left: 0, right: narrow ? 56 : 88, top: 0, bottom: 0 }}
                >
                  <defs>
                    {C.cats.map((c, i) => (
                      <linearGradient key={i} id={`catG${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={c} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={c} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontFamily: 'Inter', fontSize: narrow ? 11 : 12.5, fill: C.axis, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={narrow ? 78 : 104}
                  />
                  <Tooltip content={<AeroTooltip />} cursor={{ fill: `${C.pos}0F` }} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={narrow ? 22 : 28} animationDuration={900}>
                    {categorySeries.map((d, i) => (
                      <Cell key={i} fill={`url(#catG${i % C.cats.length})`} />
                    ))}
                    <LabelList
                      dataKey="total"
                      position="right"
                      offset={narrow ? 8 : 12}
                      formatter={(v) => BRL(v)}
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: narrow ? 10 : 12,
                        fill: C.axis,
                        fontWeight: 500,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty text="Nenhum gasto lançado este mês ainda. Registre despesas em “Movimentações” para ver a distribuição por categoria." />
          )}
        </Card>
      </section>
    </div>
  )
}

/* ── Indicador ─────────────────────────────────────────────────────────── */
function Stat({ label, value, Icon, tone = 'brand', hint }) {
  const tones = {
    brand:  'text-brand bg-brand/10',
    accent: 'text-accent bg-accent/12',
    neg:    'text-neg bg-neg/10',
    warn:   'text-warn bg-warn/12',
  }
  return (
    <Card className="p-4 sm:p-5" hover>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle leading-tight">
          {label}
        </p>
        {Icon && (
          <span className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center ${tones[tone]}`}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <Money value={value} className="block text-lg sm:text-2xl mt-2 tracking-tight" />
      {hint && <p className="text-[10px] sm:text-[11px] text-subtle mt-1">{hint}</p>}
    </Card>
  )
}

function ChartHead({ title, note, className = 'mb-5' }) {
  return (
    <div className={className}>
      <h3 className="font-display text-base sm:text-lg font-semibold text-fg tracking-tight">{title}</h3>
      <p className="text-xs text-subtle mt-0.5 max-w-md leading-relaxed">{note}</p>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <EmptyState
        text={text || 'Sem registros ainda. Faça uma movimentação ou ajuste seu saldo para começar a desenhar o gráfico.'}
      />
    </div>
  )
}

/* Tooltip de vidro, compartilhado por todos os gráficos. */
function AeroTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const title = p.payload?.category ?? label
  return (
    <div className="glass rounded-xl py-2.5 px-3.5 shadow-lift">
      <p className="text-[10px] uppercase tracking-[0.12em] text-subtle mb-0.5">{title}</p>
      <Money value={p.value} className="text-sm text-fg" colored={false} />
    </div>
  )
}
