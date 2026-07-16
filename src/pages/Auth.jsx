import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Aurora, Bubbles } from '../components/Ornament'
import { Button, Field, Input } from '../components/ui/primitives'
import { IconSun, IconMoon, IconTrend, IconTarget, IconCard } from '../components/ui/icons'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [mode, setMode] = useState('in') // 'in' | 'up'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const err = mode === 'in'
      ? await signIn(email, password)
      : await signUp(email, password, name)
    setBusy(false)
    if (err) { setMsg(err.message); return }
    if (mode === 'up') setMsg('Conta criada. Confirme o e-mail se for solicitado, depois entre.')
    else navigate('/')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <Aurora />

      {/* ── Vitrine (desktop) ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden
                      bg-gradient-to-br from-brand2 via-brand to-sky">
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/5" />
        <Bubbles count={7} />

        <div className="relative flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-white/25 backdrop-blur-sm
                          border border-white/30 grid place-items-center">
            <span className="font-display font-bold text-onbrand">M</span>
          </div>
          <div className="leading-none">
            <span className="font-display text-xl font-semibold text-onbrand">MoneyBox</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-onbrand/70 mt-1">
              finanças pessoais
            </p>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-5xl font-semibold leading-[1.1] tracking-tight text-onbrand">
            Cada real<br />no seu lugar.
          </h1>
          <p className="mt-5 text-onbrand/85 max-w-sm leading-relaxed">
            Salário, saldo, fatura, parcelas e metas em um só painel — com a projeção
            do mês que vem sempre à vista.
          </p>

          <div className="flex flex-col gap-3 mt-8 max-w-sm">
            {[
              { Icon: IconTrend,  text: 'Projeção do próximo mês, automática' },
              { Icon: IconCard,   text: 'Fatura do cartão sob controle' },
              { Icon: IconTarget, text: 'Caixinhas para cada objetivo' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5
                                         bg-white/15 backdrop-blur-sm border border-white/20">
                <Icon size={16} className="text-onbrand shrink-0" />
                <span className="text-sm text-onbrand/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-onbrand/50 figure tracking-wider">
          MONEYBOX · 2026
        </p>
      </div>

      {/* ── Formulário ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl grid place-items-center
                     text-muted hover:text-brand hover:bg-brand/10 transition-colors"
        >
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>

        <div className="w-full max-w-sm animate-rise">
          {/* marca compacta — só no celular, onde a vitrine não aparece */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand2 to-brand
                            grid place-items-center shadow-glow">
              <span className="font-display font-bold text-onbrand text-sm">M</span>
            </div>
            <span className="font-display text-lg font-semibold text-fg">MoneyBox</span>
          </div>

          <h2 className="font-display text-3xl font-semibold tracking-tight text-fg mb-1.5">
            {mode === 'in' ? 'Bem-vindo de volta' : 'Criar conta'}
          </h2>
          <p className="text-sm text-muted mb-7">
            {mode === 'in' ? 'Entre para ver seu painel.' : 'Comece a organizar seu dinheiro hoje.'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'up' && (
              <Field label="Nome">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como te chamamos" />
              </Field>
            )}
            <Field label="E-mail">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </Field>
            <Field label="Senha">
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
            </Field>

            {msg && (
              <p className="text-sm text-neg bg-neg/5 border border-neg/20 rounded-xl p-3 leading-relaxed">
                {msg}
              </p>
            )}

            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy ? 'Aguarde…' : mode === 'in' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <button
            onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null) }}
            className="mt-6 text-sm text-muted hover:text-brand transition-colors"
          >
            {mode === 'in' ? (
              <>Não tem conta? <span className="text-brand font-medium">Criar uma</span></>
            ) : (
              <>Já tem conta? <span className="text-brand font-medium">Entrar</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
