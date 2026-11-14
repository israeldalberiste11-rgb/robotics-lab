// Engineering coordinates use Z up. The Three.js scene maps (x, y, z) to (x, z, -y).
export interface Vec3 { x: number; y: number; z: number }
export interface ArmPose { j1: number; j2: number; j3: number; wrist: number; grip: number }

export const ARM = { baseHeight: 0.15, shoulder: 0.085, upper: 0.38, fore: 0.34, wrist: 0.105, hand: 0.12 }
export const JOINT_LIMITS = {
  j1: [-180, 180], j2: [-65, 120], j3: [-150, 150], wrist: [-90, 90], grip: [0, 100],
} as const
export const HOME: ArmPose = { j1: 22, j2: 107, j3: -104, wrist: -39, grip: 65 }
export const rad = (d: number) => d * Math.PI / 180
const deg = (r: number) => r * 180 / Math.PI
const normalize = (d: number) => ((d + 180) % 360 + 360) % 360 - 180
const tool = ARM.wrist + ARM.hand
const h = ARM.baseHeight + ARM.shoulder

export function fk({ j1, j2, j3, wrist }: ArmPose): Vec3 {
  const yaw = rad(j1)
  const shoulder = rad(j2)
  const elbow = rad(j2 + j3)
  const pitch = rad(j2 + j3 + wrist)
  const r = ARM.upper * Math.cos(shoulder) + ARM.fore * Math.cos(elbow) + tool * Math.cos(pitch)
  return {
    x: r * Math.cos(yaw),
    y: r * Math.sin(yaw),
    z: h + ARM.upper * Math.sin(shoulder) + ARM.fore * Math.sin(elbow) + tool * Math.sin(pitch),
  }
}

export function ik(target: Vec3, reference = HOME): ArmPose | null {
  if (![target.x, target.y, target.z].every(Number.isFinite)) return null
  // At a fixed wrist angle the forearm and tool form one effective link.
  const wrist = rad(reference.wrist)
  const lx = ARM.fore + tool * Math.cos(wrist)
  const ly = tool * Math.sin(wrist)
  const length = Math.hypot(lx, ly)
  const offset = Math.atan2(ly, lx)
  const r = Math.hypot(target.x, target.y)
  const z = target.z - h
  const yaw = r < 1e-9 ? reference.j1 : deg(Math.atan2(target.y, target.x))
  const cosine = (r * r + z * z - ARM.upper ** 2 - length ** 2) / (2 * ARM.upper * length)
  if (Math.abs(cosine) > 1 + 1e-9) return null

  const candidates: ArmPose[] = []
  for (const direction of [1, -1]) {
    for (const bend of [-1, 1]) {
      const elbow = bend * Math.acos(Math.max(-1, Math.min(1, cosine)))
      const shoulder = Math.atan2(z, direction * r) -
        Math.atan2(length * Math.sin(elbow), ARM.upper + length * Math.cos(elbow))
      const pose = {
        ...reference,
        j1: normalize(yaw + (direction < 0 ? 180 : 0)),
        j2: normalize(deg(shoulder)),
        j3: normalize(deg(elbow - offset)),
      }
      if (pose.j2 >= JOINT_LIMITS.j2[0] - 1e-9 && pose.j2 <= JOINT_LIMITS.j2[1] + 1e-9 &&
          pose.j3 >= JOINT_LIMITS.j3[0] - 1e-9 && pose.j3 <= JOINT_LIMITS.j3[1] + 1e-9) candidates.push(pose)
    }
  }
  const distance = (pose: ArmPose) => normalize(pose.j1 - reference.j1) ** 2 +
    (pose.j2 - reference.j2) ** 2 + (pose.j3 - reference.j3) ** 2
  return candidates.sort((a, b) => distance(a) - distance(b))[0] ?? null
}

export const toScene = ({ x, y, z }: Vec3): [number, number, number] => [x, z, -y]
