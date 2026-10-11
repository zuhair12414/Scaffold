# 05 · Evaluation methodology

Owner: **Rauf** (protocol) with **Zuhair** (model metrics).

---

## 5.1 Splitting — get this wrong and everything else is noise

**Split by student, never by interaction.**

```python
from sklearn.model_selection import GroupKFold
gkf = GroupKFold(n_splits=5)
for tr, te in gkf.split(X, y, groups=df.user_id):
    ...
```
Interaction-level splits put the same learner in train and test and inflate AUC
by a wide margin. "Leave-students-out cross-validation" is the phrase to use in
the defense — it signals you know why it matters.

## 5.2 Metrics, and what each one hides

| Metric | Answers | Blind to |
|---|---|---|
| **AUC** | does it *rank* next-step correctness? | whether the probability is numerically right |
| **Brier** | mean squared probability error | which direction the error goes |
| **ECE** | is stated confidence calibrated? | ranking quality |
| **Mastery inflation** | is the number **honest** under delegation? | nothing — this is our headline |

Calibration is not optional here: the disclosure policy consumes the *value*
0.24, not a ranking. A model with great AUC and terrible calibration will gate
hints at the wrong thresholds.

```python
# Expected Calibration Error, 10 equal-width bins
def ece(p, y, bins=10):
    import numpy as np
    e, n = 0.0, len(p)
    edges = np.linspace(0, 1, bins + 1)
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (p > lo) & (p <= hi)
        if m.sum():
            e += m.sum()/n * abs(y[m].mean() - p[m].mean())
    return e
```
Report a reliability diagram alongside it. One figure, high value.

---

## 5.3 The injection experiment — your Week-4 POC

**Question.** Does standard KT over-estimate mastery when submissions are
AI-mediated, and does telemetry suppress that over-estimate?

**Method.**
1. Fit BKT, DKT, Telemetry-DKT on CSEDM/CodeWorkout train students.
2. Hold out test students. For each, record ground-truth mastery proxy
   $m_{\text{true}}$ = accuracy on their *final* unaided attempts at that KC.
3. **Inject.** At injection rate $\rho \in \{0, 0.25, 0.50\}$, take submissions
   the student's trajectory predicts would be **incorrect** and rewrite them as
   correct, attaching a synthetic delegation telemetry signature
   (`paste_ratio≈0.95`, `post_insert_edit_distance≈0`, `time_on_task_z≈−1.3`,
   `error_recovery_episodes=0`).
4. Re-run each model. Measure

$$\text{inflation}(\rho) = \overline{\hat m_\rho - m_{\text{true}}}$$

**Prediction to pre-register.** BKT inflates most (parametric models are the
most label-corruption-fragile — the 2025 gaming study measured up to −15.2%
AUC), DKT less, Telemetry-DKT least.

**Honesty rules — non-negotiable.**
- Label every figure from this experiment **"simulated delegation on CSEDM
  (Java CS1); synthetic telemetry signature"**. It is not a classroom result.
- Justify the synthetic signature's parameter values from the literature or
  from a small pilot, and say which. An invented signature that conveniently
  proves your point is the one thing that would sink this at viva.
- If inflation is flat across models, **report it**. That outcome disproves the
  premise and is a publishable negative result. Say so on the slide.

---

## 5.4 The classroom study (FYP-2)

- **Design:** three conditions — unrestricted AI / uniform guardrail
  (CodeAid-style) / Scaffold — **within-subjects**, counterbalanced by lab.
  Within-subjects because between-subjects at n≈47 has no power.
- **Primary outcome:** transfer-task score on a proctored, AI-free task.
  Pre-register it before collecting anything.
- **Secondary:** hint dependency across labs, over-help rate vs. instructor
  judgement, time-to-solution (expected to *rise* — state that in advance).
- **Power:**
```python
from statsmodels.stats.power import TTestPower
TTestPower().solve_power(effect_size=0.5, alpha=0.05, power=0.8, alternative='two-sided')
# ~34 paired observations for a medium effect
```
- **Ethics application in Month 1.** It is the longest pole and nothing about
  the study can start without written approval.
