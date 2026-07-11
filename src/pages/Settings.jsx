import { useEffect, useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Button, Card, Field, Input, Money } from '../components/ui/primitives'
import { sanitizeAmountInput, parseAmount } from '../lib/finance'

export default function Settings() {
  const { profile, updateProfile } = useFinance()
  const [form, setForm] = useState({ display_name: '', salary: '', salary_day: '', balance: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) setForm({
      display_name: profile.display_name ?? '',
      salary: profile.salary ?? 0,
      salary_day: profile.salary_day ?? 5,
      balance: profile.balance ?? 0,
    })
  }, [profile])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async () => {
    await updateProfile({
      display_name: form.display_name,
      salary: parseAmount(form.salary),
      salary_day: Number(form.salary_day),
      balance: parseAmount(form.balance),
    })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Ajustes</p>
        <h1 className="font-display text-3xl text-ink">Seus números</h1>
      </header>

      <Card className="p-6 space-y-5">
        <Field label="Nome">
          <Input value={form.display_name} onChange={set('display_name')} />
        </Field>

        <Field label="Salário (fixo)" hint="Valor que você recebe todo mês. Muda só quando troca de emprego.">
          <Input type="text" inputMode="decimal" value={form.salary} onChange={(e) => setForm({ ...form, salary: sanitizeAmountInput(e.target.value) })} className="figure" />
        </Field>

        <Field label="Dia do pagamento" hint="Quinto dia útil ≈ dia 5. A fatura vence neste dia.">
          <Input type="number" min="1" max="31" value={form.salary_day} onChange={set('salary_day')} className="figure" />
        </Field>

        <Field label="Saldo atual" hint="Quanto você tem disponível agora. As movimentações partem daqui.">
          <Input type="text" inputMode="decimal" value={form.balance} onChange={(e) => setForm({ ...form, balance: sanitizeAmountInput(e.target.value) })} className="figure" />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save}>Salvar</Button>
          {saved && <span className="text-sm text-currency">Salvo ✓</span>}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-lg text-ink mb-2">Como o saldo se move</h3>
        <ul className="text-sm text-ink/65 space-y-1.5 list-disc pl-5">
          <li>O <strong>salário</strong> é seu saldo de partida — definido aqui, fixo.</li>
          <li>Uma <strong>receita</strong> aumenta o saldo; uma <strong>despesa em dinheiro</strong> diminui.</li>
          <li>Gasto <strong>no crédito</strong> entra na fatura do mês — o saldo só cai quando a fatura é paga.</li>
          <li>Pagar conta fixa ou parcela <strong>diminui o saldo</strong>. Sem saldo, o que faltar vai para a fatura.</li>
          <li>A <strong>projeção</strong> usa: saldo + salário − fatura em aberto − contas do mês.</li>
        </ul>
      </Card>
    </div>
  )
}