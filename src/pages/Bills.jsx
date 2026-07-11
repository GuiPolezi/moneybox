import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Modal } from '../components/Ornament'
import { Button, Card, Field, Input, Money, Pill } from '../components/ui/primitives'
import { sanitizeAmountInput, parseAmount } from '../lib/finance'

export default function Bills() {
  const {
    fixedBills, billPayments, installments, thisMonth,
    addFixedBill, payFixedBill, toggleFixedBill, deleteFixedBill, updateFixedBill,
    addInstallment, payInstallment, deleteInstallment, updateInstallment,
  } = useFinance()

  const [modal, setModal] = useState(null)       // 'fixed' | 'inst' | null  (adicionar)
  const [editFixed, setEditFixed] = useState(null) // conta fixa em edição
  const [editInst, setEditInst] = useState(null)   // parcela em edição

  const paidThisMonth = (id) =>
    billPayments.some((p) => p.fixed_bill_id === id && p.reference_month === thisMonth)

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Contas & Parcelas</p>
          <h1 className="font-display text-3xl text-ink">Compromissos recorrentes</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setModal('fixed')}>+ Conta fixa</Button>
          <Button onClick={() => setModal('inst')}>+ Parcela</Button>
        </div>
      </header>

      {/* fixed bills */}
      <section>
        <SectionTitle title="Contas fixas" note="recorrentes, sem fim — ex.: academia" />
        {fixedBills.length === 0 ? (
          <EmptyRow text="Nenhuma conta fixa cadastrada." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {fixedBills.map((b) => {
              const paid = paidThisMonth(b.id)
              return (
                <Card key={b.id} className={`p-4 ${!b.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-ink font-medium">{b.name}</p>
                      <p className="text-[11px] text-ink/45">vence dia {b.due_day}</p>
                    </div>
                    <Money value={b.amount} className="text-base" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {paid ? (
                      <Pill tone="currency">paga este mês</Pill>
                    ) : (
                      <>
                        <Button variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => payFixedBill(b, 'cash')}>Pagar (dinheiro)</Button>
                        <Button variant="brass" className="!px-3 !py-1 text-xs" onClick={() => payFixedBill(b, 'credit')}>No crédito</Button>
                      </>
                    )}
                    <button onClick={() => setEditFixed(b)} className="ml-auto text-xs text-currency hover:underline">editar</button>
                    <button onClick={() => toggleFixedBill(b.id, !b.active)} className="text-xs text-ink/50 hover:underline">
                      {b.active ? 'pausar' : 'ativar'}
                    </button>
                    <button onClick={() => deleteFixedBill(b.id)} className="text-xs text-oxblood hover:underline">excluir</button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* installments */}
      <section>
        <SectionTitle title="Parcelas" note="com prazo definido — avançam até quitar" />
        {installments.length === 0 ? (
          <EmptyRow text="Nenhuma parcela cadastrada." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {installments.map((i) => {
              const done = i.paid_count >= i.total_count
              const pct = (i.paid_count / i.total_count) * 100
              return (
                <Card key={i.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-ink font-medium">{i.name}</p>
                      <p className="text-[11px] text-ink/45 figure">{i.paid_count}/{i.total_count} parcelas</p>
                    </div>
                    <Money value={i.installment_amount} className="text-base" />
                  </div>
                  <div className="mt-3 h-1.5 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-currency" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {done ? (
                      <Pill tone="currency">quitada</Pill>
                    ) : (
                      <>
                        <Button variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => payInstallment(i, 'cash')}>Pagar parcela</Button>
                        <Button variant="brass" className="!px-3 !py-1 text-xs" onClick={() => payInstallment(i, 'credit')}>No crédito</Button>
                      </>
                    )}
                    <button onClick={() => setEditInst(i)} className="ml-auto text-xs text-currency hover:underline">editar</button>
                    <button onClick={() => deleteInstallment(i.id)} className="text-xs text-oxblood hover:underline">excluir</button>
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
    <div className="mb-3">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <p className="text-xs text-ink/50">{note}</p>
    </div>
  )
}
function EmptyRow({ text }) {
  return <Card className="p-5"><p className="text-sm text-ink/50">{text}</p></Card>
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
    <Modal open={open} onClose={onClose} title={editing ? 'Editar conta fixa' : 'Nova conta fixa'}>
      <div className="space-y-4">
        <Field label="Nome"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Academia" /></Field>
        <Field label="Valor mensal"><Input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))} className="figure" placeholder="0,00" /></Field>
        <Field label="Dia de vencimento"><Input type="number" min="1" max="31" value={due} onChange={(e) => setDue(e.target.value)} className="figure" /></Field>
        <Button onClick={save} className="w-full">{editing ? 'Salvar alterações' : 'Salvar conta fixa'}</Button>
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
    <Modal open={open} onClose={onClose} title={editing ? 'Editar parcela' : 'Nova parcela'}>
      <div className="space-y-4">
        <Field label="Descrição"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Notebook" /></Field>
        <Field label="Valor da parcela"><Input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))} className="figure" placeholder="0,00" /></Field>
        <Field label="Número de parcelas"><Input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} className="figure" placeholder="12" /></Field>
        {editing && (
          <Field label="Parcelas já pagas" hint="ajuste caso queira corrigir o progresso">
            <Input type="number" min="0" max={count || undefined} value={paid} onChange={(e) => setPaid(e.target.value)} className="figure" />
          </Field>
        )}
        <Field label="Dia de vencimento"><Input type="number" min="1" max="31" value={due} onChange={(e) => setDue(e.target.value)} className="figure" /></Field>
        <Button onClick={save} className="w-full">{editing ? 'Salvar alterações' : 'Salvar parcela'}</Button>
      </div>
    </Modal>
  )
}