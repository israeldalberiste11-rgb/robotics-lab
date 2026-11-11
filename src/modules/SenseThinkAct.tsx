import { useEffect, useRef, useState } from 'react'
import { ARENA, senseDistance, senseWall, stepSTA, think, type Obstacle, type STAState } from '../lib/sta'
import { MathPanel } from '../ui'

const OBSTACLES: Obstacle[] = [
  { x: 130, y: 130, r: 30 },
  { x: 280, y: 200, r: 35 },
  { x: 180, y: 310, r: 28 },
  { x: 330, y: 90, r: 22 },
]

export function SenseThinkAct() {
  const [running, setRunning] = useState(true)
  const stateRef = useRef<STAState>({ x: 60, y: 60, theta: 0, v: 0, omega: 0 })
  const [, force] = useState(0)
  const distRef = useRef(0)
  const phaseRef = useRef('drive')

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (running) {
        const s = stateRef.current
        const dObs = senseDistance(s, OBSTACLES)
        const dWall = senseWall(s)
        const dist = Math.min(dObs, dWall)
        distRef.current = dist
        const cmd = think(s, dist)
        phaseRef.current = dist > 80 ? 'drive' : dist < 30 ? 'spin' : 'turn'
        stateRef.current = stepSTA(s, cmd, dt)
        force((n) => n + 1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])

  const s = stateRef.current
  const dist = distRef.current
  const phase = phaseRef.current

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <svg className="h-full w-full" viewBox={`0 0 ${ARENA.w} ${ARENA.h}`}>
        <rect x={0} y={0} width={ARENA.w} height={ARENA.h} fill="#0b1120" stroke="#1e293b" />
        {/* obstacles */}
        {OBSTACLES.map((o, i) => (
          <circle key={i} cx={o.x} cy={o.y} r={o.r} fill="#334155" stroke="#64748b" strokeWidth={2} />
        ))}
        {/* sense ray */}
        <line
          x1={s.x}
          y1={s.y}
          x2={s.x + Math.cos(s.theta) * dist}
          y2={s.y + Math.sin(s.theta) * dist}
          stroke={dist < 80 ? '#f43f5e' : '#22c55e'}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {/* robot */}
        <g transform={`translate(${s.x} ${s.y}) rotate(${(s.theta * 180) / Math.PI})`}>
          <circle r={12} fill="#1e293b" stroke="#38bdf8" strokeWidth={2} />
          <line x1={0} y1={0} x2={14} y2={0} stroke="#38bdf8" strokeWidth={2.5} />
          <polygon points="14,0 9,-4 9,4" fill="#38bdf8" />
        </g>
      </svg>

      <MathPanel title="Sense → Think → Act">
        <div className="text-slate-400">Sense:</div>
        <div className="text-sky-300">dist = {dist.toFixed(0)} px</div>
        <div className="mt-1 text-slate-400">Think:</div>
        <div className="text-sky-300">phase = {phase}</div>
        <div className="text-slate-400">v = {s.v.toFixed(0)}, ω = {s.omega.toFixed(2)}</div>
        <div className="mt-1 text-slate-400">Act:</div>
        <div className="text-sky-300">move &amp; turn</div>
        <div className="mt-2 border-t border-slate-700 pt-2 text-slate-400">
          if d &gt; 80 → drive<br />if d &lt; 30 → spin<br />else → slow &amp; turn
        </div>
      </MathPanel>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={() => {
            stateRef.current = { x: 60, y: 60, theta: 0, v: 0, omega: 0 }
          }}
          className="ml-2 rounded bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  )
}
