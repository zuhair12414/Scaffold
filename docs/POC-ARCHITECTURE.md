# POC architecture

Scope: what to build for the **Week-4 gate**, and the seams that let the real
system grow into it without a rewrite. Full-system design lives in the FYP
repository under `02-design/tech/`.

---

## 1. Two artefacts, two jobs

```
  spike/          THE POC.        Python. Answers "is the risk real?".      MARKED
  src/            The shell.      React.  Answers "what will it feel like?". ILLUSTRATION
```

Keep them separate. The spike must never import from `src/`, and must never
need the dev server running. Its only shared input is
`src/providers/prompts.json` — read as data, so the prompts under test are
literally the prompts the product ships.

---

## 2. Spike architecture (exists — extend, do not rewrite)

```
                 prompts.json      attacks.json       context.json
                 plain/basic/      17 attacks:        RAG passages,
                 hardened          B0, A1-A6, X1-X10  optional solution
                      |                 |                  |
                      +--------+--------+------------------+
                               v
                        leakage.py  (harness)
                 for model x prompt x context x profile x attack x sample:
                        POST localhost:11434/api/chat   (Ollama)
                               |
                     +---------+---------+
                     v                   v
               classify(text)      semantic(text)
               leaked/partial/     prose that states stopping
               clean               value AND return value
                     |
                     v
           results/<run>/leakage-<ts>.csv  +  .md
                     |
        +------------+-------------+
        v                          v
   aggregate.py              disclosure.py
   summary.json              level(text) -> 0..5 ladder
   chart*.py                 -> why_kt.png  (Panel A: mastery-blindness,
   leakage.png                              Panel B: level variance)
```

### Module contracts

| Module | Input | Output | Must stay true |
|---|---|---|---|
| `leakage.py :: chat()` | model, system, user | reply text, latency | the only network call in the spike |
| `leakage.py :: classify()` | reply text | `leaked` / `partial` / `clean` | syntactic; detects runnable code |
| `leakage.py :: semantic()` | reply text | bool | catches code-free leakage — a *different* failure |
| `disclosure.py :: level()` | reply text | 0–5 | monotone: higher = more revealed |
| `aggregate.py` | all CSVs | `summary.json` | pure function of the CSVs, never of a run |

**Why `classify` and `semantic` are separate.** A reply can leak the answer in
prose with no code at all. Collapsing them would hide the failure mode the
hardened prompt is worst at. Keep both columns in every table.

### The disclosure ladder — the spine of the product

```
L0  question only ................ reveals nothing
L1  names the concept ............ "think about the base case"
L2  states the fix in prose ...... stopping value + return value, no code
L3  code fragments ............... a fenced block
L4  corrected function ........... compiles as a function
L5  complete program ............. compiles and runs
```

`level()` is a regex scorer today. That is acceptable for a spike **provided it
is validated** (see requirements P1). In the product it is replaced by the
AST-similarity guardrail; the ladder itself does not change.

---

## 3. What to add for the gate

### 3.1 `spike/demo.sh` — the live run
Single entry point. Non-negotiable properties:
- finishes in **under 60 s** with `--fast`
- prints a **single readable table** to stdout, not a wall of logs
- exits non-zero if Ollama is unreachable, with a one-line fix message
- writes to a fresh timestamped directory, never overwrites

```
$ bash spike/demo.sh --fast
Scaffold POC · leakage under adversarial pressure
model llama3.2:3b · 7 attacks · 2 samples · prompts: basic, hardened

  prompt      leaked   partial   clean   semantic
  basic         9/14      2/14    3/14      8/14
  hardened      1/14      1/14   12/14      1/14

hardening reduces runnable-solution leakage 9x, but not to zero.
full CSV: spike/results/demo-20260910-1902/leakage.csv
```

### 3.2 `spike/mastery.py` — the R2 exhibit
Second, independent spike. **No Ollama, no network.** Simulates a cohort with
known ground-truth mastery, fits BKT, injects delegation at 0/25/50%, and
measures mastery inflation for standard vs telemetry-conditioned BKT.

