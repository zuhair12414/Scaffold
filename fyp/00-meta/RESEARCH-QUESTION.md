# Formal research question

_Derived from `01-research/lit-review/00-gap-analysis.md`. Read that first —
this document is only defensible on top of it._

---

## Framing sentence

Existing responses to LLM use in programming labs either detect **who wrote the
code** (unreliable and adversarial), visualise **what the student did**
(validated against instructors' judgement, not against learning), or constrain
**what the AI may say** (identically for every student, and bypassed most by
the students most at risk). None estimates **what the student can do without
the AI**, and none adapts its help to that estimate.

---

## Main research question

> **To what extent can a student's independent, unaided competence on
> data-structures concepts be estimated from process evidence collected during
> LLM-mediated programming lab work; and does conditioning the strength of
> tutorial assistance on that estimate yield better unaided competence than the
> uniform guardrails used by current AI teaching assistants?**

Two clauses on purpose. The first is a **measurement** question and is the
scientific core. The second is a **design** question and is what makes it a
development project. The first can succeed alone; the second cannot exist
without the first.

---

## Constructs, and how each is operationalised

Operationalise every one of these before writing code. An unoperationalised
construct is where this project would fail its viva.

| Construct | Definition used | Operationalisation |
|---|---|---|
| **Independent competence** | What the student can do on the concept with no AI and no hints | Score on a proctored, AI-free assessment on the same knowledge components, administered after the lab |
| **Knowledge component (KC)** | The unit competence is estimated over | A specified list for the C++ Data Structures course, e.g. pointer aliasing, linked-list traversal invariants, BST recursion base cases, iterator invalidation, complexity reasoning |
| **Process evidence** | Everything observable during the lab | Edit and keystroke stream, paste and completion-acceptance events, prompt text and timing, post-insertion modification, compile/test outcomes, latency and revision structure |
| **Delegation** | Obtaining a solution without the reasoning | Operational proxy: AI-derived code accepted with no subsequent semantic modification and no independent debugging |
| **Assistance strength** | How much a hint reveals | The level in the Scaffold hint taxonomy (`ARCHITECTURE.md`) |
| **Calibration** | Whether stated confidence matches reality | Expected calibration error of the competence estimate against unaided assessment outcomes |

**Explicitly not claimed:** that this measures "understanding". It measures
predicted unaided performance on named KCs. Say so in the report, repeatedly.

---

## Sub-questions

**RQ1 — Signal.**
Which features of an LLM-mediated programming session carry information about a
student's unaided competence on the underlying knowledge components, and how
much of that information survives when the student does not paste (i.e. when
provenance signals are unavailable or defeated by retyping)?

_Why it matters:_ if the answer is "only provenance features", Scaffold reduces
to Editrail and is defeated by a student who retypes.

**RQ2 — Estimator and its validity.**
Can a per-student, per-KC estimator built from those features predict unaided
assessment performance significantly better than (a) submission correctness
alone, and (b) a standard Bayesian knowledge-tracing model that treats a
correct submission as evidence of mastery? Is the resulting estimate
calibrated?

_Why it matters:_ baseline (b) is the specific published assumption this work
claims is broken (CoTutor, 2025). Beating it **is** the contribution. If a
plain BKT model predicts unaided performance just as well, the central premise
is wrong and you should say so and pivot to Alternative B.

**RQ3 — Adaptive policy.**
Does a tutor that gates hint strength on the RQ2 estimate produce higher
unaided post-test performance than (a) a uniform-guardrail tutor of the
CodeAid/CodeHelp type and (b) unrestricted LLM access, at comparable
task-completion cost?

**RQ4 — Distribution and robustness.**
Does estimator accuracy vary systematically with prior attainment — in
particular, does it degrade for the lower-attaining students whom the
optional-guardrail literature identifies as most likely to delegate? And how
much does accuracy fall under adversarial behaviour (a student retyping AI
output to appear to be working)?

_Why it matters:_ a competence estimator that is accurate only for students who
were already doing fine reproduces the widening gap in software. RQ4 is not
optional politeness; it is the condition under which the system is worth
deploying.

---

## Hypotheses

- **H1.** Features describing the *relationship* between AI-derived code and
  subsequent student action — modification depth, debugging independence,
  prompt abstraction level, latency before acceptance — predict unaided
  performance better than features describing code provenance alone.
- **H2.** A standard BKT model over submission correctness systematically
  **over-estimates** mastery for high-delegation students, and the size of that
  over-estimate increases with delegation.
- **H3.** Adaptive gating produces higher unaided post-test scores than uniform
  guardrails, with the effect concentrated in lower-prior-attainment students.
- **H4.** Adaptive gating produces slower task completion than unrestricted
  access. _State this in advance._ If completion time does not rise, it is
  weak evidence that the tutor is not actually withholding anything.

---

## What would falsify the project's premise

Write these down now so the result is interpretable either way.

1. Plain BKT over correctness predicts unaided performance as well as the
   process-based estimator → the contamination premise is wrong.
2. No feature set beats submission correctness → there is no signal, and the
   measurement question is answered negatively (still a publishable finding,
   and still an honest FYP).
3. Adaptive gating shows no advantage over uniform guardrails → personalisation
   does not pay for its complexity at this scale.
4. The estimator works only for students who were already competent → the
   system amplifies the gap and should not be deployed.

A project that cannot fail is not a research project. All four of these are
reportable outcomes.

---

## Study design sketch

**Phase 1 — instrumentation.** IDE plugin capturing the process evidence above
in a ProgSnap2-compatible schema, plus prompt/response logging. Deployed in one
C++ Data Structures section.

**Phase 2 — labelled corpus.** Lab sessions instrumented; each followed within
a short window by a proctored, AI-free assessment on the same KCs. That paired
data — process trace plus unaided outcome — is the dataset the field does not
have, and is arguably the contribution even if the estimator underperforms.

**Phase 3 — estimator.** Train and evaluate against the baselines in RQ2.
Report calibration, not just accuracy. Hold out by student, not by submission.

**Phase 4 — adaptive tutor.** Scaffold's hint policy conditioned on the
estimate; compare against uniform guardrails and unrestricted access.

---

## Scope for this FYP

| Phase | This year | Later |
|---|---|---|
| 1 Instrumentation | ✅ | |
| 2 Paired corpus | ✅ | Scale beyond one section |
| 3 Estimator + validation (RQ1, RQ2) | ✅ core contribution | |
| 4 Adaptive tutor (RQ3) | Prototype + small trial | Full deployment |
| RQ4 robustness | Adversarial retyping test | Fairness study at scale |

**Recommendation:** commit to RQ1 and RQ2 as the assessed contribution. Present
RQ3 as a demonstrated application, not as a claim. RQ3 with adequate power
needs more students than one section provides, and an FYP that over-promises on
the trial will be judged on the trial.

---

## Publication framing, if it works

The measurement result (RQ1–RQ2) targets ICER, Koli Calling, or SIGCSE. The
paired process-trace-plus-unaided-outcome corpus is independently valuable and
worth releasing. Title in the shape of: _"What can they do without it?
Estimating unaided programming competence from LLM-mediated process data."_

---

## Immediate next actions

1. Retrieve and read the unread dissociation paper (see gap analysis §1).
2. Run the four falsification checks in gap analysis §4 against SIGCSE/ICER
   2026 proceedings.
3. Confirm with the Data Structures instructor that a proctored AI-free
   assessment can be attached to lab sessions. **This gates everything.**
4. Start the ethics approval process. It is the long pole.
5. Fix the KC list for the course.
