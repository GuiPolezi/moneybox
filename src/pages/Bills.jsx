import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Modal } from '../components/Ornament'
import {
  Button, Card, Field, Input, Money, Pill, Progress, PageHead, EmptyState,
} from '../components/ui/primitives'
import { IconPlus, IconRepeat, IconCalendar } from '../components/ui/icons'
import { sanitizeAmountInput, parseAmount } from '../lib/finance'

export default function Bills() {
  const {
    fixedBills, billPayments, installments, thisMonth,
    addFixedBill, payFixedBill, toggleFixedBill, deleteFixedBill, updateFixedBill,
    addInstallment, payInstallment, deleteInstallment, updateInstallment,
  } = useFinance()

  const [modal, setModal] = useState(null)         // 'fixed' | 'inst' | null  (adicionar)
  const [editFixed, setEditFixed] = useState(null) // conta fixa em edição
  const [editInst, setEditInst] = useState(null)   // parcela em edição

  const paidThisMonth = (id) =>
    billPayments.some((p) => p.fixed_bill_id === id && p.reference_month === thisMonth)

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <PageHead eyebrow="Contas & Parcelas" title="Compromissos recorrentes" />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setModal('fixed')}>
            <IconPlus size={15} /> Conta fixa
          </Button>
          <Button onClick={() => setModal('inst')}>
            <IconPlus size={15} /> Parcela
          </Button>
        </div>
      </div>

      {/* ── Contas fixas ──────────────────────────────────────────────── */}
      <section>
        <SectionTitle title="Contas fixas" note="recorrentes, sem fim — ex.: academia" />
        {fixedBills.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconRepeat />}
              title="Nenhuma conta fixa"
              text="Cadastre despesas que se repetem todo mês para elas entrarem na projeção."
              action={<Button variant="ghost" onClick={() => setModal('fixed')}><IconPlus size={15} /> Conta fixa</Button>}
            />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {fixedBills.map((b) => {
              const paid = paidThisMonth(b.id)
              return (
                <Card key={b.id} className={`p-5 ${!b.active ? 'opacity-50' : ''}`} hover>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-fg font-medium truncate">{b.name}</p>
                      <p className="text-[11px] text-subtle mt-0.5 flex items-center gap-1">
                        <IconCalendar size={11} /> vence dia {b.due_day}
                      </p>
                    </div>
                    <Money value={b.amount} className="text-base shrink-0" colored={false} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {paid ? (
                      <Pill tone="pos">✓ paga este mês</Pill>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => payFixedBill(b, 'cash')}>Dinheiro</Button>
                        <Button variant="accent" size="sm" onClick={() => payFixedBill(b, 'credit')}>Crédito</Button>
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                      <RowLink onClick={() => setEditFixed(b)}>editar</RowLink>
                      <RowLink onClick={() => toggleFixedBill(b.id, !b.active)} tone="muted">
                        {b.active ? 'pausar' : 'ativar'}
                      </RowLink>
                      <RowLink onClick={() => deleteFixedBill(b.id)} tone="neg">excluir</RowLink>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Parcelas ──────────────────────────────────────────────────── */}
      <section>
        <SectionTitle title="Parcelas" note="com prazo definido — avançam até quitar" />
        {installments.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconCalendar />}
              title="Nenhuma parcela"
              text="Cadastre compras parceladas para acompanhar quanto falta para quitar."
              action={<Button onClick={() => setModal('inst')}><IconPlus size={15} /> Parcela</Button>}
            />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {installments.map((i) => {
              const done = i.paid_count >= i.total_count
              const pct = (i.paid_count / i.total_count) * 100
              return (
                <Card key={i.id} className="p-5" hover>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-fg font-medium truncate">{i.name}</p>
                      <p className="text-[11px] text-subtle mt-0.5 figure">
                        {i.paid_count}/{i.total_count} parcelas · vence dia {i.due_day}
                      </p>
                    </div>
                    <Money value={i.installment_amount} className="text-base shrink-0" colored={false} />
                  </div>

                  <div className="mt-4">
                    <Progress
                      value={pct}
                      height="h-1.5"
                      tone={done ? 'linear-gradient(90deg, rgb(var(--c-pos)), rgb(var(--c-accent)))' : undefined}
                    />
                    <p className="text-[10px] text-subtle mt-1.5 figure">{pct.toFixed(0)}% quitado</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {done ? (
                      <Pill tone="pos">✓ quitada</Pill>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => payInstallment(i, 'cash')}>Pagar parcela</Button>
                        <Button variant="accent" size="sm" onClick={() => payInstallment(i, 'credit')}>Crédito</Button>
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                      <RowLink onClick={() => setEditInst(i)}>editar</RowLink>
                      <RowLink onClick={() => deleteInstallment(i.id)} tone="neg">excluir</RowLink>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* adicionar */}
      <FixedBillModal open={modal === 'fixed'} onClose={() => setModal(null)} onSave={addFixedBill} />
      <InstallmentModal open={modal === 'inst'} onClose={() => setModal(null)} onSave={addInstallment} />

      {/* editar (key força o modal a reabrir já preenchido com o item escolhido) */}
      <FixedBillModal
        key={editFixed?.id || 'edit-fixed'}
        open={!!editFixed}
        initial={editFixed}
        onClose={() => setEditFixed(null)}
        onSave={(patch) => updateFixedBill(editFixed.id, patch)}
      />
      <InstallmentModal
        key={editInst?.id || 'edit-inst'}
        open={!!editInst}
        initial={editInst}
        onClose={() => setEditInst(null)}
        onSave={(patch) => updateInstallment(editInst.id, patch)}
      />
    </div>
  )
}

function SectionTitle({ title, note }) {
  return (
    <div className="mb-3.5">
      <h2 className="font-display text-xl font-semibold text-fg tracking-tight">{title}</h2>
      <p className="text-xs text-subtle mt-0.5">{note}</p>
    </div>
  )
}

function RowLink({ onClick, children, tone = 'brand' }) {
  const map = {
    brand: 'text-brand hover:text-brand2',
    muted: 'text-subtle hover:text-fg',
    neg:   'text-subtle hover:text-neg',
  }
  return (
    <button onClick={onClick} className={`text-xs font-medium transition-colors ${map[tone]}`}>
      {children}
    </button>
  )
}

// mostra um número (do banco) no campo com vírgula, como o usuário edita
const toField = (n) => (n === undefined || n === null ? '' : String(n).replace('.', ','))

function FixedBillModal({ open, onClose, onSave, initial }) {
  const editing = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(editing ? toField(initial.amount) : '')
  const [due, setDue] = useState(String(initial?.due_day ?? 10))

  const save = async () => {
    const value = parseAmount(amount)
    if (!name || !value || isNaN(value) || value <= 0) return
    await onSave({ name, amount: value, due_day: Number(due) })
    if (!editing) { setName(''); setAmount(''); setDue('10') }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar conta fixa' : 'Nova conta fixa'}
      subtitle="Uma despesa que se repete todo mês"
    >
      <div className="space-y-4">
        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Academia" />
        </Field>
        <Field label="Valor mensal">
          <Input type="text" inputMode="decimal" value={amount}
            onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
            className="figure text-lg" placeholder="0,00" />
        </Field>
        <Field label="Dia de vencimento">
          <Input type="number" min="1" max="31" value={due} onChange={(e) => setDue(e.target.value)} className="figure" />
        </Field>
        <Button onClick={save} size="lg" className="w-full">
          {editing ? 'Salvar alterações' : 'Salvar conta fixa'}
        </Button>
      </div>
    </Modal>
  )
}

function InstallmentModal({ open, onClose, onSave, initial }) {
  const editing = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(editing ? toField(initial.installment_amount) : '')
  const [count, setCount] = useState(editing ? String(initial.total_count) : '')
  const [paid, setPaid] = useState(editing ? String(initial.paid_count) : '0')
  const [due, setDue] = useState(String(initial?.due_day ?? 10))

  const save = async () => {
    const value = parseAmount(amount)
    const total = Number(count)
    if (!name || !value || isNaN(value) || value <= 0 || !total) return
    const patch = { name, installment_amount: value, total_count: total, due_day: Number(due) }
    if (editing) patch.paid_count = Math.min(Math.max(0, Number(paid) || 0), total)
    await onSave(patch)
    if (!editing) { setName(''); setAmount(''); setCount('') }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar parcela' : 'Nova parcela'}
      subtitle="Uma compra parcelada com prazo para acabar"
    >
      <div className="space-y-4">
        <Field label="Descrição">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Notebook" />
        </Field>
        <Field label="Valor da parcela">
          <Input type="text" inputMode="decimal" value={amount}
            onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
            className="figure text-lg" placeholder="0,00" />
        </Field>
        <Field label="Número de parcelas">
          <Input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} className="figure" placeholder="12" />
        </Field>
        {editing && (
          <Field label="Parcelas já pagas" hint="ajuste caso queira corrigir o progresso">
            <Input type="number" min="0" max={count || undefined} value={paid}
              onChange={(e) => setPaid(e.target.value)} className="figure" />
          </Field>
        )}
        <Field label="Dia de vencimento">
          <Input type="number" min="1" max="31" value={due} onChange={(e) => setDue(e.target.value)} className="figure" />
        </Field>
        <Button onClick={save} size="lg" className="w-full">
          {editing ? 'Salvar alterações' : 'Salvar parcela'}
        </Button>
      </div>
    </Modal>
  )
}
