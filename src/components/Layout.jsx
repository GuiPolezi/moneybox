import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'
import { useTheme } from '../context/ThemeContext'
import { Money } from './ui/primitives'
import { Aurora } from './Ornament'
import {
  IconGrid, IconSwap, IconCard, IconRepeat, IconTarget, IconSliders,
  IconSun, IconMoon, IconLogout,
} from './ui/icons'

const nav = [
  { to: '/',              label: 'Painel',        short: 'Painel',  Icon: IconGrid,    end: true },
  { to: '/movimentacoes', label: 'Movimentações', short: 'Lançar',  Icon: IconSwap },
  { to: '/fatura',        label: 'Fatura',        short: 'Fatura',  Icon: IconCard },
  { to: '/contas',        label: 'Contas & Parcelas', short: 'Contas', Icon: IconRepeat },
  { to: '/metas',         label: 'Metas',         short: 'Metas',   Icon: IconTarget },
  { to: '/ajustes',       label: 'Ajustes',       short: 'Ajustes', Icon: IconSliders },
]

/* ── Alternador de tema ────────────────────────────────────────────────── */
function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={dark ? 'Tema claro' : 'Tema escuro'}
      className={`relative w-9 h-9 rounded-xl grid place-items-center text-muted
                  hover:text-brand hover:bg-brand/10 transition-colors ${className}`}
    >
      <span className={`absolute transition-all duration-300 ${dark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
        <IconSun size={18} />
      </span>
      <span className={`absolute transition-all duration-300 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
        <IconMoon size={18} />
      </span>
    </button>
  )
}

/* ── Marca ─────────────────────────────────────────────────────────────── */
function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand2 to-brand
                      grid place-items-center shadow-glow shrink-0">
        <span className="font-display font-bold text-onbrand text-sm">M</span>
        <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/50 to-transparent opacity-60" />
      </div>
      {!compact && (
        <div className="leading-none">
          <span className="font-display text-lg font-semibold tracking-tight text-fg">MoneyBox</span>
          <p className="text-[10px] uppercase tracking-[0.18em] text-subtle mt-1">finanças pessoais</p>
        </div>
      )}
    </div>
  )
}

/* ── Cartão de saldo (barra lateral) ───────────────────────────────────── */
function BalanceCard({ value }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4
                    bg-gradient-to-br from-brand2 to-brand shadow-glow">
      <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent" />
      <div className="absolute -right-6 -top-8 w-24 h-24 rounded-full bg-white/20 blur-xl" />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.18em] text-onbrand/70">Saldo atual</p>
        <Money value={value} colored={false} className="block text-2xl mt-1 text-onbrand" />
      </div>
    </div>
  )
}

export default function Layout() {
  const { signOut, user } = useAuth()
  const { profile } = useFinance()
  const navigate = useNavigate()

  const onSignOut = async () => { await signOut(); navigate('/entrar') }

  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
     transition-all duration-200 ${
       isActive
         ? 'bg-brand/12 text-brand'
         : 'text-muted hover:text-fg hover:bg-fg/[.04]'
     }`

  return (
    <div className="min-h-screen">
      <Aurora />

      {/* ── BARRA SUPERIOR (celular) ───────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 glass rounded-none border-x-0 border-t-0
                         px-4 py-3 flex items-center justify-between gap-3">
        <Brand compact />
        <div className="flex items-center gap-2">
          <div className="text-right leading-none mr-1">
            <p className="text-[9px] uppercase tracking-[0.15em] text-subtle">Saldo</p>
            <Money value={profile?.balance} className="text-sm" />
          </div>
          <ThemeToggle />
          <button
            onClick={onSignOut}
            aria-label="Sair"
            className="w-9 h-9 rounded-xl grid place-items-center text-muted
                       hover:text-neg hover:bg-neg/10 transition-colors"
          >
            <IconLogout size={18} />
          </button>
        </div>
      </header>

      {/* ── TRILHO LATERAL (desktop) ───────────────────────────────────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-40 w-[272px] h-screen p-4">
        <div className="glass rounded-3xl flex flex-col w-full p-5">
          <Brand />

          <div className="mt-6">
            <BalanceCard value={profile?.balance} />
          </div>

          <nav className="flex flex-col gap-1 mt-6">
            {nav.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full
                                  bg-gradient-to-b from-brand2 to-accent transition-all duration-300
                                  ${isActive ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}
                    />
                    <Icon size={18} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <div className="rule mb-3" />
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted truncate" title={user?.email}>{user?.email}</p>
              </div>
              <ThemeToggle />
              <button
                onClick={onSignOut}
                aria-label="Sair"
                title="Sair"
                className="w-9 h-9 rounded-xl grid place-items-center text-muted
                           hover:text-neg hover:bg-neg/10 transition-colors"
              >
                <IconLogout size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── CONTEÚDO ───────────────────────────────────────────────────── */}
      <main className="lg:pl-[272px]">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-10 max-w-6xl w-full mx-auto pb-28 lg:pb-10">
          <Outlet />
        </div>
      </main>

      {/* ── NAVEGAÇÃO INFERIOR (celular) ───────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass rounded-none
                      border-x-0 border-b-0 px-2 pt-1.5 pb-safe">
        <div className="flex items-stretch justify-around">
          {nav.map(({ to, short, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl min-w-0 flex-1
                 transition-colors ${isActive ? 'text-brand' : 'text-subtle'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute -top-1.5 h-1 rounded-full bg-gradient-to-r from-brand2 to-accent
                                transition-all duration-300 ${isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}
                  />
                  <Icon size={20} />
                  <span className="text-[10px] font-medium truncate w-full text-center">{short}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
