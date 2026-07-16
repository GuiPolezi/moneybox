import { BRL } from '../../lib/finance'

const cx = (...a) => a.filter(Boolean).join(' ')

/* ── Botão ─────────────────────────────────────────────────────────────────
   `solid` é o gradiente aqua da marca. Os nomes antigos (brass/danger/ghost)
   continuam válidos, agora remapeados para o espectro aero.               */
export function Button({ variant = 'solid', size = 'md', className = '', ...p }) {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-medium rounded-xl ' +
    'transition-all duration-200 active:scale-[.97] ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const styles = {
    // primária — vidro líquido aqua
    solid:
      'text-onbrand bg-gradient-to-br from-brand2 to-brand shadow-glow ' +
      'hover:brightness-110 hover:-translate-y-px',
    // acento lima (era "brass")
    brass:
      'text-onbrand bg-gradient-to-br from-accent to-pos shadow-glow ' +
      'hover:brightness-110 hover:-translate-y-px',
    accent:
      'text-onbrand bg-gradient-to-br from-accent to-pos shadow-glow ' +
      'hover:brightness-110 hover:-translate-y-px',
    // secundária — vidro
    ghost:
      'glass text-fg hover:border-brand/40 hover:text-brand',
    // texto puro
    quiet:
      'text-muted hover:text-fg hover:bg-fg/5',
    // tonal: no tema escuro `--c-neg` é um rosa claro, então texto branco
    // reprovaria no contraste. Assim funciona nos dois temas.
    danger:
      'bg-neg/10 text-neg border border-neg/30 hover:bg-neg/20 hover:border-neg/50',
  }

  return <button className={cx(base, sizes[size], styles[variant] ?? styles.solid, className)} {...p} />
}

/* ── Campo ─────────────────────────────────────────────────────────────── */
export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium tracking-wide text-muted mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-subtle mt-1.5 leading-relaxed">{hint}</span>}
    </label>
  )
}

const control =
  'w-full rounded-xl px-3.5 py-2.5 text-fg bg-surface/70 dark:bg-white/[.04] ' +
  'border border-line2 placeholder-subtle transition-all duration-200 ' +
  'hover:border-line focus:border-brand focus:bg-surface dark:focus:bg-white/[.07] ' +
  'focus:ring-4 focus:ring-brand/15 focus:outline-none'

export function Input({ className = '', ...p }) {
  return <input className={cx(control, className)} {...p} />
}

export function Select({ className = '', children, ...p }) {
  return (
    <select className={cx(control, 'appearance-none cursor-pointer pr-9', className)} {...p}>
      {children}
    </select>
  )
}

/* ── Cartão de vidro ───────────────────────────────────────────────────── */
export function Card({ className = '', hover = false, children, ...p }) {
  return (
    <div className={cx('glass rounded-2xl', hover && 'glass-hover', className)} {...p}>
      {children}
    </div>
  )
}

/* ── Dinheiro — sempre mono e tabular ──────────────────────────────────── */
export function Money({ value, className = '', signed = false, colored = true }) {
  const n = Number(value) || 0
  const tone = !colored ? '' : n < 0 ? 'text-neg' : signed && n > 0 ? 'text-pos' : ''
  const txt = signed && n > 0 ? `+${BRL(n)}` : BRL(n)
  return <span className={cx('figure font-medium', tone, className)}>{txt}</span>
}

/* ── Selo ──────────────────────────────────────────────────────────────── */
export function Pill({ tone = 'brand', children, className = '' }) {
  const map = {
    brand:    'bg-brand/12 text-brand border-brand/25',
    accent:   'bg-accent/15 text-accent border-accent/30',
    pos:      'bg-pos/12 text-pos border-pos/25',
    neg:      'bg-neg/12 text-neg border-neg/25',
    warn:     'bg-warn/15 text-warn border-warn/30',
    neutral:  'bg-fg/[.06] text-muted border-line2',
    // nomes legados do tema vintage
    currency: 'bg-brand/12 text-brand border-brand/25',
    oxblood:  'bg-neg/12 text-neg border-neg/25',
    sage:     'bg-fg/[.06] text-muted border-line2',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 text-[11px] font-medium tracking-wide',
        'px-2.5 py-1 rounded-full border whitespace-nowrap',
        map[tone] ?? map.brand,
        className
      )}
    >
      {children}
    </span>
  )
}

/* ── Barra de progresso ────────────────────────────────────────────────── */
export function Progress({ value = 0, tone, className = '', height = 'h-2' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={cx('w-full rounded-full overflow-hidden bg-fg/[.08]', height, className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: tone || 'linear-gradient(90deg, rgb(var(--c-brand)), rgb(var(--c-accent)))',
        }}
      />
    </div>
  )
}

/* ── Cabeçalho de página ───────────────────────────────────────────────── */
export function PageHead({ eyebrow, title, children }) {
  return (
    <header className="animate-rise">
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand mb-1.5">{eyebrow}</p>
      )}
      <h1 className="font-display text-3xl sm:text-[2.5rem] font-semibold leading-tight tracking-tight text-fg">
        {title}
      </h1>
      {children && <div className="text-sm text-muted mt-2">{children}</div>}
    </header>
  )
}

/* ── Estado vazio ──────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && (
        <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-brand mb-4">
          {icon}
        </div>
      )}
      {title && <p className="font-display text-lg font-semibold text-fg">{title}</p>}
      {text && <p className="text-sm text-muted mt-1.5 max-w-sm leading-relaxed">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
