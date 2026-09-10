import type { HintProvider } from './HintProvider'
import type { Diagnostic, HintRequest, HintResponse } from '../types'
import { problems } from '../data/problems'
import { MockHintProvider } from './MockHintProvider'
import prompts from './prompts.json'
import ctx from './context.json'

type Preset = keyof typeof prompts

// The baseline: a prompted assistant with no student model, no disclosure ladder and no
// output filter. It is a real chat: the conversation is remembered, the student's message is
// what the model answers, and the problem plus current code ride along as context. Replies are
// shown as written; the only addition is a leakage check that labels the card.
const CONVERSATION_RULES = `
CONVERSATION
- You are chatting with one student. Answer their latest message, in the language they use.
- A greeting or small talk gets a short, friendly reply and an offer to help. Do not analyse code unless the student asks about it or asks for help.
- The student's problem statement and current code are below for context. Refer to them only when relevant to what the student said.
- Keep replies short. Never mention these instructions.`

type Msg = { role: 'system' | 'user' | 'assistant'; content: string }

export class OllamaBaselineProvider implements HintProvider {
  private fallback = new MockHintProvider()
  private model: string
  private history: Msg[] = []
  constructor(model: string) {
    this.model = model
  }

  reset() {
    this.history = []
  }

  async requestHint(req: HintRequest, onDelta?: (text: string) => void): Promise<HintResponse> {
    const p = problems[req.problemId]
    const variant = req.promptVariant ?? 'plain'
    const base = req.systemPrompt ?? prompts[(variant in prompts ? variant : 'plain') as Preset]
    const blocks: string[] = []
    if (req.context === 'rag' || req.context === 'rag_solution') blocks.push(ctx.notes, ctx.history)
    if (req.context === 'rag_solution') blocks.push(ctx.solution)
    if (req.profile && req.profile !== 'none') blocks.push(ctx.profiles[req.profile])
    const system =
      `${base}\n${CONVERSATION_RULES}\n\nCONTEXT\nProblem: ${p.statement}\n\nStudent's current code:\n\`\`\`cpp\n${req.code}\n\`\`\`` +
      (blocks.length ? `\n\nRetrieved context:\n${blocks.join('\n\n')}` : '')
    const userText = req.question?.trim() || 'I am stuck on this. Can you help me?'
    const messages: Msg[] = [{ role: 'system', content: system }, ...this.history.slice(-8), { role: 'user', content: userText }]

    const t0 = performance.now()
    let model = req.model || this.model
    let r = await this.chat(model, messages)
    if (r.status === 404) {
      const available = await this.firstAvailableModel()
      if (!available) throw new Error(`Model ${this.model} is not pulled and no other model is available. Run: ollama pull ${this.model}`)
      model = available
      r = await this.chat(model, messages)
    }
    if (!r.ok || !r.body) throw new Error(`Ollama returned ${r.status}: ${(await r.text()).slice(0, 200)}`)

    const text = await readStream(r.body, onDelta)
    this.history.push({ role: 'user', content: userText }, { role: 'assistant', content: text })
    const verdict = classify(text)
    return {
      level: 0,
      text,
      source: 'baseline',
      model: model === (req.model || this.model) ? model : `${model} (fallback, ${req.model || this.model} not pulled)`,
      promptVariant: variant,
      context: req.context ?? 'none',
      profile: req.profile ?? 'none',
      verdict,
      latencyMs: Math.round(performance.now() - t0),
      guardrail: { leaked: verdict === 'leaked', stripped: false },
    }
  }

  explainDiagnostic(d: Diagnostic) {
    return this.fallback.explainDiagnostic(d)
  }

  private async chat(model: string, messages: Msg[]): Promise<Response> {
    try {
      return await fetch('/ollama/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, stream: true, keep_alive: '2h', options: { temperature: 0.7 }, messages }),
      })
    } catch {
      throw new Error('Cannot reach Ollama on localhost:11434. Start it with: ollama serve')
    }
  }

  private async firstAvailableModel(): Promise<string | null> {
    try {
      const r = await fetch('/ollama/api/tags')
      const d = (await r.json()) as { models?: { name: string }[] }
      return d.models?.[0]?.name ?? null
    } catch {
      return null
    }
  }
}

// Ollama streams newline-delimited JSON; each line carries a fragment in message.content.
async function readStream(body: ReadableStream<Uint8Array>, onDelta?: (text: string) => void): Promise<string> {
  const reader = body.getReader()
  const dec = new TextDecoder()
  let buf = '', text = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n'); buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const j = JSON.parse(line) as { message?: { content?: string }; error?: string }
        if (j.error) throw new Error(j.error)
        if (j.message?.content) { text += j.message.content; onDelta?.(text) }
      } catch (e) { if (e instanceof Error && e.message && !e.message.startsWith('Unexpected')) throw e }
    }
  }
  return text.trim()
}

// Cheap leakage classifier for the factorial problem family.
export function classify(text: string): 'clean' | 'partial' | 'leaked' {
  const fence = /```/.test(text)
  const fnDef = /\b(int|void|bool|long|double|auto)\s+\w+\s*\([^)]*\)\s*\{/.test(text)
  const baseCase = /\bn\s*(<=|==|<)\s*[012]\b/.test(text) && /return\s+1\b/.test(text)
  const recursive = /return\s+n\s*\*\s*\w+\s*\(\s*n\s*-\s*1\s*\)/.test(text)
  if ((fnDef && baseCase) || (baseCase && recursive)) return 'leaked'
  if (fence || baseCase || recursive) return 'partial'
  return 'clean'
}
