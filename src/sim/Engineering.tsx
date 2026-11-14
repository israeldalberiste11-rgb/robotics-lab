import { Grid, Html, Line } from '@react-three/drei'
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Group, Mesh, MeshStandardMaterial } from 'three'

type XYZ = [number,number,number]
type Overlay = 'axes' | 'frames' | 'angles' | 'tool' | 'trail' | 'velocity' | 'sensors' | 'reach' | 'limits'
type Appearance = 'Solid' | 'Wireframe' | 'Transparent'
export interface EngineeringSettings {
  workspace: boolean
  grid: number
  appearance: Appearance
  measure: boolean
  flags: Record<Overlay,boolean>
}
export const EngineeringContext = createContext<EngineeringSettings | null>(null)
export const useEngineering = () => useContext(EngineeringContext)
const names: Record<Overlay,string> = {
  axes:'World axes', frames:'Local frames', angles:'Joint arcs', tool:'Tool pose', trail:'Trajectory',
  velocity:'Velocity vectors', sensors:'Sensor range', reach:'Reachability', limits:'Joint limits',
}
export function useWorkspaceSettings(workspace: boolean) {
  return useState<EngineeringSettings>(()=>({
    workspace, grid:.2, appearance:'Solid', measure:false,
    flags:{ axes:true, frames:false, angles:true, tool:true, trail:true, velocity:false, sensors:true, reach:false, limits:false },
  }))
}
export function WorkspaceOptions({ settings, set, overlays }: {
  settings: EngineeringSettings; set:(settings: EngineeringSettings)=>void; overlays: Overlay[]
}) {
  return <details className="lab-card engineering-options">
    <summary>Environment & inspection</summary>
    <label className="sim-label">Scene <select value={settings.workspace?'workspace':'immersive'} onChange={e=>set({...settings,workspace:e.target.value==='workspace',measure:false})}>
      <option value="workspace">Engineering Workspace</option><option value="immersive">Immersive Robotics Environment</option>
    </select></label>
    <label className="sim-label">Robot view <select value={settings.appearance} onChange={e=>set({...settings,appearance:e.target.value as Appearance})}>
      {['Solid','Wireframe','Transparent'].map(item=><option key={item}>{item}</option>)}
    </select></label>
    {settings.workspace && <label className="sim-label">Grid <select value={settings.grid} onChange={e=>set({...settings,grid:Number(e.target.value)})}>
      {[.05,.1,.2,.5,1].map(spacing=><option key={spacing} value={spacing}>{spacing} m</option>)}
    </select></label>}
    <div className="engineering-checks">{overlays.map(key=><label key={key} className="check-label">
      <input type="checkbox" checked={settings.flags[key]} onChange={e=>set({...settings,flags:{...settings.flags,[key]:e.target.checked}})}/>{names[key]}
    </label>)}</div>
    {settings.workspace && <label className="check-label"><input type="checkbox" checked={settings.measure} onChange={e=>set({...settings,measure:e.target.checked})}/> Measure on floor</label>}
  </details>
}

export function CoordinateFrame({ size=.23 }: { size?:number }) {
  const axes: [string,XYZ,string][] = [['X',[size,0,0],'#d23e49'],['Y',[0,0,-size],'#3a9361'],['Z',[0,size,0],'#3d6fce']]
  return <>{axes.map(([label,end,color])=><group key={label}>
    <Line points={[[0,0,0],end]} color={color} lineWidth={2.2}/>
    <Html position={end} center style={{pointerEvents:'none',color,fontSize:10,fontWeight:750}}>{label}</Html>
  </group>)}</>
}

