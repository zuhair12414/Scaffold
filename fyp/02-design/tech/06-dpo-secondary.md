# 06 · DPO on one 24 GB card — the disposable track

Owner: **Zuhair.** Secondary contribution. If it fails, it is a reportable
negative result and Track A is untouched. Do not let it consume Semester 1.

---

## 6.1 Why DPO and not PPO/GRPO

PPO needs a policy, a reference, a reward model and a value head resident at
once, plus an RL loop with reward-hacking and entropy-collapse failure modes.
On one 3090 that is not happening.

**DPO** removes the reward model entirely. Given preference pairs
$(x, y_w, y_l)$ it optimises

$$\mathcal{L} = -\log \sigma\!\left(\beta\left[\log\frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \log\frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)}\right]\right)$$

No sampling loop, no value function, supervised-style training.

## 6.2 The memory trick you must know

DPO normally needs **two** 7B models in VRAM (policy + frozen reference). With
LoRA you get the reference for free — disable the adapters and the base model
*is* the reference. TRL does this automatically when `ref_model=None` and the
model is a `PeftModel`.

Better still, precompute the reference log-probs once and free it:

```python
from trl import DPOConfig, DPOTrainer
from peft import LoraConfig

peft_cfg = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05,
                      target_modules=["q_proj","k_proj","v_proj","o_proj"],
                      task_type="CAUSAL_LM")

cfg = DPOConfig(
    beta=0.1,                       # 0.1-0.3; higher = stay closer to reference
    learning_rate=5e-6,             # 10-100x lower than SFT. Higher WILL diverge.
    per_device_train_batch_size=1,
    gradient_accumulation_steps=16,
    gradient_checkpointing=True,
    bf16=True,
    max_length=1024, max_prompt_length=768,
    precompute_ref_log_probs=True,  # <- frees the reference model from VRAM
)
trainer = DPOTrainer(model=model, ref_model=None, args=cfg,
                     train_dataset=pairs, peft_config=peft_cfg)
```

## 6.3 The actual contribution: a graduated leakage reward

Every published pedagogical-alignment work — TutorRL, PEARL, SocraticLM,
LearnLM, Sonkar et al., ACL'26 Multi-Horizon — is **mathematics**, where leakage
is binary: the numeric answer was revealed or it was not.

**Code leakage is a spectrum.** Build preference pairs where the *rejected*
response sits one rung higher on the ladder than the *chosen* one:

| Rung | Disclosure | AST similarity band |
|---|---|---|
| 0 | concept only | < 0.15 |
| 1 | function signature named | 0.15–0.30 |
| 2 | pseudocode skeleton | 0.30–0.45 |
| 3 | partial implementation | 0.45–0.60 |
| 4 | full solution | > 0.60 |

Generate pairs synthetically: prompt a strong model for a response at rung $k$
and rung $k{+}1$ on the same task, verify the rung with **your own AST
comparator from `04`**, and keep the pair only if the comparator agrees. That
verification step is what makes the dataset trustworthy — and it reuses code you
already had to write.

## 6.4 What to watch

| Symptom | Cause | Fix |
|---|---|---|
| reward margin grows, generations become terse/degenerate | β too low, LR too high | β → 0.3, LR → 1e-6 |
| loss flat at 0.693 | pairs are not actually distinguishable | check comparator labels |
| OOM at step 1 | reference model resident | `precompute_ref_log_probs=True` |
| helpfulness collapses | over-optimised for refusal | hold out a helpfulness eval and report **both** axes |

**Report leakage and helpfulness together.** A model that refuses everything has
a perfect leakage score and is useless. That trade-off curve is the result.
