import type { ReactNode } from 'react'
import { Drum, Harness, Shell } from '../../sim/RoverHardware'
import { MechanicalPart } from '../../sim/MechanicalPart'
import { CoordinateFrame } from '../../sim/Engineering'
import { hipOrigin, LEG_NAMES, legPose, linkagePin, PUPPER, type XYZ } from '../../lib/pupper'

type Selection = {selected:string|null; select:(id:string)=>void}
export const PUPPER_PARTS = [
  {id:'body',name:'Carbon frame',detail:'Upper and lower plates connect the four hip stations.'},
  {id:'electronics',name:'Electronics tray',detail:'The Raspberry Pi and power distribution board mount above the frame.'},
  ...LEG_NAMES.flatMap((name,i)=>[
    {id:`hip-${i}`,name:`${name} hip actuators`,detail:'The roll servo swings the hip module outward. Two lateral servos actuate the pitch link and knee linkage.'},
    {id:`upper-${i}`,name:`${name} upper link`,detail:'The upper carbon plate spans 123.5 mm between pivot centers.'},
    {id:`knee-${i}`,name:`${name} knee linkage`,detail:'A hip-mounted servo drives the lower leg via a threaded rod and matched crank arms.'},
    {id:`foot-${i}`,name:`${name} foot`,detail:'A replaceable pad contacts the floor during the support phase.'},
  ]),
]

const alloy='#b6bdc4'
const polymer='#383b46'
const plate='#282f35'

function Pick({ id, selected, select, children }:Selection & {id:string;children:ReactNode}) {
  return <group onClick={e=>{e.stopPropagation();select(id)}}>
    {children}
    {selected===id && <CoordinateFrame size={.043}/>}
  </group>
}

function Servo({ side }: {side:number}) {
  return <>
    <Shell at={[-.011,.001,0]} size={[.047,.038,.023]} color={polymer} radius={.0025}/>
    <Shell at={[-.012,0,0]} size={[.033,.039,.024]} color="#53606c" radius={.001}/>
    <Shell at={[-.012,0,-side*.012]} size={[.056,.021,.003]} color={plate} radius={.0008}/>
    <Drum at={[0,0,side*.014]} radius={.014} length={.004} color={alloy}/>
    <Drum at={[0,0,side*.018]} radius={.007} length={.006} color="#555d66"/>
    {[-.012,.012].flatMap(x=>[-.012,.012].map(y=><Drum key={x+'/'+y} at={[x,y,side*.013]} radius={.00165} length={.003} color={alloy} sides={8}/>))}
  </>
}

function TieRod({ a,b }: {a:XYZ;b:XYZ}) {
  const dx=b[0]-a[0],dy=b[1]-a[1]
  return <group position={a} rotation-z={Math.atan2(dy,dx)}>
    <Drum at={[Math.hypot(dx,dy)/2,0,0]} axis="x" radius={.0018} length={Math.hypot(dx,dy)} color={alloy}/>
    <Drum at={[0,0,0]} radius={.0045} length={.004} color={alloy}/>
    <Drum at={[Math.hypot(dx,dy),0,0]} radius={.0045} length={.004} color={alloy}/>
  </group>
}

