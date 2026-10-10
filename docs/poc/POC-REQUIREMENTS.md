# POC-lite requirements — FYP-1 Proposal Defense, Week 4

Everything here is derived from the FAST School of Computing BS FYP Handbook
(3rd ed., 2026). Quotes are exact. **This document defines "done".**

---

## 1. What the handbook actually demands

| Source | Requirement |
|---|---|
| **C.12** | "Mandatory approval gate at Week 4. **Must be demonstrated live, not presented as slides.**" |
| **Appendix A, Stage 0** | "Demonstrated POC-lite addressing the riskiest assumption (API integration, baseline run, or data pipeline — **not just a UI mockup**)." |
| **Form 1, criterion 5** | "*POC-lite / technical spike / feasibility evidence* (CLO4, **Max 15**): **Live proof** testing riskiest assumption." |
| **FYP1-CLO4 → GA2** | "Implement initial prototype/module, **validate using tests and baselines**." |
| **§2.2 Score Caps** | "**No live system at demo stage: implementation marks capped at 40% maximum.**" |
| **C.16 §7** | Proposal deck must include "POC Demonstration (**Live execution** of technical spike)." |
| **C.17 checklist** | "We have built and can demonstrate a live proposal POC / technical spike." · "We can articulate what the POC **proved or disproved** and how it **changed our design**." |

### Consequences, stated plainly
- **Screenshots do not score.** They are the fallback if hardware fails, and the
  artefact that goes in the report. They are not the POC.
- **The React IDE in `src/` is not the POC.** It is a UI mockup by the
  handbook's own wording. It may be *shown*, labelled as an interface prototype.
- The POC must **run in the room, in seconds, on a laptop**, and must produce a
  result the team can be questioned on.
- A POC that **disproves** something scores well. A POC that only confirms what
  everyone expected scores less.

---

## 2. The five questions every POC must answer (C.12)

Any POC we ship must answer all five, in writing, in its own README:

1. What risky assumption was tested?
2. What input/setup was used?
3. What empirical result was obtained?
4. What was learned or disproved?
5. **What was changed in the project architecture or scope as a result?**

Question 5 is the one teams fail. A POC that changed nothing was not a test.

---

## 3. Our riskiest assumptions, ranked

The POC must attack the assumption whose failure would kill the project.

| # | Assumption | If false, then… | Status |
|---|---|---|---|
| **R1** | A system prompt alone cannot make an LLM tutor safe or student-aware | our whole architecture is unnecessary; prompt engineering suffices | **TESTED — see §4** |
| **R2** | Standard knowledge tracing over-estimates mastery under AI-mediated submissions | the closed loop has nothing to correct; project reduces to a dashboard | **PARTIALLY TESTED** |
| **R3** | Behavioural telemetry can be captured at lab scale with acceptable latency | no live signal; system is offline analytics only | **NOT TESTED** |
| **R4** | Non-compiling C++ can be analysed usefully | ~25% of struggling-student submissions are unreadable to us | **NOT TESTED** |

**R1 is the correct POC target and it is already largely done.** R2 is the
research contribution and should be the second exhibit. R3 and R4 are FYP-1
build risks, not proposal-gate risks.

---

## 4. R1 — what the existing spike already proves

Command: `bash spike/run_all.sh` (needs Ollama running locally).

| Condition · llama3.2:3b · n=18 adversarial | leaked | partial | clean | semantic |
|---|---|---|---|---|
| Baseline prompt | 13 | 3 | 2 | 11 |
| RAG | 12 | 2 | 4 | 11 |
| RAG **with solution in context** | 11 | 2 | 5 | 13 |
| Hardened system prompt | **2** | 1 | 15 | 0 |
| RAG + hardened prompt | **3** | 0 | 15 | 1 |
| RAG-with-solution + hardened prompt | **2** | 1 | 15 | 1 |

`qwen2.5-coder:7b`, basic prompt: **11/18 leaked** a runnable solution.

**Verdict on R1: confirmed, with a sharper result than expected.**
- Hardening moved runnable-solution leakage from 13/18 under the baseline prompt
  to 2/18 under the hardened system prompt. It did not reach zero.
- Putting the reference solution in context (`rag_solution`) makes leakage
  *worse*, not better. **Design consequence: the solution never enters the
  model's context; it lives only in the guardrail comparator.**
- `disclosure.py` isolates two failures prompting cannot fix at all:
  **(A) mastery-blindness** — told "recursion mastered 0.91" vs "not shown 0.18",
  the model gives the same help; **(B) level variance** — same question, same
  prompt, the disclosure level wanders between runs.

**(A) and (B) are the justification for the entire architecture** and belong on
the proposal slide.

---

## 5. Requirements for the POC to be defence-ready

### R-1 · Runs live
- [ ] One command, ≤ 60 s wall clock, on a laptop, offline except for local Ollama.
- [ ] Prints a result table to stdout that a panel can read from a projector.
- [ ] Writes a timestamped CSV + markdown + chart under `spike/results/`.
- [ ] Has a `--fast` mode (fewer samples) that finishes in < 15 s for the room,
      and a full mode for the report.

### R-2 · Reproducible
- [ ] Every number in the proposal traces to a CSV in this repo.
- [ ] Model names, sample counts, temperature and prompt versions recorded in the
      output, not just in someone's memory.
- [ ] `spike/results/*/` is never overwritten; runs are additive.

### R-3 · Explainable line by line
- [ ] No dependency does the interesting part. The classifier, the ladder scorer
      and the harness loop are ours and are ≤ ~150 lines each.
- [ ] Any team member can be asked "why did this reply score L3?" and answer by
      pointing at the regex in `disclosure.py`.

### R-4 · Honest
- [ ] Every chart states its provenance: model, n, prompt, and whether data is
      real or simulated.
- [ ] Known weaknesses of the classifier (regex-based, one problem, English only)
      are written down *before* being asked.
- [ ] Nothing is described as "proven" that is a single run.

### R-5 · Answers C.12's five questions
- [ ] `spike/README.md` contains all five, answered, with question 5 naming a
      concrete architecture change.

---

## 6. Gaps to close before Week 4

| Priority | Gap | Effort | Why it matters |
|---|---|---|---|
| **P0** | `spike/README.md` answering the five C.12 questions | done | Directly marked |
| **P0** | `--fast` mode + a single `spike/demo.sh` that is *the* live demo | done | The gate is a live run, not a folder of results |
| **P1** | R2 exhibit: mastery-inflation run (BKT under injected delegation) | done | This is the research contribution; R1 alone is a safety result |
| **P1** | Classifier validation: hand-label replies, report agreement with `classify()` | script ready; labels not measured yet | Otherwise every number rests on unvalidated regex |
| **P2** | Second problem beyond `fact()` | done | One problem is a fair criticism |
| **P2** | Confidence intervals on leak rates (n=18 is small) | 1 h | Pre-empts "is 2 vs 13 significant?" |

---

## 7. What the POC deliberately does **not** claim

- Not a classroom result. No students have used this.
- Not evidence that Scaffold improves learning — that is FYP-2's study.
- Not a general leakage benchmark — one problem, one language, two-to-three models.
- The disclosure ladder is a **research instrument**, not a validated
  psychometric scale.

Say these out loud before a panel member says them for you.
