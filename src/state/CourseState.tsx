import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { CourseContext, type CourseContextValue } from './CourseContext'
import { mockData } from '../mock/data'
import { clearDemoStorage } from './demo'
import type { Lab, LabPolicy, ManualMeta } from '../types'

type SavedCourseState = {
  labs: Lab[]
  manuals: ManualMeta[]
  policies: LabPolicy[]
  currentLabId: string
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
  }
}

export function CourseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ ...loadSavedState(), manualFiles: {} }))
  const labs = useMemo(() => [...mockData.labs, ...state.labs], [state.labs])
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
    policies,
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
    resetCourse: () => {
      clearDemoStorage()
      dispatch({ type: 'reset' })
    },
  }), [currentLab, currentPolicy, labs, manuals, policies])

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
}
