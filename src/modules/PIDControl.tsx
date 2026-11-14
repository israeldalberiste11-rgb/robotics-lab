import { useMemo, useState } from 'react'
import { settlingTime, simulateResponse, type PIDGains } from '../lib/pid'
import { Card, Range, Readings } from '../sim/Controls'

const SETPOINT = 100
const SECONDS = 8
const W = 520
const H = 380
const PAD = 36

export function PIDControl() {
  const [kp, setKp] = useState(4)
  const [ki, setKi] = useState(0.5)
  const [kd, setKD] = useState(.1)

  const gains: PIDGains = { kp, ki, kd }
  const curve = useMemo(() => simulateResponse(gains, SETPOINT, SECONDS), [kp, ki, kd])

  // map curve to svg coords
  const minY = Math.min(0,...curve.map(sample=>sample.y))
  const maxY = Math.max(SETPOINT*1.15,...curve.map(sample=>sample.y))
  const scaleY = (y:number) => H-PAD-(y-minY)/(maxY-minY)*(H-PAD*2)
  const pts = curve.map((p) => ({
    x: PAD + (p.t / SECONDS) * (W - PAD * 2),
    y: scaleY(p.y),
  }))
  const setY = scaleY(SETPOINT)

  // crude metrics: overshoot, settling
  const peak = Math.max(...curve.map((c) => c.y))
  const overshootPct = Math.max(0, ((peak - SETPOINT) / SETPOINT) * 100)
  const settled = settlingTime(curve,SETPOINT,2)

  return (
    <div className="pid-layout">
      <svg role="img" aria-label="PID step response over eight seconds" className="pid-chart" viewBox={`0 0 ${W} ${H}`}>
        {/* axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#d4d4d4" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#d4d4d4" />
        {/* setpoint line */}
        <line x1={PAD} y1={setY} x2={W - PAD} y2={setY} stroke="#92623c" strokeWidth={1.5} strokeDasharray="6 4" />
        <text x={W - PAD - 4} y={setY - 5} fill="#92623c" fontSize={10} fontFamily="monospace" textAnchor="end">setpoint={SETPOINT}</text>
        {/* response curve */}
        {pts.length > 1 && (
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#8C234A"
            strokeWidth={2.5}
          />
        )}
        {/* labels */}
        <text x={6} y={16} fill="#a3a3a3" fontSize={10} fontFamily="monospace">value</text>
        <text x={W - 40} y={H - 8} fill="#a3a3a3" fontSize={10} fontFamily="monospace">time (s)</text>
      </svg>

      <aside className="pid-controls">
        <Card title="PID Controller"><div className="joint-controls">
          <Range label="Kp" value={kp} min={0} max={20} step={.1} change={setKp}/>
          <Range label="Ki" value={ki} min={0} max={5} step={.1} change={setKi}/>
          <Range label="Kd" value={kd} min={0} max={.5} step={.01} change={setKD}/>
        </div></Card>
        <Card title="Response"><Readings rows={[
          ['Peak',peak.toFixed(1)],['Overshoot',`${overshootPct.toFixed(1)}%`],
          ['Settles within 2%',settled===null?'Beyond run window':`${settled.toFixed(2)} s`],
        ]}/><p className="solve-status">First-order plant · 20 ms step · bounded actuator effort</p></Card>
      </aside>
    </div>
  )
}
