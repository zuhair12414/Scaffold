// Q-matrix: which concepts each problem exercises. The student model tracks concepts, not
// problems, because 45 problems over 15 labs is too sparse to trace one by one.
export const CONCEPTS = [
  'functions',
  'conditionals',
  'loops',
  'arrays',
  'strings',
  'recursion',
  'pointers',
  'structs',
  'classes',
  'file-io',
] as const

export type Concept = (typeof CONCEPTS)[number]

export const QMATRIX: Record<string, Concept[]> = {
  P02: ['recursion', 'functions'],
}

export function conceptsFor(problemId: string): Concept[] {
  return QMATRIX[problemId] ?? []
}
