# Scaffold (PoC)

Knowledge-state-driven adaptive scaffolding for programming labs. React 19,
TypeScript, Vite, Monaco. Two roles behind one shell:

- **Student IDE** — editor, mocked compiler, concept estimates with uncertainty
  bands, and a tutor that releases help one disclosure level at a time.
- **Instructor console** — overview, roster, labs and manuals, submissions,
  concepts, hint audit, settings.

No backend, no database, no model required. Every service is mocked behind an
interface, and every figure on screen comes from one seeded dataset — the header
carries a permanent **Demo data** badge.

Agent-facing docs start at [`AGENTS.md`](AGENTS.md). Backlog `docs/TASKS.md`,
build state `docs/PROGRESS.md`, walkthrough `docs/DEMO-SCRIPT.md`, settled
choices `docs/DECISIONS.md`, measured numbers `docs/EVIDENCE.md`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 — it lands on the student IDE. Switch roles from the
header. `/instructor/overview?demo=1` resets to a known-good state first.

## The two tutors

The tutor header switches between them live; the app opens on **Scaffold tutor**.

- **Scaffold tutor** (default, no model needed). A policy picks the disclosure
  level; the ladder shows what was released, what is next and why, what the
  instructor capped, and what the guardrail withheld. `src/providers/guardrail.ts`
  measures each drafted reply against the reference solution and blocks above the
  lab's threshold — Level 4 of the built-in problem scores 0.85 and is withheld at
  the default threshold of 0.60.
- **Baseline assistant** (needs Ollama). A prompted assistant with no student
  model, no levels and no output filter, prompted the way CodeHelp-style tools
  are. This is the control condition, and it is deliberately unguarded.

```bash
ollama pull qwen2.5-coder:7b
```

`VITE_TUTOR_MODE=baseline` opens on the assistant instead. `VITE_OLLAMA_MODEL`
picks the model; if it is not pulled, the app falls back to the first model Ollama
has and says so on the card. Under the Ask box, *Show system prompt* opens the
prompt in use with three presets (plain, tutoring, hardened) and a free-text edit.

## Views

`VITE_UI=lite` (default) is the deliberately bare PoC-lite shell. `VITE_UI=full`
switches to the finished visual language: both use the same dark tokens, so the
instructor console follows whichever is set. **Settings → Projector mode** raises
the type scale for a room.

## Evidence

The dashboard is the product; `spike/` is the evidence and is frozen.
`bash spike/demo.sh --fast` runs a one-minute live leakage check; `spike/leakage.py`
is the full harness, `spike/aggregate.py` and `spike/chart.py` build
`spike/results/leakage.png`, `spike/disclosure.py` builds `spike/results/why_kt.png`.
Never quote a number from the app; quote `docs/EVIDENCE.md`.

## Keyboard

Cmd+Enter run · Cmd+I toggle tutor · Cmd+Shift+I ask for a hint · Cmd+. escalate ·
Esc close tutor · Cmd+B toggle problem pane · Cmd+J toggle output · Cmd+Shift+S
snooze nudges. Ctrl on Windows and Linux.

## Where things live

- `src/providers/HintProvider.ts` is the seam; `MockHintProvider` reads
  `src/data/problems.ts` and applies `guardrail.ts`.
- `src/instructor/selectors.ts` computes every number the console displays;
  `format.ts` only formats them for display.
- `src/mock/data.ts` is the seeded dataset, exposed as `window.__mock`.
- `src/mock/compiler.ts` stands in for the sandboxed GCC run.
- `src/styles.css` holds the design tokens at the top; nothing else defines a colour.
- `src/types.ts` is the data contract the real services must satisfy.

## Not in this PoC

Backend, database, authentication, real compilation, real knowledge tracing,
websockets, parsing of uploaded manuals, light theme.
