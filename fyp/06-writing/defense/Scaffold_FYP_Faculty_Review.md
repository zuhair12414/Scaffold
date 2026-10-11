# OFFICIAL FYP PROPOSAL REVIEW
## Project: Scaffold — Knowledge-State-Driven Adaptive Scaffolding for Programming Labs
### Reviewer: Technical Committee, Department of Computer Science
### Review Basis: Proposal discussions and documented research direction

---

> **OVERALL VERDICT: CONDITIONAL PASS — MAJOR REVISIONS REQUIRED**
>
> The core research direction is genuinely novel and appropriately scoped for a two-semester FYP. The literature coverage is commendable. However, several criteria — particularly Criterion 3 (measurable success criteria), Criterion 5 (feasibility evidence), Criterion 7 (work division), and Criterion 8 (DEI/Ethics) — are either absent or critically underdeveloped. The team must address all RED-flagged items before final approval. Items marked AMBER must be addressed in the Semester 1 progress review.

---

## CRITERION 1 — Complex Computing Challenge & R&D Basis
### Rating: SATISFACTORY (with one critical revision)

### Strengths

The research gap is legitimate and well-grounded. The team has surveyed approximately 70 papers spanning CHI, SIGCSE, EDM, AIED, ACL, and AAAI (2022–2026). They have correctly identified that three research areas — IDE telemetry, knowledge tracing for programming, and LLM-based hint generation — have each been studied independently but have never been connected into an automated closed loop. ClassAid (CHI 2026), the closest existing system, still requires the instructor to manually switch hint modes rather than doing so via an automated student model. This gap is real. It has been confirmed by reviewing the explicit future-work sections of STAP, Closing the Loop, and ClassAid, which all call for exactly what this team is proposing.

The complexity substantially exceeds standard course-project level. A course project might wrap an LLM API with a frontend. Scaffold requires: (a) training or adapting a knowledge tracing model on domain-specific programming data; (b) engineering a real-time telemetry pipeline capable of handling 40–60 concurrent students; (c) designing and evaluating a structured prompt construction pipeline that injects knowledge states into an LLM context; (d) building and evaluating a graduated code leakage detection and prevention layer; and (e) conducting a controlled classroom study with statistical analysis. No single one of these is a course project; their integration is a research project.

The most promising direction — applying pedagogical alignment via reinforcement learning (GRPO/DPO) to code tutoring — is genuinely novel. Every existing pedagogically aligned model (TutorRL, PEARL, SocraticLM, LearnLM, Sonkar et al.) has been trained exclusively on mathematical tutoring tasks. The team's observation that code leakage is a spectrum (function signature → pseudocode → partial code → complete solution), unlike math leakage which is binary, motivates a novel graduated reward function that has not been designed anywhere in the literature.

### Critical Revision Required 🔴

**The problem statement has not been written as a single, formal research question.** Informal phrasings such as "vibe coding habit" are colloquial and will fail academic scrutiny. Before submission, the team must produce one formal research question in the following structure:

> *"Does [X intervention] produce [measurable outcome Y] compared to [baseline Z] in [population P] under [conditions C]?"*

Proposed revision for committee approval:

> *"Does knowledge-state-conditioned, proactively triggered LLM scaffolding — where hint specificity is calibrated using a real-time knowledge tracing model updated from IDE telemetry — produce measurably better learning outcomes (transfer task performance, time to correct solution, hint dependency reduction) compared to reactive, student-model-blind LLM assistance in undergraduate programming labs?"*

The team must also decide, before submission, whether they are pursuing Track A (prompting-based system with KT injection) or Track B (pedagogically aligned model via GRPO). Both are defensible. Leaving both options open in the proposal will be read as insufficient planning. If choosing Track B, the proposal must acknowledge the compute requirements for RL training (multi-GPU, ~48–72 hours) and confirm access.

---

## CRITERION 2 — Product/Prior-FYP Comparison & Contribution Clarity
### Rating: SATISFACTORY (with one required addition)

### Strengths

The comparative analysis against existing systems is the strongest section of this proposal. The team has produced a differentiation table across six dimensions: student model, intervention trigger, hint calibration, leakage prevention, proactive support, and cross-session profiling. The comparison correctly identifies that CodeHelp (Koli Calling 2023), CodeAid (CHI 2024), STAP (ISAIE 2025), and ClassAid (CHI 2026) each lack at least three of these six dimensions. This is not cosmetic differentiation; it is substantive.

