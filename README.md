# Scaffold (PoC)

Knowledge-state-driven adaptive scaffolding for programming labs. React 19,
TypeScript, Vite, Monaco. Two roles behind one shell:

- **Student IDE** — their own lab list, the lab statement and its attached manual,
  editor and mocked compiler, concept estimates with uncertainty bands, a tutor
  that releases help one disclosure level at a time, and Submit. Attempts and
  assistance requests made here show up in the console, marked *this session*.
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

## Telemetry

The student IDE captures behavioural telemetry (edit bursts, paste lengths and hashes, throttled cursor movements, focus/blur, idle pauses) and operational milestones (compiler runs, test outcomes, hint requests, submissions) over WebSocket with at-least-once delivery and unacknowledged event replay.

To run the telemetry capture pipeline locally:

1. **Start the ingestion server:**
   ```bash
   npm run telemetry:server
   ```
   (Listens on `ws://localhost:8787` and appends sessions to `data/telemetry/<sessionId>.jsonl`.)

2. **Start the application:**
   ```bash
   npm run dev
   ```
   By default, the student editor connects to `ws://localhost:8787`. Set the environment variable `VITE_TELEMETRY_URL` in `.env` or your shell to point the client to a custom WebSocket endpoint (e.g. `VITE_TELEMETRY_URL=ws://10.0.0.42:8787`).

3. **Verify the captured session logs:**
   ```bash
   npm run telemetry:verify
   ```
   Validates strictly monotonic sequence numbering (`seq` starting at 1 with 0 gaps and 0 duplicates) and increasing edit version IDs.

To simulate concurrent student load against the server:
```bash
npm run telemetry:sim -- --clients=60 --minutes=2
```

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
