import { useState } from 'react'
import { forwardKinematics, toDeg } from '../lib/kine'
import { MathPanel, Slider } from '../ui'

const L = [120, 100, 80] // link lengths in px
const CX = 260
const CY = 360

export function ForwardKinematics() {
  const [a1, setA1] = useState(30) // degrees
  const [a2, setA2] = useState(-45)
  const [a3, setA3] = useState(30)

  const rads = [(a1 * Math.PI) / 180, (a2 * Math.PI) / 180, (a3 * Math.PI) / 180]
  const pts = forwardKinematics(rads, L)
  const end = pts[pts.length - 1]

  const svgPts = pts.map((p) => ({ x: CX + p.x, y: CY - p.y }))

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <svg className="h-full w-full" viewBox="0 0 520 420">
        {/* grid */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`gx${i}`} x1={i * 60} y1={0} x2={i * 60} y2={420} stroke="#e5e5e5" strokeWidth={1} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`gy${i}`} x1={0} y1={i * 60} x2={520} y2={i * 60} stroke="#e5e5e5" strokeWidth={1} />
        ))}
        {/* links */}
        {svgPts.slice(0, -1).map((p, i) => (
          <line
            key={`link${i}`}
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
            key={`j${i}`}
            cx={p.x}
            cy={p.y}
            r={i === 0 ? 8 : 6}
            fill={i === 0 ? '#f43f5e' : i === svgPts.length - 1 ? '#22c55e' : '#fbbf24'}
            stroke="#ffffff"
            strokeWidth={2}
          />
        ))}
        {/* end-effector label */}
        <text x={svgPts[svgPts.length - 1].x + 10} y={svgPts[svgPts.length - 1].y - 6} fill="#86efac" fontSize={11} fontFamily="monospace">
          ({end.x.toFixed(0)}, {end.y.toFixed(0)})
        </text>
      </svg>

      <MathPanel title="Forward Kinematics">
        <div>θ₁ = {a1}° → cumulative {toDeg(rads[0]).toFixed(0)}°</div>
        <div>θ₂ = {a2}° → cumulative {toDeg(rads[0] + rads[1]).toFixed(0)}°</div>
        <div>θ₃ = {a3}° → cumulative {toDeg(rads[0] + rads[1] + rads[2]).toFixed(0)}°</div>
        <div className="mt-2 border-t border-neutral-200 pt-2 text-neutral-500">
          x = Σ Lᵢ·cos(Σθ)
        </div>
        <div>y = Σ Lᵢ·sin(Σθ)</div>
        <div className="text-green-600">
          end = ({end.x.toFixed(1)}, {end.y.toFixed(1)})
        </div>
      </MathPanel>

      <div className="absolute bottom-4 left-1/2 w-80 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white p-3 backdrop-blur">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-800">Joint angles</div>
        <div className="space-y-2">
          <Slider label="θ₁ (base)" value={a1} min={-180} max={180} onChange={setA1} unit="°" />
          <Slider label="θ₂ (elbow)" value={a2} min={-180} max={180} onChange={setA2} unit="°" />
          <Slider label="θ₃ (wrist)" value={a3} min={-180} max={180} onChange={setA3} unit="°" />
        </div>
      </div>
    </div>
  )
}
