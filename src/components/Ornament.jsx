import { useEffect } from 'react'

/* ── Aurora ────────────────────────────────────────────────────────────────
   O "céu" aero: manchas de luz aqua e lima que respiram atrás da interface.
   Fica em position:fixed / z-index:-1, então nunca intercepta cliques.     */
export function Aurora() {
  return <div className="aurora" aria-hidden="true" />
}

/* ── Bolhas ────────────────────────────────────────────────────────────────
   O gesto Frutiger Aero mais reconhecível — usado com parcimônia, só como
   luz de fundo em painéis grandes.                                          */
export function Bubbles({ className = '', count = 7 }) {
  // Posições fixas (nada de random) para não dançar a cada render.
  const seeds = [
    { x: 12, y: 22, r: 46, d: 0 },
    { x: 78, y: 14, r: 26, d: 2.5 },
    { x: 34, y: 72, r: 18, d: 1.2 },
    { x: 62, y: 58, r: 62, d: 3.8 },
    { x: 88, y: 78, r: 22, d: 0.6 },
    { x: 22, y: 48, r: 12, d: 4.4 },
    { x: 52, y: 30, r: 14, d: 2 },
  ].slice(0, count)

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {seeds.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.r,
            height: b.r,
            animationDelay: `${b.d}s`,
            animationDuration: `${8 + (i % 4) * 2.5}s`,
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,.85), rgba(255,255,255,.18) 42%, rgba(255,255,255,.04) 68%)',
            boxShadow: 'inset 0 0 12px rgba(255,255,255,.5), 0 4px 18px rgba(0,0,0,.06)',
            border: '1px solid rgba(255,255,255,.3)',
          }}
        />
      ))}
    </div>
  )
}

/* ── Brilho ────────────────────────────────────────────────────────────────
   Um halo suave para ancorar cartões de destaque.                          */
export function Glow({ className = '', color = 'var(--c-brand)', size = 320, opacity = 0.4 }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        opacity,
        background: `radial-gradient(circle, rgb(${color} / .8), transparent 70%)`,
        filter: 'blur(60px)',
      }}
    />
  )
}

/* ── Modal ─────────────────────────────────────────────────────────────────
   Folha inferior no celular, cartão de vidro centrado no desktop.          */
export function Modal({ open, onClose, title, subtitle, children }) {
  // Trava a rolagem do fundo e fecha no ESC.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-canvas/60 backdrop-blur-md animate-rise"
        onClick={onClose}
      />
      <div
        className="relative glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6
                   max-h-[92vh] overflow-y-auto animate-rise shadow-lift pb-safe sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* alça da folha, só no celular */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-fg/15 mx-auto -mt-2 mb-4" />

        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-fg tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 w-8 h-8 rounded-full grid place-items-center
                       text-muted hover:text-fg hover:bg-fg/5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
