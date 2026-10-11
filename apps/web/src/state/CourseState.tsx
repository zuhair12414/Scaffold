import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { CourseContext, type CourseContextValue, type NewSubmissionInput } from './CourseContext'
import { mockData } from '../mock/data'
import { clearDemoStorage } from './demo'
import type { ChatTurn, HintAuditEvent, Lab, LabPolicy, ManualMeta, Submission, SubmissionStatus } from '../types'

type SavedCourseState = {
  labs: Lab[]
  manuals: ManualMeta[]
  policies: LabPolicy[]
  currentLabId: string
  // Attempts the student submitted in this browser. They are the only rows in the
  // console that were not generated from the seed, and they are labelled as such.
  submissions: Submission[]
  // Assistance requests made from the student view in this browser, so the
  // instructor's Hint Audit shows the decision the student actually saw.
  hints: HintAuditEvent[]
  // The conversation is kept, never deleted: a student can reread what they were
  // told, and the instructor reads the same thing beside the attempt.
  chat: ChatTurn[]
  statusOverrides: Record<string, Lab['status']>
  hiddenLabIds: string[]
}

type CourseState = SavedCourseState & {
  manualFiles: Record<string, File>
}

type Action =
  | { type: 'create_lab'; lab: Lab }
  | { type: 'add_manual'; manual: ManualMeta; file: File }
  | { type: 'remove_manual'; manualId: string }
  | { type: 'update_policy'; labId: string; patch: Partial<Omit<LabPolicy, 'labId'>> }
  | { type: 'set_current_lab'; labId: string }
  | { type: 'set_lab_status'; labId: string; status: Lab['status'] }
  | { type: 'delete_lab'; labId: string }
  | { type: 'submit_attempt'; submission: Submission }
  | { type: 'log_hint'; event: HintAuditEvent }
  | { type: 'append_chat'; turn: ChatTurn }
  | { type: 'reset' }

const STORAGE_KEY = 'scaffold:course-state'
const DEFAULT_POLICY = {
  maxHintLevel: 4,
  similarityThreshold: 0.6,
  escalationAllowed: true,
} satisfies Omit<LabPolicy, 'labId'>

const seedPolicies = mockData.labs.map((lab) => ({ labId: lab.id, ...DEFAULT_POLICY }))

function savedSeed(): SavedCourseState {
  return {
    labs: [],
    manuals: [],
    policies: seedPolicies,
    currentLabId: '',
    submissions: [],
    hints: [],
    chat: [],
    statusOverrides: {},
    hiddenLabIds: [],
  }
}

function loadSavedState(): SavedCourseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return savedSeed()
    const parsed = JSON.parse(raw) as Partial<SavedCourseState>
    return {
      labs: parsed.labs ?? [],
      manuals: parsed.manuals ?? [],
      policies: parsed.policies ?? seedPolicies,
      currentLabId: parsed.currentLabId ?? savedSeed().currentLabId,
      submissions: parsed.submissions ?? [],
      hints: parsed.hints ?? [],
      chat: parsed.chat ?? [],
      statusOverrides: parsed.statusOverrides ?? {},
      hiddenLabIds: parsed.hiddenLabIds ?? [],
    }
  } catch {
    return savedSeed()
  }
}

function nextLabNumber(labs: Lab[]) {
  return labs.reduce((max, lab) => Math.max(max, lab.number), 0) + 1
}

function reducer(state: CourseState, action: Action): CourseState {
  if (action.type === 'create_lab') {
    return {
      ...state,
      labs: [...state.labs, action.lab],
      policies: [...state.policies, { labId: action.lab.id, ...DEFAULT_POLICY }],
      currentLabId: action.lab.id,
    }
  }
  if (action.type === 'add_manual') {
    return {
      ...state,
      manuals: [...state.manuals, action.manual],
      manualFiles: { ...state.manualFiles, [action.manual.id]: action.file },
      labs: state.labs.map((lab) => (
        lab.id === action.manual.labId ? { ...lab, manualIds: [...lab.manualIds, action.manual.id] } : lab
      )),
    }
  }
  if (action.type === 'remove_manual') {
    const nextFiles = { ...state.manualFiles }
    delete nextFiles[action.manualId]
    return {
      ...state,
      manuals: state.manuals.filter((manual) => manual.id !== action.manualId),
      manualFiles: nextFiles,
      labs: state.labs.map((lab) => ({ ...lab, manualIds: lab.manualIds.filter((manualId) => manualId !== action.manualId) })),
    }
  }
  if (action.type === 'update_policy') {
    return {
      ...state,
      policies: state.policies.map((policy) => (
        policy.labId === action.labId ? { ...policy, ...action.patch } : policy
      )),
    }
  }
  if (action.type === 'set_current_lab') {
    return { ...state, currentLabId: action.labId }
  }
  if (action.type === 'set_lab_status') {
    return {
      ...state,
      labs: state.labs.map((lab) => (lab.id === action.labId ? { ...lab, status: action.status } : lab)),
      statusOverrides: { ...state.statusOverrides, [action.labId]: action.status },
    }
  }
  if (action.type === 'delete_lab') {
    const manualIds = new Set(state.manuals.filter((manual) => manual.labId === action.labId).map((manual) => manual.id))
    const nextFiles = { ...state.manualFiles }
    const nextStatusOverrides = { ...state.statusOverrides }
    for (const manualId of manualIds) delete nextFiles[manualId]
    delete nextStatusOverrides[action.labId]
    return {
      ...state,
      labs: state.labs.filter((lab) => lab.id !== action.labId),
      manuals: state.manuals.filter((manual) => manual.labId !== action.labId),
      manualFiles: nextFiles,
      policies: state.policies.filter((policy) => policy.labId !== action.labId),
      submissions: state.submissions.filter((submission) => submission.labId !== action.labId),
      hints: state.hints.filter((hint) => hint.labId !== action.labId),
      statusOverrides: nextStatusOverrides,
      hiddenLabIds: state.labs.some((lab) => lab.id === action.labId)
        ? state.hiddenLabIds
        : [...state.hiddenLabIds, action.labId],
      currentLabId: state.currentLabId === action.labId ? '' : state.currentLabId,
    }
  }
  if (action.type === 'submit_attempt') {
    return { ...state, submissions: [...state.submissions, action.submission] }
  }
  if (action.type === 'log_hint') {
    return { ...state, hints: [...state.hints, action.event] }
  }
  if (action.type === 'append_chat') {
    return { ...state, chat: [...state.chat, action.turn] }
  }
  if (action.type === 'reset') {
    return { ...savedSeed(), manualFiles: {} }
  }
  return state
}

