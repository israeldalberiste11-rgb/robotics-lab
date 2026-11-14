import { EngineeringContext, MotionVectors, RobotAppearance, WorkspaceOptions, useWorkspaceSettings } from '../sim/Engineering'
import { useRef, useState } from 'react'
import { applyCommand, distance, free, GOAL, navigate, OBSTACLES, plan, sense, START, type Command, type Point, type Obstacle } from '../lib/sta'
import type { Pose } from '../lib/drive'
import { Card, Playback, Range, Readings, Workspace, useSimulation } from '../sim/Controls'
import { Field } from '../sim/Field'
import { DEFAULT_TRACK, Rover, WHEEL_RADIUS } from '../sim/Rover'
import { scenePoint, Studio, type View } from '../sim/Studio'
import { useRobotKeys, type Direction } from '../sim/keyboard'

type Edit = 'Goal' | 'Crate' | 'Barrier' | 'Move' | 'Remove'
type Mode = 'Autonomous' | 'Manual'
const directions = [['up','↑','Forward'],['left','←','Left'],['down','↓','Reverse'],['right','→','Right']] as const
const stopped = (action: string): Command => ({ v: 0, omega: 0, action })
interface Run { pose: Pose; spin: [number,number]; trail: Point[]; route: Point[]; cmd: Command; stops: number }
const initial = (): Run => ({ pose: START, spin: [0,0], trail: [START], route: plan(START,GOAL,OBSTACLES), cmd: stopped('Ready'), stops: 0 })

