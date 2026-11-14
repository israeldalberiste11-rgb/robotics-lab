import { stepDifferential, type Pose } from './drive'

export interface Point { x: number; y: number }
export interface Obstacle extends Point { id: string; r: number; kind: 'crate' | 'barrier' | 'tree' | 'shed' }
export interface Reading { angle: number; distance: number; hit: string | null }
export interface Command { v: number; omega: number; action: string }
export const START: Pose = { x: -3.6, y: -1.6, theta: 0 }
export const GOAL: Point = { x: 3.3, y: 1.75 }
export const BOUNDS = { x: 4.75, y: 3.35 }
export const SENSOR_OFFSET = .23
export const SENSOR_RANGE = 1.65
export const ROVER_CLEARANCE = .31
export const OBSTACLES: Obstacle[] = [
  { id: 'Cargo crates', x: -1.3, y: -.76, r: .42, kind: 'crate' },
  { id: 'Course barrier', x: .32, y: .65, r: .62, kind: 'barrier' },
  { id: 'Equipment shelter', x: -3.36, y: 1.99, r: .74, kind: 'shed' },
  { id: 'East tree', x: 2.72, y: -.98, r: .25, kind: 'tree' },
  { id: 'North tree', x: .92, y: 2.56, r: .25, kind: 'tree' },
  { id: 'West tree', x: -3.92, y: -.03, r: .25, kind: 'tree' },
]
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
export const angleDelta = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle))
export const sensorOrigin = (pose: Pose): Point => ({
  x: pose.x + Math.cos(pose.theta) * SENSOR_OFFSET, y: pose.y + Math.sin(pose.theta) * SENSOR_OFFSET,
})

export function free(point: Point, obstacles: Obstacle[], clearance = ROVER_CLEARANCE) {
  return Math.abs(point.x) <= BOUNDS.x - clearance && Math.abs(point.y) <= BOUNDS.y - clearance &&
    obstacles.every((obstacle) => distance(point, obstacle) >= obstacle.r + clearance)
}

function segmentFree(a: Point, b: Point, obstacles: Obstacle[], clearance: number) {
  if (!free(a, obstacles, clearance) || !free(b, obstacles, clearance)) return false
  const dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy
  return obstacles.every((obstacle) => {
    const t = squared ? clamp(((obstacle.x - a.x) * dx + (obstacle.y - a.y) * dy) / squared, 0, 1) : 0
    return Math.hypot(a.x + dx * t - obstacle.x, a.y + dy * t - obstacle.y) >= obstacle.r + clearance
  })
}

export interface SensorOptions { range?: number; noise?: number; sample?: number; offset?: number; halfAngle?: number; includeBoundary?: boolean }
export function sense(pose: Pose, obstacles: Obstacle[], options:SensorOptions = {}): Reading[] {
  const range = options.range ?? SENSOR_RANGE
  const noise = options.noise ?? 0
  const sample = options.sample ?? 0
  const offset = options.offset ?? SENSOR_OFFSET
  const halfAngle = options.halfAngle ?? 5 * Math.PI / 24
  const source = {x:pose.x+offset*Math.cos(pose.theta), y:pose.y+offset*Math.sin(pose.theta)}
  return Array.from({ length: 11 }, (_, index) => {
    const angle = pose.theta + (index - 5) * halfAngle / 5
    const x = Math.cos(angle), y = Math.sin(angle)
    const edgeX = Math.abs(x) < 1e-9 ? Infinity : (Math.sign(x) * BOUNDS.x - source.x) / x
    const edgeY = Math.abs(y) < 1e-9 ? Infinity : (Math.sign(y) * BOUNDS.y - source.y) / y
    let distance = options.includeBoundary === false ? range : Math.min(range, edgeX, edgeY)
    let hit = distance < range ? 'Field boundary' : null
    for (const obstacle of obstacles) {
      const dx = obstacle.x - source.x, dy = obstacle.y - source.y
      const projection = dx * x + dy * y
      const discriminant = obstacle.r ** 2 - (dx * dx + dy * dy - projection * projection)
      if (discriminant < 0) continue
      const near = dx*dx+dy*dy<obstacle.r**2 ? 0 : projection - Math.sqrt(discriminant)
      if (near >= 0 && near < distance) { distance = near; hit = obstacle.id }
    }
    const variation = Math.sin((index+1)*17.17 + sample*23.81)*noise
    return { angle, distance:clamp(distance+variation,0,range), hit }
  })
}

