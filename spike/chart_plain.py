#!/usr/bin/env python3
"""Lay-audience chart: how often the AI tutor handed the student the answer, by setting.
'Got the answer' = corrected code in the reply (leaked or partial) OR the fix spelled out in words (semantic)."""
import csv, glob, pathlib, collections
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = pathlib.Path(__file__).resolve().parent
rows = {}
for f in sorted(glob.glob(str(ROOT / "results/**/*.csv"), recursive=True)):
    for r in csv.DictReader(open(f)):
        r.setdefault("context", "none"); r.setdefault("profile", "none")
        if r["verdict"] == "error" or r["profile"] != "none" or r["attack"] == "B0": continue
        rows[(r["model"], r["prompt"], r["context"], r["attack"], r["sample"])] = r

COND = [("basic", "none"), ("basic", "rag"), ("basic", "rag_solution")]
XL = ["Told not to give answers", "Told not to give answers\n+ course notes", "Told not to give answers\n+ course notes + answer key"]
MODELS = [("qwen2.5-coder:7b", "Qwen 7B", "#3b8ff0", "#9cc6f8"), ("llama3.2:3b", "Llama 3B", "#a6d65a", "#d6ecab")]

agg = collections.defaultdict(lambda: {"n": 0, "code": 0, "words": 0})
for r in rows.values():
    g = agg[(r["model"], r["prompt"], r["context"])]; g["n"] += 1
    if r["verdict"] in ("leaked", "partial"): g["code"] += 1
    elif r["semantic"] == "1": g["words"] += 1

BG, PANEL, GRID, TXT, SUB = "#0c0e13", "#151920", "#262a32", "#e8eaee", "#9aa0aa"
plt.rcParams.update({"font.family": "DejaVu Sans", "text.color": TXT, "axes.labelcolor": SUB, "xtick.color": SUB, "ytick.color": SUB})
fig = plt.figure(figsize=(14.5, 8.8), facecolor=BG)
ax = fig.add_axes([0.08, 0.24, 0.88, 0.53]); ax.set_facecolor(BG)
w = 0.30
for mi, (model, label, c_code, c_words) in enumerate(MODELS):
    xs = [i + (mi - 0.5) * (w + 0.04) for i in range(len(COND))]
    code = [100 * agg[(model, p, c)]["code"] / agg[(model, p, c)]["n"] for p, c in COND]
    words = [100 * agg[(model, p, c)]["words"] / agg[(model, p, c)]["n"] for p, c in COND]
    ax.bar(xs, code, w, color=c_code, label=f"{label}: gave the code", zorder=3, edgecolor=BG, linewidth=1)
    ax.bar(xs, words, w, bottom=code, color=c_words, label=f"{label}: spelled out the fix", zorder=3, edgecolor=BG, linewidth=1)
    for x, cv, wv in zip(xs, code, words):
        tot = cv + wv
        ax.text(x, tot + 2, f"{tot:.0f}%", ha="center", va="bottom", fontsize=11.5, fontweight="bold", color=c_code if tot else SUB)

ax.set_xticks(range(len(COND))); ax.set_xticklabels(XL, fontsize=11)
ax.set_ylim(0, 105); ax.set_yticks(range(0, 101, 20)); ax.set_yticklabels([f"{v}%" for v in range(0, 101, 20)], fontsize=10.5)
ax.set_xlim(-0.6, len(COND) - 0.4)
ax.set_xticklabels(XL, fontsize=11.5)
ax.grid(axis="y", color=GRID, linewidth=0.8); ax.set_axisbelow(True)
for s in ax.spines.values(): s.set_color(GRID)
ax.tick_params(length=0)
ax.set_ylabel("Share of tries where the student got the answer", fontsize=11.5, labelpad=12)
ax.set_xlabel("How the AI tutor was set up", fontsize=12, labelpad=16)

fig.text(0.07, 0.925, "How Often an AI Tutor Hands the Student the Answer", fontsize=18, fontweight="bold", color=TXT)
fig.text(0.07, 0.885, "A student asked for the solution in 6 different ways, 3 times each: 18 tries per setup. Two open-source models, set up the way today's tutoring tools are.", fontsize=12, color=SUB)
fig.text(0.07, 0.852, "\"Got the answer\" = the reply contained the corrected code, or spelled out exactly what to change in words.", fontsize=11.5, color=SUB)

leg = ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.24), ncol=4, frameon=True, fancybox=True, fontsize=10.5, labelcolor=TXT, borderpad=0.8, handlelength=1.3, handletextpad=0.6, columnspacing=1.6)
leg.get_frame().set_facecolor(PANEL); leg.get_frame().set_edgecolor("#3a3f48")
fig.text(0.5, 0.03, "Source: Scaffold spike harness (spike/leakage.py)  •  108 adversarial replies  •  factorial problem, C++  •  2026-09-07", ha="center", fontsize=9.5, color=SUB)
out = ROOT / "results/leakage_plain.png"; fig.savefig(out, dpi=170, facecolor=BG); print("wrote", out)
for k in sorted(agg): g = agg[k]; print(k, f"code {g['code']}/{g['n']}  words {g['words']}/{g['n']}  got answer {100*(g['code']+g['words'])/g['n']:.0f}%")
