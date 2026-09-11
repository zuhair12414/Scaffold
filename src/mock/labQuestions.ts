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

const NODE_NOTE = 'struct Node { int value; Node* left; Node* right; };'

const lab05: LabQuestion[] = [
  {
    id: 'lab-05-q1',
    labId: 'lab-05',
    number: 1,
    title: 'Find the in-order successor',
    statement: `Every deletion in a binary search tree eventually needs the same helper, so write it first.

Given a node that **has a right subtree**, return the node holding the next larger key in the whole tree — its in-order successor. Do not modify the tree.

\`\`\`cpp
${NODE_NOTE}
\`\`\``,
    examples: [
      'tree {8, 3, 10, 9, 14}, successor(8)  =>  node 9',
      'tree {5, 2, 9, 7}, successor(5)  =>  node 7',
      'successor of a node whose right child is a leaf  =>  that child',
    ],
    constraints: ['node->right is guaranteed non-null', 'Do not modify any pointer', 'Iterative or recursive, both accepted'],
    starter: `Node* successor(Node* node) {
    // node->right is guaranteed to exist.
    return node;
}
`,
    solution: `Node* successor(Node* node) {
    Node* current = node->right;
    while (current->left != nullptr) {
        current = current->left;
    }
    return current;
}`,
    hints: {
      0: { text: 'The successor is the smallest key that is still larger than this node. Which subtree holds every key larger than this one, and where inside that subtree do the small keys live?' },
      1: { text: 'You are returning the node you were given, so nothing moves. The answer is never the node itself: it is somewhere inside the right subtree.', anchor: /return\s+node/ },
      2: { text: 'Step right once — now every key you can see is larger than the original. The smallest of those is as far left as you can go from there. Walk left while a left child exists, and stop at the node that has none.' },
      3: { text: 'Here is the shape with the walk left blank.', pseudocode: 'successor(node):\n    current = node.[__]\n    while current.[__] is not null:\n        current = current.[__]\n    return current' },
      4: { text: 'One step and one loop condition are missing.', pseudocode: 'Node* successor(Node* node) {\n    Node* current = node->[__];\n    while (current->[__] != nullptr) {\n        current = current->left;\n    }\n    return current;\n}' },
    },
    tests: [
      { name: 'successor of the root', expected: 'node 9', hidden: false },
      { name: 'right child is a leaf', expected: 'that child', hidden: false },
      { name: 'deep left spine in the right subtree', expected: 'leftmost node', hidden: false },
      { name: 'tree is unchanged afterwards', expected: 'ok', hidden: false },
      { name: 'hidden: two-level right subtree', expected: 'ok', hidden: true },
      { name: 'hidden: no left children at all', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /Node\s*\*\s*successor\s*\(/,
      definitionRaw: "undefined reference to 'successor(Node*)'",
      definitionCls: 'undefined-successor',
      key: /while\s*\(\s*\w+\s*->\s*left|for\s*\(.*->\s*left/,
      keyRaw: 'function returns its argument unchanged [-Wunused-parameter]',
      keyCls: 'successor-no-walk',
      keySeverity: 'warning',
      keyAnchor: /return\s+node|->\s*right/,
      explanation:
        'Nothing walks down the right subtree, so the function hands back the node it was given. Step right once, then keep going left while a left child exists.',
    },
    kcIds: ['in-order-successor', 'bst-invariants'],
    demo: {
      code: {
        partial: `Node* successor(Node* node) {
    Node* current = node->right;
    // now find the smallest key in here
    return current;
}
`,
        struggling: `Node* successor(Node* node) {
    Node* current = node->right;
    while (current->right != nullptr) {
        current = current->right;
    }
    return current;
}
`,
        full: `Node* successor(Node* node) {
    Node* current = node->right;
    while (current->left != nullptr) {
        current = current->left;
    }
    return current;
}
`,
      },
      queries: [
        { stage: 'empty', text: 'What does in-order successor actually mean?' },
        { stage: 'partial', text: 'I stepped right. How do I find the smallest node from here?' },
        { stage: 'struggling', text: 'My tests say I return the largest node, not the next one. Why?' },
        { stage: 'full', text: 'Is this O(h)? What happens if the tree is a straight line?' },
      ],
    },
  },
  {
    id: 'lab-05-q2',
    labId: 'lab-05',
    number: 2,
    title: 'Delete a leaf or a one-child node',
    statement: `Now remove a key, but only in the two easy shapes.

Write \`erase\` so that it handles a node with **no children** and a node with **exactly one child**. Return the subtree that should stand in the deleted node's place, and free the removed node exactly once. If the key is not present, the tree is unchanged.

Leave the two-children case for question 3 — returning the node unchanged there is fine for now.`,
    examples: [
      'erase a leaf  =>  parent link becomes null',
      'erase a node with only a right child  =>  that child takes its place',
      'erase a key that is absent  =>  tree unchanged',
    ],
    constraints: ['Recursive descent, no explicit stack', 'delete the removed node exactly once', 'Ordering must still hold afterwards'],
    starter: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        // this is the node to remove
    }
    return root;
}
`,
    solution: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) {
            Node* right = root->right;
            delete root;
            return right;
        }
        if (root->right == nullptr) {
            Node* left = root->left;
            delete root;
            return left;
        }
    }
    return root;
}`,
    hints: {
      0: { text: 'When you find the node, ask what should be standing in its place once it is gone. For a leaf and for a node with one child, the answer is short — and it is not the node itself.' },
      1: { text: 'The function always returns root, so the node is found and then kept. Whatever replaces it has to be returned so the parent can link to it.', anchor: /return\s+root/ },
      2: { text: 'A leaf is replaced by nothing at all, which is the same as being replaced by its missing child. A node with one child is replaced by that child. Notice that those are the same sentence, so one check per side handles both — and the node is freed after you have taken hold of the child.' },
      3: { text: 'Here is the shape of the match branch, with the two replacements blank.', pseudocode: 'if key matches:\n    if root.left is null:\n        keep = root.[__]\n        delete root\n        return [__]\n    if root.right is null:\n        keep = root.[__]\n        delete root\n        return [__]' },
      4: { text: 'Both replacement branches are missing their child.', pseudocode: 'if (root->left == nullptr) {\n    Node* right = root->[__];\n    delete root;\n    return [__];\n}\nif (root->right == nullptr) {\n    Node* left = root->[__];\n    delete root;\n    return [__];\n}' },
    },
    tests: [
      { name: 'erase a leaf', expected: 'ok', hidden: false },
      { name: 'erase a node with only a left child', expected: 'ok', hidden: false },
      { name: 'erase a node with only a right child', expected: 'ok', hidden: false },
      { name: 'erase an absent key', expected: 'unchanged', hidden: false },
      { name: 'hidden: erase the root when it is a leaf', expected: 'ok', hidden: true },
      { name: 'hidden: no node is freed twice', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /Node\s*\*\s*erase\s*\(/,
      definitionRaw: "undefined reference to 'erase(Node*, int)'",
      definitionCls: 'undefined-erase',
      key: /delete\s+root/,
      keyRaw: 'matched node is never unlinked or freed [-Wunused-value]',
      keyCls: 'erase-no-unlink',
      keySeverity: 'warning',
      keyAnchor: /else\s*\{|return\s+root/,
      explanation:
        'The match branch finds the node and then leaves it in place, so the key stays in the tree and the memory is never released. The branch has to return the child that replaces the node, after freeing it.',
    },
    kcIds: ['bst-invariants', 'pointer-reassignment-free'],
    demo: {
      code: {
        partial: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) {
            return root->right;
        }
        // one child on the other side still to do
    }
    return root;
}
`,
        struggling: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        delete root;
        return root;
    }
    return root;
}
`,
        full: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) {
            Node* right = root->right;
            delete root;
            return right;
        }
        if (root->right == nullptr) {
            Node* left = root->left;
            delete root;
            return left;
        }
    }
    return root;
}
`,
      },
      queries: [
        { stage: 'empty', text: 'What should the function return when it finds the node?' },
        { stage: 'partial', text: 'I handled the missing left child. Is the other side the same idea?' },
        { stage: 'struggling', text: 'I delete root and then return it. My tests crash — what did I break?' },
        { stage: 'full', text: 'Why does the parent have to store what erase returns?' },
      ],
    },
  },
  {
    id: 'lab-05-q3',
    labId: 'lab-05',
    number: 3,
    title: 'Delete a node with two children',
    statement: `Finish \`erase\` for the case that is actually hard.

When the node has **two children**, neither subtree can take its place directly. Use the helper from question 1: copy the in-order successor's value into the node, then erase that successor from the right subtree.

The tree must satisfy the BST ordering after every deletion, and every node must be freed exactly once.`,
    examples: [
      'erase the root of {8, 3, 10, 9, 14}  =>  9 takes its place',
      'successor is the right child itself  =>  right child takes its place',
      'erase repeatedly until empty  =>  ordering holds throughout',
    ],
    constraints: ['Reuse the successor walk from question 1', 'Erase the successor from the right subtree, not the whole tree', 'No node is freed twice'],
    starter: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) {
            Node* right = root->right;
            delete root;
            return right;
        }
        if (root->right == nullptr) {
            Node* left = root->left;
            delete root;
            return left;
        }
        // two children: the hard case
    }
    return root;
}
`,
    solution: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) {
            Node* right = root->right;
            delete root;
            return right;
        }
        if (root->right == nullptr) {
            Node* left = root->left;
            delete root;
            return left;
        }
        Node* next = root->right;
        while (next->left != nullptr) {
            next = next->left;
        }
        root->value = next->value;
        root->right = erase(root->right, next->value);
    }
    return root;
}`,
    hints: {
      0: { text: 'You cannot promote either child without orphaning the other. So do not move a node at all — move a value. Which single value can sit here and keep every key on the correct side?' },
      1: { text: 'Two values would keep the ordering: the largest on the left, or the smallest on the right. You already wrote the walk that finds the second one in question 1.', anchor: /two children|else\s*\{/ },
      2: { text: 'Copy the successor\'s value into this node. The node now holds the right key but the successor is duplicated, so remove it — and remove it from the right subtree, because that is the only place it can be. It has at most one child, so the case you already solved handles it.' },
      3: { text: 'Here is the two-child branch with the walk and the recursive erase left blank.', pseudocode: 'next = root.[__]\nwhile next.[__] is not null:\n    next = next.left\nroot.value = next.value\nroot.right = erase(root.[__], next.value)' },
      4: { text: 'The successor walk and the follow-up erase are missing.', pseudocode: 'Node* next = root->[__];\nwhile (next->[__] != nullptr) {\n    next = next->left;\n}\nroot->value = next->value;\nroot->right = erase(root->right, [__]);' },
    },
    tests: [
      { name: 'erase a node with two children', expected: 'ok', hidden: false },
      { name: 'successor is the right child', expected: 'ok', hidden: false },
      { name: 'ordering holds after erase', expected: 'ok', hidden: false },
      { name: 'erase the root repeatedly', expected: 'ok', hidden: false },
      { name: 'hidden: successor deep on the left spine', expected: 'ok', hidden: true },
      { name: 'hidden: no node freed twice', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /Node\s*\*\s*erase\s*\(/,
      definitionRaw: "undefined reference to 'erase(Node*, int)'",
      definitionCls: 'undefined-erase',
      key: /while\s*\(\s*\w+\s*->\s*left/,
      keyRaw: 'two-child case leaves the key in the tree [-Wunused-parameter]',
      keyCls: 'erase-no-successor',
      keySeverity: 'warning',
      keyAnchor: /two children|return\s+root/,
      explanation:
        'Nothing looks for the in-order successor, so a node with two children is found and then left alone. Copy the smallest value from the right subtree into this node, then erase that value from the right subtree.',
    },
    kcIds: ['in-order-successor', 'bst-invariants', 'pointer-reassignment-free'],
    demo: {
      code: {
        partial: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) { Node* right = root->right; delete root; return right; }
        if (root->right == nullptr) { Node* left = root->left; delete root; return left; }
        Node* next = root->right;
        // walk to the smallest node in here
        root->value = next->value;
    }
    return root;
}
`,
        struggling: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) { Node* right = root->right; delete root; return right; }
        if (root->right == nullptr) { Node* left = root->left; delete root; return left; }
        Node* next = root->right;
        root->value = next->value;
        delete next;
        root->right = nullptr;
    }
    return root;
}
`,
        full: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) { Node* right = root->right; delete root; return right; }
        if (root->right == nullptr) { Node* left = root->left; delete root; return left; }
        Node* next = root->right;
        while (next->left != nullptr) {
            next = next->left;
        }
        root->value = next->value;
        root->right = erase(root->right, next->value);
    }
    return root;
}
`,
      },
      queries: [
        { stage: 'empty', text: 'Both children exist. Which one should take the place of the node?' },
        { stage: 'partial', text: 'I have the right child. How do I get to the successor from there?' },
        { stage: 'struggling', text: 'I copied the value and deleted the successor, but now I lose the rest of the right subtree.' },
        { stage: 'full', text: 'Why erase from the right subtree instead of from the root?' },
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
