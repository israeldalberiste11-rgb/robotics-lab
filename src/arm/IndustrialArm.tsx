import { CoordinateFrame, useEngineering } from '../sim/Engineering'
import { Html, Line, RoundedBox } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3, Group, Plane, Ray } from 'three'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { ARM, JOINT_LIMITS, rad, type ArmPose } from './kinematics'

type XYZ = [number, number, number]
const orange = '#ff7619'
const dark = '#252630'
const steel = '#9da5ae'
const black = '#13141a'

function Surface({ color }: { color: string }) {
  return <meshStandardMaterial color={color} metalness={color === orange ? .34 : .64} roughness={color === black ? .53 : .3} />
}

function Box({ size, at, color, radius = .008 }: { size: XYZ; at: XYZ; color: string; radius?: number }) {
  return <RoundedBox args={size} position={at} radius={radius} smoothness={3} castShadow receiveShadow><Surface color={color} /></RoundedBox>
}

function Cylinder({ at, radius, depth, color, axis = 'y', sides = 48, taper = 1 }: {
  at: XYZ; radius: number; depth: number; color: string; axis?: 'x' | 'y' | 'z'; sides?: number; taper?: number
}) {
  return <mesh position={at} rotation={axis === 'z' ? [Math.PI / 2, 0, 0] : axis === 'x' ? [0, 0, Math.PI / 2] : [0, 0, 0]} castShadow receiveShadow>
    <cylinderGeometry args={[radius * taper, radius, depth, sides]} /><Surface color={color} />
  </mesh>
}

function Cable({ length, width, side }: { length: number; width: number; side: number }) {
  const curve = useMemo(() => new CatmullRomCurve3([
    new Vector3(-.028, width * .45, side), new Vector3(.025, width * .95, side),
    new Vector3(length * .42, width * .88, side), new Vector3(length - .03, width * .75, side),
    new Vector3(length + .018, width * .24, side),
  ]), [length, width, side])
  return <mesh castShadow><tubeGeometry args={[curve, 24, .008, 8, false]} /><Surface color={black} /></mesh>
}

function LinkShell({ length, width, depth, skeleton }: { length: number; width: number; depth: number; skeleton: boolean }) {
  if (skeleton) return <group>
    {[-1,1].map(side => <group key={side}>
      <Box size={[length*.88,.023,.022]} at={[length/2,0,side*depth*.42]} color="#ded4c3" />
      <Cable length={length} width={width} side={side*depth*.43} />
    </group>)}
    {[.17,.39,.61,.83].map(t => <Box key={t} size={[.025,width*.54,depth]} at={[length*t,0,0]} color="#bc7955" />)}
  </group>
  return <group>
    <Box size={[length * .95, width * .94, depth]} at={[length / 2, 0, 0]} color={orange} radius={.025} />
    <Box size={[length * .68, width * .46, depth + .008]} at={[length / 2, -.012, 0]} color={orange} radius={.014} />
    <Box size={[length * .59, .022, depth * .65]} at={[length * .52, width * .53, 0]} color={dark} />
    {[-1, 1].map((side) => <group key={side}>
      <Cable length={length} width={width} side={side * depth * .43} />
      {[.27, .73].map((t) => <Cylinder key={t} at={[length * t, -.019, side * (depth / 2 + .005)]} radius={.006} depth={.004} color={dark} axis="z" sides={6} />)}
    </group>)}
  </group>
}

function Joint({ radius, depth, active }: { radius: number; depth: number; active: boolean }) {
  return <>
    <Cylinder at={[0, 0, 0]} radius={radius} depth={depth} color={dark} axis="z" />
    {[-1, 1].map((side) => <group key={side} position={[0, 0, side * depth / 2]}>
      <Cylinder at={[0, 0, side * .009]} radius={radius * .87} depth={.019} color={orange} axis="z" />
      <Cylinder at={[0, 0, side * .022]} radius={radius * .66} depth={.01} color={steel} axis="z" />
      <Cylinder at={[0, 0, side * .029]} radius={radius * .57} depth={.009} color={dark} axis="z" />
      {Array.from({length:6},(_,i)=> {
        const theta=i*Math.PI/3
        return <Cylinder key={i} at={[radius*.75*Math.cos(theta),radius*.75*Math.sin(theta),side*.021]} radius={radius*.038} depth={.006} color={steel} axis="z" sides={6}/>
      })}
      <mesh position={[0, 0, side * .032]}>
        <torusGeometry args={[radius * .61, active ? .004 : .0018, 8, 48]} />
        <meshBasicMaterial color={active ? '#ffe1f3' : '#dc759f'} />
      </mesh>
    </group>)}
  </>
}

