# SCAFFOLD — Proposal Defense Gate Pack
### Knowledge-State-Driven Adaptive Scaffolding for Programming Labs

**Team:** Muhammad Zuhair (23I-0001) · ML — Muhammad Jawad Ali (23I-3024) · Systems — Abdul Rauf (23I-0591) · Full-stack + Research
**Supervisor:** Ma'am Rabail Zahid, Department of Computer Science, FAST NUCES Islamabad
**Stream:** B (Application-Derived) · **SDG 4** Quality Education · **Target:** CS2 Data Structures (C++)
**Use:** one section per gate-table row, in scoring order. Speak from this; do not read it out.

**Score map — 100 marks**

| # | Gate item | CLO | Max |
|---|---|---|---|
| 1 | Complex computing challenge & R&D basis | CLO1 | 15 |
| 2 | Product / prior-FYP comparison & contribution clarity | CLO1 | 5 |
| 3 | Scope, requirements & success criteria | CLO2 | 10 |
| 4 | Proposed solution & technical approach | CLO3 | 15 |
| 5 | POC-lite / technical spike / feasibility evidence | CLO4 | 15 |
| 6 | Responsible tool / API / GenAI plan | CLO5 | 10 |
| 7 | Work division & iteration plan | CLO2 | 5 |
| 8 | DEI, ethical & legal | CLO2 | 5 |
| 9 | Presentation, delivery & Q&A | CLO6 | 20 |

---
---

# 1 · Complex Computing Challenge & R&D Basis — CLO1 · 15
> *Evaluator asks: problem clear; existing products/literature studied; gap meaningful; complexity above course-project level.*

### 1.1 Problem (30 seconds)
Students paste lab problems into ChatGPT and submit the returned code. This removes the productive struggle that produces skill, and it is invisible: the instructor sees only a correct submission. Affected: CS2 Data Structures students; secondarily instructors and TAs who must assess real skill and have no instrument for it.

### 1.2 The problem is established, not asserted

| Evidence | Source |
|---|---|
| Unguarded GenAI: **+48%** practice, **−17% unaided exam**. Guardrailed tutor: **+127%** practice, **−0.4%** exam (n.s.) | Bastani et al., **PNAS 2025**, ~1,000 students, RCT |
| **>80%** of students directly reused AI-generated solutions; 35.6% "Simple Delegation" | Prompt-Level Trajectories, 2026, 146 submissions |
| Given a "See Solution" bypass, **half** of an 885-student cohort used it; **lower-performing students used it most**, near deadlines | AI TAs with Optional Guardrails, 2026 |
| Struggling novices finish with an **"illusion of competence"** | Prather et al., **ICER 2024** |

### 1.3 Formal Research Question
> **Primary.** Does knowledge-state-conditioned, proactively triggered LLM scaffolding — where hint specificity is calibrated from a real-time knowledge-tracing model updated from IDE telemetry — produce measurably better learning outcomes (transfer-task performance, time to solution, hint dependency) than reactive, student-model-blind LLM assistance in undergraduate programming labs?
>
> **Secondary.** Does replacing a prompt-based leakage guardrail with a DPO-aligned model improve pedagogical robustness and resistance to adversarial solution-seeking?

### 1.4 The gap — three findings, one conclusion
1. **The closed loop does not exist.** Knowledge tracing predicts mastery **offline**; hint generators are **student-model-blind**; telemetry systems feed **dashboards, not intervention**. The closest system, **ClassAid (CHI 2026)**, requires the instructor to manually switch one of four AI modes **for the whole class** — no per-student model. STAP, ClassAid and Closing the Loop all name this integration as future work.
2. **Knowledge tracing is invalid under AI mediation, and nobody has fixed it.** Every student model updates mastery from submission correctness. Under delegation that inference breaks. **CoTutor (2025)** does BKT for AI-assisted programming and never addresses it. Simulated gaming degrades BKT/AFM/DKT by up to **−15.2% AUC**, BKT worst.
3. **Pedagogical alignment has never reached code.** TutorRL, PEARL, SocraticLM, LearnLM, Sonkar et al., and ACL 2026 Multi-Horizon Socratic DPO are **all mathematics** (MathDial/GSM8k). Their reward treats leakage as binary. Code leakage is graduated: signature → naming → pseudocode → partial → full.

