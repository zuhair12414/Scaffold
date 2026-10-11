# Gap analysis, second pass — read against the FAST FYP Handbook (3rd ed., 2026)

_Compiled 2026-09-09. Supersedes nothing: `00-gap-analysis.md` stands, and its
literature survey is still valid. What changes here is the **selection
criterion**. Pass 1 asked "what is publishable?" This pass asks "what is
publishable **and** passes the handbook's gates?" Those are different
questions, and the first answer does not survive the second._

---

## 1. The correction

Pass 1 recommended: build a per-student competence estimator from LLM-mediated
process data and validate it against a proctored, AI-free post-test.

Held against the handbook, that recommendation has four problems. I should have
read the handbook before writing it.

| Handbook requirement | Where pass 1 fails |
|---|---|
| **§5.2** — FYP-1 delivers 2 iterations, ~**45% of implementation**, by Week 15 | A validation study consumes the semester and produces a finding, not 45% of a system |
| **C.12** — **live** POC / technical spike at **Week 4**, demonstrated not presented | The estimator has nothing to demo at Week 4; the labelled corpus does not exist yet |
| **C.15** — "Jupyter Notebook FYP" named as a **weak idea pattern**: high accuracy in a notebook, no deployable system | An offline estimator scored against a post-test is precisely that shape |
| **C.19 / C.13** — problem validation and UAT need stakeholder access; ethics approval is the long pole | The whole contribution collapses if the instructor or the ethics committee says no. Single point of failure, unmitigated |

Pass 1 also under-served **C.3 (CCP)**. "Can X predict Y?" is a good empirical
question and a weak Complex Computing Problem: it is thin on conflicting
requirements (1), diverse stakeholders (6), significant consequences (7), and
interdependence (8).

**Keep from pass 1:** the literature map, the evidence that the problem is
real, and the finding that detection and instructor-visibility framings are
already occupied. **Discard from pass 1:** the study-shaped research question.

---

## 2. What the handbook actually rewards

Extracted, because these are the constraints the idea must be optimised
against — not the ones a research paper would be:

- **C.7 GenAI Resilience Test** — if one student with modern AI tools can build
  the whole functional application in a weekend, the idea is inadequate.
- **C.14 Core-Replacement is unacceptable** — if an external API "completely
  solves the CCP", marks are capped or the project is rejected. *A tutor that
  is a system prompt in front of GPT is a Core-Replacement project.* This is
  the single biggest threat to any "AI tutor" FYP, including Scaffold as
  originally framed.
- **C.15 Generic Chatbot / RAG Wrapper** — named weak pattern. Remedy given:
  "sophisticated retrieval pipelines, custom chunking, **evaluation baselines,
  and safety guards**."
- **C.4** — contribution types include **System/Architecture**, **Evaluation**,
  **Data/Resource**, and **Human/Workflow**. A novel *algorithm* is not
  required. This is the escape hatch from the pass-1 trap.
- **C.14 Standard of Understanding** — for any CCP-relevant component the
  student must **Explain**, **Justify**, **Predict**, and **Modify** under
  examination. *Hold this sentence; §5 turns it into the product.*
- **C.5** — if any member were removed, a critical subsystem must disappear.
- **C.13** — Testing ≠ Evaluation ≠ User Acceptance. Evaluation means baseline
  comparisons and ablations.

---

## 3. Prior departmental FYPs — the C.10 comparison you must survive

Drawn from your own `~/Desktop/fyps` repository (1,056 projects). A panel will
ask this. Nine projects in the tutoring / code-education space; the four that
matter:

| Prior FYP | Term | What it did | Structural limitation | Implication for Scaffold |
|---|---|---|---|---|
| **Codio** (F25-323-D) | Fall 2025 | Fully implemented **Python** e-learning web app: YouTube playlist import; split-screen video + embedded Monaco; **"pause-to-code"** frame extraction via **Google Gemini 2.5 Flash (VLM)**; **Judge0** sandboxed execution; context-aware AI auto-completion; **adaptive multi-agent quiz generation from transcripts** with dynamic difficulty; debugging assistant with fix suggestions; transcript keyword search; student dashboard (progress, streaks, heatmaps, recommendations); RBAC + audit logging. Docker microservices — React+TS / Flask / MongoDB Atlas / Redis. | Technically substantial, but **pedagogically inverse**. Every AI feature — code extraction, auto-completion, fix suggestions — **maximises disclosure**. Its "adaptive" is **quiz difficulty from transcripts**, not a mastery model over coding process. No process telemetry, no struggle detection, no disclosure calibration, no leakage control, no learning-outcome evaluation. Student-facing dashboard. | **Differentiate on objective, not features.** Codio removes the friction between watching a tutorial and running code; Scaffold **calibrates** friction, because friction is where learning happens. Different context: Python video tutorials vs. a supervised C++ Data Structures lab. |
| **Ustaad** (Fall 2023) | Fall 2023 | "AI based programming tutor", learning plan per student, integrated compiler + chatbot | Chatbot-and-compiler wrapper; exactly the C.15 pattern | Scaffold must not be describable in the same sentence |
| **EasyLearnAI** (F25-007-D) | Fall 2025 | 10-feature learning assistant incl. "diagnostic outcome analysis that identifies individual learning gaps" | Breadth over depth; gap identification asserted, never validated | Validation of the estimate is the differentiator |
| **GreenCodeAI** (F25-229-D) | Fall 2025 | IDE plugin + CI integration, real-time in-editor analysis, "practical contribution beyond reliance on LLMs" | Different domain (energy/maintainability) | **Useful precedent, not a competitor**: shows the panel accepts an IDE-plugin architecture, and that "beyond reliance on LLMs" is the framing that passes |

Read the row for Codio twice. The department has already approved a fully
implemented, technically serious platform in this space one year ago. The
differentiation is not feature count and not build quality — it is that Codio
optimises for **removing** friction and Scaffold optimises for **calibrating**
it. Open the proposal with that contrast, not with a feature comparison.

---

## 4. What the second literature pass added

Beyond `00-gap-analysis.md`:

- **Gaming the system is a mature, pre-LLM literature.** Baker et al. showed
  students systematically abuse hints and game tutors, and that gaming
  correlates with poorer learning. Any gate you build will be gamed. Design for
  it from the start rather than discovering it in FYP-2.
- **Gaming corrupts learner models measurably.** "Measuring the Impact of
  Student Gaming Behaviors on Learner Modeling" (2025) poisoned BKT/AFM/DKT
  with simulated gaming: up to **−15.2% AUC**, with parametric models most
  fragile. Authors' future work: "real-time data quality monitoring" and
  "unsupervised anomaly detection for gaming behavior." Nobody has done this
  for AI-mediated programming.
- **Comprehension-question generation from student code exists and is
  unvalidated.** **AutoMCQ** (ITiCSE 2025) generates MCQs from a student's own
  submitted code with GPT-4o mini, deployed in a Java course — and ships a
  disclaimer that "questions generated may be incorrect", relies on students
  flagging bad items, and is **explicitly formative only, never gating**.
- **Not all comprehension probes are equal, and this is measured.** "On the
  Reliability of Code Comprehension Proxies" (2026) ranked 14 proxies against
  expert consensus: **"time to predict output given an input" correlated 0.86**;
  syntax-identification proxies showed **weak or negative** correlation. This is
  a directly usable design constraint — and it happens to match the handbook's
  own Explain/Justify/**Predict**/Modify standard.
- **Automated viva / oral authentication is being built** (ACM 2025;
  pre-recorded vivas, ITiCSE 2026; commercial tools). All **after the fact**
  and out of flow.
- **Assignment-perturbation defences are fragile.** "Impeding LLM-assisted
  Cheating via Adversarial Perturbation" (2024) degraded LLM correctness but
  the authors concede it may harm honest students and become obsolete as models
  improve. Do not go down this road.
- **UNREAD, must check:** "Refuting LLM-generated Code with Reactive Task
  Comprehension" (ITiCSE 2025) — ACM returned 403. From the title this is the
  nearest neighbour to §5. **Retrieve it before the proposal.**

