import type {
  HintAuditEvent,
  KnowledgeComponent,
  KnowledgeComponentId,
  Lab,
  ManualMeta,
  MasteryPoint,
  MasteryTrace,
  MockDataset,
  SessionEvent,
  SessionEventKind,
  Student,
  Submission,
  SubmissionStatus,
} from '../types'

const SEED = 2303024
const GENERATED_AT = '2026-09-11T09:00:00.000+05:00'

class RandomSource {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0
    return this.state / 4294967296
  }

  between(min: number, max: number) {
    return min + (max - min) * this.next()
  }

  int(min: number, max: number) {
    return Math.floor(this.between(min, max + 1))
  }

  pick<T>(items: readonly T[]) {
    return items[this.int(0, items.length - 1)]
  }
}

export const knowledgeComponents: KnowledgeComponent[] = [
  { id: 'array-pointer-basics', name: 'array & pointer basics', shortName: 'arrays' },
  { id: 'linked-list-traversal', name: 'linked-list traversal', shortName: 'list walk' },
  { id: 'recursion-base-case', name: 'recursion base case', shortName: 'base case' },
  { id: 'bst-invariants', name: 'BST invariants', shortName: 'BST rules' },
  { id: 'in-order-successor', name: 'in-order successor', shortName: 'successor' },
  { id: 'pointer-reassignment-free', name: 'pointer reassignment & free', shortName: 'pointer free' },
  { id: 'iterator-invalidation', name: 'iterator invalidation', shortName: 'iterators' },
  { id: 'complexity-reasoning', name: 'complexity reasoning', shortName: 'complexity' },
]

const labsBase: Omit<Lab, 'manualIds'>[] = [
  {
    id: 'lab-01',
    number: 1,
    title: 'Array-backed stack',
    status: 'closed',
    dueAt: '2026-09-16T17:00:00.000+05:00',
    kcIds: ['array-pointer-basics', 'complexity-reasoning'],
    statement: 'Implement a bounded stack using a dynamic array and report the cost of push and pop.',
    starterCode: 'class Stack {\npublic:\n    void push(int value);\n    int pop();\n};\n',
  },
  {
    id: 'lab-02',
    number: 2,
    title: 'Linked-list insert and search',
    status: 'closed',
    dueAt: '2026-09-23T17:00:00.000+05:00',
    kcIds: ['array-pointer-basics', 'linked-list-traversal', 'pointer-reassignment-free'],
    statement: 'Build a singly linked list with insert, search and clear operations.',
    starterCode: 'struct Node { int value; Node* next; };\nclass List {\n    Node* head = nullptr;\n};\n',
  },
  {
    id: 'lab-03',
    number: 3,
    title: 'Recursive list length',
    status: 'closed',
    dueAt: '2026-09-30T17:00:00.000+05:00',
    kcIds: ['linked-list-traversal', 'recursion-base-case'],
    statement: 'Write a recursive function that returns the length of a list without using a loop.',
    starterCode: 'int length(Node* node) {\n    return 1 + length(node->next);\n}\n',
  },
  {
    id: 'lab-04',
    number: 4,
    title: 'BST search and insert',
    status: 'closed',
    dueAt: '2026-10-07T17:00:00.000+05:00',
    kcIds: ['recursion-base-case', 'bst-invariants', 'complexity-reasoning'],
    statement: 'Implement recursive search and insert for a binary search tree.',
    starterCode: 'Node* insert(Node* root, int value) {\n    return root;\n}\n',
  },
  {
    id: 'lab-05',
    number: 5,
    title: 'BST delete',
    status: 'open',
    dueAt: '2026-10-14T17:00:00.000+05:00',
    kcIds: ['bst-invariants', 'in-order-successor', 'pointer-reassignment-free'],
    statement: 'Delete a key from a BST, including the two-children case, while preserving ordering.',
    starterCode: 'Node* erase(Node* root, int key) {\n    return root;\n}\n',
  },
  {
    id: 'lab-06',
    number: 6,
    title: 'Iterator-safe removals',
    status: 'draft',
    dueAt: '2026-10-21T17:00:00.000+05:00',
    kcIds: ['iterator-invalidation', 'pointer-reassignment-free', 'complexity-reasoning'],
    statement: 'Remove matching values from a container without invalidating the next step of traversal.',
    starterCode: 'void removeMatches(vector<int>& values, int target) {\n}\n',
  },
]

