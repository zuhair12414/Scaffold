#!/usr/bin/env python3
"""Aggregate every leakage CSV under spike/results into one table per model and condition.

Condition = (prompt, context). Later CSVs override earlier ones for the same
(model, prompt, context, profile, attack, sample) key, so reruns replace crashed cells.
Prints markdown and writes spike/results/summary.json for charting.
"""
import csv, glob, json, collections, pathlib
ROOT = pathlib.Path(__file__).resolve().parent
rows = {}
for f in sorted(glob.glob(str(ROOT / "results/**/*.csv"), recursive=True)):
    for r in csv.DictReader(open(f)):
        r.setdefault("context", "none"); r.setdefault("profile", "none")
        if r["verdict"] == "error": continue
        rows[(r["model"], r["prompt"], r["context"], r["profile"], r["attack"], r["sample"])] = r
LABEL = {("basic", "none"): "Baseline prompt", ("hardened", "none"): "System prompt",
         ("basic", "rag"): "RAG", ("hardened", "rag"): "RAG + system prompt",
         ("basic", "rag_solution"): "RAG with solution", ("hardened", "rag_solution"): "RAG with solution + system prompt"}
agg = collections.defaultdict(lambda: collections.Counter())
sem = collections.Counter(); n_by = collections.Counter()
for k, r in rows.items():
    model, prompt, ctx, prof, atk, _ = k
    if prof != "none" or atk == "B0": continue          # adversarial only, no profile runs
    c = (model, LABEL.get((prompt, ctx), f"{prompt}/{ctx}"))
    agg[c][r["verdict"]] += 1; n_by[c] += 1
    if r["semantic"] == "1": sem[c] += 1
out = []
for (model, cond), cnt in sorted(agg.items()):
    n = n_by[(model, cond)]
    out.append({"model": model, "condition": cond, "n": n, "leaked": cnt["leaked"], "partial": cnt["partial"], "clean": cnt["clean"], "semantic": sem[(model, cond)]})
(ROOT / "results/summary.json").write_text(json.dumps(out, indent=1))
print("| model | condition | n | leaked | partial | clean | semantic |\n|---|---|---|---|---|---|---|")
for o in out:
    print(f"| {o['model']} | {o['condition']} | {o['n']} | {o['leaked']} | {o['partial']} | {o['clean']} | {o['semantic']} |")
# profile comparison, if present
prof_rows = [r for r in rows.values() if r["profile"] != "none"]
if prof_rows:
    print("\nProfile runs (hardened prompt):")
    for r in sorted(prof_rows, key=lambda r: (r["profile"], r["attack"], r["sample"])):
        print(f"- {r['profile']} {r['attack']} #{r['sample']} -> {r['verdict']}, {r['chars']} chars: {r['reply'][:140].replace(chr(10),' ')}")
