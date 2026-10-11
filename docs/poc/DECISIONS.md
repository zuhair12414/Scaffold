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

### D18 · Every lab is a real problem, not one problem wearing six titles
**Why:** the student view synthesised a Problem from a lab's title, statement and
starter code, then borrowed the built-in factorial problem's hint ladder, tests,
compiler diagnostic and reference solution. Opening Lab 5 gave BST starter code,
factorial examples, factorial tests and a tutor that talked about recursion base
cases. The product looked complete and was not.
**Consequence:** `src/mock/labContent.ts` holds, per lab, its examples,
constraints, five-level hint ladder, reference solution, mock test set and the two
signals the mock compiler judges (the definition that must exist, and the one
construct that makes the tests pass). `registerLabProblem` puts every lab into the
same lookup a built-in problem uses, so providers and the guardrail need no special
case. Measured across all six labs, Level 3 scores 0.37–0.56 and Level 4 scores
0.66–0.95, so the default 0.60 threshold releases three levels and withholds the
fourth in every lab. A lab authored in the console still borrows the built-in
ladder — authoring a ladder is out of scope — and says so.

### D19 · The student half of the loop is a loop, not a screenshot
**Why:** the instructor console read submissions, manuals and hint decisions that
the student view had no way to produce. A manual could be uploaded and never
opened, a submission existed only in the seed, and a hint the guardrail withheld
in the IDE never reached the audit.
**Consequence:** the student view now carries its own lab list (the instructor's
push wins when there is one), opens attached manuals in a viewer, submits attempts,
and shows its own attempt history with the outcome of each. Submitted attempts and
every assistance request — with the level, the measured similarity and the
decision — flow into Submissions, Student detail and Hint Audit, labelled *this
session* so they are never mistaken for seeded rows. `Reset demo` and `?demo=1`
clear them. The instructor side gained the matching controls: view a manual, change
a lab's status, remove a lab, and per-lab and per-selection submission statistics.

### D20 · The mastery-inflation spike is deterministic and exact-fraction
**Why:** the panel can ask where every number came from, and the repo rule forbids
rounded evidence numbers.
**Consequence:** `spike/bkt_inflation.py` uses only the standard library and
`fractions.Fraction`. It runs a fixed 8-student, 8-step cohort at delegation rates
0, 1/4 and 1/2, then writes exact fractions to `spike/results/bkt_inflation.csv`
and `.md`.

### D21 · Classifier validation exists, but agreement waits for human labels
**Why:** a validation score is not evidence unless the label file was filled by
people before the script compares it with the regex classifier.
**Consequence:** `spike/validate_classifier.py` reads `spike/labels.csv` and
prints `not measured yet` while the file has only headers. Once rows are filled,
it reports exact agreement ratios and a confusion matrix.

### D22 · The second problem is opt-in, not part of the old evidence path
**Why:** adding a linked-list problem to the default leakage matrix would change
the meaning of existing R1 tables in `docs/EVIDENCE.md`.
**Consequence:** `spike/context.json` contains both `fact` and `list_sum`, while
`spike/leakage.py` defaults to `--problems fact`. The second problem is exercised
with `--problems list_sum`, and every output row now records the `problem` id.

### D23 · Instructor selectors read the live course state
**Why:** after D19, submissions, hint decisions, lab visibility and policy edits
can originate in the browser session. Screens that kept reading only
`mockData.labs`, `mockData.submissions` and `mockData.hintAudit` drifted from the
student view.
**Consequence:** `src/instructor/selectors.ts` accepts a `SelectorScope` carrying
the visible labs, session submissions, session hint decisions and selected lab.
Overview, roster, concepts, submissions, hint audit and settings now derive their
figures from the same live state while the seeded dataset remains the baseline.

### D20 · A lab is a list of questions, and the conversation belongs to the question
**Why:** a lab was one statement with one starter file, so "Lab 5: BST delete" was
a single wall of work with a single chat. A real CS2 lab is a sequence of
questions that build, and a student's conversation about the successor walk is not
the same conversation as the one about the two-child case.
**Consequence:** `src/mock/labQuestions.ts` holds the questions. Lab 5 is written
out properly as three — find the in-order successor, delete a leaf or one-child
node, delete a node with two children — each with its own statement, examples,
constraints, starter, reference solution, five-level ladder, tests and compiler
signal. Every other lab is wrapped as a single question so nothing downstream has
to special-case it. Each question registers as a problem, so the tutor and the
guardrail work per question with no new plumbing. The student view keys the editor
(one Monaco model per question), the run output and the conversation to the
question; switching questions switches all three and **nothing is deleted** — the
chat is kept with the work, on purpose, because the instructor reads the same
transcript beside the attempt.