---

## 5. The refined gap

Put the pieces together:

1. Everyone who generates comprehension questions from student code stops at
   **formative** — nothing depends on the answer (AutoMCQ, explicitly).
2. Everyone who authenticates understanding does it **after the fact** —
   recorded vivas, post-hoc oral defence — when the learning moment is gone.
3. Everyone who constrains an AI tutor applies **the same guardrail to every
   student** (CodeHelp, CodeAid, CodeGuard), and half of an 885-student cohort
   bypassed the guardrail when given the option, lower-performers most.
4. Nobody has asked what happens when the student **routes the comprehension
   probe to the same AI that wrote the code**. This is the obvious first
   countermeasure any student will discover, and the education literature does
   not address it at all.
5. Probe *validity* is unresolved — the deployed system ships a disclaimer —
   yet we now know **which classes of probe are reliable** (semantic
   output-prediction) and which are not (syntax identification).

> ### Statement of the gap
>
> Comprehension probing exists as a **feature** but not as a **control loop**.
> There is no system that decides, in real time and inside the editor, *which*
> AI-derived code fragment to probe, *when*, at *what interruption cost*, using
> probe classes of *known reliability*, while detecting that the probe answer
> was itself outsourced — and that produces an auditable record an instructor
> can act on. The components are published; the decision problem is not, and
> the outsourcing countermeasure is untouched.

This is a **System/Architecture + Evaluation** contribution in C.4's taxonomy.
It does not require inventing an algorithm, which is the right ambition for an
FYP, and it is not a chatbot, which is what keeps it out of C.15.

---

## 6. Why this passes the gates that pass 1 failed

| Gate | How it is satisfied |
|---|---|
| **C.7 GenAI Resilience** | The LLM drafts probe text. It does not decide which fragment is worth probing, whether the probe is valid, whether the answer was outsourced, what the interruption costs, or what the instructor sees. None of that is a weekend prompt |
| **C.14 Core-Replacement** | LLM is **Core-Assist** (probe drafting), wrapped in student-built fragment selection, probe validation, routing detection, policy, and audit. Say this explicitly in the proposal |
| **C.12 Week-4 live POC** | Demoable in three weeks: paste an AI-written C++ fragment into the editor, watch the extension select a target line, emit an output-prediction probe, and log the decision. Small, real, and it tests the riskiest assumption |
| **§5.2 45% by Week 15** | Iteration 1 = capture + fragment selection + probe generation. Iteration 2 = policy engine + routing detection + instructor view. Both are buildable |
| **C.13 Evaluation** | Probe validity against instructor labels; routing-detection ROC against a red-team set; latency percentiles; ablations over probe class. **No ethics-gated learning RCT required for the core result** |
| **C.5 Modular ownership** | Three genuinely separable subsystems — §8 |
| **C.3 CCP** | §7 |

---

## 7. CCP formulation (C.20 three-level pattern)

**Weak.** Develop a system that asks students comprehension questions about
their code.

**Developing.** Develop an IDE plugin that detects AI-generated code, generates
comprehension questions about it, and reports results to the instructor.

**Strong.** Develop an in-editor comprehension-verification system for
programming labs that must decide, within the typing loop and on incomplete,
non-compiling C++, which AI-derived fragments warrant a probe and which probe
class to use given that probe classes differ in measured reliability; balance
the learning value of interrupting against the cost of breaking flow and the
risk of driving students to unmonitored tools; remain informative when students
outsource the probe itself to the same assistant that wrote the code; honour
per-lab policy set by instructors who disagree about what counts as legitimate
AI use; keep student code and interaction data within institutional privacy
constraints; produce an auditable justification for every gate decision,
because a wrong accusation of outsourcing carries real consequences for a
student; and degrade to a safe, non-blocking mode when the model is unavailable
or its confidence is low.

**Seoul Accord characteristics exhibited: 1, 2, 3, 4, 5, 6, 7, 8, 9.**

- **1 Conflicting requirements** — interruption vs verification; sensitivity vs
  false accusation; latency vs probe quality; privacy vs model quality