export function PupperAssembly({ time,gait,selected,select,trims,moving,speed,yaw,exploded }:Selection & {
  time:number;gait:'Walk'|'Trot';trims:number[];moving:boolean;speed:number;yaw:number;exploded:boolean
}) {
  const selection={selected,select}
  return <>
    <group position-y={PUPPER.height}>
      <Pick id="body" {...selection}>
        {[-.023,.034].map((y,i)=><MechanicalPart key={y} part="pupperDeck" position={[0,y+(exploded?(i? .066:-.035):0),0]} rotation-x={-Math.PI/2}/>)}
        {[-1,1].map(side=><MechanicalPart key={side} part="pupperRail" position={[0,.005,side*(exploded?.092:.049)]}/>)}
        {[-.112,.112].flatMap(x=>[-.038,.038].map(z=><group key={x+'/'+z}>
          <Drum at={[x,.005,z]} radius={.0041} length={.057} color="#9b8054" axis="y" sides={6}/>
          <Drum at={[x,.036,z]} radius={.003} length={.003} color={alloy} axis="y" sides={8}/>
        </group>))}
        <Shell at={[-.015,-.005,0]} size={[.102,.029,.037]} color="#202329" radius={.006}/>
      </Pick>
      <group position={[.020,.041+(exploded?.12:0),0]}>
        <Pick id="electronics" {...selection}>
          <Shell at={[0,0,0]} size={[.085,.002,.056]} color="#286447" radius={.0006}/>
          <Shell at={[.009,.003,0]} size={[.015,.004,.014]} color={polymer} radius={.0006}/>
          {[-.017,.009,.029].map(x=><Shell key={x} at={[x,.006,-.018]} size={[.014,.012,.014]} color={alloy} radius={.0009}/>)}
          {Array.from({length:14},(_,i)=><Drum key={i} at={[-.036+i*.005,.002,.019]} radius={.00065} length={.004} axis="y" color="#bc9d60"/>)}
        </Pick>
      </group>
      {!exploded && [-1,1].flatMap(side=>['#8b2639','#bd9447','#222631'].map((color,i)=><Harness key={side+'/'+i}
        points={[[.02,.046,side*.02],[.056,.060+i*.002,side*.03],[.092,.03,side*.044],[.116,.017,side*.067]]} radius={.0011} color={color}/>))}
    </group>
    {LEG_NAMES.map((name,i)=>{
      const side=i%2?1:-1
      const {roll,pitch,knee}=legPose(i,time,gait,moving,trims[i],speed,yaw)
      const [x,y,z]=hipOrigin(i)
      const kneeX=Math.sin(pitch)*PUPPER.upper
      const kneeY=-Math.cos(pitch)*PUPPER.upper
      const [px,py]=linkagePin(pitch+knee)
      const layer=side*(exploded?.054:.018)
      return <group key={name} position={[x,y,z+(exploded?side*.065:0)]}>
        <Pick id={`hip-${i}`} {...selection}>
          <group rotation-y={Math.PI/2}><Servo side={x>0?1:-1}/></group>
        </Pick>
        <group rotation-x={roll}>
          <group position-z={side*PUPPER.offset}>
            <Pick id={`hip-${i}`} {...selection}><Servo side={side}/></Pick>
            <group position-z={-side*.025}><Pick id={`knee-${i}`} {...selection}><Servo side={side}/></Pick></group>
            <Pick id={`knee-${i}`} {...selection}>
              <group rotation-z={pitch+knee} position-z={layer}>
                <Shell at={[.013,0,0]} size={[.034,.008,.004]} color={alloy} radius={.0015}/>
              </group>
              <TieRod a={[px,py,layer]} b={[kneeX+px,kneeY+py,layer]}/>
            </Pick>
            <group rotation-z={pitch}>
              <Pick id={`upper-${i}`} {...selection}>
                <MechanicalPart part="pupperFemur" position-z={side*(exploded?.033:.014)}/>
              </Pick>
              <group position={[0,-PUPPER.upper,0]} rotation-z={knee}>
                <Pick id={`knee-${i}`} {...selection}>
                  <MechanicalPart part="pupperTibia" position-z={layer}/>
                  <Drum at={[0,0,layer]} radius={.006} length={.006} color={alloy}/>
                  <Drum at={[.026,0,layer]} radius={.003} length={.007} color={alloy}/>
                </Pick>
                <group position={[0,-PUPPER.lower,layer]}>
                  <Pick id={`foot-${i}`} {...selection}>
                    <Shell at={[0,0,0]} size={[.024,.020,.023]} color="#202327" radius={.008}/>
                  </Pick>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    })}
  </>
}
