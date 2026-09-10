import { useEffect, useRef, useState } from 'react'
import type { ContextMode, HintResponse, Level, ProfileMode, PromptVariant } from '../types'
import prompts from '../providers/prompts.json'

export type HintCard = HintResponse & { id: number; trigger: 'requested' | 'proactive' | 'escalated'; streaming?: boolean; question?: string }

type Props = {
  mode: 'scaffold' | 'baseline'
  lite?: boolean
  promptVariant: PromptVariant
  onPromptVariant: (v: PromptVariant) => void
  systemPrompt: string
  onSystemPrompt: (text: string, v: PromptVariant) => void
  model: string
  onModel: (m: string) => void
  context: ContextMode
  onContext: (c: ContextMode) => void
  profile: ProfileMode
  onProfile: (p: ProfileMode) => void
  cards: HintCard[]
  thinking: boolean
  canEscalate: { ok: boolean; why: string }
  onClose: () => void
  onAsk: (question: string) => void
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

const VERDICT: Record<string, string> = { clean: 'No code', partial: 'Code fragments', leaked: 'Leaked solution', error: 'Error' }

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
          {c.promptVariant && <span>{c.promptVariant}{c.context && c.context !== 'none' ? ` · ${c.context}` : ''}{c.profile && c.profile !== 'none' ? ` · ${c.profile}` : ''}</span>}
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

export function TutorPanel({ mode, lite = false, promptVariant, onPromptVariant, systemPrompt, onSystemPrompt, model, onModel, context, onContext, profile, onProfile, cards, thinking, canEscalate, onClose, onAsk, onEscalate, onClear }: Props) {
  const [q, setQ] = useState('')
  const [showSys, setShowSys] = useState(false)
  const [models, setModels] = useState<string[]>([])
  useEffect(() => {
    if (!showSys) return
    fetch('/ollama/api/tags').then((r) => r.json()).then((d: { models?: { name: string }[] }) => setModels((d.models ?? []).map((m) => m.name))).catch(() => setModels([]))
  }, [showSys])
  const PRESET_LABEL: Record<string, string> = { plain: 'Plain assistant', basic: 'Tutoring prompt', hardened: 'Hardened prompt' }
  const listRef = useRef<HTMLDivElement>(null)
  const lastLen = cards.length ? cards[cards.length - 1].text.length : 0
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [cards.length, thinking, lastLen])
  const submit = () => { onAsk(q.trim()); setQ('') }
  return (
    <aside className="tutor" aria-label="Tutor">
      <div className="thead">
        <b>{mode === 'baseline' ? 'Assistant' : 'Tutor'}</b>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <kbd>esc</kbd>
          <button className="iconbtn" onClick={onClose} aria-label="Close tutor">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
          </button>
        </div>
      </div>
      {mode === 'baseline' && !lite && (
        <div className="controls">
              <select className="sel" value={promptVariant} onChange={(e) => onPromptVariant(e.target.value as PromptVariant)} aria-label="System prompt">
                <option value="plain">Plain assistant (what students use)</option>
                <option value="basic">Tutoring prompt (CodeHelp-style)</option>
                <option value="hardened">Hardened tutoring prompt</option>
              </select>
              {!lite && <select className="sel" value={context} onChange={(e) => onContext(e.target.value as ContextMode)} aria-label="Retrieved context">
                <option value="none">No retrieval</option>
                <option value="rag">RAG: notes + history</option>
                <option value="rag_solution">RAG + solution</option>
              </select>}
              {!lite && <select className="sel" value={profile} onChange={(e) => onProfile(e.target.value as ProfileMode)} aria-label="Student profile">
                <option value="none">No profile</option>
                <option value="strong">Strong student</option>
                <option value="novice">Novice student</option>
              </select>}
          <button className="iconbtn" onClick={onClear} title="Start a new conversation" aria-label="Start a new conversation" style={{ marginLeft: 'auto' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M2.5 8a5.5 5.5 0 1 1 1.6 3.9M2.5 12.5V8.8h3.7" /></svg>
          </button>
        </div>
      )}
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
      {mode === 'baseline' && (
        <div className="sysrow">
          <button className="linkbtn" onClick={() => setShowSys((v) => !v)}>{showSys ? 'Hide system prompt' : 'Show system prompt'}</button>
          <span className="sysusing">using: {promptVariant}</span>
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
            {(['plain', 'basic', 'hardened'] as const).map((v) => (
              <button key={v} className={'pill' + (promptVariant === v ? ' on' : '')} onClick={() => onSystemPrompt(prompts[v], v)}>{PRESET_LABEL[v]}</button>
            ))}
          </div>
          <textarea value={systemPrompt} onChange={(e) => onSystemPrompt(e.target.value, 'custom')} rows={8} spellCheck={false} aria-label="System prompt text" />
          <div className="why" style={{ textAlign: 'left', margin: '6px 0 0' }}>Applies to your next message. The problem statement and your current code are appended automatically.</div>
        </div>
      )}
      <div className="cards" ref={listRef}>
        {cards.length === 0 && !thinking && (
          <div className="empty">{mode === 'baseline' ? (lite ? 'Ask a question. Replies are shown exactly as the model wrote them.' : 'A prompted assistant with no student model. It answers only when asked, and its replies are shown exactly as written.') : 'Hints appear here. They never contain a finished solution.'}</div>
        )}
        {cards.map((c) => c.source === 'baseline' ? <BaselineCard c={c} key={c.id} /> : (
          <div className="card" key={c.id}>
            <Ladder level={c.level} />
            <p>{c.text}</p>
            {c.pseudocode && <Gapped text={c.pseudocode} />}
          </div>
        ))}
        {thinking && !cards.some((c) => c.streaming) && <div className="thinking">Thinking</div>}
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