type RotaryJoint = Exclude<keyof ArmPose, 'grip'>
type JointChange = (joint: RotaryJoint, value: number) => void

function Indicator({ angle, radius, axis, label, joint, onChange }: {
  angle: number; radius: number; axis: 'yaw' | 'pitch'; label: string; joint: RotaryJoint; onChange: JointChange
}) {
  const group = useRef<Group>(null)
  const controls = useThree(state => state.controls) as { enabled: boolean } | null
  const drag = useRef<{ pointer: number; angle: number; last: number } | null>(null)
  const [min,max] = JOINT_LIMITS[joint]
  function stop() {
    if (!drag.current) return
    drag.current = null
    if (controls) controls.enabled = true
    document.body.style.cursor = ''
  }
  useEffect(() => stop, [controls])
  function pointerAngle(event: ThreeEvent<PointerEvent>) {
    if (!group.current) return null
    const origin = group.current.worldToLocal(event.ray.origin.clone())
    const end = group.current.worldToLocal(event.ray.at(1,new Vector3()))
    const ray = new Ray(origin,end.sub(origin).normalize())
    const plane = axis === 'yaw' ? new Plane(new Vector3(0,1,0),0) : new Plane(new Vector3(0,0,1),-.102)
    const point = ray.intersectPlane(plane,new Vector3())
    if (!point || Math.hypot(point.x, axis === 'yaw' ? point.z : point.y) < .02) return null
    return Math.atan2(axis === 'yaw' ? -point.z : point.y,point.x)
  }
  function down(event: ThreeEvent<PointerEvent>) {
    if (event.button !== 0 || drag.current) return
    const last = pointerAngle(event)
    if (last === null) return
    event.stopPropagation()
    drag.current = { pointer:event.pointerId, angle, last }
    if (controls) controls.enabled = false
    ;(event.target as Element).setPointerCapture(event.pointerId)
    document.body.style.cursor = 'grabbing'
    onChange(joint,angle)
  }
  function move(event: ThreeEvent<PointerEvent>) {
    const active = drag.current
    if (!active || event.pointerId !== active.pointer) return
    event.stopPropagation()
    const next = pointerAngle(event)
    if (next === null) return
    const delta = next-active.last
    active.angle = Math.max(min,Math.min(max,active.angle + Math.atan2(Math.sin(delta),Math.cos(delta))*180/Math.PI))
    active.last = next
    onChange(joint,active.angle)
  }
  const points = Array.from({ length: 25 }, (_, i): XYZ => {
    const t = rad(angle) * i / 24
    return axis === 'yaw' ? [radius * Math.cos(t), 0, -radius * Math.sin(t)] : [radius * Math.cos(t), radius * Math.sin(t), .102]
  })
  const endpoint = points[24]
  const track = Array.from({length:49},(_,i): XYZ => {
    const t = rad(min+(max-min)*i/48)
    return axis === 'yaw' ? [radius*Math.cos(t),0,-radius*Math.sin(t)] : [radius*Math.cos(t),radius*Math.sin(t),.102]
  })
  return <group ref={group} onPointerDown={down} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
    <Line points={track} color="#ed86b2" lineWidth={1} transparent opacity={.28} depthWrite={false} />
    <Line points={track} color="#ed86b2" lineWidth={14} transparent opacity={0} depthWrite={false} />
    {Math.abs(angle) > .01 && <Line points={points} color="#ed86b2" lineWidth={1.6} />}
    <mesh position={endpoint}><sphereGeometry args={[.011, 14, 10]} /><meshBasicMaterial color="#ffc2dc" /></mesh>
    <Html position={axis === 'yaw' ? [-.19, .035, .08] : [-.085, radius * .77, .12]} center style={{ pointerEvents: 'none' }}>
      <span className="joint-annotation">{label} {angle.toFixed(1)}°</span>
    </Html>
  </group>
}

