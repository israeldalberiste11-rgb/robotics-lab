import { useState } from 'react'
import { forwardKinematics, inverseKinematics2, toDeg, type Pt } from '../lib/kine'
import { MathPanel } from '../ui'

const L1 = 150
const L2 = 120
const CX = 260
const CY = 280

export function InverseKinematics() {
  const [target, setTarget] = useState<Pt>({ x: 200, y: 150 })

  const sol = inverseKinematics2(target, L1, L2)
  const angles = sol ? [sol[0], sol[1]] : [Math.atan2(target.y, target.x), 0]
  const pts = forwardKinematics(angles, [L1, L2])
  const end = pts[pts.length - 1]
  const svgPts = pts.map((p) => ({ x: CX + p.x, y: CY - p.y }))
  const reachable = sol !== null
  const maxR = L1 + L2
  const minR = Math.abs(L1 - L2)
  const targetR = Math.hypot(target.x, target.y)

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <svg
        className="h-full w-full"
        viewBox="0 0 520 380"
        onClick={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const sx = ((e.clientX - r.left) / r.width) * 520 - CX
          const sy = CY - ((e.clientY - r.top) / r.height) * 380
          setTarget({ x: sx, y: sy })
        }}
      >
        {/* reachable annulus */}
        <circle cx={CX} cy={CY} r={maxR} fill="#064e3b" opacity={0.25} />
        <circle cx={CX} cy={CY} r={minR} fill="#ffffff" />
        {/* grid */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={i * 60} y1={0} x2={i * 60} y2={380} stroke="#e5e5e5" strokeWidth={1} />
        ))}
        {/* links */}
        {svgPts.slice(0, -1).map((p, i) => (
          <line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={svgPts[i + 1].x}
            y2={svgPts[i + 1].y}
            stroke="#3b82f6"
            strokeWidth={10}
            strokeLinecap="round"
          />
        ))}
        {/* joints */}
        {svgPts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === 0 ? 8 : 6}
            fill={i === 0 ? '#f43f5e' : i === svgPts.length - 1 ? '#22c55e' : '#fbbf24'}
            stroke="#ffffff"
            strokeWidth={2}
          />
        ))}
        {/* target */}
        <g>
          <circle cx={CX + target.x} cy={CY - target.y} r={7} fill="none" stroke={reachable ? '#22c55e' : '#ef4444'} strokeWidth={2} />
          <line x1={CX + target.x - 10} y1={CY - target.y} x2={CX + target.x + 10} y2={CY - target.y} stroke={reachable ? '#22c55e' : '#ef4444'} strokeWidth={1.5} />
          <line x1={CX + target.x} y1={CY - target.y - 10} x2={CX + target.x} y2={CY - target.y + 10} stroke={reachable ? '#22c55e' : '#ef4444'} strokeWidth={1.5} />
        </g>
        <text x={12} y={20} fill="#a3a3a3" fontSize={11} fontFamily="monospace">
          Click anywhere to set the target · green ring = reachable
        </text>
      </svg>

      <MathPanel title="Inverse Kinematics">
        <div className="text-neutral-500">target = ({target.x.toFixed(0)}, {target.y.toFixed(0)})</div>
        <div>r = {targetR.toFixed(1)} px</div>
        <div className="text-neutral-500">reach: {minR}…{maxR}</div>
        {reachable ? (
          <>
            <div className="mt-2 border-t border-neutral-200 pt-2">θ₁ = {toDeg(sol![0]).toFixed(1)}°</div>
            <div>θ₂ = {toDeg(sol![1]).toFixed(1)}°</div>
            <div className="mt-2 text-neutral-500">cos θ₂ = (r²−L₁²−L₂²)/2L₁L₂</div>
            <div className="text-green-600">end = ({end.x.toFixed(1)}, {end.y.toFixed(1)})</div>
          </>
        ) : (
          <div className="mt-2 text-red-500">⚠️ Target out of reach</div>
        )}
      </MathPanel>
    </div>
  )
}
