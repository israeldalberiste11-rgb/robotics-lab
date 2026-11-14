import { useMemo } from 'react'
import { UnoSilkscreen } from './UnoSilkscreen'
import { Path, Shape } from 'three'
import { Shell, Drum } from './RoverHardware'

export function PCB({ outline, holes, color }: { outline: [number,number][]; holes: [number,number][]; color:string }) {
  const board = useMemo(() => {
    const shape = new Shape()
    outline.forEach(([x,z], i) => i ? shape.lineTo(x,-z) : shape.moveTo(x,-z))
    shape.closePath()
    for (const [x,z] of holes) {
      const hole = new Path()
      hole.absarc(x,-z,.0016,0,Math.PI*2,true)
      shape.holes.push(hole)
    }
    return shape
  }, [outline, holes])
  return <mesh rotation-x={-Math.PI/2} castShadow receiveShadow>
    <extrudeGeometry args={[board,{depth:.0016,bevelEnabled:false,curveSegments:12}]}/>
    <meshStandardMaterial color={color} roughness={.48}/>
  </mesh>
}

const unoOutline: [number,number][] = [[-.0343,-.0267],[.031,-.0267],[.031,-.022],[.0343,-.019],[.0343,.010],[.031,.013],[.031,.0267],[-.0343,.0267]]
const unoMounts: [number,number][] = [[-.0203,-.0242],[-.0191,.0241],[.031,-.0114],[.031,.0165]]
const driverMounts: [number,number][] = [-.018,.018].flatMap(x=>[-.018,.018].map((z):[number,number]=>[x,z]))
const square = (width:number, depth:number): [number,number][] => [[-width/2,-depth/2],[width/2,-depth/2],[width/2,depth/2],[-width/2,depth/2]]
const driverOutline = square(.043,.043)
const sonarOutline = square(.020,.043)
const sonarMounts: [number,number][] = [[-.007,-.019],[.007,.019]]

function Header({ x,z,count }: {x:number;z:number;count:number}) {
  return <group position={[x,0,z]}>
    <Shell at={[(count-1)*.00127,.004,0]} size={[count*.00254,.005,.0028]} color="#141820" radius={.0004}/>
    {Array.from({length:count},(_,i)=><mesh key={i} position={[i*.00254,.00651,0]} rotation-x={-Math.PI/2}>
      <planeGeometry args={[.00135,.00135]}/><meshStandardMaterial color="#080a0d" roughness={.78}/>
      </mesh>)}
  </group>
}

export function Uno() {
  return <>
    <PCB outline={unoOutline} holes={unoMounts} color="#09669f"/>
    <UnoSilkscreen/>
    <UnoSilkscreen chip/>
    {unoMounts.map(([x,z])=><mesh key={x+'/'+z} position={[x,.00168,z]} rotation-x={-Math.PI/2}>
      <ringGeometry args={[.0016,.00255,32]}/><meshStandardMaterial color="#c1ae7d" metalness={.78} roughness={.32}/>
    </mesh>)}
    {unoMounts.map(([x,z])=><Drum key={x+'/'+z} at={[x,-.003,z]} radius={.0027} length={.006} color="#bc9457" axis="y" sides={6}/>)}
    <Header x={-.015} z={-.024} count={10}/><Header x={.012} z={-.024} count={8}/>
    <Header x={-.011} z={.024} count={8}/><Header x={.012} z={.024} count={6}/>
    <Shell at={[.011,.0037,.008]} size={[.037,.004,.011]} color="#1f2023" radius={.00045}/>
    <Shell at={[.011,.0061,.008]} size={[.035,.0032,.0083]} color="#29292b" radius={.00055}/>
    <Drum at={[.025,.00774,.010]} radius={.0008} length={.00006} color="#151518" axis="y"/>
    <Shell at={[-.028,.0036,-.023]} size={[.0057,.004,.0055]} color="#26282d" radius={.00035}/>
    <Drum at={[-.028,.006,-.023]} radius={.00155} length={.001} color="#ad4d37" axis="y"/>
    {[-1,1].map(side=><group key={side}>
      {Array.from({length:8},(_,i)=><Shell key={i} at={[-.014+i*.00065,.0021,-.012+side*.0032]} size={[.00028,.0004,.0011]} color="#c2bbac" radius={.00009}/>)}
    </group>)}
    {[0,1,2].flatMap(i=>[0,1].map(j=><Drum key={i+'/'+j} at={[.029+i*.0022,.003,-.001+j*.0022]} radius={.0004} length={.003} color="#beaa6e" axis="y"/>))}
    {[-1,1].flatMap(side=>Array.from({length:14},(_,i)=><Shell key={side+'/'+i} at={[-.0055+i*.00254,.003,.008+side*.0052]} size={[.00065,.002,.0022]} color="#c8ba99" radius={.00018}/>))}
    <Shell at={[-.029,.007,-.016]} size={[.016,.011,.012]} color="#bec4c7" radius={.0006}/>
    <Shell at={[-.0372,.007,-.016]} size={[.0008,.007,.008]} color="#191b20" radius={.00025}/>
    <Shell at={[-.0377,.0057,-.016]} size={[.001,.0018,.0059]} color="#d4d6d1" radius={.0002}/>
    {[-1,1].map(side=><Shell key={side} at={[-.038,.008,-.016+side*.0044]} size={[.001,.007,.0007]} color="#d8dcde" radius={.00015}/>)}
    <Shell at={[-.03,.006,.018]} size={[.014,.009,.009]} color="#191c22" radius={.0012}/>
    <Drum at={[-.0373,.006,.018]} radius={.003} length={.001} color="#08090b" axis="x"/>
    <Drum at={[-.0379,.006,.018]} radius={.00065} length={.0011} color="#b4a382" axis="x"/>
    {[-.02,-.012].map(x=><Drum key={x} at={[x,.004,.016]} radius={.0025} length={.005} color="#a9b0b2" axis="y"/>)}
    <Shell at={[-.012,.0027,-.012]} size={[.006,.002,.006]} color="#25262b" radius={.0002}/>
    <Shell at={[.003,.0025,-.009]} size={[.009,.002,.003]} color="#a9b0b2" radius={.00065}/>
    {Array.from({length:12},(_,i)=><Shell key={i} at={[-.013+i*.0033,.002,.015]} size={[.0016,.0009,.001]} color={i===10?'#7dbb45':'#c5ac79'} radius={.00015}/>)}
  </>
}