const BST_REFERENCE = `# Deleting from a binary search tree

Course reference, CS2 Data Structures. Attached to Lab 5 by the instructor.

## The three shapes

A node you are asked to remove is one of three shapes, and only the third is hard.

- **A leaf.** Nothing depends on it. The parent link becomes null.
- **One child.** The child takes the node's place. The ordering still holds,
  because everything in that subtree was already on the correct side.
- **Two children.** Neither child can take the place directly: whichever you
  choose, the other subtree has nowhere to hang.

## Why the successor

For the two-child case you need a value that is larger than everything in the
left subtree and smaller than everything in the right subtree. Exactly two values
qualify: the largest value in the left subtree, and the smallest in the right.
The smallest in the right subtree is the **in-order successor**, and it is found
by taking one step right and then walking left until you cannot.

That node has at most one child, by construction — nothing is smaller than it in
that subtree — so removing it is one of the two easy cases.

## The order of operations

1. Find the node. If the key is smaller, descend left; if larger, descend right.
2. If it has fewer than two children, hand back the child that survives.
3. Otherwise copy the successor's value into the node.
4. Delete the successor from the right subtree, not from the whole tree.

Copying the value before removing the successor is what keeps the tree ordered
at every step. Removing first leaves a hole with two orphaned subtrees.

## What usually goes wrong

- Returning the node instead of its replacement, so nothing is ever unlinked.
- Freeing a node that is still reachable from its parent.
- Searching for the successor in the whole tree instead of the right subtree.
- Forgetting that erasing the root changes what the caller must hold.

## Complexity

Every step moves one level down, so the work is proportional to the height of the
tree: O(h). For a balanced tree that is O(log n); for a tree built from sorted
input it degrades to O(n).
`

const manuals: ManualMeta[] = [
  {
    id: 'manual-lab-05-bst',
    labId: 'lab-05',
    name: 'bst-delete-reference.md',
    sizeBytes: BST_REFERENCE.length,
    type: 'md',
    uploadedAt: '2026-10-09T11:30:00.000+05:00',
    content: BST_REFERENCE,
  },
]

