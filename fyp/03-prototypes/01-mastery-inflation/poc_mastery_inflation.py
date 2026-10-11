#!/usr/bin/env python3
"""
SCAFFOLD - POC-lite / technical spike
Risky assumption under test:
   "Standard Bayesian Knowledge Tracing over-estimates mastery when submissions
    are AI-mediated, and conditioning the guess parameter on telemetry
    suppresses that over-estimate without penalising honest students."

Run:  python3 poc_mastery_inflation.py            (synthetic cohort, no download)
      python3 poc_mastery_inflation.py --csv progsnap.csv
         expects columns: SubjectID, Order, Correct[,Pasted]

Dependencies: numpy, matplotlib  (no pyBKT needed - BKT is ~30 lines)
"""
import argparse, csv, sys
import numpy as np

RNG = np.random.default_rng(7)

# ----------------------------------------------------------------------------
# 1. BKT  -- Corbett & Anderson (1995).  Four parameters, exact Bayesian update.
# ----------------------------------------------------------------------------
class BKT:
    def __init__(self, p_init=0.20, p_transit=0.15, p_guess=0.25, p_slip=0.08):
        self.L0, self.T, self.G, self.S = p_init, p_transit, p_guess, p_slip

    def _posterior(self, L, correct, g=None):
        """P(L_t | observation).  g may be overridden per-opportunity."""
        G = self.G if g is None else g
        if correct:
            num = L * (1 - self.S)
            den = num + (1 - L) * G
        else:
            num = L * self.S
            den = num + (1 - L) * (1 - G)
        return num / den if den > 0 else L

    def trace(self, responses, guess_override=None):
        """Return the mastery estimate after each opportunity."""
        L, out = self.L0, []
        for i, c in enumerate(responses):
            g = None if guess_override is None else guess_override[i]
            post = self._posterior(L, c, g)
            L = post + (1 - post) * self.T          # apply learning
            out.append(L)
        return np.array(out)

    def fit(self, sequences, iters=60):
        """Crude EM-ish grid refinement.  Enough for a POC; pyBKT for the report."""
        best, best_ll = (self.L0, self.T, self.G, self.S), -np.inf
        for _ in range(iters):
            cand = (np.clip(best[0] + RNG.normal(0, .05), .01, .90),
                    np.clip(best[1] + RNG.normal(0, .04), .01, .50),
                    np.clip(best[2] + RNG.normal(0, .04), .01, .30),   # Baker cap G<=0.30
                    np.clip(best[3] + RNG.normal(0, .02), .01, .10))   # Baker cap S<=0.10
            m = BKT(*cand); ll = 0.0
            for seq in sequences:
                L = m.L0
                for c in seq:
                    p = L * (1 - m.S) + (1 - L) * m.G
                    ll += np.log(p if c else 1 - p + 1e-12)
                    post = m._posterior(L, c); L = post + (1 - post) * m.T
            if ll > best_ll: best, best_ll = cand, ll
        self.L0, self.T, self.G, self.S = best
        return self

# ----------------------------------------------------------------------------
# 2. Synthetic cohort with GROUND TRUTH mastery  (what real data cannot give us)
# ----------------------------------------------------------------------------
def make_cohort(n_students=180, n_opps=14, p_learn=0.13, p_guess=0.22, p_slip=0.07):
    seqs, truth = [], []
    for _ in range(n_students):
        mastered, resp, tr = False, [], []
        for _ in range(n_opps):
            if not mastered and RNG.random() < p_learn:
                mastered = True
            p = (1 - p_slip) if mastered else p_guess
            resp.append(int(RNG.random() < p))
            tr.append(int(mastered))
        seqs.append(resp); truth.append(tr)
    return np.array(seqs), np.array(truth)

def inject_delegation(seqs, truth, rate, start_frac=0.45):
    """A delegating student submits CORRECT code from `start` onward, and stops learning."""
    seqs, truth = seqs.copy(), truth.copy()
    n, T = seqs.shape
    start = int(T * start_frac)
    flags = np.zeros_like(seqs)
    who = RNG.choice(n, size=int(n * rate), replace=False)
    for i in who:
        seqs[i, start:] = 1            # always correct
        truth[i, start:] = truth[i, start]   # learning frozen at onset
        flags[i, start:] = 1           # telemetry: paste signature present
    return seqs, truth, flags, set(who.tolist())

