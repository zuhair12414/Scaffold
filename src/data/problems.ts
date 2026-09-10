export type HintSpec = { text: string; pseudocode?: string; anchor?: RegExp }

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
  tests: { name: string; input: number; expected: number; hidden: boolean }[]
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
      { name: 'fact(0)', input: 0, expected: 1, hidden: false },
      { name: 'fact(1)', input: 1, expected: 1, hidden: false },
      { name: 'fact(5)', input: 5, expected: 120, hidden: false },
      { name: 'fact(10)', input: 10, expected: 3628800, hidden: false },
      { name: 'hidden 1', input: 7, expected: 5040, hidden: true },
      { name: 'hidden 2', input: 12, expected: 479001600, hidden: true },
    ],
  },
}
