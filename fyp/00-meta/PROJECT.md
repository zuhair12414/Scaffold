# Scaffold — project definition

_Owner: Ahmed. Status: draft. Fill the TODOs as they get decided._

## One-line

An adaptive tutor for programming labs that reads student code, estimates
understanding, and releases graded hints instead of answers.

## The problem

In a programming lab, a student who is stuck has three realistic options: wait
for a TA, ask a peer, or paste the problem into a general-purpose LLM. The
first does not scale, the second is uneven, and the third hands over a working
answer — which resolves the frustration and removes the learning at the same
time.

The gap is a helper that is available at lab scale but is *constrained* to help
in a way that preserves the struggle that produces learning.

## What success looks like

Not "students finish faster." Faster completion is the failure signature of a
system that gives answers. Candidate success criteria — pick and defend a
subset:

- Students reach a working solution with fewer hint levels consumed over time
  (evidence of transfer, not dependence).
- Performance on a later unaided task is at least as good as a control group's.
- Hint level released matches an independent grader's judgement of what the
  student needed.
- Students report the help felt fair rather than either useless or patronising.

TODO: commit to primary and secondary metrics before the first user study.

## Scope

**In scope (research + prototype phase)**
- Static and lightweight dynamic analysis of student submissions
- A knowledge/understanding estimate per student per concept
- A hint taxonomy with defined escalation levels
- A policy mapping (code state, understanding estimate) -> hint level
- Offline evaluation against recorded or synthetic student trajectories

**Out of scope for now**
- Grading or assessment of record
- Multi-language support (pick one language first — TODO)
- LMS integration
- Real-time collaboration or TA dashboards

**Explicit non-goals**
- Detecting cheating or policing academic misconduct
- Replacing TAs
- Producing correct solutions for students

## Users and stakeholders

- **Student** — wants to get unstuck, does not want to feel judged.
- **Instructor / TA** — needs to trust the tutor is not undermining the lab.
- **Institution** — cares about data handling and academic-integrity posture.

## Constraints

- Single-semester FYP timeline; research and prototyping first.
- Ethics approval likely required before any study with real students. TODO:
  confirm the process at NUST and the lead time.
- Must degrade safely: if the understanding estimate is uncertain, the system
  gives the weakest hint, not the most helpful one.

## Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Understanding estimate is unreliable | The whole premise rests on it | Evaluate the estimator on its own before evaluating the tutor |
| Hints leak the solution indirectly | Destroys the learning outcome | Adversarial review of hint templates; test with a "solution reconstruction" attack |
| No access to real student data in time | Blocks evaluation | Build synthetic trajectory generator early |
| Scope creep into a full LMS product | Timeline | Keep non-goals list current |

## Open questions

See `OPEN-QUESTIONS.md`.