### 1.5 The insight that makes this a research project, not a feature
> **Scaffold's own mechanism inverts under its own problem statement — unless we fix the observation model.** A vibe-coding student submits correct code → knowledge tracing raises mastery → an adaptive tutor lowers hint specificity → the student who learned nothing gets *less* support, while the honest struggler gets more. **The project's primary empirical claim is therefore not "telemetry improves AUC" but "telemetry preserves mastery validity when submissions are AI-mediated."**

### 1.6 Why this exceeds course-project level

| Dimension | Course project | Scaffold |
|---|---|---|
| Modelling | Call an LLM with a system prompt | Implement and compare BKT / DKT / telemetry-enriched DKT; cross-validated AUC **and** mastery-inflation under injected AI-mediated submissions |
| Systems | CRUD web app | Real-time event pipeline, 40–60 concurrent students, **<200 ms** capture latency, zero event loss |
| Analysis | — | Program analysis over **incomplete, non-compiling C++**; ~**25%** of incorrect submissions do not compile (CodeWorkout) |
| Evaluation | Demo to supervisor | Three-condition within-subjects classroom study, pre-registered primary outcome, plus offline ablations |
| Security | Input validation | Graduated AST-similarity leakage detector + adversarial jailbreak classifier, self-red-teamed |

### 1.7 CCP justification — Seoul Accord 1–9

| # | Characteristic | In Scaffold |
|---|---|---|
| 1 | Conflicting requirements | Help vs. productive struggle; latency vs. hint quality; privacy (local model) vs. capability; sensitivity vs. false suspicion |
| 2 | No obvious solution | Optimal disclosure level per student is not derivable from a template; requires comparative modelling |
| 3 | Depth of knowledge | HMM/LSTM knowledge tracing, AST analysis of non-compiling C++, LLM serving, preference optimisation, experimental design |
| 4 | Unfamiliar issues | Adversarial students; scaffolding collapse under sustained pressure |
| 5 | Beyond standard practice | No library or API performs KT-conditioned disclosure calibration |
| 6 | Diverse stakeholders | Student, TA, instructor, integrity office — conflicting interests and access tiers |
| 7 | Significant consequences | Mis-calibration harms the learning the system exists to protect; misuse signals affect a student's standing |
| 8 | Interdependence | **Tightening detection changes student behaviour, which changes the data the estimator is trained on.** The loop feeds itself |
| 9 | Ill-defined requirements | Instructors disagree on what legitimate AI use is; must be elicited empirically, not assumed |

---
---

# 2 · Product / Prior-FYP Comparison & Contribution — CLO1 · 5
> *Evaluator asks: closest systems and FYPs compared; difference not cosmetic; contribution explicit.*

### 2.1 Closest published systems

| Dimension | CodeHelp '23 | CodeAid CHI'24 | STAP '25 | ClassAid CHI'26 | **Scaffold** |
|---|---|---|---|---|---|
| Per-student knowledge model | No | No | No | **No** | **Yes — BKT/DKT** |
| Trigger | Student asks | Student asks | Student asks | Asks, or instructor switches mode | **Auto (struggle detection) + ask** |
| Hint calibration | One-size | One-size | Socratic only | **Instructor picks 1 of 4 modes for the class** | **Auto, from mastery + struggle type** |
| Leakage control | Prompt guardrail | Pseudocode-only | Formalised MVH | Mode-based | **Graduated policy + AST filter (+DPO)** |
| Deployment | 52 | 700+ | — | 54 | Planned 30–60 |
| Measured learning outcomes | No | **No — usage/perceptions only** | No | No | **Yes — transfer task** |

### 2.2 Prior FAST NUCES FYPs — searched, 1,056 projects, Spring-2022 → Fall-2025

