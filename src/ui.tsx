import type { ReactNode } from 'react'

// A reusable panel that shows live equations/numbers next to a 3D view.
export function MathPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="absolute right-3 top-3 z-10 w-72 rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        {title}
      </div>
      <div className="space-y-1.5 font-mono text-xs text-neutral-900">{children}</div>
    </div>
  )
}

// A labelled slider control.
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-xs text-neutral-700">
        <span>{label}</span>
        <span className="font-mono text-neutral-900">
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-neutral-900"
      />
    </label>
  )
}
