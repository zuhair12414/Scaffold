import type { MasteryVector } from '../types'
import type { Attempt, StudentModel } from './StudentModel'

// Today's behaviour: mastery is fixed per problem and never moves. Kept as the default so the
// PoC and the leakage harness keep producing the same numbers.
export class StaticStudentModel implements StudentModel {
  readonly name = 'static'
  private values: MasteryVector

  constructor(initial: MasteryVector) {
    this.values = { ...initial }
  }

  mastery(): MasteryVector {
    return { ...this.values }
  }

  record(_a: Attempt): MasteryVector {
    return this.mastery()
  }

  snapshot(): string {
    return JSON.stringify(this.values)
  }

  restore(state: string): void {
    this.values = JSON.parse(state) as MasteryVector
  }
}