| Prior FYP | Term | Its approach | Why it is not this |
|---|---|---|---|
| **Codio** (F25-323-D) | Fall 2025 | Fully implemented **Python** e-learning web app: YouTube playlist import; split-screen video + embedded Monaco; **"pause-to-code"** frame extraction via **Google Gemini 2.5 Flash (VLM)**; **Judge0** sandboxed execution with stdout/stderr feedback; context-aware AI auto-completion; **adaptive multi-agent quiz generation from transcripts** with dynamic difficulty; debugging assistant with fix suggestions; transcript keyword search; student dashboard (progress, streaks, heatmaps, recommendations); RBAC + audit logging. Docker microservices — React+TS / Flask / MongoDB Atlas / Redis. | **Closest prior, and the inverse of us.** Technically substantial, but **pedagogically inverse**. Every AI feature — code extraction, auto-completion, fix suggestions — **maximises disclosure**. Its "adaptive" is **quiz difficulty generated from transcripts**, not a mastery model over coding process. No process telemetry, no struggle detection, no disclosure calibration, no leakage control, no learning-outcome evaluation. Student-facing dashboard, not instructor-facing. **Differentiate on objective, not features.** Codio removes the friction between watching a tutorial and running code. Scaffold **calibrates** friction, because friction is where learning happens. Different context too: Python video tutorials vs. a supervised C++ Data Structures lab; student dashboard vs. instructor mastery view. |
| **Ustaad** | Fall 2023 | AI programming tutor: compiler + chatbot + learning plan | Chatbot-and-compiler wrapper; no student model, no evaluation |
| **EasyLearnAI** (F25-007-D) | Fall 2025 | 10-feature assistant incl. "identifies individual learning gaps" | Gap identification asserted, never validated |
| **GreenCodeAI** (F25-229-D) | Fall 2025 | IDE plugin + CI, real-time in-editor analysis, "beyond reliance on LLMs" | **Precedent, not competitor** — different domain (energy/maintainability); shows the panel accepts this architecture |
| **CodeStory VR** | Fall 2022 | Gamified 3D concept learning | Different modality; no assistance loop |

### 2.3 Contribution statement
> We present the first system that closes the loop between real-time IDE telemetry, automated programming knowledge tracing, and knowledge-state-conditioned LLM hint generation with a graduated code-disclosure policy — and the first to test whether behavioural telemetry preserves the validity of mastery estimation when student submissions are AI-mediated, a failure mode that existing programming knowledge-tracing systems do not address. Secondary: to our knowledge the first application of preference-based pedagogical alignment to code tutoring, with a graduated AST-similarity leakage reward generalising the binary leakage rewards used in mathematics tutoring.

**Contribution types (C.4):** Method · System/Architecture · Evaluation · Data/Resource.

---
---

# 3 · Scope, Requirements & Success Criteria — CLO2 · 10
> *Evaluator asks: modules and measurable acceptance criteria defined for two semesters and 3 members.*

### 3.1 Functional requirements (C.6 syntax)
1. The system shall capture keystroke, paste, compile and idle events for **each student** during a lab session.
2. The system shall maintain a **per-concept mastery vector** for each student, updated on every scored submission.
3. The system shall **detect unproductive struggle** and proactively offer assistance without a student request.
4. The system shall **select a hint disclosure level** from the student's mastery state and struggle type.
5. The system shall **block any hint** whose AST similarity to the reference solution exceeds the configured threshold.
6. The system shall present the instructor a **class-wide mastery heatmap** with per-student drill-down.

**Non-functional (measurable):** telemetry capture **< 200 ms at p95** for 60 concurrent students; hint generation **< 8 s** for 10 concurrent requests on one RTX 3090.

### 3.2 Acceptance criteria

