import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { ProblemPane } from './components/ProblemPane'
import { CodeEditor, type EditorActions } from './components/CodeEditor'
import { OutputPanel } from './components/OutputPanel'
import { TutorPanel, type HintCard } from './components/TutorPanel'
import { StatusBar, type Nudge } from './components/StatusBar'
import { problems, registerLabProblem, type Problem } from './data/problems'
import { mockRun, type RunResult } from './mock/compiler'
import { MockHintProvider } from './providers/MockHintProvider'
import { OllamaBaselineProvider } from './providers/OllamaBaselineProvider'
import type { HintProvider } from './providers/HintProvider'
import { useCourse } from './state/useCourse'
import { ManualViewer } from './components/ManualViewer'
import { mockData } from './mock/data'
import type { ContextMode, HintResponse, KnowledgeComponentId, Level, ManualMeta, ProfileMode, PromptVariant, StruggleSignal, TelemetryEvent } from './types'
import prompts from './providers/prompts.json'

const PROBLEM = 'P02'
// Long enough to interrupt hint-spam, short enough to demonstrate in a room.
const ESCALATE_COOLDOWN_MS = 12_000
const SNOOZE_MS = 10 * 60_000
// Default to the product tutor: it needs no model and no backend, so the demo runs
// anywhere. VITE_TUTOR_MODE=baseline starts on the unguarded assistant instead, and
// the switch in the tutor header moves between them live.
const INITIAL_MODE: 'scaffold' | 'baseline' = import.meta.env.VITE_TUTOR_MODE === 'baseline' ? 'baseline' : 'scaffold'
// The student view is one student's screen. It is the divergent student the
// instructor console opens first, so the same person is visible from both sides.
const DEMO_STUDENT_ID = 'student-31'
const DEFAULT_KC_IDS: KnowledgeComponentId[] = ['recursion-base-case', 'linked-list-traversal', 'complexity-reasoning']
const MODEL: string = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5-coder:7b'
// PoC-lite: hide everything that implies a finished subsystem. Set VITE_UI=full to see the full shell.
const LITE: boolean = import.meta.env.VITE_UI !== 'full'


