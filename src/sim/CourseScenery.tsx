import { useMemo } from 'react'
import { DoubleSide, Shape } from 'three'
import { Shell } from './Rover'

function House({ x, z, angle, color, roof, scale }: {
  x: number; z: number; angle: number; color: string; roof: string; scale: number
}) {
  return <group position={[x,0,z]} rotation-y={angle} scale={scale}>
    <Shell at={[0,.76,0]} size={[2.24,1.52,1.62]} color={color} />
    {[-1,1].map(side => <group key={side} position={[0,1.76,side*.45]} rotation-x={side*.48}>
      <Shell at={[0,0,0]} size={[2.46,.13,1.04]} color={roof} />
    </group>)}
    <Shell at={[.66,1.83,-.31]} size={[.24,.73,.23]} color="#8d776a" />
    <Shell at={[0,.44,.824]} size={[.34,.88,.045]} color="#735749" />
    {[-.67,.67].map(offset => <group key={offset} position={[offset,.91,.824]}>
      <Shell at={[0,0,0]} size={[.46,.48,.045]} color="#eee0ca" />
      <Shell at={[0,0,.03]} size={[.37,.39,.021]} color="#537a88" />
      <Shell at={[0,0,.043]} size={[.028,.39,.013]} color="#eee0ca" />
    </group>)}
  </group>
}

function River() {
  const bend = (z: number) => 8.5 + .85 * Math.sin(z * .29)
  const [bank, water] = useMemo(() => [1.48,1.26].map(width => {
    const shape = new Shape()
    for (let z = -26; z <= 26; z++) {
      if (z === -26) shape.moveTo(8.5 + .85 * Math.sin(z * .29) - width,z)
      else shape.lineTo(8.5 + .85 * Math.sin(z * .29) - width,z)
    }
    for (let z = 26; z >= -26; z--) shape.lineTo(8.5 + .85 * Math.sin(z * .29) + width,z)
    shape.closePath()
    return shape
  }), [])
  return <>
    {[bank,water].map((shape,i) => <mesh key={i} rotation-x={Math.PI/2} position-y={-.035+i*.009}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={i ? '#478b9a' : '#b7ad88'} side={DoubleSide} roughness={i ? .22 : 1} />
    </mesh>)}
    {Array.from({length:17},(_,i)=>{
      const z = -11+i*1.4
      return <mesh key={i} rotation-x={-Math.PI/2} position={[bend(z)+.48*Math.sin(i*2.3),-.022,z]}>
        <planeGeometry args={[.37+(i%3)*.1,.019]} /><meshBasicMaterial color="#93bfc1" transparent opacity={.6}/>
      </mesh>
    })}
    <group position={[8.5,0,0]}>
      <Shell at={[0,.11,0]} size={[3.45,.15,.67]} color="#95734d" />
      {[-1,1].map(side => <group key={side}>
        <Shell at={[0,.38,side*.31]} size={[3.48,.055,.052]} color="#69503b" />
        {[-1.58,-.78,0,.78,1.58].map(x => <Shell key={x} at={[x,.24,side*.31]} size={[.055,.34,.055]} color="#775840" />)}
      </group>)}
    </group>
  </>
}

export function CourseScenery() {
  return <group>
    <River />
    <group position={[-2.7,0,-6.9]}>
      <Shell at={[0,1.25,0]} size={[5.8,2.5,1.65]} color="#bfc2bd"/>
      <Shell at={[0,2.55,.06]} size={[6,.18,1.9]} color="#5b6265"/>
      {[-2.2,-1.1,0,1.1,2.2].map(x=><group key={x}>
        <Shell at={[x,1.47,.84]} size={[.93,1.58,.035]} color="#526b73"/>
        <Shell at={[x,1.47,.873]} size={[.035,1.58,.035]} color="#39454c"/>
        <Shell at={[x,.32,1.18]} size={[.88,.07,.26]} color="#a7896d"/>
      </group>)}
      <Shell at={[0,.01,1.63]} size={[5.9,.065,1.7]} color="#cec3b3"/>
    </group>
    {Array.from({length:18},(_,i) => {
      const angle = i*Math.PI/9+.12
      const radius = i === 0 ? 12.1 : i%3 === 0 ? 14.2 : 10.2
      return <House key={i} x={Math.cos(angle)*radius} z={Math.sin(angle)*radius}
        angle={-angle-Math.PI/2} scale={.82+(i%3)*.16}
        color={['#d9c0a1','#d7d4bf','#bfa894','#c9b7a1'][i%4]}
        roof={['#794e44','#5e6363','#875d4f'][i%3]} />
    })}
    {Array.from({length:18},(_,i) => {
      const angle = i*Math.PI/9
      return <mesh key={i} position={[Math.cos(angle)*21,-.85,Math.sin(angle)*21]} scale={[5.7,1.6+(i%3)*.24,3.7]} rotation-y={-angle}>
        <sphereGeometry args={[1,16,9]} /><meshStandardMaterial color={i%2?'#788c5c':'#86996b'} roughness={1} />
      </mesh>
    })}
  </group>
}