The contribution statement — implicit across the proposal discussions — can be reconstructed as:

*"We present the first system that closes the loop between real-time IDE telemetry, automated programming knowledge tracing, and knowledge-state-conditioned LLM hint generation, with a graduated code disclosure policy and a classroom study evaluating its effect on learning outcomes."*

If pursuing the RL track, the contribution strengthens further:

*"We are the first to apply pedagogical alignment via reinforcement learning to code tutoring, introducing a graduated code leakage reward function based on AST-level similarity that captures the spectrum of code disclosure absent in all prior math-domain alignment work."*

### Required Revision 🔴

**The team has not conducted a documented search of FAST NUCES's own FYP repository.** This is non-negotiable for criterion 2. A committee member or external evaluator will check this. The team must:

1. Search the departmental FYP archive for the past 5 years for any project involving: AI tutoring, adaptive learning systems, knowledge tracing, programming assistance, or educational chatbots.
2. Document each found project by title and year.
3. Write a paragraph explicitly stating how Scaffold differs from each.

If no prior FAST FYP exists in this space, that statement itself is the contribution context. The absence of documentation, however, is an automatic flag.

**One additional item:** The contribution statement must appear as a single, dedicated, numbered paragraph in the final proposal document — not distributed across sections. Reviewers should not have to infer it.

---

## CRITERION 3 — Scope, Requirements & Success Criteria
### Rating: INSUFFICIENT — MAJOR REVISION REQUIRED 🔴🔴

This is the proposal's most significant weakness. An otherwise strong technical direction has no measurable acceptance criteria attached to any module or milestone. The following table documents what exists versus what is required:

| Module | Described? | Measurable Acceptance Criterion | Status |
|--------|-----------|--------------------------------|--------|
| IDE Telemetry Pipeline | Yes | "Captures events" — no latency SLA, no concurrency spec | MISSING |
| Struggle Detector | Yes | "Detects stuck students" — no precision/recall target | MISSING |
| Knowledge Tracing (BKT) | Yes | "Predicts mastery" — no AUC threshold, no comparison baseline | MISSING |
| Knowledge Tracing (DKT) | Yes | "Better than BKT" — no minimum improvement threshold | MISSING |
| LLM Hint Engine | Yes | "Generates hints" — no quality metric, no latency SLA | MISSING |
| Guardrail Layer | Yes | "Prevents leakage" — no leakage rate target, no false positive budget | MISSING |
| Instructor Dashboard | Yes | "Shows class heatmap" — no latency, no data freshness SLA | MISSING |
| Classroom Study | Yes | "Compare with and without KT" — no sample size justification, no power analysis | MISSING |

### Required Additions 🔴

Every module must have at least one **measurable acceptance criterion**. The following are the minimum the committee expects:

**Telemetry Pipeline:**
- Captures all event types (keystrokes, compile events, paste events, idle) with less than 200ms capture latency for 60 concurrent users on the lab network.
- Zero event loss under sustained load (verified by replay and count comparison over a 1-hour stress test).

**Struggle Detector:**
- Achieves ≥0.75 precision and ≥0.70 recall on the "unproductive struggle" class, validated against hand-labeled segments from the pilot study.
- Produces a classification within 30 seconds of a triggering event.

**Knowledge Tracing (BKT vs DKT comparison):**
- DKT achieves ≥0.70 AUC on held-out student data (leave-students-out cross-validation, not random split).
- Telemetry-enriched DKT achieves statistically significant improvement over standard DKT (paired t-test, p < 0.05) on the same dataset.

**LLM Hint Engine:**
- Hint generation latency under 8 seconds for 10 concurrent requests on the lab's 3090.
- Hint quality: ≥70% of generated hints rated as "pedagogically appropriate" by the course instructor, evaluated on a blind set of 100 generated hints.

**Guardrail Layer:**
- Leakage rate (defined as: hints containing syntactically valid, executable code that achieves ≥60% AST similarity to the reference solution) below 5% of all generated hints.
- Jailbreak detection precision ≥0.90 on the CodeGuard evaluation set.

