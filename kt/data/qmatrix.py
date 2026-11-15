"""Problem to concept mapping. Keep in sync with src/data/qmatrix.ts."""

CONCEPTS = [
    "functions", "conditionals", "loops", "arrays", "strings",
    "recursion", "pointers", "structs", "classes", "file-io",
]

QMATRIX: dict[str, list[str]] = {
    "P02": ["recursion", "functions"],
}


def concepts_for(problem_id: str) -> list[str]:
    return QMATRIX.get(problem_id, [])


def concept_index(concept: str) -> int:
    return CONCEPTS.index(concept)
