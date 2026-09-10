import type { HintProvider } from './HintProvider'
import { applyGuardrail } from './guardrail'
import type { Diagnostic, HintRequest, HintResponse, Level } from '../types'
import { problems } from '../data/problems'
import { labContent } from '../mock/labContent'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const WITHHELD =
  'That level was measured too close to the finished solution, so it was not shown. What is still unclear about the case you are missing?'

export class MockHintProvider implements HintProvider {
  async requestHint(req: HintRequest): Promise<HintResponse> {
    await wait(500 + Math.random() * 400)
    // A lab authored in the instructor console has no ladder of its own; it borrows
    // the built-in problem's. Falling back keeps the demo alive instead of throwing
    // inside a hint request.
    const p = problems[req.problemId] ?? problems.P02
    const level = Math.min(req.level, 4) as 0 | 1 | 2 | 3 | 4
    const h = p.hints[level]

    // The policy picked the level; the guardrail now reads what came back and
    // decides whether it may be shown. Order matters: measure, then release.
    const decision = applyGuardrail(h.text, h.pseudocode, p.solution, req.similarityThreshold ?? 0.6)
    if (decision.blocked) {
      return {
        level: level as Level,
        text: WITHHELD,
        guardrail: { leaked: false, stripped: true, ...decision },
      }
    }

    const lines = h.anchor ? findLines(req.code, h.anchor) : undefined
    return {
      level: level as Level,
      text: h.text,
      pseudocode: h.pseudocode,
      highlightLines: lines,
      guardrail: { leaked: false, stripped: false, ...decision },
    }
  }

  async explainDiagnostic(d: Diagnostic): Promise<string> {
    await wait(300)
    return explanationFor(d.cls)
  }
}

// One explanation per diagnostic class, collected from every lab and the built-in
// problem, so a lab's compiler output is explained in that lab's terms.
function explanationFor(cls: string) {
  for (const content of Object.values(labContent)) {
    if (content.checks.keyCls === cls) return content.checks.explanation
    if (content.checks.definitionCls === cls) {
      return 'The tests call a function that is not defined yet. Check the name and the signature against the starter code.'
    }
  }
  for (const problem of Object.values(problems)) {
    if (problem.checks.keyCls === cls) return problem.checks.explanation
    if (problem.checks.definitionCls === cls) {
      return 'The tests call a function that is not defined yet. Check the name and the signature against the starter code.'
    }
  }
  return 'The compiler reported a problem on this line.'
}

function findLines(code: string, needle: RegExp): number[] | undefined {
  const out: number[] = []
  code.split('\n').forEach((l, i) => { if (needle.test(l)) out.push(i + 1) })
  return out.length ? out : undefined
}

