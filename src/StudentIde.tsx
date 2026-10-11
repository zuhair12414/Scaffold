import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Header } from './components/Header'
import { ProblemPane } from './components/ProblemPane'
import { CodeEditor, type EditorActions } from './components/CodeEditor'
import { OutputPanel } from './components/OutputPanel'
import { TutorPanel, type HintCard } from './components/TutorPanel'
import { StatusBar, type Nudge } from './components/StatusBar'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { problems, registerQuestionProblem, type Problem } from './data/problems'
import { questionsForLab, type DemoStage } from './mock/labQuestions'
import { mockRun, type RunResult } from './mock/compiler'
import { OllamaBaselineProvider } from './providers/OllamaBaselineProvider'
import type { HintProvider } from './providers/HintProvider'
import { useCourse } from './state/useCourse'
import { ManualViewer } from './components/ManualViewer'
import { mockData } from './mock/data'
import { notify } from './state/toast'
import type { ChatTurn, ContextMode, HintResponse, KnowledgeComponentId, Level, ManualMeta, ProfileMode, PromptVariant, StruggleSignal, TelemetryEvent } from './types'
import prompts from './providers/prompts.json'
import { createEmitter } from './telemetry/sink'
import { WebSocketSink } from './telemetry/WebSocketSink'

const PROBLEM = 'P02'
const SNOOZE_MS = 10 * 60_000
// The student view is one student's screen. It is the divergent student the
// instructor console opens first, so the same person is visible from both sides.
const DEMO_STUDENT_ID = 'student-31'
const DEFAULT_KC_IDS: KnowledgeComponentId[] = ['recursion-base-case', 'linked-list-traversal', 'complexity-reasoning']
const MODEL: string = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5-coder:7b'
// PoC-lite: hide everything that implies a finished subsystem. Set VITE_UI=full to see the full shell.
const LITE: boolean = import.meta.env.VITE_UI !== 'full'

function useKeyedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<{ key: string; value: T }>({ key, value: initial })
  const value = state.key === key ? state.value : initial
  const setValue: Dispatch<SetStateAction<T>> = useCallback((next) => {
    setState((previous) => {
      const current = previous.key === key ? previous.value : initial
      return {
        key,
        value: typeof next === 'function' ? (next as (current: T) => T)(current) : next,
      }
    })
  }, [initial, key])
  return [value, setValue]
}


