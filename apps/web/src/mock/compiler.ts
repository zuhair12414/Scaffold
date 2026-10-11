import type { Diagnostic, TestResult } from '../types'
import type { Problem } from '../data/problems'

export type RunResult = { diagnostics: Diagnostic[]; tests: TestResult[]; ok: boolean }

// Deterministic stand-in for the sandboxed GCC run. Each problem declares the two
// signals it is judged on (src/mock/labContent.ts): the definition that has to
// exist, and the one construct that makes the tests pass. Every lab gets its own
// diagnostic instead of one problem's compiler output standing in for all of them.
export function mockRun(code: string, p: Problem): RunResult {
  const lines = code.split('\n')
  const checks = p.checks
  const tests = (actual: string, passed: boolean) =>
    p.tests.map((t) => ({ name: t.name, passed, expected: t.expected, actual: passed ? t.expected : actual, hidden: t.hidden }))

  if (!checks.definition.test(code)) {
    return {
      ok: false,
      diagnostics: [{ line: 1, col: 1, severity: 'error', raw: checks.definitionRaw, cls: checks.definitionCls }],
      tests: tests('did not compile', false),
    }
  }

  if (!checks.key.test(code)) {
    const anchor = checks.keyAnchor
    const found = anchor ? lines.findIndex((line) => anchor.test(line)) : -1
    const index = found >= 0 ? found : lines.findIndex((line) => checks.definition.test(line))
    const line = Math.max(index, 0) + 1
    const col = (lines[line - 1]?.search(/\S/) ?? 0) + 1
    return {
      ok: false,
      diagnostics: [{ line, col, severity: checks.keySeverity, raw: checks.keyRaw, cls: checks.keyCls }],
      tests: tests(checks.keySeverity === 'error' ? 'did not compile' : 'failed at runtime', false),
    }
  }

  return { ok: true, diagnostics: [], tests: tests('', true) }
}
