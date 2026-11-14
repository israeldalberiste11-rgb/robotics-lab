import { CoordinateFrame, EngineeringFloor, RobotAppearance, useEngineering } from '../sim/Engineering'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { Environment, Grid, Html, Lightformer, Line, OrbitControls } from '@react-three/drei'
import { BufferGeometry, Float32BufferAttribute, PerspectiveCamera, Plane, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { IndustrialArm } from './IndustrialArm'
import { ARM, fk, HOME, JOINT_LIMITS, rad, toScene, type ArmPose, type Vec3 } from './kinematics'

export type CameraPreset = 'home' | 'front' | 'side' | 'top'
export type Overlay = 'angles' | 'trajectory' | 'workspace'

function CameraRig({ view, pose }: { view: { preset: CameraPreset; revision: number }; pose: ArmPose }) {
  const latestPose = useRef(pose)
  latestPose.current = pose
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera, size } = useThree()
  useEffect(() => {
    if (!controls.current) return
    const current = latestPose.current
    const yaw = rad(current.j1)
    const shoulder = rad(current.j2)
    const elbow = rad(current.j2 + current.j3)
    const height = ARM.baseHeight + ARM.shoulder
    const radialPoint = (radius: number, z: number) => new Vector3(radius * Math.cos(yaw), z, -radius * Math.sin(yaw))
    const tip = fk(current)
    const elbowR = ARM.upper * Math.cos(shoulder)
    const elbowZ = height + ARM.upper * Math.sin(shoulder)
    const points = [
      new Vector3(-.19, 0, -.19), new Vector3(.19, 0, .19),
      radialPoint(elbowR, elbowZ),
      radialPoint(elbowR + ARM.fore * Math.cos(elbow), elbowZ + ARM.fore * Math.sin(elbow)),
      new Vector3(...toScene(tip)),
    ]
    const min = points.reduce((a, b) => a.min(b), points[0].clone())
    const max = points.reduce((a, b) => a.max(b), points[0].clone())
    const target = min.clone().lerp(max, .5)
    target.y += .017
    const directions: Record<CameraPreset, [number, number, number]> = {
      home: [-.14, .27, 1], front: [0, .06, 1], side: [1, .08, 0], top: [0, 1, .001],
    }
    const aspect = size.width / Math.max(size.height, 1)
    const span = max.clone().sub(min)
    const distance = Math.max(1.4, (span.y + .17) / .64, (Math.hypot(span.x, span.z) + .14) / (.62 * Math.max(aspect, .1)))
    camera.position.copy(target).add(new Vector3(...directions[view.preset]).normalize().multiplyScalar(distance))
    controls.current.target.copy(target)
    if (camera instanceof PerspectiveCamera) camera.updateProjectionMatrix()
    controls.current.update()
  }, [camera, size.width, size.height, view])
  return <OrbitControls ref={controls} makeDefault enableDamping minDistance={.16} maxDistance={5} maxPolarAngle={Math.PI * .54} />
}

function Axes() {
  const origin: [number, number, number] = [-.3, .012, .19]
  const axes = [
    { label: 'x', end: [-.16, .012, .19] as const, color: '#fa8fa1' },
    { label: 'y', end: [-.3, .012, .05] as const, color: '#9ddb9d' },
    { label: 'z', end: [-.3, .152, .19] as const, color: '#a8b7ff' },
  ]
  return <>{axes.map(({ label, end, color }) => <group key={label}>
    <Line points={[origin, [...end]]} color={color} lineWidth={2} />
    <Html position={[...end]} center style={{ pointerEvents: 'none' }}><span className="axis-label" style={{ color }}>{label}</span></Html>
  </group>)}</>
}

function Workspace({ wrist }: { wrist: number }) {
  const geometry = useMemo(() => {
    const coords: number[] = []
    for (let j1 = -180; j1 < 180; j1 += 15) {
      for (let j2: number = JOINT_LIMITS.j2[0]; j2 <= JOINT_LIMITS.j2[1]; j2 += 13) {
        for (let j3: number = JOINT_LIMITS.j3[0]; j3 <= JOINT_LIMITS.j3[1]; j3 += 20) {
          const point = fk({ ...HOME, j1, j2, j3, wrist })
          if (point.z >= 0) coords.push(...toScene(point))
        }
      }
    }
    return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(coords, 3))
  }, [wrist])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <points geometry={geometry}><pointsMaterial color="#c683cf" size={.009} transparent opacity={.48} depthWrite={false} /></points>
}

function TargetMarker({ target, move, reachable }: { target: Vec3; move?: (target: Vec3) => void; reachable: boolean }) {
  const dragging = useRef(false)
  const { controls } = useThree()
  function stop() {
    dragging.current = false
    if (controls) (controls as OrbitControlsImpl).enabled = true
  }
  useEffect(() => stop, [controls])
  function drag(event: ThreeEvent<PointerEvent>) {
    if (!dragging.current || !move) return
    event.stopPropagation()
    const point = event.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -target.z), new Vector3())
    if (point) move({ x: Math.max(-1, Math.min(1, point.x)), y: Math.max(-1, Math.min(1, -point.z)), z: target.z })
  }
  return <group position={toScene(target)}>
    <mesh onPointerDown={move ? (event) => {
      event.stopPropagation()
      dragging.current = true
      if (controls) (controls as OrbitControlsImpl).enabled = false
      ;(event.target as Element).setPointerCapture(event.pointerId)
    } : undefined} onPointerMove={drag} onPointerUp={stop} onPointerCancel={stop}>
      <sphereGeometry args={[.025, 24, 16]} />
      <meshBasicMaterial color={reachable ? '#8B1E3F' : '#bb381e'} />
    </mesh>
    <Html position={[0, .042, 0]} center style={{ pointerEvents: 'none' }}><span className="joint-annotation">Target</span></Html>
  </group>
}

