import { BRL } from '../../lib/finance'

export function Button({ variant = 'solid', className = '', ...p }) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const styles = {
    solid: 'bg-currency text-paper2 hover:bg-currency2',
    brass: 'bg-brass text-ink hover:bg-brass2',
    ghost: 'bg-transparent text-ink border border-line hover:bg-paper2',
    danger: 'bg-oxblood text-paper2 hover:opacity-90',
  }
  return <button className={`${base} ${styles[variant]} ${className}`} {...p} />
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-ink/60 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink/50 mt-1">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...p }) {
  return (
    <input
      className={`w-full bg-paper2 border border-line rounded-sm px-3 py-2 text-ink placeholder-ink/40 focus:border-currency ${className}`}
      {...p}
    />
  )
}

export function Select({ className = '', children, ...p }) {
  return (
    <select
      className={`w-full bg-paper2 border border-line rounded-sm px-3 py-2 text-ink focus:border-currency ${className}`}
      {...p}
    >
      {children}
    </select>
  )
}

export function Card({ className = '', children }) {
  return (
    <div className={`border border-line rounded-sm shadow-note ${className}`}>{children}</div>
  )
}

// Money figure — always rides the ledger rail (mono, tabular)
export function Money({ value, className = '', signed = false }) {
  const n = Number(value) || 0
  const tone = n < 0 ? 'text-oxblood' : ''
  const txt = signed && n > 0 ? `+${BRL(n)}` : BRL(n)
  return <span className={`figure ${tone} ${className}`}>{txt}</span>
}

export function Pill({ tone = 'currency', children }) {
  const map = {
    currency: 'bg-currency/10 text-currency border-currency/30',
    brass: 'bg-brass/15 text-brass border-brass/40',
    oxblood: 'bg-oxblood/10 text-oxblood border-oxblood/30',
    sage: 'bg-sage/40 text-ink border-line',
  }
  return (
    <span className={`inline-block text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${map[tone]}`}>
      {children}
    </span>
  )
}
