import type { ReactNode } from 'react'

// Compact labelled control primitives for the engineering workspace.

export function Panel({ title, children, action, className = '' }: {
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-lg border border-panel-700 bg-panel-900 ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-panel-700 px-3 py-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{title}</h3>
          {action}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  )
}

export function Slider({ label, value, min, max, step = 1, unit = '°', onChange, accent = false }: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  accent?: boolean
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs text-ink-300">{label}</span>
        <span className={`font-mono text-xs ${accent ? 'text-accent-glow' : 'text-ink-100'}`}>
          {value.toFixed(step < 1 ? 2 : 1)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-panel-700 accent-accent"
      />
    </label>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`transition-ui flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-xs ${
        checked ? 'border-accent/60 bg-accent/15 text-ink-100' : 'border-panel-700 bg-panel-850 text-ink-400 hover:border-panel-700'
      }`}
    >
      {label}
      <span className={`h-2 w-2 rounded-full ${checked ? 'bg-accent-glow' : 'bg-ink-500'}`} />
    </button>
  )
}

export function StatRow({ k, v, accent = false }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="font-mono text-[11px] text-ink-400">{k}</span>
      <span className={`font-mono text-xs ${accent ? 'text-accent-glow' : 'text-ink-100'}`}>{v}</span>
    </div>
  )
}

export function Btn({ children, onClick, active = false, className = '', title }: {
  children: ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
  title?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`transition-ui rounded-md border px-3 py-2 text-xs font-medium ${
        active
          ? 'border-accent bg-accent text-white shadow-[0_0_18px_rgba(99,102,241,0.35)]'
          : 'border-panel-700 bg-panel-850 text-ink-300 hover:border-accent/50 hover:text-ink-100'
      } ${className}`}
    >
      {children}
    </button>
  )
}

// Legacy floating panel kept for the 2D modules (IK, Differential Drive,
// PID, Sense-Think-Act) until they are migrated to the workspace layout.
export function MathPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="absolute right-3 top-3 z-10 w-72 rounded-lg border border-panel-700 bg-panel-900/90 p-3 text-sm shadow-lg backdrop-blur">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-accent-glow">{title}</div>
      <div className="space-y-1.5 font-mono text-xs text-ink-300">{children}</div>
    </div>
  )
}
