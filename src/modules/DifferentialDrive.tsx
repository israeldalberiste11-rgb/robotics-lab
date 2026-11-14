import { EXAMPLE, parseProgram, type Instruction } from '../lib/program'
import { readRuns, RUN_KEY, type DriveExperiment } from '../lib/experiments'
import { Inspector } from '../sim/Inspector'
import { applyCommand, distance, navigate, plan, sense, type Obstacle, type Point } from '../lib/sta'
import { Shell } from '../sim/Rover'
import { EngineeringContext, MotionVectors, RobotAppearance, WorkspaceOptions, useWorkspaceSettings } from '../sim/Engineering'
import { Woodland } from '../sim/Woodland'
import { useRobotKeys, type Direction } from '../sim/keyboard'
import { Grass } from '../sim/Field'
import { useRef, useState } from 'react'
import { Line } from '@react-three/drei'
import { turningRadius, type Pose } from '../lib/drive'
import { pidStep, type PIDGains, type PIDState } from '../lib/pid'
import { Card, Playback, Range, Readings, Workspace, useSimulation } from '../sim/Controls'
import { DEFAULT_TRACK, ELECTRONIC_CENTERS, ELECTRONIC_LIFT, ROVER_PARTS, Rover, WHEEL_RADIUS, type RoverPart } from '../sim/Rover'
import { origin, scenePoint, Studio, type View } from '../sim/Studio'
import { useStore } from '../store'

const PRESETS: [string, number, number][] = [
  ['Straight', .35, .35], ['Turn Left', .21, .38], ['Turn Right', .38, .21], ['Spin', -.26, .26], ['Reverse', -.3, -.3],
]
const target = { x:2.4, y:.8 }
const obstacles: Obstacle[] = [
  {x:.8,y:.3,r:.22,id:'Test barrier',kind:'barrier'},
  {x:1.6,y:-.6,r:.22,id:'Test crate',kind:'crate'},
]
type Pair = [number, number]
interface Sample { goal: Pair; actual: Pair }
interface Run { effort:Pair; pose: Pose; wheels: Pair; spin: Pair; trail: Pose[]; turn: number; distance:number; samples: Sample[] }
const initial = (): Run => ({ effort:[0,0], pose: origin, wheels: [0, 0], spin: [0, 0], trail: [origin], turn: 0, distance:0, samples: [] })
const motorState = (): [PIDState, PIDState] => [{ integral: 0, prevError: 0 }, { integral: 0, prevError: 0 }]

function SpeedGraph({ samples }: { samples: Sample[] }) {
  const path = (key: keyof Sample, wheel: 0 | 1) => samples.map((point, i) =>
    `${i * 218 / 119 + 1},${44 - Math.max(-.8, Math.min(.8, point[key][wheel])) * 49}`).join(' ')
  return <><svg viewBox="0 0 220 90" className="speed-graph" aria-label="Wheel speed history in meters per second" role="img">
    <path d="M1 44H219" stroke="#E7D8DD" />
    <polyline points={path('goal', 0)} stroke="#8B1E3F" strokeDasharray="3 3" fill="none" />
    <polyline points={path('goal', 1)} stroke="#356763" strokeDasharray="3 3" fill="none" />
    <polyline points={path('actual', 0)} stroke="#8B1E3F" strokeWidth="2" fill="none" />
    <polyline points={path('actual', 1)} stroke="#356763" strokeWidth="2" fill="none" />
  </svg><p className="solve-status">Left in burgundy, right in teal. Dashed traces show commands. Scale ±0.8 m/s.</p></>
}
function TrackMap({ pose, trail, open, route, automatic, delta }: { pose: Pose; trail: Pose[]; open: () => void; route:Point[]; automatic:boolean; delta:number }) {
  const extent = Math.max(automatic ? 2.8 : 1.5, ...trail.map(({ x, y }) => Math.max(Math.abs(x), Math.abs(y)) + .25))
  const k = 56 / extent
  const point = ({ x, y }: Point) => `${64 + x * k},${64 - y * k}`
  return <div className="drive-map lab-card">
    <button onClick={open} aria-label="Switch to overhead camera">Top view <span aria-hidden="true">↗</span></button>
    <svg viewBox="0 0 128 128" role="img" aria-label="Live rover position, heading, and traveled path">
      <defs><pattern id="drive-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#E7D8DD" /></pattern></defs>
      <rect width="128" height="128" fill="url(#drive-grid)" />
      {<>
        {obstacles.map(item=><circle key={item.id} cx={64+item.x*k} cy={64-item.y*k} r={item.r*k} fill="#a19191"/>)}
        <circle cx={64+target.x*k} cy={64-target.y*k} r="3" fill="#387c66"/>
        <polyline points={[pose,...route].map(point).join(' ')} fill="none" stroke="#387c66" strokeDasharray="2 2"/>
      </>}
      <circle cx="64" cy="64" r="2" fill="#B75D79" />
      <polyline points={[...trail, pose].map(point).join(' ')} fill="none" stroke="#8B1E3F" strokeWidth="1.6" strokeDasharray="4 3" />
      <path d="M7 0L-4 4L-4 -4Z" fill="#8B1E3F" transform={`translate(${64 + pose.x * k} ${64 - pose.y * k}) rotate(${-pose.theta * 180 / Math.PI})`} />
    </svg><small>Δv {delta.toFixed(2)} m/s</small>
  </div>
}