| Module | Criterion |
|---|---|
| Telemetry pipeline | All event types captured, **<200 ms**, 60 concurrent users; **zero event loss** over a 1-hour sustained replay |
| Struggle detector | **≥0.75 precision / ≥0.70 recall** on "unproductive struggle" vs. hand-labelled segments; verdict within 30 s |
| Knowledge tracing | DKT **≥0.70 AUC**, leave-students-out CV; telemetry-enriched DKT significantly better than DKT (paired t-test, p<0.05) |
| **KT validity under AI mediation** | Under synthetic AI-mediated submission injection at **25% / 50%**, telemetry-enriched DKT shows **significantly lower mastery inflation** than DKT and BKT against pre-injection ground truth |
| Hint engine | **<8 s** at 10 concurrent; **≥70%** of a blind sample of 100 hints rated pedagogically appropriate by the instructor |
| Guardrail | Leakage (**≥60% AST similarity** to reference) **below 5%** of hints; jailbreak precision **≥0.90** |
| Dashboard | Heatmap refresh **<5 s** from a new event; drill-down to any student timeline |
| Classroom study | **n ≥ 30**, power analysis at medium effect, α=0.05, β=0.80; pre-registered primary outcome = transfer-task score |
| DPO (secondary) | Lower leakage than prompt-only baseline on a held-out adversarial set, without significant loss of helpfulness |

### 3.3 Hardest requirement + its test
**Hardest:** the mastery vector must stay valid when students delegate.
**Test:** inject AI-mediated submissions into a held-out CSEDM trajectory at known rates; measure mastery inflation per model. Passes if telemetry-enriched DKT inflates significantly less.

### 3.4 Two dependencies scheduled in Month 1
- **KC taxonomy for C++ Data Structures** — does not exist; must be fixed with the instructor. KC attribution is itself hard (JEDM: expert labels needed for AUC>75% on 2 of 3 KCs; transfer learning from correctness labels is the viable route). **Everything downstream is blocked on this.**
- **Uncompilable submissions** — ~**25%** of incorrect submissions do not compile (9,906 / 38,883, CodeWorkout). Decide: drop, syntactic repair, or partial-AST features. C++ makes this harder than Java.

### 3.5 Non-goals
Full GRPO/RL alignment · multi-language support · automatic grading · autonomous misconduct flagging · replacing TAs.

### 3.6 Handbook gate mapping

| Gate | Week | Delivered |
|---|---|---|
| Proposal defense | 4 | This document + POC (§5) |
| FYP-1 Mid | 8 | SRS + design baselined; telemetry pipeline + BKT baseline live |
| FYP-1 Final | 15 | **~45%**: telemetry + struggle detector + KT engine + end-to-end hint generation, integrated and demoed |
| FYP-2 Mid | 8 | Guardrail + dashboard + telemetry-DKT; Job Fair clearance |
| FYP-2 Final | 15 | Classroom study complete, analysed, deployed |

---
---

# 4 · Proposed Solution & Technical Approach — CLO3 · 15
> *Evaluator asks: architecture, algorithms, models, APIs, data, design choices technically plausible and justified.* **Risk: "if tool solves core → cap and re-scope."** Answer §4.4 unprompted.

### 4.1 Architecture
```
[1] STUDENT LAYER — Monaco editor + telemetry capture (WebSocket)
              |
      +-------+--------+
      v                v
[2] STRUGGLE        [2] BEHAVIOUR
    DETECTOR            CLASSIFIER
    repeated errors,    productive struggle /
    thrashing, idle,    stuck / delegated
    regression
      |                v
      +-------+--------+
              v
[3] KNOWLEDGE TRACING ENGINE
    BKT -> DKT -> telemetry-enriched DKT
    per-concept mastery vector + uncertainty
              |
      +-------+--------+
      v                v
[4] HINT ENGINE     [4] GUARDRAIL
    Qwen2.5-Coder-7B    AST-similarity leakage check
    + structured        + jailbreak classifier
    prompt (mastery,    + consistency filter
    struggle, level)
              |
              v
[5] INSTRUCTOR LAYER — mastery heatmap, struggle timeline, hint history, override
```

### 4.2 Algorithms and justification

| Component | Approach | Why |
|---|---|---|
| KT baseline | **pyBKT** | Interpretable HMM; fast; auditable baseline before complexity |
| KT primary | **DKT (LSTM)** | Learns cross-skill dependencies (loops → recursion) BKT's independence assumption cannot |
| KT novel | **Telemetry-enriched DKT** — time-on-task, error-type distribution, edit distance, **paste/completion-acceptance flags** appended to (skill, correct) | Standard DKT sees only correctness, which delegation corrupts. **This is the primary empirical claim** |
| Hint generation | Structured prompt: rules + problem + **mastery vector** + struggle signal + disclosure level → Qwen2.5-Coder-7B via vLLM | Prompting matches the literature; **the novelty is the conditioning input, and the policy that computes the level** |
| Guardrail | AST-similarity detector + semantic leakage classifier + jailbreak classifier | Prompt instructions alone fail under sustained adversarial pressure ("scaffolding collapse") |
| Alignment (secondary) | **DPO + LoRA** on Qwen2.5-Coder-7B, graduated AST-based leakage reward | Single-GPU feasible; no RL loop, no reward-model serving |

