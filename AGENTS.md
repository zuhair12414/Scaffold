# Scaffold — agent context

**Tool-agnostic entry point.** Claude Code, Codex, Cursor, Aider — all start here.
`CLAUDE.md` is a pointer to this file; keep guidance in one place.

## Reading order
1. **this file** — rules, ownership, what already exists
2. `docs/poc/RESEARCH-CONTEXT.md` — why the project exists, the gap, the ethics
3. `docs/poc/POC-REQUIREMENTS.md` — what "done" means at the Week-4 gate
4. `docs/poc/POC-ARCHITECTURE.md` — modules, seams, contracts
5. `docs/poc/TASKS.md` — **the frontend backlog (F0–F10). Start here to write code.**
6. `docs/poc/EVIDENCE.md` — every measured number. Never invent one.
7. `docs/poc/GLOSSARY.md` · `docs/poc/DECISIONS.md` — vocabulary, settled choices

## Before your first change
- Read 1–5. Do not start coding before you have.
- Pick **one** task from `docs/TASKS.md`, in order. Do not batch tasks.
- Run the task's Definition-of-Done command yourself and paste the output.
- If a task's premise proves false, **stop and say so** — a disproved assumption
  is a result. Record it in `docs/DECISIONS.md`.

---

## 1. What this project is

**Scaffold** — knowledge-state-driven adaptive scaffolding for programming labs.
FYP-1, FAST NUCES Islamabad. Target course: **CS2 Data Structures, C++**.

**The problem.** Students paste lab tasks into ChatGPT and submit the answer.
This removes the productive struggle that produces skill, and it is invisible to
the instructor, who sees only a correct submission.

**The thesis, in one sentence.**
> To give a student the right amount of help you must know what that student
> knows. Every student model infers that from **submission correctness** — and a
> student who delegates submits **correct code they do not understand**. The
> measurement is broken, and everything built on it is broken with it.

**What we build.** A closed loop: IDE telemetry → struggle/behaviour
classification → per-concept knowledge tracing → a **disclosure level** computed
from that state → an LLM that renders only that level → an output-side guardrail
that blocks over-disclosure → instructor dashboard.

**The single most important design rule.** The model never decides how much to
reveal. **A policy decides the level; the model writes the sentence.** If you
find yourself putting pedagogy into a system prompt, you have broken the
architecture — see §4.

---

## 2. Team and ownership

| Member | Owns | Do not let another member's code creep in here |
|---|---|---|
| **Muhammad Zuhair** 23I-0001 | Knowledge tracing, mastery validity, the spike harness | `research/spike/`, `packages/kt/`, KT service |
| **Muhammad Jawad Ali** 23I-3024 | Telemetry capture, latency, concurrency, dashboard | editor instrumentation, event pipeline |
| **Abdul Rauf** 23I-0591 | Disclosure policy, leakage guardrail, evaluation | policy engine, guardrail, study |

Supervisor: Ma'am Rabail Zahid.

Each member must be able to **explain, justify, predict the failure of, and
modify their subsystem live** under panel questioning. Write code they can defend.

---

## 3. What already exists in this repo — do not rebuild it

```
apps/web/               React 19 + TS + Vite + Monaco. Two roles behind one shell.
  src/
    App.tsx             router, role switch, demo gate (?demo=1)
    StudentIde.tsx      the student view; scaffold tutor or baseline assistant
    instructor/         Overview · Roster · LabsManuals · Submissions · Concepts
                        HintAudit · Settings · StudentDetail
      selectors.ts      every derived number the screens display
      format.ts         display formatting only; the dataset keeps full precision
    components/         Header, ProblemPane, CodeEditor, OutputPanel, TutorPanel,
                        StatusBar, MasteryBars, ManualViewer, Markdown
    state/              CourseState (labs, manuals, policy) · demo (rails, projector)
    mock/data.ts        the seeded dataset: 47 students, 8 KCs, 6 labs
    mock/labContent.ts  per-lab examples, ladder, solution, tests, compiler signals
    providers/
      HintProvider.ts             interface all hint sources implement
      MockHintProvider.ts         canned ladder, no model, guardrail applied
      OllamaBaselineProvider.ts   real local model via Ollama, deliberately unguarded
      guardrail.ts                output-side disclosure measurement (D15)
      prompts.json                plain (99 ch) / basic (273) / hardened (2194)
    mock/compiler.ts    fake compiler + test output
    data/problems.ts    lab problems, with the guardrail-only reference solution
research/spike/         THE POC. Python, no deps beyond matplotlib.
  leakage.py            runs model x prompt x context x profile x attack, N samples
  attacks.json          17 attacks: B0 benign, A1-A6, X1-X10
  disclosure.py         scores every reply on a 0-5 disclosure ladder -> why_kt.png
  chart*.py, aggregate.py
  results/              CSV + markdown per run, charts
services/api/           FastAPI service (to be built)
services/runner/        Code execution sandbox (to be built)
packages/guardrail/     Output-side disclosure guardrail — only place that reads the reference solution
packages/kt/            Knowledge tracing engine (pyBKT / DKT)
problems/               Lab problem definitions (statement + reference solution)
infra/                  docker-compose, env templates
```