# ----------------------------------------------------------------------------
# 3. The experiment
# ----------------------------------------------------------------------------
def run(rates=(0.0, 0.25, 0.50), n_students=180, n_opps=14):
    clean, clean_truth = make_cohort(n_students, n_opps)
    model = BKT().fit(list(clean))
    print(f"\nFitted BKT on clean cohort:  L0={model.L0:.3f}  T={model.T:.3f}  "
          f"G={model.G:.3f}  S={model.S:.3f}\n")

    rows = []
    for r in rates:
        seqs, truth, flags, delegators = inject_delegation(clean, clean_truth, r)
        inf_std, inf_tel, over_std, over_tel = [], [], [], []
        for i in range(len(seqs)):
            final_true = truth[i, -1]
            m_std = model.trace(seqs[i])[-1]
            # telemetry-conditioned emission: when the paste signature is present,
            # a correct answer is almost uninformative  ->  P(G | f_t) ~ 0.95
            g_over = [0.95 if f else None for f in flags[i]]
            m_tel = model.trace(seqs[i], guess_override=g_over)[-1]
            if i in delegators:
                inf_std.append(m_std - final_true); inf_tel.append(m_tel - final_true)
            else:
                over_std.append(m_std - final_true); over_tel.append(m_tel - final_true)
        rows.append(dict(rate=r,
                         inf_std=np.mean(inf_std) if inf_std else 0.0,
                         inf_tel=np.mean(inf_tel) if inf_tel else 0.0,
                         hon_std=np.mean(over_std), hon_tel=np.mean(over_tel)))

    print(f"{'inject':>7} | {'inflation STD':>13} | {'inflation TEL':>13} | "
          f"{'honest STD':>10} | {'honest TEL':>10}")
    print("-" * 68)
    for x in rows:
        print(f"{x['rate']*100:6.0f}% | {x['inf_std']:13.3f} | {x['inf_tel']:13.3f} | "
              f"{x['hon_std']:10.3f} | {x['hon_tel']:10.3f}")
    print("\ninflation = mean(estimated mastery - true mastery) for DELEGATING students")
    print("honest    = same quantity for NON-delegating students (over-correction check)\n")
    return rows

def plot(rows, path="poc_mastery_inflation.png"):
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    x = [r["rate"] * 100 for r in rows]
    fig, ax = plt.subplots(figsize=(8.2, 4.6), dpi=170)
    ax.plot(x, [r["inf_std"] for r in rows], "o-", lw=2.6, color="#0F4C81",
            label="Standard BKT — delegating students")
    ax.plot(x, [r["inf_tel"] for r in rows], "o-", lw=2.6, color="#B26B00",
            label="Telemetry-conditioned BKT — delegating students")
    ax.plot(x, [r["hon_tel"] for r in rows], "s--", lw=1.6, color="#6B7280",
            label="Telemetry-conditioned — honest students (over-correction)")
    ax.axhline(0, color="#C7CDD4", lw=1)
    ax.set_xlabel("share of cohort delegating (%)")
    ax.set_ylabel("mastery inflation\n(estimated − true)")
    ax.set_title("Mastery inflation under AI-mediated submissions",
                 fontsize=12, fontweight="bold", loc="left")
    ax.text(0, 1.12, "SIMULATED COHORT · synthetic delegation signature · "
            "to be replicated on CSEDM 2021", transform=ax.transAxes,
            fontsize=8, color="#A32C2C", fontweight="bold")
    ax.legend(frameon=False, fontsize=8.5, loc="upper left")
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout(); fig.savefig(path, bbox_inches="tight")
    print(f"chart written: {path}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--students", type=int, default=180)
    ap.add_argument("--opps", type=int, default=14)
    ap.add_argument("--no-plot", action="store_true")
    a = ap.parse_args()
    rows = run(n_students=a.students, n_opps=a.opps)
    if not a.no_plot: plot(rows)