### 4.3 Infrastructure

| Layer | Choice | Why |
|---|---|---|
| Editor | **Monaco** | VS Code engine; rich event API; no native plugin install for students |
| Transport | **WebSocket + FastAPI** | Sub-second delivery, async concurrency for 40–60 clients |
| Serving | **vLLM**, GPTQ INT4 | 50+ concurrent requests within 24 GB on one RTX 3090 |
| KT service | pyBKT + PyTorch DKT via FastAPI | Open-source; **ProgSnap2**-compatible |
| Frontend | React / Next.js + Recharts | Team familiarity; real-time dashboard ecosystem |
| Pre-training data | **CSEDM 2021 / CodeWorkout — Java**, CS1, 410 students, ProgSnap2 | Priors only; **Java → C++ is a closer transfer than Python → C++** (same family, static typing) |

### 4.4 Dependency classification — the Core-Replacement answer
> **The LLM is Core-Assist, not Core-Replacement.** Remove the LLM and we still have a knowledge-tracing engine, a real-time telemetry pipeline, a struggle detector, a graduated leakage detector and an instructor dashboard. Replace the LLM with a template and the system still calibrates disclosure per student. **No API decides what to reveal — our policy does.** The model renders the chosen level into English. It is also a local open-weight model, so no external service holds student code.

| Component | Class |
|---|---|
| Qwen2.5-Coder-7B, vLLM | **Core-Assist** — hint text rendering only |
| KT engine, telemetry pipeline, struggle detector, disclosure policy, AST leakage detector, dashboard | **Student-built core** |
| Monaco, FastAPI, React, pyBKT | **Support** |
| CSEDM dataset | **Support** — priors, under its data-use agreement |

### 4.5 Alternatives rejected

| Alternative | Why not |
|---|---|
| GRPO/RL alignment as the primary deliverable | Needs multi-GPU + RL debugging expertise; kept as out-of-scope stretch |
| Full supervised fine-tuning of the hint model | Requires a large labelled hint dataset we cannot produce in a year |
| Commercial API in production | Per-request cost at class scale, internet dependency in labs, student-code privacy |
| **Post-hoc AI-code detection** | **Discredited**: GPTZero produced **52 false positives from 114 human submissions**; accuracy halves after paraphrasing; 17.5% on non-English. Adversarial to students and unreliable |
| Training KT only on FAST historical data | No dataset at the needed granularity exists yet |

---
---

# 5 · POC-Lite / Technical Spike / Feasibility — CLO4 · 15
> *Evaluator asks: clickable prototype, API/data check, **baseline run, sample pipeline or risk experiment** shown. Full MVP not required.* **Risk: "if No → major modification or re-defense."** Bring both a prototype **and** a run.

### 5.1 Shown live (in this order)
| # | Evidence | What it proves |
|---|---|---|
| **A** | **Risk experiment — mastery inflation.** Fit BKT + DKT on CSEDM; inject synthetic AI-mediated submissions at 25%/50%; plot mastery inflation per model | **The project's riskiest assumption is real and measurable.** Highest-signal item; ~1 day after the baseline exists |
| **B** | **Baseline run.** pyBKT on CSEDM 2021, `model.predict()`, reported AUC + per-student mastery table | Data is in hand, schema understood, KT pipeline runs. **4–6 hours** |
| **C** | **Sample pipeline.** Monaco → WebSocket → backend, live keystroke/paste/compile events logging to JSON, shown while typing | Real-time capture is feasible at the latency we claim. **~2 days** |
| **D** | **Clickable prototype.** Student IDE view, instructor heatmap, progress view, architecture walkthrough | The product is coherent end-to-end. **Explicitly labelled as mock data** |

