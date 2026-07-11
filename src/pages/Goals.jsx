import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Modal } from '../components/Ornament'
import { Button, Card, Field, Input, Money, Select } from '../components/ui/primitives'
import { BRL, GOAL_COLORS, sanitizeAmountInput, parseAmount } from '../lib/finance'

export default function Goals() {
  const { goals, profile, addGoal, deleteGoal, moveGoal } = useFinance()
  const [creating, setCreating] = useState(false)
  const [active, setActive] = useState(null) // goal being funded

  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0)

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Metas</p>
          <h1 className="font-display text-3xl text-ink">Suas caixinhas</h1>
          <p className="text-sm text-ink/60 mt-1">guardado em metas <Money value={totalSaved} className="ml-1" /></p>
        </div>
        <Button onClick={() => setCreating(true)}>+ Nova meta</Button>
      </header>

      {goals.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-display text-xl text-ink">Crie sua primeira caixinha</p>
          <p className="text-sm text-ink/55 mt-1 max-w-sm mx-auto">
            Separe dinheiro do seu saldo para um objetivo — viagem, reserva, um presente.
            O valor sai do saldo e fica guardado aqui.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100)
            const hex = GOAL_COLORS[g.color] || GOAL_COLORS.currency
            return (
              <Card key={g.id} className="p-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: hex }} />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg text-ink">{g.name}</p>
                    {g.deadline && <p className="text-[11px] text-ink/45">até {new Date(g.deadline).toLocaleDateString('pt-BR')}</p>}
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="text-xs text-ink/40 hover:text-oxblood">×</button>
                </div>

                <div className="mt-4">
                  <Money value={g.current_amount} className="text-2xl" />
                  <span className="text-sm text-ink/50 figure"> / {BRL(g.target_amount)}</span>
                </div>

                <div className="mt-3 h-2 bg-line rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hex }} />
                </div>
                <p className="text-[11px] text-ink/45 mt-1 figure">{pct.toFixed(0)}% concluído</p>

                <div className="flex gap-2 mt-4">
                  <Button variant="ghost" className="!px-3 !py-1 text-xs flex-1" onClick={() => setActive({ goal: g, dir: 'withdraw' })}>Resgatar</Button>
                  <Button className="!px-3 !py-1 text-xs flex-1" onClick={() => setActive({ goal: g, dir: 'deposit' })}>Guardar</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <CreateModal open={creating} onClose={() => setCreating(false)} onSave={addGoal} />
      <FundModal
        state={active}
        balance={profile?.balance ?? 0}
        onClose={() => setActive(null)}
        onConfirm={async (amount) => { await moveGoal(active.goal, amount, active.dir); setActive(null) }}
      />
    </div>
  )
}

function CreateModal({ open, onClose, onSave }) {
  const [name, setName] = useState(''); const [target, setTarget] = useState('')
  const [color, setColor] = useState('currency'); const [deadline, setDeadline] = useState('')
  const save = async () => {
    if (!name || !target) return
    await onSave({ name, target_amount: parseAmount(target), color, deadline: deadline || null })
    setName(''); setTarget(''); setColor('currency'); setDeadline(''); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Nova meta">
      <div className="space-y-4">
        <Field label="Nome da meta"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Viagem" /></Field>
        <Field label="Valor alvo"><Input type="text" inputMode="decimal" value={target} onChange={(e) => setTarget(sanitizeAmountInput(e.target.value))} className="figure" placeholder="0,00" /></Field>
        <Field label="Cor">
          <Select value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="currency">Verde cédula</option>
            <option value="brass">Dourado</option>
            <option value="oxblood">Vinho</option>
            <option value="sage">Sálvia</option>
            <option value="ink">Tinta</option>
          </Select>
        </Field>
        <Field label="Prazo (opcional)"><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
        <Button onClick={save} className="w-full">Criar caixinha</Button>
      </div>
    </Modal>
  )
}

function FundModal({ state, balance, onClose, onConfirm }) {
  const [amount, setAmount] = useState('')
  if (!state) return null
  const deposit = state.dir === 'deposit'
  return (
    <Modal open onClose={onClose} title={deposit ? `Guardar em ${state.goal.name}` : `Resgatar de ${state.goal.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-ink/60">
          {deposit
            ? <>O valor sai do seu saldo (<Money value={balance} />) e vai para a caixinha.</>
            : <>O valor volta da caixinha para o seu saldo.</>}
        </p>
        <Field label="Valor">
          <Input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))} className="figure" placeholder="0,00" autoFocus />
        </Field>
        <Button onClick={() => { const v = parseAmount(amount); if (v > 0) onConfirm(v) }} className="w-full">
          {deposit ? 'Guardar' : 'Resgatar'}
        </Button>
      </div>
    </Modal>
  )
}