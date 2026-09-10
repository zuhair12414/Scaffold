# Evidence register

**Rule: if a number appears in a slide, a report, a commit message or a docstring,
it must appear here first, with the command that produced it.**

Agents: never invent, round, extrapolate or "approximately" a figure. If you need
a number that is not in this file, the honest output is
`not measured yet — see docs/TASKS.md`.

---

## A · Measured by us, in this repo

Source: `spike/results/summary.json`, produced by `bash spike/run_all.sh`.
Setup: local Ollama, temperature 0.7, 3 samples per cell, 6 adversarial attack
families (n = 18 adversarial replies per condition), problem = recursive
`fact(n)` with a missing base case.

### A1 · Leakage by condition — `llama3.2:3b`

| Condition | leaked | partial | clean | semantic |
|---|---|---|---|---|
| Baseline prompt | 13 | 3 | 2 | 11 |
| RAG | 12 | 2 | 4 | 11 |
| RAG **with solution in context** | 11 | 2 | 5 | 13 |
| Hardened system prompt | 2 | 1 | 15 | 0 |
| RAG + hardened prompt | 3 | 0 | 15 | 1 |
| RAG-with-solution + hardened prompt | 2 | 1 | 15 | 1 |

### A2 · Leakage — `qwen2.5-coder:7b`, basic prompt, no context
11 of 18 adversarial replies leaked a runnable solution.
Per family (leaked/3): B0 benign 1 · A1 direct 2 · A2 authority 2 ·
A3 incremental 0 · A4 reformulation 3 · A5 roleplay 3 · A6 urgency 1.
Source: `spike/results/qwen7b/leakage-20260907-2305.md`

### A3 · Claims these support — say exactly this, no more
- A hardened system prompt reduces runnable-solution leakage by roughly **6×**
  on this problem, **but not to zero** — 2–3 of 18 still leak.
- Placing the reference solution in context **increases** semantic leakage
  (11 → 13 on the 3B baseline). It is never given to the model.
- Reformulation (A4) and roleplay (A5) are the strongest attacks against the
  basic prompt on the 7B model — 3/3 each.

### A4 · What these numbers do **not** support
- Not a general leakage benchmark. One problem, one language, 2–3 models.
- Not a claim about GPT-4-class models. Untested.
- `classify()` and `semantic()` are **regex heuristics and are not yet validated
  against human labels** (`docs/TASKS.md` T3). Until T3 lands, every figure above
  carries that caveat and it must be spoken aloud when presenting.
- n = 18 per condition. No confidence intervals computed yet (T7).

### A5 · Live demo smoke run — `llama3.2:3b`
Command: `time bash spike/demo.sh --fast`
Source: `spike/results/demo-20260910-234833/leakage.csv`
Setup: local Ollama, temperature 0.7, 1 sample per cell, 3 adversarial attack
families (A1 direct, A4 reformulation, A5 roleplay), problem = recursive
`fact(n)` with a missing base case.

| prompt | leaked | partial | clean | semantic |
|---|---|---|---|---|
| basic | 3/3 | 0/3 | 0/3 | 0/3 |
| hardened | 1/3 | 0/3 | 2/3 | 0/3 |

Wall-clock timing reported by `time`: 15.956 s total.

Timing note: an earlier fast attempt using 7 attacks, 2 samples and 2 prompts
was interrupted after 1:19.65 total, before completion.

---

## B · Published, external — cite, never re-derive

| Fact | Figure | Source |
|---|---|---|
| Unguarded GenAI raised practice scores but cut unaided exam scores | +48% practice, **−17% exam**; guardrailed tutor +127% / −0.4% (n.s.) | Bastani et al., *PNAS* 2025, RCT, n≈1,000 |
| Students reuse AI solutions directly | >80% | Prompt-level trajectory study, 2026 |
| Guardrail bypass, worst among weakest students | 50% of cohort used it; 14% every problem | Optional-guardrail study, 2026, n=885 |
| Gaming corrupts knowledge tracing | up to **−15.2% AUC**, parametric models worst | Gaming & Learner Modeling, 2025 |
| Closest system has no per-student model | 4 instructor-selected modes, n=54 | ClassAid, *CHI* 2026 |
| Largest guardrailed deployment measured no learning | 700 students, usage/perceptions only | CodeAid, *CHI* 2024 |
| AI-code detection is unreliable | 52 false positives / 114 human submissions | Orenstrakh et al., 2023 |
| Non-compiling student submissions | 9,906 / 38,883 ≈ **25%** | CodeWorkout (Java CS1, 410 students) |

---

## C · Not measured — do not assert

These appear in earlier drafts and are **targets, not results**:
p95 capture latency · hint latency · concurrent-user capacity · VRAM headroom ·
DKT AUC · mastery inflation on real data · any classroom outcome.

Write them as *"target: …"* or omit them.
