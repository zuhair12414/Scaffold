import { useEffect, useRef, useState } from 'react'
import type { HintResponse, Level, PromptVariant } from '../types'
import prompts from '../providers/prompts.json'
import { attackPrompts } from '../data/attacks'

export type HintCard = HintResponse & { id: number; trigger: 'requested' | 'proactive' | 'escalated'; streaming?: boolean; question?: string }

type Props = {
  mode: 'scaffold' | 'baseline'
  onMode: (mode: 'scaffold' | 'baseline') => void
  // The conversation belongs to one question, and says so.
  questionLabel: string
  draft: string
  onDraft: (text: string) => void
  maxHintLevel: number
  similarityThreshold: number
  lite?: boolean
  promptVariant: PromptVariant
  systemPrompt: string
  onSystemPrompt: (text: string, v: PromptVariant) => void
  model: string
  onModel: (m: string) => void
  cards: HintCard[]
  thinking: boolean
  canEscalate: { ok: boolean; why: string }
  onClose: () => void
  onAsk: (question: string) => void
  // An attack asks for the finished answer. In baseline that is just a message; in
  // scaffold it is an escalation request, so the guardrail has something to measure.
  onAttack: (question: string) => void
  onEscalate: () => void
  onClear: () => void
}

function Ladder({ level }: { level: Level }) {
  return (
    <div className="lad" aria-label={`Level ${level} of 5`}>
      {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i <= level ? 'on' : ''} />)}
      <svg className="lock" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-label="Level 5 is instructor only"><rect x="2.5" y="5" width="7" height="5.5" rx="1" /><path d="M4 5V3.5a2 2 0 0 1 4 0V5" /></svg>
      <span>Level {level}</span>
    </div>
  )
}

const VERDICT: Record<string, string> = { clean: 'No code', partial: 'Code fragments', leaked: 'Full code', error: 'Error' }

const LEVEL_LABEL: Record<number, string> = {
  1: 'Point at the concept that is stuck',
  2: 'Name the missing case in words',
  3: 'Shape of the function, blanks left open',
  4: 'Line-level shape, one value missing',
}

type LadderState = 'released' | 'withheld' | 'next' | 'capped' | 'locked'

// The ladder is the product claim made visible: a policy decides the level, the
// guardrail decides whether what came back may be shown, and the student can see
// both — including the level that was measured and withheld.
function LadderPanel({ cards, canEscalate, maxHintLevel, similarityThreshold }: {
  cards: HintCard[]
  canEscalate: { ok: boolean; why: string }
  maxHintLevel: number
  similarityThreshold: number
}) {
  const highest = cards.reduce((top, card) => (card.guardrail?.blocked ? top : Math.max(top, card.level)), 0)
  const rows = [1, 2, 3, 4].map((level) => {
    const withheld = cards.find((card) => card.level === level && card.guardrail?.blocked)
    let state: LadderState = 'locked'
    let note = ''
    if (withheld) {
      state = 'withheld'
      note = withheld.guardrail?.reason ?? 'measured too close to the solution'
    } else if (level <= highest) {
      state = 'released'
      note = 'shown'
    } else if (level > maxHintLevel) {
      state = 'capped'
      note = `your instructor capped this lab at Level ${maxHintLevel}`
    } else if (level === highest + 1) {
      state = 'next'
      note = canEscalate.ok ? 'ready when you ask' : canEscalate.why || 'ask for a hint first'
    } else {
      note = `releases after Level ${level - 1}`
    }
    return { level, state, note }
  })

  return (
    <ol className="ladder-panel" data-testid="ladder-panel">
      {rows.map((row) => (
        <li key={row.level} className={row.state} data-testid={`ladder-${row.level}`} data-state={row.state}>
          <b>Level {row.level}</b>
          <span>{LEVEL_LABEL[row.level]}</span>
          <small>{row.note}</small>
        </li>
      ))}
      <li className="instructor-only">
        <b>Level 5</b>
        <span>Worked solution</span>
        <small>instructor only, never released in a lab</small>
      </li>
      <li className="ladder-foot">
        Every reply is measured against the reference solution before you see it. This lab
        withholds anything above {similarityThreshold.toFixed(2)}.
      </li>
    </ol>
  )
}

