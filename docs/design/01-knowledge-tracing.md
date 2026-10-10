# 01 · Knowledge tracing — and why delegation breaks it

> **The single most important page in this project.** If you understand only
> §1.3, you can defend the whole thesis.

---

## 1.1 Bayesian Knowledge Tracing (BKT)

A two-state HMM per knowledge component. Latent state $L$ = "student has
mastered this KC". Four parameters per KC:

| Param | Meaning |
|---|---|
| $P(L_0)$ | prior — probability of mastery before any evidence |
| $P(T)$ | transit — probability of learning it between opportunities |
| $P(G)$ | **guess** — answers correctly *without* mastery |
| $P(S)$ | **slip** — answers incorrectly *despite* mastery |

**Posterior after observing a correct response:**

$$P(L_t \mid \text{correct}) = \frac{P(L_t)\,(1-P(S))}{P(L_t)(1-P(S)) + (1-P(L_t))\,P(G)}$$

**After an incorrect response:**

$$P(L_t \mid \text{incorrect}) = \frac{P(L_t)\,P(S)}{P(L_t)P(S) + (1-P(L_t))(1-P(G))}$$

**Then apply learning:**

$$P(L_{t+1}) = P(L_t \mid \text{obs}) + \big(1 - P(L_t \mid \text{obs})\big)\,P(T)$$

**Prediction of the next response being correct:**

$$P(\text{correct}_{t+1}) = P(L_{t+1})(1-P(S)) + (1-P(L_{t+1}))P(G)$$

Fitted by EM (Baum–Welch) or brute-force grid search over the 4 parameters.

### Identifiability — a real trap
Beck & Chang (2007) showed BKT parameters are **not identifiable**: multiple
$(L_0, T, G, S)$ sets produce identical likelihood. The standard fix is the
Baker/Corbett constraint $P(G) \le 0.30$, $P(S) \le 0.10$ — the *"model
degeneracy"* bound. **Apply it, and say you applied it in the report**; an
examiner who knows KT will ask.

### pyBKT
```python
from pyBKT.models import Model
import pandas as pd

df = pd.read_csv("codeworkout.csv")   # user_id, skill_name, correct  (0/1)

m = Model(seed=42, num_fits=5)        # num_fits > 1 mitigates local optima
m.fit(data=df, skills=["pointer_reassignment", "inorder_successor"],
      forgets=False)                  # forgets=True adds P(F); we do not want it

print(m.params())                     # inspect prior/learns/guesses/slips
auc  = m.evaluate(data=df_test, metric="auc")
pred = m.predict(data=df_test)        # adds 'correct_predictions', 'state_predictions'
```
`state_predictions` is $P(L_t)$ — **that is the mastery vector we consume**, not
`correct_predictions`.

---

## 1.2 Deep Knowledge Tracing (DKT)

An LSTM over the interaction sequence. Standard encoding for $M$ KCs:

$$x_t \in \{0,1\}^{2M}, \qquad
x_t[\,k\,] = 1 \text{ if correct},\quad x_t[\,k + M\,] = 1 \text{ if incorrect}$$

Output layer is $M$ sigmoids — $P(\text{correct})$ for **every** KC at $t+1$.
Loss is binary cross-entropy **masked to the KC actually attempted next**:

```python
# y_hat: (B, T, M)   next_skill: (B, T)   next_correct: (B, T)   mask: (B, T)
p = y_hat.gather(-1, next_skill.unsqueeze(-1)).squeeze(-1)   # (B, T)
loss = F.binary_cross_entropy(p[mask], next_correct[mask].float())
```

Reference config that works: hidden 128–200, 1 layer, dropout 0.2, Adam 1e-3,
sequence truncation at 200 interactions, batch 32.

### Two documented DKT problems you must handle
1. **Reconstruction failure** (Yeung & Yeung, 2018): DKT's predicted mastery
   for a KC can *drop* after a correct answer on that KC, and predictions
   oscillate wildly between adjacent time steps. Fixed by adding regularisation
   terms $r$ (reconstruction), $w_1, w_2$ (waviness) to the loss. **If you show
   an examiner a mastery curve that dips after a correct answer, this is why.**
