# 03 · LLM serving and prompt assembly

Owner: **Jawad.** Budget: one RTX 3090, 24 GB, p95 < 8 s at 10 concurrent.

---

## 3.1 Does a 7B model fit? Do the arithmetic, don't guess

**Weights.** Qwen2.5-Coder-7B ≈ 7.6 B params.
- fp16 → ~15.2 GB. Fits, but leaves ~8 GB for everything else. Tight.
- **GPTQ/AWQ 4-bit → ~4.5 GB.** This is the configuration to use.

**KV cache.** Qwen2.5-7B: 28 layers, 28 attention heads, **4 KV heads** (grouped
query attention), head_dim 128.

$$\text{KV/token} = 2 \times L \times H_{kv} \times d_{head} \times \text{bytes}
= 2 \times 28 \times 4 \times 128 \times 2 = 57{,}344\ \text{B} \approx 56\ \text{KB}$$

GQA is doing enormous work here — with 28 KV heads it would be ~392 KB/token.

**Budget:**
```
24.0 GB  total
-4.5 GB  4-bit weights
-1.5 GB  CUDA context, activations, fragmentation
=18.0 GB available for KV
18.0 GB / 56 KB  ≈  320,000 tokens of KV cache
10 concurrent × 4,096 ctx = 40,960 tokens   →   ~8× headroom
```
**Conclusion: comfortable.** Say this number in the defense; it turns "we hope
it fits" into "we computed it".

## 3.2 vLLM

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-7B-Instruct-GPTQ-Int4 \
  --quantization gptq --dtype float16 \
  --max-model-len 4096 --gpu-memory-utilization 0.90 \
  --max-num-seqs 16 --enforce-eager=False
```

Two features you should be able to explain:
- **PagedAttention** — KV cache in fixed-size blocks with an OS-style page
  table, so sequences of different lengths do not fragment VRAM. This is why
  vLLM serves many more concurrent requests than naive HF `generate`.
- **Continuous batching** — a finished sequence is evicted and a queued one
  admitted *mid-batch*, instead of waiting for the whole batch to finish. Under
  bursty lab traffic this is the difference between 8 s and 30 s p95.

**Latency control:** cap `max_tokens` at ~180. Hints are 1–3 sentences; an
uncapped generation is the main cause of p95 blowout. Set `temperature=0.2`,
`top_p=0.9` — hint text should be boring and repeatable, not creative.

## 3.3 Prompt assembly

The model never decides the level. The **policy** decides; the prompt only
renders. Structure:

```
[SYSTEM]  You write one hint at exactly disclosure LEVEL {n}.
          LEVEL 1 = name where the problem is, never why.
          LEVEL 2 = name the concept at stake, never the action.
          LEVEL 3 = state what must be done, never how, never code.
          Emit no code, no pseudocode, no function signatures. 1-3 sentences.

[TASK]    {problem statement} {public test names}
[STATE]   Mastery: inorder_successor 0.24 (+-0.13) | pointer_free 0.19 (+-0.15)
          Struggle: thrashing, 3 reverts, 11 min on task
          Already released: L1, L2  (do not repeat their content)
[CODE]    {student's current buffer, truncated to the relevant function}
[FAILING] {test name + expected/got, no reference solution}
```

**Never put the reference solution in the prompt.** Bastani's guardrailed
condition did include it, but they were not defending against extraction. If the
solution is in context, one prompt injection extracts it. Keep the reference
solution **only** in the guardrail comparator (`04`), which is a separate
process that the model never sees.

## 3.4 Fallback ladder

| Failure | Response |
|---|---|
| vLLM 5xx / timeout > 8 s | serve a **template** hint for that level from the task's authored fallback set |
| Model unavailable | degrade to Level 1 template only, banner to instructor |
| Guardrail blocks the draft | retry once at level−1; if it blocks again, emit nothing and log |
| GPU OOM | `--max-num-seqs` down, queue, never crash the lab |

Every one of these is a graceful-degradation requirement in the handbook's
deployable-system criterion. Implement them; they are cheap and they are marked.
