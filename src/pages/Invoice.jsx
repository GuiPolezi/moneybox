import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Button, Card, Field, Input, Money, Pill, PageHead, EmptyState } from '../components/ui/primitives'
import { Bubbles } from '../components/Ornament'
import { IconCard } from '../components/ui/icons'
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

  const status = invoice?.status === 'finalized' ? 'finalizada'
    : invoice?.status === 'paid' ? 'quitada' : 'em aberto'

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHead eyebrow="Fatura" title="Cartão de crédito">
        soma de todos os cartões · vence dia {invoice?.due_day ?? 5}
      </PageHead>

      {/* ── O cartão ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-lift animate-rise
                          bg-gradient-to-br from-brand2 via-sky to-brand">
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/20" />
        <Bubbles count={5} />

        <div className="relative">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-onbrand/80">
              <IconCard size={16} />
              <span className="text-xs font-medium uppercase tracking-[0.18em]">
                Fatura {invoice ? monthLabel(invoice.reference_month) : '—'}
              </span>
            </div>
            <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full
                             bg-white/20 text-onbrand backdrop-blur-sm border border-white/25">
              {status}
            </span>
          </div>

          <Money value={due} colored={false}
            className="block text-4xl sm:text-6xl mt-4 text-onbrand break-words tracking-tight" />
          <p className="text-onbrand/70 text-sm mt-1.5">valor em aberto</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
            <Mini label="Gastos do ciclo" value={invoice?.total_amount} />
            <Mini label="Meses anteriores" value={invoice?.carried_amount} />
            <Mini label="Já pago" value={invoice?.paid_amount} />
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-[11px] text-onbrand/70 mb-1.5">
              <span>progresso do pagamento</span>
              <span className="figure font-medium">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out
                           bg-gradient-to-r from-accent to-[#BEF264] shadow-[0_0_12px_rgba(163,230,53,.6)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Ações ─────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 sm:p-6 space-y-4" hover>
          <div>
            <h3 className="font-display text-lg font-semibold text-fg tracking-tight">Pagar fatura</h3>
            <p className="text-sm text-muted mt-1 leading-relaxed">
              O pagamento sai do seu saldo. Pode pagar tudo ou um valor parcial.
            </p>
          </div>
          <Field label="Valor a pagar">
            <Input
              type="text" inputMode="decimal" value={pay}
              onChange={(e) => { setPay(sanitizeAmountInput(e.target.value)); setError(null) }}
              placeholder={BRL(due)} className="figure" disabled={!canPay}
            />
          </Field>
          {error && (
            <p className="text-sm text-neg bg-neg/5 border border-neg/20 rounded-xl p-3">{error}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={doPayPartial} variant="ghost" disabled={!canPay || !partialValid} className="flex-1">
              Pagar parcial
            </Button>
            <Button onClick={doPayFull} disabled={!canPay} className="flex-1">Pagar total</Button>
          </div>
          {!canPay && invoice && (
            <p className="text-xs text-subtle">Não há valor em aberto para pagar.</p>
          )}
        </Card>

        <Card className="p-5 sm:p-6 space-y-4" hover>
          <h3 className="font-display text-lg font-semibold text-fg tracking-tight">Encerrar ou rolar</h3>
          {paidInFull ? (
            <>
              <p className="text-sm text-muted leading-relaxed">
                Fatura quitada. Você pode finalizá-la para encerrar este ciclo.
              </p>
              <Button variant="accent" onClick={finalizeInvoice} className="w-full">
                Finalizar fatura
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted leading-relaxed">
                Não vai pagar tudo? Role o saldo restante para o mês seguinte — ele sobe com
                juros de {((invoice?.interest_rate ?? 0.12) * 100).toFixed(0)}% e abre a próxima fatura.
              </p>
              <Button variant="danger" onClick={rollInvoice} disabled={!invoice || due <= 0} className="w-full">
                Rolar restante (+ juros)
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* ── Histórico ─────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 rule">
          <h3 className="font-display text-lg font-semibold text-fg tracking-tight">Faturas anteriores</h3>
        </div>
        {allInvoices.length === 0 ? (
          <EmptyState icon={<IconCard />} text="Nenhuma fatura registrada ainda." />
        ) : (
          <ul>
            {allInvoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3.5
                                          rule last:border-0 hover:bg-fg/[.02] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm text-fg capitalize truncate">{monthLabel(inv.reference_month)}</span>
                  <Pill tone={inv.status === 'finalized' ? 'neutral' : inv.status === 'paid' ? 'pos' : 'warn'}>
                    {inv.status === 'finalized' ? 'finalizada' : inv.status === 'paid' ? 'quitada' : 'em aberto'}
                  </Pill>
                </div>
                <Money value={invoiceBalance(inv)} className="text-sm shrink-0" />
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
    <div className="rounded-xl px-3.5 py-2.5 bg-white/20 backdrop-blur-sm border border-white/25">
      <p className="text-[10px] uppercase tracking-[0.12em] text-onbrand/70">{label}</p>
      <Money value={value} colored={false} className="text-onbrand text-base mt-0.5 block" />
    </div>
  )
}
