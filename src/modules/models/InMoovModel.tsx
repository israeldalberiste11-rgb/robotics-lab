// Procedural 3D model approximating the InMoov arm (CC BY-SA).
// Serial chain: shoulder → upper arm → elbow → forearm → wrist → 2-finger gripper.
// Styled like a CAD render: light-gray parts with darker edge lines, blue joint accents.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

// CAD-style palette
const BODY = '#a95a6e'
const JOINT = '#d9b46a'
const GRIP = '#752f45'

function Box({
  args,
  position,
  color = BODY,
}: {
  args: [number, number, number]
  position: [number, number, number]
  color?: string
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
    </mesh>
  )
}

export function InMoovModel({ speed = 1, playing = true }: { speed?: number; playing?: boolean }) {
  const shoulder = useRef<THREE.Group>(null!)
  const elbow = useRef<THREE.Group>(null!)
  const wrist = useRef<THREE.Group>(null!)
  const gripper = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (!playing) return
    const t = state.clock.elapsedTime * speed
    if (shoulder.current) shoulder.current.rotation.z = Math.sin(t * 0.6) * 0.4
    if (elbow.current) elbow.current.rotation.z = -0.5 - Math.sin(t * 0.6 + 1) * 0.4
    if (wrist.current) wrist.current.rotation.z = Math.sin(t * 1.2) * 0.5
    if (gripper.current) {
      const open = (Math.sin(t * 0.8) + 1) / 2
      gripper.current.children.forEach((c: THREE.Object3D, i: number) => {
        c.position.z = (i === 0 ? 1 : -1) * (0.01 + open * 0.03)
      })
    }
  })

  return (
    <group>
      {/* base pedestal */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.06, 32]} />
        <meshStandardMaterial color="#752f45" roughness={0.55} metalness={0.08} />
      </mesh>

      {/* shoulder joint */}
      <group ref={shoulder} position={[0, 0.06, 0]}>
        <mesh>
          <sphereGeometry args={[0.04, 20, 20]} />
          <meshStandardMaterial color={JOINT} roughness={0.35} metalness={0.2} />
        </mesh>
        {/* upper arm */}
        <Box args={[0.05, 0.26, 0.05]} position={[0, 0.13, 0]} />

        {/* elbow */}
        <group ref={elbow} position={[0, 0.26, 0]}>
          <mesh>
            <sphereGeometry args={[0.035, 20, 20]} />
            <meshStandardMaterial color={JOINT} roughness={0.35} metalness={0.2} />
          </mesh>
          {/* forearm */}
          <Box args={[0.045, 0.22, 0.045]} position={[0, 0.11, 0]} />

          {/* wrist + gripper */}
          <group ref={wrist} position={[0, 0.22, 0]}>
            <mesh>
              <sphereGeometry args={[0.03, 20, 20]} />
              <meshStandardMaterial color={JOINT} roughness={0.35} metalness={0.2} />
            </mesh>
            <group ref={gripper}>
              <Box args={[0.015, 0.06, 0.02]} position={[0.02, 0.03, 0]} color={GRIP} />
              <Box args={[0.015, 0.06, 0.02]} position={[-0.02, 0.03, 0]} color={GRIP} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
