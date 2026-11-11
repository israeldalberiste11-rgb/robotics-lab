// Planar-arm math shared by the forward and inverse kinematics modules.
// All angles in radians, y-axis up (math convention).

export interface Pt { x: number; y: number }

// Given joint angles (each relative to the previous link) and link lengths,
// return the positions of the base, each joint, and the end effector.
export function forwardKinematics(angles: number[], lengths: number[]): Pt[] {
  const pts: Pt[] = [{ x: 0, y: 0 }]
  let cum = 0
  let x = 0
  let y = 0
  for (let i = 0; i < angles.length; i++) {
    cum += angles[i]
    x += lengths[i] * Math.cos(cum)
    y += lengths[i] * Math.sin(cum)
    pts.push({ x, y })
  }
  return pts
}

// Analytic inverse kinematics for a 2-link planar arm.
// Returns [theta1, theta2] (elbow-up solution) or null if unreachable.
export function inverseKinematics2(
  target: Pt,
  l1: number,
  l2: number,
): [number, number] | null {
  const { x, y } = target
  const d2 = x * x + y * y
  const d = Math.sqrt(d2)
  const reachMax = l1 + l2
  const reachMin = Math.abs(l1 - l2)
  if (d > reachMax - 1e-6 || d < reachMin + 1e-6) return null
  const cos2 = (d2 - l1 * l1 - l2 * l2) / (2 * l1 * l2)
  const theta2 = Math.acos(Math.max(-1, Math.min(1, cos2)))
  const theta1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(theta2), l1 + l2 * Math.cos(theta2))
  return [theta1, theta2]
}

export const toDeg = (r: number) => (r * 180) / Math.PI
export const toRad = (d: number) => (d * Math.PI) / 180
