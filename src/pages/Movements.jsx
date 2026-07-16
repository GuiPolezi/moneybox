import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Button, Card, Field, Input, Money, Pill, Select, PageHead, EmptyState } from '../components/ui/primitives'
import { IconSwap } from '../components/ui/icons'
import { sanitizeAmountInput, parseAmount } from '../lib/finance'

const CATS = ['Mercado', 'Transporte', 'Lazer', 'Saúde', 'Casa', 'Compra', 'Outros']

export default function Movements() {
  const { movements, addMovement } = useFinance()
  const [kind, setKind] = useState('expense')
  const [method, setMethod] = useState('cash')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Mercado')
  const [description, setDescription] = useState('')
  const [note, setNote] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const value = parseAmount(amount)
    if (!value || isNaN(value) || value <= 0) return
    setBusy(true); setNote(null)
    const { spilled } = await addMovement({
      kind, method: kind === 'income' ? 'cash' : method, amount: value, category, description,
    })
    setBusy(false)
    setAmount(''); setDescription('')
    if (spilled > 0) {
      setNote(`Sem saldo suficiente: ${spilled.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foram lançados na fatura do cartão.`)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHead eyebrow="Movimentações" title="Lançar entrada ou saída" />

      <div className="grid lg:grid-cols-[380px_1fr] gap-4 lg:gap-6 items-start">
        {/* ── Formulário ────────────────────────────────────────────── */}
        <Card className="p-5 sm:p-6">
          <form onSubmit={submit} className="space-y-5">
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: 'expense', label: 'Despesa', tone: 'neg' },
                { value: 'income',  label: 'Receita', tone: 'pos' },
              ]}
            />

            <Field label="Valor">
              <Input
                type="text" inputMode="decimal" value={amount}
                onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                placeholder="0,00"
                className="figure text-2xl py-3 font-semibold tracking-tight"
              />
            </Field>

            {kind === 'expense' && (
              <Field
                label="Forma de pagamento"
                hint="No crédito, o valor entra na fatura do mês. No dinheiro, sai do saldo (e o que faltar vai pra fatura)."
              >
                <Segmented
                  value={method}
                  onChange={setMethod}
                  options={[
                    { value: 'cash',   label: 'Dinheiro' },
                    { value: 'credit', label: 'Crédito' },
                  ]}
                />
              </Field>
            )}

            <Field label="Categoria">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>

            <Field label="Descrição (opcional)">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex.: feira da semana" />
            </Field>

            {note && (
              <p className="text-sm text-warn bg-warn/5 border border-warn/25 rounded-xl p-3 leading-relaxed">
                {note}
              </p>
            )}

            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy ? 'Lançando…' : 'Lançar movimentação'}
            </Button>
          </form>
        </Card>

        {/* ── Extrato ───────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 rule flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-fg tracking-tight">Extrato</h3>
              <p className="text-xs text-subtle mt-0.5">últimos lançamentos</p>
            </div>
            {movements.length > 0 && (
              <span className="figure text-xs text-subtle">{movements.length}</span>
            )}
          </div>

          {movements.length === 0 ? (
            <EmptyState
              icon={<IconSwap />}
              title="Nenhuma movimentação ainda"
              text="Lance sua primeira entrada ou saída no formulário ao lado."
            />
          ) : (
            <ul>
              {movements.map((m) => {
                const income = m.kind === 'income'
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 px-5 py-3.5 rule last:border-0
                               hover:bg-fg/[.02] transition-colors"
                  >
                    <span
                      className={`shrink-0 w-9 h-9 rounded-xl grid place-items-center
                                  ${income ? 'bg-pos/10 text-pos' : 'bg-neg/10 text-neg'}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {income
                          ? <><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>
                          : <><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>}
                      </svg>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-fg truncate">{m.description || m.category}</span>
                        {!income && (
                          <Pill tone={m.method === 'credit' ? 'warn' : 'neutral'} className="shrink-0">
                            {m.method === 'credit' ? 'crédito' : 'dinheiro'}
                          </Pill>
                        )}
                      </div>
                      <p className="text-[11px] text-subtle mt-0.5">
                        {m.category} · {new Date(m.occurred_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <Money
                      value={income ? m.amount : -m.amount}
                      signed
                      className="text-sm shrink-0"
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ── Controle segmentado — pílula deslizante sobre vidro ───────────────── */
function Segmented({ value, onChange, options }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  const tone = options[idx]?.tone
  const bg = {
    neg: 'from-neg to-neg',
    pos: 'from-pos to-pos',
  }[tone] || 'from-brand2 to-brand'

  return (
    <div
      className="relative grid rounded-xl p-1 bg-fg/[.05] border border-line2"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {/* pílula */}
      <span
        className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-br ${bg}
                    transition-transform duration-300 ease-out shadow-glow`}
        style={{
          width: `calc((100% - .5rem) / ${options.length})`,
          transform: `translateX(calc(${idx} * 100%))`,
          left: '.25rem',
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`relative z-10 py-2 text-sm font-medium rounded-lg transition-colors
                      ${value === o.value ? 'text-onbrand' : 'text-muted hover:text-fg'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
