import { MechanicalPart } from './MechanicalPart'
import { Harness } from './RoverHardware'
import { CoordinateFrame } from './Engineering'
import { Line } from '@react-three/drei'
import { Shell, Drum } from './RoverHardware'
export { Shell } from './RoverHardware'
import { Vector2 } from 'three'
import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Uno, MotorDriver, Ultrasonic } from './RoverElectronics'
import { scenePoint } from './Studio'
import type { Pose } from '../lib/drive'

export const WHEEL_RADIUS = .082
export const DEFAULT_TRACK = .32
export const ROVER_PARTS = {
  wheel: ['Drive wheel', 'Rubber tread transfers motor torque to the floor. The two wheels are driven independently.'],
  motor: ['Gearmotor', 'Reduction gears trade speed for torque. Each gearmotor drives one axle.'],
  frame: ['Chassis', 'Two aluminum plates tie the axle mounts to the electronics and battery supports.'],
  power: ['Battery pack', 'The battery supplies the motor drivers and regulated power for the controller.'],
  controller: ['Arduino Uno R3', 'The ATmega328P reads the sensor and sends direction and enable commands to the motor driver.'],
  driver: ['L298N module', 'Two H-bridges switch motor polarity. Each enable input can be PWM-controlled.'],
  sensor: ['Range sensor', 'A forward-facing range module estimates the distance to nearby surfaces.'],
  caster: ['Ball caster', 'The passive caster supports the rear of the chassis without steering it.'],
} as const
export type RoverPart = keyof typeof ROVER_PARTS
type XYZ = [number, number, number]
const metal = '#9396a1', black = '#24242a'

export const ELECTRONIC_CENTERS = {
  controller: [.018,.161,.045],
  driver: [.082,.161,-.045],
  sensor: [.188,.217,0],
} satisfies Record<string, XYZ>

export const ELECTRONIC_LIFT = { controller:.16, driver:.21, sensor:.12 }

function Separate({ offset, children }: { offset:XYZ; children:ReactNode }) {
  const group = useRef<Group>(null)
  useFrame((_,dt) => {
    const position = group.current!.position
    const blend = 1-Math.exp(-10*dt)
    position.x += (offset[0]-position.x)*blend
    position.y += (offset[1]-position.y)*blend
    position.z += (offset[2]-position.z)*blend
  })
  return <group ref={group}>{children}</group>
}

function Wheel({ side, spin, section = false, exploded = false }: { side: number; spin: number; section?: boolean; exploded?:boolean }) {
  return <group rotation-z={-spin}>
    <Separate offset={[0,0,exploded?side*.085:0]}>
    {!section && <mesh castShadow rotation-x={Math.PI/2}><latheGeometry args={[ [[.054,-.023],[.068,-.028],[.077,-.021],[.081,-.012],[.081,.012],[.077,.021],[.068,.028],[.054,.023],[.054,-.023]].map(([x,y])=>new Vector2(x,y)),48]}/>
      <meshStandardMaterial color={black} roughness={.86}/>
    </mesh>}
    {!section && Array.from({length:32},(_,i)=><group key={i} rotation-z={i*Math.PI/16}>
      {[-1,1].map(row=><group key={row} rotation-z={row*.043}>
        <group position={[0,.078,row*.010]} rotation-y={row*.38}>
          <Shell at={[0,0,0]} size={[.009,.008,.019]} color="#292a2e" radius={.0013}/>
        </group>
        <group position={[0,.073,row*.022]} rotation-x={row*.41}>
          <Shell at={[0,0,0]} size={[.008,.005,.009]} color="#303136" radius={.001}/>
        </group>
      </group>)}
    </group>)}
    </Separate>
    <MechanicalPart part="roverHub" position-z={side*.024}/>
    <mesh position={[0,0,side*.031]}><torusGeometry args={[.053,.0022,10,48]}/><meshStandardMaterial color="#b06978" metalness={.7} roughness={.30}/></mesh>
    <Drum at={[0,0,side*.023]} radius={.023} length={.018} color={metal}/>
    {Array.from({ length: 6 }, (_, i) => {
      const angle = i * Math.PI / 3
      return <Drum key={i} at={[.045 * Math.cos(angle), .045 * Math.sin(angle), side * .031]} radius={.0045} length={.005} color={metal} sides={6} />
    })}
    <Drum at={[0, 0, side * .037]} radius={.016} length={.016} color={metal} sides={8} />
  </group>
}

