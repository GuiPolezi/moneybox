import { useEffect, useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useTheme } from '../context/ThemeContext'
import { Button, Card, Field, Input, PageHead } from '../components/ui/primitives'
import { IconSun, IconMoon, IconSparkle } from '../components/ui/icons'
import { sanitizeAmountInput, parseAmount } from '../lib/finance'

export default function Settings() {
  const { profile, updateProfile } = useFinance()
  const { theme, toggle } = useTheme()
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

  const dark = theme === 'dark'

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHead eyebrow="Ajustes" title="Seus números" />

      {/* ── Aparência ─────────────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6" hover>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-fg tracking-tight">Aparência</h3>
            <p className="text-sm text-muted mt-1">
              {dark ? 'Tema escuro — meia-noite aqua.' : 'Tema claro — céu e vidro.'}
            </p>
          </div>
          <button
            onClick={toggle}
            role="switch"
            aria-checked={dark}
            aria-label="Alternar tema escuro"
            className={`relative w-16 h-9 rounded-full shrink-0 transition-colors duration-300 border
                        ${dark ? 'bg-brand/25 border-brand/40' : 'bg-fg/[.06] border-line2'}`}
          >
            <span
              className={`absolute top-1 w-7 h-7 rounded-full grid place-items-center
                          bg-gradient-to-br from-brand2 to-brand text-onbrand shadow-glow
                          transition-transform duration-300 ease-out
                          ${dark ? 'translate-x-8' : 'translate-x-1'}`}
            >
              {dark ? <IconMoon size={14} /> : <IconSun size={14} />}
            </span>
          </button>
        </div>
      </Card>

      {/* ── Perfil e números ──────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6 space-y-5" hover>
        <h3 className="font-display text-lg font-semibold text-fg tracking-tight">Perfil e números</h3>

        <Field label="Nome">
          <Input value={form.display_name} onChange={set('display_name')} />
        </Field>

        <Field label="Salário (fixo)" hint="Valor que você recebe todo mês. Muda só quando troca de emprego.">
          <Input type="text" inputMode="decimal" value={form.salary}
            onChange={(e) => setForm({ ...form, salary: sanitizeAmountInput(e.target.value) })}
            className="figure text-lg" />
        </Field>

        <Field label="Dia do pagamento" hint="Quinto dia útil ≈ dia 5. A fatura vence neste dia.">
          <Input type="number" min="1" max="31" value={form.salary_day}
            onChange={set('salary_day')} className="figure" />
        </Field>

        <Field label="Saldo atual" hint="Quanto você tem disponível agora. As movimentações partem daqui.">
          <Input type="text" inputMode="decimal" value={form.balance}
            onChange={(e) => setForm({ ...form, balance: sanitizeAmountInput(e.target.value) })}
            className="figure text-lg" />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save}>Salvar</Button>
          <span
            className={`text-sm text-pos font-medium transition-all duration-300
                        ${saved ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
          >
            ✓ Salvo
          </span>
        </div>
      </Card>

      {/* ── Como o saldo se move ──────────────────────────────────────── */}
      <Card className="p-5 sm:p-6" hover>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand grid place-items-center">
            <IconSparkle size={14} />
          </span>
          <h3 className="font-display text-lg font-semibold text-fg tracking-tight">Como o saldo se move</h3>
        </div>
        <ul className="space-y-2.5">
          {[
            <>O <strong className="text-fg font-medium">salário</strong> é seu saldo de partida — definido aqui, fixo.</>,
            <>Uma <strong className="text-fg font-medium">receita</strong> aumenta o saldo; uma <strong className="text-fg font-medium">despesa em dinheiro</strong> diminui.</>,
            <>Gasto <strong className="text-fg font-medium">no crédito</strong> entra na fatura do mês — o saldo só cai quando a fatura é paga.</>,
            <>Pagar conta fixa ou parcela <strong className="text-fg font-medium">diminui o saldo</strong>. Sem saldo, o que faltar vai para a fatura.</>,
            <>A <strong className="text-fg font-medium">projeção</strong> usa: saldo + salário − fatura em aberto − contas do mês.</>,
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-brand2 to-accent shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
