import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Modal } from '../components/Ornament'
import {
  Button, Card, Field, Input, Money, Select, PageHead, EmptyState, Pill,
} from '../components/ui/primitives'
import { IconPlus, IconTarget } from '../components/ui/icons'
import { BRL, GOAL_COLORS, GOAL_GRADIENTS, sanitizeAmountInput, parseAmount } from '../lib/finance'

export default function Goals() {
  const { goals, profile, addGoal, deleteGoal, moveGoal } = useFinance()
  const [creating, setCreating] = useState(false)
  const [active, setActive] = useState(null) // meta sendo movimentada

  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0)

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <PageHead eyebrow="Metas" title="Suas caixinhas">
          guardado em metas <Money value={totalSaved} className="ml-1 text-fg" colored={false} />
        </PageHead>
        <Button onClick={() => setCreating(true)}>
          <IconPlus size={15} /> Nova meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconTarget />}
            title="Crie sua primeira caixinha"
            text="Separe dinheiro do seu saldo para um objetivo — viagem, reserva, um presente. O valor sai do saldo e fica guardado aqui."
            action={<Button onClick={() => setCreating(true)}><IconPlus size={15} /> Nova meta</Button>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const current = Number(g.current_amount)
            const target = Number(g.target_amount)
            const pct = Math.min(100, (current / Math.max(1, target)) * 100)
            const hex = GOAL_COLORS[g.color] || GOAL_COLORS.currency
            const grad = GOAL_GRADIENTS[g.color] || GOAL_GRADIENTS.currency
            const done = pct >= 100

            return (
              <Card key={g.id} className="p-5 relative overflow-hidden group" hover>
                {/* halo na cor da meta */}
                <div
                  className="absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-20 blur-2xl
                             transition-opacity duration-300 group-hover:opacity-35"
                  style={{ background: hex }}
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: grad }} />
                        <p className="font-display text-lg font-semibold text-fg truncate">{g.name}</p>
                      </div>
                      {g.deadline && (
                        <p className="text-[11px] text-subtle mt-1 ml-[18px]">
                          até {new Date(g.deadline).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      aria-label={`Excluir meta ${g.name}`}
                      className="shrink-0 w-7 h-7 rounded-lg grid place-items-center text-subtle
                                 hover:text-neg hover:bg-neg/10 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1.5 flex-wrap">
                    <Money value={current} colored={false} className="text-2xl text-fg tracking-tight" />
                    <span className="text-sm text-subtle figure">/ {BRL(target)}</span>
                  </div>

                  <div className="mt-3 h-2 rounded-full overflow-hidden bg-fg/[.08]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${pct}%`, background: grad }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px] text-subtle figure">{pct.toFixed(0)}% concluído</p>
                    {done && <Pill tone="pos">✓ alcançada</Pill>}
                  </div>

                  <div className="flex gap-2 mt-5">
                    <Button variant="ghost" size="sm" className="flex-1"
                      onClick={() => setActive({ goal: g, dir: 'withdraw' })}>
                      Resgatar
                    </Button>
                    <Button size="sm" className="flex-1"
                      onClick={() => setActive({ goal: g, dir: 'deposit' })}>
                      Guardar
                    </Button>
                  </div>
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

/* As CHAVES abaixo já estão gravadas no banco — mudam só os rótulos e as cores. */
const COLOR_OPTIONS = [
  { value: 'currency', label: 'Aqua' },
  { value: 'brass',    label: 'Lima' },
  { value: 'oxblood',  label: 'Coral' },
  { value: 'sage',     label: 'Céu' },
  { value: 'ink',      label: 'Violeta' },
]

function CreateModal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [color, setColor] = useState('currency')
  const [deadline, setDeadline] = useState('')

  const save = async () => {
    if (!name || !target) return
    await onSave({ name, target_amount: parseAmount(target), color, deadline: deadline || null })
    setName(''); setTarget(''); setColor('currency'); setDeadline(''); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova meta" subtitle="Separe um valor do saldo para um objetivo">
      <div className="space-y-4">
        <Field label="Nome da meta">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Viagem" />
        </Field>
        <Field label="Valor alvo">
          <Input type="text" inputMode="decimal" value={target}
            onChange={(e) => setTarget(sanitizeAmountInput(e.target.value))}
            className="figure text-lg" placeholder="0,00" />
        </Field>

        <Field label="Cor">
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.label}
                title={c.label}
                className={`w-9 h-9 rounded-xl transition-all duration-200 border-2
                            ${color === c.value
                              ? 'border-fg/30 scale-110 shadow-lift'
                              : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'}`}
                style={{ background: GOAL_GRADIENTS[c.value] }}
              />
            ))}
          </div>
        </Field>

        <Field label="Prazo (opcional)">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>

        <Button onClick={save} size="lg" className="w-full">Criar caixinha</Button>
      </div>
    </Modal>
  )
}

function FundModal({ state, balance, onClose, onConfirm }) {
  const [amount, setAmount] = useState('')
  if (!state) return null
  const deposit = state.dir === 'deposit'

  return (
    <Modal
      open
      onClose={onClose}
      title={deposit ? `Guardar em ${state.goal.name}` : `Resgatar de ${state.goal.name}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted leading-relaxed">
          {deposit ? (
            <>O valor sai do seu saldo (<Money value={balance} className="text-sm" />) e vai para a caixinha.</>
          ) : (
            <>O valor volta da caixinha para o seu saldo.</>
          )}
        </p>
        <Field label="Valor">
          <Input type="text" inputMode="decimal" value={amount}
            onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
            className="figure text-2xl py-3 font-semibold" placeholder="0,00" autoFocus />
        </Field>
        <Button
          onClick={() => { const v = parseAmount(amount); if (v > 0) onConfirm(v) }}
          size="lg"
          variant={deposit ? 'solid' : 'ghost'}
          className="w-full"
        >
          {deposit ? 'Guardar' : 'Resgatar'}
        </Button>
      </div>
    </Modal>
  )
}
