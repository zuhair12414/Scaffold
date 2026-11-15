import type { MasteryVector } from '../types'
import type { Attempt, StudentModel } from './StudentModel'

export type BKTParams = { pInit: number; pLearn: number; pSlip: number; pGuess: number }

// Placeholder parameters until kt/models/bkt.py fits them per concept on CSEDM and our own logs.
export const DEFAULT_BKT: BKTParams = { pInit: 0.3, pLearn: 0.1, pSlip: 0.1, pGuess: 0.2 }

// Bayesian Knowledge Tracing, one hidden "knows it" bit per concept. This is the baseline DKT
// has to beat on held-out students before it replaces it.
export class BKTStudentModel implements StudentModel {
  readonly name = 'bkt'
  private p: MasteryVector
  private params: Record<string, BKTParams>
  private fallback: BKTParams

  constructor(initial: MasteryVector = {}, params: Record<string, BKTParams> = {}, fallback: BKTParams = DEFAULT_BKT) {
    this.p = { ...initial }
    this.params = params
    this.fallback = fallback
  }

  private paramsFor(concept: string): BKTParams {
    return this.params[concept] ?? this.fallback
  }

  mastery(): MasteryVector {
    return { ...this.p }
  }

  record(a: Attempt): MasteryVector {
    for (const c of a.concepts) {
      const { pInit, pLearn, pSlip, pGuess } = this.paramsFor(c)
      const L = this.p[c] ?? pInit
      const posterior = a.correct
        ? (L * (1 - pSlip)) / (L * (1 - pSlip) + (1 - L) * pGuess)
        : (L * pSlip) / (L * pSlip + (1 - L) * (1 - pGuess))
      this.p[c] = posterior + (1 - posterior) * pLearn
    }
    return this.mastery()
  }

  snapshot(): string {
    return JSON.stringify(this.p)
  }

  restore(state: string): void {
    this.p = JSON.parse(state) as MasteryVector
  }
}