function FloorMeasure({ extent }: {extent:number}) {
  const [points,setPoints] = useState<XYZ[]>([])
  const [a,b,c] = points
  const distance = a && b ? Math.hypot(a[0]-b[0],a[2]-b[2]) : 0
  const angle = a && b && c ? Math.abs(Math.atan2((a[0]-b[0])*(c[2]-b[2])-(a[2]-b[2])*(c[0]-b[0]),
    (a[0]-b[0])*(c[0]-b[0])+(a[2]-b[2])*(c[2]-b[2])))*180/Math.PI : null
  return <>
    <mesh rotation-x={-Math.PI/2} position-y={.003} onClick={e=>{
      e.stopPropagation()
      const point: XYZ = [e.point.x,.009,e.point.z]
      setPoints(previous=>previous.length===3?[point]:[...previous,point])
    }}>
      <planeGeometry args={[extent,extent]}/><meshBasicMaterial visible={false}/>
    </mesh>
    {points.length>1 && <Line points={points} color="#8B1E3F" lineWidth={2}/>}
    {points.map((point,i)=><mesh key={i} position={point}><sphereGeometry args={[.013,12,10]}/><meshBasicMaterial color="#8B1E3F"/></mesh>)}
    {a && <Html position={b??a} style={{pointerEvents:'none'}}><span className="joint-annotation">
      {b ? angle===null? `${distance.toFixed(3)} m · Pick point C` : `${distance.toFixed(3)} m · ${angle.toFixed(1)}°`
        : `X ${a[0].toFixed(2)} · Y ${(-a[2]).toFixed(2)} m · Pick B`}
    </span></Html>}
  </>
}

export function EngineeringFloor({ extent=20, gridY=-.005 }: {extent?:number;gridY?:number}) {
  const settings = useEngineering()
  if (!settings) return null
  return <>
    {settings.workspace && <Grid args={[extent,extent]} position-y={gridY} cellSize={settings.grid} sectionSize={settings.grid*5}
      cellColor="#d6cbd0" sectionColor="#ae9ca5" fadeDistance={extent} fadeStrength={1.5}/>}
    {settings.flags.axes && <CoordinateFrame size={.45}/>}
    {settings.workspace && settings.measure && <FloorMeasure extent={extent}/>}
  </>
}

export function RobotAppearance({ children }: {children: ReactNode}) {
  const appearance = useEngineering()?.appearance ?? 'Solid'
  const root = useRef<Group>(null)
  useLayoutEffect(()=>{
    if (appearance==='Solid') return
    const originals = new Map<MeshStandardMaterial,{wireframe:boolean; opacity:number; transparent:boolean; depthWrite:boolean}>()
    root.current?.traverse(object=>{
      if (!(object instanceof Mesh)) return
      for(const material of Array.isArray(object.material)?object.material:[object.material]){
        if (!(material instanceof MeshStandardMaterial) || originals.has(material)) continue
        originals.set(material,{wireframe:material.wireframe,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite})
        material.wireframe=appearance==='Wireframe'
        if (appearance==='Transparent') {material.opacity=.36;material.transparent=true;material.depthWrite=false}
        material.needsUpdate=true
      }
    })
    return ()=> originals.forEach((values,material)=>{Object.assign(material,values);material.needsUpdate=true})
  },[appearance,children])
  return <group ref={root}>{children}</group>
}

export function MotionVectors({ at, heading, v, omega }: {at:XYZ;heading:number;v:number;omega:number}) {
  if (!useEngineering()?.flags.velocity) return null
  const speed = v*.75
  const turn = Math.min(Math.PI*1.65,Math.abs(omega)) * Math.sign(omega)
  return <group position={at}>
    {Math.abs(v)>.001 && <Line points={[[0,0,0],[speed*Math.cos(heading),0,-speed*Math.sin(heading)]]} color="#287f71" lineWidth={3}/>}
    {Math.abs(omega)>.001 && <Line points={Array.from({length:20},(_,i):XYZ=>{
      const a=heading+turn*i/19
      return [.23*Math.cos(a),0,-.23*Math.sin(a)]
    })} color="#9b4678" lineWidth={3}/>}
  </group>
}
