// Procedural 3D model approximating Stanford Pupper (MIT).
// 4 legs × 3 servos (hip abduction, hip flexion, knee). Animated trot gait.
// Styled like a CAD render: light-gray parts, blue joint accents.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

const LEG_X = 0.11
const LEG_Z = 0.09
const THIGH = 0.12
const SHIN = 0.12

const BODY = '#752f45'
const LIMB = '#a95a6e'
const JOINT = '#d9b46a'
const FOOT = '#5d1f33'

function Leg({ x, z, phase, speed, playing }: { x: number; z: number; phase: number; speed: number; playing: boolean }) {
  const hip = useRef<THREE.Group>(null!)
  const knee = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (!playing) return
    const t = state.clock.elapsedTime * speed + phase
    const swing = Math.sin(t) * 0.5
    const lift = Math.max(0, Math.sin(t)) * 0.6
    if (hip.current) hip.current.rotation.x = swing
    if (knee.current) knee.current.rotation.x = -0.4 - lift
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={hip}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.05, 0.04, 0.05]} />
          <meshStandardMaterial color={JOINT} roughness={0.4} metalness={0.15} />
        </mesh>
        <mesh position={[0, -THIGH / 2, 0]}>
          <boxGeometry args={[0.03, THIGH, 0.03]} />
          <meshStandardMaterial color={LIMB} roughness={0.55} metalness={0.08} />
        </mesh>
        <group ref={knee} position={[0, -THIGH, 0]}>
          <mesh>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial color={JOINT} roughness={0.4} metalness={0.15} />
          </mesh>
          <mesh position={[0, -SHIN / 2, 0]}>
            <boxGeometry args={[0.028, SHIN, 0.028]} />
            <meshStandardMaterial color={LIMB} roughness={0.55} metalness={0.08} />
          </mesh>
          <mesh position={[0, -SHIN, 0]}>
            <sphereGeometry args={[0.02, 12, 12]} />
            <meshStandardMaterial color={FOOT} roughness={0.6} metalness={0.05} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export function PupperModel({ speed = 1, playing = true }: { speed?: number; playing?: boolean }) {
  return (
    <group>
      {/* body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.22, 0.07, 0.16]} />
        <meshStandardMaterial color={BODY} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* head / sensor */}
      <mesh position={[0.16, 0.22, 0]}>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial color={JOINT} roughness={0.4} metalness={0.15} />
      </mesh>
      {/* legs: diagonal pairs for trot gait */}
      <Leg x={LEG_X} z={LEG_Z} phase={0} speed={speed} playing={playing} />
      <Leg x={LEG_X} z={-LEG_Z} phase={Math.PI} speed={speed} playing={playing} />
      <Leg x={-LEG_X} z={LEG_Z} phase={Math.PI} speed={speed} playing={playing} />
      <Leg x={-LEG_X} z={-LEG_Z} phase={0} speed={speed} playing={playing} />
    </group>
  )
}
