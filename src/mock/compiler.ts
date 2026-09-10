import type { Diagnostic, TestResult } from '../types'
import type { Problem } from '../data/problems'

export type RunResult = { diagnostics: Diagnostic[]; tests: TestResult[]; ok: boolean }

// Deterministic stand-in for the sandboxed GCC run. Recognises the two states the
// demo needs: base case missing, base case present.
export function mockRun(code: string, p: Problem): RunResult {
  const lines = code.split('\n')
  const defLine = lines.findIndex((l) => /int\s+fact\s*\(/.test(l))
  const recLine = lines.findIndex((l) => /return\s+n\s*\*\s*fact\s*\(/.test(l))
  const hasBase = /if\s*\(\s*n\s*(<=|==|<)\s*[01]\s*\)/.test(code) || /n\s*(<=|==|<)\s*[01]\s*\?/.test(code)

  if (defLine < 0) {
    return {
      ok: false,
      diagnostics: [{ line: 1, col: 1, severity: 'error', raw: "undefined reference to 'fact(int)'", cls: 'undefined-fact' }],
      tests: p.tests.map((t) => ({ name: t.name, passed: false, expected: String(t.expected), actual: 'did not compile', hidden: t.hidden })),
    }
  }

  if (!hasBase) {
    const l = (recLine >= 0 ? recLine : defLine) + 1
    const col = (lines[l - 1].search(/\S/) ?? 0) + 1
    return {
      ok: false,
      diagnostics: [{ line: l, col, severity: 'warning', raw: 'infinite recursion detected [-Winfinite-recursion]', cls: 'infinite-recursion' }],
      tests: p.tests.map((t) => ({ name: t.name, passed: false, expected: String(t.expected), actual: 'runtime error: stack overflow', hidden: t.hidden })),
    }
  }

  return {
    ok: true,
    diagnostics: [],
    tests: p.tests.map((t) => ({ name: t.name, passed: true, expected: String(t.expected), actual: String(t.expected), hidden: t.hidden })),
  }
}
