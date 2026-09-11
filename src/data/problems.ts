import { labContent, type LabChecks, type LabHint, type LabTest } from '../mock/labContent'
import { mockData } from '../mock/data'
import { questionsForLab, type LabQuestion } from '../mock/labQuestions'
import type { Lab } from '../types'

export type HintSpec = LabHint

export type Problem = {
  id: string
  lab: string
  title: string
  statement: string
  examples: string[]
  constraints: string[]
  concepts: { name: string; mastery: number }[]
  starter: string
  // Guardrail comparator only. Never sent to a model, never rendered — see
  // src/providers/guardrail.ts and AGENTS.md §4.3.
  solution: string
  hints: Record<0 | 1 | 2 | 3 | 4, HintSpec>
  tests: LabTest[]
  // How the mock compiler judges this problem (src/mock/compiler.ts).
  checks: LabChecks
}

export const problems: Record<string, Problem> = {
  P02: {
    id: 'P02',
    lab: 'Lab 3',
    title: 'Factorial, recursively',
    statement:
      'Write a function fact that takes a non-negative integer n and returns n factorial. The function must call itself. Do not use a loop.',
    examples: ['fact(0)  =>  1', 'fact(1)  =>  1', 'fact(5)  =>  120'],
    constraints: ['0 <= n <= 12', 'Return type is int', 'No loops, no global state'],
    concepts: [
      { name: 'Recursion', mastery: 0.23 },
      { name: 'Functions', mastery: 0.78 },
    ],
    starter: `#include <iostream>

// Return n! using recursion.
int fact(int n) {
    return n * fact(n - 1);
}

int main() {
    std::cout << fact(5) << std::endl;
    return 0;
}
`,
    solution: `int fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}`,
    hints: {
      0: {
        text: 'Every call to fact makes another call to fact. What should happen when n is small enough that there is nothing left to multiply?',
      },
      1: {
        text: 'Your function has no stopping condition. A recursive function needs one case that returns a value directly, without calling itself. Look at the highlighted line and ask what runs before it.',
        anchor: /return\s+n\s*\*\s*fact/,
      },
      2: {
        text: 'This is the base case of a recursion. fact(n) is n times fact(n minus 1), but that only makes sense while n is above 0. The definition says 0! is 1. Your code needs to state that before the recursive line runs. What should fact return when n is 0?',
        anchor: /return\s+n\s*\*\s*fact/,
      },
      3: {
        text: 'Here is the shape of the function with the base case left blank.',
        pseudocode: 'function fact(n):\n    if n is [__]:\n        return [__]\n    return n * fact(n - 1)',
      },
      4: {
        text: 'One condition and one return value are missing.',
        pseudocode: 'int fact(int n) {\n    if (n <= [__]) return [__];\n    return n * fact(n - 1);\n}',
      },
    },
    tests: [
      { name: 'fact(0)', expected: '1', hidden: false },
      { name: 'fact(1)', expected: '1', hidden: false },
      { name: 'fact(5)', expected: '120', hidden: false },
      { name: 'fact(10)', expected: '3628800', hidden: false },
      { name: 'hidden 1', expected: '5040', hidden: true },
      { name: 'hidden 2', expected: '479001600', hidden: true },
    ],
    checks: {
      definition: /int\s+fact\s*\(/,
      definitionRaw: "undefined reference to 'fact(int)'",
      definitionCls: 'undefined-fact',
      key: /if\s*\(\s*n\s*(<=|==|<)\s*[01]\s*\)|n\s*(<=|==|<)\s*[01]\s*\?/,
      keyRaw: 'infinite recursion detected [-Winfinite-recursion]',
      keyCls: 'infinite-recursion',
      keySeverity: 'warning',
      keyAnchor: /return\s+n\s*\*\s*fact/,
      explanation:
        'The compiler can prove that fact always calls fact again, so no call ever returns. A recursive function needs at least one path that returns a value without calling itself.',
    },
  },
}

// Every lab is looked up the same way a built-in problem is, so providers and the
// guardrail need one lookup and no special case. Seeded labs are registered at
// load; a lab authored in the console is registered the first time it is opened
// and borrows the built-in ladder, tests and comparator until it has its own.
const FALLBACK = problems.P02

function fromLab(lab: Lab): Problem {
  const content = labContent[lab.id]
  const concepts = lab.kcIds.map((kcId) => {
    const kc = mockData.knowledgeComponents.find((item) => item.id === kcId)
    const trace = mockData.masteryTraces.find((item) => item.studentId === 'student-31' && item.kcId === kcId)
    const point = trace?.telemetryAdjusted[trace.telemetryAdjusted.length - 1]
    return { name: kc?.name ?? kcId.replaceAll('-', ' '), mastery: point?.value ?? 0 }
  })
  return {
    id: lab.id,
    lab: `Lab ${lab.number}`,
    title: lab.title,
    statement: lab.statement,
    examples: content?.examples ?? [],
    constraints: content?.constraints ?? ['Follow the lab handout', 'Keep the given signature', 'No external libraries'],
    concepts,
    starter: lab.starterCode,
    solution: content?.solution ?? FALLBACK.solution,
    hints: content?.hints ?? FALLBACK.hints,
    tests: content?.tests ?? FALLBACK.tests,
    checks: content?.checks ?? FALLBACK.checks,
  }
}

export function registerLabProblem(lab: Lab): Problem {
  const existing = problems[lab.id]
  if (existing) return existing
  const built = fromLab(lab)
  problems[lab.id] = built
  return built
}

for (const lab of mockData.labs) {
  registerLabProblem(lab)
  for (const question of questionsForLab(lab)) registerQuestionProblem(question, lab)
}

// A question is a problem: same lookup, same guardrail, same tutor. Registering it
// means nothing downstream has to know whether it came from a lab with one
// question or with three.
export function registerQuestionProblem(question: LabQuestion, lab: Lab): Problem {
  const existing = problems[question.id]
  if (existing) return existing
  const concepts = question.kcIds.map((kcId) => {
    const kc = mockData.knowledgeComponents.find((item) => item.id === kcId)
    const trace = mockData.masteryTraces.find((item) => item.studentId === 'student-31' && item.kcId === kcId)
    const point = trace?.telemetryAdjusted[trace.telemetryAdjusted.length - 1]
    return { name: kc?.name ?? kcId.replaceAll('-', ' '), mastery: point?.value ?? 0 }
  })
  const built: Problem = {
    id: question.id,
    lab: `Lab ${lab.number} · Q${question.number}`,
    title: question.title,
    statement: question.statement,
    examples: question.examples,
    constraints: question.constraints,
    concepts,
    starter: question.starter,
    solution: question.solution,
    hints: question.hints,
    tests: question.tests,
    checks: question.checks,
  }
  problems[question.id] = built
  return built
}
