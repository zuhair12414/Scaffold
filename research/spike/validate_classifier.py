#!/usr/bin/env python3
"""Compare static labels with the spike classifiers."""
import argparse, collections, csv, pathlib

from disclosure import level
from leakage import classify

ROOT = pathlib.Path(__file__).resolve().parent
DEFAULT_LABELS = ROOT / "labels.csv"

def read_labels(path):
    if not path.exists():
        print(f"not measured yet: add human-labelled rows to {path}")
        return []
    rows = list(csv.DictReader(path.open()))
    rows = [r for r in rows if r.get("reply_id")]
    if not rows:
        print(f"not measured yet: add human-labelled rows to {path}")
        return []
    return rows

def show_ratio(good, total):
    return f"{good}/{total}"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--labels", default=str(DEFAULT_LABELS))
    a = ap.parse_args()
    rows = read_labels(pathlib.Path(a.labels))
    if not rows:
        return
    verdict_ok = level_ok = verdict_total = level_total = 0
    confusion = collections.Counter()
    detail = []
    for r in rows:
        problem = r.get("problem") or "fact"
        expected_verdict = r.get("human_verdict", "").strip()
        expected_level = r.get("human_level", "").strip()
        got_verdict = classify(r["reply"], problem)
        got_level = str(level(r["reply"]))
        if expected_verdict:
            verdict_total += 1
            verdict_ok += int(got_verdict == expected_verdict)
            confusion[(expected_verdict, got_verdict)] += 1
        if expected_level:
            level_total += 1
            level_ok += int(got_level == expected_level)
        detail.append({
            "reply_id": r["reply_id"],
            "problem": problem,
            "human_verdict": expected_verdict,
            "classifier_verdict": got_verdict,
            "human_level": expected_level,
            "classifier_level": got_level,
        })
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    detail_path = out / "classifier_validation.csv"
    with detail_path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(detail[0].keys()))
        w.writeheader(); w.writerows(detail)
    print("Classifier validation")
    print(f"labels: {a.labels}")
    print(f"rows: {len(rows)}")
    print(f"verdict agreement: {show_ratio(verdict_ok, verdict_total) if verdict_total else 'not measured yet'}")
    print(f"level agreement: {show_ratio(level_ok, level_total) if level_total else 'not measured yet'}")
    print()
    print("confusion matrix: human_verdict -> classifier_verdict")
    for (human, got), n in sorted(confusion.items()):
        print(f"{human} -> {got}: {n}")
    print()
    print(f"wrote {detail_path}")

if __name__ == "__main__":
    main()
