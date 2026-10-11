# Decision log

Append-only. Newest at the bottom. One entry per decision that would be
expensive or confusing to reverse silently.

Format:

```
## YYYY-MM-DD — <short title>
**Decision:** what was decided
**Context:** what forced the choice
**Alternatives:** what was rejected, and why
**Consequences:** what this now constrains
**Status:** accepted | superseded by <entry> | revisited
```

---

## 2026-09-09 — Project framing fixed
**Decision:** Scaffold releases graded hints, never answers. Pedagogical harm
is treated as a first-class failure mode alongside data harm.
**Context:** Initial scoping.
**Alternatives:** A conventional code-explanation assistant — rejected because
it optimises for resolving frustration rather than for learning.
**Consequences:** Any component that can emit a working solution needs a
guardrail. Evaluation cannot use completion time as a primary metric.
**Status:** accepted

## 2026-09-09 — Research direction set to competence estimation under AI mediation
**Decision:** Scaffold's research contribution is estimating a student's
*unaided* competence from process evidence gathered during LLM-mediated lab
work, validated against a proctored AI-free assessment, with adaptive hint
gating as the application. Target deployment: C++ Data Structures.
**Context:** Literature sweep (`01-research/lit-review/00-gap-analysis.md`).
The obvious framings were already occupied — AI-code detection is discredited
(Orenstrakh 2023), instructor visibility of AI use is taken (Editrail 2026,
meta-reflective dashboards 2026), and uniform guardrails are done
(CodeHelp 2023, CodeAid 2024, CodeGuard 2026).
**Alternatives:** (B) re-validating pre-LLM process metrics under AI mediation
— kept as fallback; (C) locating the productive-struggle window — rejected as a
study rather than a system.
**Consequences:** The project now needs a proctored AI-free assessment paired
to lab sessions, ethics approval, and instructor cooperation. Without the
paired assessment there is no validation and the contribution collapses to a
dashboard. Baseline to beat is standard BKT over submission correctness.
**Status:** accepted, pending the four falsification checks in gap analysis §4

## 2026-09-09 — Selection criterion corrected after reading the FYP handbook
**Decision:** The 2026-09-09 research direction (competence estimator validated
against a proctored AI-free post-test) is **not withdrawn as research**, but is
rejected as the FYP's primary shape. Direction now: an in-editor comprehension
**verification control loop** — which AI-derived fragment to probe, when, with
which probe class, robust to the student outsourcing the probe itself, with an
auditable record. See `01-research/lit-review/01-gap-analysis.md`.
**Context:** The FAST FYP Handbook (3rd ed., 2026) requires ~45% implementation
by FYP-1 Week 15, a live POC at Week 4, and rejects "Core-Replacement" projects
where an external API solves the CCP. It names the "Jupyter Notebook FYP" as a
weak pattern — which is the shape of an offline estimator scored against a
post-test. The earlier direction also depended on ethics approval and
instructor cooperation as a single unmitigated point of failure.
**Alternatives:** Pass-1 estimator direction (retained as FYP-2 / publication
track); pre-LLM process-metric revalidation (retained as fallback).
**Consequences:** The hint taxonomy in `ARCHITECTURE.md` becomes a subsystem of
the same control loop rather than the project's centre. Program analysis on
incomplete, non-compiling C++ becomes a core technical risk and a core source
of depth-of-knowledge credit. A false outsourcing flag is now an ethical
hazard the design must address explicitly.
**Status:** provisional — conditional on reading "Refuting LLM-generated Code
with Reactive Task Comprehension" (ITiCSE 2025) and on the Week-4 POC result

## 2026-09-09 — Team's research question adopted; my pass-2 direction withdrawn
**Decision:** The project keeps the team's existing research question
(knowledge-state-conditioned adaptive scaffolding vs student-model-blind LLM
assistance, per `06-writing/defense/scaffold_fyp_master_defense_document_sidecar.md` §1.2). The
verification-control-loop direction proposed in `01-gap-analysis.md` is
withdrawn as a competing project and retained only as an optional active-probe
component inside the existing architecture.
**Context:** The team's literature sweep (~70 papers) is deeper in knowledge
tracing and pedagogical alignment than either of my passes, and had already
identified and characterised the closest competitor (ClassAid, CHI'26) more
precisely than I did. See `01-research/lit-review/02-rq-assessment.md`.
**Alternatives:** My pass-1 estimator direction and pass-2 verification gate,
both rejected as weaker.
**Consequences:** One substantive amendment is required, not optional: the
telemetry-enriched DKT claim must be reframed from "does behavioural signal
improve mastery-prediction AUC" to "does behavioural signal preserve mastery
validity when submissions are AI-mediated". Without it the KT engine raises
mastery for vibe-coding students and withdraws support from them — the
mechanism inverts under the project's own problem statement.
**Status:** accepted