function Rich({ text }: { text: string }) {
  const parts = text.split(/```[a-zA-Z+]*\n?/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <pre className="codeblk" key={i}>{part.replace(/\n$/, '')}</pre>
          : part.split(/\n{2,}/).filter((t) => t.trim()).map((para, j) => <p key={`${i}-${j}`}>{para.trim()}</p>),
      )}
    </>
  )
}

function BaselineCard({ c }: { c: HintCard }) {
  return (
    <>
      {c.question && <div className="you">{c.question}</div>}
      <div className={'card' + (c.verdict === 'error' ? ' error' : '')}>
        <div className="meta">
          <span className="model">{c.model ?? 'assistant'}</span>
          {c.promptVariant && <span>{c.promptVariant === 'plain' ? 'baseline' : c.promptVariant}</span>}
          {c.latencyMs != null && <span className="lat">{(c.latencyMs / 1000).toFixed(1)}s</span>}
          {c.streaming ? <span className="chip">writing</span> : <span className={'chip ' + (c.verdict ?? 'clean')}>{VERDICT[c.verdict ?? 'clean']}</span>}
        </div>
        {c.text ? <Rich text={c.text} /> : <p className="thinking">Thinking</p>}
        {c.streaming && c.text && <span className="caret" />}
      </div>
    </>
  )
}

function Gapped({ text }: { text: string }) {
  const parts = text.split('[__]')
  return <pre>{parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <u> </u>}</span>)}</pre>
}

export function TutorPanel({ mode, onMode, questionLabel, draft, onDraft, maxHintLevel, similarityThreshold, lite = false, promptVariant, systemPrompt, onSystemPrompt, model, onModel, cards, thinking, canEscalate, onClose, onAsk, onAttack, onEscalate, onClear }: Props) {
  const q = draft
  const setQ = onDraft
  const [showSys, setShowSys] = useState(false)
  const [models, setModels] = useState<string[]>([])
  useEffect(() => {
    if (!showSys) return
    fetch('/ollama/api/tags').then((r) => r.json()).then((d: { models?: { name: string }[] }) => setModels((d.models ?? []).map((m) => m.name))).catch(() => setModels([]))
  }, [showSys])
  // Two prompts, because two is the comparison: what students use today, and the
  // best a prompt can do. The middle one still exists in prompts.json for the spike.
  const PRESET_LABEL: Record<string, string> = { plain: 'Baseline prompt', hardened: 'Hardened prompt' }
  const listRef = useRef<HTMLDivElement>(null)
  const lastLen = cards.length ? cards[cards.length - 1].text.length : 0
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [cards.length, thinking, lastLen])
  const submit = () => { onAsk(q.trim()); setQ('') }
  const conversationNote = `This conversation belongs to ${questionLabel}. It is kept with your work; there is no delete.`
  return (
    <aside className="tutor" aria-label="Tutor">
      <div className="thead">
        <div className="mode-switch" role="group" aria-label="Assistance mode">
          <button className={mode === 'scaffold' ? 'on' : undefined} onClick={() => onMode('scaffold')} data-testid="mode-scaffold">
            Scaffold tutor
          </button>
          <button className={mode === 'baseline' ? 'on' : undefined} onClick={() => onMode('baseline')} data-testid="mode-baseline">
            Baseline assistant
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <kbd>esc</kbd>
          <button className="iconbtn" onClick={onClose} aria-label="Close tutor">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
          </button>
        </div>
      </div>
      <div className="ask">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder={mode === 'baseline' ? 'Ask the assistant' : 'What are you stuck on? Optional'}
          aria-label="What are you stuck on"
        />
        <button className="btn accent" onClick={submit}>{mode === 'baseline' ? 'Ask' : 'Get a hint'}</button>
      </div>
      <details className="attack-bar" data-testid="attack-bar">
        <summary>Leakage probes · {attackPrompts.length} tactics from the harness</summary>
        <div className="attack-buttons">
          {attackPrompts.map((attack) => (
            <button
              key={attack.id}
              onClick={() => onAttack(attack.text)}
              title={`${attack.tactic}\n\n${attack.text}`}
              data-testid="attack-prompt"
              data-attack-id={attack.id}
            >
              <b>{attack.id}</b>
              {attack.label}
            </button>
          ))}
        </div>
        <p>
          Verbatim from <code>spike/attacks.json</code>, the strings the leakage harness measures.
          {mode === 'baseline'
            ? ' The baseline answers them as written and the card says what came back.'
            : ' Here they are read as a request for the finished answer, so the guardrail has something to measure.'}
        </p>
      </details>
      {mode === 'baseline' && (
        <div className="sysrow">
          <button className="linkbtn" onClick={() => setShowSys((v) => !v)}>{showSys ? 'Hide system prompt' : 'Show system prompt'}</button>
          <span className="sysusing">using: {promptVariant === 'plain' ? 'baseline' : promptVariant}</span>
          <button className="linkbtn" onClick={onClear}>New conversation</button>
        </div>
      )}
      {mode === 'baseline' && showSys && (
        <div className="sysbox">
          <div className="modelrow">
            <span>Model</span>
            <select className="sel" value={model} onChange={(e) => onModel(e.target.value)} aria-label="Model">
              {[model, ...models.filter((m) => m !== model)].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="presets">
            {(['plain', 'hardened'] as const).map((v) => (
              <button key={v} className={'pill' + (promptVariant === v ? ' on' : '')} onClick={() => onSystemPrompt(prompts[v], v)}>{PRESET_LABEL[v]}</button>
            ))}
          </div>
          <textarea value={systemPrompt} onChange={(e) => onSystemPrompt(e.target.value, 'custom')} rows={8} spellCheck={false} aria-label="System prompt text" />
          <div className="why" style={{ textAlign: 'left', margin: '6px 0 0' }}>Applies to your next message. The problem statement and your current code are appended automatically.</div>
        </div>
      )}
      <div className="cards" ref={listRef}>
        {cards.length > 0 && <p className="chat-scope">{conversationNote}</p>}
        {cards.length === 0 && !thinking && (
          <div className="empty">{mode === 'baseline' ? (lite ? 'Ask a question. Replies are shown exactly as the model wrote them.' : 'A prompted assistant with no student model. It answers only when asked, and its replies are shown exactly as written.') : 'Hints appear here. They never contain a finished solution.'}</div>
        )}
        {cards.map((c) => c.source === 'baseline' ? <BaselineCard c={c} key={c.id} /> : (
          <div key={c.id} className="turn-group">
            {c.question && <div className="you">{c.question}</div>}
          <div className={'card' + (c.guardrail?.blocked ? ' withheld' : '')}>
            {/* The baseline has no levels. That is the point of it, so it shows none,
                even on a turn the scaffold tutor wrote earlier in this conversation. */}
            {mode !== 'baseline' && <Ladder level={c.level} />}
            {c.guardrail?.blocked && (
              <p className="withheld-line" data-testid="withheld-card">
                Level {c.level} was withheld / {c.guardrail.reason}
              </p>
            )}
            <p>{c.text}</p>
            {c.pseudocode && <Gapped text={c.pseudocode} />}
          </div>
          </div>
        ))}
        {thinking && !cards.some((c) => c.streaming) && <div className="thinking">Thinking</div>}
        {mode === 'scaffold' && (
          <LadderPanel
            cards={cards}
            canEscalate={canEscalate}
            maxHintLevel={maxHintLevel}
            similarityThreshold={similarityThreshold}
          />
        )}
      </div>
      <div className="tfoot">
        {mode === 'baseline' ? (
          <div className="why">{lite ? 'Prototype. Assistant only; no student model yet.' : 'Baseline assistant. No hint levels, no struggle detection, no output filter.'}</div>
        ) : (
          <>
            <button className="btn" disabled={!canEscalate.ok} onClick={onEscalate} title="Escalate one level ⌘.">
              Need more help <kbd>⌘.</kbd>
            </button>
            {!canEscalate.ok && <div className="why">{canEscalate.why}</div>}
          </>
        )}
      </div>
    </aside>
  )
}
