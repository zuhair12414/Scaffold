// Every seeded lab is a real lab: its own examples, constraints, hint ladder,
// reference solution (guardrail comparator only) and mock test set. Without this
// the student view borrowed one problem's ladder for every lab, so a BST lab
// answered with factorial hints.
import type { KnowledgeComponentId } from '../types'

export type LabHint = { text: string; pseudocode?: string; anchor?: RegExp }

export type LabTest = { name: string; expected: string; hidden: boolean }

export type LabChecks = {
  // Missing definition -> link error. Missing key construct -> the lab's own
  // diagnostic. Both present -> the tests pass. A deterministic stand-in for the
  // sandboxed compiler, one rule per lab.
  definition: RegExp
  definitionRaw: string
  definitionCls: string
  key: RegExp
  keyRaw: string
  keyCls: string
  keySeverity: 'error' | 'warning'
  keyAnchor?: RegExp
  explanation: string
}

export type LabContent = {
  examples: string[]
  constraints: string[]
  solution: string
  hints: Record<0 | 1 | 2 | 3 | 4, LabHint>
  tests: LabTest[]
  checks: LabChecks
  kcIds?: KnowledgeComponentId[]
}

export const labContent: Record<string, LabContent> = {
  'lab-01': {
    examples: ['push(4); push(9); pop()  =>  9', 'pop() on an empty stack  =>  -1', 'push beyond capacity  =>  rejected'],
    constraints: ['Fixed capacity, no resizing', 'push and pop are O(1)', 'No STL containers'],
    solution: `class Stack {
    int data[64];
    int top = 0;
public:
    bool push(int value) {
        if (top >= 64) return false;
        data[top] = value;
        top = top + 1;
        return true;
    }
    int pop() {
        if (top == 0) return -1;
        top = top - 1;
        return data[top];
    }
};`,
    hints: {
      0: { text: 'A stack only ever changes at one end. What single piece of state tells you where that end currently is?' },
      1: { text: 'Nothing in the class records how many values are stored, so push and pop cannot agree on where the top is. Add one integer that both of them read and write.', anchor: /class\s+Stack|int\s+data/ },
      2: { text: 'Keep an index that always points at the next free slot. push writes at that index and moves it up; pop moves it down first and then reads. Both must refuse to run past the ends: push when the index reaches capacity, pop when it is zero.' },
      3: { text: 'Here is the shape with the two guards left blank.', pseudocode: 'push(value):\n    if top is [__]: refuse\n    data[top] = value\n    top = top + 1\n\npop():\n    if top is [__]: return -1\n    top = top - 1\n    return data[top]' },
      4: { text: 'One bound and one empty check are missing.', pseudocode: 'bool push(int value) {\n    if (top >= [__]) return false;\n    data[top] = value;\n    top = top + 1;\n    return true;\n}\nint pop() {\n    if (top == [__]) return -1;\n    top = top - 1;\n    return data[top];\n}' },
    },
    tests: [
      { name: 'push then pop', expected: '9', hidden: false },
      { name: 'pop on empty', expected: '-1', hidden: false },
      { name: 'push at capacity', expected: 'rejected', hidden: false },
      { name: 'order is last in first out', expected: '4', hidden: false },
      { name: 'hidden: alternating push and pop', expected: 'ok', hidden: true },
      { name: 'hidden: capacity boundary', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /(void|bool)\s+push\s*\(|int\s+pop\s*\(/,
      definitionRaw: "undefined reference to 'Stack::push(int)'",
      definitionCls: 'undefined-stack-op',
      key: /top\s*(>=|==|<|>)\s*\w+/,
      keyRaw: 'array subscript is above array bounds [-Warray-bounds]',
      keyCls: 'stack-unbounded',
      keySeverity: 'warning',
      keyAnchor: /data\s*\[/,
      explanation:
        'Nothing stops the index from running past the end of the array, so push can write outside it and pop can read a slot that was never written. Both operations need a bound check before they touch the array.',
    },
  },

  'lab-02': {
    examples: ['insert(3); insert(7); search(7)  =>  true', 'search(2) on an empty list  =>  false', 'insert keeps the earlier values reachable'],
    constraints: ['Singly linked, one next pointer per node', 'insert may add at the head', 'Free every node in clear'],
    solution: `void insert(int value) {
    Node* node = new Node{value, head};
    head = node;
}
bool search(int value) {
    Node* current = head;
    while (current != nullptr) {
        if (current->value == value) return true;
        current = current->next;
    }
    return false;
}`,
    hints: {
      0: { text: 'A new node has to end up reachable from head, and every node that was already there has to stay reachable. Which pointer has to change, and what must it point at first?' },
      1: { text: 'Inserting at the head is two links, not one: the new node has to point at the old head before head is moved. Doing it the other way round loses the rest of the list.', anchor: /head/ },
      2: { text: 'Write the new node with its next already pointing at the current head, then move head onto the new node. For search, walk a cursor from head and stop when it falls off the end — that end is nullptr, and reading through it is what crashes.' },
      3: { text: 'Here is the shape with the two links left blank.', pseudocode: 'insert(value):\n    node = new Node\n    node.next = [__]\n    head = [__]\n\nsearch(value):\n    current = head\n    while current is not [__]:\n        if current.value == value: return true\n        current = current.next\n    return false' },
      4: { text: 'One link and one stop condition are missing.', pseudocode: 'void insert(int value) {\n    Node* node = new Node{value, [__]};\n    head = [__];\n}\nbool search(int value) {\n    Node* current = head;\n    while (current != [__]) {\n        if (current->value == value) return true;\n        current = current->next;\n    }\n    return false;\n}' },
    },
    tests: [
      { name: 'insert then search', expected: 'true', hidden: false },
      { name: 'search missing value', expected: 'false', hidden: false },
      { name: 'search on empty list', expected: 'false', hidden: false },
      { name: 'earlier values stay reachable', expected: 'true', hidden: false },
      { name: 'hidden: many inserts', expected: 'ok', hidden: true },
      { name: 'hidden: clear frees every node', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /void\s+insert\s*\(|bool\s+search\s*\(/,
      definitionRaw: "undefined reference to 'List::insert(int)'",
      definitionCls: 'undefined-list-op',
      key: /(->\s*next\s*=|next\s*\{|,\s*head\s*\})/,
      keyRaw: 'new node is never linked to the list [-Wunused-value]',
      keyCls: 'list-unlinked',
      keySeverity: 'warning',
      keyAnchor: /new\s+Node|head/,
      explanation:
        'The node is allocated but nothing points at it, or head is moved before the new node records what came after it. Either way the rest of the list stops being reachable and the memory leaks.',
    },
  },

  'lab-03': {
    examples: ['length(empty)  =>  0', 'length(one node)  =>  1', 'length(3 nodes)  =>  3'],
    constraints: ['No loops of any kind', 'One return per branch is fine', 'Must terminate on an empty list'],
    solution: `int length(Node* node) {
    if (node == nullptr) return 0;
    return 1 + length(node->next);
}`,
    hints: {
      0: { text: 'Every call to length makes another call to length. What should happen when there is no node left to count?' },
      1: { text: 'Your function has no stopping condition, so it walks off the end of the list and keeps going. A recursive function needs one case that returns a value without calling itself.', anchor: /return\s+1\s*\+\s*length|length\s*\(\s*node\s*->\s*next/ },
      2: { text: 'The empty list is the base case. A list with no nodes has length 0, and that is the one answer you can give without recursing. State it before the recursive line runs — what does node hold when the list has ended?' },
      3: { text: 'Here is the shape with the base case left blank.', pseudocode: 'length(node):\n    if node is [__]:\n        return [__]\n    return 1 + length(node.next)' },
      4: { text: 'One condition and one return value are missing.', pseudocode: 'int length(Node* node) {\n    if (node == [__]) return [__];\n    return 1 + length(node->next);\n}' },
    },
    tests: [
      { name: 'length of empty list', expected: '0', hidden: false },
      { name: 'length of one node', expected: '1', hidden: false },
      { name: 'length of three nodes', expected: '3', hidden: false },
      { name: 'does not modify the list', expected: 'ok', hidden: false },
      { name: 'hidden: long list', expected: 'ok', hidden: true },
      { name: 'hidden: no loop used', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /int\s+length\s*\(/,
      definitionRaw: "undefined reference to 'length(Node*)'",
      definitionCls: 'undefined-length',
      key: /if\s*\(\s*(node|!node|node\s*==)/,
      keyRaw: 'infinite recursion detected [-Winfinite-recursion]',
      keyCls: 'infinite-recursion-list',
      keySeverity: 'warning',
      keyAnchor: /return\s+1\s*\+\s*length/,
      explanation:
        'The compiler can prove that length always calls length again, so no call ever returns. A recursive function needs at least one path that returns a value without calling itself.',
    },
  },

  'lab-04': {
    examples: ['insert into an empty tree  =>  new root', 'search(5) in {3,5,8}  =>  found', 'insert keeps left < node < right'],
    constraints: ['Recursive, no explicit stack', 'Duplicates are ignored', 'search returns nullptr when absent'],
    solution: `Node* insert(Node* root, int value) {
    if (root == nullptr) return new Node{value, nullptr, nullptr};
    if (value < root->value) root->left = insert(root->left, value);
    else if (value > root->value) root->right = insert(root->right, value);
    return root;
}`,
    hints: {
      0: { text: 'Insert walks down until it reaches a place where the value is not there. What does the tree look like at that place, and what should the function hand back?' },
      1: { text: 'The function returns root unchanged, so nothing is ever added. Insert has to return the subtree it built, and the caller has to store what comes back.', anchor: /return\s+root/ },
      2: { text: 'Two things are missing. The empty spot is where the new node goes: when root is null, that is the answer. Otherwise compare against the current value to decide which side to descend, and assign the result of the recursive call back into that side.' },
      3: { text: 'Here is the shape with the empty case and the comparison left blank.', pseudocode: 'insert(root, value):\n    if root is [__]:\n        return [__]\n    if value [__] root.value:\n        root.left = insert(root.left, value)\n    else:\n        root.right = insert(root.right, value)\n    return root' },
      4: { text: 'The empty case and one comparison are missing.', pseudocode: 'Node* insert(Node* root, int value) {\n    if (root == [__]) return new Node{value, nullptr, nullptr};\n    if (value [__] root->value) root->left = insert(root->left, value);\n    else if (value > root->value) root->right = insert(root->right, value);\n    return root;\n}' },
    },
    tests: [
      { name: 'insert into empty tree', expected: 'root set', hidden: false },
      { name: 'search finds an inserted value', expected: 'found', hidden: false },
      { name: 'search misses an absent value', expected: 'nullptr', hidden: false },
      { name: 'ordering holds after inserts', expected: 'ok', hidden: false },
      { name: 'hidden: duplicate insert', expected: 'ok', hidden: true },
      { name: 'hidden: deep right spine', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /Node\s*\*\s*insert\s*\(/,
      definitionRaw: "undefined reference to 'insert(Node*, int)'",
      definitionCls: 'undefined-insert',
      key: /new\s+Node/,
      keyRaw: 'function always returns its argument unchanged [-Wunused-parameter]',
      keyCls: 'bst-no-insert',
      keySeverity: 'warning',
      keyAnchor: /return\s+root/,
      explanation:
        'Nothing in the function allocates a node or links one in, so every call hands back the tree it was given. Insert has to build the new node at the empty spot and return it up the chain.',
    },
  },

  'lab-05': {
    examples: ['erase a leaf  =>  parent link cleared', 'erase a node with one child  =>  child takes its place', 'erase a node with two children  =>  in-order successor takes its place'],
    constraints: ['Ordering must hold after every erase', 'Free the removed node exactly once', 'Recursive solution is fine'],
    solution: `Node* erase(Node* root, int key) {
    if (root == nullptr) return nullptr;
    if (key < root->value) root->left = erase(root->left, key);
    else if (key > root->value) root->right = erase(root->right, key);
    else {
        if (root->left == nullptr) { Node* right = root->right; delete root; return right; }
        if (root->right == nullptr) { Node* left = root->left; delete root; return left; }
        Node* successor = root->right;
        while (successor->left != nullptr) successor = successor->left;
        root->value = successor->value;
        root->right = erase(root->right, successor->value);
    }
    return root;
}`,
    hints: {
      0: { text: 'Three shapes of node can be deleted, and only one of them is hard. Which one leaves two subtrees that both still need a parent?' },
      1: { text: 'The function returns root without removing anything, so the key stays in the tree. Erase has to return whatever should stand in the deleted node\'s place — sometimes that is a child, sometimes it is the node itself.', anchor: /return\s+root/ },
      2: { text: 'A leaf is replaced by nothing, and a node with one child is replaced by that child. The two-child case cannot be replaced by either subtree, so it borrows a value that keeps the ordering: the smallest value in the right subtree. Copy that value up, then delete it from the right subtree instead.' },
      3: { text: 'Here is the shape with the successor walk left blank.', pseudocode: 'erase(root, key):\n    if key < root.value: root.left = erase(root.left, key)\n    else if key > root.value: root.right = erase(root.right, key)\n    else:\n        if one child is missing: return the other child\n        successor = root.[__]\n        while successor.[__] is not null: successor = successor.[__]\n        root.value = successor.value\n        root.right = erase(root.right, successor.value)\n    return root' },
      4: { text: 'The whole shape, with the successor walk left open.', pseudocode: 'Node* erase(Node* root, int key) {\n    if (key < root->value) root->left = erase(root->left, key);\n    else if (key > root->value) root->right = erase(root->right, key);\n    else {\n        if (root->left == nullptr) return root->right;\n        if (root->right == nullptr) return root->left;\n        Node* successor = root->[__];\n        while (successor->[__] != nullptr) successor = successor->[__];\n        root->value = successor->value;\n        root->right = erase(root->right, successor->value);\n    }\n    return root;\n}' },
    },
    tests: [
      { name: 'erase a leaf', expected: 'ok', hidden: false },
      { name: 'erase a node with one child', expected: 'ok', hidden: false },
      { name: 'erase a node with two children', expected: 'ok', hidden: false },
      { name: 'ordering holds after erase', expected: 'ok', hidden: false },
      { name: 'hidden: erase the root', expected: 'ok', hidden: true },
      { name: 'hidden: erase an absent key', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /Node\s*\*\s*erase\s*\(/,
      definitionRaw: "undefined reference to 'erase(Node*, int)'",
      definitionCls: 'undefined-erase',
      key: /while\s*\(\s*\w+\s*->\s*left|successor|->\s*left\s*!=\s*nullptr/,
      keyRaw: 'no node is ever unlinked or freed [-Wunused-parameter]',
      keyCls: 'bst-no-erase',
      keySeverity: 'warning',
      keyAnchor: /return\s+root/,
      explanation:
        'The key is never removed: the function returns the tree it was given. The two-child case is the one that needs the in-order successor — the smallest value in the right subtree — copied up before it is erased from below.',
    },
  },

  'lab-06': {
    examples: ['removeMatches({1,2,2,3}, 2)  =>  {1,3}', 'removing every element  =>  empty', 'removing nothing  =>  unchanged'],
    constraints: ['One pass over the container', 'No index arithmetic after an erase', 'The traversal must stay valid'],
    solution: `void removeMatches(vector<int>& values, int target) {
    for (auto it = values.begin(); it != values.end(); ) {
        if (*it == target) it = values.erase(it);
        else ++it;
    }
}`,
    hints: {
      0: { text: 'Erasing from a container moves the elements after it. What happens to the position you were holding when that move happens?' },
      1: { text: 'The iterator is advanced on every pass, including the pass that erased an element. After an erase the old position is not valid any more, and the element that slid into its place is skipped.', anchor: /erase|\+\+it/ },
      2: { text: 'erase hands back a valid position: the one just after what it removed. Use that as the new cursor instead of advancing, and only advance on the passes that did not erase. Notice what that means for the third clause of the for loop.' },
      3: { text: 'Here is the shape with the two moves left blank.', pseudocode: 'for it = begin; it != end; :\n    if *it == target:\n        it = [__]\n    else:\n        [__]' },
      4: { text: 'One assignment and one advance are missing.', pseudocode: 'void removeMatches(vector<int>& values, int target) {\n    for (auto it = values.begin(); it != values.end(); ) {\n        if (*it == target) it = values.[__](it);\n        else [__];\n    }\n}' },
    },
    tests: [
      { name: 'removes every match', expected: '{1,3}', hidden: false },
      { name: 'removes nothing when absent', expected: 'unchanged', hidden: false },
      { name: 'removes all elements', expected: 'empty', hidden: false },
      { name: 'consecutive matches', expected: 'ok', hidden: false },
      { name: 'hidden: match at the end', expected: 'ok', hidden: true },
      { name: 'hidden: iterator stays valid', expected: 'ok', hidden: true },
    ],
    checks: {
      definition: /void\s+removeMatches\s*\(/,
      definitionRaw: "undefined reference to 'removeMatches(std::vector<int>&, int)'",
      definitionCls: 'undefined-remove',
      key: /=\s*\w*\.?erase\s*\(/,
      keyRaw: 'iterator may be invalidated by erase [-Wuse-after-free]',
      keyCls: 'iterator-invalidated',
      keySeverity: 'warning',
      keyAnchor: /erase\s*\(|\+\+\s*it/,
      explanation:
        'erase invalidates the iterator that pointed at the removed element. Advancing that iterator afterwards reads freed memory; using the position erase returns keeps the traversal valid.',
    },
  },
}
