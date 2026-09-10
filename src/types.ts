export type Level = 0 | 1 | 2 | 3 | 4 | 5

export type MasteryVector = Record<string, number>

export type StruggleSignal = {
  state: 'flow' | 'productive' | 'unproductive' | 'disengaged' | 'copying'
  since: string
  evidence: string[]
}

export type HintRequest = {
  problemId: string
  code: string
  level: Level
  mastery: MasteryVector
  struggle: StruggleSignal
  question?: string
  trigger: 'requested' | 'proactive' | 'escalated'
  promptVariant?: PromptVariant
  systemPrompt?: string
  model?: string
  context?: ContextMode
  profile?: ProfileMode
}

export type PromptVariant = 'plain' | 'basic' | 'hardened' | 'custom'
export type ContextMode = 'none' | 'rag' | 'rag_solution'
export type ProfileMode = 'none' | 'strong' | 'novice'

export type HintResponse = {
  level: Level
  text: string
  highlightLines?: number[]
  pseudocode?: string
  guardrail: { leaked: boolean; stripped: boolean }
  source?: 'scaffold' | 'baseline'
  model?: string
  promptVariant?: PromptVariant
  context?: ContextMode
  profile?: ProfileMode
  verdict?: 'clean' | 'partial' | 'leaked' | 'error'
  latencyMs?: number
}

export type Diagnostic = {
  line: number
  col: number
  severity: 'error' | 'warning'
  raw: string
  cls: string
}

export type TestResult = {
  name: string
  passed: boolean
  expected?: string
  actual?: string
  hidden: boolean
}

export type TelemetryEvent = {
  t: string
  kind: 'edit' | 'run' | 'paste' | 'idle' | 'hint' | 'escalate' | 'snooze'
  payload: Record<string, unknown>
}
