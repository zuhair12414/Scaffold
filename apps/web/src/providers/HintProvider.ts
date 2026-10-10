import type { Diagnostic, HintRequest, HintResponse } from '../types'

// The seam. The PoC ships MockHintProvider and OllamaBaselineProvider. The real system swaps
// in a provider that calls the hint service; nothing in the components changes.
// onDelta, when supported, receives the accumulated reply text as it streams in.
export interface HintProvider {
  requestHint(req: HintRequest, onDelta?: (text: string) => void): Promise<HintResponse>
  explainDiagnostic(d: Diagnostic): Promise<string>
  reset?(): void
}
