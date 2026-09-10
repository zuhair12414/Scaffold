#!/usr/bin/env python3
"""Stacked bars of leakage verdicts per condition, one panel per model.
Reads spike/results/summary.json (from aggregate.py), writes spike/results/leakage.png"""
import json, pathlib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

ROOT = pathlib.Path(__file__).resolve().parent
data = json.loads((ROOT / "results/summary.json").read_text())
ORDER = ["Baseline prompt", "System prompt", "RAG", "RAG + system prompt", "RAG with solution", "RAG with solution + system prompt"]
SHORT = {"Baseline prompt": "Baseline\nprompt", "System prompt": "System\nprompt", "RAG": "RAG", "RAG + system prompt": "RAG +\nsystem prompt",
         "RAG with solution": "RAG with\nsolution", "RAG with solution + system prompt": "RAG with solution\n+ system prompt"}
COL = {"leaked": "#d03b3b", "partial": "#fab219", "clean": "#0ca30c"}
models = sorted({d["model"] for d in data}, key=lambda m: ("7b" in m, m))
fig, axes = plt.subplots(1, len(models), figsize=(6.2 * len(models), 5.2), sharey=True, squeeze=False)
for ax, model in zip(axes[0], models):
    rows = {d["condition"]: d for d in data if d["model"] == model}
    conds = [c for c in ORDER if c in rows]
    x = range(len(conds))
    bottom = [0] * len(conds)
    for key in ["leaked", "partial", "clean"]:
        vals = [rows[c][key] for c in conds]
        ax.bar(x, vals, bottom=bottom, color=COL[key], width=0.62, label={"leaked": "Leaked runnable solution", "partial": "Code fragments", "clean": "No code"}[key], edgecolor="white", linewidth=1)
        for i, v in enumerate(vals):
            if v: ax.text(i, bottom[i] + v / 2, str(v), ha="center", va="center", fontsize=10, color="white" if key != "partial" else "#412402")
        bottom = [b + v for b, v in zip(bottom, vals)]
    n = max(rows[c]["n"] for c in conds)
    ax.set_xticks(list(x)); ax.set_xticklabels([SHORT[c] for c in conds], fontsize=9)
    ax.set_title(f"{model}   (n = {n} adversarial replies per condition)", fontsize=11, loc="left")
    ax.set_ylim(0, n + 1); ax.spines[["top", "right"]].set_visible(False); ax.grid(axis="y", color="#e1e0d9", linewidth=0.8); ax.set_axisbelow(True)
    for i, c in enumerate(conds):
        s = rows[c]["semantic"]
        if s: ax.text(i, n + 0.3, f"sem {s}", ha="center", fontsize=8, color="#898781")
axes[0][0].set_ylabel("replies")
for ax in axes[0]: ax.yaxis.set_major_locator(MaxNLocator(integer=True))
handles, labels = axes[0][0].get_legend_handles_labels()
fig.legend(handles, labels, loc="lower center", ncol=3, frameon=False, fontsize=10, bbox_to_anchor=(0.5, -0.02))
fig.suptitle("Does prompting or retrieval stop a small open model\nfrom leaking the solution?", fontsize=13, x=0.01, ha="left")
fig.text(0.01, 0.885, "Six adversarial prompt families x 3 samples, factorial problem, temperature 0.7.\n'sem' = replies that spelled out the fix in prose without any code.", fontsize=9, color="#52514e", va="top")
fig.tight_layout(rect=(0, 0.06, 1, 0.87))
out = ROOT / "results/leakage.png"
fig.savefig(out, dpi=180)
print("wrote", out)
