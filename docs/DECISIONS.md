# Decision log

Append-only, newest at the bottom. An agent must **not** re-litigate anything
here. If a decision looks wrong, add a new entry that supersedes it — do not
silently change the code.

Format: **Decision** · **Why** · **Rejected alternative** · **Consequence**

---

### D1 · The policy chooses the disclosure level; the model only renders it
**Why:** `spike/results` shows a hardened prompt still leaks 2–3 in 18, and
`disclosure.py` shows the level wanders run to run even with the prompt fixed.
Prompting cannot be made deterministic or student-aware.
**Rejected:** pedagogy encoded in the system prompt.
**Consequence:** `DisclosurePolicy` is a real module with tests. The prompt is
defence in depth, never the control.

### D2 · The reference solution never enters the model's context
**Why:** the `rag_solution` condition made semantic leakage *worse* (11 → 13).
**Rejected:** RAG over solution + rubric.
**Consequence:** the solution is passed only to `Guardrail`. Any code path that
puts it in a prompt is a bug.

### D3 · Guardrail inspects output, not intent
**Why:** intent classification cannot see what was actually emitted.
**Rejected:** prompt-injection classifier as the primary control.
**Consequence:** the guardrail parses the reply and measures disclosure.

### D4 · Uncertainty lowers disclosure
**Why:** under-helping is recoverable; over-helping destroys the learning.
**Consequence:** the policy consumes the **lower bound** of the mastery
estimate, not the point estimate.

### D5 · Syntactic and semantic leakage stay separate metrics
**Why:** the hardened prompt is much better at suppressing code than prose.
Collapsing them hides its worst failure mode.
**Consequence:** every table keeps both columns.

### D6 · The spike is dependency-light and self-explaining
**Why:** the handbook requires the student to explain and modify their own code
live. A library doing the interesting part fails that.
**Rejected:** an off-the-shelf guardrail library, pyBKT for the spike.
**Consequence:** classifier, ladder scorer, harness loop and BKT are ours,
≤ ~150 lines each, stdlib + matplotlib only.

### D7 · Ollama and local models for anything demonstrated
**Why:** student code must not leave campus; labs cannot depend on internet;
no per-request cost at class scale.
**Consequence:** commercial APIs are development-time only and must be disclosed
under the handbook's GenAI-disclosure rule.

### D8 · `src/` is illustration, `spike/` is evidence
**Why:** the handbook excludes a UI mockup as POC evidence on its own.
**Consequence:** the React app is never described as the POC. Effort before
Week 4 goes to `spike/`.

### D9 · The system never accuses
**Why:** a false suspicion is real harm to a student, and detection is
unreliable in the literature.
**Consequence:** no misconduct flag, no report to any authority, no accusatory
vocabulary in UI, logs or identifiers. See `GLOSSARY.md`.

### D10 · `spike/demo.sh --fast` is a smoke matrix, not the full evidence matrix
**Why:** the first fast attempt using 7 attacks, 2 samples and 2 prompts was
interrupted after 1:19.65 total, before completion. The live gate needs a command
that reliably returns in the room.
**Rejected:** making the room demo run the broader matrix from `run_all.sh`.
**Consequence:** `--fast` runs A1, A4 and A5 with 1 sample per prompt. The
broader leakage claim remains tied to `docs/EVIDENCE.md` A1–A3.

### D11 · The frontend shell owns routes; the existing IDE remains a child view
**Why:** the updated frontend task list requires a two-role demo, but the
student IDE already works and should keep working at `/student`.
**Rejected:** rebuilding the IDE as part of the route change.
**Consequence:** `App.tsx` is the role shell and router; the previous IDE code
is preserved as `StudentIde.tsx`.

### D12 · Mock data is exposed on `window.__mock` for the demo
**Why:** F1's Definition of Done asks examiners to inspect the seeded dataset in
the browser console, and the updated task list says the frontend is mock-only.
**Rejected:** exposing the dataset only behind a development-mode branch.
**Consequence:** `window.__mock` is assigned during app boot so a local demo can
verify the dataset without a backend or model call.

