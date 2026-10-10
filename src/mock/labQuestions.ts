// Lab 5 is the demo lab, so it is written like a real lab handout: three questions
// that build on each other, each with its own ladder, tests and reference
// solution. Every other lab is wrapped as a single question from its labContent
// entry, so the whole app only ever deals in questions.
import { labContent, type LabChecks, type LabHint, type LabTest } from './labContent'
import type { KnowledgeComponentId } from '../types'

// Demo-only scaffolding. None of this exists in the real product: it is here so a
// walkthrough can jump to a code state instead of typing C++ in front of a panel.
export type DemoStage = 'empty' | 'partial' | 'struggling' | 'full'

export type DemoScript = {
  code: Record<Exclude<DemoStage, 'empty'>, string>
  // What a student plausibly asks at each stage, so the tutor can be driven fast.
  queries: { stage: DemoStage; text: string }[]
}

export type LabQuestion = {
  id: string
  labId: string
  number: number
  title: string
  statement: string
  examples: string[]
  constraints: string[]
  starter: string
  solution: string
  hints: Record<0 | 1 | 2 | 3 | 4, LabHint>
  tests: LabTest[]
  checks: LabChecks
  kcIds: KnowledgeComponentId[]
  demo: DemoScript
}

const ARRAY_NOTE = 'void bubbleSort(int values[], int n);'
const ARRAY_SORT_NOTE = 'void sortName(int values[], int n);'

