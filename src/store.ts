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

export type Lesson = 'Overview' | 'Concept' | 'Visualization' | 'Experiment' | 'Challenge'

interface LabState {
  lesson: Lesson
  setLesson: (lesson: Lesson) => void
  light: boolean
  toggleTheme: () => void
  active: ModuleId
  set: (m: ModuleId) => void
}

export const useStore = create<LabState>((set) => ({
  lesson: 'Overview',
  setLesson: (lesson) => set({ lesson }),
  light: true,
  toggleTheme: () => set((state) => ({ light: !state.light })),
  active: readHash(),
  set: (m) => {
    window.location.hash = m
    set({ active: m, lesson: 'Overview' })
  },
}))

// Keep store in sync when the user navigates with back/forward.
window.addEventListener('hashchange', () => {
  useStore.setState((state) => state.active === readHash() ? state : { active: readHash(), lesson: 'Overview' })
})