export default function StudentIde() {
  const baseProblem = problems[PROBLEM]
  const { labs, currentLab, currentPolicy, manuals, manualFiles, policies, sessionSubmissions, submitAttempt, logHint } = useCourse()
  // The student's own lab list: everything the instructor has opened or closed.
  const assignedLabs = useMemo(() => (
    labs.filter((lab) => lab.status !== 'draft').sort((a, b) => b.number - a.number)
  ), [labs])
  // The student may browse their own labs, but a lab the instructor pushes wins:
  // a pick is remembered against the lab that was pushed when it was made, so the
  // next push discards it. Derived, so no effect has to chase the instructor.
  const pushedLabId = currentLab?.id ?? ''
  const [pick, setPick] = useState<{ labId: string; against: string } | null>(null)
  const selectedLabId = pick && pick.against === pushedLabId ? pick.labId : pushedLabId
  const selectLab = useCallback(
    (labId: string) => setPick({ labId, against: pushedLabId }),
    [pushedLabId],
  )
  const activeLab = useMemo(
    () => assignedLabs.find((lab) => lab.id === selectedLabId) ?? null,
    [assignedLabs, selectedLabId],
  )
  const p: Problem = useMemo(
    () => (activeLab ? registerLabProblem(activeLab) : baseProblem),
    [activeLab, baseProblem],
  )
  const activeManuals = activeLab ? manuals.filter((manual) => activeLab.manualIds.includes(manual.id)) : []
  const activePolicy = activeLab
    ? policies.find((policy) => policy.labId === activeLab.id) ?? currentPolicy
    : null
  const [openManual, setOpenManual] = useState<ManualMeta | null>(null)
  const [submitState, setSubmitState] = useState<'idle' | 'saved'>('idle')
  const startedAt = useRef(0)
  const attempts = useMemo(() => {
    if (!activeLab) return []
    return [
      ...mockData.submissions.filter((row) => row.studentId === DEMO_STUDENT_ID && row.labId === activeLab.id),
      ...sessionSubmissions.filter((row) => row.labId === activeLab.id),
    ].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [activeLab, sessionSubmissions])
  const [mode, setMode] = useState<'scaffold' | 'baseline'>(INITIAL_MODE)
  const [code, setCode] = useState(p.starter)
  const [cursor, setCursor] = useState({ ln: 1, col: 1 })
  const [problemOpen, setProblemOpen] = useState(true)
  const [tutorOpen, setTutorOpen] = useState(false)
  const [outputOpen, setOutputOpen] = useState(false)
  const [tab, setTab] = useState<'diagnostics' | 'tests'>('diagnostics')
  const [run, setRun] = useState<RunResult | null>(null)
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [cards, setCards] = useState<HintCard[]>([])
  const [thinking, setThinking] = useState(false)
  const [highlight, setHighlight] = useState<{ lines: number[]; message: string } | null>(null)
  const [failedRuns, setFailedRuns] = useState(0)
  const [nudge, setNudge] = useState<Nudge>('idle')
  const [snoozedUntil, setSnoozedUntil] = useState(0)
  const [lastHintAt, setLastHintAt] = useState(0)
  const [activitySinceHint, setActivitySinceHint] = useState(true)
  const initialVariant = (['plain', 'basic', 'hardened'].includes(import.meta.env.VITE_PROMPT) ? import.meta.env.VITE_PROMPT : 'plain') as 'plain' | 'basic' | 'hardened'
  const [promptVariant, setPromptVariant] = useState<PromptVariant>(initialVariant)
  const [systemPrompt, setSystemPrompt] = useState<string>(prompts[initialVariant])
  const [model, setModel] = useState<string>(MODEL)
  const choosePreset = (v: PromptVariant) => { setPromptVariant(v); if (v !== 'custom') setSystemPrompt(prompts[v]) }
  const [context, setContext] = useState<ContextMode>('none')
  const [profile, setProfile] = useState<ProfileMode>('none')
  const [now, setNow] = useState(() => Date.now())
  const provider = useMemo<HintProvider>(
    () => (mode === 'scaffold' ? new MockHintProvider() : new OllamaBaselineProvider(model)),
    [mode, model],
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
  const telemetry = useRef<TelemetryEvent[]>([])
  const nextId = useRef(1)

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

  // Escalation gate: one level per edit or run, plus a cooldown.
  const canEscalate = useMemo(() => {
    if (mode === 'baseline') return { ok: false, why: '' }
    if (activePolicy && !activePolicy.escalationAllowed) return { ok: false, why: 'Instructor has paused escalation for this lab' }
    if (cards.length === 0) return { ok: false, why: 'Ask for a hint first' }
    if (currentLevel >= maxHintLevel) return { ok: false, why: `Available up to Level ${maxHintLevel}` }
    if (!activitySinceHint) return { ok: false, why: 'Edit your code or run it before asking for more' }
    const left = Math.ceil((lastHintAt + ESCALATE_COOLDOWN_MS - now) / 1000)
    if (left > 0) return { ok: false, why: `Available in ${left}s` }
    return { ok: true, why: '' }
  }, [cards.length, currentLevel, activitySinceHint, lastHintAt, now, activePolicy, maxHintLevel, mode])

  useEffect(() => {
    if (!tutorOpen) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [tutorOpen])

  useEffect(() => {
    setCode(p.starter)
    setCards([])
    setRun(null)
    setOutputOpen(false)
    setHighlight(null)
    setSubmitState('idle')
    startedAt.current = Date.now()
  }, [p.id, p.starter])

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
      code,
      compileOk: !result.diagnostics.some((d) => d.severity === 'error'),
      testsPassed: passed,
      testsFailed: result.tests.length - passed,
      timeOnTaskMin: Math.max(1, Math.round((Date.now() - (startedAt.current || Date.now())) / 60_000)),
    })
    log('submit', { labId: activeLab.id, testsPassed: passed })
    setSubmitState('saved')
    window.setTimeout(() => setSubmitState('idle'), 2500)
  }, [activeLab, code, p, run, submitAttempt, log])

  const requestHint = useCallback(async (level: Level, trigger: HintCard['trigger'], question?: string) => {
    const requestedLevel = Math.min(level, maxHintLevel) as Level
    setTutorOpen(true)
    setNudge('idle')
    setThinking(true)
    log('hint', { level: requestedLevel, trigger, question })
    const id = nextId.current++
    const isBaseline = mode === 'baseline'
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
    // Close the loop: what the guardrail decided here is what the instructor's
    // Hint Audit shows, with the level, the measured similarity and the threshold.
    if (mode === 'scaffold' && activeLab) {
      const blocked = Boolean(res.guardrail?.blocked)
      logHint({
        studentId: DEMO_STUDENT_ID,
        labId: activeLab.id,
        level: res.level,
        blocked,
        similarity: res.guardrail?.similarity ?? 0,
        threshold: res.guardrail?.threshold ?? similarityThreshold,
        reason: res.guardrail?.reason ?? 'within lab disclosure policy',
        promptContextSummary: `${p.title}: ${p.concepts.map((concept) => concept.name).join(', ')}`,
        shownText: res.text,
        withheldText: blocked ? 'A code-shaped answer with the missing step was withheld.' : undefined,
      })
    }
    if (res.highlightLines) setHighlight({ lines: res.highlightLines, message: res.text })
    setLastHintAt(Date.now())
    setActivitySinceHint(false)
  }, [code, mastery, struggle, p, log, logHint, activeLab, promptVariant, systemPrompt, model, context, profile, maxHintLevel, mode, provider, similarityThreshold])

  const policyLevel = useCallback((): Level => {
    const level = cards.length ? currentLevel : failedRuns >= 3 ? 1 : 0
    return Math.min(level, maxHintLevel) as Level
  }, [cards.length, currentLevel, failedRuns, maxHintLevel])

  const doRun = useCallback(() => {
    const r = mockRun(code, p)
    setRun(r)
    setOutputOpen(true)
    setTab(r.diagnostics.length ? 'diagnostics' : 'tests')
    setActivitySinceHint(true)
    log('run', { ok: r.ok, diagnostics: r.diagnostics.length })
    r.diagnostics.forEach((d) => {
      if (!explanations[d.cls]) provider.explainDiagnostic(d).then((t) => setExplanations((e) => ({ ...e, [d.cls]: t })))
    })
    if (r.ok) { setHighlight(null); setFailedRuns(0); setNudge('idle'); return }
    const n = failedRuns + 1
    setFailedRuns(n)
    if (mode === 'scaffold' && n >= 2 && !tutorOpen && Date.now() > snoozedUntil && nudge !== 'nudge') setNudge('nudge')
  }, [code, p, failedRuns, tutorOpen, snoozedUntil, nudge, explanations, log, mode, provider])

  const snooze = useCallback(() => {
    setSnoozedUntil(Date.now() + SNOOZE_MS); setNudge('snoozed'); log('snooze')
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
    escalate: () => { if (canEscalate.ok) { log('escalate'); requestHint(Math.min(currentLevel + 1, maxHintLevel) as Level, 'escalated') } },
    toggleProblem: () => setProblemOpen((o) => !o),
    toggleOutput: () => setOutputOpen((o) => !o),
    snooze,
  }), [doRun, requestHint, policyLevel, canEscalate.ok, log, currentLevel, maxHintLevel, snooze])

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

  const style = {
    '--problem-w': problemOpen ? '22%' : '32px',
    '--tutor-w': tutorOpen ? '28%' : '0px',
    '--output-h': outputOpen ? '220px' : '0px',
  } as React.CSSProperties

  return (
    <div className="app" style={style}>
      <Header
        lab={p.lab}
        title={p.title}
        hintLabel={mode === 'baseline' ? 'Ask' : 'Hint'}
        onRun={doRun}
        onHint={() => setTutorOpen((o) => !o)}
        onSubmit={activeLab && activeLab.status !== 'closed' ? submit : undefined}
        submitState={submitState}
      />
      <div className="main">
        <ProblemPane
          p={p}
          collapsed={!problemOpen}
          lite={LITE}
          manuals={activeManuals}
          policy={mode === 'scaffold' ? activePolicy : null}
          mastery={mode === 'scaffold' ? masteryBars : []}
          recording={mode === 'scaffold'}
          labs={assignedLabs}
          selectedLabId={selectedLabId}
          onSelectLab={selectLab}
          attempts={attempts}
          onOpenManual={setOpenManual}
          closed={activeLab?.status === 'closed'}
        />
        <div className="center">
          <CodeEditor
            value={code}
            onChange={(v) => { setCode(v); setActivitySinceHint(true); log('edit', { len: v.length }) }}
            onCursor={(ln, col) => setCursor({ ln, col })}
            highlight={highlight}
            actions={actions}
            lite={LITE}
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
              lite={LITE && mode === 'baseline'}
            />
          )}
          {outputOpen && !run && <div />}
        </div>
        {tutorOpen && (
          <TutorPanel
            mode={mode}
            onMode={setMode}
            maxHintLevel={maxHintLevel}
            similarityThreshold={similarityThreshold}
            lite={LITE}
            promptVariant={promptVariant}
            onPromptVariant={choosePreset}
            systemPrompt={systemPrompt}
            onSystemPrompt={(text, v) => { setSystemPrompt(text); setPromptVariant(v) }}
            model={model}
            onModel={setModel}
            context={context}
            onContext={setContext}
            profile={profile}
            onProfile={setProfile}
            cards={cards}
            thinking={thinking}
            canEscalate={canEscalate}
            onClose={() => setTutorOpen(false)}
            onAsk={(q) => requestHint(policyLevel(), 'requested', q || undefined)}
            onClear={() => { provider.reset?.(); setCards([]); setHighlight(null) }}
            onEscalate={editorActions.escalate}
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
