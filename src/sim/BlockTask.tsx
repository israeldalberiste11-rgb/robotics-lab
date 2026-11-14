import { useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import { scenePoint } from './Studio'
import { Card } from './Controls'

export interface Point3 { x: number; y: number; z: number }
export const BLOCK_SIZE = .036
export function useBlockTask(start: Point3, goal: Point3, tip: Point3, closed: boolean, floor = BLOCK_SIZE / 2) {
  const [block, setBlock] = useState(start)
  const [held, setHeld] = useState(false)
  const [status, setStatus] = useState('Align the open gripper with the block.')
  const gap = Math.hypot(tip.x - block.x, tip.y - block.y, tip.z - block.z)
  const position = held ? tip : block
  const reset = () => { setBlock(start); setHeld(false); setStatus('Align the open gripper with the block.') }
  function demonstrate(stage: 'grip' | 'place') {
    setHeld(stage==='grip')
    if (stage==='place') setBlock(goal)
    setStatus(stage==='grip'?'Block held.':'Block placed.')
  }
  function actuate() {
    if (held) {
      if (closed) { setStatus('Open the gripper before releasing.'); return }
      const placed = { ...tip, z: floor }
      setBlock(placed); setHeld(false)
      setStatus(Math.hypot(placed.x-goal.x, placed.y-goal.y) < .05 && tip.z < floor + .09
        ? 'Challenge complete. The block is on the destination pad.' : 'Block released. Reset to retry or pick it up again.')
    } else if (!closed || gap > .05) {
      setStatus('Bring the tool within 50 mm of the block and close the gripper.')
    } else {
      setHeld(true); setStatus('Block held. Move above the destination pad and open the gripper.')
    }
  }
  return { position, held, status, gap, reset, actuate, demonstrate, goal, floor }
}
export type BlockTask = ReturnType<typeof useBlockTask>

export function BlockGeometry({ task }: { task: BlockTask }) {
  return <>
    <mesh position={scenePoint(task.goal.x,task.goal.y,task.floor-BLOCK_SIZE/2+.002)} rotation-x={-Math.PI/2}>
      <ringGeometry args={[.034,.058,40]} /><meshBasicMaterial color="#8B1E3F" />
    </mesh>
    <RoundedBox position={scenePoint(task.position.x,task.position.y,Math.max(task.floor, task.position.z))}
      args={[BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE]} radius={.003} smoothness={2} castShadow receiveShadow>
      <meshStandardMaterial color={task.held ? '#e0ac55' : '#508980'} roughness={.42} />
    </RoundedBox>
  </>
}
export function BlockControls({ task }: { task: BlockTask }) {
  return <Card title="Pick and place">
    <p className="solve-status" role="status">{task.status}</p>
    {!task.held && <p className="solve-status">Tool to block · {(task.gap * 1000).toFixed(0)} mm</p>}
    <div className="sim-buttons"><button onClick={task.actuate}>{task.held ? 'Release block' : 'Grip block'}</button>
      <button onClick={task.reset}>Reset block</button></div>
  </Card>
}
