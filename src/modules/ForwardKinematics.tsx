import { Inspector } from '../sim/Inspector'
import { EngineeringContext, WorkspaceOptions, useWorkspaceSettings } from '../sim/Engineering'
import { BlockControls, BlockGeometry, useBlockTask } from '../sim/BlockTask'
import { useEffect, useRef, useState } from 'react'
import { ArmScene, type CameraPreset, type Overlay } from '../arm/ArmScene'
import { ARM, HOME, JOINT_LIMITS, fk, ik, type ArmPose, type Vec3 } from '../arm/kinematics'
import { useStore } from '../store'

const JOINTS = [
  ['j1', 'θ₁', 'Base yaw'], ['j2', 'θ₂', 'Shoulder'], ['j3', 'θ₃', 'Elbow'],
  ['wrist', 'θ₄', 'Wrist pitch'], ['grip', '↔', 'Gripper opening'],
] as const
const VIEWS: [CameraPreset, string][] = [['home', 'Home'], ['front', 'Front'], ['side', 'Side'], ['top', 'Top']]
const PICK = { ...HOME, j1: 5, j2: 34, j3: -81, wrist: -25, grip: 60 }
const DROP = { ...PICK, j1: 48 }
const pickPoint = { ...fk(PICK), z: .018 }
const dropPoint = { ...fk(DROP), z: .018 }
const DEMO_DURATION = 10

function demo(time: number): ArmPose {
  const cycle = time * Math.PI * 2 / DEMO_DURATION
  return { ...HOME, j1: HOME.j1 + 44 * Math.sin(cycle), j2: HOME.j2 - 26 * (1 - Math.cos(cycle)) / 2,
    j3: HOME.j3 + 35 * (1 - Math.cos(cycle)) / 2, wrist: HOME.wrist + 20 * Math.sin(cycle),
    grip: HOME.grip - 50 * (1 - Math.cos(cycle)) / 2 }
}

function formatTarget(target: Vec3) {
  return { x: target.x.toFixed(3), y: target.y.toFixed(3), z: target.z.toFixed(3) }
}

function randomTarget() {
  return fk({ ...HOME, j1: Math.random() * 100 - 45, j2: 65 + Math.random() * 50, j3: -110 + Math.random() * 50 })
}

export function ForwardKinematics() { return <ArmLab /> }

