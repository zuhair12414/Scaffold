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
  disclosure. Do not use accusatory labels.

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
| A closed lab still accepted work | A closed lab says so and stops collecting attempts; it can still be read and asked about |

Checked: Lab 1 run shows its own bounds warning and its own six tests; Lab 5 run
shows `no node is ever unlinked or freed`; the Lab 5 tutor opens on the BST
question, not the factorial one; submitting the starter code files a 0/6 attempt
that appears in Submissions as *this session*; a hint request appears in Hint
Audit at similarity 0.00 against the 0.60 threshold; setting Lab 5 to draft removes
it from the student's lab list; `?demo=1` restores everything.

Frontend integration pass on 2026-09-11: live course state now flows through the
shared instructor selectors. Checked in the browser by creating a local lab,
opening it in the student view, submitting an attempt, and confirming the same
session row appears in Submissions and Settings. A student hint request on that
lab also appears in Hint Audit as *this session*. A route sweep at 1366x768 and
1280x720 covered Student, Overview, Roster, Labs & Manuals, Submissions,
Concepts, Hint Audit and Settings; all rendered dark with no document-level
horizontal overflow.

## UI pass — what was rough and what changed

- **Labs & Manuals** was three cards about the selected lab scattered around a
  create form. It is now browse / inspect / create: the list, then everything about
  the selected lab in one column (statistics, status, manuals, policy), then the
  authoring form. The policy sliders also read *that lab's* policy — they used to
  show defaults unless the lab happened to be the one in the student view.
- **Concepts** cards stretched to unequal heights with charts floating in them. The
  charts now fill their cards, the suggested action is read first rather than last,
  the count axis uses whole students, and the low bins are the same amber drawn
  quieter with the threshold marked — red stays reserved for harm or blocked.
- **The class heatmap** clipped its eighth concept at 1366 and shouted truncated
  headers. Columns are flexible, the headers use each concept's own short name, and
  all eight fit without an inner scroll.
- **Session timeline** dots had no legend. They do now.
- **Submissions** stat strip wrapped six tiles into five and an orphan.
- **Actions were silent.** Creating a lab, attaching or removing a manual, changing
  a status, pushing a lab to the student view, exporting CSV, submitting an attempt
  and resetting the demo all confirm in a corner toast.
- **Keyboard focus** was invisible on most controls; every interactive element now
  has a visible focus ring.
- Smaller: the withheld-only toggle rendered stacked and shouting, the hint policy
  line called Level 4 a cap when it caps nothing, the ladder footnote was too faint
  to read, and long examples clipped instead of wrapping.

## Questions, evidence and demo rails

- **Lab 5 is written out as three questions** (D20). The left pane is an accordion:
  one question open, the others collapsed, each showing whether it is passing. The
  editor, the run output and the conversation all follow the question.
- **The conversation is per question and is never deleted.** Seeded history exists
  for every student on every question; anything said in this browser is appended to
  it and is what the instructor reads.
- **Submissions are per question**, so the console counts 329 attempts rather than
  235, and each question has its own pass rate and median.
- **"Low verified mastery"** is a chip on the row and a verdict in the expansion
  (D21): the reasons as sentences, this attempt against the class median as bars,
  the telemetry log with offsets and the paste size, and the whole conversation.
  21 of the 329 seeded attempts meet the rule.
- **Labs & Manuals shows each question** with attempts, passing, median, withheld
  and a one-line insight.
- **Demo controls** in the student pane fill the editor with a partial, struggling
  or working state and drop a stage-appropriate question into the tutor box. They
  are fenced in a dashed panel reading *not part of the product* (D22).

## Known limits — say these out loud rather than hide them

- A lab authored in the console borrows the built-in problem's hint ladder, tests
  and reference solution. The six seeded labs each have their own (D18).
- The compiler, the tests and the knowledge tracing are mocked. The guardrail is
  not: it measures real token overlap against the reference solution (D15).
- Overview, Roster, Concepts, Submissions, Student detail and Hint Audit all read
  the live browser-session rows layered over the seeded dataset.
- Session timelines are evenly spaced markers, not real timestamps on a scale.
- Numbers on every screen are seeded demo data. The measured numbers live in
  `docs/EVIDENCE.md` and come from `spike/`.

## Student task selector pass

- The student problem pane now has an explicit task selector for instructor labs:
  a dropdown plus an openable lab-task list. Selecting a row opens that lab's
  statement, starter code, manuals, concept strip and attempt history.
- The editor workspace, output panel, hint cards and submit state are keyed per
  selected lab, so switching tasks does not carry a previous lab's code or output
  into the next task.
- The header submit action now names the active lab, for example `Submit Lab 5`,
  and continues to store the attempt against that selected lab.
