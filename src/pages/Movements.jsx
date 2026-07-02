import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Button, Card, Field, Input, Money, Pill, Select } from '../components/ui/primitives'

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
    if (!amount || Number(amount) <= 0) return
    setBusy(true); setNote(null)
    const { spilled } = await addMovement({
      kind, method: kind === 'income' ? 'cash' : method, amount, category, description,
    })
    setBusy(false)
    setAmount(''); setDescription('')
    if (spilled > 0) {
      setNote(`Sem saldo suficiente: ${spilled.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foram lançados na fatura do cartão.`)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Movimentações</p>
        <h1 className="font-display text-3xl text-ink">Lançar entrada ou saída</h1>
      </header>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* form */}
        <Card className="p-5 h-fit">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Toggle active={kind === 'expense'} onClick={() => setKind('expense')} tone="oxblood">Despesa</Toggle>
              <Toggle active={kind === 'income'} onClick={() => setKind('income')} tone="currency">Receita</Toggle>
            </div>

            <Field label="Valor">
              <Input type="number" step="0.01" min="0" inputMode="decimal"
                value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="figure" />
            </Field>

            {kind === 'expense' && (
              <Field label="Forma" hint="No crédito, o valor entra na fatura do mês. No dinheiro, sai do saldo (e o que faltar vai pra fatura).">
                <div className="grid grid-cols-2 gap-2">
                  <Toggle active={method === 'cash'} onClick={() => setMethod('cash')}>Dinheiro</Toggle>
                  <Toggle active={method === 'credit'} onClick={() => setMethod('credit')}>Crédito</Toggle>
                </div>
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

            {note && <p className="text-sm text-oxblood bg-oxblood/5 border border-oxblood/20 rounded-sm p-2">{note}</p>}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Lançando…' : 'Lançar movimentação'}
            </Button>
          </form>
        </Card>

        {/* history */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 rule">
            <h3 className="font-display text-lg text-ink">Extrato</h3>
            <p className="text-xs text-ink/50">últimos lançamentos</p>
          </div>
          {movements.length === 0 ? (
            <p className="p-6 text-sm text-ink/50">Nenhuma movimentação ainda.</p>
          ) : (
            <ul>
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 rule last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-ink truncate min-w-0">{m.description || m.category}</span>
                      <span className="shrink-0">
                        <Pill tone={m.method === 'credit' ? 'brass' : 'sage'}>
                          {m.method === 'credit' ? 'crédito' : 'dinheiro'}
                        </Pill>
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/45">
                      {m.category} · {new Date(m.occurred_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Money
                    value={m.kind === 'income' ? m.amount : -m.amount}
                    signed
                    className="text-sm shrink-0"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function Toggle({ active, onClick, children, tone = 'currency' }) {
  const on = {
    currency: 'bg-currency text-paper2 border-currency',
    oxblood: 'bg-oxblood text-paper2 border-oxblood',
  }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded-sm border transition-colors ${
        active ? on : 'bg-paper2 text-ink/70 border-line hover:border-ink/40'
      }`}
    >
      {children}
    </button>
  )
}