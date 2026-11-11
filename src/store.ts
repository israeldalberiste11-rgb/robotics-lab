import { create } from 'zustand'

export type ModuleId =
  | 'forward-kinematics'
  | 'inverse-kinematics'
  | 'differential-drive'
  | 'pid-control'
  | 'sense-think-act'
  | 'builds-3d'

const VALID: ModuleId[] = [
  'forward-kinematics',
  'inverse-kinematics',
  'differential-drive',
  'pid-control',
  'sense-think-act',
  'builds-3d',
]

function readHash(): ModuleId {
  const h = window.location.hash.replace('#', '')
  return (VALID as string[]).includes(h) ? (h as ModuleId) : 'forward-kinematics'
}

interface LabState {
  active: ModuleId
  set: (m: ModuleId) => void
}

export const useStore = create<LabState>((set) => ({
  active: readHash(),
  set: (m) => {
    window.location.hash = m
    set({ active: m })
  },
}))

// Keep store in sync when the user navigates with back/forward.
window.addEventListener('hashchange', () => {
  useStore.setState({ active: readHash() })
})
