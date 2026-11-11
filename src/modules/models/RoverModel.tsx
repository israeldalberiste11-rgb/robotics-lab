// Procedural 3D model approximating a 2WD Arduino rover (open hardware).
// Chassis, two TT gear motors + wheels, caster, L298N, HC-SR04 sensor.
// Drives in a slow circle. Styled like a CAD render: light-gray parts, blue accents.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

const BODY = '#752f45'
const DARK = '#5d1f33'
const BOARD = '#a95a6e'
const DRIVER = '#d9b46a'

export function RoverModel({ speed = 1, playing = true }: { speed?: number; playing?: boolean }) {
  const chassis = useRef<THREE.Group>(null!)
  const wheelL = useRef<THREE.Mesh>(null!)
  const wheelR = useRef<THREE.Mesh>(null!)

  useFrame((state, delta) => {
    if (!playing) return
    const t = state.clock.elapsedTime * speed
    if (wheelL.current) wheelL.current.rotation.x += delta * 4 * speed
    if (wheelR.current) wheelR.current.rotation.x += delta * 4 * speed
    if (chassis.current) {
      chassis.current.rotation.y = t * 0.3
      chassis.current.position.x = Math.cos(t * 0.3) * 0.5
      chassis.current.position.z = Math.sin(t * 0.3) * 0.5
    }
  })

  const Wheel = ({ z, refProp }: { z: number; refProp: React.RefObject<THREE.Mesh> }) => (
    <mesh ref={refProp} position={[0, 0.05, z]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.05, 0.05, 0.03, 24]} />
      <meshStandardMaterial color={DARK} roughness={0.6} metalness={0.1} />
    </mesh>
  )

  return (
    <group ref={chassis}>
      {/* chassis plate */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.24, 0.02, 0.16]} />
        <meshStandardMaterial color={BODY} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* motors */}
      <mesh position={[-0.02, 0.05, 0.07]}>
        <boxGeometry args={[0.06, 0.05, 0.03]} />
        <meshStandardMaterial color={DARK} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[-0.02, 0.05, -0.07]}>
        <boxGeometry args={[0.06, 0.05, 0.03]} />
        <meshStandardMaterial color={DARK} roughness={0.55} metalness={0.1} />
      </mesh>
      {/* wheels */}
      <Wheel z={0.09} refProp={wheelL} />
      <Wheel z={-0.09} refProp={wheelR} />
      {/* caster */}
      <mesh position={[0.1, 0.03, 0]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="#c3c7cd" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Arduino board */}
      <mesh position={[0.0, 0.08, 0]}>
        <boxGeometry args={[0.1, 0.015, 0.08]} />
        <meshStandardMaterial color={BOARD} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* L298N driver */}
      <mesh position={[-0.06, 0.08, -0.04]}>
        <boxGeometry args={[0.05, 0.02, 0.04]} />
        <meshStandardMaterial color={DRIVER} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* HC-SR04 sensor facing forward */}
      <group position={[0.12, 0.09, 0]}>
        <mesh>
          <boxGeometry args={[0.02, 0.03, 0.05]} />
          <meshStandardMaterial color="#c3c7cd" roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh position={[0.015, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.01, 16]} />
          <meshStandardMaterial color="#eef0f2" roughness={0.35} metalness={0.25} />
        </mesh>
        <mesh position={[0.015, 0, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.01, 16]} />
          <meshStandardMaterial color="#eef0f2" roughness={0.35} metalness={0.25} />
        </mesh>
      </group>
    </group>
  )
}
