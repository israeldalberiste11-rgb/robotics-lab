import { useMemo, useState } from 'react'
import { simulateResponse, type PIDGains } from '../lib/pid'
import { MathPanel, Slider } from '../ui'

const SETPOINT = 100
const SECONDS = 8
const W = 520
const H = 380
const PAD = 36

export function PIDControl() {
  const [kp, setKp] = useState(4)
  const [ki, setKi] = useState(0.5)
  const [kd, setKD] = useState(1)

  const gains: PIDGains = { kp, ki, kd }
  const curve = useMemo(() => simulateResponse(gains, SETPOINT, SECONDS), [kp, ki, kd])

  // map curve to svg coords
  const maxY = SETPOINT * 1.6
  const pts = curve.map((p) => ({
    x: PAD + (p.t / SECONDS) * (W - PAD * 2),
    y: H - PAD - (p.y / maxY) * (H - PAD * 2),
  }))
  const setY = H - PAD - (SETPOINT / maxY) * (H - PAD * 2)

  // crude metrics: overshoot, settling
  const peak = Math.max(...curve.map((c) => c.y))
  const overshootPct = Math.max(0, ((peak - SETPOINT) / SETPOINT) * 100)
  const settled = curve.find((c) => Math.abs(c.y - SETPOINT) < 2 && c.t > 1)?.t ?? null

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <svg className="h-full w-full" viewBox={`0 0 ${W} ${H}`}>
        {/* axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#334155" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#334155" />
        {/* setpoint line */}
        <line x1={PAD} y1={setY} x2={W - PAD} y2={setY} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="6 4" />
        <text x={W - PAD - 4} y={setY - 5} fill="#fbbf24" fontSize={10} fontFamily="monospace" textAnchor="end">setpoint={SETPOINT}</text>
        {/* response curve */}
        {pts.length > 1 && (
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2.5}
          />
        )}
        {/* labels */}
        <text x={6} y={16} fill="#64748b" fontSize={10} fontFamily="monospace">value</text>
        <text x={W - 40} y={H - 8} fill="#64748b" fontSize={10} fontFamily="monospace">time (s)</text>
      </svg>

      <MathPanel title="PID Controller">
        <div className="text-slate-400">e = setpoint − measurement</div>
        <div className="mt-1 text-slate-300">u = Kp·e + Ki·∫e dt + Kd·de/dt</div>
        <div className="mt-2 border-t border-slate-700 pt-2 text-slate-400">Peak: <span className="text-sky-300">{peak.toFixed(1)}</span></div>
        <div className="text-slate-400">Overshoot: <span className={overshootPct > 20 ? 'text-rose-400' : 'text-emerald-300'}>{overshootPct.toFixed(0)}%</span></div>
        <div className="text-slate-400">Settles: <span className="text-emerald-300">{settled !== null ? `${settled.toFixed(2)}s` : '—'}</span></div>
      </MathPanel>

      <div className="absolute bottom-4 left-1/2 w-96 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900/85 p-3 backdrop-blur">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-300">Tune the gains</div>
        <div className="grid grid-cols-3 gap-3">
          <Slider label="Kp" value={kp} min={0} max={20} step={0.1} onChange={setKp} />
          <Slider label="Ki" value={ki} min={0} max={5} step={0.1} onChange={setKi} />
          <Slider label="Kd" value={kd} min={0} max={5} step={0.1} onChange={setKD} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Try Kp alone first — too high oscillates. Add Kd to dampen. Add Ki to remove steady-state error.
        </p>
      </div>
    </div>
  )
}
