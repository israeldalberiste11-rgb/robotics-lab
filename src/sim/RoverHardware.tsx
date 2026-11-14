import { RoundedBox } from '@react-three/drei'
type XYZ = [number, number, number]

import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

export function Harness({ points,color,radius = .0022 }: {points:[number,number,number][];color:string;radius?:number}) {
  const curve=useMemo(()=>new CatmullRomCurve3(points.map(p=>new Vector3(...p))),[points])
  return <mesh castShadow><tubeGeometry args={[curve,18,radius,6,false]}/>
    <meshStandardMaterial color={color} roughness={.58}/>
  </mesh>
}

export function Shell({ at, size, color, radius = .009 }: { at: XYZ; size: XYZ; color: string; radius?: number }) {
  return <RoundedBox position={at} args={size} radius={radius} smoothness={2} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={.41} metalness={.28} />
  </RoundedBox>
}

export function Drum({ at, radius, length, color, axis = 'z', sides = 24 }: { at: XYZ; radius: number; length: number; color: string; axis?: 'x' | 'y' | 'z'; sides?: number }) {
  return <mesh position={at} rotation={axis === 'z' ? [Math.PI / 2, 0, 0] : axis === 'x' ? [0, 0, Math.PI / 2] : [0, 0, 0]} castShadow receiveShadow>
    <cylinderGeometry args={[radius, radius, length, sides]} /><meshStandardMaterial color={color} metalness={.4} roughness={.45} />
  </mesh>
}