const divergentStudentIds = new Set(['student-04', 'student-09', 'student-16', 'student-23', 'student-31', 'student-42'])

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function rounded(n: number, digits = 2) {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

function minutesAfter(date: string, min: number) {
  return new Date(new Date(date).getTime() + min * 60_000).toISOString()
}

function labStart(lab: Lab) {
  return new Date(new Date(lab.dueAt).getTime() - 95 * 60_000).toISOString()
}

function createStudents(random: RandomSource): Student[] {
  const statuses: Student['status'][] = ['active', 'reviewing', 'offline', 'struggling']
  return Array.from({ length: 47 }, (_, i) => {
    const n = i + 1
    const id = `student-${pad(n)}`
    const status = divergentStudentIds.has(id) ? 'struggling' : random.pick(statuses)
    return {
      id,
      displayName: `Student #${pad(n)}`,
      section: 'CS2-B',
      status,
      divergent: divergentStudentIds.has(id),
    }
  })
}

function createLabs(): Lab[] {
  return labsBase.map((lab) => ({
    ...lab,
    manualIds: manuals.filter((manual) => manual.labId === lab.id).map((manual) => manual.id),
  }))
}

function createSubmissionCode(lab: Lab, compileOk: boolean, passed: boolean) {
  if (!compileOk) return `${lab.starterCode}\n// work in progress: missing pointer update\n`
  if (!passed) return `${lab.starterCode}\n// runs, but one edge case still needs attention\n`
  return `${lab.starterCode}\n// tests pass in the mock runner\n`
}

function createSubmissions(students: Student[], labs: Lab[], random: RandomSource): Submission[] {
  const rows: Submission[] = []
  for (const student of students) {
    for (const lab of labs) {
      if (lab.status === 'draft') continue
      const divergentLate = student.divergent && lab.number >= 5
      const compileOk = divergentLate || random.next() > 0.12
      const passed = compileOk && (divergentLate || random.next() > 0.28)
      const testsPassed = passed ? 6 : compileOk ? random.int(2, 5) : 0
      const testsFailed = 6 - testsPassed
      const status: SubmissionStatus = passed ? 'passed' : compileOk ? 'tests_failing' : 'compile_issue'
      rows.push({
        id: `${student.id}-${lab.id}-sub-01`,
        studentId: student.id,
        labId: lab.id,
        timestamp: minutesAfter(labStart(lab), random.int(42, 88)),
        code: createSubmissionCode(lab, compileOk, passed),
        compileOk,
        testsPassed,
        testsFailed,
        timeOnTaskMin: divergentLate ? random.int(8, 16) : random.int(24, 92),
        status,
      })
    }
  }
  return rows
}

function event(
  studentId: string,
  lab: Lab,
  kind: SessionEventKind,
  minute: number,
  label: string,
  detail: string,
  durationSec?: number,
): SessionEvent {
  return {
    id: `${studentId}-${lab.id}-${kind}-${minute}`,
    studentId,
    labId: lab.id,
    kind,
    at: minutesAfter(labStart(lab), minute),
    durationSec,
    label,
    detail,
  }
}

function createSessionEvents(students: Student[], labs: Lab[], random: RandomSource): SessionEvent[] {
  const rows: SessionEvent[] = []
  for (const student of students) {
    for (const lab of labs) {
      if (lab.status === 'draft') continue
      const divergentLate = student.divergent && lab.number >= 5
      rows.push(event(student.id, lab, 'edit_burst', 4, 'Edit burst', 'Started from the lab starter code.', random.int(180, 420)))
      if (divergentLate) rows.push(event(student.id, lab, 'paste', 11, 'Paste', 'Large paste recorded as a hashed payload.', 4))
      rows.push(event(student.id, lab, 'compile', divergentLate ? 15 : 28, 'Compile', divergentLate ? 'Compiled after a short edit window.' : 'Compile after local edits.'))
      rows.push(event(student.id, lab, 'run', divergentLate ? 17 : 34, 'Run tests', divergentLate ? 'Tests passed quickly after compile.' : 'Mixed tests before revision.'))
      if (!divergentLate && random.next() > 0.45) rows.push(event(student.id, lab, 'idle', 42, 'Idle gap', 'No editor activity for this interval.', random.int(260, 780)))
      rows.push(event(student.id, lab, 'hint_shown', divergentLate ? 20 : 49, 'Hint shown', divergentLate ? 'Hint held to a lower disclosure level.' : 'Conceptual hint shown.'))
      if (!divergentLate) rows.push(event(student.id, lab, 'edit_burst', 58, 'Edit burst', 'Revised after feedback.', random.int(240, 600)))
    }
  }
  return rows
}

function hintText(level: number) {
  if (level <= 1) return 'Check which concept controls when the operation should stop.'
  if (level === 2) return 'State the case in words first, then map it to the branch in your own code.'
  return 'The requested response was reduced to protect the lab objective.'
}

function createHintAudit(students: Student[], labs: Lab[], random: RandomSource): HintAuditEvent[] {
  const rows: HintAuditEvent[] = []
  for (const student of students) {
    for (const lab of labs) {
      if (lab.status === 'draft') continue
      const divergentLate = student.divergent && lab.number >= 5
      const level = divergentLate ? 2 : (random.int(0, 3) as 0 | 1 | 2 | 3)
      const blocked = divergentLate || random.next() > 0.86
      const similarity = blocked ? rounded(random.between(0.61, 0.78)) : rounded(random.between(0.18, 0.55))
      const threshold = 0.6
      rows.push({
        id: `${student.id}-${lab.id}-hint-01`,
        studentId: student.id,
        labId: lab.id,
        timestamp: minutesAfter(labStart(lab), divergentLate ? 20 : random.int(44, 67)),
        level,
        blocked,
        similarity,
        threshold,
        reason: blocked ? `similarity ${similarity.toFixed(2)} > ${threshold.toFixed(2)}` : 'within lab disclosure policy',
        promptContextSummary: `${lab.title}: ${lab.kcIds.map((id) => knowledgeComponents.find((kc) => kc.id === id)?.shortName).join(', ')}`,
        shownText: blocked ? 'A smaller conceptual hint was shown instead.' : hintText(level),
        withheldText: blocked ? 'A code-shaped answer with the missing branch was withheld.' : undefined,
      })
    }
  }
  return rows
}

function createMasteryPoints(base: number, lab: Lab, random: RandomSource, divergent: boolean) {
  const growth = lab.number * random.between(0.02, 0.055)
  const correctnessLift = divergent && lab.number >= 5 ? 0.34 + random.between(0, 0.08) : 0
  const adjustedHold = divergent && lab.number >= 5 ? -0.08 - random.between(0, 0.05) : 0
  const correctnessValue = clamp01(base + growth + correctnessLift + random.between(-0.04, 0.04))
  const adjustedValue = clamp01(base + growth + adjustedHold + random.between(-0.04, 0.04))
  const band = divergent && lab.number >= 5 ? random.between(0.14, 0.22) : random.between(0.07, 0.15)
  const point = (value: number): MasteryPoint => ({
    labId: lab.id,
    value: rounded(value),
    uncertaintyLow: rounded(clamp01(value - band)),
    uncertaintyHigh: rounded(clamp01(value + band)),
  })
  return {
    correctnessOnly: point(correctnessValue),
    telemetryAdjusted: point(adjustedValue),
  }
}

function createMasteryTraces(students: Student[], labs: Lab[], random: RandomSource): MasteryTrace[] {
  const rows: MasteryTrace[] = []
  for (const student of students) {
    // One ability offset per student, reused across concepts: a section has students
    // who are behind on most things, not students who are random per concept.
    const ability = random.between(-0.2, 0.2)
    for (const kc of knowledgeComponents) {
      const base = clamp01(random.between(0.14, 0.4) + ability)
      const correctnessOnly: MasteryPoint[] = []
      const telemetryAdjusted: MasteryPoint[] = []
      for (const lab of labs) {
        const exercised = lab.kcIds.includes(kc.id as KnowledgeComponentId)
        const offset = exercised ? 0.05 : 0
        const points = createMasteryPoints(base + offset, lab, random, student.divergent)
        correctnessOnly.push(points.correctnessOnly)
        telemetryAdjusted.push(points.telemetryAdjusted)
      }
      rows.push({ studentId: student.id, kcId: kc.id, correctnessOnly, telemetryAdjusted })
    }
  }
  return rows
}

function buildMockDataset(): MockDataset {
  const random = new RandomSource(SEED)
  const labs = createLabs()
  const students = createStudents(random)
  return {
    seed: SEED,
    generatedAt: GENERATED_AT,
    knowledgeComponents,
    labs,
    manuals,
    students,
    submissions: createSubmissions(students, labs, random),
    sessionEvents: createSessionEvents(students, labs, random),
    hintAudit: createHintAudit(students, labs, random),
    masteryTraces: createMasteryTraces(students, labs, random),
  }
}

export const mockData = buildMockDataset()

const latencyRandom = new RandomSource(SEED + 1)

export function mockDelay() {
  return latencyRandom.int(200, 600)
}

export function getMockDataset() {
  return new Promise<MockDataset>((resolve) => {
    window.setTimeout(() => resolve(mockData), mockDelay())
  })
}
