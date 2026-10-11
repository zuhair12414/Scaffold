# SCAFFOLD — Proposal Defense: slide content + script
### 12 slides · **~1,340 spoken words** · 6-professor panel · content spec for Claude Design

> **Pace check.** 1,340 words is **9:35 at 140 wpm** and **10:20 at 130**. Time your first
> rehearsal, then trim to fit — the cut list, in order, is: Slide 4's third source, Slide 9's
> second paragraph, Slide 2's first paragraph. **Never cut Slide 5 or Slide 6.**

---

## HOW TO USE THIS FILE

Each slide below gives you four things:

| Block | For |
|---|---|
| **ON SLIDE** | the exact text to put on the slide — nothing else goes on it |
| **VISUAL** | what Claude Design should draw |
| **SCRIPT** | word-for-word, spoken |
| **IF PRESSED** | the follow-up answer for that slide, ready |

**Density rule for the designer:** maximum **one headline + three lines + one visual + one callout** per slide. Everything else in this file is spoken, not printed. If a slide has more than ~35 words on it, cut it.

---

## THE THREE THINGS YOU MUST PROVE

A panel of six is not reading your report. They are deciding three yes/no questions. Every slide is tagged with which one it answers.

| | Burden | Where it is won |
|---|---|---|
| **① NEED** | the problem is real, measured, and here | Slides 2, 3 |
| **② NOVELTY** | nobody has done this — and you can name who came closest | Slides 3, 4, 7 |
| **③ COMPLEXITY** | this is a CCP, not a weekend build | Slides 5, 6, 8, 11 |

**If you lose one, you lose the defense.** ① and ② are cheap to prove — you have citations. ③ is where most FYPs die, so slides 5 and 6 get the most time.

---

## SPEAKER MAP · 9:15

| Speaker | Slides | Clock |
|---|---|---|
| **Rauf** | 1 · 2 · 3 | 0:00 – 2:25 |
| **Zuhair** | 4 · 5 · 6 | 2:25 – 5:17 |
| **Jawad** | 7 · 8 · 9 · 10 | 5:17 – 8:06 |
| **Rauf** | 11 + close | 8:06 – 9:00 |
| — | 12 (References) | not spoken — leave on screen for Q&A |

**Checkpoints:** `2:25` hand to Zuhair · `4:08` start slide 6 · `5:17` hand to Jawad · `8:06` back to Rauf.

---
---

# SLIDE 1 — Title and one-line problem
**Rauf · 8:06 → 8:48 · sets up ①**

### ON SLIDE
> **SCAFFOLD**
> Knowledge-State-Driven Adaptive Scaffolding for Programming Labs
>
> Muhammad Zuhair 23I-0001 · Muhammad Jawad Ali 23I-3024 · Abdul Rauf 23I-0591
> Supervisor: Ma'am Rabail Zahid · Department of Computer Science, FAST NUCES Islamabad
> Stream B (Application-Derived) · UN SDG 4 — Quality Education
>
> **CALLOUT BOX:**
> Adaptive help must know what a student knows. Every student model infers that from **submission correctness** — and a student who delegates to AI submits **correct code they do not understand.**

### VISUAL
Title-only. Large project name, thin accent rule above it. Names on one line. The callout box is the visual — give it real weight, ~20% of the slide.

### SCRIPT
> Good morning. I'm Abdul Rauf, with Muhammad Zuhair and Muhammad Jawad Ali, supervised by Ma'am Rabail Zahid. Our project is Scaffold.
>
> The problem in one sentence. **To give a student the right amount of help, you first have to know what that student actually knows.** Every system that estimates this computes it from whether their submissions were correct. A student who pastes from ChatGPT submits correct code they do not understand. So the measurement is broken — and everything built on top of it is broken with it.

### IF PRESSED
*"Isn't this just an AI tutor?"* — "The tutor is the application. The contribution is the measurement underneath it. I'll show you why in three slides."

---

# SLIDE 2 — Problem and users
**Rauf · 8:06 → 8:48 · proves ① NEED**

### ON SLIDE
> **The workflow we are up against**
>
> **VISUAL: 6-step chain** — Opens lab task → Stalls ≈10 min → Pastes into ChatGPT → Pastes answer back → Compiles, tests pass → **Submits**
> Red annotation under the chain: **4 minutes, start to finish — no struggle, no signal, no visibility**
>
> **THREE STAT TILES:**
> `+48%` practice score, unguarded AI
> `−17%` unaided exam score ← in red
> `50%` of students used the bypass button
> Small caption: PNAS 2025, RCT, n ≈ 1,000 · optional-guardrail study, n = 885
>
> **CALLOUT:** The weakest students delegate most. **The harm is not uniform** — and uniform assistance widens the gap it is meant to close.

### VISUAL
Chain across the top, three big number tiles beneath, callout at the bottom. The `−17%` tile must be visually distinct (red).

