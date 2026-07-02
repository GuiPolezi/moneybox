import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'
import { Money } from './ui/primitives'

const nav = [
  { to: '/', label: 'Painel', end: true },
  { to: '/movimentacoes', label: 'Movimentações' },
  { to: '/fatura', label: 'Fatura' },
  { to: '/contas', label: 'Contas & Parcelas' },
  { to: '/metas', label: 'Metas' },
  { to: '/ajustes', label: 'Ajustes' },
]

function NavItems({ onNavigate }) {
  return nav.map((n) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `px-3 py-2 rounded-sm text-sm transition-colors ${
          isActive
            ? 'bg-currency text-paper2'
            : 'text-ink/70 hover:bg-paper2 hover:text-ink'
        }`
      }
    >
      {n.label}
    </NavLink>
  ))
}

export default function Layout() {
  const { signOut, user } = useAuth()
  const { profile } = useFinance()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // trava a rolagem do fundo enquanto o menu está aberto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const onSignOut = async () => { setMenuOpen(false); await signOut(); navigate('/entrar') }

  return (
    <div className="min-h-screen">
      {/* ── TOP BAR (mobile only) ─────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-paper2/90 backdrop-blur">
        <span className="font-display text-xl text-currency tracking-tight">MoneyBox</span>
        <div className="flex items-center gap-4">
          <div className="text-right leading-none">
            <p className="text-[10px] uppercase tracking-wider text-ink/50">Saldo</p>
            <Money value={profile?.balance} className="text-sm" />
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="p-1.5 -mr-1.5 text-ink hover:text-currency"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── DRAWER (mobile only) ──────────────────────────────── */}
      <div className={`lg:hidden fixed inset-0 z-50 ${menuOpen ? '' : 'pointer-events-none'}`}>
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        {/* panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-72 max-w-[85%] bg-paper border-l border-line shadow-note flex flex-col p-5 transition-transform duration-200 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-display text-2xl text-currency tracking-tight">MoneyBox</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              className="p-1 text-ink/60 hover:text-ink text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-wider text-ink/50">Saldo atual</p>
            <Money value={profile?.balance} className="text-2xl block mt-0.5" />
          </div>

          <nav className="flex flex-col gap-1">
            <NavItems onNavigate={() => setMenuOpen(false)} />
          </nav>

          <div className="mt-auto pt-6">
            <div className="rule pb-3 mb-3" />
            <p className="text-xs text-ink/60 truncate">{user?.email}</p>
            <button onClick={onSignOut} className="mt-2 text-xs text-oxblood hover:underline">
              Sair
            </button>
          </div>
        </aside>
      </div>

      {/* ── SIDEBAR (desktop only, fixa) ──────────────────────── */}
      <aside className="hidden lg:flex lg:fixed top-0 left-0 z-30 lg:w-64 lg:h-screen border-r border-line bg-paper2/90 backdrop-blur lg:flex-col overflow-y-auto">
        <div className="p-6 flex-1 flex flex-col w-full">
          <span className="font-display text-2xl text-currency tracking-tight">MoneyBox</span>
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50 mt-1 mb-4">
            livro-caixa pessoal
          </p>

          {/* saldo em destaque, sempre à vista com a barra fixa */}
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-wider text-ink/50">Saldo atual</p>
            <Money value={profile?.balance} className="text-2xl block mt-0.5" />
          </div>

          <nav className="flex flex-col gap-1">
            <NavItems />
          </nav>

          <div className="mt-auto pt-6">
            <div className="rule pb-3 mb-3" />
            <p className="text-xs text-ink/60 truncate">{user?.email}</p>
            <button onClick={onSignOut} className="mt-2 text-xs text-oxblood hover:underline">
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-10 max-w-6xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}