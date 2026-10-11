# Gap analysis — where Scaffold can make a genuine contribution

_Compiled 2026-09-09. Sweep of the LLM-in-CS-education, AI-code-detection,
programming-process-analytics, and guardrailed-tutor literatures._

**Read this before committing to a research question.** The obvious framing of
the problem — "instructors cannot see AI use, so build a tool that shows them"
— is already occupied by at least three 2026 papers. The gap that survives is
narrower and better.

---

## 1. How this sweep was done, and its limits

Database-free search over arXiv, ACM DL, PNAS and journal sources, targeting
2023–2026. Papers were read at abstract-and-findings level, not in full. Three
consequences worth stating:

- Anything paywalled and not mirrored (notably some ACM DL full texts) was read
  from preprints or abstracts.
- One directly relevant paper could not be retrieved and remains **unread**:
  Kiesler-style work published as _"Less stress, better scores, same learning:
  The dissociation of performance and learning in AI-supported programming
  education"_ (Computers & Education: AI, 2025). The title alone suggests it
  may pre-empt part of the argument below. **Read it before the proposal goes
  to your supervisor.**
- ACM ICER / SIGCSE 2026 proceedings are only partly indexed at the time of
  writing. Re-run the sweep before submission.

---

## 2. The problem is established, not hypothesised

You do not need to argue that "vibe coding" harms learning. That is settled
well enough to cite, which means your contribution must be a *solution*, not a
demonstration of the problem.

| Finding | Source | Strength |
|---|---|---|
| Unguarded GenAI access improved practice performance +48% but **reduced unaided exam performance by 17%**; a guardrailed tutor version improved practice +127% with **no significant exam harm** (−0.4%) | Bastani et al., PNAS 2025, ~1,000 high-school students, RCT | Strong. The single best citation you have. |
| After only 10–15 minutes of AI assistance, participants solved fewer problems unaided (0.57 vs 0.73) and skipped more; d = −0.42 | "AI Assistance Reduces Persistence and Hurts Independent Performance", 2026, 3 RCTs, n=1,222 | Strong, but non-programming tasks |
| Struggling novices' metacognitive difficulties are **compounded** by GenAI; they end with an "illusion of competence"; strong students use it well | Prather et al., "The Widening Gap", ICER 2024, n=21, eye-tracking | Qualitative, small n, high credibility |
| >80% of students directly reused AI-generated solutions; 35.6% "Simple Delegation", 25.0% "Persistent Delegation" | "Tracing Prompt-Level Trajectories", 2026, 146 submissions / 662 prompts | Direct evidence of the vibe-coding pattern |
| Given an AI TA with a "See Solution" bypass, **half the cohort used it**, 14% on every problem; **lower-performing students bypassed more**, and near deadlines | "AI TAs with Optional Guardrails", 2026, n=885 | Strong, and load-bearing for your argument — see §4 |

Counter-evidence you must cite honestly: Kazemitabaar et al. (CHI 2023, n=69,
ages 10–17) found Codex access improved authoring **without** harming unaided
code-modification performance, and slightly helped retention — but the benefit
concentrated in students with stronger prior skill. The harm is not universal;
it is distributional. That is the real shape of the problem.

---

## 3. What has already been tried, and what each actually validated

This is the part that kills naive research questions. Note the last column.

### Family A — Detect whether AI wrote it

Orenstrakh et al. (2023) benchmarked eight detectors on 164 computing
submissions. GPTZero produced **52 false positives out of 114 human
submissions**. Average detection accuracy fell from 77% to 49% after
paraphrasing, and collapsed to 17.5% on Spanish-language submissions. Authors'
conclusion: not trustworthy for academic integrity.

> **Do not build a detector.** It is unreliable, it is adversarial toward
> students, it discriminates against non-native English speakers, and the
> field has already concluded it does not work.

### Family B — Make AI use visible to instructors

- **Editrail** (2026): VS Code extension logging keystrokes, Copilot/ChatGPT
  interaction and test runs; colour-codes each line as pasted-from-AI,
  autocomplete-accepted, or typed-but-AI-resembling. Lab study with 12
  instructors: 79% accuracy identifying AI usage vs 31% for a code+chat-log
  baseline. **Not deployed in a classroom. Does not estimate understanding —
  the authors list "assess students' understanding" as future work.**
- **Meta-Reflective Dashboard for Instructor Insight into Student-AI
  Interactions** (2026).
- **Learning Visibility Framework** (2026): argues explicitly that "AI misuse
  in education is a measurement problem", proposes three principles (specify
  valid use; value process as well as product; build transparent activity
  timelines). **Entirely conceptual — the authors state no implementation or
  empirical validation and call for exactly that.**