export default function StudentIde() {
  const navigate = useNavigate()
  const { labId } = useParams()
  const {
    labs, currentLab, currentPolicy, manuals, manualFiles, policies,
    sessionSubmissions, sessionChat, submitAttempt, appendChat,
  } = useCourse()
  const assignedLabs = useMemo(() => (
    labs.filter((lab) => lab.status !== 'draft').sort((a, b) => b.number - a.number)
  ), [labs])
  const activeLab = useMemo(
    () => assignedLabs.find((lab) => lab.id === labId) ?? null,
    [assignedLabs, labId],
  )
  const questions = useMemo(() => (activeLab ? questionsForLab(activeLab) : []), [activeLab])
  const allAttempts = useMemo(() => [
    ...mockData.submissions.filter((row) => row.studentId === DEMO_STUDENT_ID),
    ...sessionSubmissions.filter((row) => row.studentId === DEMO_STUDENT_ID),
  ], [sessionSubmissions])
  // Open on the first question that is not passing yet: where the student left off.
  const firstOpen = questions.find((question) => (
    !allAttempts.some((row) => row.questionId === question.id && row.status === 'passed')
  )) ?? questions[0]
  const [questionPick, setQuestionPick] = useState<{ id: string; labId: string } | null>(null)
  const activeQuestion = (questionPick && questionPick.labId === labId
    ? questions.find((question) => question.id === questionPick.id)
    : null) ?? firstOpen
  const selectQuestion = useCallback(
    (id: string) => setQuestionPick({ id, labId: labId ?? '' }),
    [labId],
  )
  const p: Problem = useMemo(
    () => (activeLab && activeQuestion ? registerQuestionProblem(activeQuestion, activeLab) : problems[PROBLEM]),
    [activeLab, activeQuestion],
  )
  const workspaceKey = p.id
  const activeManuals = activeLab ? manuals.filter((manual) => activeLab.manualIds.includes(manual.id)) : []
  const activePolicy = activeLab
    ? policies.find((policy) => policy.labId === activeLab.id) ?? currentPolicy
    : null
  const [openManual, setOpenManual] = useState<ManualMeta | null>(null)
  const [submitState, setSubmitState] = useKeyedState<'idle' | 'saved'>(workspaceKey, 'idle')
  const startedAt = useRef<{ key: string; value: number } | null>(null)
  const labAttempts = useMemo(
    () => allAttempts.filter((row) => row.labId === activeLab?.id).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [allAttempts, activeLab],
  )
  const attempts = useMemo(
    () => labAttempts.filter((row) => row.questionId === activeQuestion?.id),
    [labAttempts, activeQuestion],
  )
  // The conversation for this question: seeded history plus anything said in this
  // browser, in order. It is never cleared — switching question loads its own.
  const questionChat = useMemo(() => {
    if (!activeQuestion) return [] as ChatTurn[]
    return [...mockData.chats, ...sessionChat]
      .filter((turn) => turn.studentId === DEMO_STUDENT_ID && turn.questionId === activeQuestion.id)
      .sort((a, b) => a.at.localeCompare(b.at))
  }, [activeQuestion, sessionChat])
  const storedCards = useMemo<HintCard[]>(() => {
    const cardsFromChat: HintCard[] = []
    let pendingQuestion: string | undefined
    questionChat.forEach((turn, index) => {
      if (turn.role === 'student') { pendingQuestion = turn.text; return }
      cardsFromChat.push({
        id: -(index + 1),
        trigger: 'requested',
        level: (turn.level ?? 0) as Level,
        text: turn.text,
        pseudocode: turn.pseudocode,
        question: pendingQuestion,
        source: turn.source,
        guardrail: { leaked: false, stripped: Boolean(turn.blocked), blocked: turn.blocked },
      })
      pendingQuestion = undefined
    })
    return cardsFromChat
  }, [questionChat])

  const [code, setCode] = useKeyedState(workspaceKey, p.starter)
  const [cursor, setCursor] = useState({ ln: 1, col: 1 })
  const [problemOpen, setProblemOpen] = useState(true)
  const [tutorOpen, setTutorOpen] = useState(false)
  const [outputOpen, setOutputOpen] = useKeyedState(workspaceKey, false)
  const [tab, setTab] = useState<'diagnostics' | 'tests'>('diagnostics')
  const [run, setRun] = useKeyedState<RunResult | null>(workspaceKey, null)
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [cards, setCards] = useKeyedState<HintCard[]>(workspaceKey, storedCards)
  const [demoStage, setDemoStage] = useKeyedState<DemoStage>(workspaceKey, 'empty')
  const [draft, setDraft] = useKeyedState(workspaceKey, '')
  const [thinking, setThinking] = useState(false)
  const [highlight, setHighlight] = useKeyedState<{ lines: number[]; message: string } | null>(workspaceKey, null)
  const [failedRuns, setFailedRuns] = useState(0)
  const [nudge, setNudge] = useState<Nudge>('idle')
  const initialVariant = (['plain', 'basic', 'hardened'].includes(import.meta.env.VITE_PROMPT) ? import.meta.env.VITE_PROMPT : 'plain') as 'plain' | 'basic' | 'hardened'
  const [promptVariant, setPromptVariant] = useState<PromptVariant>(initialVariant)
  const [systemPrompt, setSystemPrompt] = useState<string>(prompts[initialVariant])
  const [model, setModel] = useState<string>(MODEL)
  // No retrieval and no profile in the panel any more: the baseline is the plain
  // assistant a student uses, and these stay off unless the spike turns them on.
  const context: ContextMode = 'none'
  const profile: ProfileMode = 'none'
  const provider = useMemo<HintProvider>(
    () => new OllamaBaselineProvider(model),
    [model],
  )
  const similarityThreshold = activePolicy?.similarityThreshold ?? 0.6
  // The student's own concept estimates, with the uncertainty band the instructor sees.
  const masteryBars = useMemo(() => {
    const kcIds = activeLab?.kcIds.length ? activeLab.kcIds : DEFAULT_KC_IDS
    return kcIds.flatMap((kcId) => {
      const trace = mockData.masteryTraces.find((item) => item.studentId === DEMO_STUDENT_ID && item.kcId === kcId)
      const kc = mockData.knowledgeComponents.find((item) => item.id === kcId)
      if (!trace || !kc) return []
      const point = trace.telemetryAdjusted[trace.telemetryAdjusted.length - 1]
      return [{ id: kc.id, label: kc.name, value: point.value, low: point.uncertaintyLow, high: point.uncertaintyHigh }]
    })
  }, [activeLab])
  // The instructor pushing a lab moves the student's screen to it.
  const pushedLabId = currentLab?.id ?? ''
  const pushedRef = useRef(pushedLabId)
  useEffect(() => {
    if (pushedLabId && pushedLabId !== pushedRef.current) {
      pushedRef.current = pushedLabId
      navigate(`/student/${pushedLabId}`)
    }
  }, [pushedLabId, navigate])

  const telemetry = useRef<TelemetryEvent[]>([])
  const nextId = useRef(1)

  // One session ID per browser session for telemetry envelope.
  const [sessionId] = useState(() => `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`)
  const activeLabId = activeLab?.id ?? ''
  const activeQId = activeQuestion?.id ?? p.id

  // Active context ref so emitter always sees the latest labId and questionId.
  const contextRef = useRef({
    sessionId,
    studentId: DEMO_STUDENT_ID,
    labId: activeLabId,
    questionId: activeQId,
  })

  useEffect(() => {
    contextRef.current = {
      sessionId,
      studentId: DEMO_STUDENT_ID,
      labId: activeLabId,
      questionId: activeQId,
    }
  }, [sessionId, activeLabId, activeQId])

  // WebSocket network sink for transmitting typed telemetry events to ingestion server.
  const [telemetryEmitter] = useState(() => {
    return createEmitter(() => contextRef.current, new WebSocketSink())
  })

  const log = useCallback((kind: TelemetryEvent['kind'], payload: Record<string, unknown> = {}) => {
    telemetry.current.push({ t: new Date().toISOString(), kind, payload })
  }, [])

  const struggle: StruggleSignal = useMemo(() => ({
    state: failedRuns >= 2 ? 'unproductive' : failedRuns === 1 ? 'productive' : 'flow',
    since: new Date().toISOString(),
    evidence: failedRuns ? [`${failedRuns} failed runs, same warning class`] : [],
  }), [failedRuns])

  const mastery = useMemo(() => Object.fromEntries(p.concepts.map((c) => [c.name.toLowerCase(), c.mastery])), [p])
  const currentLevel: Level = cards.length ? cards[cards.length - 1].level : 0
  const maxHintLevel = activePolicy?.maxHintLevel ?? 4

  useEffect(() => {
    startedAt.current = { key: workspaceKey, value: Date.now() }
  }, [workspaceKey])

  // Submitting is the student's half of the loop the instructor console reads: the
  // attempt shows up in Submissions and on their own detail screen, marked as this
  // session so nobody mistakes it for seeded data.
  const submit = useCallback(() => {
    if (!activeLab) return
    const result = run ?? mockRun(code, p)
    if (!run) { setRun(result); setOutputOpen(true) }
    const passed = result.tests.filter((test) => test.passed).length
    submitAttempt({
      studentId: DEMO_STUDENT_ID,
      labId: activeLab.id,
      questionId: p.id,
      code,
      compileOk: !result.diagnostics.some((d) => d.severity === 'error'),
      testsPassed: passed,
      testsFailed: result.tests.length - passed,
      timeOnTaskMin: Math.max(1, Math.round((Date.now() - (startedAt.current?.value || Date.now())) / 60_000)),
    })
    log('submit', { labId: activeLab.id, testsPassed: passed })
    notify(`Attempt submitted: ${passed} of ${result.tests.length} tests passed. Your instructor can see it.`)
    setSubmitState('saved')
    window.setTimeout(() => setSubmitState('idle'), 2500)
  }, [activeLab, code, p, run, submitAttempt, log, setRun, setOutputOpen, setSubmitState])

  const requestHint = useCallback(async (level: Level, trigger: HintCard['trigger'], question?: string) => {
    const requestedLevel = Math.min(level, maxHintLevel) as Level
    setTutorOpen(true)
    setNudge('idle')
    setThinking(true)
    log('hint', { level: requestedLevel, trigger, question })
    const id = nextId.current++
    const isBaseline = true
    if (isBaseline) {
      setCards((cs) => [...cs, { id, trigger, level: 0, text: '', source: 'baseline', model, promptVariant, context, profile, streaming: true, question, guardrail: { leaked: false, stripped: false } }])
    }
    let res: HintResponse
    try {
      res = await provider.requestHint(
        { problemId: p.id, code, level: requestedLevel, mastery, struggle, question, trigger, promptVariant, systemPrompt, model, context, profile, similarityThreshold },
        (text) => setCards((cs) => cs.map((c) => (c.id === id ? { ...c, text } : c))),
      )
    } catch (e) {
      setThinking(false)
      const text = e instanceof Error ? e.message : String(e)
      setCards((cs) => (cs.some((c) => c.id === id)
        ? cs.map((c) => (c.id === id ? { ...c, text, verdict: 'error', streaming: false } : c))
        : [...cs, { id, trigger, level: 0, text, source: 'baseline', verdict: 'error', guardrail: { leaked: false, stripped: false } }]))
      return
    }
    setThinking(false)
    setCards((cs) => (cs.some((c) => c.id === id)
      ? cs.map((c) => (c.id === id ? { ...c, ...res, streaming: false, question } : c))
      : [...cs, { ...res, id, trigger }]))
    if (activeLab) {
      if (question) {
        appendChat({ studentId: DEMO_STUDENT_ID, labId: activeLab.id, questionId: p.id, role: 'student', text: question })
      }
      appendChat({
        studentId: DEMO_STUDENT_ID,
        labId: activeLab.id,
        questionId: p.id,
        role: 'tutor',
        text: res.text,
        pseudocode: res.pseudocode,
        level: res.level,
        blocked: Boolean(res.guardrail?.blocked),
        source: 'baseline',
      })
    }
    if (res.highlightLines) setHighlight({ lines: res.highlightLines, message: res.text })
  }, [code, mastery, struggle, p, log, appendChat, activeLab, promptVariant, systemPrompt, model, context, profile, maxHintLevel, provider, similarityThreshold, setCards, setHighlight])

  const policyLevel = useCallback((): Level => {
    const level = cards.length ? currentLevel : failedRuns >= 3 ? 1 : 0
    return Math.min(level, maxHintLevel) as Level
  }, [cards.length, currentLevel, failedRuns, maxHintLevel])

  const doRun = useCallback(() => {
    const r = mockRun(code, p)
    setRun(r)
    setOutputOpen(true)
    setTab(r.diagnostics.length ? 'diagnostics' : 'tests')
    log('run', { ok: r.ok, diagnostics: r.diagnostics.length })
    r.diagnostics.forEach((d) => {
      if (!explanations[d.cls]) provider.explainDiagnostic(d).then((t) => setExplanations((e) => ({ ...e, [d.cls]: t })))
    })
    if (r.ok) { setHighlight(null); setFailedRuns(0); setNudge('idle'); return }
    const n = failedRuns + 1
    setFailedRuns(n)
  }, [code, p, failedRuns, explanations, log, provider, setRun, setOutputOpen, setHighlight])

  const snooze = useCallback(() => {
    setNudge('snoozed'); log('snooze')
    setTimeout(() => setNudge((s) => (s === 'snoozed' ? 'idle' : s)), SNOOZE_MS)
  }, [log])

  const actions = useRef<EditorActions>({
    run: () => {},
    toggleTutor: () => {},
    requestHint: () => {},
    escalate: () => {},
    toggleProblem: () => {},
    toggleOutput: () => {},
    snooze: () => {},
  })
  const editorActions = useMemo<EditorActions>(() => ({
    run: doRun,
    toggleTutor: () => setTutorOpen((o) => !o),
    requestHint: () => requestHint(policyLevel(), 'requested'),
    escalate: () => {},
    toggleProblem: () => setProblemOpen((o) => !o),
    toggleOutput: () => setOutputOpen((o) => !o),
    snooze,
  }), [doRun, requestHint, policyLevel, snooze, setOutputOpen])

  useEffect(() => {
    actions.current = editorActions
  }, [editorActions])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (e.key === 'Escape' && tutorOpen) { setTutorOpen(false); return }
      if (!mod) return
      const k = e.key.toLowerCase()
      const a = actions.current
      const map: Record<string, () => void> = {
        enter: a.run, i: e.shiftKey ? a.requestHint : a.toggleTutor, '.': a.escalate, b: a.toggleProblem, j: a.toggleOutput,
      }
      if (e.shiftKey && k === 's') { e.preventDefault(); a.snooze(); return }
      if (map[k]) { e.preventDefault(); map[k]() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [tutorOpen])

  const jump = (line: number, col: number) => {
    setHighlight((h) => h ?? { lines: [line], message: 'Compiler diagnostic on this line' })
    setCursor({ ln: line, col })
  }

  // DEMO ONLY: jump the editor to a known state, or drop a plausible question into
  // the tutor box. Neither exists in the product.
  const fillDemo = useCallback((stage: DemoStage) => {
    if (!activeQuestion) return
    const next = stage === 'empty' ? activeQuestion.starter : activeQuestion.demo.code[stage]
    setCode(next)
    setDemoStage(stage)
    setRun(null)
    setHighlight(null)
    notify(stage === 'empty' ? 'Editor reset to the starter code' : `Editor filled with the ${stage} state (demo only)`)
  }, [activeQuestion, setCode, setDemoStage, setRun, setHighlight])

  if (!activeLab || !activeQuestion) return <Navigate to="/student" replace />

  const style = {
    '--problem-w': problemOpen ? '23%' : '32px',
    '--tutor-w': tutorOpen ? '28%' : '0px',
    '--output-h': outputOpen ? '220px' : '0px',
  } as React.CSSProperties

  return (
    <div className="app" style={style}>
      <Header
        lab={p.lab}
        title={p.title}
        hintLabel="Ask AI"
        onRun={doRun}
        onHint={() => setTutorOpen((o) => !o)}
        onSubmit={activeLab && activeLab.status !== 'closed' ? submit : undefined}
        submitState={submitState}
        submitLabel={activeLab ? `Submit Lab ${activeLab.number}` : 'Submit'}
      />
      <div className="main">
        <ProblemPane
          p={p}
          collapsed={!problemOpen}
          lite={LITE}
          manuals={activeManuals}
          mastery={masteryBars}
          recording
          lab={activeLab}
          questions={questions}
          activeQuestionId={activeQuestion.id}
          onSelectQuestion={selectQuestion}
          questionAttempts={labAttempts}
          attempts={attempts}
          onOpenManual={setOpenManual}
          closed={activeLab.status === 'closed'}
          demoQuestion={activeQuestion}
          demoStage={demoStage}
          onDemoFill={fillDemo}
          onDemoAsk={(text) => { setDraft(text); setTutorOpen(true) }}
        />
        <div className="center">
          <CodeEditor
            value={code}
            onChange={(v) => { setCode(v); log('edit', { len: v.length }) }}
            onCursor={(ln, col) => setCursor({ ln, col })}
            highlight={highlight}
            actions={actions}
            lite={LITE}
            path={`${p.id}.cpp`}
            telemetry={telemetryEmitter}
          />
          {outputOpen && run && (
            <OutputPanel
              tab={tab}
              setTab={setTab}
              diagnostics={run.diagnostics}
              explanations={explanations}
              tests={run.tests}
              onClose={() => setOutputOpen(false)}
              onJump={jump}
              // The bare PoC-lite output belongs to the baseline condition. The
              // product tutor shows test results and the plain-English diagnostic,
              // because the student is meant to act on them.
              lite={LITE}
            />
          )}
          {outputOpen && !run && <div />}
        </div>
        {tutorOpen && (
          <TutorPanel
            questionLabel={`Q${activeQuestion.number} · ${activeQuestion.title}`}
            draft={draft}
            onDraft={setDraft}
            lite={LITE}
            promptVariant={promptVariant}
            systemPrompt={systemPrompt}
            onSystemPrompt={(text, v) => { setSystemPrompt(text); setPromptVariant(v) }}
            model={model}
            onModel={setModel}
            cards={cards}
            thinking={thinking}
            onClose={() => setTutorOpen(false)}
            onAsk={(q) => requestHint(policyLevel(), 'requested', q || undefined)}
            // A probe asks for the finished answer. The policy still decides the
            // level — phrasing is not an input to that — but the request is an
            // escalation, so the guardrail measures the highest level the lab allows.
            onAttack={(q) => requestHint(maxHintLevel as Level, 'escalated', q)}
            onClear={() => { provider.reset?.(); setCards([]); setHighlight(null) }}
          />
        )}
        {!tutorOpen && <div />}
      </div>
      {openManual && (
        <ManualViewer
          manual={openManual}
          file={manualFiles[openManual.id]}
          onClose={() => setOpenManual(null)}
        />
      )}
      <StatusBar ln={cursor.ln} col={cursor.col} nudge={nudge} lite={LITE}
        onNudgeClick={() => (nudge === 'nudge' ? requestHint(policyLevel(), 'proactive') : setTutorOpen((o) => !o))}
        onSnooze={snooze} />
    </div>
  )
}