### D21 · The flag is a verdict with its evidence attached, or it is an accusation
**Why:** "correct submission, low verified mastery" is the product's whole claim.
Shown as a badge alone it is an accusation with no way to check it (D9).
**Consequence:** `verifiedMasteryVerdict` states the rule in one place and reads
only measured things: the attempt passed, the adjusted estimate across that
question's concepts is below 0.45 while correctness is high, and time on task is at
most half the class median **for that lab**. Expanding the row shows every reason
as a sentence with its number, the attempt against the class median as two bars,
the telemetry for that attempt (edit bursts, idle gaps, the paste with its size,
compiles, runs, hints — with time offsets), and the full conversation for that
question. Nothing is inferred about intent and no row says a student did anything.

### D22 · Demo-only affordances exist, and say so on screen
**Why:** walking a panel through the product means reaching a struggling state
fast, and typing wrong C++ live is dead air.
**Consequence:** each question carries three code states (partial, struggling,
working) and the questions a student plausibly asks at each. The student view
exposes them in a panel with a dashed border reading **Demo controls · not part of
the product**, and every fill raises a toast saying "demo only". It is declared on
screen for the same reason the DEMO DATA badge is: a panel that finds undeclared
help stops believing the rest.

### D23 · The Overview has two modes, and Concepts is one of them
**Why:** the class heatmap is 47 rows by 8 columns. It is the right screen for
someone who already knows what they are looking for, and the wrong one to open a
defence on. Meanwhile the Concepts screen held the only class-scale pictures in
the product, one nav item away from the numbers they explain.
**Consequence:** the Concepts tab is gone; the nav is six items. Overview carries
an **Easy / Complex** switch:
- **Easy** is the section and its labs as pictures — class mastery over the labs
  with both estimates and the gap shaded, concept strength weakest-first with the
  0.35 threshold marked, and per-lab outcome bars with median time and withheld
  counts. Picking a concept opens the old Concepts detail in place, full width:
  distribution, mean per lab, students below threshold, suggested action.
- **Complex** is the heatmap exactly as it was.

The attention panel and the live strip sit beside both, because "correct
submissions, low verified mastery" is the point of the screen in either mode.

The class trend carries a second switch: **whole section** or **the six to
review**. Across 47 students the two estimates separate by about 0.06 and a
section mean hides the effect; across the six it is 0.82 against 0.35. Both
readings are true, and the control says which one is on screen rather than
quietly showing the flattering one.

The chosen mode persists like projector mode, and `?demo=1` returns it to easy so
a walkthrough always starts on the same screen. `/instructor/concepts` redirects
to the Overview rather than 404ing.

### D24 · The assistant panel comes back in full, with the harness attacks on it
**Why:** the model picker, the three system-prompt presets and the retrieval and
profile selectors were hidden behind the PoC-lite flag, so the panel that makes
the baseline argument was invisible in the default build. And the attacks that
produce leakage lived only in `spike/attacks.json`, which means the claim could be
read in a terminal but never shown in the product.
**Consequence:** the baseline panel shows the ask field, the model picker, the
three presets — plain (what students use), tutoring, hardened — and the editable
system prompt in both UI modes. A **Leakage probes** strip carries six tactics
verbatim from the harness: B0 benign, A1 direct demand, A2 false authority, A4
pseudocode in exact C++ syntax, X3 another language, X10 split into harmless
facts. Only the problem-agnostic strings are surfaced, so they read correctly on
any question, and the panel names its source so a reply can be put next to
`docs/EVIDENCE.md`.

The same probes fire in scaffold mode, where they are treated as a request for the
finished answer. That is the contrast worth showing: the phrasing never reaches
the level decision — a policy makes that from the knowledge state — and the
guardrail then measures what came back. X3 on the successor question returns
`Level 4 was withheld / similarity 0.78 > 0.60`, and the same request against the
baseline is answered as written.

### D25 · The baseline panel is two prompts, a model, and a box
**Why:** the panel had grown a prompt dropdown, a retrieval selector, a profile
selector and three presets. Every extra control is a thing to explain in a room,
and only one comparison is actually being made.
**Consequence:** the assistant panel is the ask field, the model picker, and two
presets — **Baseline prompt** (what students use today) and **Hardened prompt**
(the best a prompt can do) — over the editable system prompt. The retrieval and
profile selectors are gone from the UI; both stay fixed at `none`, which is what
the plain-assistant condition is. `prompts.json` keeps the middle tutoring prompt
for the spike, which still measures all three.

The baseline shows **no levels at all**, including on turns the scaffold tutor
wrote earlier in the same conversation. A level is a disclosure decision, the
baseline makes none, and showing one there would blur the only difference the
comparison exists to demonstrate.

### D26 · Mid 1 telemetry client and local test server (2026-10-11)
**Why:** validating real IDE telemetry capture, transport buffering, retry semantics,
and load characteristics requires a working telemetry client and a test recipient.
**Decision:** for the Mid 1 telemetry work only, the rules "no backend" and
"never fetch" in `docs/TASKS.md` and `docs/POC-ARCHITECTURE.md` section 6 are lifted
for the telemetry client and a local test server.
**Consequence:** all other rules stay in effect (no database, no auth, no external
backend services, student code and chat text remain strictly excluded from telemetry).
The old rules themselves remain unchanged for everything outside this scope.

