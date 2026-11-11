// Differential-drive kinematics for a 2-wheel robot.
// v_left, v_right are wheel linear speeds (units/s); L is the wheelbase.

export interface Pose { x: number; y: number; theta: number }

export function stepDifferential(
  pose: Pose,
  vLeft: number,
  vRight: number,
  L: number,
  dt: number,
): Pose {
  const v = (vLeft + vRight) / 2
  const omega = (vRight - vLeft) / L
  // Integrate pose. Use the midpoint heading for a smoother arc.
  const thetaMid = pose.theta + (omega * dt) / 2
  return {
    x: pose.x + v * Math.cos(thetaMid) * dt,
    y: pose.y + v * Math.sin(thetaMid) * dt,
    theta: pose.theta + omega * dt,
  }
}

// Instantaneous center of rotation offset (perpendicular to heading).
// Infinity when driving straight (omega ~ 0).
export function turningRadius(vLeft: number, vRight: number, L: number): number | null {
  const omega = (vRight - vLeft) / L
  if (Math.abs(omega) < 1e-6) return null
  const v = (vLeft + vRight) / 2
  return v / omega
}
