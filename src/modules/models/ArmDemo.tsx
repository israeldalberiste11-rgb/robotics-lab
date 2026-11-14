import { useState } from 'react'
import { PHASES } from '../../lib/pick'
import { THEMES } from '../../lib/materials'
import { Card, Playback, Range, Workspace, useSimulation } from '../../sim/Controls'
import { Studio, type View } from '../../sim/Studio'
import { ArmModel, PHASE_SECONDS } from './ArmModel'

export function ArmDemo({ robots }: {robots: React.ReactNode}) {
  const [view,setView]=useState<View>('Orbit')
  const [playing,setPlaying]=useState(false)
  const [time,setTime]=useState(0)
  const [speed,setSpeed]=useState(1)
  const [theme,setTheme]=useState(THEMES[0].id)
  const duration=PHASE_SECONDS*PHASES.length
  const phase=PHASES[Math.floor(time/PHASE_SECONDS)]
  useSimulation(playing,speed,dt=>setTime(previous=>(previous+dt)%duration))
  return <Workspace title="Industrial arm demo" detail="Inspect each stage of the pick-and-place cycle."
    views={['Orbit','Front','Side','Top']} view={view} setView={setView}
    scene={<Studio view={view} scale={.8}><ArmModel time={time} mats={THEMES.find(item=>item.id===theme)!.swatches}/></Studio>}
    tools={<Playback playing={playing} toggle={()=>setPlaying(!playing)} reset={()=>{setTime(0);setPlaying(false)}} speed={speed} setSpeed={setSpeed}/>}>
    {robots}
    <Card title="Pick and place">
      <Range label="Cycle position" min={0} max={duration-.01} value={time} unit="s" change={value=>{setPlaying(false);setTime(value)}}/>
      <div className="sim-buttons">{PHASES.map((item,i)=><button key={item.label} aria-pressed={phase===item} onClick={()=>{setPlaying(false);setTime(i*PHASE_SECONDS)}}>{item.label}</button>)}</div>
    </Card>
    <Card title="Appearance"><label className="sim-label">Finish <select value={theme} onChange={event=>setTheme(event.target.value)}>
      {THEMES.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
    </select></label></Card>
  </Workspace>
}
