import type { MasteryVector } from '../types'

// The student model replaces chat history as the LLM's memory: a few fixed-size lines instead of
// a transcript that grows every turn. Same length on the third attempt or the three-hundredth.
export function band(p: number): 'weak' | 'developing' | 'strong' {
  return p >= 0.7 ? 'strong' : p >= 0.4 ? 'developing' : 'weak'
}

export function formatStudentState(
  mastery: MasteryVector,
  opts: { concepts?: string[]; attempts?: number; failStreak?: number; hintsSoFar?: number[] } = {},
): string {
  const keys = opts.concepts?.length ? opts.concepts : Object.keys(mastery)
  const state = keys
    .filter((c) => c in mastery)
    .map((c) => `${c} ${mastery[c].toFixed(2)} (${band(mastery[c])})`)
    .join(', ')
  const lines = [`Student state: ${state || 'unknown'}`]
  if (opts.attempts !== undefined || opts.failStreak !== undefined) {
    lines.push(`This problem: ${opts.attempts ?? 0} runs, fail streak ${opts.failStreak ?? 0}`)
  }
  if (opts.hintsSoFar) {
    lines.push(`Hints so far: ${opts.hintsSoFar.length ? opts.hintsSoFar.map((l) => `L${l}`).join(', ') : 'none'}`)
  }
  return lines.join('\n')
}
