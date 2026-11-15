import type { MasteryVector } from '../types'
import { BKTStudentModel } from './BKTStudentModel'
import { StaticStudentModel } from './StaticStudentModel'
import type { StudentModel } from './StudentModel'

export type StudentModelKind = 'static' | 'bkt'

// VITE_STUDENT_MODEL picks the implementation. 'dkt' will be added once the kt/ service exists.
export function createStudentModel(kind: string | undefined, initial: MasteryVector): StudentModel {
  if (kind === 'bkt') return new BKTStudentModel(initial)
  return new StaticStudentModel(initial)
}

export type { Attempt, StudentModel } from './StudentModel'
