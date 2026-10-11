# Scaffold — architecture sketch

_Status: exploratory. This is a thinking document, not a commitment._

## Pipeline

```
student code + task spec
        |
        v
  [1] Code Analyser        -> structured observations about the submission
        |
        v
  [2] Understanding Model  -> per-concept belief about what the student knows
        |
        v
  [3] Hint Policy          -> chooses WHETHER to help and at WHAT level
        |
        v
  [4] Hint Generator       -> renders the chosen level into text
        |
        v
  [5] Guardrail            -> rejects any hint that leaks more than its level
        |
        v
    student
```

## Components

### 1. Code Analyser
Turns a submission into observations that are meaningful to the model, not raw
text. Candidates: AST diffs against previous submissions, failing test
signature, error class, control-flow shape, distance to a reference solution
in some structural metric.

Open: how much does this need to be language-specific?

### 2. Understanding Model
Maintains a belief over concepts (e.g. "loop invariants", "pointer aliasing",
"recursion base case"). Candidate approaches — knowledge tracing (BKT/DKT),
a simple Bayesian per-concept model, or an LLM-judged rubric. The simplest
thing that is *calibrated* beats the most sophisticated thing that is not.

Critical property: it must be able to say "I don't know." Uncertainty is an
output, not an inconvenience.

### 3. Hint Policy
The pedagogical core. Decides: stay silent, or release level N. Inputs include
time stuck, number of attempts, trajectory (are they converging or thrashing?),
and the understanding estimate. Under-help on uncertainty.

### 4. Hint Generator
Renders a level into language. Templates constrain it; if an LLM is used, it is
given only the information permitted at that level, not the solution.

### 5. Guardrail
Independent check that the emitted hint does not exceed its level. Treat it as
an adversary: can a student reconstruct the solution from N hints at level k?

## Hint levels (draft taxonomy)

| Level | Reveals | Example shape |
|---|---|---|
| 0 | Nothing | Silence / "keep going" |
| 1 | That something is wrong, not where | "One of your cases isn't handled." |
| 2 | Where | "Look at what happens when the list is empty." |
| 3 | What concept applies | "This needs a base case for the recursion." |
| 4 | What to do, not how | "Return early when n <= 1." |
| 5 | Worked mechanism, still not the submission's code | (Reserve; may be out of scope entirely) |

TODO: decide whether level 5 exists at all. Argument for excluding it: any
level that produces runnable code is an answer.

## Non-obvious design commitments

- **Silence is a first-class action.** Most tutoring systems cannot choose it.
- **Level escalation is monotonic per stuck-episode** but resets on progress.
- **The system explains its own level choice** in the logs, so the evaluation
  can audit pedagogy rather than just outcomes.
