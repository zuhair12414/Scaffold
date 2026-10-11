# SCAFFOLD — 10-Minute Defense Script
### Word-for-word, timed, with a Q&A drill built for a panel that permits AI

**Spoken total:** ~1,350 words ≈ **10:00** at a deliberate pace with pauses.
**If you fall behind:** cut from Slide 4 and Slide 9. **Never** cut Slide 6 or Slide 7.

---

## Speaker map and clock

| Speaker | Slides | Clock | Owns in Q&A |
|---|---|---|---|
| **Rauf** | 1, 2, 3 | 0:00 – 2:55 | Problem, comparison, study design, ethics, scope |
| **Zuhair** | 4, 5, 6 | 2:55 – 6:35 | Knowledge tracing, modelling, AUC, DPO, the injection experiment |
| **Jawad** | 7, 8, 9 | 6:35 – 9:15 | Telemetry, latency, concurrency, deployment, infrastructure |
| **Rauf** | 10 + close | 9:15 – 10:00 | — |

**Checkpoints — call them silently:** `2:55` handing to Zuhair · `5:10` starting Slide 6 · `6:35` handing to Jawad · `9:15` starting Slide 10.

**The deck changed under this script.** Slides now carry ~3 short lines each and one takeaway box; the detail that used to be printed on screen is gone. That is deliberate — **if you do not say it, the panel will not get it.** Nothing in this script is optional colour any more; it is the content.

**Why the split matters.** The handbook's own rule is that authorship of keystrokes is not the test — comprehension and live modification under interrogation are. Each of you presents what you own. **When a question lands, the owner answers**, not the most confident speaker. A panel notices when someone answers outside their lane.

---
---

# THE SCRIPT

## SLIDE 1 — Title · **RAUF** · 0:00 → 0:40

> Good morning. I'm Abdul Rauf, with Muhammad Zuhair and Muhammad Jawad Ali, supervised by Ma'am Rabail Zahid. Our project is Scaffold.
>
> The problem in one sentence. **To give a student the right amount of help, you first have to know what that student actually knows.** Every system that estimates this computes it from whether their submissions were correct. A student who pastes from ChatGPT submits correct code they do not understand. So the measurement is broken — and everything built on top of it is broken with it.
>
> Repairing that measurement is our project.

**[STAGE]** Stand still. Don't read the names off the slide. Land the bolded sentence, then **pause a full second** before "Every system".

---

## SLIDE 2 — *The workflow we are up against* · **RAUF** · 0:40 → 1:40

> Who this affects. Our own second-year students in the C++ Data Structures lab, forty to sixty per section. And the instructor and TAs, who must certify that a student can actually program, with no instrument to observe it.
>
> The workflow today. Student opens the task. Stalls at about ten minutes. Pastes it into ChatGPT. Pastes the answer back. It compiles, tests pass, submit. **Four minutes, start to finish.** Nobody learned anything and nobody can tell.
>
> Why now — measured, not asserted. A PNAS randomised trial last year, about a thousand students: unguarded AI raised practice scores forty-eight percent and **dropped unaided exam scores seventeen percent.** And when a tutor offered a bypass button, half the cohort used it — the weakest students most, right before deadlines.
>
> The harm is not uniform. That is the whole problem.

**[STAGE]** Point at each workflow step as you say it. Pause after "four minutes, start to finish" — that number does the work for you.

---

## SLIDE 3 — *Where every existing system stops* · **RAUF** · 1:40 → 2:55

> We compared the closest published systems and the closest prior FYP from this department.
>
> CodeHelp and CodeAid are guardrailed tutors at real scale — CodeAid across seven hundred students. Both give the same hint to every student, and neither measured learning; CodeAid reports usage and perceptions only.
>
> ClassAid, at CHI this year, is closest to us — and still has no per-student model. An instructor watches a dashboard and switches one of four modes for the whole class.
>
> Codio was approved here last year, and I want to be precise, because it is well built. You import a YouTube playlist; pause the video, Gemini extracts the code from the frame, Judge0 runs it in a sandbox. But every AI feature it has hands the learner code — extraction, auto-completion, fix suggestions. Its adaptivity is quiz difficulty from transcripts. **Codio removes friction. We calibrate it. Opposite objectives.**
>
> So the gap is precise. Everyone here has assistance. Nobody has a per-student knowledge state to calibrate it against — and nobody keeps that state honest when the student delegates.
>
> Zuhair.