### D13 · One dark theme for both roles, driven only by CSS variables
**Why:** the student IDE was dark and the instructor console was built on the
light deck palette (`paper #FFF` / `ink #1B1F24` / `accent #0F4C81`). Switching
roles in front of a panel meant a full flash from white to near-black, and two
visual languages read as two prototypes stitched together.
**Rejected:** a light/dark toggle, and the earlier patch of appending a dark
override block after the light rules — every new screen had to be added to that
override list by hand, and anything missed (student names in the heatmap) stayed
ink-on-charcoal and unreadable.
**Consequence:** the light values are gone. Every instructor rule resolves a
token from `:root` in `src/styles.css`, so both shells follow whichever palette
is live — the PoC-lite one in `basic.css` or the full one — and `VITE_UI=full`
restyles the dashboard for free. `:root` also declares `color-scheme: dark`, so
native date pickers, checkboxes and scrollbars stop rendering light. Semantic
roles are unchanged and now hold everywhere: accent = estimated from
correctness, amber = adjusted for how the work was done and every mastery
figure, red = harm or blocked only. Paste markers in the session timeline moved
off red onto `--info`; a paste is an observation, and red framed it as an
accusation (D9).

### D14 · Instructor screens format what they display; the dataset keeps full precision
**Why:** mastery means rendered as `0.654468085106383` and ISO strings as
`2026-10-14T17:00:00.000+05:00` overflowed their cards and were unreadable from
across a room.
**Consequence:** `src/instructor/format.ts` holds the display helpers (2 dp for
mastery, `16 Sept 16:33` for timestamps, KB/MB for file sizes). They format at
the point of render only — `window.__mock` and every stored value keep full
precision, so nothing rounds its way into a claim.

### D15 · The frontend ships a real output-side guardrail, not a mocked verdict
**Why:** F7 and F8 both display a disclosure decision. Hard-coding "level 4 is
blocked" would have made the guardrail a caption rather than a mechanism, and the
guardrail is the part of the architecture a panel is most likely to probe.
**Consequence:** `src/providers/guardrail.ts` measures the code-shaped part of a
reply against the reference solution — token and adjacent-pair overlap, averaged —
and blocks when the score exceeds the lab's threshold. Measured on the P02 hint
ladder: L0 0.00 · L1 0.00 · L2 0.06 · L3 0.51 · L4 0.85 · a pasted solution 1.00.
With the default threshold of 0.60 the ladder releases through Level 3 and
withholds Level 4, and moving the slider in Labs & Manuals moves that boundary
live. The reference solution lives in `Problem.solution`, is read only by the
comparator, and is never sent to a provider (AGENTS §4.3). The baseline provider
is deliberately left unguarded — it is the control condition.

### D16 · The tutor mode is a runtime switch, and the product tutor is the default
**Why:** the frontend must run with no backend and no model (TASKS rule 3), but
the baseline assistant is the evidence exhibit and must stay one click away.
**Rejected:** two builds, or an env var that has to be set before the defence.
**Consequence:** `StudentIde` holds the mode in state and picks its provider from
it. It opens on the scaffold tutor, which needs nothing running;
`VITE_TUTOR_MODE=baseline` opens on the assistant instead. The escalation cooldown
dropped from 30s to 12s so a level release can actually be shown in a room.

### D17 · The seeded mastery spread was widened, and each student got one ability offset
**Why:** the first generator drew a fresh base per student per concept, so every
class mean landed between 0.65 and 0.75 and no student sat below 0.35 on six of
the eight concepts. F6's *"students below 0.35"* list was empty by construction and
the heatmap read as uniform — flattering, which `docs/TASKS.md` explicitly forbids.
**Consequence:** one ability offset is drawn per student and reused across
concepts, the base band widened and per-lab growth reduced. Class means now sit
between 0.49 and 0.55, values run 0.06 to 0.92, and 3 to 8 students sit below 0.35
on each concept. The six divergent students separate by 0.23 to 0.47 between the
correctness-only and adjusted estimates. Still one fixed seed, still identical on
every reload.
