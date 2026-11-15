"""Knowledge components (KCs) traced by Scaffold.

Mirrors `knowledgeComponents` in apps/web/src/mock/data.ts. The order fixes each KC's index in
the DKT input and output vectors, so append new KCs at the end; never reorder.
"""

KNOWLEDGE_COMPONENTS: tuple[str, ...] = (
    "array-pointer-basics",
    "linked-list-traversal",
    "recursion-base-case",
    "bst-invariants",
    "in-order-successor",
    "pointer-reassignment-free",
    "iterator-invalidation",
    "complexity-reasoning",
)

N_KC = len(KNOWLEDGE_COMPONENTS)
