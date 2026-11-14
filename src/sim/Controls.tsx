import { useEffect, useRef, type ReactNode } from 'react'
import type { View } from './Studio'

export function useSimulation(active: boolean, speed: number, tick: (dt: number) => void | false) {
  const latest = useRef(tick)
  latest.current = tick
  useEffect(() => {
    if (!active) return
    let frame = 0, time = performance.now(), accumulated = 0
    function step(now: number) {
      accumulated += Math.min(.05, (now - time) / 1000) * speed
      time = now
      while (accumulated >= .02) {
        if (latest.current(.02) === false) return
        accumulated -= .02
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [active, speed])
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="lab-card"><div className="card-heading"><h2>{title}</h2></div>{children}</section>
}
export function Range({ label, value, min, max, step = .01, unit = '', change }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; change: (value: number) => void
}) {
  return <label className="joint-row"><span className="joint-title">{label}<output>{value.toFixed(step < 1 ? 2 : 0)} {unit}</output></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={value}
      style={{ background: `linear-gradient(to right, var(--lab-accent) ${100 * (value - min) / (max - min)}%, var(--lab-track) 0)` }}
      onChange={(event) => change(event.target.valueAsNumber)} /></label>
}
export function Readings({ rows }: { rows: [string, string][] }) {
  return <dl className="sim-readings">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}
export function Workspace({ title, detail, views, view, setView, scene, tools, children }: {
  title: string; detail: string; views: View[]; view: View; setView: (view: View) => void
  scene: ReactNode; tools: ReactNode; children: ReactNode
}) {
  return <div className="arm-lab sim-layout"><section className="lab-stage">
    <div className="stage-header"><div><h1>{title}</h1><p>{detail}</p></div>
      <div className="camera-tools" aria-label="Camera views"><label className="sim-label">Camera <select value={view} onChange={e=>setView(e.target.value as View)}>
        {views.map(item=><option key={item}>{item}</option>)}</select></label></div>
    </div>
    <div className="lab-scene">{scene}</div>
    <div className="playback">{tools}</div>
  </section><aside className="arm-controls">{children}</aside></div>
}
export function Playback({ playing, toggle, reset, speed, setSpeed }: {
  playing: boolean; toggle: () => void; reset: () => void; speed: number; setSpeed: (speed: number) => void
}) {
  return <><button className="is-active" onClick={toggle}>{playing ? 'Pause' : 'Play'}</button><button onClick={reset}>Reset</button>
    <label className="play-speed">Speed <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
      {[.25, .5, 1, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
    </select></label></>
}
