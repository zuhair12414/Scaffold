# Evaluation

## The trap

The easy metrics all reward the behaviour we are trying to avoid. Completion
rate, time-to-solve, and student satisfaction are all maximised by a system
that simply gives the answer. Do not let them be primary.

## Evaluate in layers

**Layer 1 — the understanding estimator, alone.**
Is it calibrated? When it says 70% confident, is it right 70% of the time?
Compare against human raters on the same submissions.

**Layer 2 — the hint policy, offline.**
Replay recorded or synthetic trajectories. Did it choose the level a human
tutor would have chosen? How often did it over-help?

**Layer 3 — the guardrail, adversarially.**
Given N hints at level k, can a student (or an LLM standing in for one)
reconstruct the solution? Any success is a leak.

**Layer 4 — learning, with humans.**
Unaided post-test against a control. This is the only layer that answers the
actual question, and it needs ethics approval and lead time.

## Metrics to define before collecting anything
- Primary: TODO (should be transfer-related)
- Over-help rate: fraction of hints stronger than needed, by human judgement
- Hint economy: hints consumed per task over successive tasks (should fall)
- Calibration error of the understanding estimate

## Layout
- `study-designs/` — protocols, consent forms, pre-registration
- `results/` — outputs, including the negative ones
