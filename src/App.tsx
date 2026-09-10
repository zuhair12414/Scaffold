import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { ProblemPane } from './components/ProblemPane'
import { CodeEditor, type EditorActions } from './components/CodeEditor'
import { OutputPanel } from './components/OutputPanel'
import { TutorPanel, type HintCard } from './components/TutorPanel'
import { StatusBar, type Nudge } from './components/StatusBar'
import { problems } from './data/problems'
import { mockRun, type RunResult } from './mock/compiler'
import { MockHintProvider } from './providers/MockHintProvider'
import { OllamaBaselineProvider } from './providers/OllamaBaselineProvider'
import type { HintProvider } from './providers/HintProvider'
import type { ContextMode, HintResponse, Level, ProfileMode, PromptVariant, StruggleSignal, TelemetryEvent } from './types'
import prompts from './providers/prompts.json'

const PROBLEM = 'P02'
const ESCALATE_COOLDOWN_MS = 30_000
const SNOOZE_MS = 10 * 60_000
const MODE: 'scaffold' | 'baseline' = import.meta.env.VITE_TUTOR_MODE === 'scaffold' ? 'scaffold' : 'baseline'
const MODEL: string = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5-coder:7b'
// PoC-lite: hide everything that implies a finished subsystem. Set VITE_UI=full to see the full shell.
const LITE: boolean = import.meta.env.VITE_UI !== 'full'
const provider: HintProvider = MODE === 'scaffold' ? new MockHintProvider() : new OllamaBaselineProvider(MODEL)

export default function App() {
  const p = problems[PROBLEM]
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
  const [, tick] = useState(0)
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

  // Escalation gate: one level per edit or run, plus a cooldown.
  const canEscalate = useMemo(() => {
    if (MODE === 'baseline') return { ok: false, why: '' }
    if (cards.length === 0) return { ok: false, why: 'Ask for a hint first' }
    if (currentLevel >= 4) return { ok: false, why: 'Level 5 needs an instructor' }
    if (!activitySinceHint) return { ok: false, why: 'Edit your code or run it before asking for more' }
    const left = Math.ceil((lastHintAt + ESCALATE_COOLDOWN_MS - Date.now()) / 1000)
    if (left > 0) return { ok: false, why: `Available in ${left}s` }
    return { ok: true, why: '' }
  }, [cards.length, currentLevel, activitySinceHint, lastHintAt])

  useEffect(() => {
    if (!tutorOpen) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [tutorOpen])

  const requestHint = useCallback(async (level: Level, trigger: HintCard['trigger'], question?: string) => {
    setTutorOpen(true)
    setNudge('idle')
    setThinking(true)
    log('hint', { level, trigger, question })
    const id = nextId.current++
    const isBaseline = MODE === 'baseline'
    if (isBaseline) {
      setCards((cs) => [...cs, { id, trigger, level: 0, text: '', source: 'baseline', model, promptVariant, context, profile, streaming: true, question, guardrail: { leaked: false, stripped: false } }])
    }
    let res: HintResponse
    try {
      res = await provider.requestHint(
        { problemId: p.id, code, level, mastery, struggle, question, trigger, promptVariant, systemPrompt, model, context, profile },
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
    if (res.highlightLines) setHighlight({ lines: res.highlightLines, message: res.text })
    setLastHintAt(Date.now())
    setActivitySinceHint(false)
  }, [code, mastery, struggle, p.id, log, promptVariant, systemPrompt, model, context, profile])

  const policyLevel = (): Level => (cards.length ? currentLevel : failedRuns >= 3 ? 1 : 0)

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
    if (MODE === 'scaffold' && n >= 2 && !tutorOpen && Date.now() > snoozedUntil && nudge !== 'nudge') setNudge('nudge')
  }, [code, p, failedRuns, tutorOpen, snoozedUntil, nudge, explanations, log])

  const snooze = useCallback(() => {
    setSnoozedUntil(Date.now() + SNOOZE_MS); setNudge('snoozed'); log('snooze')
    setTimeout(() => setNudge((s) => (s === 'snoozed' ? 'idle' : s)), SNOOZE_MS)
  }, [log])

  const actions = useRef<EditorActions>({} as EditorActions)
  actions.current = {
    run: doRun,
    toggleTutor: () => setTutorOpen((o) => !o),
    requestHint: () => requestHint(policyLevel(), 'requested'),
    escalate: () => { if (canEscalate.ok) { log('escalate'); requestHint((currentLevel + 1) as Level, 'escalated') } },
    toggleProblem: () => setProblemOpen((o) => !o),
    toggleOutput: () => setOutputOpen((o) => !o),
    snooze,
  }

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
      <Header lab={p.lab} title={p.title} hintLabel={MODE === 'baseline' ? 'Ask' : 'Hint'} onRun={doRun} onHint={() => setTutorOpen((o) => !o)} />
      <div className="main">
        <ProblemPane p={p} collapsed={!problemOpen} lite={LITE} />
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
            <OutputPanel tab={tab} setTab={setTab} diagnostics={run.diagnostics} explanations={explanations} tests={run.tests} onClose={() => setOutputOpen(false)} onJump={jump} lite={LITE} />
          )}
          {outputOpen && !run && <div />}
        </div>
        {tutorOpen && (
          <TutorPanel
            mode={MODE}
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
            onEscalate={actions.current.escalate}
          />
        )}
        {!tutorOpen && <div />}
      </div>
      <StatusBar ln={cursor.ln} col={cursor.col} nudge={nudge} lite={LITE}
        onNudgeClick={() => (nudge === 'nudge' ? requestHint(policyLevel(), 'proactive') : setTutorOpen((o) => !o))}
        onSnooze={snooze} />
    </div>
  )
}