export function IndustrialArm({ pose, selected, onSelect, angles, skeleton, onJointChange }: {
  pose: ArmPose; selected: string | null; onSelect: (joint: string | null) => void; angles: boolean; skeleton: boolean; onJointChange: JointChange
}) {
  const showFrames = useEngineering()?.flags.frames
  const frame = (id: string) => (showFrames || selected === id) && <CoordinateFrame size={.085} />
  const choose = (id: string, children: ReactNode) => <group
    onClick={(event) => { event.stopPropagation(); onSelect(selected === id ? null : id) }}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}
  >{children}</group>
  return <group onPointerOut={() => { document.body.style.cursor = '' }}>
    <Box size={[.345, .042, .32]} at={[0, .022, 0]} color={dark} radius={.019} />
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <group key={`${x}/${z}`}>
      <Cylinder at={[x * .139, .045, z * .123]} radius={.016} depth={.007} color={dark} />
      <Cylinder at={[x * .139, .052, z * .123]} radius={.011} depth={.012} color={steel} sides={6} />
    </group>))}
    <Cylinder at={[0, .053, 0]} radius={.132} depth={.024} color={steel} />
    <Cylinder at={[0, .097, 0]} radius={.122} depth={.088} color={dark} taper={.94} />
    <Box size={[.086, .046, .008]} at={[0, .094, .12]} color={black} />
    {choose('j1', <>
      <Cylinder at={[0, .148, 0]} radius={.119} depth={.022} color={steel} />
      <mesh position={[0, .153, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[.121, selected === 'j1' ? .0045 : .0018, 8, 64]} />
        <meshBasicMaterial color={selected === 'j1' ? '#ffe1f3' : '#db759d'} />
      </mesh>
    </>)}
    {angles && <group position={[0, .155, 0]}><Indicator angle={pose.j1} radius={.153} axis="yaw" label="θ₁" joint="j1" onChange={onJointChange} /></group>}
    <group rotation-y={rad(pose.j1)}>
      <group position-y={.155}>{frame('j1')}</group>
      <Box size={[.135, .087, .126]} at={[0, .189, 0]} color={orange} radius={.023} />
      <group position={[0, ARM.baseHeight + ARM.shoulder, 0]}>
        {choose('j2', <Joint radius={.077} depth={.148} active={selected === 'j2'} />)}
        {angles && <Indicator angle={pose.j2} radius={.112} axis="pitch" label="θ₂" joint="j2" onChange={onJointChange} />}
        <group rotation-z={rad(pose.j2)}>
          {frame('j2')}
          <LinkShell skeleton={skeleton} length={ARM.upper} width={.116} depth={.103} />
          <group position={[ARM.upper, 0, 0]}>
            {choose('j3', <Joint radius={.067} depth={.12} active={selected === 'j3'} />)}
            {angles && <Indicator angle={pose.j3} radius={.093} axis="pitch" label="θ₃" joint="j3" onChange={onJointChange} />}
            <group rotation-z={rad(pose.j3)}>
              {frame('j3')}
              <LinkShell skeleton={skeleton} length={ARM.fore} width={.093} depth={.086} />
              <group position={[ARM.fore, 0, 0]}>
                {choose('wrist', <Joint radius={.046} depth={.083} active={selected === 'wrist'} />)}
                {angles && <Indicator angle={pose.wrist} radius={.067} axis="pitch" label="θ₄" joint="wrist" onChange={onJointChange} />}
                <group rotation-z={rad(pose.wrist)}>
                  {frame('wrist')}
                  <Cylinder at={[.032, 0, 0]} radius={.044} depth={.063} color={dark} axis="x" />
                  <Cylinder at={[.055, 0, 0]} radius={.046} depth={.009} color={steel} axis="x" />
                  <Box size={[.055, .064, .081]} at={[.078, 0, 0]} color={dark} radius={.012} />
                  <group position={[ARM.wrist, 0, 0]}>
                    {frame('grip')}
                    {choose('grip', <>
                      <Box size={[.024, .05, .072]} at={[.01, 0, 0]} color={black} />
                      {[-1, 1].map((side) => <group key={side} position={[0, 0, side * (.014 + pose.grip * .00032)]}>
                        <Box size={[.048, .035, .018]} at={[.036, 0, 0]} color={steel} />
                        <Box size={[.073, .018, .013]} at={[.083, -.004, 0]} color={steel} />
                        <Box size={[.029, .013, .009]} at={[.104, -.005, -side * .008]} color={selected === 'grip' ? '#e6a8c4' : black} />
                        <Cylinder at={[.037, .019, 0]} radius={.007} depth={.004} color={dark} sides={6} />
                      </group>)}
                    </>)}
                    <mesh position={[ARM.hand, 0, 0]}>
                      <sphereGeometry args={[.009, 18, 12]} /><meshBasicMaterial color="#ff99c2" />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  </group>
}
