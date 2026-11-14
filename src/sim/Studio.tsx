import { EngineeringFloor, useEngineering } from './Engineering'
import { CourseScenery } from './CourseScenery'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls, Sky } from '@react-three/drei'
import { Suspense, useEffect, useRef, type ReactNode } from 'react'
import { Vector3 } from 'three'
import type { Pose } from '../lib/drive'

export type View = 'Orbit' | 'Top' | 'Front' | 'Side' | 'Follow' | 'Sensor' | 'First person'
export const scenePoint = (x: number, y: number, height = 0): [number, number, number] => [x, height, -y]
export const origin: Pose = { x: 0, y: 0, theta: 0 }


function Camera({ view, pose, scale, framePose, focus, macro }: { view: View; pose: Pose; scale: number; framePose?: boolean; focus?:[number,number,number]; macro?:boolean }) {
  const { camera } = useThree()
  const current = useRef(pose)
  current.current = pose
  const initial = useRef(new Vector3())
  useEffect(() => {
    const positions: Partial<Record<View, [number, number, number]>> = {
      Orbit: [1, .83, 1.23], Top: [0, 1.9, .001], Front: [1.7, .31, 0], Side: [0, .35, 1.7],
    }
    const position = positions[view]
    if (position) {
      const target = framePose ? scenePoint(current.current.x,current.current.y,.12) : [0,scale<1?.16:0,0] as const
      initial.current.set(target[0],target[1],target[2])
      camera.position.set(...position).multiplyScalar(scale).add(initial.current)
      camera.lookAt(initial.current)
    }
  }, [view, camera, scale, framePose])
  useFrame(() => {
    if (focus) {
      const {x,y,theta}=current.current
      const [fx,fy,fz] = focus
      const center = new Vector3(x+fx*Math.cos(theta)+fz*Math.sin(theta),fy,-y-fx*Math.sin(theta)+fz*Math.cos(theta))
      const side = Math.sign(fz) || 1
      const closeUp = fy > .13
      const cameraAt = center.clone().add(new Vector3(macro ? -.032 : closeUp?.13:.27,macro ? .091 : closeUp?.12:.16,side*(macro ? .018 : closeUp?.10:.30)).applyAxisAngle(new Vector3(0,1,0),theta))
      camera.position.lerp(cameraAt,.12)
      camera.lookAt(center)
      return
    }
    if (view !== 'Follow' && view !== 'Sensor' && view !== 'First person') return
    const { x, y, theta } = current.current
    const a = Math.cos(theta), b = Math.sin(theta)
    if (view === 'Sensor' || view === 'First person') {
      camera.position.set(...scenePoint(x + .23 * a, y + .23 * b, .32))
      camera.lookAt(...scenePoint(x + 4 * a, y + 4 * b, .29))
    } else {
      camera.position.lerp(new Vector3(...scenePoint(x - .98 * a - .46 * b, y - .98 * b + .46 * a, .87)), .09)
      camera.lookAt(...scenePoint(x + .18 * a, y + .18 * b, .15))
    }
  })
  return focus === undefined && view === 'Orbit' ? <OrbitControls key={scale} target={initial.current} enableDamping maxPolarAngle={Math.PI * .49} minDistance={.4} maxDistance={30} /> : null
}

export function Studio({ children, view, pose = origin, scale = 1, outdoor = false, framePose, focus, macro }: {
  children: ReactNode; view: View; pose?: Pose; scale?: number; outdoor?: boolean; framePose?: boolean; focus?:[number,number,number]; macro?:boolean
}) {
  const settings = useEngineering()
  return <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 44, near: .025, far: 100 }}
    fallback={<p className="scene-fallback">Enable WebGL to use the 3D workspace.</p>}>
    <color attach="background" args={[outdoor ? '#d8e9ef' : '#faf6f1']} />
    {outdoor && <><Sky distance={65} sunPosition={[4, 6, 2]} turbidity={3} rayleigh={1.1} /><fog attach="fog" args={['#c4ddf1', 17, 48]} /><CourseScenery /></>}
    <hemisphereLight args={['#fff8ef', '#888292', 2]} />
    <directionalLight position={outdoor ? [-6,8,4] : [4,9,5]} color={outdoor ? '#ffe3ab' : '#ffffff'} intensity={outdoor ? 3.1 : 2.7} castShadow shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-normalBias={.018} />
    {!outdoor && <>
      <mesh rotation-x={-Math.PI / 2} position-y={-.012} receiveShadow>
        <planeGeometry args={[35, 35]} /><meshStandardMaterial color="#f5eee8" roughness={1} />
      </mesh>
      {!settings?.workspace && <Grid args={[20, 20]} cellSize={.2} sectionSize={1} cellColor="#cbb7bd" sectionColor="#a58b95" fadeDistance={8} fadeStrength={2} />}
    </>}
    <Suspense fallback={null}>{children}</Suspense>
    <EngineeringFloor />
    <Camera view={view} pose={pose} scale={scale} framePose={framePose} focus={focus} macro={macro} />
  </Canvas>
}
