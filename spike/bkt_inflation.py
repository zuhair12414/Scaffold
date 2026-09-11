#!/usr/bin/env python3
"""Deterministic BKT inflation spike.

The setup is intentionally small: eight students, eight correct submissions each,
and delegation rates of 0, 1/4 and 1/2. Correctness-only BKT treats every correct
submission as equally informative. The telemetry-adjusted variant treats a
delegated correct submission as more likely to be a guess and gives no learning
transition on that step.
"""
import csv, pathlib
from fractions import Fraction

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "results"
STUDENTS = 8
STEPS = 8
PRIOR = Fraction(1, 5)
GUESS = Fraction(1, 5)
DELEGATED_GUESS = Fraction(3, 5)
SLIP = Fraction(1, 10)
TRANSIT = Fraction(1, 5)
RATES = [Fraction(0, 1), Fraction(1, 4), Fraction(1, 2)]

def bkt_correct(p, guess=GUESS, transit=TRANSIT):
    num = p * (1 - SLIP)
    den = num + (1 - p) * guess
    posterior = num / den
    return posterior + (1 - posterior) * transit

def delegated_steps(rate, student):
    count = STEPS * rate.numerator // rate.denominator
    return {(student + 2 * i) % STEPS for i in range(count)}

def mean(values):
    return sum(values, Fraction(0, 1)) / len(values)

def show(x):
    return str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"

def simulate(rate):
    true_end, standard_end, adjusted_end = [], [], []
    delegated_events = 0
    for student in range(STUDENTS):
        delegated = delegated_steps(rate, student)
        delegated_events += len(delegated)
        truth = standard = adjusted = PRIOR
        for step in range(STEPS):
            if step in delegated:
                standard = bkt_correct(standard)
                adjusted = bkt_correct(adjusted, DELEGATED_GUESS, Fraction(0, 1))
            else:
                truth = bkt_correct(truth)
                standard = bkt_correct(standard)
                adjusted = bkt_correct(adjusted)
        true_end.append(truth)
        standard_end.append(standard)
        adjusted_end.append(adjusted)
    true_mean = mean(true_end)
    standard_mean = mean(standard_end)
    adjusted_mean = mean(adjusted_end)
    standard_inflation = standard_mean - true_mean
    adjusted_inflation = adjusted_mean - true_mean
    removed = "n/a" if standard_inflation == 0 else show((standard_inflation - adjusted_inflation) / standard_inflation)
    return {
        "delegation_rate": show(rate),
        "students": STUDENTS,
        "steps_per_student": STEPS,
        "correct_submissions": STUDENTS * STEPS,
        "delegated_submissions": delegated_events,
        "true_mastery_mean": show(true_mean),
        "correctness_only_mean": show(standard_mean),
        "telemetry_adjusted_mean": show(adjusted_mean),
        "correctness_only_inflation": show(standard_inflation),
        "telemetry_adjusted_inflation": show(adjusted_inflation),
        "inflation_removed": removed,
    }

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = [simulate(rate) for rate in RATES]
    csv_path = OUT / "bkt_inflation.csv"
    with csv_path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    md_path = OUT / "bkt_inflation.md"
    lines = [
        "# BKT inflation spike",
        "",
        f"Students: {STUDENTS}. Steps per student: {STEPS}. Values are exact fractions.",
        "",
        "| delegation rate | delegated submissions | true mastery mean | correctness-only inflation | telemetry-adjusted inflation | inflation removed |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for r in rows:
        lines.append("| {delegation_rate} | {delegated_submissions} | {true_mastery_mean} | {correctness_only_inflation} | {telemetry_adjusted_inflation} | {inflation_removed} |".format(**r))
    md_path.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    print()
    print(f"wrote {csv_path}")
    print(f"wrote {md_path}")

if __name__ == "__main__":
    main()
