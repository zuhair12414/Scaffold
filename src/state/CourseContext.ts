import { createContext } from 'react'
import type { Lab, LabPolicy, ManualMeta } from '../types'

export type NewLabInput = {
  title: string
  statement: string
  kcIds: Lab['kcIds']
  dueAt: string
  starterCode: string
}

export type NewManualInput = {
  labId: string
  file: File
}

export type CourseContextValue = {
  labs: Lab[]
  manuals: ManualMeta[]
  policies: LabPolicy[]
  currentLab: Lab | null
  currentPolicy: LabPolicy | null
  createLab: (lab: NewLabInput) => Lab
  addManual: (manual: NewManualInput) => ManualMeta
  removeManual: (manualId: string) => void
  updatePolicy: (labId: string, patch: Partial<Omit<LabPolicy, 'labId'>>) => void
  setCurrentLab: (labId: string) => void
  resetCourse: () => void
}

// Kept apart from the provider so the module that owns the component can hot-reload.
export const CourseContext = createContext<CourseContextValue | null>(null)