**Two workstreams, and they are demonstrated together.**
- **`research/spike/` is the evidence** — a live experiment, run in a terminal. **Frozen:
  do not extend it before the gate.** It answers *is the risk real?*
- **`apps/web/src/` is the product** — the clickable prototype: student IDE plus a **full
  instructor dashboard**. Backlog `docs/poc/TASKS.md`, state `docs/poc/PROGRESS.md`,
  walkthrough `docs/poc/DEMO-SCRIPT.md`. It runs with no backend and no model.

A UI mockup alone is not accepted as POC evidence (handbook, Appendix A Stage 0)
— which is why the spike exists and why it is never described as the frontend.
Equally, a terminal table alone does not show a panel what the product *is*.
Build the frontend; keep the spike intact; show both.

### What the spike has already established

| Condition (llama3.2:3b, n=18) | leaked | clean |
|---|---|---|
| Baseline prompt | 13 | 2 |
| RAG | 12 | 4 |
| RAG **with the solution in context** | 11 | 5 |
| System prompt (hardened) | **2** | 15 |
| RAG + system prompt | **3** | 15 |
| RAG-with-solution + system prompt | **2** | 15 |

Same shape on `qwen2.5-coder:7b`: 11/18 leaked under the basic prompt.

**Three findings that drive the whole architecture:**
1. A hardened system prompt cuts leakage hard — **but never to zero.** 2–3 of 18
   still leak a runnable solution. Prompting is a filter, not a guarantee.
2. `disclosure.py` shows two gaps prompting cannot close at all:
   **(A)** told the student's mastery ("recursion mastered 0.91" vs "not shown
   0.18"), the model gives *the same help*; **(B)** same question, same prompt,
   the disclosure level *wanders* run to run.
3. Semantic leakage — prose that states the stopping value and the return value
   without any code — is tracked separately, and hardening suppresses it too
   (11/18 → 1/18) but again not reliably.

**(A) and (B) are the argument for this entire project.** Prompting cannot be
made student-aware or deterministic. That is why we need a knowledge state, a
policy, and an output-side guardrail.

---

## 4. Rules that are not negotiable

1. **Policy decides the level, the model renders it.** Never put "give a hint,
   not the answer" in a prompt and call it done — the spike already proves that
   fails 2–3 times in 18.
2. **The guardrail inspects output, not intent.** It parses what the model
   actually produced and blocks on measured disclosure. Prompt instructions are
   defence in depth, never the control.
3. **Never put the reference solution in the model's context.** The spike tested
   this (`rag_solution`) and it made leakage worse. The solution lives only in
   the guardrail comparator, which the model never sees.
4. **Uncertainty means disclose LESS.** When the mastery estimate is uncertain,
   move down the ladder. Under-helping is recoverable; over-helping destroys the
   thing we protect.
5. **Local models only in anything deployed.** Student code does not leave
   campus. Commercial APIs are development-time only and must be disclosed.
6. **Every number in a report or slide must be reproducible by a command in this
   repo.** No invented figures. If it is not measured, say "not measured yet".
7. **The system never accuses anyone.** It surfaces evidence to a human. A false
   suspicion is real harm to a student.

---

## 5. Stack

React 19 · TypeScript · Vite 8 · `@monaco-editor/react` · Python 3 for the spike
· Ollama for local inference (`llama3.2:3b`, `qwen2.5-coder:7b`) · matplotlib.

Planned: FastAPI + WebSocket, Redis, pyBKT / PyTorch DKT, tree-sitter (C++),
vLLM for the deployed model.

**Dependency classification (handbook C.14) — memorise this:**
- **Core-Assist:** the LLM. Renders a chosen level into English. Nothing else.
- **Student-built core:** KT engine, telemetry pipeline, struggle detector,
  disclosure policy, leakage guardrail, dashboard.
- **Support:** Monaco, React, FastAPI, Ollama, pyBKT.
- **Core-Replacement (forbidden):** any external service that decides *what to
  reveal*. Handbook penalty: marks capped or project rejected.

---

## 6. Conventions

- TypeScript strict. No `any` in `src/providers` or the policy engine.
- Every provider implements `HintProvider` so sources are swappable.
- Spike scripts stay **dependency-light** (stdlib + matplotlib) and runnable as
  `python3 research/spike/<x>.py`. They must run in seconds on a laptop, live, in a room.
- Results are written as **CSV + markdown + chart**, timestamped, never
  overwritten. The CSV is the evidence; the chart is the slide.
- Commit messages state what was measured, not what was added.
