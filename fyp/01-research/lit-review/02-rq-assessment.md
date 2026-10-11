# Assessment of the team's research question

_2026-09-09. Written after reading `06-writing/defense/scaffold_fyp_master_defense_document_sidecar.md`
and the ITiCSE 2025 "Refuting LLM-generated Code" paper, and against two
independent analyses written before either was seen (`00-` and `01-`)._

---

## Verdict

**The team's research question is better than mine. Adopt it.**

Not a close call, and worth stating plainly because the whole point of
withholding it was to get an honest comparison. Specifically:

- **The literature sweep is deeper than mine in the two sub-fields that
  matter.** I missed ClassAid (CHI'26), STAP, Closing the Loop (SIGCSE'26),
  Code-DKT, srcML-DKT, EduGuardBench, PEARL, TutorRL, CodeWatcher, Spark. My
  pass-1 claim that "no tutor adapts guardrail strength to a per-student
  estimate" was right, but the team had already found the closest competitor
  (ClassAid) and characterised it precisely — instructor-driven manual mode
  switching, not automated per-student calibration. That is a sharper gap
  statement than mine.
- **The gap is the same gap.** My pass-1 §4 and the sidecar's §1.4 primary gap
  are the same finding reached independently. That is reassuring for both.
- **The plan is engineered, mine was not.** Qwen2.5-Coder-7B on vLLM with INT4
  on a single 3090, Monaco rather than a native IDE plugin, pyBKT before DKT,
  DPO rather than GRPO with the reason given — these are real decisions with
  real justifications and named fallbacks. §4.5 (alternatives rejected) is
  better than anything in my two documents.
- **The secondary track is correctly quarantined.** DPO is scoped as
  disposable, with "report as a negative result" as the contingency. That is
  exactly right.

**My pass-2 recommendation (the verification control loop) is withdrawn as a
competing project.** It is worth less than this. But it is not worthless — see
§3, where it returns as a component that fixes a hole in this architecture.

---

## 1. The one problem that must be fixed before defense

### The knowledge tracing engine is contaminated by the very behaviour the project exists to address

The document says two things that do not currently meet:

- **§1.1:** students paste lab problems into ChatGPT and submit the returned
  code. That is the problem.
- **§4.2 / §4.4:** the knowledge tracing engine updates a mastery vector from
  submission correctness (BKT/DKT), tagged with knowledge components.

Follow the loop for a vibe-coding student. They paste a correct solution. The
submission is scored correct. BKT/DKT raise their mastery estimate. Scaffold
reads a high mastery estimate and **lowers hint specificity** — withdrawing
support from the student who has learned nothing, while the student who
struggled honestly and submitted a wrong answer gets their mastery lowered and
receives more help.

**The system's central mechanism inverts under its own motivating problem.** A
panel that follows the arrows in the §3.1 diagram will find this, and it is the
question that would be hardest to answer live.

This is not a hypothetical. It is documented:

- **CoTutor** (2025) does BKT + optimisation for AI-assisted programming
  education and never addresses whether a correct submission still evidences
  mastery under AI assistance. The flaw is in the published literature already.
- **"Measuring the Impact of Student Gaming Behaviors on Learner Modeling"**
  (2025) poisoned BKT, AFM and DKT with simulated gaming and measured up to
  **−15.2% AUC**, with parametric models (i.e. BKT) most fragile. Their listed
  future work is "real-time data quality monitoring" and "unsupervised anomaly
  detection for gaming behavior."
- **Baker et al.**'s gaming-the-system literature establishes that students
  systematically exploit tutors, and that gaming correlates with worse learning.
- **The Widening Gap** (ICER 2024) gives the human version: struggling students
  end with an "illusion of competence." Scaffold currently reproduces that
  illusion in software.

### The fix is a reframing, not a redesign

The seed is already in the document. §4.2 lists the telemetry-enriched DKT
input as "time-on-task, error-type distribution, edit distance, and
**copy-paste flags**." The features are right. The **claim** is too weak:

> Current framing: "tests whether behavioral signal improves mastery
> prediction" — a generic knowledge-tracing question, answered by AUC.

> Proposed framing: **does behavioural signal preserve the validity of mastery
> estimation when submissions are AI-mediated?** — measured as mastery
> inflation on AI-mediated submissions relative to a ground-truth estimate.

Why the second framing is strictly better for this project:

1. **It closes the §1.1 ↔ §4.2 gap** that a panel will otherwise find.
2. **It is more novel.** "Does adding features improve AUC" is a standard EDM
   result. "Standard KT is invalid under AI mediation and here is what repairs
   it" is a finding with a named victim in the literature (CoTutor) and a
   quantified precedent (−15.2% AUC).
