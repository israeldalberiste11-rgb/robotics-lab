// Sense-Think-Act: a simulated robot with a forward ultrasonic ray that
// detects obstacles and steers to avoid them, in a 2D arena.

export interface STAState {
  x: number
  y: number
  theta: number
  v: number
  omega: number
}

export interface Obstacle {
  x: number
  y: number
  r: number
}

export const ARENA = { w: 400, h: 400 }

// Cast a ray from the robot; return the distance to the nearest obstacle (or max).
export function senseDistance(state: STAState, obstacles: Obstacle[], max = 400): number {
  const dirx = Math.cos(state.theta)
  const diry = Math.sin(state.theta)
  let nearest = max
  for (const o of obstacles) {
    // ray-sphere: solve |state.pos + t*dir - o| = o.r
    const ox = o.x - state.x
    const oy = o.y - state.y
    const proj = ox * dirx + oy * diry
    const perp2 = ox * ox + oy * oy - proj * proj
    const r2 = o.r * o.r
    if (perp2 > r2) continue
    const t = proj - Math.sqrt(r2 - perp2)
    if (t > 0 && t < nearest) nearest = t
  }
  return nearest
}

// Wall distance ahead (arena bounds).
export function senseWall(state: STAState, max = 400): number {
  const dirx = Math.cos(state.theta)
  const diry = Math.sin(state.theta)
  const tx = dirx > 0 ? (ARENA.w - state.x) / dirx : dirx < 0 ? -state.x / dirx : Infinity
  const ty = diry > 0 ? (ARENA.h - state.y) / diry : diry < 0 ? -state.y / diry : Infinity
  const t = Math.min(tx, ty)
  return t > 0 && t < max ? t : max
}

// The "think" step: a simple obstacle-avoidance policy.
export function think(state: STAState, dist: number): { v: number; omega: number } {
  const SAFE = 80
  if (dist > SAFE) {
    return { v: 60, omega: 0 } // drive straight
  }
  if (dist < 30) {
    return { v: 0, omega: 1.2 } // too close — spin in place
  }
  // slow and turn to find open space
  return { v: 25, omega: 0.9 }
}

export function stepSTA(state: STAState, cmd: { v: number; omega: number }, dt: number): STAState {
  const thetaMid = state.theta + (cmd.omega * dt) / 2
  let x = state.x + cmd.v * Math.cos(thetaMid) * dt
  let y = state.y + cmd.v * Math.sin(thetaMid) * dt
  let theta = state.theta + cmd.omega * dt
  // wrap arena toroidally so it never escapes
  if (x < 0) x += ARENA.w
  if (x > ARENA.w) x -= ARENA.w
  if (y < 0) y += ARENA.h
  if (y > ARENA.h) y -= ARENA.h
  return { x, y, theta, v: cmd.v, omega: cmd.omega }
}
