import { useRef, useState } from 'react'
import { useStore, type Lesson } from './store'
import { MODULES } from './modules'

const lessons: { name: Lesson; icon: string; body: string }[] = [
  { name: 'Overview', icon: '◇', body: 'Calculate the tool center point from known joint angles.' },
  { name: 'Concept', icon: '▤', body: 'Base yaw turns the entire arm around the vertical axis. Shoulder, elbow, and wrist pitch accumulate along the chain.' },
  { name: 'Visualization', icon: '⌁', body: 'Play the demonstration or move a slider to trace the TCP. The dashed line marks its projection onto the floor.' },
  { name: 'Experiment', icon: '⊞', body: 'Hold shoulder and elbow still. Change yaw and predict which coordinates will change. Then try opening and closing the gripper.' },
  { name: 'Challenge', icon: '◎', body: 'Move the TCP within 25 mm of the target using the joint sliders. Start with yaw, then adjust the pitch joints.' },
]

export default function App() {
  const { active, set, light, toggleTheme, lesson, setLesson } = useStore()
  const current = MODULES.find((module) => module.id === active)!
  const Active = current.Component
  const [sidebar, setSidebar] = useState(false)
  const [controls,setControls] = useState(true)
  const [focus,setFocus] = useState(false)
  const shell = useRef<HTMLDivElement>(null)
  const forward = active === 'forward-kinematics'
  const inverse = active === 'inverse-kinematics'
  const moduleLessons: Partial<Record<typeof active, Record<Lesson, string>>> = {
    'inverse-kinematics': { Overview: current.principle, Concept: 'Work backward from a target position. Each valid solution must satisfy the same forward equations.',
      Visualization: 'Use Skeleton and zoom to inspect the arm links and joints.',
      Experiment: 'Drag a pink joint arc, or enter XYZ and solve.',
      Challenge: 'Generate a new target and solve until the end-effector error is below 1 mm.' },
    'differential-drive': { Overview: current.principle, Concept: 'Equal speeds drive straight. The difference between wheel speeds creates yaw.',
      Visualization: 'Use Top view to compare the curved trajectory with the wheel-speed settings.',
      Experiment: 'Change wheel separation while keeping both wheel speeds fixed. Compare the resulting turning radii.',
      Challenge: 'Start from reset and use two positive wheel speeds to close a circle.' },
    'sense-think-act': { Overview: current.principle, Concept: 'Simulated range rays sense nearby obstacles, a route planner chooses waypoints, and the rover executes wheel commands.',
      Visualization: 'Compare the planned teal route, actual burgundy path, and sensor rays in Top and Sensor views.',
      Experiment: 'Add a crate on the route and watch the planner update the waypoints.',
      Challenge: 'Reach the destination after adding an obstacle without a safety stop.' },
    'builds-3d': { Overview: current.principle, Concept: 'Actuators produce movement through mechanical joints, transmissions, and linkages.',
      Visualization: 'Play a demonstration and use the camera presets to inspect the moving parts.',
      Experiment: 'Compare walk and trot timing, or drive the rover through the course.',
      Challenge: 'Use the viewer to identify the component described in the inspection challenge.' },
  }
  const interactive = forward || Boolean(moduleLessons[active])
  const overview = forward ? lessons.find((item) => item.name === lesson)!.body : moduleLessons[active]?.[lesson] ?? current.principle

  return <div ref={shell} className={`lab-shell ${light ? 'lab-light' : ''} ${focus || !controls ? 'hide-controls' : ''}`}>
    <header className="lab-header">
      <div className="lab-brand">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <span>Robotics Lab</span>
      </div>
      <nav className="module-nav"><label className="sim-label">Module <select value={active} onChange={e=>set(e.target.value as typeof active)}>
        {MODULES.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label></nav>
      <div className="header-tools">
        <button aria-pressed={!controls} onClick={()=>{setFocus(false);setControls(!controls)}}>Controls</button>
        <button aria-pressed={focus} onClick={()=>setFocus(!focus)}>Focus</button>
        <button onClick={()=>{ if(document.fullscreenElement) void document.exitFullscreen().catch(()=>{}); else void shell.current?.requestFullscreen?.().catch(()=>setFocus(true)) }}>Full screen</button>
        <button title="Toggle color theme" aria-label="Light theme" aria-pressed={light} onClick={toggleTheme}>{light ? '☾' : '☼'}</button>
        <button title="Toggle lesson sidebar" aria-label="Show lessons" aria-expanded={sidebar} onClick={() => setSidebar(!sidebar)}>☷</button>
      </div>
    </header>
    <div className="lab-body">
      {sidebar && !focus && <aside className="lesson-sidebar" aria-label="Lessons">
        <section className="lab-card lesson-list">
          <h2>Learn</h2>
          {interactive ? lessons.map((item) => <button key={item.name} aria-pressed={lesson === item.name} onClick={() => setLesson(item.name)}>
            <span aria-hidden="true">{item.icon}</span>{item.name === 'Overview' ? current.title : item.name}
          </button>) : <div className="lesson-current">{current.title}</div>}
        </section>
        <section className="lab-card lesson-copy">
          <h2>{interactive ? lesson : 'Overview'}</h2><p>{overview}</p>
        </section>
      </aside>}
      <main className={interactive ? 'lab-main' : 'lab-main legacy-module'}><Active /></main>
    </div>
  </div>
}