function ArmLabSet() {
  return <>
    <mesh position={[0,-.051,0]} receiveShadow><boxGeometry args={[1.75,.085,1.24]}/><meshStandardMaterial color="#c8ad8e" roughness={.72}/></mesh>
    <mesh position={[0,.23,-.91]}><boxGeometry args={[4,.65,.06]}/><meshStandardMaterial color="#d2c6b8"/></mesh>
    {[-1.4,-.48,.48,1.4].map(x=><group key={x}>
      <mesh position={[x,.75,-.9]}><boxGeometry args={[.84,.52,.04]}/><meshStandardMaterial color="#97bcc6" roughness={.25}/></mesh>
      <mesh position={[x-.45,.74,-.875]}><boxGeometry args={[.06,.58,.07]}/><meshStandardMaterial color="#575963"/></mesh>
    </group>)}
  </>
}

export function ArmScene({ pose, target, selected, onSelect, view, overlay, trail, light, moveTarget, targetReachable = true, showWorkspace, children, skeleton, onJointChange }: {
  pose: ArmPose; target: Vec3 | null; selected: string | null; onSelect: (joint: string | null) => void
  view: { preset: CameraPreset; revision: number }; overlay: Overlay; trail: Vec3[]; light: boolean; moveTarget?: (target: Vec3) => void; targetReachable?: boolean; showWorkspace?: boolean; children?: ReactNode; skeleton: boolean; onJointChange: (joint: Exclude<keyof ArmPose, 'grip'>, value: number) => void
}) {
  const engineering = useEngineering()
  const tcp = fk(pose)
  const footprint = toScene({ ...tcp, z: .004 })
  return <Canvas shadows dpr={[1, 1.6]} camera={{ position: [.3, .7, 1.5], fov: 37, near: .02, far: 35 }}
    onPointerMissed={() => onSelect(null)} fallback={<p className="scene-fallback">A WebGL-capable browser is required for the 3D view.</p>}>
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={3.2} position={[0, 3, 2]} rotation={[Math.PI / 4, 0, 0]} scale={[5, 3, 1]} />
      <Lightformer intensity={2} position={[-3, 1.5, -2]} rotation={[0, Math.PI * 1.22, 0]} scale={[4, 2, 1]} color="#b5bcff" />
      <Lightformer intensity={1.1} position={[2, 1, 3]} scale={[2, 4, 1]} />
    </Environment>
    <hemisphereLight args={['#f4e8ff', '#565269', .85]} />
    <directionalLight position={[1.7, 3, 1.9]} intensity={2.6} color="#fff0de" castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-1.5} shadow-camera-right={1.5}
      shadow-camera-top={1.5} shadow-camera-bottom={-1.5} shadow-normalBias={.012} />
    <directionalLight position={[-1, 1.7, -1.6]} intensity={1.8} color="#a8adff" />
    <mesh rotation-x={-Math.PI / 2} position={[0, -.008, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} /><shadowMaterial opacity={light ? .25 : .43} />
    </mesh>
    {engineering?.workspace ? <EngineeringFloor extent={5}/> : <ArmLabSet />}
    <RobotAppearance><IndustrialArm pose={pose} selected={selected} onSelect={onSelect}
      angles={overlay === 'angles' && engineering?.flags.angles !== false} skeleton={skeleton} onJointChange={onJointChange} /></RobotAppearance>
    {!engineering?.workspace && engineering?.flags.axes !== false && <Axes />}
    {engineering?.flags.tool !== false && <>
      <group position={toScene(tcp)} rotation-y={rad(pose.j1)}>
        <group rotation-z={rad(pose.j2+pose.j3+pose.wrist)}><CoordinateFrame size={.064}/></group>
      </group>
      <Line points={[toScene(tcp), footprint]} color={light ? '#8B1E3F' : '#e78bb8'} dashed dashSize={.016} gapSize={.009} lineWidth={1.4} />
    </>}
    {overlay === 'trajectory' && engineering?.flags.trail !== false && trail.length > 1 && <Line points={trail.map(toScene)} color="#ed81b2" lineWidth={2} />}
    {(overlay === 'workspace' || showWorkspace || engineering?.flags.reach) && <Workspace wrist={pose.wrist} />}
    {target && <TargetMarker target={target} move={moveTarget} reachable={targetReachable} />}
    {target && <group position={toScene(target)}>
      <Line points={[toScene(tcp).map((n, i) => n - toScene(target)[i]) as [number, number, number], [0, 0, 0]]}
        color="#f49fc4" dashed dashSize={.013} gapSize={.01} />
    </group>}
    {children}
    <CameraRig view={view} pose={pose} />
  </Canvas>
}