**[STAGE]** Deliver the Codio paragraph **generously**. Praising a prior FYP accurately reads as confidence; dismissing it reads as insecurity. Then the three-beat contrast — *removes / calibrate / opposite* — flat, unhurried, and stop.

---

## SLIDE 4 — *Three findings, three design decisions* · **ZUHAIR** · 2:55 → 4:00

> Three sources drive our design decisions. I'll give the engineering takeaway from each, not the summary.
>
> Bastani, in PNAS. The finding is not that AI is harmful — it is that **the guardrail is the load-bearing part.** Same model, same students: unguarded, minus seventeen percent on the unaided exam; guardrailed, minus point four, not significant. So our guardrail inspects generated text on the output side, not a line in a system prompt — prompt-only guardrails collapse under sustained adversarial pressure.
>
> Deep Knowledge Tracing and its code-aware descendants. LSTMs over skill-and-correctness tuples. Everything they observe is correctness. **That input vector is exactly where we intervene.**
>
> Third, and this shaped the project. A 2025 study poisoned BKT, AFM and DKT with simulated gaming and measured up to a fifteen-point AUC collapse — parametric models worst hit. BKT is parametric. So BKT is our baseline to beat, not our deployment model.

**[STAGE]** This is your credibility slide. Don't hurry it. Say *"minus point four, not significant"* — using statistical language correctly and unprompted is worth more than an extra slide.

---

## SLIDE 5 — *Four hard constraints* · **ZUHAIR** · 4:00 → 5:10

> Why this is not a CRUD application or an API wrapper. Four constraints.
>
> The first is the interesting one. **Our estimator is adversarially corrupted by design.** A delegating student submits correct code, so a naive model raises their mastery and gives them *less* help. And it compounds — our own intervention changes their behaviour, which changes the data the model learns from. No stationarity, therefore no convergence guarantee. The loop feeds itself.
>
> Second, real time. Sixty concurrent streams, p95 capture under two hundred milliseconds, zero event loss. Events arrive out of order from async producers and must be reconciled per student before scoring — a race on the mastery update.
>
> Third, static analysis of C++ that does not compile. Twenty-five percent of incorrect submissions in the reference dataset. Precisely the struggling students.
>
> Fourth, a hard bound: twenty-four gigabytes of VRAM, p95 under eight seconds at ten concurrent, on-premises.
>
> **Take the language model out entirely and all four problems are still there.**

**[STAGE]** The last line is your Core-Replacement answer, delivered before anyone asks it. Say it slowly. Then stop and let it sit.

---

## SLIDE 6 — *The closed loop* · **ZUHAIR** · 5:10 → 6:35

> Here is the system. Telemetry streams from a Monaco editor over WebSocket — Jawad built that layer.
>
> Two consumers read the stream: a struggle detector, and a behaviour classifier separating productive struggle from stuck from delegated. Both feed the knowledge tracing engine, which maintains a per-concept mastery vector **with uncertainty attached**. That vector plus the struggle signal selects a disclosure level. Only then does the model render that level into English, and the guardrail inspects the output before the student sees it.
>
> Note the amber path. **When the estimate is uncertain, we disclose less, not more.** Under-helping is recoverable. Over-helping destroys the thing we are protecting.
>
> Three contributions. First, the closed loop — telemetry, to knowledge state, to calibrated disclosure, with no human in the real-time path. ClassAid needs an instructor to switch modes; we compute the level.
>
> Second, our primary research claim: **telemetry-enriched DKT evaluated for mastery validity under AI-mediated submissions, not just for AUC.** Do paste flags, edit distance and time-on-task keep the estimate honest when the code is not the student's?
>
> Third, a graduated AST-similarity leakage measure — signature, naming, pseudocode, partial, full — generalising the binary leakage reward used in all prior pedagogical-alignment work, which is entirely mathematics.

**[STAGE]** Trace the diagram left to right with your hand. **Stop your hand on the amber box** for the uncertainty line. This is the slide the panel will remember — if you are behind the clock, take the time from Slide 4, not from here.

---

## SLIDE 7 — *What already runs* · **JAWAD**, with a handback to **ZUHAIR** · 6:35 → 7:40