> Visibility of *provenance* is taken. Visibility of *competence* is not.

### Family C — Constrain what the AI will say (uniform guardrails)

- **CodeHelp** (Liffiton et al., Koli Calling 2023) — guardrailed LLM help for
  programming classes.
- **CodeAid** (Kazemitabaar et al., CHI 2024) — 700-student C/systems course,
  12 weeks, 8,000+ interactions. Guardrails: pseudo-code not code, line
  annotations, no multi-line code blocks. **Measured usage and perceptions
  only — explicitly not learning outcomes.**
- **CodeGuard** (2026) — taxonomy + 8,000-prompt dataset + fine-tuned RoBERTa
  "PromptShield", F1 0.93 vs 0.57–0.64 for GPT-4o/Claude/LLaMA Guard.
  **Classifies prompt safety. No classroom deployment; no student model.**

> Every one of these applies **the same guardrail to every student**. CodeAid
> gives pseudo-code to the student who has already reasoned it out and to the
> student who has understood nothing. This is the classic assistance dilemma,
> and in the LLM setting nobody has an adaptive answer to it.

### Family D — Model the student from process data

- Pre-LLM: ProgSnap2 (Price et al., ITiCSE 2020) standardised process data;
  error quotient, Watwin score, incremental-development metrics were validated
  as predictors of exam performance. **All of this was validated in a workflow
  where the keystroke stream was the student's own cognition.**
- **TutorTrace** (2026) — the closest existing work. 480 students, ~180,000 IDE
  telemetry events, 13,633 behavioural segments, 27 continuous metrics; infers
  behavioural states before / between / across AI queries. Behaviour-aware
  prompting cut the share of inter-query intervals containing no independent
  work from 50.0% to 20.7%. Predicts next query within 60s (AUROC .726) and
  help-seeking type (AUROC .717). **Validated against behavioural targets, not
  against learning. It classifies what the student is doing, not what the
  student knows.**
- **CoTutor** (2025) — Bayesian Knowledge Tracing + convex optimisation for
  AI-assisted programming education; 203 students plus EdNet benchmarking.
  **Updates mastery beliefs from submission verdicts. It does not address the
  fact that under AI assistance a correct submission is no longer evidence of
  student mastery.**

---

## 4. The gap

Three observations, which together define it.

**(i) Knowledge tracing rests on an assumption that LLM mediation breaks.**
Every student model — BKT, DKT, CoTutor — treats a correct submission as
evidence of mastery. When the student can obtain a correct submission by
delegation, that inference is invalid, and the model will report rising mastery
for a student who is learning nothing. No work in the programming-KT literature
corrects for this. The Widening Gap's "illusion of competence" is the human
version of the same error; the machine version has not been named.

**(ii) Every measurement instrument in this space is validated against a
proxy, never against learning.** Editrail is validated against instructors'
ability to spot AI use. TutorTrace against next-query prediction. Prompt-level
trajectories are descriptive, and notably found **no significant difference in
course grades** between delegation strategies. The Learning Visibility
Framework is unvalidated by construction. **Nobody has demonstrated that
anything observable during an LLM-mediated programming session predicts what
that student can do unaided.**

**(iii) Guardrails are uniform, and uniform guardrails fail precisely where
they are needed.** With an optional bypass, half of an 885-student cohort took
it, and lower-performing students took it more often. A guardrail that does not
know who it is talking to is either too strong for the strong student — who
routes around it — or too weak for the weak one.

> ### Statement of the gap
>
> There is no validated method for estimating a student's **independent,
> unaided competence** on specific programming concepts from evidence gathered
> **while that student is using an LLM**; and consequently no tutoring system
> that adapts the strength of the help it gives to that estimate. The field has
> instruments that measure code provenance and behavioural state, and tutors
> that apply one guardrail to everyone, but nothing connecting the two, and
> nothing validated against unaided performance.

### Why this is defensible as novel

- Editrail names "assess students' understanding" as future work.
- The Learning Visibility Framework names empirical validation as future work.
- CoTutor demonstrates the contamination problem by ignoring it.
- TutorTrace stops at behaviour and does not claim competence inference.

### What would falsify the novelty claim

Any of these, if found, forces a re-scope — check before the proposal:

1. A paper predicting **unaided post-test performance** from AI-mediated
   process data in programming.
2. A knowledge-tracing variant that conditions the mastery update on whether
   the submission was AI-derived.
3. A tutor whose guardrail strength varies per student from an inferred
   competence estimate (not from self-report or an instructor toggle).
4. The unread Kiesler-style dissociation paper, if it does the above.

---

