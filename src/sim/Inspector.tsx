import { useState, type ReactNode } from 'react'
const modes = ['Overview','Component Inspection','Mechanical Breakdown','Motion Analysis','Mathematical Model'] as const
export function Inspector({ panels, close, initialMode = 0 }: { panels: [ReactNode,ReactNode,ReactNode,ReactNode,ReactNode]; close:()=>void; initialMode?:number }) {
  const [mode,setMode] = useState(initialMode)
  return <section className="lab-card inspector" aria-label="Engineering Inspector">
    <div className="card-heading"><h2>Engineering Inspector</h2><button onClick={close} aria-label="Close inspector">×</button></div>
    <label className="sim-label">Mode <select value={mode} onChange={e=>setMode(Number(e.target.value))}>
      {modes.map((name,index)=><option key={name} value={index}>{name}</option>)}
    </select></label>
    <div className="inspector-content">{panels[mode]}</div>
  </section>
}