> **JAWAD:** What runs today.
>
> Telemetry capture is live — Monaco to WebSocket to FastAPI, logging keystroke, paste and compile events while you type. The vLLM serving check is reproduced inside the twenty-four gigabyte budget. And the knowledge tracing pipeline executes: pyBKT fitted on CSEDM CodeWorkout, four hundred and ten students in ProgSnap2 format, producing per-student mastery with a reported AUC.
>
> The risk experiment is Zuhair's.
>
> **ZUHAIR:** We injected synthetic AI-mediated submissions into held-out trajectories at twenty-five and fifty percent, and measured how far each model's mastery estimate inflates. That is this chart. It tests the one assumption the whole project rests on — **and if it had come out flat, we would be standing here telling you our premise is wrong.**
>
> **JAWAD:** Not built: the disclosure policy, the guardrail, the dashboard, the C++ knowledge-component taxonomy, and the study.

**[STAGE]** The handback is deliberate — it proves ownership without a slide change. Jawad: say the "not built" list **fast and without apology**. Naming what you have *not* done is the strongest credibility move available to you in this room.

---

## SLIDE 8 — *How we will know* · **JAWAD** · 7:40 → 8:35

> Evaluation. Deliberately **not** time-to-solution — that is maximised by a system that just gives the answer. Our pre-registered primary outcome is transfer-task performance on an unaided task, with hint dependency across successive labs.
>
> System targets: p95 capture under two hundred milliseconds at sixty users; hint latency p95 under eight seconds at ten concurrent; DKT AUC at least point seven under **leave-students-out** cross-validation; leakage below five percent at a sixty percent AST-similarity threshold.
>
> Two fallbacks matter. **If the injection experiment shows no difference, our premise is disproved — we report that, and the closed-loop contribution still stands.** If Qwen's hint quality fails acceptance, we use a commercial API for the study only and document the trade-off rather than hide it.

**[STAGE]** Say *"leave-students-out cross-validation"* in full. Anyone can say AUC; the split is what shows you understand the evaluation.

---

## SLIDE 9 — *Who owns what* · **JAWAD** · 8:35 → 9:15

> Each of us owns a subsystem that disappears if we are removed — and defends it here today.
>
> Zuhair owns knowledge tracing and mastery validity. I own real-time capture: telemetry pipeline, struggle detector, latency and concurrency, and the instructor dashboard. Rauf owns disclosure and evaluation — the hint generation path, the C++ knowledge-component taxonomy, the ethics application, and the classroom study.
>
> Semester one closes at roughly forty-five percent implemented. The two items most likely to slip — ethics approval and the taxonomy — are scheduled **first**, in month one.

---

## SLIDE 10 — *DEI, ethics, legal* · **RAUF** · 9:15 → 9:55

> Finally — and for this project these are not boilerplate.
>
> On equity: the bypass study showed the weakest students delegate most. A mastery model accurate only for strong students would widen exactly the gap we exist to close. So we report knowledge-tracing performance disaggregated by prior programming exposure, and **publish any disparity rather than omit it**.
>
> On ethics: consent before any collection, ethics application in month one, university-controlled storage, grade independence in writing. The model runs on-premises — student code never leaves campus.
>
> And **Scaffold never accuses anyone.** It surfaces signals to a human. A false suspicion is real harm to a student, so we treat it as a design constraint, not an edge case.

---

## CLOSE · **RAUF** · 9:55 → 10:00

> Adaptive help needs a student model. Every student model is computed from submission correctness. Delegation breaks that measurement — and repairing it is our contribution.
>
> Thank you. We'll take questions.

**[STAGE]** Do not say "that's it" or "I hope you liked it." Land the sentence, say thank you, **stop talking, stand still.**

---
---

# THE FIVE SENTENCES THAT MUST LAND VERBATIM

Memorise these. Everything else you can paraphrase.

1. *"To give a student the right amount of help, you first have to know what that student actually knows."*
2. *"Codio removes friction. We calibrate it. Opposite objectives."*
3. *"Take the language model out entirely and all four problems are still there."*
4. *"When the estimate is uncertain, we disclose less, not more."*
5. *"If it had come out flat, we would be standing here telling you our premise is wrong."*

---
---

# Q&A DRILL

**Format rule:** *One sentence answer. Then the evidence. Then stop.* Silence after a complete answer reads as confidence; filling it reads as doubt.

## A. The AI-use questions — these WILL come, because AI is permitted

