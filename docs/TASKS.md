# Backlog — build the Scaffold frontend

**Goal: a complete, clickable, demo-ready frontend.** Two apps behind one shell —
a **student IDE** and, most importantly, a **full instructor dashboard**. Every
service is mocked behind an interface. No backend, no database, no real model
required to run or demo it.

> **Scope note.** `spike/` already carries the empirical evidence (leakage
> harness, results, charts). **Do not touch it.** These tasks build the
> *product* — the thing that gets clicked through in front of a panel.

State of the build: `docs/PROGRESS.md`. Walkthrough: `docs/DEMO-SCRIPT.md`.

Rules for any agent working here:
1. **One task per change set.** Do not batch.
2. Run the Definition of Done yourself. It is always *"open the app, click this,
   see that"* — paste what you saw.
3. All data comes from `src/mock/`. **Never fetch, never call a model** in these
   tasks. The seams for real services already exist (`docs/POC-ARCHITECTURE.md`).
4. Vocabulary is fixed by `docs/GLOSSARY.md`. **Never** write `cheat`,
   `flagged`, `suspicious` — in UI, logs, comments or variable names.
5. Numbers shown in the UI are **mock data** and must look plausible, not
   flattering. See `docs/EVIDENCE.md` for tone.

Legend: **P0** demo fails without it · **P1** demo is weak without it ·
**P2** polish.

---

## Decisions already made — do not re-open

| Choice | Use this |
|---|---|
| Routing | `react-router-dom` v7 |
| State | React Context + `useReducer`. No Redux, no Zustand |
| Charts | **Hand-written inline SVG.** No chart library — you must be able to explain every pixel |
| Styling | Plain CSS in `src/styles.css` + CSS variables. No Tailwind, no UI kit |
| Icons | Inline SVG only |
| Persistence | `localStorage` for uploads and settings. Nothing else |
| Fake latency | 200–600 ms on every mock call, so loading states are real |

**Palette** — **dark, one theme for both roles** (D13). Never hard-code a colour:
read the tokens in `:root` (`src/styles.css`), which `basic.css` re-points for
PoC-lite. `--base` ground · `--raised` cards · `--border` hairlines ·
`--border-strong` controls · `--text` / `--muted` / `--faint` type ·
`--accent` · `--warn` amber · `--fail` red · `--pass` · `--info` · `--tint` hover.
Semantics are fixed: accent = *estimated from correctness*, amber = *adjusted for
how the work was done* and every mastery figure, red = harm or blocked, nothing
else. The deck's light palette (paper/ink/`#0F4C81`) is retired — do not restore it.

---

## F0 · App shell and role switch — **P0, ~3 h**

Turn the single-screen app into a two-role product.

- `react-router-dom`; routes `/student/*` and `/instructor/*`
- A role switcher in the header (demo affordance — label it *Demo: view as*)
- Persistent left nav for the instructor: Overview · Roster · Labs & Manuals ·
  Submissions · Concepts · Hint Audit · Settings
- Keep the existing student IDE working, mounted at `/student`

**DoD:** `npm run dev`, switch role in the header, land on the instructor
Overview, navigate to every nav item without a crash or a blank screen.

---

## F1 · Mock data layer — **P0, ~4 h**

Everything else depends on this. Make it good and the rest is presentation.

Create `src/mock/` with a **seeded** generator (fixed seed — the demo must look
identical every run):

- **8 knowledge components** for CS2 Data Structures:
  array & pointer basics · linked-list traversal · recursion base case ·
  BST invariants · in-order successor · pointer reassignment & free ·
  iterator invalidation · complexity reasoning
- **47 students**, pseudonymous (`Student #03` … `Student #47`)
- **6 labs**, each with a title, 2–4 KCs, a due date, a problem statement
- Per student per lab: **submissions** (code text, timestamp, tests passed/failed,
  compile ok/fail), a **session timeline** (edit bursts, idle, paste, compile,
  run, hint shown), and a **hint history**
- Per student per KC: a **mastery trace** — value 0–1 **plus an uncertainty
  band**, one point per lab
- **Two mastery series per student**: `correctnessOnly` and `telemetryAdjusted`.
  For ~6 students make these **diverge** after lab 4 (correctness climbs, adjusted
  stays flat) — this is the story the whole product exists to tell
- Types in `src/types.ts`, strict, no `any`

**DoD:** `npm run dev`, open the browser console, `window.__mock` (expose it in
dev only) shows the full dataset. Reload twice — identical values.

---

## F2 · Instructor Overview — **P0, ~5 h**

The landing screen. Should be readable from across a room.

- **Stat row:** students in section · struggling now · *correct submissions, low
  verified mastery* · class mean mastery on the weakest KC · labs graded
- **Class concept heatmap:** students (rows) × 8 KCs (columns), cell = mastery,
  colour-scaled. Sortable by any KC. Click a row → student detail (F4)
- **Attention panel:** the ~6 divergent students, each with the gap between the
  two estimates. Header wording: *"Correct submissions, low verified mastery"*
- **Live strip:** who is active in the current lab, with a struggle badge

Empty states must exist and read like sentences, not `No data`.

**DoD:** Overview loads with all four regions populated; sorting the heatmap by
*in-order successor* reorders rows; clicking a row opens that student.

---

## F3 · Labs & Manuals — upload — **P0, ~4 h**

The instructor authoring flow. This is the piece the panel will ask to see.

- Lab list with status (draft / open / closed), due date, submissions count
- **Create lab** form: title, statement (textarea, markdown preview), KC
  multi-select from the 8, due date, starter code
