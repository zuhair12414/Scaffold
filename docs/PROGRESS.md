# Build log — frontend backlog

One line per task, newest last. `docs/TASKS.md` is the specification; this file
records what was actually built and how it was checked. Keep it short.

| Task | State | Checked by |
|---|---|---|
| F0 · shell and role switch | done | routes render, role switch works |
| F1 · mock data layer | done | `window.__mock`, identical across reloads |
| F2 · instructor overview | done | stats, heatmap, attention, live strip |
| F3 · labs & manuals | done | create lab, upload manual, policy sliders |
| F4 · student detail | done | divergence chart, bars, timeline, code viewer |
| Theme pass (D13/D14) | done | one dark token set for both roles, lint + build |
| F5 · submissions browser | done | filter, sort, expand, CSV export |
| F6 · concepts view | done | histogram, trend, below-threshold list |
| F7 · hint audit | done | blocked-only filter, expanded evidence |
| Roster page | done | search, status filter, row opens student |
| F8 · student IDE polish | done | ladder, mastery bars, telemetry notice |
| F9 · demo mode | done | `?demo=1`, reset button, `docs/DEMO-SCRIPT.md` |
| F10 · projector legibility | done | 1366x768 and 1280x720 sweep, projector mode |

## Conventions these pages share

- Derived numbers come from `src/instructor/selectors.ts`. Screens do not
  recompute means; if a figure appears twice it is the same function.
- Display formatting is `src/instructor/format.ts`. The dataset keeps full
  precision (D14).
- Every colour is a token from `:root` (D13). No hex in a component.
- Vocabulary follows `docs/GLOSSARY.md`: attention, review, assistance,
  disclosure. Never cheat / flagged / suspicious.

## Checked on 2026-09-11

Commands: `npx tsc -b` (clean) · `npm run build` (✓ 1292 modules) · `npx oxlint`
(2 warnings, both pre-existing: a fast-refresh note on `CourseState.tsx` and a
`setState`-in-effect note on `StudentIde.tsx`).

Click-throughs, all at 1366x768 and the heatmap again at 1280x720 with projector
mode on, no console errors on any screen:

- Overview: sorting by *successor* reorders rows ascending (0.38, 0.46, 0.47…);
  clicking a row opens that student.
- Student detail: for #31 the two series separate after Lab 4 and stay apart;
  the timeline shows the Lab 5 paste marker; a submission opens in the viewer.
- Submissions: filtered to Lab 5, sorted by time on task ascending, the fastest
  attempt (#31, 10 min, 6/6) expands to code, test run and a withheld Level 2 hint.
- Concepts: *successor* shows the histogram with a red low tail, the lab trend,
  and 8 students below 0.35.
- Hint audit: withheld-only leaves 40 of 235 rows; expanding one shows the level,
  the measured similarity, the threshold and the withheld text.
- Labs: Lab 5, max level 2 and threshold 0.45, *Use in student view* — the student
  pane then reads *Hints capped at Level 2* and the ladder marks Levels 3 and 4
  capped by the instructor.
- Student IDE: Levels 1-3 release one at a time; Level 4 comes back withheld with
  `similarity 0.85 > 0.60`; Level 5 is marked instructor-only.
- `?demo=1` drops a planted leftover lab and returns the seeded state.

## Flow completion pass — both roles end to end

Every affordance now leads somewhere. What was dead before and works now:

| Was | Is |
|---|---|
| Manual link went to `#manual-id` | Opens a viewer: seeded reference text, or the bytes of a file uploaded this session; the instructor gets the same viewer from the manual card |
| Student had one lab, chosen by the instructor | Student has their own lab list; a lab the instructor pushes still wins |
| Every lab used the factorial ladder, tests and diagnostic | Each of the six labs has its own examples, constraints, five-level ladder, reference solution, tests and compiler signal (D18) |
| No way to submit | Submit in the header; attempts appear in the student's own history and in the console, marked *this session* |
| Hints withheld in the IDE never reached the audit | Every assistance request is written to Hint Audit with its level, measured similarity and decision |
| Submissions screen had no summary | Stat strip on Submissions, per-lab statistics on Labs & Manuals, an attempt summary on Student detail |
| Labs could only be created | Status can be changed and a lab removed, both reversible by Reset demo |
| Test results hidden in the default view | The product tutor shows tests and the plain-English diagnostic; the bare output stays with the baseline condition |

Checked: Lab 1 run shows its own bounds warning and its own six tests; Lab 5 run
shows `no node is ever unlinked or freed`; the Lab 5 tutor opens on the BST
question, not the factorial one; submitting the starter code files a 0/6 attempt
that appears in Submissions as *this session*; a hint request appears in Hint
Audit at similarity 0.00 against the 0.60 threshold; setting Lab 5 to draft removes
it from the student's lab list; `?demo=1` restores everything.

## Known limits — say these out loud rather than hide them

- A lab authored in the console borrows the built-in problem's hint ladder, tests
  and reference solution. The six seeded labs each have their own (D18).
- The compiler, the tests and the knowledge tracing are mocked. The guardrail is
  not: it measures real token overlap against the reference solution (D15).
- Overview, Roster and Concepts read the seeded dataset only; attempts submitted in
  this session appear on Submissions, Student detail and Hint Audit.
- Session timelines are evenly spaced markers, not real timestamps on a scale.
- Numbers on every screen are seeded demo data. The measured numbers live in
  `docs/EVIDENCE.md` and come from `spike/`.
