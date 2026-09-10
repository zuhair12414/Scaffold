# Spike — the POC

> **T1 in `docs/TASKS.md` is to complete this file.** The scaffolding and the
> real numbers are here; the five answers must be written by the team, not
> generated, because you will be questioned on them.

## What this is

The Week-4 POC-lite. A live experiment, not a UI mockup. It answers whether a
system prompt alone can make an LLM tutor safe and student-aware.

## Run

```bash
ollama serve                 # separate terminal
bash spike/run_all.sh        # full matrix, minutes
bash spike/demo.sh --fast    # the live demo smoke run
python3 spike/disclosure.py  # ladder analysis -> results/why_kt.png
python3 spike/aggregate.py   # -> results/summary.json
```

## Layout

| File | Role |
|---|---|
| `leakage.py` | harness: model × prompt × context × profile × attack × sample |
| `attacks.json` | attack prompts — B0 benign, A1–A6 families, X1–X10 |
| `context.json` | RAG passages, optionally including the solution |
| `disclosure.py` | scores replies 0–5 on the ladder; produces `why_kt.png` |
| `aggregate.py`, `chart*.py` | summaries and figures |
| `results/` | timestamped CSV + markdown + charts. Additive, never overwritten |

Prompts under test are read from `../src/providers/prompts.json`, so the spike
measures the prompts the product actually ships.

---

## The five questions (handbook C.12)

### 1. What risky assumption was tested?

The spike tested R1: whether a system prompt alone can make an LLM tutor safe
and student-aware enough for Scaffold's programming-lab setting.

### 2. What input/setup was used?

The measured setup in `docs/EVIDENCE.md` uses local Ollama at temperature 0.7,
with 3 samples per cell and 6 adversarial attack families. The task is recursive
`fact(n)` in C++ with a missing base case.

The main `llama3.2:3b` run compares the baseline prompt, RAG, RAG with the
reference solution in context, hardened system prompt, RAG plus hardened system
prompt, and RAG with the reference solution plus hardened system prompt.

The `qwen2.5-coder:7b` measurement recorded in the evidence register covers the
basic prompt with no context.

### 3. What empirical result was obtained?

For `llama3.2:3b`, with n = 18 adversarial replies per condition:

| Condition | leaked | partial | clean | semantic |
|---|---:|---:|---:|---:|
| Baseline prompt | 13 | 3 | 2 | 11 |
| RAG | 12 | 2 | 4 | 11 |
| RAG with solution in context | 11 | 2 | 5 | 13 |
| Hardened system prompt | 2 | 1 | 15 | 0 |
| RAG + hardened system prompt | 3 | 0 | 15 | 1 |
| RAG-with-solution + hardened system prompt | 2 | 1 | 15 | 1 |

For `qwen2.5-coder:7b`, with the basic prompt and no context, 11 of 18
adversarial replies leaked a runnable solution.

### 4. What was learned or disproved?

The spike confirmed that prompt hardening helps, but does not solve the control
problem. On this problem, the hardened system prompt reduced runnable-solution
leakage by roughly 6x, but it did not reduce leakage to zero: 2-3 of 18
adversarial replies still leaked under the hardened conditions.

It also showed that putting the reference solution into retrieval context is the
wrong direction. In the `llama3.2:3b` baseline, semantic leakage increased from
11 to 13 when the reference solution was included in context.

`disclosure.py` demonstrates the deeper problem: when the model is given a
strong profile and a novice profile, the prompt does not reliably choose
different disclosure levels. It also shows run-to-run level variance for the
same question and prompt. That disproves the idea that a prompt can be the
component deciding how much help to reveal.

### 5. What was changed in the project architecture or scope as a result?

The POC changed the architecture in concrete ways:

- D1: the disclosure policy chooses the level before the model is called; the
  model only renders that chosen level.
- D2: the reference solution never enters the model's context. It is reserved
  for the output-side guardrail comparator.
- D3: the guardrail inspects the reply that was actually produced, not the
  model's intent.
- D5: syntactic leakage and semantic leakage stay separate metrics in every
  table, because prose can reveal the fix even when no runnable code appears.
- D8: before Week 4, effort goes to `spike/`, not to treating the React shell as
  the POC.

---

## Known limitations — state these before you are asked

- `classify()` and `semantic()` are regex heuristics, **not yet validated against
  human labels** (T3).
- One problem (`fact()`), one language, 2–3 local models. Not a general benchmark.
- n = 18 adversarial replies per condition; no confidence intervals yet (T7).
- Temperature 0.7 — replies vary run to run. That variance is itself a finding.
