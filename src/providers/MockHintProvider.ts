import type { HintProvider } from './HintProvider'
import type { Diagnostic, HintRequest, HintResponse, Level } from '../types'
import { problems } from '../data/problems'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class MockHintProvider implements HintProvider {
  async requestHint(req: HintRequest): Promise<HintResponse> {
    await wait(500 + Math.random() * 400)
    const p = problems[req.problemId]
    const level = Math.min(req.level, 4) as 0 | 1 | 2 | 3 | 4
    const h = p.hints[level]
    const lines = h.anchor ? findLines(req.code, h.anchor) : undefined
    return {
      level: level as Level,
      text: h.text,
      pseudocode: h.pseudocode,
      highlightLines: lines,
      guardrail: { leaked: false, stripped: false },
    }
  }

  async explainDiagnostic(d: Diagnostic): Promise<string> {
    await wait(300)
    return explanations[d.cls] ?? 'The compiler reported a problem on this line.'
  }
}

function findLines(code: string, needle: RegExp): number[] | undefined {
  const out: number[] = []
  code.split('\n').forEach((l, i) => { if (needle.test(l)) out.push(i + 1) })
  return out.length ? out : undefined
}

const explanations: Record<string, string> = {
  'infinite-recursion':
    'The compiler can prove that fact always calls fact again, so no call ever returns. A recursive function needs at least one path that returns a value without calling itself.',
  'undefined-fact':
    'The tests call a function named fact, but nothing with that name is defined. Check the function name and its spelling.',
}
