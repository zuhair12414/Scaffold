# Research context — why this project exists

This repo is self-contained on purpose. An agent should not need the FYP
research folder to understand what is being built or why.

---

## The problem

Undergraduate programming labs show a pattern the team calls **vibe coding**:
students paste the lab task into an AI assistant and submit the returned code.
This displaces the productive struggle that produces skill, and it is invisible
to the instructor, who sees only a correct submission.

Target deployment: **CS2 Data Structures, C++**, 40–60 students per lab section.

## The thesis

> To give a student the right amount of help you must know what that student
> knows. Every student model infers that from **submission correctness** — and a
> student who delegates submits **correct code they do not understand**.

The measurement is broken, so everything built on it is broken. That includes
every adaptive tutor: raise a delegating student's mastery estimate and the
system gives them *less* help, which is the opposite of what they need.

## Why standard knowledge tracing cannot express this

Bayesian Knowledge Tracing has four parameters per knowledge component: prior,
transit (learn rate), **slip**, and **guess**. The only parameter that can
explain "correct without mastery" is **guess** — and it is a **per-KC
constant**, identical for every student on every opportunity.

Delegation is behaviourally a **per-opportunity guess rate near 1.0**. BKT has
no parameter capable of varying per opportunity, so it attributes the correct
answer to mastery. **This is a structural limit of the model class, not an
implementation bug** — which is why simply picking a better KT model does not
fix it.

**Our two proposed fixes**
- **A · context-conditioned emission** — replace the constant with
  `P(G | f_t) = σ(β₀ + βᵀf_t)`, where `f_t` is the telemetry feature vector for
  that submission. Exact Bayesian updating is preserved; one emission parameter
  becomes observation-dependent. Interpretable, defensible in a viva.
- **B · input augmentation** — append `f_t` to the DKT input vector and let the
  network learn the discount. More expressive, less interpretable.

Build both. The gap between them is a result.

**Known result from our own simulation** (see `docs/EVIDENCE.md` §C for status):
conditioning the *guess* parameter removes roughly 60% of the inflation. The
residual comes from BKT's **transit** term, which keeps applying learning even
after the evidence has been discounted. The learning parameter must be gated too.

## The gap in the literature

| Family | Representative work | What it does not do |
|---|---|---|
| Guardrailed tutors | CodeHelp (Koli '23) · CodeAid (CHI '24, n=700) | Same hint to every student; neither measured learning — CodeAid reports usage and perceptions only |
| Instructor-in-the-loop | ClassAid (CHI '26, n=54) · Closing the Loop (SIGCSE '26) | No per-student model; an instructor switches one of four modes for the whole class |
| Programming knowledge tracing | DKT (NeurIPS '15) · Code-DKT (EDM '22) · CoTutor (2025) | Observes only correctness. CoTutor runs BKT for *AI-assisted* programming and never asks whether a correct submission still evidences mastery |
| AI-code detection | Orenstrakh et al. 2023 | Unreliable (52 FP / 114 human), defeated by paraphrase, adversarial to students |
| Prior FAST FYP | **Codio** (F25-323-D, Fall 2025) | Well built — Gemini VLM pause-to-code, Judge0 sandbox. But every AI feature *hands the learner code*, and its adaptivity is quiz difficulty from transcripts |

**Statement of the gap.** No deployed tutor calibrates disclosure from a live
per-student mastery state, and no student model has been validated under
AI-mediated submissions.

**Positioning line.** *Codio removes friction. We calibrate it.*

## What the spike has already established

Prompting alone fails in three distinct ways — all measured, see
`docs/EVIDENCE.md`:
1. **Residual leakage.** Hardening cuts runnable-solution leakage ~6× but never
   to zero.
2. **Mastery-blindness.** Told the student's mastery is 0.91 versus 0.18, the
   model gives the same help.
3. **Level variance.** Same question, same prompt, the disclosure level wanders
   between runs.

**(2) and (3) are the justification for this entire architecture.** They are why
the project is not "just prompt engineering", and they are the strongest thing
to put in front of an examiner.

## Ethical frame — binding on implementation

- The system **never accuses**. It surfaces evidence to a human.
- No misconduct flag, no report to any authority, no accusatory vocabulary in
  UI, logs or identifiers.
- Local models only in anything deployed; student code does not leave campus.
- Mastery estimates are never shared in a form that could influence grading.
- A false suspicion is real harm to a student and is treated as a design
  constraint, not an edge case.
