import type { ComponentType } from 'react'
import type { ModuleId } from './store'
import { ForwardKinematics } from './modules/ForwardKinematics'
import { InverseKinematics } from './modules/InverseKinematics'
import { DifferentialDrive } from './modules/DifferentialDrive'
import { PIDControl } from './modules/PIDControl'
import { SenseThinkAct } from './modules/SenseThinkAct'
import { Builds3D } from './modules/Builds3D'

export interface ModuleDef {
  id: ModuleId
  title: string
  blurb: string
  principle: string
  Component: ComponentType
}

export const MODULES: ModuleDef[] = [
  {
    id: 'forward-kinematics',
    title: 'Forward Kinematics',
    blurb: 'Drag the joint angles → watch the arm move.',
    principle: 'Given joint angles, where is the end of the arm?',
    Component: ForwardKinematics,
  },
  {
    id: 'inverse-kinematics',
    title: 'Inverse Kinematics',
    blurb: 'Set a 3D target and solve for the joint angles.',
    principle: 'Given a goal point, what joint angles reach it?',
    Component: InverseKinematics,
  },
  {
    id: 'differential-drive',
    title: 'Differential Drive',
    blurb: 'Set wheel speeds → see how a 2-wheel robot steers.',
    principle: 'How left/right wheel speeds create turning.',
    Component: DifferentialDrive,
  },
  {
    id: 'pid-control',
    title: 'PID Controller',
    blurb: 'Tune Kp / Ki / Kd → watch the step response.',
    principle: 'The control loop that keeps robots on target.',
    Component: PIDControl,
  },
  {
    id: 'sense-think-act',
    title: 'Sense–Think–Act Loop',
    blurb: 'A robot with one ultrasonic eye avoids walls.',
    principle: 'The feedback cycle every autonomous robot runs.',
    Component: SenseThinkAct,
  },
  {
    id: 'builds-3d',
    title: '3D Real Builds',
    blurb: 'Inspect real open-source robots in motion — orbit, pause, scrub.',
    principle: 'How documented open-source robots actually move.',
    Component: Builds3D,
  },
]
