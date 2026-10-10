# Claude Code entry point

Read **`AGENTS.md`** — it is the single source of truth for this repository and is
kept tool-agnostic on purpose. Do not duplicate guidance here; edit `AGENTS.md`.

Reading order for any agent:
1. `AGENTS.md` — rules, ownership, what exists
2. `docs/poc/RESEARCH-CONTEXT.md` — why this project exists, and the gap it fills
3. `docs/poc/POC-REQUIREMENTS.md` — what "done" means for the Week-4 gate
4. `docs/poc/POC-ARCHITECTURE.md` — modules, seams, contracts
5. `docs/poc/TASKS.md` — the ordered backlog. Start here when you write code.
6. `docs/poc/EVIDENCE.md` — every measured number. Never invent one.
7. `docs/poc/GLOSSARY.md` · `docs/poc/DECISIONS.md` — vocabulary and settled choices

## Monorepo layout

| Path | What lives there |
|---|---|
| `apps/web/` | React 19 + TS + Vite frontend (student IDE + instructor dashboard) |
| `services/api/` | FastAPI backend (to be built) |
| `services/runner/` | Code execution sandbox (to be built) |
| `packages/guardrail/` | Output-side disclosure guardrail — **only place that reads the reference solution** |
| `packages/kt/` | Knowledge tracing engine (pyBKT / DKT) |
| `problems/` | Lab problem definitions (statement + reference solution) |
| `research/spike/` | PoC Python experiments — frozen, do not extend |
| `infra/` | docker-compose, env templates |
| `docs/poc/` | PoC-era documents (requirements, evidence, tasks, decisions) |
| `docs/design/` | Architecture design docs — do not edit without design review |

## Rules that are not negotiable

All rules in `AGENTS.md §4` apply. Additionally:

1. **The reference solution is never sent to the model.** Only `packages/guardrail`
   reads it, for disclosure scoring. It must not appear in any context window,
   prompt, RAG chunk, or log that a student could observe.

2. **The disclosure level is chosen only from behaviour and mastery.** It is never
   inferred from the student's chat text or natural-language requests. Using chat
   text as a signal breaks the measurement described in the thesis.

3. **A blocked hint is regenerated one level lower — never returned as a bare
   refusal.** The student should always receive something. A refusal without
   a hint is a worse outcome than a lower-quality hint.

4. **Every number in `docs/` must come from a command whose output is saved.**
   Run the command, save the output (CSV or markdown in `research/spike/results/`
   or equivalent), then cite it. Numbers without a saved artefact are not evidence.