- **2 No obvious solution** — probe selection and routing detection both
  require comparative analysis, not a template
- **3 Depth of knowledge** — program analysis on non-compiling C++ (pointers,
  aliasing, templates), sequential decision-making under uncertainty,
  classification under heavy class imbalance
- **4 Unfamiliar issues** — adversarial students are a non-routine constraint
- **5 Beyond standard practice** — no library does this
- **6 Diverse stakeholders** — student, TA, instructor, integrity office, with
  genuinely conflicting interests and access tiers
- **7 Significant consequences** — a false outsourcing flag is an accusation
- **8 Interdependence** — tightening detection changes student behaviour, which
  changes the data the estimator sees. The loop feeds itself
- **9 Ill-defined requirements** — instructors do not agree on what legitimate
  AI use is; this must be discovered empirically, not assumed

Characteristic 8 is worth dwelling on in the defence. It is the honest reason
this is hard and not merely fiddly.

---

## 8. Module split for three members (C.5 diagnostic test)

| Member | Owns | Remove them and what disappears |
|---|---|---|
| **A — Capture & program analysis** | VS Code extension, keystroke/paste/completion telemetry, incremental parsing of **incomplete, non-compiling C++**, fragment selection, KC tagging | No fragments to probe. The system is blind |
| **B — Probe generation & validation** | Probe class taxonomy grounded in the reliability literature, generation pipeline, automatic validity checking (does the probe have a unique correct answer derivable from the fragment?), distractor quality | No probes, or invalid ones. AutoMCQ's unsolved problem is this member's project |
| **C — Policy, integrity & audit** | Gate policy under latency/interruption budget, routing-detection classifier, instructor policy console, audit trail, safe degradation | No decision, no defensibility. The system becomes a quiz generator |

Each row is a defensible technical core. None is a UI layer.

---

## 9. Week-4 POC — answering C.12's five questions in advance

1. **Risky assumption tested:** that an automatically generated
   output-prediction probe, built from a *specific line* of AI-derived C++, can
   be produced fast enough to interrupt in-flow and is answerable *only* by
   someone who traced the code.
2. **Input/setup:** ten AI-generated solutions to two Data Structures lab tasks
   (linked-list insert, BST delete), pasted into the instrumented editor.
3. **Empirical result to obtain:** end-to-end latency from paste to probe
   (target: under 2s), plus an instructor's judgement on each probe — valid,
   trivial, or wrong.
4. **What it would disprove:** if most probes are trivial or invalid, probe
   *generation* is the bottleneck, not policy, and Member B's scope becomes the
   project's centre of gravity.
5. **Architectural consequence:** determines whether probes can be generated
   on demand or must be pre-computed per lab task — which changes the whole
   deployment model, and is exactly the kind of finding a Week-4 POC exists to
   surface.

Build this before you commit. It is roughly two weeks of work and it is worth
more than another month of reading.

---

## 10. Evaluation plan (C.13 three-way split)

**Testing** — unit and integration tests on the parser against a corpus of
deliberately broken C++; telemetry integrity; policy state machine.

**Evaluation** — the empirical core, none of it ethics-gated:
- *Probe validity:* generated probes vs instructor labels. Baselines: AutoMCQ's
  approach as published, and a naive "ask the LLM for a question" prompt.
- *Probe class ablation:* output-prediction vs syntax-identification vs
  explanation, against the reliability findings. You have a published
  expectation to test against — syntax probes should underperform.
- *Routing detection:* ROC against a **red-team corpus** you generate yourself
  by routing probes through an assistant and back. Report false-positive rate
  at the operating point, and argue the threshold from the cost of a false
  accusation.
- *Latency:* p50/p95 under concurrent lab load. This is your measurable NFR
  for C.6.
- *Robustness:* behaviour on non-compiling input, model timeout, offline.

**User Acceptance** — a lab session with students and instructors: task
completion, perceived fairness, interruption tolerance. Proxies declared at
proposal if a live section is not available. **Note that a full learning-outcome
study is deliberately out of FYP scope**; name it as future work rather than
promising it and missing.

---

## 11. Honest risks

