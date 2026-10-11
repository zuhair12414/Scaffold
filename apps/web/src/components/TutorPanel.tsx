import { useEffect, useRef, useState } from 'react'
import type { HintResponse, PromptVariant } from '../types'
import prompts from '../providers/prompts.json'
import { attackPrompts } from '../data/attacks'

export type HintCard = HintResponse & { id: number; trigger: 'requested' | 'proactive' | 'escalated'; streaming?: boolean; question?: string }

type Props = {
  // The conversation belongs to one question, and says so.
  questionLabel: string
  draft: string
  onDraft: (text: string) => void
  lite?: boolean
  promptVariant: PromptVariant
  systemPrompt: string
  onSystemPrompt: (text: string, v: PromptVariant) => void
  model: string
  onModel: (m: string) => void
  cards: HintCard[]
  thinking: boolean
  onClose: () => void
  onAsk: (question: string) => void
  // A probe asks for the finished answer, as written in the harness.
  onAttack: (question: string) => void
  onClear: () => void
}

const VERDICT: Record<string, string> = { clean: 'No code', partial: 'Code fragments', leaked: 'Full code', error: 'Error' }

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

// One card shape, because there is one assistant. It shows which model answered,
// which prompt it ran, how long it took, and what the leakage check made of the
// reply — and no level, because this assistant makes no disclosure decision.
function ReplyCard({ c }: { c: HintCard }) {
  return (
    <div className="turn-group">
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
    </div>
  )
}

export function TutorPanel({ questionLabel, draft, onDraft, lite = false, promptVariant, systemPrompt, onSystemPrompt, model, onModel, cards, thinking, onClose, onAsk, onAttack, onClear }: Props) {
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
    <aside className="tutor" aria-label="Ask AI">
      <div className="thead">
        <b>Ask AI</b>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <kbd>esc</kbd>
          <button className="iconbtn" onClick={onClose} aria-label="Close the assistant">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
          </button>
        </div>
      </div>
      <div className="ask">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="Ask the assistant"
          aria-label="Ask the assistant"
        />
        <button className="btn accent" onClick={submit}>Ask</button>
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
          The assistant answers them as written and the card says what came back.
        </p>
      </details>
      <div className="sysrow">
        <button className="linkbtn" onClick={() => setShowSys((v) => !v)}>{showSys ? 'Hide system prompt' : 'Show system prompt'}</button>
        <span className="sysusing">using: {promptVariant === 'plain' ? 'baseline' : promptVariant}</span>
        <button className="linkbtn" onClick={onClear}>New conversation</button>
      </div>
      {showSys && (
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
          <div className="empty">
            {lite
              ? 'Ask a question. Replies are shown exactly as the model wrote them.'
              : 'A prompted assistant with no student model. It answers only when asked, and its replies are shown exactly as written.'}
          </div>
        )}
        {cards.map((c) => <ReplyCard c={c} key={c.id} />)}
        {thinking && !cards.some((c) => c.streaming) && <div className="thinking">Thinking</div>}
      </div>
      <div className="tfoot">
        <div className="why">
          {lite
            ? 'Prototype. Assistant only; no student model yet.'
            : 'Baseline assistant. No hint levels, no struggle detection, no output filter.'}
        </div>
      </div>
    </aside>
  )
}