### 5.2 The five POC questions (C.12) — answered for Spike A
1. **Risky assumption tested:** that standard knowledge tracing over-estimates mastery when submissions are AI-mediated, and that behavioural telemetry reduces that error.
2. **Input/setup:** CSEDM 2021 (CodeWorkout, Java, 410 students, ProgSnap2); synthetic injection of correct submissions at trajectory points where the student's history predicts failure.
3. **Empirical result:** mastery-inflation curves for BKT vs DKT vs telemetry-enriched DKT at 0 / 25 / 50% injection.
4. **What it would disprove:** if BKT inflates no more than the telemetry model, the contamination premise is wrong and the primary claim reverts to standard KT improvement.
5. **Architectural consequence:** decides whether behavioural features enter as KT model inputs or as a separate confidence-discount layer over the mastery vector.

### 5.3 Pre-defense checklist
- [ ] CSEDM downloaded; ProgSnap2 schema documented
- [ ] Spike B (BKT baseline + AUC) complete, screenshot ready
- [ ] Spike A (injection experiment) complete, one chart ready
- [ ] Spike C (Monaco → WebSocket) recorded as a 30-second screen capture
- [ ] Prototype clickable offline on the presenting laptop
- [ ] vLLM throughput benchmark reproduced, or citation retained

---
---

# 6 · Responsible Tool / API / GenAI Plan — CLO5 · 10
> *Evaluator asks: tools/APIs/models/GenAI disclosed; core vs support role and limitations understood.*

### 6.1 Disclosure

| Tool / model | Role | Class | Licence | Fallback |
|---|---|---|---|---|
| Qwen2.5-Coder-7B | Hint text generation | **Core-Assist** | Apache 2.0 | CodeLlama-7B / Llama-3.1-8B |
| pyBKT | BKT baseline | Core (ours to configure) | MIT | Custom HMM |
| PyTorch DKT | DKT family | Core | MIT | Reimplement from the 2015 paper |
| vLLM | Concurrent serving | Core | Apache 2.0 | Ollama / llama.cpp (lower throughput) |
| Monaco | Editor + telemetry | Support | MIT | CodeMirror 6 |
| HuggingFace TRL | DPO (secondary) | Support | Apache 2.0 | Drop DPO; report as future work |
| CSEDM 2021 | KT priors | Support | Research data-use agreement | LLM-graded diagnostic quiz for cold start |
| Claude / GPT-4 | **Development prototyping only — not in the deployed system** | Support (dev) | Commercial | n/a |

### 6.2 Limitations we state before being asked
- The hint model **can be wrong**; the guardrail is output-side because prompt instructions fail under sustained adversarial pressure.
- A 7B model is **weaker than a frontier API**; we accept that cost for privacy, offline operation and per-request cost at class scale. If hint quality fails acceptance, we document the trade-off rather than hide it.
- CSEDM is **Java CS1**, not C++ CS2 — priors only, with local cold-start correction.

### 6.3 Our own GenAI use
Claude was used for literature discovery, feasibility estimation and document structuring. Every technical claim is cross-checked against the primary source cited. A living AI-usage log is maintained and countersigned by the supervisor. Estimated development API spend **$80–150** across two semesters; **zero commercial API calls during the classroom study**.

---
---

# 7 · Work Division & Iteration Plan — CLO2 · 5
> *Evaluator asks: member-wise responsibilities, milestones, first-semester deliverables balanced; not only front-end.*

### 7.1 Ownership — remove any member and a core subsystem disappears

| Member | Semester 1 | Semester 2 | Owns (defends live) |
|---|---|---|---|
| **Zuhair — ML** | BKT baseline; DKT + comparison; **injection experiment** | Telemetry-enriched DKT + ablation; DPO/LoRA | Knowledge tracing, mastery validity |
| **Jawad — Systems** | Telemetry pipeline (Monaco + WebSocket); struggle detector | Instructor dashboard; service integration | Real-time capture, latency, concurrency |
| **Rauf — Full-stack + Research** | End-to-end hint generation; **KC taxonomy**; ethics application | Guardrail layer; classroom study; statistics | Disclosure policy, leakage, evaluation |