**Classroom Study:**
- Minimum 30 participants (justify with a power analysis for medium effect size, α=0.05, β=0.80).
- Pre-registered primary outcome: transfer task score (students solving an unseen problem without any AI assistance immediately following each experimental phase).

**Two-semester deliverables** must be explicitly listed. The following is the minimum required structure:

*Semester 1 Deliverables (must be demonstrable at mid-year review):*
- D1.1: BKT baseline running on CSEDM dataset with documented AUC.
- D1.2: DKT implementation with BKT vs DKT comparison table.
- D1.3: Monaco Editor-based web IDE with all telemetry events captured and logged.
- D1.4: Rule-based struggle detector with documented precision/recall on pilot data.
- D1.5: End-to-end hint generation working (code + knowledge state → LLM → hint displayed), with 50 instructor-rated hints as quality evidence.
- D1.6: Ethics approval application submitted.

*Semester 2 Deliverables:*
- D2.1: Telemetry-enriched DKT with ablation study results.
- D2.2: Guardrail layer with leakage rate documented.
- D2.3: Instructor dashboard with real-time data.
- D2.4: Phase 1 classroom study (baseline condition) complete with data collected.
- D2.5: Phase 2 classroom study (Scaffold condition) complete with data collected.
- D2.6: Statistical analysis and results.
- D2.7: Thesis submitted.

---

## CRITERION 4 — Proposed Solution & Technical Approach
### Rating: SATISFACTORY (with three required clarifications)

### Strengths

The system architecture is the most technically mature section. The five-layer architecture (Student → Telemetry/Detection → Knowledge Modeling → Generation → Instructor) is logically coherent and technically plausible. Technology choices are justified: Monaco Editor for browser-based code capture, pyBKT and the PyTorch DKT collection for knowledge tracing, Qwen2.5-Coder-7B for inference (appropriate choice — code-specialized, 7B fits in INT4 on 24GB VRAM, open weights), vLLM for concurrent serving (continuous batching verified to handle 50+ concurrent requests at ~11 tok/s each), FastAPI for the KT inference service, and React/Next.js for frontend. These are appropriate, non-arbitrary choices that the team has justified through benchmarks.

The GPU capacity analysis is thorough and the conclusion (one 3090 is sufficient for 60 students given realistic concurrency patterns) is correctly reasoned.

The knowledge tracing implementation path (BKT → DKT → telemetry-enriched DKT) is appropriately staged and builds toward a novel contribution (enriched features) from a validated baseline.

### Required Clarifications 🔴

**Clarification 1 — Training infrastructure for RL approach.** The PedagogicalRL codebase from ETH Zurich uses DeepSpeed ZeRO-3 across 4 GPUs for GRPO training of Qwen2.5-7B. A single 3090 is sufficient for inference but is not sufficient for RL training of a 7B model. The proposal must explicitly state one of: (a) access to the university's HPC cluster has been confirmed and the training job has been scheduled; (b) the team will use cloud GPUs (estimated cost: ~$150–300 for 48–72 hours on A100s via RunPod or Lambda Labs, which is a manageable FYP budget item); or (c) the team is pursuing Track A only (prompting, no RL training), in which case this concern does not apply.

**Clarification 2 — Graduated leakage reward function.** The concept of an AST-based graduated leakage metric is described qualitatively but not formally defined. The proposal must include at minimum a mathematical sketch:

> *L(r, s) = sim_AST(extract_code(r), s) × disclosure_weight(extract_code(r))*
>
> where sim_AST is tree-edit distance normalized to [0,1], s is the reference solution's AST, and disclosure_weight penalizes based on the proportion of the solution's structural nodes present in the response.

Specify which AST library will be used (Python: `ast` module; C++: `libclang` or `tree-sitter`). This is a design decision that affects both implementation and the validity of the reward signal.

**Clarification 3 — Cold start problem.** The proposal acknowledges that historical data from the FAST lab may not be available for initial KT model training, and proposes using the CSEDM 2021 dataset as a substitute. However, CSEDM is an introductory Python course dataset; if Scaffold deploys in a Data Structures (C++) context, there is a domain mismatch. The proposal must state explicitly: (a) which course it will deploy in; (b) what language that course uses; (c) whether CSEDM is a valid training proxy; and (d) what the cold-start initialization strategy is (CSEDM pre-training + local fine-tuning, LLM-based diagnostic quiz initialization, or something else).

