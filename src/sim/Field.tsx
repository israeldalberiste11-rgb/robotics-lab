import { GrassBlades } from './GrassBlades'
import { Line } from '@react-three/drei'
import { useMemo, useEffect } from 'react'
import { DataTexture, RepeatWrapping, RGBAFormat, SRGBColorSpace, LinearMipmapLinearFilter, Vector3, Quaternion } from 'three'
import { BOUNDS, START, sensorOrigin, type Obstacle, type Point, type Reading } from '../lib/sta'
import type { Pose } from '../lib/drive'
import { Shell } from './Rover'
import { scenePoint } from './Studio'

export function Grass({ onGround, inset }: { onGround?: (point: Point) => void; inset?:number } = {}) {
  const texture = useMemo(() => {
    const pixels = new Uint8Array(128 * 128 * 4)
    let random = 125
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0
      const value = (random >>> 24) / 255 * 32 + Math.sin(x * .2) * Math.cos(y * .23) * 12
      const i = (y * 128 + x) * 4
      pixels.set([90 + value, 115 + value, 68 + value * .7, 255], i)
    }
    const map = new DataTexture(pixels, 128, 128, RGBAFormat)
    map.colorSpace = SRGBColorSpace
    map.wrapS = map.wrapT = RepeatWrapping
    map.repeat.set(28, 28)
    map.generateMipmaps = true
    map.minFilter = LinearMipmapLinearFilter
    map.needsUpdate = true
    return map
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return <><mesh rotation-x={-Math.PI / 2} position-y={onGround ? -.002 : -.008} receiveShadow
    onClick={onGround ? (event) => { event.stopPropagation(); onGround({x:event.point.x,y:-event.point.z}) } : undefined}>
    <planeGeometry args={[90,90]} /><meshStandardMaterial map={texture} roughness={1} />
  </mesh><GrassBlades inset={inset} wide={Boolean(onGround)}/></>
}

const canopy = Array.from({length: 33}, (_,i) => {
  const angle = i * 2.39996
  const ring = i < 11 ? .35 : .21
  return { x: Math.cos(angle)*ring, z: Math.sin(angle)*ring, y: .93+(i%6)*.081, size: .135+(i%4)*.033 }
})

function Branch({ end }: { end: [number,number,number] }) {
  const start = new Vector3(0,.56,0)
  const tip = new Vector3(...end)
  const axis = tip.clone().sub(start)
  const orientation = new Quaternion().setFromUnitVectors(new Vector3(0,1,0),axis.clone().normalize())
  return <mesh position={start.lerp(tip,.5)} quaternion={orientation} castShadow>
    <cylinderGeometry args={[.014,.036,axis.length(),7]} /><meshStandardMaterial color="#6f5942" roughness={1} />
  </mesh>
}

export function Tree({ height = 1.4 }: { height?: number }) {
  return <group scale={height / 1.4}>
    <mesh position-y={.48} castShadow><cylinderGeometry args={[.037,.093,.96,10]} /><meshStandardMaterial color="#705b44" roughness={1}/></mesh>
    {[[.34,1.1,.05],[-.32,1.08,.1],[.1,1.19,-.29],[-.12,1.3,.22]].map((end,i)=>
      <Branch key={i} end={end as [number,number,number]} />)}
    {canopy.map(({x,y,z,size},i) => <mesh key={i} position={[x,y,z]} scale={[1.18,.85,1]} rotation-y={i*.8} castShadow receiveShadow>
      <icosahedronGeometry args={[size,2]} /><meshStandardMaterial color={['#355d35','#4c7139','#61843f','#7b944e'][i%4]} roughness={1} />
    </mesh>)}
  </group>
}

export function Field({ obstacles, goal, pose, route, trail, scan, showScan, technical, showTrail = true, onGround, onObstacle }: {
  obstacles: Obstacle[]; goal: Point; pose: Pose; route: Point[]; trail: Point[]; scan: Reading[]; showScan: boolean; technical?:boolean; showTrail?:boolean
  onGround: (point: Point) => void; onObstacle: (id: string) => void
}) {
  const source = sensorOrigin(pose)
  const corner = (x: number, y: number) => scenePoint(x,y,.016)
  return <>
    {technical ? <mesh rotation-x={-Math.PI/2} position-y={-.009}
      onClick={event=>{event.stopPropagation();onGround({x:event.point.x,y:-event.point.z})}}>
      <planeGeometry args={[BOUNDS.x*2,BOUNDS.y*2]}/><meshStandardMaterial color="#f0e8e4" />
    </mesh> : <Grass onGround={onGround} />}
    <Line points={[corner(-BOUNDS.x,-BOUNDS.y),corner(BOUNDS.x,-BOUNDS.y),corner(BOUNDS.x,BOUNDS.y),corner(-BOUNDS.x,BOUNDS.y),corner(-BOUNDS.x,-BOUNDS.y)]}
      lineWidth={1} dashed dashSize={.12} gapSize={.13} color="#dfebc7" />
    {!technical && [-1,1].map(side => <mesh key={side} position={[side*14,-.85,-15]} scale={[12,1.75,6.5]}>
      <sphereGeometry args={[1,28,14]} /><meshStandardMaterial color="#718751" roughness={1} />
    </mesh>)}
    {!technical && [-5.65,5.65].flatMap((x) => [-3.6,-1.5,1,3.55].map((y,i) => <group key={`${x}/${y}`} position={scenePoint(x,y,-.04)}><Tree height={1.55 + i * .12} /></group>))}
    {!technical && <group position={scenePoint(1.1,4.43)}>
      <Shell at={[0,.57,0]} size={[3.8,1.15,1.5]} color="#e9e1d1" />
      <Shell at={[0,1.17,0]} size={[4,.11,1.62]} color="#666e6c" />
      {[-1.25,0,1.25].map((x) => <Shell key={x} at={[x,.67,.759]} size={[.87,.47,.03]} color="#60818c" />)}
    </group>}
    {obstacles.map((obstacle) => <group key={obstacle.id} position={scenePoint(obstacle.x,obstacle.y)}
      onClick={(event) => { event.stopPropagation(); onObstacle(obstacle.id) }}>

      {obstacle.kind === 'tree' ? <Tree /> : obstacle.kind === 'shed' ? <>
        <Shell at={[0,.38,0]} size={[.95,.76,.95]} color="#b3a48c" />
        <Shell at={[0,.8,0]} size={[1.03,.09,1.02]} color="#475854" />
        <Shell at={[.04,.31,.486]} size={[.38,.59,.025]} color="#6d7370" />
      </> : obstacle.kind === 'crate' ? <>
        <Shell at={[0,.21,0]} size={[obstacle.r * 1.4,.42,obstacle.r * 1.4]} color="#c28e50" />
        <group position={[0,.21,obstacle.r*.706]} rotation-z={.63}>
          <Shell at={[0,0,0]} size={[obstacle.r*1.34,.047,.021]} color="#9b6b3d" />
        </group>
        {[-1,1].map((sign) => <Shell key={sign} at={[sign * obstacle.r * .43,.427,0]} size={[.04,.017,obstacle.r * 1.41]} color="#795f48" />)}
      </> : <>
        <Shell at={[0,.17,0]} size={[obstacle.r * 1.8,.32,obstacle.r * .65]} color="#be7146" />
        {[-.5,0,.5].map((offset) => <Shell key={offset} at={[obstacle.r * offset,.22,obstacle.r * .331]} size={[.1,.06,.012]} color="#f8dd93" />)}
      </>}
    </group>)}
    <mesh position={scenePoint(START.x,START.y,.008)} rotation-x={-Math.PI/2}><ringGeometry args={[.19,.23,48]} /><meshBasicMaterial color="#467a8c" /></mesh>
    <group position={scenePoint(goal.x,goal.y)}>
      <mesh position-y={.014} rotation-x={-Math.PI/2}><ringGeometry args={[.18,.225,48]} /><meshBasicMaterial color="#8B1E3F" /></mesh>
      <mesh position-y={.19}><cylinderGeometry args={[.01,.01,.38,10]} /><meshStandardMaterial color="#8B1E3F" /></mesh>
      <Shell at={[.067,.345,0]} size={[.135,.08,.014]} color="#8B1E3F" />
    </group>
    {showTrail && trail.length > 1 && <Line points={trail.map((point) => scenePoint(point.x,point.y,.024))} color="#8B1E3F" lineWidth={3} />}
    {showTrail && route.length > 0 && <Line points={[pose,...route].map((point) => scenePoint(point.x,point.y,.018))}
      color="#326976" dashed dashSize={.12} gapSize={.08} lineWidth={2} />}
    <Line points={[scenePoint(pose.x,pose.y,.032),scenePoint(pose.x + .48 * Math.cos(pose.theta),pose.y + .48 * Math.sin(pose.theta),.032)]} color="#274a60" lineWidth={2.5} />
    {showScan && scan.map((ray,i) => <Line key={i} points={[scenePoint(source.x,source.y,.272),
      scenePoint(source.x + ray.distance * Math.cos(ray.angle),source.y + ray.distance * Math.sin(ray.angle),.272)]}
      color={ray.hit ? '#ad3358' : '#31868d'} transparent opacity={ray.hit ? .8 : .42} lineWidth={1.2} />)}
  </>
}
