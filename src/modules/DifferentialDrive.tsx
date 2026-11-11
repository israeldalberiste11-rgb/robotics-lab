import { useEffect, useRef, useState } from 'react'
import { stepDifferential, turningRadius, type Pose } from '../lib/drive'
import { MathPanel, Slider } from '../ui'

const ARENA_W = 520
const ARENA_H = 380
const L = 60 // wheelbase in px

export function DifferentialDrive() {
  const [vLeft, setVLeft] = useState(60)
  const [vRight, setVRight] = useState(60)
  const [running, setRunning] = useState(true)
  const poseRef = useRef<Pose>({ x: ARENA_W / 2, y: ARENA_H / 2, theta: -Math.PI / 2 })
  const trailRef = useRef<{ x: number; y: number }[]>([])
  const [, force] = useState(0)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (running) {
        const next = stepDifferential(poseRef.current, vLeft, vRight, L, dt)
        // bounce off walls by reflecting heading
        if (next.x < 20 || next.x > ARENA_W - 20) next.theta = Math.PI - next.theta
        if (next.y < 20 || next.y > ARENA_H - 20) next.theta = -next.theta
        next.x = Math.max(20, Math.min(ARENA_W - 20, next.x))
        next.y = Math.max(20, Math.min(ARENA_H - 20, next.y))
        poseRef.current = next
        trailRef.current.push({ x: next.x, y: next.y })
        if (trailRef.current.length > 400) trailRef.current.shift()
        force((n) => n + 1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [vLeft, vRight, running])

  const pose = poseRef.current
  const R = turningRadius(vLeft, vRight, L)
  const omega = (vRight - vLeft) / L
  const v = (vLeft + vRight) / 2

  // ICR point: perpendicular to heading, offset by R
  const icr =
    R === null
      ? null
      : { x: pose.x - R * Math.sin(pose.theta), y: pose.y + R * Math.cos(pose.theta) }

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <svg className="h-full w-full" viewBox={`0 0 ${ARENA_W} ${ARENA_H}`}>
        <rect x={0} y={0} width={ARENA_W} height={ARENA_H} fill="#ffffff" stroke="#e5e5e5" />
        {/* trail */}
        {trailRef.current.length > 1 && (
          <polyline
            points={trailRef.current.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            opacity={0.5}
          />
        )}
        {/* ICR + turning arc */}
        {icr && (
          <>
            <circle cx={icr.x} cy={icr.y} r={4} fill="#fbbf24" />
            <line x1={pose.x} y1={pose.y} x2={icr.x} y2={icr.y} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
            <text x={icr.x + 6} y={icr.y - 4} fill="#fbbf24" fontSize={10} fontFamily="monospace">ICR</text>
          </>
        )}
        {/* robot body */}
        <g transform={`translate(${pose.x} ${pose.y}) rotate(${(-pose.theta * 180) / Math.PI})`}>
          <rect x={-22} y={-14} width={44} height={28} rx={4} fill="#f5f5f5" stroke="#3b82f6" strokeWidth={2} />
          {/* wheels */}
          <rect x={-24} y={-18} width={48} height={5} fill="#0f172a" />
          <rect x={-24} y={13} width={48} height={5} fill="#0f172a" />
          {/* heading arrow */}
          <line x1={0} y1={0} x2={24} y2={0} stroke="#22c55e" strokeWidth={3} />
          <polygon points="24,0 18,-5 18,5" fill="#22c55e" />
        </g>
      </svg>

      <MathPanel title="Differential Drive">
        <div className="text-neutral-500">v_L = {vLeft.toFixed(0)} px/s</div>
        <div className="text-neutral-500">v_R = {vRight.toFixed(0)} px/s</div>
        <div className="mt-2 border-t border-neutral-200 pt-2">v = (v_L+v_R)/2</div>
        <div className="text-neutral-800">v = {v.toFixed(1)}</div>
        <div>ω = (v_R−v_L)/L</div>
        <div className="text-neutral-800">ω = {omega.toFixed(2)} rad/s</div>
        <div className="mt-2 text-neutral-500">R = v/ω</div>
        <div className="text-neutral-800">{R === null ? '∞ (straight)' : `${R.toFixed(0)} px`}</div>
      </MathPanel>

      <div className="absolute bottom-4 left-1/2 w-80 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white p-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">Wheel speeds</span>
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800"
          >
            {running ? 'Pause' : 'Play'}
          </button>
        </div>
        <div className="space-y-2">
          <Slider label="Left wheel" value={vLeft} min={-120} max={120} onChange={setVLeft} unit=" px/s" />
          <Slider label="Right wheel" value={vRight} min={-120} max={120} onChange={setVRight} unit=" px/s" />
        </div>
      </div>
    </div>
  )
}
