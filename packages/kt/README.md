# packages/kt

Knowledge tracing engine: per-student, per-concept mastery for the disclosure policy, from a BKT
baseline and Deep Knowledge Tracing (DKT). Design: `docs/design/01-knowledge-tracing.md`.
Owner: Muhammad Zuhair 23I-0001.

**Status: structure only.** Modules, contracts and signatures are in place; every planned function
raises `NotImplementedError`. Nothing is trained and no results exist yet.

## How it fits

```
graded attempt ──► Interaction ──► KnowledgeTracer.update(state) ──► MasteryVector ──► disclosure policy
                                        ▲
                         offline: KnowledgeTracer.fit(many students)
```

- **Offline:** `fit` on many students' sequences produces one set of weights.
- **Runtime:** each student has a stored state; one attempt is one `update`. Weights never change
  during a lab.

## Layout

| Module | Will do | Design ref |
|---|---|---|
| `scaffold_kt/components.py` | The 8 CS2 knowledge components, fixed index order (done) | mirrors `apps/web/src/mock/data.ts` |
| `scaffold_kt/interfaces.py` | `Interaction`, `MasteryVector`, `KnowledgeTracer` protocol (done) | — |
| `scaffold_kt/data/progsnap2.py` | ProgSnap2 `MainTable.csv` to per-student sequences | §1.2 |
| `scaffold_kt/encoding.py` | 2M one-hot plus telemetry slot, 200-step windows | §1.2, §1.3 Fix B |
| `scaffold_kt/split.py` | Train/test and GroupKFold by student | §1.2 Splitting |
| `scaffold_kt/models/bkt.py` | BKT with P(G) ≤ 0.30, P(S) ≤ 0.10; telemetry-conditioned guess | §1.1, §1.3 Fix A |
| `scaffold_kt/models/dkt.py` | LSTM DKT, masked next-step loss, DKT+ regularisation | §1.2, §1.3 Fix B |
| `scaffold_kt/evaluate.py` | AUC / accuracy / log-loss over student folds | `05-evaluation.md` |

## Roadmap

1. ProgSnap2 loader and encoding, tested on a small fixture.
2. BKT baseline on CSEDM 2021, split by student. Save results under `research/`.
3. DKT on the same folds; compare with BKT.
4. Telemetry variants (BKT Fix A, DKT Fix B) once telemetry features exist.
5. Serve `mastery()` to the disclosure policy.

## Test

```bash
pip install pytest
pytest packages/kt/tests -v
```
