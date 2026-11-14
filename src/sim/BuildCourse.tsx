import { Grass, Tree } from './Field'
import { Line } from '@react-three/drei'
import { Shell } from './Rover'
import { scenePoint } from './Studio'
import type { Point } from '../lib/sta'

export const ENVIRONMENTS = ['Engineering Laboratory', 'Outdoor Robotics Course', 'Technical Simulation Arena'] as const
export type Environment = typeof ENVIRONMENTS[number]
export const BUILD_GOAL = { x: 1.5, y: .85 }
export const COURSE_LIMIT = 2
export const DEFAULT_BLOCKS: Point[] = [{x:.75,y:.28},{x:-.82,y:.83},{x:.5,y:-1.05}]

export function BuildCourse({ environment, blocks, moveBlock, mobile, trail }: {
  environment: Environment; blocks: Point[]; moveBlock: (point: Point) => void; mobile: boolean; trail: Point[]
}) {
  const outdoors = environment === ENVIRONMENTS[1]
  return <>
    <mesh rotation-x={-Math.PI/2} position-y={-.004} receiveShadow onClick={mobile ? (event) => {
      event.stopPropagation(); moveBlock({ x:event.point.x, y:-event.point.z })
    } : undefined}>
      <planeGeometry args={[4,4]} /><meshStandardMaterial color={outdoors ? '#99937e' : '#ede2dd'} roughness={.86} />
    </mesh>
    {environment === ENVIRONMENTS[0] && <>
      <Shell at={[0,.38,-2.13]} size={[4.35,.76,.12]} color="#e0d3cd" />
      {[-1.62,-.54,.54,1.62].map((x)=><group key={x}>
        <Shell at={[x,1.04,-2.14]} size={[1.04,.66,.035]} color="#8ea6ac" radius={.012} />
        <Shell at={[x-.525,1.04,-2.11]} size={[.036,.69,.05]} color="#55585b" />
      </group>)}
      <Shell at={[-1.1,.53,-1.81]} size={[1.15,.07,.36]} color="#b89976" />
      {[-1.61,-.59].map(x=><Shell key={x} at={[x,.25,-1.81]} size={[.075,.5,.32]} color="#62595c" />)}
      <Shell at={[-1.14,.65,-1.86]} size={[.28,.19,.13]} color="#4c5059" />
      <Shell at={[-1.14,.67,-1.79]} size={[.21,.105,.012]} color="#60968d" />
    </>}
    {outdoors && <>
      <Grass inset={2.06}/>
      {[-1,1].map(side=><mesh key={side} position={[side*18,-.52,-25]} scale={[15,1.4,8]}>
        <sphereGeometry args={[1,24,12]}/><meshStandardMaterial color="#849c60" roughness={1}/>
      </mesh>)}
      {[-2.5,2.5].flatMap(x=>[-1.8,0,1.8].map(z=><group key={x+'/'+z} position={[x,0,z]}>
        <Tree height={1.45+Math.abs(z)*.23}/>
      </group>))}
      <Shell at={[0,.09,-2.36]} size={[.62,.055,.46]} color="#af885e" />
      <group position={[0,.07,-2.55]} rotation-x={-.26}><Shell at={[0,0,0]} size={[.62,.035,.44]} color="#b99972" /></group>
    </>}
    {mobile && <>
      {blocks.map((point,i)=><Shell key={i} at={scenePoint(point.x,point.y,.11)} size={[.29,.22,.29]} color={i===0?'#8B1E3F':'#b19379'}/>)}
      <mesh position={scenePoint(BUILD_GOAL.x,BUILD_GOAL.y,.009)} rotation-x={-Math.PI/2}><ringGeometry args={[.14,.18,40]}/><meshBasicMaterial color="#8B1E3F"/></mesh>
      {trail.length>1 && <Line points={trail.map(p=>scenePoint(p.x,p.y,.007))} color="#8B1E3F" lineWidth={2.3}/>}
    </>}
  </>
}