// A* on a clearance-inflated occupancy grid. Edges use the same collision
// envelope as the rover, plus a small steering margin.
export function plan(start: Point, goal: Point, obstacles: Obstacle[]): Point[] {
  const spacing = .24
  const margin = ROVER_CLEARANCE + .065
  if (!free(start, obstacles) || !free(goal, obstacles)) return []
  if (segmentFree(start, goal, obstacles, margin)) return [goal]
  const grid: Point[] = []
  const cols = 39, rows = 27
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid.push({
    x: (x - (cols - 1) / 2) * spacing, y: (y - (rows - 1) / 2) * spacing,
  })
  const nearest = (point: Point) => {
    let index = -1, best = Infinity
    grid.forEach((candidate, i) => {
      const d = distance(point, candidate)
      if (d < best && segmentFree(point, candidate, obstacles, ROVER_CLEARANCE)) { index = i; best = d }
    })
    return index
  }
  const first = nearest(start), last = nearest(goal)
  if (first < 0 || last < 0) return []
  const scores = new Float64Array(grid.length).fill(Infinity)
  const parent = new Int32Array(grid.length).fill(-1)
  const open = new Set([first])
  scores[first] = 0
  while (open.size) {
    let node = first, best = Infinity
    for (const i of open) {
      const cost = scores[i] + distance(grid[i], grid[last])
      if (cost < best) { best = cost; node = i }
    }
    if (node === last) {
      const path: Point[] = [goal]
      for (let i = last; i >= 0; i = parent[i]) path.unshift(grid[i])
      const simplified: Point[] = []
      let anchor = start
      for (let i = 0; i < path.length;) {
        let furthest = path.length - 1
        while (furthest > i && !segmentFree(anchor, path[furthest], obstacles, margin)) furthest--
        anchor = path[furthest]
        simplified.push(anchor)
        i = furthest + 1
      }
      return simplified
    }
    open.delete(node)
    const column = node % cols, row = Math.floor(node / cols)
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dy) || column + dx < 0 || column + dx >= cols || row + dy < 0 || row + dy >= rows) continue
      const neighbor = node + dy * cols + dx
      const score = scores[node] + Math.hypot(dx, dy) * spacing
      const clearance = node === first || neighbor === last ? ROVER_CLEARANCE : margin
      if (score >= scores[neighbor] || !segmentFree(grid[node], grid[neighbor], obstacles, clearance)) continue
      parent[neighbor] = node
      scores[neighbor] = score
      open.add(neighbor)
    }
  }
  return []
}

export function navigate(pose: Pose, goal: Point, waypoint: Point | undefined, scan: Reading[]): Command {
  if (distance(pose, goal) < .075) return { v: 0, omega: 0, action: 'Destination reached' }
  if (!waypoint) return { v: 0, omega: 0, action: 'No collision-free route' }
  const heading = Math.atan2(waypoint.y - pose.y, waypoint.x - pose.x)
  const error = angleDelta(heading - pose.theta)
  const omega = clamp(error * 4.4, -2.1, 2.1)
  if (Math.abs(error) > .19) return { v: 0, omega, action: 'Align to next waypoint' }
  const front = scan[5].distance
  return { v: Math.min(.66, distance(pose, waypoint) * 3, Math.max(.12, front * 1.2)), omega,
    action: front < .6 ? 'Slow near sensed obstacle' : 'Follow planned route' }
}

export function applyCommand(pose: Pose, cmd: Command, track: number, dt: number, obstacles: Obstacle[]) {
  const l = cmd.v - cmd.omega * track / 2, r = cmd.v + cmd.omega * track / 2
  const next = stepDifferential(pose, l, r, track, dt)
  return segmentFree(pose, next, obstacles, ROVER_CLEARANCE)
    ? { pose: next, l, r, blocked: false }
    : { pose, l: 0, r: 0, blocked: true }
}