export function ArmLab({ inverse = false }: { inverse?: boolean }) {
  const light = useStore((state) => state.light)
  const lesson = useStore((state) => state.lesson)
  const [pose, setPose] = useState<ArmPose>(HOME)
  const [selection, select] = useState<string | null>(null)
  const [overlay, setOverlay] = useState<Overlay>('angles')
  const [view, setView] = useState<{ preset: CameraPreset; revision: number }>({ preset: 'home', revision: 0 })
  const [engineering,setEngineering] = useWorkspaceSettings(true)
  const [inspector,setInspector] = useState(false)
  const [demoRun,setDemoRun] = useState(0)
  const [skeleton,setSkeleton] = useState(false)
  const [blockEnabled, setBlockEnabled] = useState(false)
  const [showWorkspace, setShowWorkspace] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [time, setTime] = useState(0)
  const [target, setTarget] = useState<Vec3>(() => inverse ? fk(HOME) : randomTarget())
  const [targetDraft, setTargetDraft] = useState(() => formatTarget(target))
  const [goalPose, setGoalPose] = useState<ArmPose | null>(null)
  const [trail, setTrail] = useState<Vec3[]>([])
  const viewport = useRef<HTMLDivElement>(null)
  const timeRef = useRef(0)
  const demoOffset = useRef<ArmPose | null>(null)
  const challenge = lesson === 'Challenge' && !inverse
  const activeTarget = challenge || inverse ? target : null
  const tcp = fk(pose)
  const error = Math.hypot(target.x - tcp.x, target.y - tcp.y, target.z - tcp.z)
  const block = useBlockTask(pickPoint, dropPoint, tcp, pose.grip <= 24)
  const solution = activeTarget && ik(target, pose)

  function move(next: ArmPose) {
    setPose(next)
    const point = fk(next)
    setTrail((previous) => {
      const last = previous[previous.length - 1]
      if (last && Math.hypot(point.x - last.x, point.y - last.y, point.z - last.z) < .002) return previous
      return [...previous.slice(-209), point]
    })
  }

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last: number | undefined
    const step = (now: number) => {
      if (last !== undefined) timeRef.current = (timeRef.current + Math.min((now - last) / 1000, .05) * speed) % DEMO_DURATION
      last = now
      const next = demo(timeRef.current)
      const offset = demoOffset.current
      if (offset) {
        for (const [key] of JOINTS) {
          const [min, max] = JOINT_LIMITS[key]
          next[key] = Math.min(max, Math.max(min, next[key] + offset[key]))
        }
      }
      setTime(timeRef.current)
      move(next)
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed])

  useEffect(() => {
    if (!goalPose) return
    const startPose = pose
    const start = performance.now()
    let frame = 0
    const interpolate = (now: number) => {
      const progress = Math.min(1, (now - start) / (demoRun ? 420/speed : 420))
      const eased = progress * progress * (3 - 2 * progress)
      const next = { ...startPose }
      for (const [key] of JOINTS) {
        next[key] = startPose[key] + (goalPose[key] - startPose[key]) * eased
      }
      move(next)
      if (progress < 1) frame = requestAnimationFrame(interpolate)
    }
    frame = requestAnimationFrame(interpolate)
    return () => cancelAnimationFrame(frame)
    // Capture the live pose when a new destination is submitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalPose])

  useEffect(() => {
    if (lesson === 'Visualization') setOverlay('trajectory')
    if (lesson === 'Concept') setOverlay('angles')
  }, [lesson])

  function reset() {
    setDemoRun(0); block.reset()
    setPlaying(false)
    setGoalPose(null)
    timeRef.current = 0
    demoOffset.current = null
    setTime(0)
    setPose(HOME)
    setTrail([fk(HOME)])
    select(null)
    if (inverse) { setTarget(fk(HOME)); setTargetDraft(formatTarget(fk(HOME))) }
  }

  function start() {
    const sample = demo(timeRef.current)
    demoOffset.current = { ...pose }
    for (const [key] of JOINTS) demoOffset.current[key] -= sample[key]
    setPlaying(true)
  }

  useEffect(()=>{
    if (!demoRun) return
    const pickup = ik({...pickPoint,z:.032},PICK)
    const drop = ik({...dropPoint,z:.055},DROP)
    const lift = ik({...pickPoint,z:.22},PICK)
    const carry = ik({...dropPoint,z:.22},DROP)
    if (!pickup || !drop || !lift || !carry) return
    const steps: [number,()=>void][] = [
      [0,()=>setGoalPose({...pickup,grip:70})],
      [560,()=>setGoalPose({...pickup,grip:15})],
      [1010,()=>block.demonstrate('grip')],
      [1080,()=>setGoalPose({...lift,grip:15})],
      [1630,()=>setGoalPose({...carry,grip:15})],
      [2180,()=>setGoalPose({...drop,grip:15})],
      [2730,()=>setGoalPose({...drop,grip:70})],
      [3190,()=>block.demonstrate('place')],
      [3290,()=>setGoalPose({...carry,grip:70})],
      [3800,()=>setDemoRun(0)],
    ]
    const timers=steps.map(([delay,action])=>window.setTimeout(action,delay/speed))
    return ()=>timers.forEach(timer=>window.clearTimeout(timer))
  },[demoRun])

  function startPickDemo() {
    setPlaying(false)
    setBlockEnabled(true)
    block.reset()
    setDemoRun(previous=>previous+1)
  }

  function changeJoint(key: keyof ArmPose, value: number) {
    setDemoRun(0)
    setPlaying(false)
    setGoalPose(null)
    select(key)
    move({ ...pose, [key]: value })
  }

  function updateTarget(next: Vec3) {
    setDemoRun(0)
    setTarget(next)
    const result = ik(next, pose)
    setGoalPose(result)
  }

  return <EngineeringContext.Provider value={engineering}><div className="arm-lab">
    <section className="lab-stage" ref={viewport} aria-label="Robot simulation">
      <div className="lab-scene">
        <ArmScene pose={pose} selected={selection} onSelect={select} view={view} overlay={overlay} trail={trail}
          target={challenge ? target : null} light={light} showWorkspace={inverse && showWorkspace}
          skeleton={skeleton} onJointChange={changeJoint}>{blockEnabled && <BlockGeometry task={block} />}</ArmScene>
      </div>
      <div className="stage-header">
        <div><h1>{inverse ? 'Inverse Kinematics' : 'Forward Kinematics'}</h1>
          <p>{inverse ? 'Drag a joint arc or enter XYZ to solve.' : 'Adjust the joint angles and watch the tool center point move.'}</p></div>
        <div className="camera-tools" aria-label="Camera views">
          {VIEWS.map(([preset, label]) => <button key={preset} aria-pressed={view.preset === preset} onClick={() => setView({ preset, revision: view.revision + 1 })}>{label}</button>)}
          <button aria-label="Toggle fullscreen" title="Toggle fullscreen" onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {})
            else void viewport.current?.requestFullscreen?.().catch(() => {})
          }}>⛶</button>
        </div>
      </div>
      {challenge && error < .025 && <div className="target-status" role="status">Target reached · {(error * 1000).toFixed(0)} mm away</div>}
      <div className="stage-hint">Drag pink arcs to move joints · Scroll to zoom</div>
      <div className="playback">
        <button aria-pressed={blockEnabled} onClick={() => setBlockEnabled(!blockEnabled)}>Block challenge</button>
        {!inverse && <>
          <button className={playing ? '' : 'is-active'} aria-label="Play demonstration" onClick={start} disabled={playing}>▶</button>
          <button aria-label="Pause demonstration" onClick={() => setPlaying(false)} disabled={!playing}>Ⅱ</button>
          <button aria-label="Reset simulation" onClick={reset}>↺</button>
          <label className="play-speed">Speed <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
            {[.25, .5, 1, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
          </select></label>
          <input className="scrub" aria-label="Simulation timeline" type="range" min="0" max={DEMO_DURATION} step=".01" value={time}
            onChange={(event) => {
              setPlaying(false)
              demoOffset.current = null
              timeRef.current = Number(event.target.value)
              setTime(timeRef.current)
              move(demo(timeRef.current))
            }} />
        </>}
        <button onClick={startPickDemo} disabled={Boolean(demoRun)}>Pick-and-place demo</button>
        <button aria-pressed={inspector} onClick={()=>setInspector(!inspector)}>Engineering Inspector</button>
        <button aria-pressed={skeleton} onClick={() => setSkeleton(!skeleton)}>Skeleton</button>
        <div className="overlays" aria-label="Engineering overlays">
          {(['angles', 'trajectory', 'workspace'] as const).map((mode) => <button key={mode} aria-pressed={overlay === mode} onClick={() => setOverlay(mode)}>{mode}</button>)}
        </div>
      </div>
    </section>
    <aside className="arm-controls" aria-label="Kinematics controls">
      {inspector && <Inspector close={()=>setInspector(false)} panels={[
        <p className="solve-status">TCP · {tcp.x.toFixed(3)}, {tcp.y.toFixed(3)}, {tcp.z.toFixed(3)} m</p>,
        <label className="sim-label">Joint <select value={selection??''} onChange={e=>select(e.target.value||null)}>
          <option value="">Select joint</option>{JOINTS.map(([key,,label])=><option key={key} value={key}>{label}</option>)}
        </select></label>,
        <div className="sim-buttons"><button aria-pressed={skeleton} onClick={()=>setSkeleton(!skeleton)}>Skeleton</button></div>,
        <div className="sim-buttons"><button onClick={()=>setOverlay('trajectory')}>Trace tool path</button></div>,
        <p className="equations">TCP = Rz(θ₁) · [r, 0, z]ᵀ</p>,
      ]}/>}
      <WorkspaceOptions settings={engineering} set={setEngineering} overlays={['axes','frames','angles','tool','trail','reach','limits']}/>
      {selection && selection in JOINT_LIMITS && <section className="lab-card">
        <div className="card-heading"><h2>Component inspection</h2></div>
        <p className="solve-status">{JOINTS.find(([id])=>id===selection)?.[2]} · {selection==='grip'?'Parallel jaw translation':selection==='j1'?'Rotation about local Z':'Rotation about local Y (negative axis)'} · 1 DOF</p>
        <p className="solve-status">{selection==='j1'?'Base → shoulder mount':selection==='j2'?'Shoulder → upper arm':selection==='j3'?'Upper arm → forearm':selection==='wrist'?'Forearm → tool mount':'Tool mount → jaws'}</p>
        <p className="solve-status">Range {JOINT_LIMITS[selection as keyof ArmPose].join(' to ')}{selection==='grip'?'%':'°'}</p>
      </section>}
      {blockEnabled && <><BlockControls task={block} /><div className="sim-buttons">
        <button onClick={() => { setPlaying(false); const next = { ...PICK, grip: pose.grip }; setGoalPose(ik({ ...block.position, z: block.position.z + .014 },next)) }}>Align to pickup</button>
        <button onClick={() => { setPlaying(false); setGoalPose(ik({ ...dropPoint, z: .055 }, { ...DROP, grip: pose.grip })) }}>Align to drop pad</button>
      </div></>}
      {inverse && <section className="lab-card">
        <div className="card-heading"><h2>Target position</h2><span>m</span></div>
        <form onSubmit={(event) => {
          event.preventDefault()
          const draft = { x: Number(targetDraft.x), y: Number(targetDraft.y), z: Number(targetDraft.z) }
          updateTarget(JSON.stringify(targetDraft) === JSON.stringify(formatTarget(target)) ? target : draft)
        }}>
          <div className="target-inputs">{(['x', 'y', 'z'] as const).map((axis) => <label key={axis}>{axis}
            <input type="number" required step="any" value={targetDraft[axis]}
              onChange={(event) => setTargetDraft({ ...targetDraft, [axis]: event.target.value })} />
          </label>)}</div>
          <div className="challenge-buttons solve-button"><button type="submit">Solve target</button></div>
        </form>
        <p className="solve-status" role="status">{solution ? error < .001 ? 'Target reached' : 'Reachable · wrist pitch held fixed' : 'Outside reach at this wrist angle and joint limits'}</p>
        <p className="solve-status">TCP error · {(error * 1000).toFixed(1)} mm</p>
        <label className="check-label"><input type="checkbox" checked={showWorkspace} onChange={(event) => setShowWorkspace(event.target.checked)} /> Show sampled reachable positions</label>
        {lesson === 'Challenge' && <div className="challenge-buttons"><button onClick={() => {
          const next = randomTarget()
          setGoalPose(null); setTarget(next); setTargetDraft(formatTarget(next))
        }}>New challenge target</button></div>}
      </section>}
      <section className="lab-card">
        <div className="card-heading"><h2>Joint Controls</h2><button onClick={reset}>Reset</button></div>
        <div className="joint-controls">
          {JOINTS.map(([key, symbol, label]) => {
            const [min, max] = JOINT_LIMITS[key]
            return <label key={key} className={selection === key ? 'joint-row selected' : 'joint-row'}>
              <span className="joint-title"><span><i>{symbol}</i> {label}</span><output title={engineering.flags.limits ? `Range ${min} to ${max}` : undefined}>{pose[key].toFixed(1)}{key === 'grip' ? '%' : '°'}</output></span>
              <input type="range" aria-label={label} min={min} max={max} step=".1" value={pose[key]}
                style={{ background: `linear-gradient(to right, var(--lab-accent) ${100 * (pose[key] - min) / (max - min)}%, var(--lab-track) 0)` }}
                onChange={(event) => { changeJoint(key, event.target.valueAsNumber) }} />
              {engineering.flags.limits && <small className="solve-status">{min} to {max}{key==='grip'?'%':'°'}</small>}
            </label>
          })}
        </div>
      </section>
      <section className="lab-card">
        <div className="card-heading"><h2>End-Effector (TCP)</h2><span>◎</span></div>
        <dl className="coordinates">{(['x', 'y', 'z'] as const).map((axis) => <div key={axis}><dt>{axis}</dt><dd>{tcp[axis].toFixed(3)} <small>m</small></dd></div>)}</dl>
        {engineering.flags.tool && <p className="solve-status">Yaw {pose.j1.toFixed(1)}° · Pitch {(pose.j2+pose.j3+pose.wrist).toFixed(1)}°</p>}
      </section>
      <section className="lab-card">
        <div className="card-heading"><h2>Kinematic Model</h2></div>
        <div className="equations">
          <div>r = L₁ cos θ₂ + L₂ cos a + L₃ cos b</div>
          <div>x = r cos θ₁, y = r sin θ₁</div>
          <div>z = h + L₁ sin θ₂ + L₂ sin a + L₃ sin b</div>
          <small>a = θ₂ + θ₃ · b = a + θ₄</small>
          <small>L₁ = {ARM.upper} m · L₂ = {ARM.fore} m · L₃ = {(ARM.wrist + ARM.hand).toFixed(3)} m · h = {(ARM.baseHeight + ARM.shoulder).toFixed(3)} m</small>
        </div>
      </section>
      {challenge && <section className="lab-card">
        <div className="card-heading"><h2>Reach the target</h2></div>
        <p className="solve-status">Distance to target · {(error * 1000).toFixed(0)} mm</p>
        <div className="challenge-buttons">
          <button onClick={() => setTarget(randomTarget())}>New target</button>
          <button onClick={() => { const result = ik(target, { ...pose, wrist: HOME.wrist }); if (result) { setPlaying(false); move(result) } }}>Reveal angles</button>
        </div>
      </section>}
    </aside>
  </div></EngineeringContext.Provider>
}
