// Pick-and-place demo for the InMoov arm (CC BY-SA).
// The arm cycles through: approach → close gripper on a block → lift → place → open gripper.
// Each phase is described in the on-screen panel so the movement explains itself.

export type PhaseId = 'reach' | 'grab' | 'lift' | 'move' | 'place' | 'open'

export interface Phase {
  id: PhaseId
  label: string
  /** Joint poses, degrees: shoulder, elbow, wrist, gripper (0=closed, 1=open) */
  pose: { shoulder: number; elbow: number; wrist: number; gripper: number }
  /** Where the carried block sits relative to the gripper */
  hold: number
  /** One-line explanation shown in the panel */
  explain: string
}

/** Phases at 1s each. Poses are tuned so the gripper meets the block at (x≈0.28, y≈0.05). */
export const PHASES: Phase[] = [
  {
    id: 'reach',
    label: '1 · Reach',
    pose: { shoulder: 72, elbow: -130, wrist: 58, gripper: 1 },
    hold: 0,
    explain:
      'The shoulder servo rotates the whole arm forward and the elbow servo straightens it — a position command in degrees, not a force. The wrist servo orients the gripper so both fingers straddle the block.',
  },
  {
    id: 'grab',
    label: '2 · Close gripper',
    pose: { shoulder: 72, elbow: -130, wrist: 58, gripper: 0 },
    hold: 1,
    explain:
      'The gripper servo drives two linkages that swing the fingers together. Grip force comes from stalling the servo against the block — it keeps pushing gently until the driver limits current. The block is now held by friction.',
  },
  {
    id: 'lift',
    label: '3 · Lift',
    pose: { shoulder: 30, elbow: -70, wrist: 40, gripper: 0 },
    hold: 1,
    explain:
      'The elbow servo contracts (like a bicep curl) while the shoulder lifts slightly. Raising the arm raises the block — the joint angles are interpolated smoothly between poses, so the motion looks continuous.',
  },
  {
    id: 'move',
    label: '4 · Swing over target',
    pose: { shoulder: -40, elbow: -80, wrist: 35, gripper: 0 },
    hold: 1,
    explain:
      'The shoulder servo sweeps the whole arm sideways to the target position. Each servo runs its own PID loop to reach the commanded angle exactly, even with the weight of the block tugging on it.',
  },
  {
    id: 'place',
    label: '5 · Lower',
    pose: { shoulder: -30, elbow: -120, wrist: 55, gripper: 0 },
    hold: 1,
    explain:
      'The elbow and shoulder servo together to lower the block onto the target without letting go. Real arms use a gentle speed here so the landing is soft.',
  },
  {
    id: 'open',
    label: '6 · Release',
    pose: { shoulder: -30, elbow: -120, wrist: 55, gripper: 1 },
    hold: 0,
    explain:
      'The gripper servo reverses, the fingers swing apart and friction disappears — the block stays behind. The cycle then repeats from step 1.',
  },
]