## 5. Two safer alternative gaps, if the above proves occupied

**Alternative B — Re-validate classical process metrics under LLM mediation.**
Error quotient, Watwin, incremental-development metrics all predicted exam
performance in a pre-LLM workflow. Do they still? Almost certainly their
construct validity is degraded, and demonstrating *how* is a clean, tractable,
publishable result with a much smaller engineering burden. Weaker as a
development project — it produces a finding, not a system.

**Alternative C — Locate the productive-struggle window.**
Bastani shows guardrailed help does not harm. The persistence RCT shows help
arriving too readily harms within 15 minutes. Nobody has characterised *when*
help should arrive in an AI-available lab. Empirically rich, but it is a study
rather than a system, and fits an FYP badly.

Alternative B is the fallback. Keep it in reserve.

---

## 6. Honest weaknesses in the main direction

- **"Understanding" is a contested construct.** You will have to operationalise
  it as predicted unaided performance on specified knowledge components, and
  defend that reduction. Do not claim to measure understanding as such.
- **The validation study is the hard part, not the system.** It needs an
  unaided assessment, a cooperating instructor, and ethics approval. Secure the
  course access before committing.
- **Adversarial students defeat provenance signals** by retyping AI output.
  The Learning Visibility Framework concedes this. Your estimator must not rest
  on provenance alone — which is also what differentiates it from Editrail.
- **Small cohorts limit statistical power.** One Data Structures section may
  not be enough to detect a modest effect. Plan the power analysis early.

---

## 7. References gathered

Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025).
Generative AI without guardrails can harm learning: evidence from high school
mathematics. _PNAS_. https://www.pnas.org/doi/10.1073/pnas.2422633122

Prather, J., et al. (2023). The Robots Are Here: Navigating the Generative AI
Revolution in Computing Education. _ITiCSE-WGR_. https://arxiv.org/abs/2310.00658

Prather, J., et al. (2024). The Widening Gap: The Benefits and Harms of
Generative AI for Novice Programmers. _ICER_. https://arxiv.org/abs/2405.17739

Kazemitabaar, M., et al. (2023). Studying the Effect of AI Code Generators on
Supporting Novice Learners in Introductory Programming. _CHI_.
https://arxiv.org/abs/2302.07427

Kazemitabaar, M., et al. (2024). CodeAid: Evaluating a Classroom Deployment of
an LLM-based Programming Assistant. _CHI_. https://arxiv.org/abs/2401.11314

Liffiton, M., et al. (2023). CodeHelp: Using Large Language Models with
Guardrails for Scalable Support in Programming Classes. _Koli Calling_.
https://arxiv.org/abs/2308.06921

Orenstrakh, M. S., Karnalim, O., et al. (2023). Detecting LLM-Generated Text in
Computing Education: A Comparative Study for ChatGPT Cases.
https://arxiv.org/abs/2307.07411

Price, T. W., et al. (2020). ProgSnap2: A Flexible Format for Programming
Process Data. _ITiCSE_. https://dl.acm.org/doi/10.1145/3341525.3387373

CodeGuard: Improving LLM Guardrails in CS Education (2026).
https://arxiv.org/html/2602.02509v1

Editrail: Understanding AI Usage by Visualizing Student-AI Interaction in Code
(2026). https://arxiv.org/html/2601.20085

AI Misuse in Education Is a Measurement Problem: Toward a Learning Visibility
Framework (2026). https://arxiv.org/html/2603.07834v1

Designing a Meta-Reflective Dashboard for Instructor Insight into Student-AI
Interactions (2026). https://arxiv.org/abs/2603.22674

TutorTrace: A Dataset and Taxonomy for Classifying Learner Behavioral States
during AI-Assisted Programming Education (2026).
https://arxiv.org/abs/2608.26184

Tracing Prompt-Level Interaction Trajectories to Understand Student Learning
with LLMs in Programming Education (2026). https://arxiv.org/abs/2604.10400

Exploring Student Behaviors and Motivations when using AI Teaching Assistants
with Optional Guardrails (2026). https://arxiv.org/abs/2504.11146

Future-Proofing Programmers: Optimal Knowledge Tracing for AI-Assisted
Personalized Education (CoTutor) (2025). https://arxiv.org/html/2509.23996v1

AI Assistance Reduces Persistence and Hurts Independent Performance (2026).
https://arxiv.org/html/2604.04721

**UNREAD — retrieve before the proposal:** Less stress, better scores, same
learning: The dissociation of performance and learning in AI-supported
programming education. _Computers & Education: Artificial Intelligence_ (2025).
https://www.sciencedirect.com/science/article/pii/S2666920X25001778