function savedPart(state: CourseState): SavedCourseState {
  return {
    labs: state.labs,
    manuals: state.manuals,
    policies: state.policies,
    currentLabId: state.currentLabId,
    submissions: state.submissions,
    hints: state.hints,
    chat: state.chat,
    statusOverrides: state.statusOverrides,
    hiddenLabIds: state.hiddenLabIds,
  }
}

export function CourseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ ...loadSavedState(), manualFiles: {} }))
  // Defaults are applied defensively: a browser can hold a saved state written by
  // an earlier version of this file, and a missing field must not break a render.
  const labs = useMemo(() => {
    const hidden = state.hiddenLabIds ?? []
    const overrides = state.statusOverrides ?? {}
    return [...mockData.labs, ...(state.labs ?? [])]
      .filter((lab) => !hidden.includes(lab.id))
      .map((lab) => (overrides[lab.id] ? { ...lab, status: overrides[lab.id] } : lab))
  }, [state.labs, state.hiddenLabIds, state.statusOverrides])
  const manuals = useMemo(() => [...mockData.manuals, ...state.manuals], [state.manuals])
  const policies = state.policies
  const currentLab = labs.find((lab) => lab.id === state.currentLabId) ?? null
  const currentPolicy = useMemo(() => (
    currentLab
      ? policies.find((policy) => policy.labId === currentLab.id) ?? { labId: currentLab.id, ...DEFAULT_POLICY }
      : null
  ), [currentLab, policies])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPart(state)))
  }, [state])

  const value = useMemo<CourseContextValue>(() => ({
    labs,
    manuals,
    manualFiles: state.manualFiles ?? {},
    policies,
    sessionSubmissions: state.submissions ?? [],
    sessionHints: state.hints ?? [],
    sessionChat: state.chat ?? [],
    currentLab,
    currentPolicy,
    createLab: (lab) => {
      const createdLab: Lab = {
        id: `local-lab-${Date.now()}`,
        number: nextLabNumber(labs),
        title: lab.title,
        status: 'open',
        dueAt: lab.dueAt,
        kcIds: lab.kcIds,
        statement: lab.statement,
        starterCode: lab.starterCode,
        manualIds: [],
      }
      dispatch({ type: 'create_lab', lab: createdLab })
      return createdLab
    },
    addManual: (manual) => {
      const meta: ManualMeta = {
        id: `manual-${Date.now()}`,
        labId: manual.labId,
        name: manual.file.name,
        sizeBytes: manual.file.size,
        type: manual.file.name.endsWith('.pdf') ? 'pdf' : manual.file.name.endsWith('.docx') ? 'docx' : 'md',
        uploadedAt: new Date().toISOString(),
      }
      dispatch({ type: 'add_manual', manual: meta, file: manual.file })
      return meta
    },
    removeManual: (manualId) => dispatch({ type: 'remove_manual', manualId }),
    updatePolicy: (labId, patch) => dispatch({ type: 'update_policy', labId, patch }),
    setCurrentLab: (labId) => dispatch({ type: 'set_current_lab', labId }),
    setLabStatus: (labId, status) => dispatch({ type: 'set_lab_status', labId, status }),
    deleteLab: (labId) => dispatch({ type: 'delete_lab', labId }),
    submitAttempt: (input: NewSubmissionInput) => {
      const status: SubmissionStatus = !input.compileOk
        ? 'compile_issue'
        : input.testsFailed === 0 ? 'passed' : 'tests_failing'
      const submission: Submission = {
        id: `session-${Date.now()}`,
        studentId: input.studentId,
        labId: input.labId,
        questionId: input.questionId,
        timestamp: new Date().toISOString(),
        code: input.code,
        compileOk: input.compileOk,
        testsPassed: input.testsPassed,
        testsFailed: input.testsFailed,
        timeOnTaskMin: input.timeOnTaskMin,
        status,
      }
      dispatch({ type: 'submit_attempt', submission })
      return submission
    },
    appendChat: (turn) => dispatch({
      type: 'append_chat',
      turn: { ...turn, id: `chat-${Date.now()}-${Math.round(Math.random() * 1e6)}`, at: new Date().toISOString() },
    }),
    logHint: (event) => dispatch({
      type: 'log_hint',
      event: { ...event, id: `session-hint-${Date.now()}`, timestamp: new Date().toISOString() },
    }),
    resetCourse: () => {
      clearDemoStorage()
      dispatch({ type: 'reset' })
    },
  }), [currentLab, currentPolicy, labs, manuals, policies, state.manualFiles, state.submissions, state.hints, state.chat])

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
}