2. **Splitting.** Never split by interaction. Split by **student**
   (`GroupKFold(groups=user_id)`), otherwise the same learner appears in train
   and test and AUC is inflated. See `05-evaluation.md`.

### Code-aware variants
- **Code-DKT** (EDM'22) — adds code2vec embeddings of the submission.
- **srcML-DKT** (EDM'25) — adds srcML/AST-derived structural features.
Both change *what the input vector contains*. That is the same lever we pull —
we just pull it toward **behaviour** rather than **code structure**.

---

## 1.3 Why delegation breaks both — and the fix

Look again at the BKT correct-response update. The only way the model can
explain "correct without mastery" is $P(G)$, the **guess** parameter — and
$P(G)$ is a **per-KC constant**, fitted once, identical for every student on
every opportunity.

> **Delegation is behaviourally a per-opportunity guess rate near 1.0.**
> BKT has no parameter that can vary per opportunity, so it has no way to
> express what happened. It attributes the correct answer to mastery, and
> mastery rises.

This is not a bug in our implementation. It is a **structural limit of the
model class**, and it is why CoTutor (2025) — which runs BKT for AI-assisted
programming — silently inherits it.

### Fix A — context-conditioned emission (BKT)

Replace the constant with a function of the telemetry observed on that
opportunity:

$$P(G) \;\longrightarrow\; P(G \mid f_t) = \sigma\!\big(\beta_0 + \boldsymbol{\beta}^\top f_t\big)$$

where $f_t$ is the telemetry feature vector for that submission. Everything
else in BKT is unchanged; you are still doing exact Bayesian updates, you have
just made one emission parameter observation-dependent. Fit $\boldsymbol{\beta}$
on a labelled subset, or by EM jointly with the BKT parameters.

**This is a clean, implementable, defensible formulation of the contribution.**
It is easy to explain in a viva, easy to ablate, and easy to evaluate.

### Fix B — input augmentation (DKT)

$$x_t = \big[\,\text{one-hot}(2M)\;;\;f_t\,\big] \in \mathbb{R}^{2M + d}$$

Let the LSTM learn the discount itself. More expressive, less interpretable.
**Do both.** Fix A is your explainable baseline; Fix B is your performance
model; the gap between them is a result.

### The feature vector $f_t$

| Feature | Definition | Why |
|---|---|---|
| `paste_ratio` | chars inserted by paste / total chars inserted | direct delegation signal |
| `post_insert_edit_distance` | token edit distance between pasted block and submitted block | did they engage with it at all? |
| `time_on_task_z` | session duration, z-scored within cohort per task | 0.21× median is a signal |
| `error_recovery_episodes` | count of compile-error → fix → compile-clean cycles | struggling *productively* |
| `idle_fraction` | idle time / wall time | thinking vs. absent |
| `revert_count` | reverts to an earlier code state | thrashing |
| `first_compile_success` | boolean | pasted code usually compiles first time |
| `keystroke_burst_entropy` | entropy of inter-keystroke intervals | typed vs. transcribed |

Normalise per cohort and per task, not globally — task difficulty dominates
otherwise.

> **Adversarial note.** A student who retypes AI output defeats `paste_ratio`
> but not `error_recovery_episodes`, `time_on_task_z` or
> `keystroke_burst_entropy`. Do not let the estimator depend on any single
> feature. Report per-feature ablations — an examiner will ask "what if they
> just retype it?" and the ablation table **is** the answer.

---

## 1.4 What to measure

Not just AUC. AUC asks "does it rank next-step correctness well?" We also need
**"is the mastery number itself honest?"**

| Metric | Definition |
|---|---|
| **AUC** | next-step correctness, leave-students-out CV |
| **Mastery inflation** | $\overline{\hat{m} - m_{\text{true}}}$ over delegating students |
| **ECE** | expected calibration error, 10 bins |
| **Brier score** | mean squared error of the probability |

Mastery inflation is the headline number and the one nobody else reports.
Design in `05-evaluation.md`.
