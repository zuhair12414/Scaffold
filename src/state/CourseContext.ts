import { createContext } from 'react'
import type { ChatTurn, HintAuditEvent, Lab, LabPolicy, ManualMeta, Submission } from '../types'

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

export type NewSubmissionInput = {
  studentId: string
  labId: string
  questionId: string
  code: string
  compileOk: boolean
  testsPassed: number
  testsFailed: number
  timeOnTaskMin: number
}

export type CourseContextValue = {
  labs: Lab[]
  manuals: ManualMeta[]
  manualFiles: Record<string, File>
  policies: LabPolicy[]
  sessionSubmissions: Submission[]
  sessionHints: HintAuditEvent[]
  sessionChat: ChatTurn[]
  currentLab: Lab | null
  currentPolicy: LabPolicy | null
  createLab: (lab: NewLabInput) => Lab
  addManual: (manual: NewManualInput) => ManualMeta
  removeManual: (manualId: string) => void
  updatePolicy: (labId: string, patch: Partial<Omit<LabPolicy, 'labId'>>) => void
  setCurrentLab: (labId: string) => void
  setLabStatus: (labId: string, status: Lab['status']) => void
  deleteLab: (labId: string) => void
  submitAttempt: (input: NewSubmissionInput) => Submission
  logHint: (event: Omit<HintAuditEvent, 'id' | 'timestamp'>) => void
  appendChat: (turn: Omit<ChatTurn, 'id' | 'at'>) => void
  resetCourse: () => void
}

// Kept apart from the provider so the module that owns the component can hot-reload.
export const CourseContext = createContext<CourseContextValue | null>(null)