| Question | Owner | Answer |
|---|---|---|
| **"Did you build this, or did an AI build it?"** | Module owner | "Ask me to change something in it right now." **Only say this if it is true** — then do it. This is the handbook's own standard: comprehension and live modification, not keystroke authorship. |
| **"You used AI to write this proposal, didn't you?"** | Rauf | "Yes — for literature discovery, feasibility estimation and structuring the document. It's disclosed in section 6.2. Every technical claim in here is cross-checked against the primary source we cite, and we keep an AI-usage log countersigned by our supervisor. Being able to tell you exactly where we used it is the point." |
| **"Isn't it hypocritical to use AI to build an anti-AI-cheating system?"** | Rauf | "We're not anti-AI. We're anti-*uncalibrated* help. We used AI the way we want our students to use it — to find things faster, then verify them ourselves. That distinction is literally what the system teaches." |
| **"Couldn't a student vibe-code this in a weekend?"** | Zuhair | "The language model writes one sentence at the end of a pipeline. It doesn't decide who is struggling, what they know, how much to reveal, or whether the output leaked the solution. Those are five components we build — and all four of our hard constraints remain if you delete the model." |
| **"How do we know your POC results are real?"** | Zuhair | "Run it. The dataset is public — CSEDM 2021 — the injection script is thirty lines, and we'll show you the code and re-run it on this laptop." |

## B. The kill-shot questions

| Question | Owner | Answer |
|---|---|---|
| **"If a student cheats, your model thinks they're competent and helps them less. Your system does the opposite of what it claims."** | Zuhair | "That's exactly right, and it's our primary research question — not an oversight. It's why telemetry-enriched DKT exists and it's what we measured on slide seven. Standard knowledge tracing inflates under delegation; we're testing whether behavioural features suppress that inflation." |
| **"How is this different from Codio?"** | Rauf | "Codio removes the friction between watching a tutorial and running code — every AI feature it has hands the learner code. Its adaptivity is quiz difficulty from transcripts, not a model of what a student knows from how they code. We calibrate friction instead of removing it, because friction is where learning happens. Different language, different course context, and our dashboard is for the instructor, not the student." |
| **"How do you know a hint helped?"** | Rauf | "Not from completion time — that's maximised by giving answers. Pre-registered primary outcome is transfer-task performance on an unaided task, with hint dependency across successive labs as secondary." |
| **"Why not just detect AI-written code?"** | Rauf | "Detection is discredited. The published benchmark found fifty-two false positives out of a hundred and fourteen human submissions, accuracy halves after paraphrasing, and drops to seventeen percent on non-English text. It's also adversarial toward our own students — we'd rather teach than police." |
| **"Where's the complexity? This is a web app."** | Jawad | "Three places. An estimator that must stay valid under adversarially corrupted input with no stationarity guarantee. Sub-two-hundred-millisecond ordered ingestion across sixty concurrent async streams, with a race on the mastery update. And static analysis of C++ that doesn't compile — twenty-five percent of incorrect submissions." |
| **"Can three people finish this in two semesters?"** | Jawad | "Semester one delivers telemetry, struggle detection, the knowledge tracing engine and end-to-end hint generation, integrated — about forty-five percent. The DPO track is explicitly disposable; if it fails we report a negative result and the main system is untouched." |
| **"What if your central hypothesis is wrong?"** | Zuhair | "Then we report that standard knowledge tracing is robust to AI-mediated submissions — which is a useful negative result the field doesn't have — and the system stands on the closed-loop contribution alone." |

## C. Technical comprehension checks

