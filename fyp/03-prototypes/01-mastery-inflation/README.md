# POC-lite 01 — Mastery inflation under AI-mediated submissions

**This is the Week-4 POC.** It is a *live baseline run + risk experiment*, which is
what the handbook asks for. It is **not** a UI mockup — the handbook explicitly
excludes those (Appendix A, Stage 0: *"not just a UI mockup"*).

## Run it

```bash
python3 poc_mastery_inflation.py          # prints the table, writes the chart
python3 poc_mastery_inflation.py --no-plot
```
Runs in **0.34 s**. Dependencies: numpy, matplotlib. No pyBKT needed — BKT is
implemented directly in ~30 lines so you can be asked to explain every line of it.

## The five questions (handbook C.12)

**1 · What risky assumption was tested?**
That standard Bayesian Knowledge Tracing over-estimates mastery when submissions
are AI-mediated, and that conditioning the *guess* parameter on telemetry
suppresses that over-estimate **without penalising honest students.**

**2 · What input/setup was used?**
A simulated cohort of 180 students × 14 opportunities with **known ground-truth
mastery** — which real datasets cannot give us. BKT fitted on the clean cohort
(Baker caps applied: G ≤ 0.30, S ≤ 0.10). Delegation then injected at 0 / 25 / 50 %:
affected students submit correct from opportunity 6 onward and stop learning,
carrying a paste signature in telemetry.

**3 · What empirical result was obtained?**

| injection | inflation, standard BKT | inflation, telemetry-conditioned | honest students |
|---|---|---|---|
| 0 % | 0.000 | 0.000 | +0.016 |
| 25 % | **+0.422** | **+0.264** | +0.026 |
| 50 % | **+0.478** | **+0.325** | +0.023 |

*inflation = mean(estimated mastery − true mastery) for delegating students.*

**4 · What was learned or disproved?**
Two things, and the second was not expected.
- The premise holds. Standard BKT reports roughly **+0.45 mastery** that does not
  exist. A tutor gating hints on that number withdraws help from exactly the
  students who need it.
- **Conditioning the guess parameter is only a partial fix — about 40 % of the
  inflation remains.** The residual comes from BKT's *transit* term: the model
  keeps applying P(T) learning on every opportunity even when the evidence has
  been discounted to nothing. Suppressing the emission is not enough; the
  **learning term also has to be gated.**
- Honest students are unaffected (+0.02 either way), so the correction does not
  over-fire. That was the risk and it did not materialise.

**5 · What changed in the architecture as a result?**
The knowledge-tracing engine now needs **two** telemetry-conditioned parameters,
not one — emission *and* transit. This is a design change caused by the POC, and
it is written into `02-design/tech/01-knowledge-tracing.md`.

## Honesty rules for the defense
- Say **"simulated cohort with a synthetic delegation signature"** every time you
  show the chart. The banner on the figure says it too. It is not a classroom
  result and it is not CSEDM yet.
- The simulation's purpose is to establish **magnitude and mechanism**, and to
  find the residual. Replication on CSEDM 2021 / CodeWorkout is the next step and
  is scheduled.
- If a panel member asks whether the result is true by construction: partly, for
  the direction — but **not** for the magnitude, and **not** for the residual,
  which is the finding that changed our design.

## Next
- [ ] Download CSEDM 2021 (CodeWorkout, Java CS1, 410 students, ProgSnap2) and
      re-run with `--csv`.
- [ ] Add the gated-transit variant and re-measure the residual.
- [ ] Swap the hand-rolled BKT for pyBKT and confirm the parameters agree.
