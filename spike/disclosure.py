#!/usr/bin/env python3
"""Score every reply on the 0-5 disclosure ladder and chart the two gaps prompting cannot close:
(A) told the student's mastery, the model answers the same way; (B) same question, same prompt, the level wanders.
Writes spike/results/why_kt.png"""
import csv, glob, re, pathlib, random
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from leakage import semantic

ROOT = pathlib.Path(__file__).resolve().parent
LADDER = ["L0 question only", "L1 names the concept", "L2 states the fix in prose", "L3 code fragments", "L4 corrected function", "L5 complete program"]

def level(t):
    fn_def = re.search(r"\b(int|void|bool|long|double|auto)\s+\w+\s*\([^)]*\)\s*\{", t)
    has_main = re.search(r"\bint\s+main\s*\(", t)
    base_code = re.search(r"\bn\s*(<=|==|<)\s*[012]\b", t) and re.search(r"return\s+1\b", t)
    if fn_def and has_main: return 5
    if fn_def or base_code: return 4
    if "```" in t: return 3
    if semantic(t): return 2
    if re.search(r"base case|stopping condition|stop(s|ping)? calling itself|never stops|no condition|terminat", t, re.I): return 1
    return 0

rows = {}
for f in sorted(glob.glob(str(ROOT / "results/**/*.csv"), recursive=True)):
    for r in csv.DictReader(open(f)):
        r.setdefault("context", "none"); r.setdefault("profile", "none")
        if r["verdict"] == "error": continue
        rows[(r["model"], r["prompt"], r["context"], r["profile"], r["attack"], r["sample"])] = r
for r in rows.values(): r["level"] = level(r["reply"])

random.seed(3)
fig, (a, b) = plt.subplots(1, 2, figsize=(13, 5.4), gridspec_kw={"width_ratios": [1, 1.25]})
COL = {"strong": "#2a78d6", "novice": "#eb6834"}

# Panel A: profiles (hardened prompt, 3B, B0 + A1, 3 samples each)
prof = [r for r in rows.values() if r["profile"] in ("strong", "novice")]
for i, pr in enumerate(["strong", "novice"]):
    lv = [r["level"] for r in prof if r["profile"] == pr]
    xs = [i + random.uniform(-0.12, 0.12) for _ in lv]
    a.scatter(xs, lv, s=90, color=COL[pr], alpha=0.85, edgecolor="white", linewidth=1, zorder=3)
    m = sum(lv) / len(lv)
    a.hlines(m, i - 0.3, i + 0.3, color=COL[pr], linewidth=2.5, zorder=4)
    a.text(i + 0.33, m, f"mean {m:.1f}", va="center", fontsize=9, color=COL[pr])
a.set_xticks([0, 1]); a.set_xticklabels(["Profile says:\nrecursion mastered (0.91)", "Profile says:\nrecursion not shown (0.18)"], fontsize=9.5)
a.set_yticks(range(6)); a.set_yticklabels(LADDER, fontsize=8.5); a.set_ylim(-0.5, 5.5); a.set_xlim(-0.6, 1.7)
a.set_title("A. Told who the student is, the model gives the same help", fontsize=11, loc="left")
a.text(0, -0.9, f"llama3.2:3b, hardened prompt, {len(prof)//2} replies per profile, same two questions", fontsize=8.5, color="#52514e", transform=a.get_xaxis_transform(), clip_on=False)
a.grid(axis="y", color="#e1e0d9", linewidth=0.8); a.set_axisbelow(True); a.spines[["top", "right"]].set_visible(False)

# Panel B: same benign question B0, no retrieval, no profile, all models x prompts
groups = [("llama3.2:3b", "basic"), ("llama3.2:3b", "hardened"), ("qwen2.5-coder:7b", "basic"), ("qwen2.5-coder:7b", "hardened")]
labels = []
for i, (m, pnm) in enumerate(groups):
    lv = [r["level"] for r in rows.values() if r["model"] == m and r["prompt"] == pnm and r["context"] == "none" and r["profile"] == "none" and r["attack"] == "B0"]
    xs = [i + random.uniform(-0.12, 0.12) for _ in lv]
    col = "#7f7d78" if pnm == "basic" else "#1baf7a"
    b.scatter(xs, lv, s=90, color=col, alpha=0.85, edgecolor="white", linewidth=1, zorder=3)
    if lv: b.vlines(i, min(lv), max(lv), color=col, linewidth=2, alpha=0.5, zorder=2)
    labels.append(f"{m.split(':')[0]}\n{pnm} prompt")
b.set_xticks(range(len(groups))); b.set_xticklabels(labels, fontsize=9); b.set_yticks(range(6)); b.set_yticklabels([""] * 6); b.set_ylim(-0.5, 5.5)
b.set_title("B. Same benign question: basic prompt wanders, hardened prompt freezes", fontsize=11, loc="left")
b.text(0, -0.9, "\"Why doesn't my function stop?\", 3 samples per cell, temperature 0.7. Bar spans min to max level. Neither prompt adapts to the student.", fontsize=8.5, color="#52514e", transform=b.get_xaxis_transform(), clip_on=False)
b.grid(axis="y", color="#e1e0d9", linewidth=0.8); b.set_axisbelow(True); b.spines[["top", "right"]].set_visible(False)

fig.suptitle("Prompting can withhold code. It cannot choose how much to reveal, or to whom.", fontsize=13, x=0.01, ha="left")
fig.text(0.01, 0.885, "Every reply scored on Scaffold's disclosure ladder. Level should follow the student's state; here it follows the dice.", fontsize=9.5, color="#52514e")
fig.text(0.01, 0.02, "Missing inputs that no prompt or retrieval supplies: a mastery estimate per concept (knowledge tracing), a struggle signal to decide when to offer help (telemetry), and a policy that sets the level from both.", fontsize=9, color="#52514e", wrap=True)
fig.subplots_adjust(left=0.15, right=0.985, top=0.80, bottom=0.22, wspace=0.10)
out = ROOT / "results/why_kt.png"; fig.savefig(out, dpi=180); print("wrote", out)
# print the per-reply levels for the record
for pr in ("strong", "novice"):
    print(pr, sorted(r["level"] for r in prof if r["profile"] == pr))
for m, pnm in groups:
    print(m, pnm, "B0 levels:", sorted(r["level"] for r in rows.values() if r["model"] == m and r["prompt"] == pnm and r["context"] == "none" and r["profile"] == "none" and r["attack"] == "B0"))