export function DifferentialDrive() {
  const lesson = useStore((state) => state.lesson)
  const [command, setCommand] = useState<Pair>([.21,.38])
  const [track, setTrack] = useState(DEFAULT_TRACK)
  const [program,setProgram]=useState(EXAMPLE)
  const [driveStatus,setDriveStatus]=useState('')
  const [programStatus,setProgramStatus]=useState('')
  const [activeLine,setActiveLine]=useState<number|null>(null)
  const [prediction,setPrediction]=useState('')
  const [saveStatus,setSaveStatus]=useState('')
  const [saved,setSaved]=useState(()=>{try{return readRuns(localStorage.getItem(RUN_KEY))}catch{return []}})
  const execution=useRef<{steps:Instruction[];index:number;elapsed:number}|null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [engineering,setEngineering] = useWorkspaceSettings(false)
  const [view, setView] = useState<View>('Orbit')
  const [motorMode, setMotorMode] = useState<DriveExperiment['motor']>('Ideal')
  const [gains, setGains] = useState<PIDGains>({ kp: 2, ki: 4, kd: .04 })
  const [inspector,setInspector] = useState(false)
  const [wheel,setWheel] = useState<number|null>(null)
  const [exploded,setExploded] = useState(false)
  const [assembly,setAssembly] = useState(false)
  const [part,setPart] = useState<RoverPart|null>(null)
  const [section,setSection] = useState(false)
  const [manualSpin,setManualSpin] = useState(0)
  const [arrows,setArrows] = useState(true)
  const [automatic,setAutomatic] = useState(false)
  const route = useRef<Point[]>([])
  const [run, setRun] = useState(initial)
  const state = useRef(run)
  const controller = useRef(motorState())
  const timer = useRef(0)
  function stopProgram() {
    if (!execution.current) return
    execution.current=null
    setActiveLine(null)
    setProgramStatus('Stopped.')
  }
  function reset() { setDriveStatus(''); stopProgram(); state.current = initial(); controller.current = motorState(); timer.current = 0; keys.current.clear(); setKeyboardDrive(false); setRun(state.current); setPlaying(false); setManualSpin(0); route.current=[] }
  const keys = useRef(new Set<Direction>())
  const [keyboardDrive, setKeyboardDrive] = useState(false)
  useRobotKeys((direction, pressed) => {
    if (pressed) { stopProgram(); setWheel(null); setAutomatic(false); keys.current.add(direction); setKeyboardDrive(true); setPlaying(true) }
    else keys.current.delete(direction)
  }, () => { stopProgram(); keys.current.clear(); setKeyboardDrive(false); setPlaying(false) })
  useSimulation(playing, speed, (dt) => {
    const active = (direction: Direction) => Number(keys.current.has(direction))
    const linear = .34 * (active('up') - active('down'))
    const yaw = 1.6 * (active('left') - active('right'))
    const job=execution.current
    const instruction=job?.steps[job.index]
    const previous = state.current
    if (automatic && route.current.length>1 && distance(previous.pose,route.current[0])<.065) route.current.shift()
    const navigation = automatic ? navigate(previous.pose,target,route.current[0],sense(previous.pose,obstacles)) : null
    if (navigation && !navigation.v && !navigation.omega) { setPlaying(false); setDriveStatus(navigation.action); return false }
    const goals: Pair = instruction ? [instruction.left,instruction.right] : navigation ? [navigation.v-navigation.omega*track/2,navigation.v+navigation.omega*track/2]
      : keyboardDrive ? [linear - yaw * track / 2, linear + yaw * track / 2] : command
    const effort: Pair = [0,0]
    const wheels = goals.map((goal, i) => {
      const actual = previous.wheels[i]
      if (motorMode === 'Ideal') return goal
      if (motorMode === 'Open loop') { effort[i] = goal; return actual + (.76 * goal - actual) * dt / .24 }
      const state = controller.current[i]
      const result = pidStep(goal, actual, gains, state, dt, .24, .8)
      controller.current[i] = result.state
      effort[i] = result.command
      return result.output
    }) as Pair
    const motion = applyCommand(previous.pose,{ v:(wheels[0]+wheels[1])/2,omega:(wheels[1]-wheels[0])/track,action:'Path following' },track,dt,obstacles)
    if (motion.blocked) {
      state.current={...previous,wheels:[0,0]}
      setRun(state.current)
      setDriveStatus('Stopped at an obstacle or the course boundary.')
      stopProgram()
      setPlaying(false)
      return false
    }
    const pose = motion.pose
    setDriveStatus('')
    const spin: Pair = [previous.spin[0] + wheels[0] * dt / WHEEL_RADIUS, previous.spin[1] + wheels[1] * dt / WHEEL_RADIUS]
    const last = previous.trail[previous.trail.length - 1]
    const trail = Math.hypot(last.x - pose.x, last.y - pose.y) > .03 ? [...previous.trail.slice(-899), pose] : previous.trail
    timer.current += dt
    const samples = timer.current >= .079 ? [...previous.samples.slice(-119), { actual: wheels, goal: goals }] : previous.samples
    if (samples !== previous.samples) timer.current = 0
    const turn = Math.abs(wheels[0] + wheels[1]) > .1 ? previous.turn + (pose.theta - previous.pose.theta) : 0
    state.current = { effort, pose, wheels, spin, trail, samples, turn, distance:previous.distance + Math.abs((wheels[0]+wheels[1])/2)*dt }
    setRun(state.current)
    if (job && instruction) {
      job.elapsed+=dt
      if (job.elapsed+1e-9>=instruction.seconds) {
        job.index++
        job.elapsed=0
        const next=job.steps[job.index]
        setActiveLine(next?.line??null)
        if (!next) {
          execution.current=null
          setPlaying(false)
          setProgramStatus('Program completed.')
          return false
        }
      }
    }
  })
  function startProgram() {
    try {
      const steps=parseProgram(program)
      reset()
      setWheel(null)
      setAutomatic(false)
      execution.current={steps,index:0,elapsed:0}
      setActiveLine(steps[0].line)
      setProgramStatus('Running.')
      setPlaying(true)
    } catch(error) {
      setProgramStatus(error instanceof Error?error.message:'Invalid program.')
    }
  }
  function saveRun() {
    const configuration={left:command[0],right:command[1],track,speed,program,motor:motorMode,...gains}
    const result={distance:run.distance,x:run.pose.x,y:run.pose.y,heading:run.pose.theta}
    const next=[{configuration,result},...saved].slice(0,5)
    try { localStorage.setItem(RUN_KEY,JSON.stringify(next));setSaved(next);setSaveStatus('Run saved.') }
    catch {setSaveStatus('Local storage is unavailable. Export CSV to keep the results.')}
  }
  function restore(c:DriveExperiment) {
    reset()
    setAutomatic(false)
    setWheel(null)
    setCommand([c.left,c.right])
    setTrack(c.track);setSpeed(c.speed);setProgram(c.program);setMotorMode(c.motor)
    setGains({kp:c.kp,ki:c.ki,kd:c.kd})
    setSaveStatus('Configuration restored at the start.')
  }
  function exportRuns() {
    const csv=['run,distance_m,x_m,y_m,heading_rad,left_setpoint_m_s,right_setpoint_m_s,track_m',...[{result:{distance:run.distance,x:run.pose.x,y:run.pose.y,heading:run.pose.theta},configuration:{left:command[0],right:command[1],track}},...saved]
      .map(({result:r,configuration:c},i)=>[i,r.distance,r.x,r.y,r.heading,c.left,c.right,c.track].join(','))].join('\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    const link=document.createElement('a')
    link.href=url;link.download='robotics-lab-runs.csv';link.click()
    window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  const [left, right] = run.wheels
  const rates: Pair = [left/WHEEL_RADIUS,right/WHEEL_RADIUS]
  const wheelRate = wheel===null ? 0 : rates[wheel<0?0:1]
  const displaySpin: Pair = [run.spin[0]+(wheel===-1?manualSpin:0),run.spin[1]+(wheel===1?manualSpin:0)]
  function selectWheel(side:number) { setPart(null); setWheel(side); setManualSpin(0); setInspector(true) }
  function closeInspector() { setInspector(false); setPart(null); setWheel(null); setManualSpin(0) }
  function selectPart(id:RoverPart) {
    setWheel(null)
    setPart(id)
    setInspector(true)
  }
  const electronics = part === 'controller' || part === 'driver' || part === 'sensor' ? part : null
  const component = electronics && ELECTRONIC_CENTERS[electronics]
  const focus: [number,number,number] | undefined = wheel !== null
    ? [0,WHEEL_RADIUS,wheel*(track/2+(exploded||assembly?.10:0))]
    : component && electronics ? [component[0],component[1]+(assembly?ELECTRONIC_LIFT[electronics]:0),component[2]] : undefined
  const sonarOffset = ELECTRONIC_CENTERS.sensor[0]+.014
  const sonar = part === 'sensor' && !assembly ? sense(run.pose,obstacles,{offset:sonarOffset,range:4,halfAngle:Math.PI/24,includeBoundary:false}) : []
  const echo = sonar.filter(reading=>reading.hit).sort((a,b)=>a.distance-b.distance)[0]
  function overhead() {
    setPart(null); setWheel(null); setView('Top')
    const stage = document.querySelector('.drive-scene')?.closest('.lab-stage')
    if (!document.fullscreenElement) void stage?.requestFullscreen?.().catch(()=>{})
  }
  const radius = turningRadius(left, right, track)
  const done = Math.abs(run.turn) >= 6.05 && Math.hypot(run.pose.x, run.pose.y) < .2 && run.trail.length > 15
  return <EngineeringContext.Provider value={engineering}><Workspace title="Differential Drive" detail="Independently command both wheels and see how their speeds shape the path."
    views={['Orbit','Top','Front','Side','Follow','First person']} view={view} setView={value=>{setWheel(null);setPart(null);setView(value)}}
    scene={<div className="drive-scene"><Studio view={view} pose={run.pose} scale={view==='Top'?3.5:1.05} focus={focus} macro={part==='controller'} framePose outdoor={!engineering.workspace}>
      {!engineering.workspace && <Grass />}
      {!engineering.workspace && <Woodland />}
      <RobotAppearance><Rover pose={run.pose} track={track} spin={displaySpin} hide={view==='First person' && !focus} selected={part} select={selectPart} wheelSide={wheel} pickWheel={selectWheel} breakdown={exploded} assembly={assembly} section={section} rates={arrows?rates:undefined} /></RobotAppearance>
      {sonar.map((ray,i)=><Line key={i} points={[
        scenePoint(run.pose.x+sonarOffset*Math.cos(run.pose.theta),run.pose.y+sonarOffset*Math.sin(run.pose.theta),ELECTRONIC_CENTERS.sensor[1]),
        scenePoint(run.pose.x+sonarOffset*Math.cos(run.pose.theta)+ray.distance*Math.cos(ray.angle),run.pose.y+sonarOffset*Math.sin(run.pose.theta)+ray.distance*Math.sin(ray.angle),ELECTRONIC_CENTERS.sensor[1]),
      ]} color={ray.hit?'#8C234A':'#278686'} transparent opacity={.35} />)}
      {<>
        {obstacles.map(item=><Shell key={item.id} at={scenePoint(item.x,item.y,.10)} size={item.kind==='barrier'?[.39,.20,.17]:[.29,.20,.29]} color="#9b6273"/>)}
        {automatic && <mesh position={scenePoint(target.x,target.y,.009)} rotation-x={-Math.PI/2}><ringGeometry args={[.13,.17,32]}/><meshBasicMaterial color="#387c66"/></mesh>}
        {route.current.length>0 && <Line points={[run.pose,...route.current].map(p=>scenePoint(p.x,p.y,.012))} color="#387c66" dashed dashSize={.07} gapSize={.04}/>}
      </>}
      <MotionVectors at={scenePoint(run.pose.x,run.pose.y,.15)} heading={run.pose.theta} v={playing?(left+right)/2:0} omega={playing?(right-left)/track:0}/>
      {engineering.flags.trail && run.trail.length > 1 && <Line points={run.trail.map(({ x, y }) => scenePoint(x,y,.008))} color="#8B1E3F" dashed dashSize={.052} gapSize={.025} lineWidth={3} />}
      <mesh rotation-x={-Math.PI/2} position-y={.004}><ringGeometry args={[.09,.095,36]} /><meshBasicMaterial color="#8B1E3F" /></mesh>
      <Line points={[[-1.7,.004,-1.3],[1.7,.004,-1.3],[1.7,.004,1.3],[-1.7,.004,1.3],[-1.7,.004,-1.3]]} color="#B75D79" lineWidth={3} />
    </Studio><TrackMap pose={run.pose} trail={run.trail} open={overhead} route={route.current} automatic={automatic} delta={right-left} /></div>}
    tools={<><Playback playing={playing} toggle={() => { keys.current.clear(); setKeyboardDrive(false); if(automatic&&!playing) route.current=plan(run.pose,target,obstacles); setPlaying(!playing) }} reset={reset} speed={speed} setSpeed={setSpeed} /><div className="drive-wheel-tools">
      <Range label="Left wheel" min={-.65} max={.65} value={command[0]} unit="m/s" change={(value) => setCommand([value,command[1]])} />
      <Range label="Right wheel" min={-.65} max={.65} value={command[1]} unit="m/s" change={(value) => setCommand([command[0],value])} />
    </div><div className="sim-buttons drive-presets">{PRESETS.map(([name,l,r]) => <button key={name}
      aria-pressed={command[0] === l && command[1] === r} onClick={() => { keys.current.clear(); setKeyboardDrive(false); stopProgram(); setAutomatic(false); setCommand([l,r]) }}>{name}</button>)}
      <button aria-pressed={automatic} onClick={()=>{reset();setWheel(null);setAutomatic(true);route.current=plan(origin,target,obstacles);setPlaying(true)}}>Path following</button>
      <button aria-pressed={inspector} onClick={()=>inspector?closeInspector():setInspector(true)}>Engineering Inspector</button>
    </div></>}>
    {inspector && <Inspector key={part??(wheel===null?"overview":"wheel")} initialMode={part?1:wheel===null?0:3} close={closeInspector} panels={[
      <Readings rows={[[ 'Wheel radius' ,`${WHEEL_RADIUS} m`],['Track',`${track.toFixed(2)} m`],['Distance',`${run.distance.toFixed(2)} m`]]}/>,
      <><label className="sim-label">Component <select value={part??''} onChange={event=>event.target.value?selectPart(event.target.value as RoverPart):setPart(null)}>
        <option value="">Choose a component</option>
        {Object.entries(ROVER_PARTS).filter(([id])=>id!=='wheel').map(([id,[title]])=><option key={id} value={id}>{title}</option>)}
      </select></label>
      <div className="sim-buttons"><button aria-pressed={wheel===-1} onClick={()=>selectWheel(-1)}>Left wheel</button><button aria-pressed={wheel===1} onClick={()=>selectWheel(1)}>Right wheel</button></div>
      <>{part && <p className="solve-status">{ROVER_PARTS[part][1]}</p>}
        {part==='controller' && <Readings rows={[[ 'Digital I/O','D0–D13 · 6 PWM-capable'],['Analog inputs','A0–A5'],['Signal paths','Digital → driver EN/IN and sonar TRIG/ECHO']]}/>}
        {part==='driver' && <Readings rows={motorMode==='Ideal'?[['PWM','Ideal mode bypasses the motor model']]:run.effort.map((effort,i)=>{
          const command = playing?effort:0
          return [i===0?'Left PWM':'Right PWM', `${Math.min(100,Math.abs(command)/.8*100).toFixed(0)}% · ${command===0?'Idle':command>0?'Forward':'Reverse'}`]
        })}/>}
        {part==='sensor' && <><Readings rows={[[ 'Simulated echo',assembly?'Sensor detached':!echo?'No return':echo.distance<.02?'Within minimum range':`${echo.distance.toFixed(2)} m · ${echo.hit}`]]}/>
          <p className="solve-status">The module estimates distance from round-trip sound time. Here, planar rays sample simplified obstacle footprints.</p></>}
      </></>,
      <><div className="sim-buttons"><button aria-pressed={assembly} onClick={()=>setAssembly(!assembly)}>{assembly?'Reassemble rover':'Explode rover'}</button></div><div className="sim-buttons"><button aria-pressed={exploded} onClick={()=>{if(wheel===null){setPart(null);setWheel(-1)}setExploded(!exploded)}}>Explode assembly</button>
        <button aria-pressed={section} onClick={()=>{if(wheel===null){setPart(null);setWheel(-1)}setSection(!section)}}>Expose hub</button></div>
        <p className="solve-status">Motor → bearing → shaft → hub → tire</p></>,
      <>{wheel===null ? <p className="solve-status">Select a wheel to inspect its motion.</p> : <>
        <Readings rows={[['Last wheel rate',`${wheelRate.toFixed(2)} rad/s`],['Last wheel RPM',`${(wheelRate*60/(2*Math.PI)).toFixed(1)} RPM`]]}/>
        {!playing && <Range label="Rotate wheel" min={-360} max={360} step={1} value={manualSpin*180/Math.PI} unit="°" change={value=>setManualSpin(value*Math.PI/180)}/>}
      </>}</>,
      <div className="equations">vL = rωL · vR = rωR<br/>v = (vR + vL) / 2<br/>ω = (vR − vL) / L<br/>RPM = 60ω / (2π)</div>,
    ]}/>}
    <details className="lab-card engineering-options"><summary>Programming</summary>
      <p className="solve-status"><code>DRIVE left right seconds</code> · <code>WAIT seconds</code> · <code># comment</code>. Use 0.02 s increments.</p>
      <label className="program-editor">Wheel program<textarea spellCheck={false} maxLength={12000} rows={6} value={program}
        onChange={e=>{if(execution.current){stopProgram();setPlaying(false)}setProgram(e.target.value)}}/></label>
      <div className="sim-buttons"><button onClick={startProgram}>Run program</button><button onClick={()=>{stopProgram();setPlaying(false)}}>Stop</button>
        <button onClick={()=>setProgram(EXAMPLE)}>Load example</button></div>
      <p className="solve-status" role="status">{activeLine===null?programStatus:`${playing?'Running':'Paused'} · line ${activeLine}`}</p>
    </details>
    <details className="lab-card engineering-options"><summary>Saved experiments</summary>
      <div className="sim-buttons"><button onClick={saveRun}>Save run</button><button onClick={exportRuns}>Export CSV</button></div>
      {saved.map(({configuration,result},i)=><div key={i} className="sim-buttons"><button onClick={()=>restore(configuration)}>Restore run {i+1}</button>
        <span className="solve-status">{result.distance.toFixed(2)} m · ({result.x.toFixed(2)}, {result.y.toFixed(2)})</span></div>)}
      <p className="solve-status" role="status">{saveStatus}</p>
    </details>
    <details className="lab-card engineering-options"><summary>Predict the turn</summary>
      <label className="sim-label">Which way? <select value={prediction} onChange={e=>setPrediction(e.target.value)}>
        <option value="">Choose…</option><option>Left</option><option>Right</option><option>No turn</option></select></label>
      {prediction && <p className="solve-status" role="status">{prediction===(command[1]>command[0]?'Left':command[1]<command[0]?'Right':'No turn')?'Correct. Run the experiment to observe the path.':'Compare the two wheel speeds and try again.'}</p>}
    </details>
    <WorkspaceOptions settings={engineering} set={setEngineering} overlays={['axes', 'trail', 'velocity']}/>
    <Card title="Wheel configuration"><p className="solve-status">Arrow keys or WASD drive from any camera. Space pauses.</p><label className="check-label"><input type="checkbox" checked={arrows} onChange={e=>setArrows(e.target.checked)}/> Wheel rotation arrows</label><div className="joint-controls">
      <Range label="Wheel separation" min={.25} max={.49} value={track} unit="m" change={setTrack} />
    </div></Card>
    <Card title="Motion telemetry">{driveStatus && <p className="solve-status" role="status">{driveStatus}</p>}<Readings rows={[
      ['Left / right', `${left.toFixed(2)} / ${right.toFixed(2)} m/s`], ['Linear speed', `${((left+right)/2).toFixed(2)} m/s`],
      ['Angular speed', `${((right-left)/track).toFixed(2)} rad/s`], ['Signed turning radius', radius === null ? '∞' : `${radius.toFixed(2)} m`],
      ['Wheel angular speed', `${rates.map(n=>n.toFixed(2)).join(' / ')} rad/s`],
      ['Wheel RPM', `${rates.map(n=>(n*60/(2*Math.PI)).toFixed(1)).join(' / ')}`],
      ['Distance', `${run.distance.toFixed(2)} m`],
      ['Heading', `${((run.pose.theta * 180 / Math.PI % 360 + 360) % 360).toFixed(0)}°`],
      ['Position (x, y)', `${run.pose.x.toFixed(2)}, ${run.pose.y.toFixed(2)} m`],
    ]} /></Card>
    {lesson === 'Challenge' && <Card title="Close the circle"><p className="solve-status" role="status">{done ? 'Circle complete. The rover returned to its start.' : 'Reset, then find two positive wheel speeds that return the rover to its start after one full turn.'}</p></Card>}
    <Card title="Motor response"><label className="sim-label">Motor model <select value={motorMode} onChange={(event) => { setMotorMode(event.target.value as DriveExperiment['motor']); controller.current = motorState() }}>
      {['Ideal','Open loop','PID'].map((mode) => <option key={mode}>{mode}</option>)}
    </select></label>
      {motorMode === 'PID' && <div className="joint-controls">{(['kp','ki','kd'] as const).map((key) =>
        <Range key={key} label={key.toUpperCase()} min={0} max={key === 'kd' ? .14 : key === 'ki' ? 9 : 4} step={key === 'kd' ? .005 : .05} value={gains[key]}
          change={(value) => setGains({ ...gains, [key]: value })} />)}</div>}
      <SpeedGraph samples={run.samples} />
    </Card>
  </Workspace></EngineeringContext.Provider>
}
