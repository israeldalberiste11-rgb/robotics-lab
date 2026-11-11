// Procedural 3D model of an industrial 6-DOF robotic arm.
// Features labeled callouts (SolidWorks-style) and animated pick-and-place operation.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type * as THREE from 'three'
import { PHASES } from '../../lib/pick'

const PHASE_SECONDS = 1.6
const BLOCK = 0.03
const UPPER = 0.26
const FORE = 0.22
const HAND = 0.06

interface Swatch { color: string; roughness: number; metalness: number }

export interface ArmMats {
  body: Swatch
  limb: Swatch
  joint: Swatch
  dark: Swatch
  accent: Swatch
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
const ease = (t: number) => t * t * (3 - 2 * t)
const rad = (d: number) => (d * Math.PI) / 180

function Callout({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div className="rounded border border-neutral-300 bg-white/95 px-2 py-1 text-[10px] font-medium whitespace-nowrap text-neutral-800 shadow-sm">
        {text}
        <div className="absolute left-1/2 top-full h-2 w-px -translate-x-1/2 bg-neutral-300" />
      </div>
    </Html>
  )
}

export function ArmModel({
  speed = 1,
  playing = true,
  mats,
}: {
  speed?: number
  playing?: boolean
  mats: ArmMats
}) {
  const shoulder = useRef<THREE.Group>(null!)
  const elbow = useRef<THREE.Group>(null!)
  const wrist = useRef<THREE.Group>(null!)
  const fingerL = useRef<THREE.Group>(null!)
  const fingerR = useRef<THREE.Group>(null!)
  const carried = useRef<THREE.Group>(null!)
  const carriedMesh = useRef<THREE.Mesh>(null!)
  const stackTop = useRef<THREE.Group>(null!)

  const stackRef = useRef({ count: 3 })
  const clockRef = useRef(0)
  const placedRef = useRef(0)

  const SRC = useMemo(() => {
    const a = rad(72), b = rad(-130)
    const x = Math.cos(a) * UPPER + Math.cos(a + b) * FORE
    const y = Math.sin(a) * UPPER + Math.sin(a + b) * FORE + 0.06
    return [x, y - HAND - BLOCK / 2 - 0.005] as const
  }, [])

  const TGT = useMemo(() => {
    const a = rad(-30), b = rad(-120)
    const x = Math.cos(a) * UPPER + Math.cos(a + b) * FORE
    const y = Math.sin(a) * UPPER + Math.sin(a + b) * FORE + 0.06
    return [x, y - HAND - BLOCK / 2 - 0.005] as const
  }, [])

  useFrame((state, delta) => {
    if (!playing) return
    const dt = Math.min(delta, 0.05) * speed
    clockRef.current += dt

    const t = clockRef.current / PHASE_SECONDS
    const idx = Math.floor(t) % PHASES.length
    const next = (idx + 1) % PHASES.length
    const k = ease(t - Math.floor(t))
    const p = PHASES[idx].pose
    const n = PHASES[next].pose

    const sh = rad(lerp(p.shoulder, n.shoulder, k))
    const el = rad(lerp(p.elbow, n.elbow, k))
    const wr = rad(lerp(p.wrist, n.wrist, k))
    const gr = lerp(p.gripper, n.gripper, k)

    if (shoulder.current) shoulder.current.rotation.z = sh
    if (elbow.current) elbow.current.rotation.z = el
    if (wrist.current) wrist.current.rotation.z = wr
    const spread = 0.012 + gr * 0.032
    if (fingerL.current) fingerL.current.position.z = spread
    if (fingerR.current) fingerR.current.position.z = -spread

    const hold = lerp(PHASES[idx].hold, PHASES[next].hold, k)
    if (carried.current && carriedMesh.current) {
      if (hold > 0.02) {
        carriedMesh.current.visible = true
        carried.current.position.x = lerp(SRC[0], 0, hold)
        carried.current.position.y = lerp(SRC[1], 0, hold)
        if (hold < 0.2 && stackTop.current) stackTop.current.position.y = 0.03 + stackRef.current.count * BLOCK
      } else {
        carried.current.position.set(SRC[0], SRC[1], 0)
        carriedMesh.current.visible = stackRef.current.count > 0
      }
    }
  })

  useFrame(() => {
    const idx = Math.floor(clockRef.current / PHASE_SECONDS) % PHASES.length
    const prev = (idx + PHASES.length - 1) % PHASES.length
    if (PHASES[idx].id === 'reach' && PHASES[prev].id === 'open') {
      stackRef.current.count = 3
      placedRef.current = 0
      if (stackTop.current) stackTop.current.position.y = 0.03 + 3 * BLOCK
    }
    if (PHASES[idx].id === 'open') {
      stackRef.current.count = 2
    }
  })

  return (
    <group>
      {/* Base Pedestal */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.06, 32]} />
        <meshStandardMaterial color={mats.dark.color} roughness={mats.dark.roughness} metalness={mats.dark.metalness} />
      </mesh>

      {/* Source stack of blocks */}
      <group position={[SRC[0], 0, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.03 + i * BLOCK, 0]}>
            <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
            <meshStandardMaterial color={mats.accent.color} roughness={mats.accent.roughness} metalness={mats.accent.metalness} />
          </mesh>
        ))}
        <group ref={stackTop} />
      </group>

      {/* Target platform */}
      <mesh position={[TGT[0], 0.015, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.03, 24]} />
        <meshStandardMaterial color={mats.dark.color} roughness={mats.dark.roughness} metalness={mats.dark.metalness} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[TGT[0], 0.045 + i * BLOCK, 0]}>
          <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
          <meshStandardMaterial color={mats.accent.color} roughness={mats.accent.roughness} metalness={mats.accent.metalness} />
        </mesh>
      ))}

      {/* Shoulder Joint */}
      <group ref={shoulder} position={[0, 0.06, 0]}>
        <mesh>
          <sphereGeometry args={[0.04, 20, 20]} />
          <meshStandardMaterial color={mats.joint.color} roughness={mats.joint.roughness} metalness={mats.joint.metalness} />
        </mesh>
        {/* Upper Arm Link */}
        <mesh position={[0, UPPER / 2, 0]}>
          <boxGeometry args={[0.05, UPPER, 0.05]} />
          <meshStandardMaterial color={mats.limb.color} roughness={mats.limb.roughness} metalness={mats.limb.metalness} />
        </mesh>

        {/* Elbow Joint */}
        <group ref={elbow} position={[0, UPPER, 0]}>
          <mesh>
            <sphereGeometry args={[0.035, 20, 20]} />
            <meshStandardMaterial color={mats.joint.color} roughness={mats.joint.roughness} metalness={mats.joint.metalness} />
          </mesh>
          {/* Forearm Link */}
          <mesh position={[0, FORE / 2, 0]}>
            <boxGeometry args={[0.045, FORE, 0.045]} />
            <meshStandardMaterial color={mats.limb.color} roughness={mats.limb.roughness} metalness={mats.limb.metalness} />
          </mesh>

          {/* Wrist Joint */}
          <group ref={wrist} position={[0, FORE, 0]}>
            <mesh>
              <sphereGeometry args={[0.03, 20, 20]} />
              <meshStandardMaterial color={mats.joint.color} roughness={mats.joint.roughness} metalness={mats.joint.metalness} />
            </mesh>
            {/* Palm */}
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.03, 0.03, 0.05]} />
              <meshStandardMaterial color={mats.body.color} roughness={mats.body.roughness} metalness={mats.body.metalness} />
            </mesh>
            {/* Fingers */}
            <group ref={fingerL} position={[0, 0.055, 0.02]}>
              <mesh position={[0, 0.01, 0]}>
                <boxGeometry args={[0.015, 0.05, 0.012]} />
                <meshStandardMaterial color={mats.limb.color} roughness={mats.limb.roughness} metalness={mats.limb.metalness} />
              </mesh>
            </group>
            <group ref={fingerR} position={[0, 0.055, -0.02]}>
              <mesh position={[0, 0.01, 0]}>
                <boxGeometry args={[0.015, 0.05, 0.012]} />
                <meshStandardMaterial color={mats.limb.color} roughness={mats.limb.roughness} metalness={mats.limb.metalness} />
              </mesh>
            </group>

            {/* Carried Block */}
            <group ref={carried} position={[0, HAND + BLOCK / 2, 0]}>
              <mesh ref={carriedMesh}>
                <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
                <meshStandardMaterial color={mats.accent.color} roughness={mats.accent.roughness} metalness={mats.accent.metalness} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* Labeled Callouts (SolidWorks Style) */}
      <Callout text="Shoulder Joint (Base Rotation)" position={[0, 0.06, 0.08]} />
      <Callout text="Upper Arm Link" position={[0, 0.06 + UPPER / 2, 0.06]} />
      <Callout text="Elbow Joint" position={[0, 0.06 + UPPER, 0.06]} />
      <Callout text="Forearm Link" position={[0, 0.06 + UPPER + FORE / 2, 0.06]} />
      <Callout text="Wrist Joint (3-Axis)" position={[0, 0.06 + UPPER + FORE, 0.06]} />
      <Callout text="End Effector (Gripper)" position={[0, 0.06 + UPPER + FORE + 0.08, 0.06]} />
    </group>
  )
}