export function SenseThinkAct() {
  const [run, setRun] = useState(initial)
  const state = useRef(run)
  const [obstacles, setObstacles] = useState(OBSTACLES)
  const [goal, setGoal] = useState(GOAL)
  const [engineering,setEngineering] = useWorkspaceSettings(false)
  const [view, setView] = useState<View>('Orbit')
  const [mode, setMode] = useState<Mode>('Autonomous')
  const [playing, setPlaying] = useState(false)
  const [range,setRange] = useState(1.65)
  const [noise,setNoise] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [edit, setEdit] = useState<Edit>('Crate')
  const [selected, setSelected] = useState<string | null>(null)
  const [showScan, setShowScan] = useState(true)
  const [message, setMessage] = useState('')
  const input = useRef(new Set<Direction>())
  const buttons = useRef(new Set<Direction>())
  const [completed, setCompleted] = useState(false)
  const nextId = useRef(1)

  function commit(next: Run) { state.current = next; setRun(next) }
  function replan(nextGoal: Point, nextObstacles: Obstacle[]) {
    const route = plan(state.current.pose,nextGoal,nextObstacles)
    commit({ ...state.current, route, cmd: stopped(route.length ? 'Route updated' : 'No collision-free route') })
  }

  function stop() {
    input.current.clear()
    buttons.current.clear()
    setPlaying(false)
  }

  useRobotKeys((direction, pressed) => {
    if (pressed) {
      input.current.add(direction)
      setMode('Manual')
      setPlaying(true)
    } else input.current.delete(direction)
  }, stop)

  useSimulation(playing, speed, (dt) => {
    const previous = state.current
    const scan = sense(previous.pose,obstacles,{range,noise,sample:previous.spin[0]})
    const route = previous.route.length > 1 && distance(previous.pose,previous.route[0]) < .041 ? previous.route.slice(1) : previous.route
    const pressed = (key: Direction) => Number(input.current.has(key) || buttons.current.has(key))
    const linear = .48 * (pressed('up') - pressed('down'))
    const angular = 1.65 * (pressed('left') - pressed('right'))
    const cmd = mode === 'Autonomous' ? navigate(previous.pose,goal,route[0],scan)
      : { v: linear, omega: angular, action: linear || angular ? 'Manual' : 'Ready' }
    const motion = applyCommand(previous.pose,cmd,DEFAULT_TRACK,dt,obstacles)
    const trail = distance(previous.trail[previous.trail.length-1],motion.pose) > .044
      ? [...previous.trail.slice(-1599),motion.pose] : previous.trail
    const blocked = motion.blocked && (cmd.v !== 0 || cmd.omega !== 0)
    const result: Run = { ...previous, pose: motion.pose, route, trail, cmd,
      spin: [previous.spin[0] + motion.l * dt / WHEEL_RADIUS, previous.spin[1] + motion.r * dt / WHEEL_RADIUS] }
    if (blocked) {
      result.stops += Number(previous.cmd.action !== 'Safety stop at obstacle')
      result.cmd = stopped('Safety stop at obstacle')
      if (mode === 'Autonomous') result.route = plan(previous.pose,goal,obstacles)
    }
    commit(result)
    if (mode === 'Autonomous' && cmd.action === 'Destination reached') {
      setCompleted(obstacles.some(item => item.id.startsWith('Placed ')) && result.stops === 0)
    }
    if (mode === 'Autonomous' && (blocked || cmd.action === 'Destination reached' || cmd.action === 'No collision-free route')) setPlaying(false)
  })

  function ground(point: Point) {
    setMessage('')
    if (edit === 'Goal') {
      if (!free(point,obstacles)) { setMessage('Choose a destination on open ground with room for the rover.'); return }
      setCompleted(false); setGoal(point); replan(point,obstacles); return
    }
    if (edit === 'Remove') return
    if (edit === 'Move' && !selected) { setMessage('Select a movable crate or barrier first.'); return }
    const moving = obstacles.find((item) => item.id === selected)
    const candidate: Obstacle = edit === 'Move' && moving ? { ...moving,...point } : {
      ...point, id: `Placed ${edit.toLowerCase()} ${nextId.current}`, r: edit === 'Barrier' ? .53 : .34,
      kind: edit === 'Barrier' ? 'barrier' : 'crate',
    }
    const others = obstacles.filter((item) => item.id !== candidate.id)
    if (!free(candidate,others,candidate.r + .05) || [state.current.pose,START,goal].some((item) => distance(item,candidate) < candidate.r + .42)) {
      setMessage('Leave clearance around the rover, destination, start, and other objects.'); return
    }
    if (edit !== 'Move') nextId.current++
    setCompleted(false)
    const next = [...others,candidate]
    setObstacles(next); replan(goal,next); setSelected(null)
  }

  function reset() {
    stop(); setCompleted(false); setMessage(''); setSelected(null)
    setGoal(GOAL); setObstacles(OBSTACLES); nextId.current = 1; commit(initial())
  }
  const scan = sense(run.pose,obstacles,{range,noise,sample:run.spin[0]})
  const hits = [...new Set(scan.flatMap((ray) => ray.hit ? [ray.hit] : []))]
  const reached = distance(run.pose,goal) < .075
  const action = playing || run.cmd.v === 0 && run.cmd.omega === 0 ? run.cmd.action : 'Paused'
  return <EngineeringContext.Provider value={engineering}><Workspace title="Sense–Think–Act" detail=""
    views={['Orbit','Follow','First person','Top']} view={view} setView={setView}
    scene={<><Studio view={view} scale={5.35} pose={run.pose} outdoor={!engineering.workspace}>
      <Field obstacles={obstacles} goal={goal} pose={run.pose} route={run.route} trail={run.trail} scan={scan} showScan={showScan && engineering.flags.sensors} showTrail={engineering.flags.trail} technical={engineering.workspace}
        onGround={ground} onObstacle={(id) => {
          const object = obstacles.find(item => item.id === id)
          if (!object || object.kind === 'tree' || object.kind === 'shed') return
          if (edit === 'Remove') {
            const next = obstacles.filter(item => item.id !== id)
            setCompleted(false); setObstacles(next); replan(goal,next)
          } else if (edit === 'Move') {
            setSelected(id); setMessage('Click its new spot.')
          }
        }} />
      <RobotAppearance><Rover pose={run.pose} spin={run.spin} hide={view === 'First person'} /></RobotAppearance>
      <MotionVectors at={scenePoint(run.pose.x,run.pose.y,.15)} heading={run.pose.theta} v={playing?run.cmd.v:0} omega={playing?run.cmd.omega:0}/>
    </Studio>{view === 'First person' && <div className="sensor-hud">Simulated range view · Ahead {scan[5].distance.toFixed(2)} m</div>}</>}
    tools={<Playback playing={playing} toggle={() => {
      if (playing) { stop(); return }
      if (mode === 'Autonomous') {
        if (reached) commit({ ...initial(), route: plan(START,goal,obstacles) })
        else replan(goal,obstacles)
      }
      setPlaying(true)
    }} reset={reset} speed={speed} setSpeed={setSpeed} />}>
    <WorkspaceOptions settings={engineering} set={setEngineering} overlays={['axes', 'trail', 'velocity', 'sensors']}/>
    <Card title="Course">
      <div className="sim-buttons">{(['Autonomous','Manual'] as const).map(item => <button key={item}
        aria-pressed={mode === item} onClick={() => { stop(); setMode(item) }}>{item}</button>)}</div>
      <div className="sim-buttons">{(['Crate','Barrier','Move','Remove','Goal'] as const).map(item => <button key={item}
        aria-pressed={edit === item} onClick={() => {
          setEdit(item); setSelected(null); setMessage(''); if (view === 'First person') setView('Top')
        }}>{item}</button>)}</div>
      <p className="solve-status" role="status">{message || (edit === 'Move' || edit === 'Remove' ? 'Click an object.' : 'Click the grass to place.')}</p>
      {mode === 'Manual' && <div className="sim-buttons">{directions.map(([key,icon,label]) => <button key={key} aria-label={label}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); buttons.current.add(key); setPlaying(true) }}
        onLostPointerCapture={() => buttons.current.delete(key)}
        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { buttons.current.add(key); setPlaying(true) } }}
        onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') buttons.current.delete(key) }}
        onBlur={() => buttons.current.delete(key)}>{icon}</button>)}</div>}
      <label className="check-label"><input type="checkbox" checked={showScan} onChange={event => setShowScan(event.target.checked)} /> Sensor rays</label>
    </Card>
    <Card title="Challenge"><p className="solve-status" role="status">{completed ? 'Course complete.' : reached ? 'Add an object and run again.' : 'Place a crate or barrier. Reach the flag on autopilot without a safety stop.'}</p></Card>
    <details className="lab-card engineering-options"><summary>Sensor settings</summary><div className="joint-controls">
      <Range label="Range" min={.3} max={3} step={.05} value={range} unit="m" change={setRange}/>
      <Range label="Range error amplitude" min={0} max={.2} step={.01} value={noise} unit="m" change={setNoise}/>
      <p className="solve-status">11 rays · ±37.5° · deterministic distance error</p>
    </div></details>
    <Card title="Live telemetry"><Readings rows={[
      ['Sense', hits[0] || `${scan[5].distance.toFixed(2)} m clear`],
      ['Think', action],
      ['Act', `${(playing ? run.cmd.v : 0).toFixed(2)} m/s · ${(playing ? run.cmd.omega : 0).toFixed(2)} rad/s`],
      ['Safety stops', String(run.stops)],
    ]} /></Card>
    <p className="solve-status">Arrows or WASD · Space to stop</p>
  </Workspace></EngineeringContext.Provider>
}
