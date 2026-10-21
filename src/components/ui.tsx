import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface ${className}`}>{children}</section>
}

export function Label({ children }: { children: ReactNode }) {
  return <h2 className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">{children}</h2>
}

export function Toggle({ checked, onChange, label, name, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; name: string; hint?: string }) {
  return (
    <label className="relative flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" aria-label={name} className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"
      />
    </label>
  )
}