### 7.2 Iteration cadence
Weekly 20-minute stand-up · bi-weekly supervisor check-in with a one-page written status · monthly integration demo per module owner · **slack deliberately reserved at end of Semester 1 and post-study**.

### 7.3 Risk register

| Risk | P | Impact | Contingency |
|---|---|---|---|
| Ethics approval delayed | Med | High | Submit **Month 1**, not Month 8; fall back to convenience sample with the limitation stated |
| KC taxonomy slips | Med | **High — blocks everything** | Start Week 1 with the instructor; fall back to transfer learning from correctness labels (JEDM method) |
| Injection experiment shows no difference | Med | Med | Premise disproved — report it; primary claim reverts to standard KT improvement. **Still a thesis** |
| Qwen hint quality too low | Med | High | Commercial API for the study only; document the privacy/cost/quality trade-off |
| Uncompilable C++ breaks the analysis path | Med | Med | Syntactic repair or partial-AST features; scope decision taken in Month 1 |
| Struggle detector over-fires | Med | Med | Tune on hand-labelled pilot data; students can dismiss/snooze |
| DPO fails to converge | Med-High | **Low — secondary** | Report as a negative result; Track A stands alone |

---
---

# 8 · DEI, Ethical & Legal — CLO2 · 5
> *Evaluator asks: DEI statement; ethical/legal statement.*

**DEI.** KT models trained on external datasets may embed biases from populations unlike ours; we will report KT performance disaggregated by prior programming exposure (optional self-report) and **publish any disparity rather than omit it**. This matters here specifically: the guardrail-bypass literature shows lower-performing students delegate most, so a model accurate only for strong students would **widen** the gap it exists to close. The editor will be tested for keyboard navigability and screen-reader compatibility; students may opt out of telemetry analysis while still receiving assistance.

**Ethics & legal.**
- **Informed consent** before any collection; voluntary; no academic penalty; draft form prepared.
- **Ethics/IRB submitted Month 1**; no collection before written approval.
- **Data minimisation**: university-controlled storage only, not commercial cloud; defined retention then deletion.
- **Grade independence**: use of Scaffold and study participation have no bearing on grades; written confirmation requested from the instructor.
- **Mastery scores are never shared in a form that could influence grading.**
- **No autonomous misconduct flagging.** Scaffold surfaces signals to humans; it never accuses. A false suspicion is a real harm to a student and is treated as a design constraint, not an edge case.

---
---

# 9 · Presentation & Q&A — CLO6 · 20
> *Largest single item. Delivery is scored, not just content.*

### 9.1 The 60-second pitch
> Students paste lab problems into ChatGPT and submit the answer. A PNAS trial last year showed exactly what that costs: unguarded AI raised practice scores 48% and dropped unaided exam scores 17%. Guardrails fixed it — but every guardrailed tutor built since gives *the same* hint to every student. The closest system, ClassAid at CHI 2026, still needs an instructor to manually switch modes for the whole class.
> Scaffold closes that loop: telemetry detects struggle, a knowledge-tracing model maintains a live per-concept mastery estimate for each student, and hint specificity is computed from that estimate, filtered through an AST-level leakage guard.
> And there is a trap in that design we intend to solve, not ignore. Knowledge tracing learns from whether submissions are correct — but a student who pastes from ChatGPT submits correct code. A naive system would raise their mastery and give them *less* help. Our primary research question is whether behavioural telemetry — paste events, edit distance, time-on-task — keeps the mastery estimate honest when the code isn't the student's. We have that experiment running on the CSEDM dataset today.

### 9.2 Q&A bank

