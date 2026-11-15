# kt: knowledge tracing (offline)

Trains the student model that the IDE queries at runtime. Nothing here runs inside the browser.

- **Training (offline, before deployment, repeated each lab or semester):** many students' attempt
  sequences in, one set of weights out.
- **Runtime (inference only):** each student has a stored state. A new graded attempt is one forward
  update of that state; no weights change.

## Layout

| Path | Purpose |
|---|---|
| `data/progsnap2.py` | Load ProgSnap2 logs (CSEDM 2021, later our own labs) into per-student attempt sequences |
| `data/qmatrix.py` | Problem to concept mapping, mirroring `src/data/qmatrix.ts` |
| `split.py` | Split by student, so evaluation is always on held-out students |
| `models/bkt.py` | Bayesian Knowledge Tracing baseline, fitted per concept |
| `models/dkt.py` | Deep Knowledge Tracing (LSTM), optional code-vector input |
| `evaluate.py` | AUC and accuracy of next-attempt predictions |

## Plan

1. BKT vs DKT on CSEDM 2021 (public, Java), split by student.
2. Same comparison on our own C++ lab logs once they exist.
3. DKT replaces BKT in the IDE only if it wins on held-out students.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r kt/requirements.txt
```

CSEDM 2021 is not committed. Download it and point the loader at its `MainTable.csv`. Column names
follow ProgSnap2; check them against the release you download.
