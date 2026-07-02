import { useMemo, useState, useEffect } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  AreaChart, Area, CartesianGrid, ReferenceLine, LabelList,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { Card, Money, Pill } from '../components/ui/primitives'
import { Guilloche } from '../components/Ornament'
import {
  BRL, monthLabel, firstOfThisMonth, projectNextBalance,
} from '../lib/finance'

const axis = { fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#1C262099' }
const compact = (n) => 'R$' + Math.round(n / 1).toLocaleString('pt-BR')
const CAT_COLORS = ['#234A3C', '#B0894A', '#7E3030', '#6E7558', '#2F6450', '#C9A24B']

// ajusta parâmetros do gráfico conforme a largura da tela
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

export default function Dashboard() {
  const {
    profile, openInvoiceBalance, obligations, snapshots, movements,
  } = useFinance()

  const narrow = useIsNarrow()

  const balance = Number(profile?.balance ?? 0)
  const salary = Number(profile?.salary ?? 0)

  // saldo entre os meses (+ / −)
  const balanceSeries = useMemo(
    () => snapshots.map((s) => ({
      label: monthLabel(s.reference_month),
      saldo: Number(s.balance_end),
    })),
    [snapshots]
  )

  // salário acumulado entre os meses
  const salarySeries = useMemo(() => {
    let acc = 0
    return snapshots.map((s) => {
      acc += Number(s.salary)
      return { label: monthLabel(s.reference_month), acumulado: acc, mes: Number(s.salary) }
    })
  }, [snapshots])

  // projeção do próximo mês
  const nextBalance = projectNextBalance({
    balance, salary, openInvoiceBalance, obligations: obligations.total,
  })

  // gastos por categoria (mês atual)
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

  return (
    <div className="space-y-8">
      <header className="relative">
        <Guilloche className="absolute -top-6 right-0 w-72 hidden sm:block" opacity={0.12} />
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Painel</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Olá, {profile?.display_name || 'por aqui'}.
        </h1>
        <p className="text-sm text-ink/60 mt-1">{monthLabel(firstOfThisMonth())} · resumo do mês</p>
      </header>

      {/* info cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Saldo atual" value={balance} tone={balance < 0 ? 'oxblood' : 'currency'} />
        <Stat label="Salário (fixo)" value={salary} tone="brass" />
        <Stat label="Fatura atual" value={openInvoiceBalance} tone="oxblood" hint="cartão · em aberto" />
        <Stat
          label="Projeção próx. mês"
          value={nextBalance}
          tone={nextBalance < 0 ? 'oxblood' : 'currency'}
          hint="saldo − fatura − contas"
        />
      </section>

      {/* obligations strip */}
      <Card className="p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-xs uppercase tracking-wider text-ink/50">Compromissos do mês</span>
        <span className="text-sm">Contas fixas <Money value={obligations.fixed} className="ml-1" /></span>
        <span className="text-sm">Parcelas <Money value={obligations.inst} className="ml-1" /></span>
        <span className="text-sm font-medium">Total <Money value={obligations.total} className="ml-1" /></span>
      </Card>

      {/* charts */}
      <section className="grid lg:grid-cols-2 gap-4">
        {/* Gráfico 1: Saldo entre os meses */}
        <Card className="p-5">
          <ChartHead title="Saldo entre os meses" note="positivo ou negativo a cada mês" />
          {balanceSeries.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={balanceSeries} margin={{ left: -8 }}>
                <CartesianGrid stroke="#C8C0A8" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={64} />
                <Tooltip formatter={(v) => BRL(v)} />
                <ReferenceLine y={0} stroke="#1C2620" strokeWidth={1} />
                <Bar dataKey="saldo" radius={[2, 2, 0, 0]}>
                  {balanceSeries.map((d, i) => (
                    <Cell key={i} fill={d.saldo < 0 ? '#7E3030' : '#234A3C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </Card>

        {/* Gráfico 2: Salário acumulado */}
        <Card className="p-5">
          <ChartHead title="Salário acumulado" note="somado mês a mês ao longo do ano" />
          {salarySeries.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salarySeries} margin={{ left: -8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B0894A" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#B0894A" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#C8C0A8" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={64} />
                <Tooltip formatter={(v) => BRL(v)} />
                <Area type="monotone" dataKey="acumulado" stroke="#B0894A" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </Card>

        {/* Gráfico 3: Gastos por categoria (Design Moderno & Responsivo) */}
        <Card className="p-5 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <ChartHead
              title="Gastos por categoria"
              note={`${monthLabel(firstOfThisMonth())} · para onde o dinheiro foi (fora pagamento de fatura)`}
              className="mb-0"
            />
            {categorySeries.length > 0 && (
              <div className="bg-ink/[0.03] border border-ink/5 rounded-xl px-4 py-2 flex flex-col items-end sm:min-w-[140px]">
                <span className="text-[10px] uppercase tracking-wider text-ink/50">Total no mês</span>
                <Money value={categoryTotal} className="text-xl font-medium text-ink mt-0.5" />
              </div>
            )}
          </div>

          {categorySeries.length ? (
            <div className="flex-1 w-full mt-2">
              <ResponsiveContainer width="100%" height={Math.max(200, categorySeries.length * (narrow ? 46 : 52))}>
                <BarChart data={categorySeries} layout="vertical" margin={{ left: 0, right: narrow ? 52 : 80, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    tick={{ fontFamily: 'IBM Plex Mono', fontSize: narrow ? 11 : 12, fill: '#1C2620', fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                    width={narrow ? 76 : 100} 
                  />
                  <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'rgba(35,74,60,0.04)' }} />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={narrow ? 22 : 28} animationDuration={1000}>
                    {categorySeries.map((d, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} opacity={0.9} />
                    ))}
                    <LabelList
                      dataKey="total" 
                      position="right"
                      offset={narrow ? 8 : 12}
                      formatter={(v) => BRL(v)}
                      style={{ fontFamily: 'IBM Plex Mono', fontSize: narrow ? 10 : 12, fill: '#1C262099', fontWeight: 500 }}
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

function Stat({ label, value, tone = 'currency', hint }) {
  const ring = {
    currency: 'before:bg-currency', brass: 'before:bg-brass', oxblood: 'before:bg-oxblood',
  }[tone]
  return (
    <Card className={`p-4 relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${ring}`}>
      <p className="text-[11px] uppercase tracking-wider text-ink/55">{label}</p>
      <Money value={value} className="text-lg sm:text-2xl block mt-1" />
      {hint && <p className="text-[11px] text-ink/45 mt-1">{hint}</p>}
    </Card>
  )
}

function ChartHead({ title, note, className = "mb-4" }) {
  return (
    <div className={className}>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="text-xs text-ink/50 max-w-sm">{note}</p>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-center">
      <p className="text-sm text-ink/45 max-w-[16rem]">
        {text || "Sem registros ainda. Faça uma movimentação ou ajuste seu saldo para começar a desenhar o gráfico."}
      </p>
    </div>
  )
}

// Tooltip Personalizado Premium para Gastos de Categoria
function CategoryTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#FAF9F5] border border-[#C8C0A8]/50 shadow-sm rounded-lg py-2 px-3">
        <p className="text-[10px] uppercase tracking-wider text-ink/50 mb-0.5">
          {payload[0].payload.category}
        </p>
        <Money value={payload[0].value} className="text-base font-medium text-ink" />
      </div>
    )
  }
  return null
}