| Likely question | Short answer |
|---|---|
| **"How is this different from Codio, approved here last year?"** | Codio is a well-built platform solving a different problem: it removes the friction between watching a tutorial and running the code — pause the video, a vision model extracts the code, Judge0 executes it. But every AI feature it has **gives** the learner code: extraction, auto-completion, fix suggestions. Its adaptivity is quiz difficulty generated from transcripts, not a model of what the student knows from how they code. Our premise is the opposite — friction is where learning happens, so we model each student's mastery from their coding process and calibrate how much to withhold. Different context too: Python video tutorials versus a supervised C++ Data Structures lab, and our dashboard is for the instructor, not the student. |
| **"Isn't this just ChatGPT with a system prompt?"** | Remove the LLM: we still have knowledge tracing, telemetry, struggle detection, a leakage detector and a dashboard. No API decides what to reveal — our policy does. The model only renders the chosen level into English, and it runs locally. |
| **"If a student cheats, your model thinks they're good and helps them less."** | Correct — that is precisely our primary research question, and it is why telemetry-enriched DKT exists. We have measured it: [show Spike A chart]. |
| **"Why not just detect AI-written code?"** | Detection is discredited — 52 false positives from 114 human submissions in the published benchmark, accuracy halves after paraphrasing, 17.5% on non-English text. It would also be adversarial toward our own students. |
| **"How do you know a hint helped?"** | Not completion time — that is maximised by giving answers. Pre-registered primary outcome is transfer-task performance on an unaided task, plus hint dependency over successive labs. |
| **"Where is the complexity?"** | Three places: knowledge tracing that stays valid under adversarial input; sub-200 ms real-time capture for 60 students; program analysis over non-compiling C++, which is ~25% of incorrect submissions. |
| **"Can you finish this in two semesters?"** | Semester 1 delivers telemetry, struggle detection, the KT engine and end-to-end hint generation — about 45%. The DPO track is explicitly disposable and its failure is a reportable result, not a project failure. |
| **"What if your central hypothesis is wrong?"** | Then we report that standard KT is robust to AI-mediated submissions — which is a useful negative result the field does not have — and the system stands on the closed-loop contribution alone. |
| **"Why C++ and not Python like everyone else?"** | Because Data Structures is where pointer and memory reasoning lives, and because the literature is almost entirely Python and Java. It is harder and it is a differentiator. |
| **"Isn't keystroke logging surveillance?"** | Informed consent, opt-out with no loss of assistance, university-controlled storage, defined retention, grade independence, and no autonomous misconduct flagging. The system never accuses. |

### 9.3 Delivery rules
- Spike A chart is the emotional centre of the talk. Get to it inside four minutes.
- Say "we do not know yet" where true. The panel rewards it.
- One person owns each module in Q&A — the owner answers, not the most confident speaker.
- Never say "the AI decides". Say "our policy decides; the model writes the sentence".

---
---

# Appendix · Evidence card (numbers to have ready)

| Claim | Number | Source |
|---|---|---|
| Unguarded AI harms unaided exams | +48% practice / **−17% exam**; tutor +127% / −0.4% n.s. | Bastani, PNAS 2025, ~1,000 students |
| Students reuse AI solutions directly | **>80%** | Prompt-Level Trajectories 2026 |
| Guardrail bypass, worst among weak students | **50%** used bypass; 14% always | Optional Guardrails 2026, n=885 |
| Gaming corrupts knowledge tracing | up to **−15.2% AUC**, BKT worst | Gaming & Learner Modeling 2025 |
| Closest system has no student model | 4 instructor-selected modes, n=54 | ClassAid, CHI 2026 |
| Largest guardrailed deployment measured no learning | 700 students, usage/perceptions only | CodeAid, CHI 2024 |
| Human escalation does not solve it | 82 students, 673 hints, 22% unhelpful; instructor fixes wrong/insufficient **~half** the time | Closing the Loop, SIGCSE 2026 |
| AI-code detection is unreliable | **52 FP / 114** human submissions; 77%→49% after paraphrase | Orenstrakh et al. 2023 |
| Non-compiling submissions | **9,906 / 38,883 (~25%)** | CodeWorkout / APR 2025 |
| KC labelling is hard | AUC>75% on 2 of 3 KCs, expert labels needed | JEDM, KC Attribution |
| Best comprehension probe class | time-to-predict-output **r = 0.86**; syntax probes weak/negative | Code Comprehension Proxies 2026 |
| Pedagogical alignment is math-only | TutorRL, PEARL, SocraticLM, LearnLM, ACL'26 Multi-Horizon — all MathDial/GSM8k | verified across 6 works |
