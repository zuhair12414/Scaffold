import type { MasteryVector } from '../types'

// One graded attempt: the unit every student model learns from.
export type Attempt = {
  problemId: string
  concepts: string[] // from the Q-matrix
  correct: boolean // every test, visible and hidden, passed
  t: string // ISO timestamp
  testsPassed?: number
  testsTotal?: number
}

// The seam for knowledge tracing, mirroring HintProvider. The PoC ships a static model and BKT.
// DKT plugs in here later (served from the kt/ package) without any component changing.
// Training happens offline; at runtime record() is a single forward update of this student's state.
export interface StudentModel {
  readonly name: string
  mastery(): MasteryVector
  record(a: Attempt): MasteryVector
  snapshot(): string
  restore(state: string): void
}