export function Rover({ pose, track = DEFAULT_TRACK, spin = [0, 0], selected, select, hide = false, wheelSide, pickWheel, breakdown, assembly, section, rates }: {
  pose: Pose; track?: number; spin?: [number, number]; selected?: RoverPart | null; select?: (id: RoverPart) => void; hide?: boolean; wheelSide?:number|null; pickWheel?:(side:number)=>void; breakdown?:boolean; assembly?:boolean; section?:boolean; rates?:[number,number]
}) {
  if (hide) return null
  const part = (id: RoverPart, center: XYZ, contents: ReactNode) => <group onClick={select ? (event) => { event.stopPropagation(); select(id) } : undefined}>
    {contents}
    {selected === id && <mesh position={center}><sphereGeometry args={[.030, 10, 8]} /><meshBasicMaterial color="#ffbcd3" wireframe depthTest={false} /></mesh>}
  </group>
  return <group position={scenePoint(pose.x, pose.y)} rotation-y={pose.theta}>
    {part('frame', [0, .16, 0], <>
      <MechanicalPart part="roverBase" position-y={.075} rotation-x={-Math.PI/2}/>
      <Separate offset={[0,assembly?.09:0,0]}><MechanicalPart part="roverDeck" position-y={.151} rotation-x={-Math.PI/2}/></Separate>
      {[-1,1].map(side=><group key={side} position={[.177,.091,side*.071]} rotation-y={side*.44}>
        <Shell at={[0,0,0]} size={[.018,.019,.064]} color="#6d273d" radius={.005}/>
      </group>)}
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Drum key={`${x}/${z}`} at={[x * .137, .121, z * .093]} radius={.008} length={.075} color={metal} axis="y" sides={6} />))}
      <Separate offset={[0,assembly?.09:0,0]}>{[-.137,.137].flatMap(x=>[-.093,.093].map(z=><Drum key={x+'/'+z} at={[x,.159,z]} radius={.006} length={.006} color={metal} axis="y" sides={6}/>))}</Separate>
    </>)}
    {[-1, 1].map((side) => <group key={side}>
      <group position={[0,WHEEL_RADIUS,side*(track/2)]}
        onClick={pickWheel ? event=>{event.stopPropagation();pickWheel(side)} : undefined}>
        <Separate offset={[0,0,(assembly||breakdown&&wheelSide===side)?side*.10:0]}>
        {pickWheel ? <Wheel side={side} spin={spin[side<0?0:1]} section={section&&wheelSide===side} exploded={assembly||breakdown&&wheelSide===side}/> : part('wheel',[0,0,0],<Wheel side={side} spin={spin[side<0?0:1]}/>)}
        {wheelSide===side && <CoordinateFrame size={.075}/>}
        {wheelSide===side && <mesh><torusGeometry args={[.089,.0025,8,42]}/><meshBasicMaterial color="#df759b"/></mesh>}
        {rates && Math.abs(rates[side<0?0:1])>.01 && <group scale-y={rates[side<0?0:1]>0?1:-1}>
          <Line points={Array.from({length:21},(_,i):XYZ=>[.096*Math.cos(i*.09),-.096*Math.sin(i*.09),side*.037])} color="#a33562" lineWidth={2}/>
          <mesh position={[-.022,-.093,side*.037]} rotation-z={-1.8}><coneGeometry args={[.009,.022,10]}/><meshBasicMaterial color="#a33562"/></mesh>
        </group>}
        </Separate>
      </group>
      {wheelSide===side && <Line points={[[0,WHEEL_RADIUS,side*.066],[0,WHEEL_RADIUS,side*(track/2+(breakdown?.16:.06))]]} color="#3076c4" lineWidth={2}/>}
      {part('motor', [.02, WHEEL_RADIUS, side*.10], <>
        <Separate offset={[assembly?-.067:0,0,0]}>
          <Shell at={[.031,WHEEL_RADIUS,side*.098]} size={[.029,.018,.022]} color="#dab238" radius={.003}/>
          <Drum at={[.007,WHEEL_RADIUS,side*.098]} radius={.009} length={.020} color={metal} axis="x"/>
          <Drum at={[-.004,WHEEL_RADIUS,side*.098]} radius={.008} length={.003} color={black} axis="x"/>
        </Separate>
        <Separate offset={[0,0,assembly?side*.035:0]}>
          <Shell at={[0,WHEEL_RADIUS,side*.098]} size={[.033,.022,.023]} color="#dab238" radius={.004}/>
          {[-.01,.01].map(x=><Drum key={x} at={[x,WHEEL_RADIUS+.005,side*.110]} radius={.0016} length={.002} color={metal} sides={6}/>)}
        </Separate>
        <Separate offset={[0,assembly?-.040:0,0]}>
          <Shell at={[0,WHEEL_RADIUS-.015,side*.115]} size={[.046,.004,.024]} color={metal} radius={.001}/>
          <MechanicalPart part="roverMotorBracket" position={[0,WHEEL_RADIUS,side*.123]}/>
        </Separate>
        <Separate offset={[0,0,(assembly||breakdown&&wheelSide===side)?side*.048:0]}>
          <mesh position={[0,WHEEL_RADIUS,side*.125]}><torusGeometry args={[.0075,.0021,12,32]}/><meshStandardMaterial color="#b8b6ad" metalness={.7} roughness={.35}/></mesh>
        </Separate>
        <Separate offset={[0,0,(assembly||breakdown&&wheelSide===side)?side*.080:0]}>
          <Drum at={[0,WHEEL_RADIUS,side*((track/2+.119)/2)]} radius={.005} length={Math.max(.014,track/2-.117)} color={metal}/>
        </Separate>
      </>)}
    </group>)}
    {part('power', [-.092,.17,0], <Separate offset={[0,assembly?.25:0,0]}>
      <Shell at={[-.092,.158,0]} size={[.060,.010,.055]} color={black} radius={.004}/>
      {[-1,1].map(side=><group key={side}>
        <Shell at={[-.092,.166,side*.027]} size={[.060,.022,.003]} color={black} radius={.001}/>
        <Shell at={[-.092+side*.029,.166,0]} size={[.003,.021,.056]} color={black} radius={.001}/>
      </group>)}
      {[-.019,-.0063,.0063,.019].map(z=><group key={z}>
        <Drum at={[-.092,.167,z]} radius={.006} length={.052} color="#295892" axis="x"/>
        <Drum at={[-.065,.167,z]} radius={.0035} length={.002} color={metal} axis="x"/>
      </group>)}
      <Shell at={[-.092,.175,0]} size={[.013,.003,.055]} color="#25272b" radius={.001}/>
    </Separate>)}
    {(['controller','driver','sensor'] as const).map(id=><Separate key={id} offset={[0,assembly?ELECTRONIC_LIFT[id]:0,0]}>
      {part(id,ELECTRONIC_CENTERS[id],<group position={ELECTRONIC_CENTERS[id]}>
        {id==='controller'?<Uno/>:id==='driver'?<MotorDriver/>:<Ultrasonic/>}
        {selected===id && <CoordinateFrame size={.026}/>}
      </group>)}
    </Separate>)}
    <Shell at={[.181,.183,0]} size={[.005,.06,.030]} color={metal} radius={.0015}/>
    {!assembly && ['#b94338','#e7b042','#24242a','#33877e'].map((color,i)=><group key={color}>
      <Harness points={[[.019+i*.00254,.168,.021],[.036+i*.003,.199,.015],[.059+i*.003,.196,-.014],[.071+i*.00254,.168,-.062]]} color={color} radius={.0009}/>
      <Harness points={[[.002+i*.00254,.168,.021],[.108,.194,.032+i*.003],[.169,.178,-.014+i*.003],[.187,.203,(i-1.5)*.00254]]} color={color} radius={.0009}/>
    </group>)}
    {!assembly && [-1,1].flatMap(side=>['#b94338','#24242a'].map((color,i)=><Harness key={side+'/'+color}
      points={[[.097,.168,-.045+side*.013],[.112+i*.004,.133,side*.064],[.071+i*.004,.096,side*.097],[-.004,.083+i*.004,side*.097]]}
      color={color} radius={.0011}/>))}
    {!assembly && ['#b94338','#24242a'].map((color,i)=><Harness key={color}
      points={[[-.065,.166,i*.009],[-.049,.183,-.019-i*.004],[.031,.184,-.054-i*.004],[.098,.169,-.046+i*.004]]}
      color={color} radius={.0012}/>)}
    {part('caster', [-.153,.042,0], <>
      <Drum at={[-.153,.064,0]} radius={.035} length={.028} color={metal} axis="y" />
      <mesh position={[-.153,.029,0]} castShadow><sphereGeometry args={[.029,18,12]} /><meshStandardMaterial color="#48464d" metalness={.54} roughness={.37} /></mesh>
    </>)}
  </group>
}
