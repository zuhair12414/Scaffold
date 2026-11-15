# Student model blueprint

## Role

The student model answers "how much help does this student need?". It does not know what is wrong
in the current code; code analysis does that. Its output is a mastery probability per concept,
which sets the starting hint level and is sent to the LLM as compact context.

## Interface

`src/student/StudentModel.ts`

| Method | Meaning |
|---|---|
| `mastery()` | Current probability of mastery per concept |
| `record(attempt)` | One graded attempt in, updated mastery out. A forward update, never training |
| `snapshot()` / `restore()` | Persist one student's state between sessions |

Implementations, chosen with `VITE_STUDENT_MODEL`:

| Kind | Status | Notes |
|---|---|---|
| `static` | default | Fixed values from `problems.ts`; keeps the PoC and harness numbers stable |
| `bkt` | working | Bayesian Knowledge Tracing per concept; placeholder parameters |
| `dkt` | planned | LSTM from `kt/models/dkt.py`, served locally |

## Training vs runtime

- Training happens offline on many students' sequences and produces one set of weights.
- At runtime each student has a stored state (for DKT, the LSTM's h and c). A new attempt runs one
  forward pass; the weights never change.
- Retrain after each lab or semester as logs accumulate, then redeploy.

## Data

1. CSEDM 2021 (ProgSnap2, Java) for a warm start and the first BKT vs DKT comparison.
2. Our own archived C++ lab submissions, re-run through the tests for labels, tagged with the
   Q-matrix (`src/data/qmatrix.ts`, `kt/data/qmatrix.py`). Needs departmental permission.
3. No synthetic students: the model would learn the generator's behaviour, not ours.

## Why concepts, not problems

About 45 problems over 15 labs with one cohort is roughly 6k to 11k attempts: sparse per problem,
workable per concept. Published comparisons (Khajah et al. 2016; Gervet et al. 2020) find simple
models match DKT at this scale, so BKT ships first and DKT must beat it on held-out students.

## Inputs to DKT

`x_t = [one-hot(concept, correct) ⊕ z_t ⊕ telemetry_t]`

- `z_t`: code vector from token embeddings with attention pooling.
- Telemetry stays a separate block, never mixed into `z_t`, with a missing-data flag for uploads
  made outside the IDE.

## Open questions

- Hidden size and code-vector size for a dataset this small.
- Whether telemetry features improve held-out AUC at all.
- Where per-student state lives (browser storage for the PoC, server database later).