export function MotorDriver() {
  return <>
    <PCB outline={driverOutline} holes={driverMounts} color="#a82e32"/>
    <Shell at={[-.006,.005,0]} size={[.018,.006,.018]} color="#252730" radius={.00065}/>
    {Array.from({length:7},(_,i)=><Shell key={i} at={[-.014+i*.0027,.013,0]} size={[.0013,.016,.019]} color="#27292e" radius={.0003}/>)}
    {[-.013,0,.013].map((z,i)=><group key={z}>
      <Shell at={[.015,.0055,z]} size={[.009,.008,.0105]} color="#2466ad" radius={.0008}/>
      {(i===1?[-1,0,1]:[-1,1]).map(p=><Drum key={p} at={[.015,.0097,z+p*.0027]} radius={.00125} length={.0006} color="#b7b5ac" axis="y"/>)}
    </group>)}
    {[-.009,.009].map(z=><Drum key={z} at={[.006,.007,z]} radius={.0033} length={.010} color="#b5bdc4" axis="y"/>)}
    <Header x={-.012} z={-.017} count={6}/>
  </>
}

export function Ultrasonic() {
  return <>
    <group rotation-z={-Math.PI/2}><PCB outline={sonarOutline} holes={sonarMounts} color="#1c4a91"/></group>
    {[-.013,.013].map(z=><group key={z} position={[.009,0,z]}>
      <Drum at={[-.002,0,0]} radius={.008} length={.011} color="#aab2ba" axis="x" sides={40}/>
      <Drum at={[.0036,0,0]} radius={.0066} length={.001} color="#2b2f36" axis="x" sides={40}/>
      <mesh position={[.0044,0,0]} rotation-y={Math.PI/2}><torusGeometry args={[.0073,.00064,8,32]}/><meshStandardMaterial color="#d3dce2" metalness={.8} roughness={.29}/></mesh>
      {Array.from({length:7},(_,i)=><Shell key={i} at={[.0043,0,(i-3)*.0017]} size={[.0003,2*Math.sqrt(.006**2-((i-3)*.0017)**2),.00033]} color="#626973" radius={.0001}/>)}
    </group>)}
    <Shell at={[.002,.006,0]} size={[.003,.004,.009]} color="#aaaeb4" radius={.001}/>
    {Array.from({length:4},(_,i)=><Shell key={i} at={[-.001,-.012,(i-1.5)*.00254]} size={[.00065,.006,.00065]} color="#cfab66" radius={.00012}/>)}
  </>
}
