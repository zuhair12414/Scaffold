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
  similarityThreshold?: number
}

export type PromptVariant = 'plain' | 'basic' | 'hardened' | 'custom'
export type ContextMode = 'none' | 'rag' | 'rag_solution'
export type ProfileMode = 'none' | 'strong' | 'novice'

// What the output-side guardrail decided about one reply. `similarity` is measured
// against the reference solution, which the model never sees.
export type GuardrailDecision = {
  leaked: boolean
  stripped: boolean
  blocked?: boolean
  similarity?: number
  threshold?: number
  reason?: string
}

export type HintResponse = {
  level: Level
  text: string
  highlightLines?: number[]
  pseudocode?: string
  guardrail: GuardrailDecision
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
  kind: 'edit' | 'run' | 'paste' | 'idle' | 'hint' | 'escalate' | 'snooze' | 'submit'
  payload: Record<string, unknown>
}

export type KnowledgeComponentId =
  | 'array-pointer-basics'
  | 'linked-list-traversal'
  | 'recursion-base-case'
  | 'bst-invariants'
  | 'in-order-successor'
  | 'pointer-reassignment-free'
  | 'iterator-invalidation'
  | 'complexity-reasoning'

export type KnowledgeComponent = {
  id: KnowledgeComponentId
  name: string
  shortName: string
}

export type LabStatus = 'draft' | 'open' | 'closed'

export type Lab = {
  id: string
  number: number
  title: string
  status: LabStatus
  dueAt: string
  kcIds: KnowledgeComponentId[]
  statement: string
  starterCode: string
  manualIds: string[]
}

export type LabPolicy = {
  labId: string
  maxHintLevel: 1 | 2 | 3 | 4
  similarityThreshold: number
  escalationAllowed: boolean
}

export type ManualMeta = {
  id: string
  labId: string
  name: string
  sizeBytes: number
  type: 'pdf' | 'md' | 'docx'
  uploadedAt: string
  // Seeded manuals carry their text so the viewer has something to show. Files
  // uploaded in the console are held in memory as File objects instead and are
  // never parsed — see docs/TASKS.md, F3.
  content?: string
}

export type StudentStatus = 'active' | 'struggling' | 'reviewing' | 'offline'

export type Student = {
  id: string
  displayName: string
  section: string
  status: StudentStatus
  divergent: boolean
}

export type SubmissionStatus = 'passed' | 'compile_issue' | 'tests_failing'

export type Submission = {
  id: string
  studentId: string
  labId: string
  timestamp: string
  code: string
  compileOk: boolean
  testsPassed: number
  testsFailed: number
  timeOnTaskMin: number
  status: SubmissionStatus
}

export type SessionEventKind = 'edit_burst' | 'idle' | 'paste' | 'compile' | 'run' | 'hint_shown'

export type SessionEvent = {
  id: string
  studentId: string
  labId: string
  kind: SessionEventKind
  at: string
  durationSec?: number
  label: string
  detail: string
}

export type HintAuditEvent = {
  id: string
  studentId: string
  labId: string
  timestamp: string
  level: Level
  blocked: boolean
  similarity: number
  threshold: number
  reason: string
  promptContextSummary: string
  shownText: string
  withheldText?: string
}

export type MasteryPoint = {
  labId: string
  value: number
  uncertaintyLow: number
  uncertaintyHigh: number
}

export type MasteryTrace = {
  studentId: string
  kcId: KnowledgeComponentId
  correctnessOnly: MasteryPoint[]
  telemetryAdjusted: MasteryPoint[]
}

export type MockDataset = {
  seed: number
  generatedAt: string
  knowledgeComponents: KnowledgeComponent[]
  labs: Lab[]
  manuals: ManualMeta[]
  students: Student[]
  submissions: Submission[]
  sessionEvents: SessionEvent[]
  hintAudit: HintAuditEvent[]
  masteryTraces: MasteryTrace[]
}