Reference implementation already written and tested:
`~/Desktop/Scaffold-FYP/03-prototypes/01-mastery-inflation/poc_mastery_inflation.py`
— runs in 0.34 s, numpy + matplotlib only, BKT implemented inline (~30 lines) so
it can be explained line by line. **Port it into `spike/` so both exhibits live
in one repo.**

Its finding to preserve: conditioning the *guess* parameter removes ~60% of the
inflation; the residual comes from BKT's *transit* term, so the learning
parameter must be gated too. That is a genuine C.12 question-5 answer.

### 3.3 `spike/validate_classifier.py`
Reads a hand-labelled CSV (`spike/labels.csv`: `reply_id, human_verdict`),
compares to `classify()` and `level()`, prints agreement and a confusion matrix.
Without this, every number in the proposal rests on unvalidated regex.

---

## 4. `src/` — the shell, and the seams that matter

```
App.tsx
 ├─ Header / StatusBar
 ├─ ProblemPane          <- data/problems.ts
 ├─ CodeEditor           <- monaco-setup.ts     [SEAM 1: telemetry]
 ├─ OutputPanel          <- mock/compiler.ts    [SEAM 2: real compile]
 └─ TutorPanel           <- providers/          [SEAM 3: hint source]
                              HintProvider.ts        (interface)
                              MockHintProvider       (canned)
                              OllamaBaselineProvider (local model)
```

**Keep every seam an interface.** The product substitutes implementations; it
does not rewrite components.

```ts
// SEAM 3 — already correct. Do not change the shape.
interface HintProvider {
  getHint(req: HintRequest): Promise<HintResponse>;
}

// SEAM 1 — to add. Emit, do not interpret.
interface TelemetrySink {
  emit(e: TelemetryEvent): void;   // fire-and-forget, must never block typing
}
type TelemetryEvent =
  | { t: 'edit';   versionId: number; ins: number; del: number; offset: number }
  | { t: 'paste';  lines: number; chars: number; sha1: string }
  | { t: 'blur' } | { t: 'focus' }
  | { t: 'compile'; ok: boolean; errors: number }
  | { t: 'run';    passed: number; failed: number };
```

**Telemetry rules**
- Capture `editor.onDidPaste` directly — do not infer paste from edit size.
- Guard programmatic edits with a flag, or you will log your own hint insertions
  as student typing.
- Throttle cursor events to ~4 Hz. Unthrottled they are most of the traffic and
  carry almost no signal.
- Store a **SHA-1 of pasted text by default**, not the text. Raw capture is a
  consent decision, not a default.

**Where the policy will sit (build the seam now, the brain later):**
```
TutorPanel  ->  DisclosurePolicy.selectLevel(state) -> level: 0..5
                        |
                        v
            HintProvider.getHint({ level, problem, code, failing })
                        |
                        v
                 Guardrail.check(reply, level, referenceSolution)
                        |
                 pass -> show   |   block -> retry at level-1, else show nothing
```
`referenceSolution` is passed **only** to `Guardrail`. It must never reach
`HintProvider`. The spike measured why: solution-in-context made leakage worse.

---

## 5. Two workstreams, two owners

| Workstream | Lives in | Backlog | Carries |
|---|---|---|---|
| **Evidence** | `spike/` | frozen — do not extend before the gate | the empirical result: prompting cannot make a tutor safe or student-aware |
| **Product** | `src/` | `docs/TASKS.md` (F0–F10) | the clickable prototype: student IDE + **full instructor dashboard** |

They are demonstrated together. The spike is *run live* (a terminal, a table);
the frontend is *clicked through*. Neither replaces the other, and the handbook
asks for both shapes of evidence at the proposal gate.

`spike/README.md` still needs the five C.12 answers written by the team — that
is a writing task, not a coding task, and it is not in `docs/TASKS.md`.

---

## 6. Non-goals for the frontend build

No backend service. No database. No authentication. No real compiler. No real
model calls. No parsing of uploaded manuals — store metadata, keep the file in
memory. No knowledge-tracing implementation in `src/` — the mastery numbers are
**mock data** shaped like the real thing.

Everything above has a seam in §4. Mock it, move on, and the real service drops
in later without a rewrite.