| Question | Owner | Answer |
|---|---|---|
| **"Explain BKT."** | Zuhair | "A hidden Markov model with a binary latent mastery state per skill and four parameters: prior knowledge, learn rate, **slip** and **guess**. Each submission updates the posterior. And slip and guess are exactly why it breaks for us — delegation presents as an extremely high guess rate, and BKT has no mechanism to attribute it." **← memorise this one; it connects the textbook to your contribution in one breath.** |
| **"BKT versus DKT?"** | Zuhair | "BKT is per-skill independent with four interpretable parameters. DKT is an LSTM over the whole interaction sequence — it learns cross-skill transfer, loops to recursion, which BKT's independence assumption can't represent. DKT is more accurate and not interpretable, so we keep BKT as an auditable baseline." |
| **"How do you compute AST similarity?"** | Rauf | "Parse the candidate hint and the reference solution into ASTs, normalise identifiers so variable naming can't mask a match, then compare by tree edit distance over normalised subtrees. Threshold at sixty percent. If the hint contains no parseable code we fall back to token-level similarity." |
| **"Two events for the same student arrive out of order — what happens?"** | Jawad | "Events carry a client-side monotonic sequence number and route to a per-student ordered queue keyed by student ID, so the mastery update is single-writer per student. Out-of-order events inside the reorder window are buffered; beyond it they're dropped and logged rather than applied." |
| **"Your dataset is Java. Your course is C++. Explain."** | Zuhair | "CodeWorkout is Java CS1, four hundred and ten students. We use it for priors and for building the pipeline, not as the deployed model. Java to C++ is a closer transfer than Python to C++ — same family, static typing, similar syntax. Cold start on our own course is corrected with a short diagnostic at the start of the semester." |
| **"Why Qwen and not GPT-4?"** | Jawad | "Three reasons: student code must not leave campus; there's no per-request cost at class scale; and labs can't depend on internet availability. We accept that a seven-billion-parameter model is weaker — and we measure it. Seventy percent of a blind sample must be rated pedagogically appropriate by the instructor, or we escalate to a commercial API for the study only and document the trade-off." |
| **"Forty-five percent of what?"** | Jawad | "Of the module list in our scope section: telemetry pipeline, struggle detector, knowledge tracing engine and the hint generation path, integrated and demonstrable. Guardrail, dashboard, telemetry-enriched DKT and the study are semester two." |
| **"What's your sample size justification?"** | Rauf | "Thirty participants minimum, powered for a medium effect at alpha point-oh-five, power point-eight, within-subjects — specifically within-subjects because a between-subjects design at our cohort size couldn't detect anything." |
| **"What if the instructor refuses to run the study?"** | Rauf | "The measurement contribution doesn't depend on it — the injection experiment runs offline on CSEDM. We'd lose classroom validation, report it as a limitation, and fall back to a convenience sample with that limitation stated." |
| **"Isn't keystroke logging surveillance?"** | Rauf | "Informed consent, opt-out with no loss of assistance, university-controlled storage, defined retention, grade independence in writing, and no autonomous misconduct flagging. The system never accuses." |

## D. When you don't know

Say this, exactly, and don't decorate it:

> **"We haven't tested that yet. Here's what we'd have to measure to find out — [name the measurement]."**

A panel that permits AI is specifically probing for bluffing. One honest *"we don't know yet"* buys credibility for every confident answer around it. **Never invent a number.**

---
---

# WHAT NEVER TO SAY

| Don't say | Say instead |
|---|---|
| "The AI decides the hint level." | "Our policy decides the level. The model writes the sentence." |
| "It's basically ChatGPT with a prompt." | "The model is the last stage of a five-component pipeline." |
| "We'll figure that out later." | "That's scheduled in month [N]. The dependency is [X]." |
| "It should work." | "We haven't measured that yet." |
| "Codio was weak / just a feature list." | "Codio is well built and solves the opposite problem." |
| "We hope to publish." | *Nothing.* Don't mention publication in an FYP defense. |
| "Sorry, I'm not sure…" *(trailing off)* | "We haven't tested that yet." *(full stop)* |
| "Basically…" / "Sort of…" / "Kind of…" | Delete the word. Say the claim. |

---
---

# REHEARSAL PROTOCOL

1. **Three full runs with a stopwatch**, out loud, standing — not read silently. Record run three and watch it.
2. **One run with the slides off.** If you can't deliver it from memory of the structure, the script isn't yours yet.
3. **Hostile round.** Ma'am Rabail asks the Q&A questions in random order and **interrupts mid-answer**. Practise being interrupted — it will happen.
4. **Ownership round.** Practise the handoff out loud: *"That's Zuhair's module — Zuhair?"* Said smoothly it reads as discipline; said awkwardly it reads as evasion.
5. **Live-modification drill.** Decide in advance **which file each of you opens** if asked to change something. Zuhair: the KT update step. Jawad: the event handler. Rauf: the disclosure-level selector.
6. **Number drill.** One person calls a claim, the owner returns the number cold: *17% · 48% · 80% · 885 · 50% · −15.2% AUC · 700 · 54 · 25% · 410 · 200 ms · 8 s · 5% · 0.70 AUC.*