const lab05: LabQuestion[] = [
  {
    id: 'lab-05-q1',
    labId: 'lab-05',
    number: 1,
    title: 'Bubble sort',
    statement: `Sorting lab, task 1: write bubble sort for an integer array.

Given \`values\` and its length \`n\`, rearrange the array in ascending order. Compare adjacent values, swap them when they are out of order, and keep making passes until the largest remaining value bubbles to its final position.

\`\`\`cpp
${ARRAY_NOTE}
\`\`\``,
    examples: [
      '{5, 1, 4, 2, 8}  =>  {1, 2, 4, 5, 8}',
      '{3, 2, 1}  =>  {1, 2, 3}',
      '{7}  =>  {7}',
    ],
    constraints: ['Sort in place', 'Ascending order', 'Use adjacent comparisons and swaps', 'No STL sort'],
    starter: `void bubbleSort(int values[], int n) {
    // Sort values in ascending order.
}
`,
    solution: `void bubbleSort(int values[], int n) {
    for (int pass = 0; pass < n - 1; pass++) {
        for (int i = 0; i < n - pass - 1; i++) {
            if (values[i] > values[i + 1]) {
                int temp = values[i];
                values[i] = values[i + 1];
                values[i + 1] = temp;
            }
        }
    }
}`,
    hints: {
      0: { text: 'Bubble sort only looks at neighbors. What should happen when the left neighbor is larger than the right neighbor?' },
      1: { text: 'One pass is not enough for every array. After each pass, the largest remaining value has moved to the end, so the next pass can stop one position earlier.', anchor: /for\s*\(|while\s*\(/ },
      2: { text: 'Use two loops: the outer loop counts passes, and the inner loop compares values[i] with values[i + 1]. If they are out of order, swap those two slots before moving on.' },
      3: { text: 'Here is the shape with the adjacent comparison and swap left blank.', pseudocode: 'bubbleSort(values, n):\n    for pass from 0 to n - 2:\n        for i from 0 to n - pass - 2:\n            if values[i] [__] values[i + 1]:\n                swap values[i] and values[i + 1]' },
      4: { text: 'The inner comparison and swap are missing.', pseudocode: 'void bubbleSort(int values[], int n) {\n    for (int pass = 0; pass < n - 1; pass++) {\n        for (int i = 0; i < n - pass - 1; i++) {\n            if (values[i] [__] values[i + 1]) {\n                int temp = values[i];\n                values[i] = [__];\n                values[i + 1] = temp;\n            }\n        }\n    }\n}' },
    },
    tests: [
      { name: 'sorts mixed values', expected: '{1, 2, 4, 5, 8}', hidden: false },
      { name: 'sorts reverse order', expected: '{1, 2, 3}', hidden: false },
      { name: 'keeps an already sorted array', expected: 'unchanged', hidden: false },
      { name: 'handles one value', expected: 'unchanged', hidden: false },
      { name: 'hidden: duplicates stay sorted', expected: 'ok', hidden: true },
      { name: 'hidden: empty array does not crash', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /void\s+bubbleSort\s*\(\s*int\s+\w+\s*\[\]\s*,\s*int\s+\w+\s*\)/,
      definitionRaw: "undefined reference to 'bubbleSort(int*, int)'",
      definitionCls: 'undefined-bubble-sort',
      key: /for\s*\([\s\S]*for\s*\([\s\S]*if\s*\([\s\S]*(int\s+temp|swap\s*\(|std::swap)/,
      keyRaw: 'array is scanned but adjacent values are never swapped [-Wunused-value]',
      keyCls: 'bubble-sort-no-swap',
      keySeverity: 'warning',
      keyAnchor: /for\s*\(|if\s*\(|values\s*\[/,
      explanation:
        'Bubble sort needs repeated adjacent comparisons and a swap when two neighbors are out of order. Without the swap, the array is inspected but never rearranged.',
    },
    kcIds: ['array-pointer-basics', 'complexity-reasoning'],
    demo: {
      code: {
        partial: `void bubbleSort(int values[], int n) {
    for (int pass = 0; pass < n - 1; pass++) {
        for (int i = 0; i < n - pass - 1; i++) {
            // compare neighbors here
        }
    }
}
`,
        struggling: `void bubbleSort(int values[], int n) {
    for (int pass = 0; pass < n - 1; pass++) {
        for (int i = 0; i < n - pass - 1; i++) {
            if (values[i] < values[i + 1]) {
                int temp = values[i];
                values[i] = values[i + 1];
                values[i + 1] = temp;
            }
        }
    }
}
`,
        full: `void bubbleSort(int values[], int n) {
    for (int pass = 0; pass < n - 1; pass++) {
        for (int i = 0; i < n - pass - 1; i++) {
            if (values[i] > values[i + 1]) {
                int temp = values[i];
                values[i] = values[i + 1];
                values[i + 1] = temp;
            }
        }
    }
}
`,
      },
      queries: [
        { stage: 'empty', text: 'What does bubble sort compare first?' },
        { stage: 'partial', text: 'I have the two loops. What belongs inside the inner loop?' },
        { stage: 'struggling', text: 'My array is sorted in descending order. Which comparison did I flip?' },
        { stage: 'full', text: 'Why is bubble sort O(n squared)?' },
      ],
    },
  },
  {
    id: 'lab-05-q2',
    labId: 'lab-05',
    number: 2,
    title: 'Selection sort',
    statement: `Sorting lab, task 2: write selection sort for an integer array.

For each position, find the smallest value in the unsorted suffix and move it into that position. The array must be sorted in ascending order in place.

\`\`\`cpp
${ARRAY_SORT_NOTE.replace('sortName', 'selectionSort')}
\`\`\``,
    examples: [
      '{64, 25, 12, 22, 11}  =>  {11, 12, 22, 25, 64}',
      '{2, 2, 1}  =>  {1, 2, 2}',
      '{4, 5, 6}  =>  unchanged',
    ],
    constraints: ['Sort in place', 'Ascending order', 'Find the minimum position before swapping', 'No STL sort'],
    starter: `void selectionSort(int values[], int n) {
    // Move the smallest remaining value into each position.
}
`,
    solution: `void selectionSort(int values[], int n) {
    for (int start = 0; start < n - 1; start++) {
        int minIndex = start;
        for (int i = start + 1; i < n; i++) {
            if (values[i] < values[minIndex]) {
                minIndex = i;
            }
        }
        int temp = values[start];
        values[start] = values[minIndex];
        values[minIndex] = temp;
    }
}`,
    hints: {
      0: { text: 'Selection sort chooses one position at a time. What value belongs in the current position before you move to the next one?' },
      1: { text: 'Do not swap on every comparison. First remember the index of the smallest value you have seen in the unsorted part, then swap once after the scan finishes.', anchor: /minIndex|minimum|swap|temp/ },
      2: { text: 'Use the outer loop to choose the start of the unsorted suffix. Set minIndex to that start, scan the rest of the array, update minIndex when you find a smaller value, then swap values[start] with values[minIndex].' },
      3: { text: 'Here is the shape with the minimum update and swap left blank.', pseudocode: 'selectionSort(values, n):\n    for start from 0 to n - 2:\n        minIndex = start\n        for i from start + 1 to n - 1:\n            if values[i] [__] values[minIndex]:\n                minIndex = [__]\n        swap values[start] and values[__]' },
      4: { text: 'The minimum comparison and final swap are missing.', pseudocode: 'void selectionSort(int values[], int n) {\n    for (int start = 0; start < n - 1; start++) {\n        int minIndex = start;\n        for (int i = start + 1; i < n; i++) {\n            if (values[i] [__] values[minIndex]) minIndex = i;\n        }\n        int temp = values[start];\n        values[start] = values[__];\n        values[minIndex] = temp;\n    }\n}' },
    },
    tests: [
      { name: 'sorts mixed values', expected: '{11, 12, 22, 25, 64}', hidden: false },
      { name: 'sorts duplicates', expected: '{1, 2, 2}', hidden: false },
      { name: 'keeps sorted input', expected: 'unchanged', hidden: false },
      { name: 'handles two values', expected: 'ok', hidden: false },
      { name: 'hidden: negative values', expected: 'ok', hidden: true },
      { name: 'hidden: empty array does not crash', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /void\s+selectionSort\s*\(\s*int\s+\w+\s*\[\]\s*,\s*int\s+\w+\s*\)/,
      definitionRaw: "undefined reference to 'selectionSort(int*, int)'",
      definitionCls: 'undefined-selection-sort',
      key: /minIndex[\s\S]*for\s*\([\s\S]*values\s*\[\s*\w+\s*\]\s*<\s*values\s*\[\s*minIndex\s*\][\s\S]*(int\s+temp|swap\s*\(|std::swap)/,
      keyRaw: 'minimum index is not selected before swapping [-Wunused-value]',
      keyCls: 'selection-sort-no-min',
      keySeverity: 'warning',
      keyAnchor: /minIndex|for\s*\(|values\s*\[/,
      explanation:
        'Selection sort has to remember the smallest index in the unsorted suffix and swap it into the current position. Without that selected minimum, the pass does not place a known value.',
    },
    kcIds: ['array-pointer-basics', 'complexity-reasoning'],
    demo: {
      code: {
        partial: `void selectionSort(int values[], int n) {
    for (int start = 0; start < n - 1; start++) {
        int minIndex = start;
        for (int i = start + 1; i < n; i++) {
            // find the smallest remaining value
        }
    }
}
`,
        struggling: `void selectionSort(int values[], int n) {
    for (int start = 0; start < n - 1; start++) {
        int minIndex = start;
        for (int i = start + 1; i < n; i++) {
            if (values[i] < values[minIndex]) {
                minIndex = i;
            }
        }
        values[start] = values[minIndex];
    }
}
`,
        full: `void selectionSort(int values[], int n) {
    for (int start = 0; start < n - 1; start++) {
        int minIndex = start;
        for (int i = start + 1; i < n; i++) {
            if (values[i] < values[minIndex]) {
                minIndex = i;
            }
        }
        int temp = values[start];
        values[start] = values[minIndex];
        values[minIndex] = temp;
    }
}
`,
      },
      queries: [
        { stage: 'empty', text: 'How is selection sort different from bubble sort?' },
        { stage: 'partial', text: 'I can scan the suffix. What should I remember while scanning?' },
        { stage: 'struggling', text: 'I overwrite the first value when I swap. What am I missing?' },
        { stage: 'full', text: 'Why is selection sort O(n squared) even with fewer swaps?' },
      ],
    },
  },
  {
    id: 'lab-05-q3',
    labId: 'lab-05',
    number: 3,
    title: 'Insertion sort',
    statement: `Sorting lab, task 3: write insertion sort for an integer array.

Build the sorted prefix one value at a time. Take the next value as the key, shift larger values one slot to the right, and insert the key into the gap that remains.

\`\`\`cpp
${ARRAY_SORT_NOTE.replace('sortName', 'insertionSort')}
\`\`\``,
    examples: [
      '{5, 2, 4, 6, 1, 3}  =>  {1, 2, 3, 4, 5, 6}',
      '{1, 2, 3}  =>  unchanged',
      '{9, 9, 4}  =>  {4, 9, 9}',
    ],
    constraints: ['Sort in place', 'Ascending order', 'Shift larger values before writing the key', 'No STL sort'],
    starter: `void insertionSort(int values[], int n) {
    // Insert each value into the sorted prefix.
}
`,
    solution: `void insertionSort(int values[], int n) {
    for (int i = 1; i < n; i++) {
        int key = values[i];
        int j = i - 1;
        while (j >= 0 && values[j] > key) {
            values[j + 1] = values[j];
            j--;
        }
        values[j + 1] = key;
    }
}`,
    hints: {
      0: { text: 'Insertion sort keeps everything before the current index sorted. Where should the current value go inside that prefix?' },
      1: { text: 'If you overwrite values[i] too early, you lose the key you are trying to insert. Store it first, then shift larger values to the right.', anchor: /key|while|values\s*\[/ },
      2: { text: 'Start at index 1. Save values[i] as key, walk j left through the sorted prefix while values[j] is larger than key, shift each larger value right, then write key into values[j + 1].' },
      3: { text: 'Here is the shape with the shift condition and insertion slot left blank.', pseudocode: 'insertionSort(values, n):\n    for i from 1 to n - 1:\n        key = values[i]\n        j = i - 1\n        while j >= 0 and values[j] [__] key:\n            values[j + 1] = values[j]\n            j = j - 1\n        values[__] = key' },
      4: { text: 'The while comparison and final key placement are missing.', pseudocode: 'void insertionSort(int values[], int n) {\n    for (int i = 1; i < n; i++) {\n        int key = values[i];\n        int j = i - 1;\n        while (j >= 0 && values[j] [__] key) {\n            values[j + 1] = values[j];\n            j--;\n        }\n        values[__] = key;\n    }\n}' },
    },
    tests: [
      { name: 'sorts mixed values', expected: '{1, 2, 3, 4, 5, 6}', hidden: false },
      { name: 'keeps sorted input', expected: 'unchanged', hidden: false },
      { name: 'sorts duplicates', expected: '{4, 9, 9}', hidden: false },
      { name: 'handles two values', expected: 'ok', hidden: false },
      { name: 'hidden: negative values', expected: 'ok', hidden: true },
      { name: 'hidden: empty array does not crash', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /void\s+insertionSort\s*\(\s*int\s+\w+\s*\[\]\s*,\s*int\s+\w+\s*\)/,
      definitionRaw: "undefined reference to 'insertionSort(int*, int)'",
      definitionCls: 'undefined-insertion-sort',
      key: /int\s+key[\s\S]*while\s*\([\s\S]*values\s*\[\s*j\s*\]\s*>\s*key[\s\S]*values\s*\[\s*j\s*\+\s*1\s*\]\s*=\s*values\s*\[\s*j\s*\][\s\S]*values\s*\[\s*j\s*\+\s*1\s*\]\s*=\s*key/,
      keyRaw: 'key is not inserted after shifting larger values [-Wunused-value]',
      keyCls: 'insertion-sort-no-shift',
      keySeverity: 'warning',
      keyAnchor: /while\s*\(|key|values\s*\[/,
      explanation:
        'Insertion sort needs to save the current key, shift larger prefix values one slot to the right, and then place the key in the gap. Without that shift-and-insert step, the sorted prefix is not maintained.',
    },
    kcIds: ['array-pointer-basics', 'complexity-reasoning'],
    demo: {
      code: {
        partial: `void insertionSort(int values[], int n) {
    for (int i = 1; i < n; i++) {
        int key = values[i];
        int j = i - 1;
        // shift larger values here
    }
}
`,
        struggling: `void insertionSort(int values[], int n) {
    for (int i = 1; i < n; i++) {
        int key = values[i];
        int j = i - 1;
        while (j >= 0 && values[j] > key) {
            values[j + 1] = values[j];
            j--;
        }
        values[i] = key;
    }
}
`,
        full: `void insertionSort(int values[], int n) {
    for (int i = 1; i < n; i++) {
        int key = values[i];
        int j = i - 1;
        while (j >= 0 && values[j] > key) {
            values[j + 1] = values[j];
            j--;
        }
        values[j + 1] = key;
    }
}
`,
      },
      queries: [
        { stage: 'empty', text: 'What does the sorted prefix mean in insertion sort?' },
        { stage: 'partial', text: 'I saved the key. How do I move larger values out of the way?' },
        { stage: 'struggling', text: 'I shift values, but the key goes back into the wrong place.' },
        { stage: 'full', text: 'When is insertion sort faster than the other two simple sorts?' },
      ],
    },
  },
]

// Every other lab is one question, built from its labContent entry so the rest of
// the app never has to special-case a lab that was not broken into parts.
function singleQuestion(labId: string, title: string, statement: string, starter: string): LabQuestion {
  const content = labContent[labId]
  return {
    id: `${labId}-q1`,
    labId,
    number: 1,
    title,
    statement,
    examples: content?.examples ?? [],
    constraints: content?.constraints ?? [],
    starter,
    solution: content?.solution ?? '',
    hints: content?.hints ?? ({} as LabQuestion['hints']),
    tests: content?.tests ?? [],
    checks: content?.checks as LabChecks,
    kcIds: content?.kcIds ?? [],
    demo: {
      code: { partial: starter, struggling: starter, full: content?.solution ?? starter },
      queries: [
        { stage: 'empty', text: 'Where should I start on this one?' },
        { stage: 'partial', text: 'I have part of it. What is the case I am missing?' },
        { stage: 'struggling', text: 'My tests still fail. What am I misreading?' },
        { stage: 'full', text: 'What is the cost of this solution?' },
      ],
    },
  }
}

export const labQuestions: Record<string, LabQuestion[]> = {
  'lab-05': lab05,
}

export function questionsForLab(lab: { id: string; title: string; statement: string; starterCode: string }): LabQuestion[] {
  const designed = labQuestions[lab.id]
  if (designed) return designed
  return [singleQuestion(lab.id, lab.title, lab.statement, lab.starterCode)]
}

export function questionById(questionId: string): LabQuestion | undefined {
  for (const list of Object.values(labQuestions)) {
    const found = list.find((question) => question.id === questionId)
    if (found) return found
  }
  return undefined
}
