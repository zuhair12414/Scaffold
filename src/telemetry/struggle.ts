import type { StruggleSignal, TelemetryEvent } from '../types'

export type StruggleInput = {
  failedRuns: number
  events: TelemetryEvent[]
  now?: number
}

const LARGE_PASTE_CHARS = 200
const RECENT_MS = 60_000

// Rule-based detector: answers "does the student need help right now?". Kept separate from the
// student model, which answers "how much help". The failed-run rules reproduce the PoC's logic.
export function detectStruggle({ failedRuns, events, now = Date.now() }: StruggleInput): StruggleSignal {
  const since = new Date(now).toISOString()
  const recentPaste = events.find(
    (e) => e.kind === 'paste' && now - Date.parse(e.t) < RECENT_MS && Number(e.payload.len ?? 0) >= LARGE_PASTE_CHARS,
  )
  if (recentPaste) {
    return { state: 'copying', since, evidence: [`pasted ${Number(recentPaste.payload.len)} characters in the last minute`] }
  }
  if (failedRuns >= 2) return { state: 'unproductive', since, evidence: [`${failedRuns} failed runs, same warning class`] }
  if (failedRuns === 1) return { state: 'productive', since, evidence: ['1 failed runs, same warning class'] }
  return { state: 'flow', since, evidence: [] }
}