---

## CRITERION 5 — POC-Lite / Technical Spike / Feasibility Evidence
### Rating: INSUFFICIENT — EVIDENCE MUST BE PROVIDED 🔴🔴

The PoC plan is well-structured (4 screens: Student IDE, Instructor Dashboard, Student Profile, Architecture Animation — all with hardcoded data). However, this criterion asks for **feasibility evidence**, not merely a UI prototype plan. A high-fidelity functional prototype of the interface is the minimum the university requires. But the evaluation criteria additionally specifies "API/data check, baseline run, sample pipeline, or risk experiment."

### What is missing

1. **No BKT/DKT model has been run.** The team has not demonstrated that they can load the CSEDM dataset, train a BKT model with pyBKT, and produce a mastery prediction output. This is a one-day task. Its absence from the evidence package is a gap.

2. **No telemetry capture has been tested.** The team has not demonstrated that Monaco Editor can emit events to a WebSocket backend. This is a 2-day task. Its absence is a gap.

3. **No LLM hint has been generated.** The team has not demonstrated a single end-to-end generation: student code + knowledge state → prompt → LLM → hint. This is a 1-day task using any API. Its absence is a gap.

4. **The PoC has been described but not built.** It is a plan for a prototype, not a prototype.

### Required Before Defense 🔴

The committee requires at minimum ONE of the following to be completed and presented as a technical spike:

**Option A (Recommended):** Run pyBKT on the CSEDM dataset. Document: AUC score, the concept list used, and a screenshot of the `model.predict()` output showing mastery probabilities per student per concept. This alone constitutes sufficient feasibility evidence for the KT component and takes approximately 4–6 hours.

**Option B:** Build the telemetry capture pipeline in isolation. Open Monaco Editor, type code, and demonstrate that keystroke events are being captured and logged to a JSON file in real time. A 30-second screen recording is sufficient evidence.

**Option C:** Run a single end-to-end hint generation via the Anthropic or OpenAI API. Use a hardcoded student knowledge state vector and a programming problem. Show the structured prompt and the generated hint. This takes 2 hours.

The UI prototype (4-screen React app) is required for the PoC and should be completed. But at least one of Options A, B, or C must accompany it as technical feasibility evidence for the underlying system.

---

## CRITERION 6 — Responsible Tool / API / GenAI Plan
### Rating: NEEDS REVISION 🟡

### What exists

The team has named the following components across their discussions: Qwen2.5-Coder-7B (primary inference model), pyBKT (knowledge tracing), DKT PyTorch collection (deep knowledge tracing), Monaco Editor (code editor), vLLM (LLM serving), FastAPI (backend), React/Next.js (frontend), CSEDM 2021 dataset (training data), and Claude/GPT-4 API (development/prototyping only). The ETH PedagogicalRL codebase (Apache 2.0) is identified as the starting point for the RL training pipeline.

### What is missing

**Missing 1 — No formal disclosure table.** The proposal must include a table in the following format for every external tool or API used:

| Tool/Model | Role | Core vs Support | License | Dependency Risk | Fallback |
|-----------|------|----------------|---------|-----------------|---------|
| Qwen2.5-Coder-7B | Primary LLM for hint generation | Core | Apache 2.0 | Low (open weights) | CodeLlama-7B |
| pyBKT | BKT knowledge tracing | Core | MIT | Low | Custom HMM implementation |
| ... | ... | ... | ... | ... | ... |

**Missing 2 — Claude/GPT-4 API cost budget.** If the team is using commercial APIs during development, what is the estimated monthly API cost? Has this been budgeted? If there is any possibility of the API being used during the classroom study (e.g., as the "high quality" comparison baseline), this must be disclosed and costed.

**Missing 3 — Data licensing for CSEDM.** The CSEDM 2021 dataset has specific terms of use. The proposal must confirm: (a) the team has read and agrees to the data use agreement; (b) the data will be used only for model training and not re-distributed; and (c) any published results from this data will acknowledge the data source per the dataset's citation requirements.

**Missing 4 — GenAI use in thesis writing.** FAST NUCES may have a policy on the use of GenAI tools (such as Claude or ChatGPT) in producing the thesis document. If the team has used or plans to use GenAI assistance in drafting the proposal or thesis, this must be disclosed in the proposal's GenAI statement section.