3. **It is testable without the classroom study.** Take CSEDM, synthesise
   AI-mediated submissions (inject correct solutions at points where the
   student's trajectory predicts failure), and measure how much each model's
   mastery estimate inflates. Standard DKT should inflate; telemetry-enriched
   DKT should inflate less. **This is a Week-4-feasible spike and it de-risks
   the primary claim without ethics approval, without a cohort, without the
   study.** That is the single most valuable schedule change available.
4. **It strengthens the CCP.** It is Seoul Accord characteristic 8
   (interdependence) in its purest form: tightening detection changes student
   behaviour, which changes the data the estimator is trained on. Say this in
   the defense.

### Add a fourth acceptance criterion to §3.2

| Module | Additional acceptance criterion |
|---|---|
| **Knowledge tracing** | Under synthetic AI-mediated submission injection at 25% / 50% rates, telemetry-enriched DKT shows significantly lower mastery inflation than standard DKT and BKT, measured against pre-injection ground truth |

---

## 2. Factual corrections

**CSEDM 2021 is Java, not Python.** §7.3's risk row says "Python vs. C++." The
CSEDM 2021 Data Challenge uses the **CodeWorkout** dataset — a CS1 **Java**
course at Virginia Tech, 410 students, five assignments. This is mildly *good*
news (Java→C++ is a closer transfer than Python→C++: same family, static
typing, similar syntax) but the risk register must state it correctly or it
reads as unfamiliarity with your own primary dataset.

**The Refuting paper does not pre-empt anything — but it corrects a design
assumption.** Hebbar, Harini and Kumar (ITiCSE 2025) show that *perfect
reactive task comprehension* — a student stating only what the code **should**
output on system-supplied inputs — refutes **over 99.95%** of buggy
LLM-generated HumanEval solutions, **without the student comprehending the
code at all**. Two consequences:

- Output-prediction probes are cheap and extremely powerful. Combined with "On
  the Reliability of Code Comprehension Proxies" (2026), where *time to predict
  output given an input* correlated **0.86** with expert comprehensibility
  judgements while syntax-identification proxies correlated weakly or
  negatively, this tells you which probe class to use.
- **But such a probe measures task comprehension, not code comprehension.**
  Do not claim otherwise anywhere in the report. The authors are explicit that
  reactive task comprehension bypasses code comprehension. Their closing open
  question — "is proactive task comprehension still an important skill for CS
  students to develop?" — is live, and citing it shows the panel you read it.

**"First application of pedagogical alignment to code" needs verifying, not
asserting.** The math-only claim held everywhere I looked (TutorRL, PEARL,
SocraticLM, LearnLM, Sonkar et al., and AIED'25 tutor-DPO work are all math),
but a "first" claim is the easiest thing for an examiner to falsify with one
search. Soften to "to our knowledge, the first" and keep the search record.

---

## 3. Two unscheduled dependencies, both with published numbers

**(a) A quarter of your data will not compile.** In CodeWorkout, **9,906 of
38,883 incorrect submissions (~25%) failed to compile**. Your pipeline (§4.4)
scores each submission against test cases and tags it with KCs — an
uncompilable submission yields no correctness label, so a quarter of the
signal silently vanishes exactly where students are struggling most. The
"Automated Program Repair of Uncompilable Student Code" work (2025) argues
uncompilable code "can contain important information about students'
intermediate reasoning and knowledge states." Decide deliberately: drop it,
repair it syntactically, or extract features from partial ASTs. C++ makes this
harder than Java, and this is where your depth-of-knowledge credit lives.

**(b) The C++ Data Structures KC taxonomy does not exist.** §4.4 says each
event is "tagged with its Knowledge Component(s) from the course taxonomy" as
though that taxonomy is available. It is not, and building it is a research
problem in its own right: the JEDM "Knowledge Component Attribution Problem for
Programming" study needed expert labelling to reach AUC > 75% on two of three
KCs, and found transfer learning from correctness labels to be the viable
route when expert labels are scarce. **Add a Month-1 deliverable: fix the KC
list with the course instructor, and choose an attribution method.** Everything
downstream — BKT, DKT, hint calibration, the dashboard heatmap — is blocked on
it.

**Where my withdrawn pass-2 idea returns.** The contamination problem in §1
exists because every observation feeding the KT engine is *passive* and
therefore fakeable. An **active probe** — when mastery uncertainty is high,
ask the student to predict the output of a specific line of their own code — is
an observation that is harder to obtain by delegation and can be injected on
demand. That is one clean answer to "how do you know the mastery vector is
real?", it reuses the hint-delivery channel you are already building, and the
probe class is chosen for you by the two papers above. Offer it as a designed
extension, not a fourth track.

---

## 4. Handbook alignment gaps

Measured against `07-reference/fast_school_of_computing_bs_fyp_handbook_2026.md`:

| Issue | Handbook reference | Fix |
|---|---|---|
| **POC-lite is four screens of hardcoded mock data** | C.12 requires a live technical spike answering "what risky assumption was tested / what was disproved / what changed in the architecture." C.15 names "high screen count, zero algorithmic depth" as a weak pattern | Lead with the spike, not the screens. Best spike is the contamination simulation in §1 — it tests the project's riskiest assumption. Your own §5.2 already recommends Spike A; go further and make it the headline |
| **Timeline is M1–M12, not mapped to FYP gates** | §5.2 requires ~**45% of implementation** by FYP-1 Week 15, plus 2 iterations; Week 8 mid with SRS + design + working code | Re-express the §3.3 schedule against Week 4 / Week 8 / Week 13 / Week 15, and name which modules constitute the 45% |
| **Core-Replacement exposure** | C.14 — if an external API "completely solves the CCP", marks capped or project rejected | §4.2 currently says "the novelty is injecting the KT vector, not the prompting mechanism itself." Honest, but a panel will quote it. Add an explicit dependency-classification paragraph: LLM = **Core-Assist**; KT engine, telemetry pipeline, struggle detector, guardrail and leakage detector = student-built core. Local Qwen rather than a commercial API already helps this argument — say so |
| **Prior-FYP table is empty** | C.10 mandatory artifact | Already populated in `01-gap-analysis.md` §3 from your own `~/Desktop/fyps` repository. **Codio (F25-323-D, Fall 2025)** is a fully implemented Python video-to-code platform (Gemini VLM extraction, Judge0 execution, adaptive quiz difficulty from transcripts) — the inverse of Scaffold in objective. It is one year old and it is your closest departmental prior. Also: Ustaad (Fall 2023), EasyLearnAI, GreenCodeAI (useful precedent — an IDE plugin framed as "beyond reliance on LLMs" that was approved) |
| **Struggle-detector criterion has no data source** | §3.2 requires ≥0.75 precision "validated against hand-labeled pilot segments" | Those labels are not a deliverable anywhere in §3.3. Add the labelling task, with who labels and how many segments |

---

## 5. What to say when the panel asks about Codio

Suggested line, because this question is coming:

> Codio is a well-built system solving the opposite problem. It removes the
> friction between watching a tutorial and running code — Gemini 2.5 Flash
> extracts code from a paused frame, Judge0 executes it in a sandbox — and
> every AI feature it has hands the learner code: extraction, auto-completion,
> fix suggestions. Its adaptivity is quiz difficulty generated from
> transcripts, not a model of what the student knows from how they code.
> Scaffold's premise is that friction is where learning happens, so we model
> per-student mastery from coding process and calibrate how much to withhold —
> and we measure what that estimate does when students delegate to an external
> AI. Different context, too: Python video tutorials versus a supervised C++
> Data Structures lab, and our dashboard is for the instructor, not the student.

---

## 6. Net recommendation

1. **Keep the research question.** Amend the secondary clause only if the DPO
   novelty check in §2 fails.
2. **Reframe the telemetry-enriched DKT claim** from "improves AUC" to
   "preserves validity under AI-mediated submissions." This is the highest-value
   change in this document.
3. **Make the contamination simulation the Week-4 spike.** It de-risks the
   primary claim with no ethics dependency.
4. **Schedule the KC taxonomy and the uncompilable-submission decision** as
   Month-1 items.
5. **Fix CSEDM = Java** in the risk register.
6. **Re-map the timeline to the handbook's gates** and add the
   Core-Replacement paragraph.
7. **Populate C.10 from `01-gap-analysis.md` §3** and prepare the Codio answer.

None of this changes what the project is. It closes the loop between the
problem statement and the mechanism, and it removes the four things a panel is
most likely to press on.

---

## 7. References added this pass

Hebbar, S.V., Harini S., S., Kumar, V. (2025). Refuting LLM-generated Code with
Reactive Task Comprehension. _ITiCSE 2025_.
https://doi.org/10.1145/3724363.3729100

Automated Program Repair of Uncompilable Student Code (2025).
https://arxiv.org/html/2510.06187v1

The Knowledge Component Attribution Problem for Programming: Methods and
Tradeoffs with Limited Labeled Data. _JEDM_.
https://jedm.educationaldatamining.org/index.php/JEDM/article/download/755/182

Edwards, S.H., Murali, K.P. (2017). CodeWorkout: Short Programming Exercises
with Built-in Data Collection. _ITiCSE_.
https://dl.acm.org/doi/10.1145/3059009.3059055

Closing the Loop: instructor-in-the-loop AI for programming (SIGCSE TS 2026) —
82 students, 673 AI hints, 22% rated unhelpful, 11% of those escalated, and
instructor feedback on escalated cases was itself "incorrect or insufficient
roughly half the time." https://arxiv.org/abs/2510.14457
