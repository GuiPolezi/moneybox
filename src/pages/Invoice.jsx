import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Button, Card, Field, Input, Money, Pill } from '../components/ui/primitives'
import { Guilloche } from '../components/Ornament'
import { BRL, invoiceBalance, monthLabel, sanitizeAmountInput, parseAmount } from '../lib/finance'

export default function Invoice() {
  const { invoice, allInvoices, openInvoiceBalance, payInvoice, finalizeInvoice, rollInvoice } = useFinance()
  const [pay, setPay] = useState('')
  const [error, setError] = useState(null)

  const due = openInvoiceBalance
  const paidInFull = invoice && due <= 0.001 && Number(invoice.total_amount) + Number(invoice.carried_amount) > 0
  const pct = invoice
    ? Math.min(100, (Number(invoice.paid_amount) / Math.max(1, Number(invoice.total_amount) + Number(invoice.carried_amount))) * 100)
    : 0

  const partialValue = parseAmount(pay)
  const partialValid = pay !== '' && !isNaN(partialValue) && partialValue > 0
  const canPay = !!invoice && due > 0.001

  const doPayFull = async () => {
    setError(null)
    if (!canPay) return
    await payInvoice(due)
    setPay('')
  }

  const doPayPartial = async () => {
    if (!canPay) return
    if (!partialValid) { setError('Digite um valor para pagar.'); return }
    if (partialValue > due) { setError('O valor é maior que a fatura em aberto.'); return }
    setError(null)
    await payInvoice(partialValue)
    setPay('')
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Fatura</p>
        <h1 className="font-display text-3xl text-ink">Cartão de crédito</h1>
        <p className="text-sm text-ink/60 mt-1">soma de todos os cartões · vence dia {invoice?.due_day ?? 5}</p>
      </header>

      {/* the open invoice, drawn like a banknote */}
      <Card className="p-6 relative overflow-hidden bg-green-900 text-paper2 border-currency">
        <Guilloche className="absolute -right-16 -top-10 w-96" color="#E9E3D2" opacity={0.14} />
        <Guilloche className="absolute -left-24 bottom-0 w-96" color="#C9A24B" opacity={0.12} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.25em] text-paper2/70">
              Fatura {invoice ? monthLabel(invoice.reference_month) : '—'}
            </span>
            <Pill tone="brass">{invoice?.status === 'finalized' ? 'finalizada' : invoice?.status === 'paid' ? 'quitada' : 'em aberto'}</Pill>
          </div>

          <Money value={due} className="block text-3xl sm:text-5xl mt-3 break-words" />
          <p className="text-paper2/70 text-sm mt-1">valor em aberto</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 text-sm">
            <Mini label="Gastos do ciclo" value={invoice?.total_amount} />
            <Mini label="Saldo de meses anteriores" value={invoice?.carried_amount} />
            <Mini label="Já pago" value={invoice?.paid_amount} />
          </div>

          {/* progress */}
          <div className="mt-5 h-2 bg-paper2/20 rounded-full overflow-hidden">
            <div className="h-full bg-brass" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Card>

      {/* actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 space-y-4">
          <h3 className="font-display text-lg text-ink">Pagar fatura</h3>
          <p className="text-sm text-ink/60">O pagamento sai do seu saldo. Pode pagar tudo ou um valor parcial.</p>
          <Field label="Valor a pagar">
            <Input type="text" inputMode="decimal" value={pay}
              onChange={(e) => { setPay(sanitizeAmountInput(e.target.value)); setError(null) }}
              placeholder={BRL(due)} className="figure" disabled={!canPay} />
          </Field>
          {error && <p className="text-sm text-oxblood bg-oxblood/5 border border-oxblood/20 rounded-sm p-2">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={doPayPartial} variant="ghost" disabled={!canPay || !partialValid}>Pagar parcial</Button>
            <Button onClick={doPayFull} disabled={!canPay}>Pagar total</Button>
          </div>
          {!canPay && invoice && <p className="text-xs text-ink/45">Não há valor em aberto para pagar.</p>}
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-display text-lg text-ink">Encerrar ou rolar</h3>
          {paidInFull ? (
            <>
              <p className="text-sm text-ink/60">Fatura quitada. Você pode finalizá-la para encerrar este ciclo.</p>
              <Button variant="brass" onClick={finalizeInvoice} className="w-full">Finalizar fatura</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink/60">
                Não vai pagar tudo? Role o saldo restante para o mês seguinte —
                ele sobe com juros de {((invoice?.interest_rate ?? 0.12) * 100).toFixed(0)}% e abre a próxima fatura.
              </p>
              <Button variant="danger" onClick={rollInvoice} disabled={!invoice || due <= 0} className="w-full">
                Rolar restante (+ juros)
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* history */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 rule">
          <h3 className="font-display text-lg text-ink">Faturas anteriores</h3>
        </div>
        {allInvoices.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">Nenhuma fatura registrada.</p>
        ) : (
          <ul>
            {allInvoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-4 py-3 rule last:border-0">
                <div>
                  <span className="text-sm text-ink">{monthLabel(inv.reference_month)}</span>
                  <span className="ml-2"><Pill tone={inv.status === 'finalized' ? 'sage' : inv.status === 'paid' ? 'currency' : 'oxblood'}>{inv.status}</Pill></span>
                </div>
                <Money value={invoiceBalance(inv)} className="text-sm" />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-paper2/60">{label}</p>
      <Money value={value} className="text-paper2 text-base" />
    </div>
  )
}