---

## CRITERION 7 — Work Division & Iteration Plan
### Rating: INSUFFICIENT — MAJOR REVISION REQUIRED 🔴🔴

This is the second most critical gap in the proposal. The team has produced a month-by-month timeline, which is a good starting point. However, the following items are completely absent:

### What is missing

**Missing 1 — Member-wise responsibility assignment.** The proposal makes no mention of how many team members are on this project (2 or 3?) or who is responsible for what. A committee cannot evaluate work division without knowing the team composition. Each module must be assigned a primary owner and a secondary reviewer.

The committee expects a table in this format:

| Member | Primary Responsibility | Semester 1 Milestone | Semester 2 Milestone |
|--------|----------------------|---------------------|---------------------|
| Member A | Knowledge Tracing Engine (BKT, DKT, Enriched DKT) | D1.1, D1.2 | D2.1, statistical analysis |
| Member B | Telemetry Pipeline + Struggle Detector + Backend | D1.3, D1.4 | D2.3 (dashboard) |
| Member C | LLM Hint Engine + Guardrail Layer + Evaluation Study | D1.5 | D2.2, D2.4, D2.5 |

Without this table, the committee cannot verify balanced division.

**Missing 2 — Iteration/sprint structure.** The monthly timeline describes what will be done but not how the team will iteratively develop and test. The committee expects at least a description of: (a) how often the team holds internal reviews (weekly? bi-weekly?); (b) how supervisor check-ins are scheduled; (c) what happens when a milestone slips — which later milestone has schedule slack built in?

**Missing 3 — Risk register and contingency plans.** Three high-probability risks have been identified that require documented contingencies:

| Risk | Probability | Impact | Contingency |
|------|-------------|--------|-------------|
| Cannot get ethics approval in time for classroom study | Medium | High | Fall back to lab mates as participants (convenience sample, note limitation in thesis) |
| RL training on 4 GPUs not accessible | High (if HPC not confirmed) | High | Fall back to Track A (prompting-based, no RL); still publishable |
| CSEDM dataset insufficient proxy for FAST course | Medium | Medium | Cold-start with LLM-based diagnostic quiz to initialize KT priors |
| Qwen2.5-7B hint quality too low for lab deployment | Medium | High | Switch to API-based inference during study, document tradeoff in thesis |

**Missing 4 — Front-end imbalance risk.** The PoC (5 days) is entirely frontend. The team must demonstrate that Semester 1 is not similarly imbalanced. Looking at the month-by-month plan, Months 2–6 do include substantial backend and ML work (BKT, DKT, telemetry pipeline, struggle detector). This is acceptable. However, the assignment of the frontend/UI work must be separated from the ML and systems work so one member is not blocked waiting for another's deliverable.

---

## CRITERION 8 — DEI, Ethical & Legal Issues
### Rating: INSUFFICIENT — REQUIRED BEFORE ANY HUMAN SUBJECTS WORK 🔴🔴🔴

This criterion has the highest severity flag because its absence has legal implications. The proposed classroom study involves collecting behavioral data from undergraduate students. In Pakistan, educational research with human subjects is governed by institutional policies and increasingly by international standards (Helsinki Declaration, ACM Ethics Code). No human subjects work may begin without the items listed below.

### What is entirely absent

**DEI Statement — Not present anywhere in the proposal.** This is a required section. The committee expects a minimum of two paragraphs addressing:

*Diversity and Representation:*
> "The Scaffold system is designed to serve all students enrolled in the target course, regardless of background. We acknowledge that existing knowledge tracing models trained on Western university datasets (e.g., CSEDM, ASSISTments) may embed biases that disadvantage students whose coding styles, commenting conventions, or problem-solving approaches differ from those in the training data. We will evaluate KT model performance disaggregated by self-reported academic background (first-generation university student vs. not) and flag any performance disparity for discussion in the thesis."

*Accessibility:*
> "The web-based code editor will be tested for keyboard navigability. Students who require accommodations (extended time, alternative interface) may be excluded from the behavioral analysis at their request while still using the system."

**Ethical Compliance Statement — Not present.** The following must be addressed:

