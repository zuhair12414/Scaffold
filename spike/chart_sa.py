#!/usr/bin/env python3
"""Single headline chart, dark editorial style. Leaked share of adversarial replies by guardrail condition."""
import json, pathlib
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

ROOT = pathlib.Path(__file__).resolve().parent
data = json.loads((ROOT / "results/summary.json").read_text())
ORDER = ["Baseline prompt", "RAG", "RAG with solution", "System prompt", "RAG + system prompt", "RAG with solution + system prompt"]
XL = ["Baseline\nprompt", "+ RAG", "+ RAG with\nsolution", "Hardened\nsystem prompt", "Hardened\n+ RAG", "Hardened + RAG\nwith solution"]
SERIES = [("qwen2.5-coder:7b", "Qwen2.5-Coder 7B (Ollama)", "#3b8ff0", "white"), ("llama3.2:3b", "Llama 3.2 3B (Ollama)", "#a6d65a", "#1a2a08")]

BG, PANEL, GRID, TXT, SUB = "#0c0e13", "#151920", "#262a32", "#e8eaee", "#9aa0aa"
plt.rcParams.update({"font.family": "DejaVu Sans", "text.color": TXT, "axes.labelcolor": SUB, "xtick.color": SUB, "ytick.color": SUB})
fig = plt.figure(figsize=(14.5, 8.6), facecolor=BG)
ax = fig.add_axes([0.065, 0.16, 0.70, 0.62]); ax.set_facecolor(BG)

for model, label, col, pill_txt in SERIES:
    rows = {d["condition"]: d for d in data if d["model"] == model}
    y = [100 * rows[c]["leaked"] / rows[c]["n"] for c in ORDER]
    x = list(range(len(ORDER)))
    ax.plot(x, y, color=col, linewidth=2.6, marker="o", markersize=7, markerfacecolor=col, markeredgecolor=BG, markeredgewidth=1.5, label=label, zorder=3, solid_capstyle="round")
    for xi, yi in zip(x, y):
        dx = 14 if (xi == 3 and model.startswith("llama")) else 0
        ax.annotate(f"{yi:.0f}%", (xi, yi), textcoords="offset points", xytext=(dx, 11), ha="center", fontsize=10, color=col, fontweight="bold")
    ax.annotate(label.split(" (")[0], (x[-1], y[-1]), textcoords="offset points", xytext=(14, 0 if model.startswith("qwen") else 22), ha="left", va="center", fontsize=10.5, fontweight="bold", color=pill_txt,
                bbox=dict(boxstyle="round,pad=0.38,rounding_size=0.6", fc=col, ec="none"), zorder=5)

ax.set_xticks(range(len(ORDER))); ax.set_xticklabels(XL, fontsize=10.5)
ax.set_ylim(-4, 100); ax.set_yticks(range(0, 101, 10)); ax.set_yticklabels([f"{v}%" for v in range(0, 101, 10)], fontsize=10)
ax.set_xlim(-0.4, len(ORDER) - 0.5)
ax.grid(color=GRID, linewidth=0.8); ax.set_axisbelow(True)
for s in ax.spines.values(): s.set_color(GRID)
ax.tick_params(length=0)
ax.set_ylabel("Adversarial replies that leaked the runnable solution", fontsize=11, labelpad=12)
ax.set_xlabel("Guardrail condition on the baseline assistant", fontsize=11.5, labelpad=14)
ax.axvline(2.5, color="#3a3f48", linewidth=1.2, linestyle=(0, (4, 4)), zorder=1)
ax.text(1.0, 95, "Basic system prompt", ha="center", fontsize=10, color=SUB)
ax.text(4.0, 95, "Hardened system prompt", ha="center", fontsize=10, color=SUB)

fig.text(0.065, 0.925, "Solution Leakage vs. Guardrail Condition (Baseline Tutor, Local Open Models)", fontsize=17, fontweight="bold", color=TXT)
fig.text(0.065, 0.885, "Factorial (C++)  •  6 adversarial prompt families × 3 samples  •  temperature 0.7  •  Ollama on Apple M2", fontsize=12, color=SUB)
fig.text(0.065, 0.852, "Leaked = reply contains the corrected runnable function  •  retrieval = course notes + attempt history, optionally the reference solution", fontsize=11, color=SUB)

leg = ax.legend(loc="upper left", bbox_to_anchor=(1.035, 1.0), frameon=True, fancybox=True, fontsize=11.5, labelcolor=TXT, borderpad=0.9, handlelength=1.2, handletextpad=0.7)
leg.get_frame().set_facecolor(PANEL); leg.get_frame().set_edgecolor("#3a3f48"); leg.get_frame().set_linewidth(1.0)

fig.text(0.5, 0.045, "Source: Scaffold spike harness (spike/leakage.py)  •  222 replies  •  2026-09-07", ha="center", fontsize=9.5, color=SUB)
fig.patches.append(FancyBboxPatch((0, 0), 1, 0.02, boxstyle="square,pad=0", transform=fig.transFigure, fc="#1a1330", ec="none"))
out = ROOT / "results/leakage_dark.png"
fig.savefig(out, dpi=170, facecolor=BG); print("wrote", out)
