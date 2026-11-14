import { useGLTF } from '@react-three/drei'
import type { Mesh } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import model from '../assets/mechanical-parts.glb?url'

export function MechanicalPart({ part, ...transform }: {part:string} & ThreeElements['group']) {
  const { nodes } = useGLTF(model)
  const mesh = nodes[part] as Mesh
  return <group {...transform}><mesh geometry={mesh.geometry} material={mesh.material} name={part} castShadow receiveShadow/></group>
}