### SCRIPT
> Who this affects: our own second-year C++ Data Structures students, forty to sixty per section — and the instructor and TAs, who must certify that a student can actually program, with no instrument to observe it.
>
> Today's workflow. Opens the task. Stalls at ten minutes. Pastes it into ChatGPT. Pastes the answer back. Compiles, tests pass, submits. **Four minutes, start to finish.** Nobody learned anything and nobody can tell.
>
> This is measured, not asserted. A PNAS randomised trial, a thousand students: unguarded AI raised practice scores forty-eight percent and **dropped unaided exam scores seventeen percent.** Given a bypass button, half a cohort used it — the weakest students most.
>
> The harm is not uniform. That is the whole problem.

### IF PRESSED
*"Do you have evidence this happens at FAST specifically?"* — "Not yet, and we're not going to claim it. Our Month-1 deliverable includes instructor interviews and a baseline telemetry week in one section. The published effect is what justifies looking; our own data is what will justify the design."

---

# SLIDE 3 — Existing solutions and prior-FYP comparison
**Rauf · 8:06 → 8:48 · proves ① + ② NOVELTY**

### ON SLIDE
> **Where every existing system stops**
>
> **COMPARISON TABLE** — columns: System | Per-student knowledge model | Hint calibration | Leakage control | Compute / data residency | Learning outcome measured
>
> | CodeHelp (Koli '23, n=52) | No | One-size-fits-all | Prompt guardrail | Cloud, off-prem | No |
> | CodeAid (CHI '24, n=700) | No | One-size-fits-all | Pseudocode-only | Cloud, off-prem | No — usage only |
> | ClassAid (CHI '26, n=54) | **No** | Instructor picks 1 of 4 modes | Mode-based | Cloud, off-prem | No |
> | Codio (FAST FYP, Fall '25) | No — quiz difficulty | **None — hands over code** | None | Cloud, off-prem | No |
> | **SCAFFOLD** | **Yes — BKT / DKT** | **Automatic, per student** | **Graduated + AST filter** | **Local 7B, on-premises** | **Yes — transfer task** |
>
> **CALLOUT:** Codio removes friction. **We calibrate it.** Opposite objectives.

### VISUAL
Table is the slide. Highlight the Scaffold row with a filled band. Red text on "None — hands over code" and on ClassAid's "No".

### SCRIPT
> We compared the closest published systems and the closest prior FYP from this department.
>
> CodeHelp and CodeAid are guardrailed tutors at real scale — CodeAid across seven hundred students. Both give the same hint to every student, and neither measured learning.
>
> ClassAid, at CHI this year, is closest to ours — and still has no per-student model. An instructor switches one of four modes for the whole class.
>
> Codio was approved here last year, and I want to be precise, because it is well built. Pause a video, Gemini extracts the code from the frame, Judge0 runs it in a sandbox. But every AI feature hands the learner code, and its adaptivity is quiz difficulty from transcripts. **Codio removes friction. We calibrate it. Opposite objectives.**
>
> So the gap is precise. Everyone here has assistance. **Nobody has a per-student knowledge state to calibrate it against** — and nobody keeps that state honest when the student delegates.
>
> Zuhair.

### IF PRESSED
*"How do we know you searched properly?"* — "Structured review, roughly seventy papers, 2015 to 2026, across CHI, SIGCSE, ICER, EDM, Koli Calling, ACL and AAAI, plus all 1,056 projects in the departmental FYP archive from Spring 2022 onward. The four systems in that table are the survivors."

---

# SLIDE 4 — R&D / recent technical work
**Zuhair · 8:06 → 8:48 · proves ② NOVELTY**

### ON SLIDE
> **Three findings, three design decisions**
>
> **THREE-ROW TABLE**, arrow between columns:
>
> | **Bastani, PNAS 2025** — −17% unaided exam unguarded; −0.4% guardrailed (n.s.) | ⇒ | The guardrail is **load-bearing**. Ours inspects generated text **output-side**, not a line in a prompt. |
> | **DKT / Code-DKT (NeurIPS '15, EDM '22)** — LSTMs over (skill, correct) tuples | ⇒ | Everything they observe is **correctness**. That input vector is where we intervene. |
> | **Gaming & learner modeling, 2025** — up to **−15.2% AUC**, parametric models worst | ⇒ | BKT is our **baseline to beat**, not our deployment model. |
>
> **CALLOUT:** Every student model in this field observes only **whether the answer was right.**

### VISUAL
Three rows, big ⇒ arrows. Left column = source + finding in muted type; right column = our decision in strong type. The arrow is the point of the slide.

### SCRIPT
> Three sources drive our design decisions — the engineering takeaway from each, not the summary.
>
> Bastani, in PNAS. The finding is not that AI is harmful; it is that **the guardrail is load-bearing.** Same model, same students: unguarded, minus seventeen percent on the unaided exam; guardrailed, minus point four, **not significant.** So our guardrail inspects generated text output-side, not a line in a prompt.
>
> Deep Knowledge Tracing and its code-aware descendants observe only **correctness**. That input vector is where we intervene.
>
> Third, and this shaped the project: a 2025 study poisoned BKT, AFM and DKT with simulated gaming and measured up to a **fifteen-point AUC collapse**, parametric models worst. BKT is parametric — so it is our baseline to beat, not our deployment model.

### IF PRESSED
*"Name a paper that does what you're doing."* — "None, and that's the claim. The closest is CoTutor, 2025 — Bayesian knowledge tracing for AI-assisted programming education, 203 students. It updates mastery from submission verdicts and never addresses whether a correct submission still evidences mastery under AI assistance. It demonstrates the gap by walking into it."

---

# SLIDE 5 — Complex computing challenge
**Zuhair · 8:06 → 8:48 · proves ③ COMPLEXITY**

### ON SLIDE
> **Why this is not a CRUD app or an API wrapper**
>
> **2 × 2 GRID, four short blocks:**
>
> **C1 · Adversarially corrupted estimation** — Correct code is no longer evidence, and our own intervention changes the generating distribution. *No stationarity ⇒ no convergence guarantee.* ← red
> `CCP 1 · 2 · 8`
>
> **C2 · Real-time ordered ingestion** — 60 concurrent streams, p95 < 200 ms, zero event loss. Out-of-order events reconciled per student — **a race on the mastery update.**
> `CCP 3 · 5`
>
> **C3 · Static analysis of non-compiling C++** — ≈**25%** of incorrect submissions never compile. Precisely the struggling students.
> `CCP 3 · 5`
>
> **C4 · Bounded inference budget** — ≤24 GB VRAM, INT4, p95 < 8 s at 10 concurrent, **on-premises.**
> `CCP 1 · 7`
>
> **FOOTER STRIP — nine numbered chips, 1 to 9.** Filled/accent: **1, 2, 3, 5, 7, 8.** Outlined/grey: 4, 6, 9.
> Caption: *Seoul Accord characteristics evidenced above. We do not claim 4, 6 or 9.*
>
> **CALLOUT:** **Delete the language model entirely and all four problems are still there.**

### VISUAL
Four quadrants, generous whitespace, bold C1–C4 labels. Three lines maximum per quadrant. Each quadrant carries a small monospace CCP tag in the corner. Beneath the grid, a single row of nine small numbered chips — six filled in accent, three outlined grey — then the callout. The visible *restraint* of three grey chips is the point: it reads as analysis, not box-ticking.

### SCRIPT
> Why this is not a CRUD application or an API wrapper. Four constraints.
>
> The first is the interesting one. **Our estimator is adversarially corrupted by design.** A delegating student submits correct code, so a naive model raises their mastery and gives them *less* help. And our own intervention changes their behaviour, which changes the data the model learns from. No stationarity, therefore **no convergence guarantee.**
>
> Second, real time: sixty concurrent streams, p95 under two hundred milliseconds, zero loss — a race on the mastery update.
>
> Third, static analysis of C++ that does not compile: twenty-five percent of incorrect submissions, precisely the struggling students.
>
> Fourth, twenty-four gigabytes of VRAM, p95 under eight seconds at ten concurrent, on-premises.
>
> Those four constraints evidence **six of the nine Seoul Accord characteristics** — one, two, three, five, seven and eight. **We are not claiming the other three.**
>
> **Delete the language model entirely and all four problems are still there.**

### IF PRESSED — why only six?
*"Why don't you claim 4, 6 and 9?"* — "Because we can't evidence them yet and we'd rather say so. **6, diverse stakeholders** — we have a student and an instructor; the integrity office and the TA tier are design intent, not something we've interviewed. **9, ill-defined requirements** — instructors genuinely disagree about what legitimate AI use is, but until we've run those interviews in Month 1 that's a hypothesis. **4, unfamiliar issues** — adversarial students are non-routine, but they overlap so heavily with characteristic 1 that claiming both would be double-counting. If those interviews land as we expect, 6 and 9 come in at the mid evaluation."

### IF PRESSED — this is the "vibe-code it in a week" question, expect it here
*"Couldn't a strong engineer build this in a week with AI?"* — "They could build the chat interface in a day. They could not decide **which** student is struggling, **what** that student knows, **how much** to reveal, or **whether** the output leaked the solution — because those are not interface problems, they are estimation problems on adversarially corrupted data with no stationarity guarantee. The language model writes one sentence at the end of a five-component pipeline. It is Core-Assist, not Core-Replacement."

---

# SLIDE 6 — Proposed solution and contribution
**Zuhair · 8:06 → 8:48 · proves ③ + ②**

### ON SLIDE
> **The closed loop**
>
> **ARCHITECTURE DIAGRAM** — 7 boxes, left to right, with a feedback arrow returning to the start:
> Student IDE (Monaco + telemetry) → **split into two** → Struggle Detector / Behaviour Classifier (struggle · stuck · delegated) → **Knowledge Tracing Engine** (BKT → DKT → **Telemetry-DKT**) → Hint Engine (Qwen2.5-Coder-7B, vLLM) → Guardrail (AST leakage + jailbreak) → back to Student IDE
> Branch from Knowledge Tracing down to Instructor Dashboard.
> Amber annotation under the KT box: **uncertain estimate ⇒ disclose less, not more**
>
> **THREE CONTRIBUTION LINES:**
> **1 Closed loop** — no human in the real-time path. ClassAid needs an instructor to switch modes; we compute the level.
> **2 Telemetry-DKT validated for mastery validity, not AUC** — ← amber, marked **PRIMARY RESEARCH CLAIM**
> **3 Graduated AST leakage measure** — prior work treats leakage as binary, and all of it is mathematics.

### VISUAL
The diagram is the slide — give it 60% of the height. Knowledge Tracing box in amber (it is the contribution); everything else neutral. Feedback arrow must be visible as a loop.

### SCRIPT
> Here is the system. Telemetry streams from a Monaco editor over WebSocket — Jawad built that layer. A struggle detector and a behaviour classifier read it, and both feed the knowledge tracing engine, which maintains a per-concept mastery vector **with uncertainty attached.** That vector plus the struggle signal selects a disclosure level. Only then does the model render that level into English, and the guardrail inspects the output before the student sees it.
>
> Note the amber path. **When the estimate is uncertain, we disclose less, not more.**
>
> Three contributions. First, the closed loop — no human in the real-time path. ClassAid needs an instructor to switch modes; we compute the level.
>
> Second, our primary claim: knowledge tracing validated for **mastery validity** under AI-mediated submissions, not just AUC. Bayesian Knowledge Tracing's *guess* parameter — correct without mastery — is a **per-concept constant.** Delegation is a per-opportunity guess rate near one. The model has no parameter that can express it, so it books the answer as mastery. We make that parameter a function of telemetry.
>
> Third, a graduated AST leakage measure. Prior work treats leakage as binary, and all of it is mathematics.

### IF PRESSED
*"Explain BKT."* — "A hidden Markov model with a binary latent mastery state per concept and four parameters: prior knowledge, learn rate, **slip**, and **guess**. Each submission updates the posterior. And slip and guess are exactly why it breaks for us — delegation presents as an extremely high guess rate, and BKT has no mechanism to attribute it."

---

# SLIDE 7 — POC-lite / feasibility evidence
**Jawad hands to Zuhair, who runs it live · 5:17 → 6:06 · proves ② + feasibility**

> ### ⚠ THIS SLIDE IS A MAP OF A LIVE RUN — NOT A SUBSTITUTE FOR ONE
> The handbook is explicit in three places:
> - Appendix A, Stage 0: *"Demonstrated POC-lite addressing the riskiest assumption
>   (API integration, baseline run, or data pipeline — **not just a UI mockup**)."*
> - C.12: *"Mandatory approval gate at Week 4. **Must be demonstrated live, not
>   presented as slides.**"*
> - Form 1, criterion 5 (CLO4, **15 marks**): *"**Live proof** testing riskiest assumption."*
>
> And §2.2: *"**No live system at demo stage: implementation marks capped at 40%.**"*
>
> **So: open a terminal, run the script, let the table print.** It takes 0.34 seconds.
> The slide stays on screen behind you as the frame for what they just watched.
> Screenshots are your **fallback if the laptop fails**, and what goes in the report.

### ON SLIDE
> **The riskiest assumption, tested**
>
> **THE QUESTION (statement box, top):**
> Does standard knowledge tracing over-estimate mastery when submissions are AI-mediated — and does conditioning on telemetry fix it?
>
> **RESULT TABLE** (this is the whole slide — leave room for it):
>
> | delegating cohort | standard BKT | telemetry-conditioned | honest students |
> |---|---|---|---|
> | 0% | 0.000 | 0.000 | +0.016 |
> | 25% | **+0.422** | **+0.264** | +0.026 |
> | 50% | **+0.478** | **+0.325** | +0.023 |
>
> caption: mastery inflation = estimated − true · 180 students × 14 opportunities · BKT fitted with Baker caps
>
> **RED BANNER, unmissable:** SIMULATED COHORT · synthetic delegation signature · to be replicated on CSEDM 2021
>
> **CALLOUT:** The premise holds — and the fix is **only partial.** That residual changed our architecture.

### VISUAL
Statement box, then the table large and central, then the red provenance banner, then the callout. **No screenshots of the product on this slide.** The UI prototype belongs on Slide 6 or in backup — it is illustration, not evidence.

### SCRIPT
> **ZUHAIR:** Our riskiest assumption is the one the whole project rests on, so we tested it first. I'm going to run it now — it takes under a second.
>
> *[run the script; let the table print]*
>
> A simulated cohort of a hundred and eighty students, with **ground-truth mastery we control**, which no real dataset can give us. We fit Bayesian Knowledge Tracing on the clean cohort, then inject delegation at twenty-five and fifty percent — those students submit correct from opportunity six onward and stop learning.
>
> Standard BKT reports **plus point four-two mastery that does not exist.** A tutor gating hints on that number withdraws help from exactly the students who need it. Conditioning the guess parameter on telemetry brings it down to plus point two-six — and honest students move by two-hundredths, so it does not over-fire.
>
> But look at what is left. **Forty percent of the inflation survives**, because BKT keeps applying its learning term even after we discount the evidence. Suppressing the emission is not enough — the transit parameter has to be gated too. **We did not predict that, and it changed our architecture.**
>
> **JAWAD:** Not built yet: the telemetry pipeline, disclosure policy, guardrail, dashboard, KC taxonomy, and the classroom study.

### IF PRESSED
*"Is this real data?"* — "No, and the banner says so. Simulated cohort with a synthetic delegation signature. We used simulation deliberately because we need ground-truth mastery to measure inflation against, and no real dataset has it. Replication on CSEDM 2021 — CodeWorkout, Java CS1, 410 students — is the next step."

*"Isn't this true by construction?"* — "The direction is. The **magnitude** isn't, and the **residual** certainly isn't — that's the forty percent that survives the fix, and it's the reason we now gate two parameters instead of one. That finding is what a POC is for."

*"Show us the code."* — Open it. It is about a hundred and thirty lines, BKT is implemented directly rather than imported so any of us can explain every line.


# SLIDE 8 — Evaluation plan and risks
**Jawad · 8:06 → 8:48 · proves ③**

### ON SLIDE
> **How we will know**
>
> **LEFT — TARGETS:**
> Primary outcome — Transfer task, *unaided* (pre-registered)
> **Mastery inflation** — Telemetry-DKT < DKT < BKT ← amber
> DKT accuracy — AUC ≥ 0.70, *leave-students-out* CV
> Capture / hint latency — p95 < 200 ms · p95 < 8 s
> Leakage — < 5% at AST similarity ≥ 60%
> Study — n ≥ 30, α = 0.05, β = 0.80
>
> **RIGHT — IF IT FAILS:**
> **Injection experiment flat** → premise disproved. We report it; the closed-loop contribution stands.
> **Qwen quality too low** → commercial API for the study only, trade-off documented, not hidden.
> **KC taxonomy slips** → transfer learning from correctness labels.
> **DPO fails to converge** → secondary track; a reportable negative result.
>
> **CALLOUT:** Deliberately **not** time-to-solution — that metric is maximised by a system that just gives the answer.

### VISUAL
Two columns, targets left in a clean key-value table, fallbacks right as four short lines. Amber highlight on the mastery-inflation row.

### SCRIPT
> Evaluation. Deliberately **not** time-to-solution — that is maximised by a system that just gives the answer. Our pre-registered primary outcome is transfer-task performance on an unaided task.
>
> Targets: p95 capture under two hundred milliseconds at sixty users; hint latency under eight seconds at ten concurrent; DKT AUC at least point seven under **leave-students-out** cross-validation; leakage below five percent.
>
> Two fallbacks matter. **If the injection experiment shows no difference, our premise is disproved — we report it, and the closed-loop contribution still stands.** If our local model's quality fails acceptance, we use a commercial API for the study only and document the trade-off rather than hide it.

### IF PRESSED
*"Why leave-students-out?"* — "Because an interaction-level split puts the same learner in train and test and inflates AUC. The unit of generalisation is the student, so the split has to be the student."

---

# SLIDE 9 — Work division and iteration plan (WBS)
**Jawad · 8:06 → 8:48 · proves scope discipline**

### ON SLIDE
> **Who owns what**
>
> **THREE COLUMNS:**
> **Muhammad Zuhair** · 23I-0001 · ML — Knowledge tracing & **mastery validity**
> BKT baseline · DKT comparison · injection experiment · Telemetry-DKT · DPO
>
> **Muhammad Jawad Ali** · 23I-3024 · Systems — Real-time capture, **latency & concurrency**
> Telemetry pipeline · struggle detector · integration · instructor dashboard
>
> **Abdul Rauf** · 23I-0591 · Full-stack & Research — Disclosure policy, **leakage & evaluation**
> Hint generation · C++ KC taxonomy · ethics · guardrail · classroom study
>
> **MILESTONE STRIP:** Wk 4 Defense + POC → Wk 8 SRS + telemetry live → **Wk 15 ≈45% implemented** → FYP-2 Guardrail + study
>
> **CALLOUT:** The two items most likely to slip — **ethics approval and the KC taxonomy** — are scheduled **first**, in Month 1.

### VISUAL
Three equal columns, then a horizontal milestone chain beneath. Highlight the Wk 15 node.

### SCRIPT
> Each of us owns a subsystem that disappears if we are removed — and defends it here today. Zuhair owns knowledge tracing and mastery validity. I own real-time capture — telemetry, struggle detection, latency, dashboard. Rauf owns disclosure and evaluation — hint generation, the C++ knowledge-component taxonomy, ethics, and the classroom study.
>
> Semester one closes at roughly forty-five percent implemented. The two items most likely to slip — ethics approval and the taxonomy — are scheduled **first**, in month one.

### IF PRESSED
*"Forty-five percent of what?"* — "Of the module list in our scope section: telemetry pipeline, struggle detector, knowledge tracing engine and the hint generation path, integrated and demonstrable. Guardrail, dashboard, telemetry-enriched DKT and the study are semester two."

---

# SLIDE 10 — Tools, technologies and the GenAI boundary
**Jawad · 8:06 → 8:48 · worth 10 marks (CLO5) and has no slide in the official list — do not skip it**

### ON SLIDE
> **Stack, and where the boundary sits**
>
> **LEFT — STACK:**
> Frontend — Monaco Editor, React / Next.js
> Backend — FastAPI, WebSocket, Redis Streams, PostgreSQL
> Modelling — pyBKT, PyTorch (DKT), scikit-learn
> Inference — Qwen2.5-Coder-7B (Apache 2.0) served by vLLM, GPTQ INT4, one RTX 3090
> Analysis — tree-sitter (C++), APTED, ProgSnap2
> Secondary — HuggingFace TRL + PEFT (LoRA / DPO)
>
> **RIGHT — DEPENDENCY CLASS:**
> **Core-Assist** — the LLM. Renders a chosen disclosure level into English. Nothing else.
> **Student-built core** — KT engine · telemetry pipeline · struggle detector · disclosure policy · AST leakage detector · dashboard
> **Support** — Monaco, FastAPI, React, pyBKT
> **Dev only** — commercial APIs, never in the deployed system
>
> **CALLOUT:** No external API decides what to reveal. **Our policy decides; the model writes the sentence.**

### VISUAL
Two columns. Right column is the important one — make the three dependency classes visually distinct blocks.

### SCRIPT
> Our stack is on the slide. What matters is the boundary.
>
> The language model is **Core-Assist.** It renders a chosen disclosure level into English and does nothing else. The knowledge tracing engine, telemetry pipeline, struggle detector, disclosure policy, leakage detector and dashboard are all ours. **No external API decides what to reveal — our policy decides, and the model writes the sentence.** It runs locally, so student code never leaves campus.
>
> On our own GenAI use: literature discovery and structuring, disclosed in our tool sheet, every technical claim cross-checked against the primary source, and a usage log countersigned by our supervisor.

### IF PRESSED
*"So you used AI to build an anti-AI-cheating project?"* — "We're not anti-AI. We're anti-*uncalibrated* help. We used AI the way we want our students to use it: to find things faster, then verify them ourselves. That distinction is literally what the system teaches."

---

# SLIDE 11 — DEI, ethics and legal
**Rauf · 8:06 → 8:48**

### ON SLIDE
> **DEI, ethics, legal**
>
> **THREE COLUMNS:**
>
> **Equity** — The weakest students delegate most. A model accurate only for strong students **widens the gap it exists to close.** → KT performance reported disaggregated by prior programming exposure; **disparity published, not omitted.**
>
> **Ethics** — Consent before any collection. Ethics application **Month 1.** University-controlled storage. Grade independence in writing. Local model — **student code never leaves campus.**
>
> **Legal / IP** — Qwen2.5-Coder-7B, vLLM **Apache 2.0**. pyBKT, PyTorch, Monaco **MIT**. CSEDM under its research data-use agreement. Commercial APIs: development only.
>
> **CALLOUT (red):** **Scaffold never accuses anyone.** It surfaces signals to a human. A false suspicion is real harm to a student — a design constraint, not an edge case.

### VISUAL
Three columns, then a full-width red-tinted callout. That last line is the final thing they read before questions — give it weight.

### SCRIPT
> Finally — and for this project these are not boilerplate.
>
> On equity: the weakest students delegate most, so a mastery model accurate only for strong students would widen exactly the gap we exist to close. We report knowledge-tracing performance **disaggregated by prior programming exposure**, and publish any disparity rather than omit it.
>
> On ethics: consent before any collection, ethics application in month one, university-controlled storage, grade independence in writing.
>
> And **Scaffold never accuses anyone.** It surfaces signals to a human. A false suspicion is real harm to a student — a design constraint, not an edge case.

---

# CLOSE
**Rauf · 8:48 → 9:00**

### SCRIPT
> Adaptive help needs a student model. Every student model is computed from submission correctness. Delegation breaks that measurement — and repairing it is our contribution.
>
> Thank you. We'll take questions.

**[STAGE]** Land it, say thank you, **stop talking, stand still.** No "that's it", no "I hope you liked it".

---

# SLIDE 12 — References
**Not spoken. Leave on screen through Q&A.**

### ON SLIDE — IEEE format, two columns
> [1] H. Bastani *et al.*, "Generative AI without guardrails can harm learning: evidence from high school mathematics," *PNAS*, 2025.
> [2] J. Prather *et al.*, "The Widening Gap: The Benefits and Harms of Generative AI for Novice Programmers," *ICER*, 2024.
> [3] M. Kazemitabaar *et al.*, "CodeAid: Evaluating a Classroom Deployment of an LLM-based Programming Assistant," *CHI*, 2024.
> [4] M. Liffiton *et al.*, "CodeHelp: Using LLMs with Guardrails for Scalable Support in Programming Classes," *Koli Calling*, 2023.
> [5] "ClassAid: A Real-time Instructor-AI-Student Orchestration System for Classroom Programming Activities," *CHI*, 2026.
> [6] C. Piech *et al.*, "Deep Knowledge Tracing," *NeurIPS*, 2015.
> [7] Y. Shi *et al.*, "Code-DKT: A Code-based Knowledge Tracing Model for Programming Tasks," *EDM*, 2022.
> [8] "Measuring the Impact of Student Gaming Behaviors on Learner Modeling," 2025.
> [9] T. W. Price *et al.*, "ProgSnap2: A Flexible Format for Programming Process Data," *ITiCSE*, 2020.
> [10] A. T. Corbett and J. R. Anderson, "Knowledge tracing: Modeling the acquisition of procedural knowledge," *UMUAI*, 1995.
> [11] M. S. Orenstrakh *et al.*, "Detecting LLM-Generated Text in Computing Education," 2023.
> [12] "CodeGuard: Improving LLM Guardrails in CS Education," *EACL Findings*, 2026.
> [13] S. H. Edwards and K. P. Murali, "CodeWorkout: Short Programming Exercises with Built-in Data Collection," *ITiCSE*, 2017.
> [14] R. Rafiq *et al.*, "Exploring Student Behaviors and Motivations using AI TAs with Optional Guardrails," *ACE*, 2026.
> [15] W. Kwon *et al.*, "Efficient Memory Management for LLM Serving with PagedAttention (vLLM)," *SOSP*, 2023.
> [16] R. Rafailov *et al.*, "Direct Preference Optimization," *NeurIPS*, 2023.

**Verify every entry against the primary source before printing.** An examiner who finds one fabricated citation will doubt the other fifteen.

---
---

# BACKUP SLIDES — after References, for Q&A only

| # | Title | Have ready because |
|---|---|---|
| B1 | **BKT update equations** — the four parameters, the correct/incorrect posteriors, and P(G) circled | Somebody will ask you to explain the model |
| B2 | **VRAM arithmetic** — 4.5 GB weights + 56 KB/token KV × 4 KV heads ⇒ ~8× headroom at 10 concurrent | "Will it actually fit on one card?" |
| B3 | **Instructor dashboard + disclosure ladder screenshots** | "What does the instructor actually see?" |
| B4 | **Two-semester Gantt**, week-numbered against FYP-1/FYP-2 gates | "Is this schedulable?" |
| B5 | **KC taxonomy draft** — the eight C++ Data Structures knowledge components | "What are you actually measuring mastery of?" |

---

# Q&A — 6 professors, assume 3 questions deep

**Rule: one sentence, then the evidence, then stop.** Silence after a complete answer reads as confidence. **The owner answers, not the most confident speaker.**

| Question | Owner | Answer |
|---|---|---|
| **"A 10x engineer could vibe-code this in a week."** | Zuhair | "They'd have the chat interface in a day. They would not have an estimator that stays valid under adversarially corrupted input with no stationarity guarantee, ordered sub-200 ms ingestion across sixty async streams, or static analysis of C++ that doesn't compile. Delete the model and all three remain." |
| **"If a student cheats, your model thinks they're good and helps them less."** | Zuhair | "Exactly right — and that's our primary research question, not an oversight. It's why telemetry-enriched DKT exists, and it's what slide seven measured." |
| **"How is this different from Codio?"** | Rauf | "Codio removes the friction between watching a tutorial and running code — every AI feature it has hands the learner code. Its adaptivity is quiz difficulty from transcripts. We calibrate friction instead of removing it, because friction is where learning happens." |
| **"Why not just detect AI-written code?"** | Rauf | "Detection is discredited — fifty-two false positives out of a hundred and fourteen human submissions in the published benchmark, accuracy halves after paraphrasing, seventeen percent on non-English text. It's also adversarial toward our own students." |
| **"How do you know a hint helped?"** | Rauf | "Not completion time — that's maximised by giving answers. Pre-registered primary outcome is transfer-task performance on an unaided task." |
| **"Explain BKT."** | Zuhair | *(see Slide 6 — memorise this one)* |
| **"BKT vs DKT?"** | Zuhair | "BKT is per-skill independent, four interpretable parameters. DKT is an LSTM over the whole sequence — it learns cross-skill transfer that BKT's independence assumption can't represent. More accurate, not interpretable, so we keep BKT as an auditable baseline." |
| **"How do you compute AST similarity?"** | Rauf | "Parse both into ASTs with tree-sitter, α-rename identifiers so variable naming can't mask a match, then tree edit distance over normalised subtrees. Threshold sixty percent, calibrated against a labelled set — not asserted." |
| **"Why tree-sitter and not Clang?"** | Rauf | "Clang needs code that compiles. Twenty-five percent of incorrect submissions don't — and those are the students we most need to model. tree-sitter has error recovery and gives us a partial tree." |
| **"Two events, same student, out of order?"** | Jawad | "Client-side monotonic sequence number, per-student ordered queue keyed by student ID, single-writer mastery update. Out-of-order inside the reorder window is buffered; beyond it, dropped and logged rather than applied." |
| **"Your dataset is Java, your course is C++."** | Zuhair | "CodeWorkout is Java CS1, 410 students. Priors and pipeline development only, not the deployed model. Java to C++ is a closer transfer than Python to C++ — same family, static typing. Cold start corrected with a diagnostic." |
| **"Why a local 7B and not GPT-4?"** | Jawad | "Student code must not leave campus, no per-request cost at class scale, and labs can't depend on internet. We accept it's weaker and we measure it — seventy percent of a blind sample rated appropriate by the instructor, or we escalate and document the trade-off." |
| **"Sample size justification?"** | Rauf | "Thirty minimum, medium effect, alpha point-oh-five, power point-eight, within-subjects — specifically within-subjects because between-subjects at our cohort size couldn't detect anything." |
| **"What if the instructor won't run the study?"** | Rauf | "The measurement contribution doesn't depend on it — the injection experiment runs offline on CSEDM. We'd lose classroom validation and report it as a limitation." |
| **"Isn't keystroke logging surveillance?"** | Rauf | "Informed consent, opt-out with no loss of assistance, university-controlled storage, defined retention, grade independence in writing, no autonomous misconduct flagging. The system never accuses." |
| **"What if your hypothesis is wrong?"** | Zuhair | "Then we report that standard knowledge tracing is robust to AI-mediated submissions — a useful negative result the field doesn't have — and the system stands on the closed-loop contribution." |
| **"Did you build this or did AI?"** | module owner | "Ask me to change something in it right now." **Only say this if it is true.** |

### When you do not know
> **"We haven't tested that yet. Here's what we'd have to measure to find out — [name the measurement]."**
Full stop. No trailing apology. Six examiners are specifically probing for bluffing, and one honest admission buys credibility for every confident answer around it. **Never invent a number.**

### Never say
| Don't | Do |
|---|---|
| "The AI decides the hint level." | "Our policy decides. The model writes the sentence." |
| "It's basically ChatGPT with a prompt." | "The model is the last stage of a five-component pipeline." |
| "We'll figure that out later." | "That's scheduled in month N. The dependency is X." |
| "It should work." | "We haven't measured that yet." |
| "Codio was weak." | "Codio is well built and solves the opposite problem." |
| "Basically…" / "Sort of…" | *delete the word, state the claim* |

---

# DESIGN DIRECTION FOR CLAUDE DESIGN

**Palette** — ink `#1B1F24` · accent `#0F4C81` · amber `#B26B00` (contribution/primary claim only) · flag `#A32C2C` (harm/blocked only) · muted `#6B7280` · rule `#E3E7EC` · paper white.

**Rules**
1. **One idea per slide.** If it needs two, it is two slides.
2. **Max 35 words on any slide.** Everything else is in the script.
3. **Amber is reserved** for the primary research claim and the knowledge-tracing box. Nothing else. Red is reserved for harm and for blocked disclosure.
4. **Every content slide ends in a callout box** — one sentence, centred, tinted. That is the line the panel remembers.
5. **No stock imagery, no icons for decoration.** The only images are the POC screenshots on slide 7.
6. **16:9, left-aligned titles with a thin accent rule.** No heavy title bars, no footer clutter — slide number only.
7. **Type floor 18 pt.** Six professors, one projector, back row.
