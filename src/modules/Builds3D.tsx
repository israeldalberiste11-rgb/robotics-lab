import { ArmDemo } from './models/ArmDemo'
import { Inspector } from '../sim/Inspector'
import { EngineeringContext, CoordinateFrame, MotionVectors, RobotAppearance, WorkspaceOptions, useWorkspaceSettings } from '../sim/Engineering'
import { useRobotKeys, type Direction } from '../sim/keyboard'
import { useRef, useState } from 'react'
import { DESIGNS, type RobotDesign } from '../lib/designs'
import type { Pose } from '../lib/drive'
import { applyCommand, navigate, plan, sense, type Point, type Obstacle } from '../lib/sta'
import { BuildCourse, BUILD_GOAL, DEFAULT_BLOCKS, ENVIRONMENTS, type Environment } from '../sim/BuildCourse'
import { Card, Playback, Range, Readings, Workspace, useSimulation } from '../sim/Controls'
import { DEFAULT_TRACK, ELECTRONIC_CENTERS, ELECTRONIC_LIFT, Rover, ROVER_PARTS, WHEEL_RADIUS, type RoverPart } from '../sim/Rover'
import { origin, scenePoint, Studio, type View } from '../sim/Studio'
import { PUPPER_PARTS, PupperAssembly } from './models/PupperAssembly'
import { hipOrigin, legPose, PUPPER, type XYZ } from '../lib/pupper'
import { useStore } from '../store'

export function Builds3D() {
  const [id, setId] = useState<RobotDesign['id']|'arm'>(() => {
    const model=new URLSearchParams(window.location.search).get('model')
    return model==='inmoov'||model==='arm'?'arm':model==='rover'?'rover':'pupper'
  })
  const robots=<Card title="Robot collection"><div className="sim-buttons">
    {DESIGNS.map(item=><button key={item.id} aria-pressed={id===item.id} onClick={()=>setId(item.id)}>{item.name}</button>)}
    <button aria-pressed={id==='arm'} onClick={()=>setId('arm')}>Industrial arm demo</button>
  </div></Card>
  return id==='arm'?<ArmDemo robots={robots}/>:<Build key={id} design={DESIGNS.find(item=>item.id===id)!} robots={robots}/>
}