1. *Informed consent protocol:* Students must be told: (a) that their coding interactions are being logged; (b) what data is collected; (c) how long data is retained; (d) that participation is voluntary and non-participation will not affect their grade; (e) that they may withdraw at any time. A consent form template must be drafted and included in the appendix.

2. *IRB/Ethics approval:* The team must submit an ethics application to FAST NUCES's relevant committee. If no formal IRB process exists at FAST, the team must obtain written approval from the Dean of the Faculty. The application must be submitted in Semester 1 Month 2, not "when convenient."

3. *Data minimization:* The proposal must state: what data is collected, where it is stored (on-premises only, not in a commercial cloud service), who has access, how long it is retained, and when it is deleted. Keystroke-level data is sensitive. Storing it on university servers with access restricted to the research team is the minimum standard.

4. *Student grade independence:* The proposal must explicitly state that a student's performance on the Scaffold system, or their participation in the study, has no effect on their course grade. This must be communicated to students in writing before the study begins. A letter from the course instructor confirming this is advisable.

5. *Algorithm fairness:* The KT model assigns mastery scores to students. These scores directly influence what hints they receive. If the model under-estimates mastery for a subgroup of students, they may receive more intrusive hints or lower-quality assistance. The proposal must commit to: (a) not using KT scores for any purpose other than hint calibration within the system; (b) not sharing individual student KT profiles with the course instructor in a form that could influence grading; (c) evaluating for demographic parity in KT predictions if demographic data is available.

6. *Legal compliance:* Student interaction data may constitute personal data under applicable law. The proposal should note whether FAST NUCES has a data protection policy that applies, and confirm that data collection complies with it.

---

## SUMMARY SCORECARD

| Criterion | Rating | Action Required | Priority |
|-----------|--------|----------------|----------|
| 1. Complex Computing Challenge | SATISFACTORY | Write formal research question; decide Track A vs B | 🔴 Pre-submission |
| 2. Product/Prior-FYP Comparison | SATISFACTORY | Search FAST FYP archive; write explicit contribution statement | 🔴 Pre-submission |
| 3. Scope & Success Criteria | INSUFFICIENT | Add measurable acceptance criteria for all modules; formal deliverables list | 🔴 Pre-submission |
| 4. Technical Approach | SATISFACTORY | Clarify training infrastructure; formalize leakage metric; address cold start | 🟡 Semester 1, Month 2 |
| 5. POC-Lite / Feasibility Evidence | INSUFFICIENT | Complete UI prototype AND at least one technical spike (BKT run, telemetry test, or end-to-end hint) | 🔴 Before defense |
| 6. Responsible Tool/API Plan | NEEDS REVISION | Write formal disclosure table; confirm CSEDM licensing; document GenAI use policy | 🟡 Semester 1, Month 2 |
| 7. Work Division & Iteration Plan | INSUFFICIENT | Assign member-wise responsibilities; add risk register; define sprint structure | 🔴 Pre-submission |
| 8. DEI, Ethical & Legal | INSUFFICIENT | Write DEI statement; draft consent form; submit ethics application | 🔴 Before any human subjects contact |

### Legend
🔴 Must be resolved before proposal is accepted or human-subjects work begins
🟡 Must be resolved by Semester 1 mid-point review

---

## COMMITTEE RECOMMENDATION

The project is **approved in principle** pending the revisions above. The research direction is sound, the literature review is thorough, and the technical architecture is credible. The team demonstrates awareness of the state of the art that is unusual for undergraduate FYPs and should be commended.

However, the proposal as currently documented would not pass a formal committee review because it lacks measurable success criteria (Criterion 3), human-subjects ethical safeguards (Criterion 8), and individual work assignments (Criterion 7). These are not minor omissions; they are structural requirements.

**Resubmission deadline:** Two weeks from the date of this review.

**Required items for resubmission:**
1. Formal research question (one sentence, structured form)
2. FAST FYP archive search results with differentiation paragraph
3. Measurable acceptance criteria table for all 8 modules
4. Member-wise responsibility assignment table
5. Risk register with contingencies
6. DEI statement (minimum two paragraphs)
7. Ethical compliance statement with consent form draft
8. At least one documented technical spike (BKT run, telemetry test, or end-to-end hint)
9. Formal tool/API disclosure table

Items 6, 7, and 8 of this list are not optional under any circumstances. No data collection from students may occur until written ethics approval is in hand.