- **The nearest-neighbour paper is unread** (§4). If "Refuting LLM-generated
  Code with Reactive Task Comprehension" already builds an in-flow gate, §5
  narrows to routing detection and policy. That is still a project, but you
  need to know now.
- **Routing detection may not work.** Its signals — answer latency vs probe
  difficulty, focus-loss and clipboard events, deviation from the student's own
  answer-style baseline — are indirect and beatable by a patient student.
  Mitigation: frame the target as *raising the cost of outsourcing*, with
  measured cost, not as detection with a claimed accuracy. Do not build a
  system whose value proposition is catching people.
- **False accusations are the ethical core of this project.** The audit trail,
  the conservative threshold, and a design in which the system never asserts
  misconduct — only surfaces evidence to a human — are not optional features.
  Write them into the DEI/ethics statement at proposal.
- **Instructors disagree on what counts as legitimate AI use** (Editrail found
  exactly this). Do not assume a policy; elicit it, and make it configurable.
  That disagreement is CCP characteristic 9 and it is an asset, not an obstacle.
- **C++ analysis on non-compiling code is genuinely hard.** It is also where
  the depth-of-knowledge credit lives, and it differentiates you from the
  Python/Java corpus that nearly all of this literature uses. Budget for it and
  look at how CoBOT handles incomplete C/C++.
- **Scaffold's original hint-taxonomy framing is now a subsystem, not the
  project.** Gating and hinting are the same control loop seen from two sides.
  Decide deliberately whether hints stay in FYP-1 scope or move to FYP-2.

---

## 12. What to do next, in order

1. Retrieve and read the two unread papers (§4, and the dissociation paper in
   `00-gap-analysis.md` §1).
2. Build the Week-4 POC in §9. Two weeks.
3. Interview two Data Structures instructors: what AI use would they permit,
   what would they gate, what would they never automate? This is C.19 problem
   validation and it feeds CCP characteristic 9.
4. Populate the C.10 and C.11 tables — §3 gives you most of C.10 already.
5. Write the strong CCP statement from §7 into the proposal verbatim and map
   the nine characteristics.

---

## 13. Additional references (added this pass)

Baker, R.S.J.d., Corbett, A., Koedinger, K. Detecting Student Misuse of
Intelligent Tutoring Systems. http://pact.cs.cmu.edu/koedinger/pubs/Baker,%20Corbett,%20Koedinger%20ITS04.pdf

Baker, R.S.J.d., et al. Why Students Engage in "Gaming the System" Behavior.
https://pact.cs.cmu.edu/koedinger/pubs/Baker,%20R.,%20Walonoski,%20J.A.,%20Heffernan,%20N.T.,%20Roll,%20I.%20Corbett,%20A.,%20Koedinger,%20K.R..pdf

Measuring the Impact of Student Gaming Behaviors on Learner Modeling (2025).
https://arxiv.org/html/2512.18659

AutoMCQ — Automatically Generate Code Comprehension Questions using GenAI
(ITiCSE 2025). https://arxiv.org/abs/2505.16430

On the Reliability of Code Comprehension Proxies (2026).
https://arxiv.org/abs/2605.23008

Evaluating AI-Generated Distractors in Programming Education (ICER 2025).
https://dl.acm.org/doi/10.1145/3702653.3744332

Impeding LLM-assisted Cheating in Introductory Programming Assignments via
Adversarial Perturbation (2024). https://arxiv.org/html/2410.09318v1

Automated Viva Voce Using Generative AI for Student Coursework Authentication
(2025). https://dl.acm.org/doi/10.1145/3766557.3766564

CoBOT: Static C/C++ Bug Detection in the Presence of Incomplete Code (ICPC
2018). https://yuleisui.github.io/publications/icpc18.pdf

Denny, P., et al. Promptly / Prompt Problems.
https://arxiv.org/pdf/2307.16364 · https://arxiv.org/pdf/2401.10759

**UNREAD — retrieve before proposal:** Refuting LLM-generated Code with
Reactive Task Comprehension (ITiCSE 2025).
https://dl.acm.org/doi/10.1145/3724363.3729100