- **Upload manual**: drag-and-drop for `.pdf` / `.md` / `.docx`. Show filename,
  size, upload progress, then a file card with remove. Store metadata in
  `localStorage`, keep the file in memory — **do not parse it**
- Uploaded manuals attach to a lab and appear in the student's problem pane as a
  *Reference material* link
- **Disclosure policy per lab:** max hint level (slider 1–4), guardrail
  similarity threshold (slider), toggle *allow student to request escalation*

**DoD:** create a lab, drag a PDF onto it, see the file card, set max level to 2,
switch to `/student`, see that lab with the manual linked and hints capped at 2.

---

## F4 · Student detail — the money screen — **P0, ~6 h**

Where the project's thesis becomes visible. Spend your best effort here.

Header: pseudonymous ID, section, labs completed, current status badge.

Four regions:
1. **Mastery over time** — line chart, one series per KC (toggle chips). For a
   divergent student, show **both** series: `correctnessOnly` in accent and
   `telemetryAdjusted` in amber, with the gap shaded and annotated
   *"estimated from correctness"* vs *"adjusted for how the work was done"*
2. **Concept bars** — 8 KCs, current value, **uncertainty band rendered as a
   hatched region**, sorted weakest first
3. **Session timeline** — horizontal track per lab: edit bursts, idle gaps, paste
   events, compiles, hints shown. Hover → tooltip with the event
4. **Submissions list** — each row: lab, timestamp, tests passed, time on task.
   Click → code viewer (read-only Monaco) with the test output beside it

**DoD:** open a divergent student — the two series visibly separate after lab 4,
the gap is annotated, the timeline shows paste events, a submission opens in the
code viewer.

---

## F5 · Submissions browser — **P1, ~4 h**

Cross-student view for grading and spot-checks.

- Filter by lab, status, tests passed, time-on-task
- Sort by any column
- Row expands to code + tests + hint history for that attempt
- Bulk export to CSV (client-side blob download)

**DoD:** filter to one lab, sort by time on task ascending, expand the fastest
submission, see its code and hint history.

---

## F6 · Concepts view — **P1, ~3 h**

Per-KC rather than per-student.

- Pick a KC → distribution of mastery across the section (histogram)
- Which labs exercise it, class mean over time
- *"Students below 0.35"* list
- A one-line suggested action, e.g. *"weakest concept in section; 68% of
  assistance requests in the last lab"*

**DoD:** select *in-order successor*, see the histogram, the trend and the list.

---

## F7 · Hint Audit — **P1, ~3 h**

Makes the guardrail visible. Strong differentiator on the day.

Table of every hint event: student, lab, timestamp, **level released**, whether
it was **blocked**, and the reason (`similarity 0.71 > 0.60`). Filter by blocked.
Expand → the prompt context summary and the text that was shown, or the text that
was withheld.

**DoD:** filter to blocked-only, expand one, see the level, the measured
similarity and what was withheld.

---

## F8 · Student IDE polish — **P1, ~4 h**

The existing IDE, finished.

- Mastery sidebar with uncertainty bands (same component as F4 region 2)
- Hint panel showing the **ladder**: released levels expanded, next level locked
  with its unlock condition, blocked level shown as blocked with the reason
- A small, honest telemetry indicator: *"this session is being recorded for your
  progress estimate"* with a link to what is collected
- Problem pane shows attached manual from F3

**DoD:** in `/student`, request hints until level 2 releases, see level 3 locked
with its condition and level 4 blocked by the guardrail.

---

## F9 · Demo mode — **P1, ~2 h**

A defence runs on rails. Build them.

- `/instructor?demo=1` seeds a fixed, known-good state
- A `Reset demo` button in Settings
- A scripted path documented in `docs/DEMO-SCRIPT.md`: Overview → attention panel
  → divergent student → timeline → submission → hint audit → student IDE
- Every screen loads in under a second

**DoD:** follow the scripted path start to finish without a dead end, an empty
state or a console error.

---

## F10 · Responsive + projector legibility — **P2, ~2 h**

Base font ≥ 15 px, heatmap readable at 1280×720, no horizontal scroll at 1366
wide (wide tables scroll inside their own container), light-on-dark with real
contrast. Test at the resolution of the room's
projector, not your laptop.

**DoD:** at 1366×768 every screen is usable and nothing is clipped.

---

## Build order

```
F1 mock data  ──►  F0 shell  ──►  F2 overview  ──►  F4 student detail   [P0 core]
                                   │
                                   ├──►  F3 labs & manuals              [P0]
                                   ├──►  F5 submissions   ├──► F7 audit [P1]
                                   ├──►  F6 concepts      └──► F8 IDE   [P1]
                                   └──►  F9 demo mode ──► F10 polish    [P1/P2]
```

Do **F1 first** even though F0 is smaller. Everything renders mock data; getting
the shape right once saves rewriting every screen.

---

## Out of scope

Backend · database · authentication · real compiler · real model calls · file
parsing of uploaded manuals · knowledge-tracing implementation · websockets ·
anything in `spike/`.

When a task tempts you toward one of these, **mock it and move on** — the seams
in `docs/POC-ARCHITECTURE.md` are there so the real service drops in later
without a rewrite.

---

## Honesty in the UI

The screens display **mock data**. Keep a small, permanent
`DEMO DATA` badge in the header. Do not remove it for the defence — a panel that
spots undeclared fake data will doubt everything else, and a visible badge costs
nothing.
