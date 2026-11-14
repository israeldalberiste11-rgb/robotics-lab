// Three scene coordinates: +X forward, +Y up, +Z right.
export const PUPPER = { upper:.1235, lower:.115, hipX:.116, hipZ:.059, offset:.034, height:.205, pad:.010 }
export const LEG_NAMES = ['Front left','Front right','Rear left','Rear right']
export type XYZ = [number,number,number]
export const hipOrigin = (index:number): XYZ => [index<2?PUPPER.hipX:-PUPPER.hipX,PUPPER.height,index%2?PUPPER.hipZ:-PUPPER.hipZ]

export function legPose(index:number, time:number, gait:'Walk'|'Trot', moving:boolean, trim:number, speed:number, yaw:number) {
  const side = index%2?1:-1
  const phase = (time * (gait==='Trot'?2:1.25) + (gait==='Trot'?[0,.5,.5,0]:[0,.5,.75,.25])[index]) % 1
  const swing = gait==='Trot'?.42:.27
  const stance = phase >= swing
  const progress = stance ? (phase-swing)/(1-swing) : phase/swing
  const localSpeed = speed+yaw*side*(PUPPER.hipZ+PUPPER.offset)
  const travel = moving ? (stance?.5-progress:-.5+progress)*localSpeed*(gait==='Trot'?.29:.53) : 0
  const lift = moving&&!stance ? .032*Math.sin(Math.PI*progress)**2 : 0
  const down = PUPPER.height-PUPPER.pad-lift
  const roll = moving ? .06*Math.sin(phase*2*Math.PI)*Math.min(1,Math.abs(yaw)) : 0
  const x = travel + trim*.0014
  const { upper, lower } = PUPPER
  const knee = -Math.acos(Math.max(-1,Math.min(1,(down**2+x**2-upper**2-lower**2)/(2*upper*lower))))
  const pitch = Math.atan2(x,down)-Math.atan2(lower*Math.sin(knee),upper+lower*Math.cos(knee))
  return { roll, pitch, knee, stance:!moving||stance }
}

export const linkagePin = (angle:number, arm=.026): XYZ => [arm*Math.cos(angle),arm*Math.sin(angle),0]