function Build({ design, robots }: {design: RobotDesign; robots: React.ReactNode}) {
  const { id } = design
  const lesson = useStore((state) => state.lesson)
  const [exploded,setExploded] = useState(false)
  const [inspector,setInspector] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [engineering,setEngineering] = useWorkspaceSettings(false)
  const [view, setView] = useState<View>('Orbit')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [time, setTime] = useState(0)
  const [gait, setGait] = useState<'Walk' | 'Trot'>('Walk')
  const [roverDemo, setRoverDemo] = useState('Course')
  const [environment, setEnvironment] = useState<Environment>(ENVIRONMENTS[1])
  const [position, setPosition] = useState<Pose>(origin)
  const [trail, setTrail] = useState<Point[]>([origin])
  const [spin, setSpin] = useState<[number,number]>([0,0])
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS)
  const [edit, setEdit] = useState(false)
  const [manual, setManual] = useState(true)
  const [velocity,setVelocity] = useState({ v:0, omega:0 })
  const [stepping, setStepping] = useState(false)
  const [legKeys, setLegKeys] = useState(false)
  const [leg, setLeg] = useState(0)
  const [trims, setTrims] = useState([0,0,0,0])
  const [driveStatus, setDriveStatus] = useState('Ready')
  const input = useRef(new Set<Direction>())
  const motion = useRef({ pose: origin, spin: [0,0] as [number,number], trail: [origin] as Point[] })
  const obstacles: Obstacle[] = blocks.map((point,i)=>({...point,id:'Block '+(i+1),r:.215,kind:'crate'}))
  const route = useRef<Point[]>([])
  useRobotKeys((direction, pressed) => {
    if (id === 'pupper' && legKeys) {
      if (!pressed) return
      setPlaying(false)
      setStepping(false)
      if (direction === 'left' || direction === 'right') {
        setLeg(index => (index + (direction === 'right' ? 1 : 3)) % 4)
      } else {
        const delta = direction === 'up' ? 2 : -2
        setTrims(previous => previous.map((value, i) => i === leg ? Math.max(-24, Math.min(24, value + delta)) : value))
      }
      return
    }
    if (pressed) { input.current.add(direction); setManual(true); setPlaying(true) }
    else input.current.delete(direction)
  }, () => { input.current.clear(); setPlaying(false); setStepping(false) })
  useSimulation(playing,speed,(dt) => {
    const current = motion.current
    const key = (direction: Direction) => Number(input.current.has(direction))
    if (route.current.length>1 && Math.hypot(current.pose.x-route.current[0].x,current.pose.y-route.current[0].y)<.065) route.current.shift()
    const command = manual ? { v: (key('up')-key('down'))*.28, omega: (key('left')-key('right'))*1.4, action:'Manual control' }
      : id==='rover' && roverDemo!=='Course' ? {v:.16,omega:roverDemo==='Turn'?.55:0,action:'Drive demonstration'}
      : navigate(current.pose,BUILD_GOAL,route.current[0],sense(current.pose,obstacles))
    const limited = {...command,v:Math.max(-.32,Math.min(id==='pupper'&&gait==='Walk'?.19:.32,command.v))}
    const result = applyCommand(current.pose,limited,DEFAULT_TRACK,dt,obstacles)
    const wall = Math.max(Math.abs(result.pose.x),Math.abs(result.pose.y))>1.74
    if (result.blocked || wall) { setDriveStatus('Stopped at obstacle or boundary'); setPlaying(false); return false }
    const {pose} = result
    const last = current.trail[current.trail.length-1]
    const nextTrail = Math.hypot(last.x-pose.x,last.y-pose.y)>.025 ? [...current.trail.slice(-499),pose] : current.trail
    const nextSpin: [number,number] = [current.spin[0]+result.l*dt/WHEEL_RADIUS,current.spin[1]+result.r*dt/WHEEL_RADIUS]
    motion.current={pose,spin:nextSpin,trail:nextTrail}; setPosition(pose); setSpin(nextSpin); setTrail(nextTrail)
    setDriveStatus(command.action)
    setVelocity({v:(result.l+result.r)/2,omega:(result.r-result.l)/DEFAULT_TRACK})
    if (!manual && (!command.v && !command.omega)) setPlaying(false)
    setStepping(Boolean(command.v || command.omega))
    if (command.v || command.omega) setTime(previous=>previous+dt)
  })
  const parts = id === 'pupper' ? PUPPER_PARTS
    : Object.entries(ROVER_PARTS).map(([key,[name,detail]]) => ({ id:key, name, detail }))
  const chosen = parts.find((item) => item.id === selected)
  const legState = legPose(leg,time,gait,stepping,trims[leg],velocity.v,velocity.omega)
  const selectedLeg = selected?.match(/^(hip|upper|knee|foot)-(\d)$/)
  let focus: XYZ | undefined
  if (id==='pupper' && inspector && !exploded && selected) {
    if (selectedLeg) {
      const index=Number(selectedLeg[2])
      const side=index%2?1:-1
      const [x,y,z]=hipOrigin(index)
      const {pitch,knee,roll}=legPose(index,time,gait,stepping,trims[index],velocity.v,velocity.omega)
      const part=selectedLeg[1]
      const upper=part==='hip'?0:part==='upper'?PUPPER.upper*.5:PUPPER.upper
      const lower=part==='foot'?PUPPER.lower:0
      const drop=upper*Math.cos(pitch)+lower*Math.cos(pitch+knee)
      const lateral=side*(PUPPER.offset+(part==='hip'?0:.018))
      focus=[x+upper*Math.sin(pitch)+lower*Math.sin(pitch+knee),y-drop*Math.cos(roll)-lateral*Math.sin(roll),z-drop*Math.sin(roll)+lateral*Math.cos(roll)]
    } else focus=selected==='electronics'?[.02,PUPPER.height+.05,0]:[0,PUPPER.height,0]
  }
  if (id==='rover' && inspector && (selected==='controller'||selected==='driver'||selected==='sensor')) {
    const [x,y,z]=ELECTRONIC_CENTERS[selected]
    focus=[x,y+(exploded?ELECTRONIC_LIFT[selected]:0),z]
  }
  function reset() {
    setPlaying(false); setTime(0); setSelected(null); setExploded(false)
    motion.current={pose:origin,spin:[0,0],trail:[origin]}; setPosition(origin); setSpin([0,0]); setTrail([origin])
    setDriveStatus('Ready'); setStepping(false); input.current.clear()
  }
  function play() {
    if (!playing && !manual) {
      route.current = plan(position,BUILD_GOAL,obstacles).filter(point => Math.max(Math.abs(point.x),Math.abs(point.y))<1.74)
    }
    setPlaying(!playing)
  }
  function place(point: Point) {
    if (!edit || Math.max(Math.abs(point.x),Math.abs(point.y))>1.74 ||
      [position,BUILD_GOAL,...blocks.slice(1)].some(p=>Math.hypot(p.x-point.x,p.y-point.y)<.53)) return
    setBlocks([point,...blocks.slice(1)]); setPlaying(false); setEdit(false); setDriveStatus('Obstacle moved')
  }
  return <EngineeringContext.Provider value={engineering}><Workspace title={design.name} detail="Inspect the mechanisms and play a guided motion demonstration."
    views={['Orbit','Front','Side','Top','Follow','First person']} view={view} setView={value=>{setView(value);setSelected(null)}}
    scene={<Studio view={view} pose={position} scale={.79} focus={focus} macro={selected==='controller'} framePose outdoor={!engineering.workspace && environment===ENVIRONMENTS[1]}>
      <BuildCourse environment={engineering.workspace ? ENVIRONMENTS[2] : environment} blocks={blocks} mobile trail={engineering.flags.trail?trail:[]} moveBlock={place}/>
      <RobotAppearance>{id === 'pupper' && (view!=='First person'||focus) && <group position={scenePoint(position.x,position.y)} rotation-y={position.theta}><PupperAssembly time={time} gait={gait} selected={selected} select={setSelected} moving={stepping} trims={trims} speed={velocity.v} yaw={velocity.omega} exploded={exploded} /></group>}
      {id === 'rover' && <Rover pose={position} spin={spin} hide={view==='First person'&&!focus}
        selected={selected as RoverPart | null} select={setSelected} assembly={exploded} />}</RobotAppearance>
      <MotionVectors at={scenePoint(position.x,position.y,.15)} heading={position.theta} v={playing?velocity.v:0} omega={playing?velocity.omega:0}/>
      {engineering.flags.frames && <group position={scenePoint(position.x,position.y,.18)} rotation-y={position.theta}><CoordinateFrame size={.13}/></group>}
    </Studio>}
    tools={<><Playback playing={playing} toggle={play} reset={reset} speed={speed} setSpeed={setSpeed} />
      <button aria-pressed={inspector} onClick={()=>setInspector(!inspector)}>Engineering Inspector</button></>}>
    {robots}
    {inspector && <Inspector close={()=>setInspector(false)} panels={[
      <p className="solve-status">{design.name} · {design.principle}</p>,
      <label className="sim-label">Part <select value={selected??''} onChange={e=>setSelected(e.target.value||null)}>
        <option value="">Select component</option>{parts.map(part=><option key={part.id} value={part.id}>{part.name}</option>)}</select></label>,
      <div className="sim-buttons"><button aria-pressed={exploded} onClick={()=>setExploded(!exploded)}>{exploded?'Reassemble':'Explode assembly'}</button>{(['Solid','Wireframe','Transparent'] as const).map(appearance=><button key={appearance} aria-pressed={engineering.appearance===appearance} onClick={()=>setEngineering({...engineering,appearance})}>{appearance}</button>)}</div>,
      <Readings rows={[['Speed',`${(playing?velocity.v:0).toFixed(2)} m/s`],['Yaw rate',`${(playing?velocity.omega:0).toFixed(2)} rad/s`]]}/>,
      <p className="solve-status">{id==='pupper'?'Two-link leg IK uses the law of cosines for knee angle.': 'Yaw rate equals the wheel speed difference divided by track width.'}</p>,
    ]}/>}
    <WorkspaceOptions settings={engineering} set={setEngineering} overlays={['axes', 'trail', 'velocity', 'frames']}/>
    <Card title="Course">{!engineering.workspace && <label className="sim-label">Campus area <select value={environment} onChange={event=>setEnvironment(event.target.value as Environment)}>
      {ENVIRONMENTS.slice(0,2).map(item=><option key={item}>{item}</option>)}</select></label>}
      <div className="sim-buttons"><button aria-pressed={edit} onClick={()=>setEdit(!edit)}>{edit?'Click floor to place obstacle':'Move burgundy obstacle'}</button></div>
    </Card>
    <Card title="Drive controls"><div className="sim-buttons">
      <button aria-pressed={!manual} onClick={()=>{setManual(false);setPlaying(false);setLegKeys(false)}}>Autonomous</button>
      <button aria-pressed={manual} onClick={()=>{setManual(true);setPlaying(false);setLegKeys(false)}}>Manual</button>
      {manual && ([['up','Forward'],['left','Left'],['down','Reverse'],['right','Right']] as const).map(([key,label])=><button key={key}
        onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);input.current.add(key);setPlaying(true)}}
        onLostPointerCapture={()=>input.current.delete(key)} onPointerUp={()=>input.current.delete(key)}>{label}</button>)}
    </div><p className="solve-status">{'Arrow keys or WASD take manual control. Space stops. '}{driveStatus}</p></Card>
    <Card title="Inspect components">
      <label className="sim-label">Component <select value={selected ?? ''} onChange={(event) => setSelected(event.target.value || null)}>
        <option value="">Select a component</option>{parts.map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}
      </select></label>
      <p className="solve-status" role="status">{chosen ? chosen.detail : 'Click a component in the viewer or select it from the list.'}</p>
    </Card>
    <Card title="Motion demonstration">
      {id === 'pupper' && <>
        <div className="sim-buttons">{(['Walk','Trot'] as const).map((mode) => <button key={mode} aria-pressed={mode === gait} onClick={() => { setGait(mode); setTime(0) }}>{mode}</button>)}</div>
        <div className="sim-buttons"><button aria-pressed={legKeys} onClick={() => {
          input.current.clear(); setPlaying(false); setStepping(false); setLegKeys(!legKeys)
        }}>Leg keyboard control</button></div>
        {legKeys && <p className="solve-status">← / → select leg · ↑ / ↓ adjust reach</p>}
        <label className="sim-label">Leg <select value={leg} onChange={event=>setLeg(Number(event.target.value))}>
          {['Front left','Front right','Rear left','Rear right'].map((name,i)=><option key={name} value={i}>{name}</option>)}
        </select></label>
        <Readings rows={[[ 'Hip roll',`${(legState.roll*180/Math.PI).toFixed(1)}°`],['Hip pitch',`${(legState.pitch*180/Math.PI).toFixed(1)}°`],['Knee flexion',`${(-legState.knee*180/Math.PI).toFixed(1)}°`],['Gait phase',legState.stance?'Support':'Swing']]}/>
        <Range label="Leg reach trim" min={-24} max={24} step={1} value={trims[leg]} change={value=>setTrims(trims.map((item,i)=>i===leg?value:item))}/>
        <p className="solve-status">{gait === 'Trot' ? 'Diagonal pairs swing together. The other diagonal pair supports the frame.' : 'The legs swing in staggered phases. Watch the knees flex as each foot lifts.'}</p>
      </>}
      {id === 'rover' && <>
        <div className="sim-buttons">{['Course','Turn','Straight'].map((item) => <button key={item} aria-pressed={roverDemo === item} onClick={() => { setRoverDemo(item); setTime(0) }}>{item}</button>)}</div>

      </>}
    </Card>
    {lesson === 'Challenge' && <Card title="Identify the mechanism"><p className="solve-status" role="status">
      {id === 'pupper' ? selected?.startsWith('hip-0') || selected?.startsWith('knee-0') ? 'Correct. You found a front-left leg actuator.' : 'Select a front-left leg actuator.'
        : selected === 'caster' ? 'Correct. The passive caster supports the chassis.' : 'Select the wheel that supports the chassis without driving it.'}
    </p></Card>}
    <Card title="Build notes"><p className="solve-status">Procedural educational model inspired by {design.project}.</p>
      <Readings rows={design.specs.map(({ label,value }) => [label,value])} />
      <p className="solve-status"><a href={design.source} target="_blank" rel="noreferrer">Project source</a> · <a href={design.licenseUrl} target="_blank" rel="noreferrer">Source license reference</a></p>
    </Card>
  </Workspace></EngineeringContext.Provider>
}
