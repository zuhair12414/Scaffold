"""Load ProgSnap2 event logs into per-student sequences of graded attempts.

Each attempt is (problem_id, correct). Only submission events count as attempts; edits and
compiles are telemetry, handled elsewhere.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

SUBMIT_EVENTS = {"Run.Program", "Submit"}


@dataclass(frozen=True)
class Attempt:
    problem_id: str
    correct: bool
    timestamp: str
    code_state_id: str | None = None


def load_sequences(main_table: str | Path, pass_score: float = 1.0) -> dict[str, list[Attempt]]:
    """Return {student_id: [Attempt, ...]} ordered by time."""
    df = pd.read_csv(main_table)
    df = df[df["EventType"].isin(SUBMIT_EVENTS) & df["Score"].notna()]
    order = "Order" if "Order" in df.columns else "ServerTimestamp"
    df = df.sort_values(["SubjectID", order])
    seqs: dict[str, list[Attempt]] = {}
    for row in df.itertuples(index=False):
        seqs.setdefault(str(row.SubjectID), []).append(
            Attempt(
                problem_id=str(row.ProblemID),
                correct=float(row.Score) >= pass_score,
                timestamp=str(getattr(row, "ServerTimestamp", "")),
                code_state_id=str(getattr(row, "CodeStateID", "")) or None,
            )
        )
    return seqs


def summary(seqs: dict[str, list[Attempt]]) -> dict[str, float]:
    n = sum(len(s) for s in seqs.values())
    return {
        "students": len(seqs),
        "attempts": n,
        "problems": len({a.problem_id for s in seqs.values() for a in s}),
        "mean_attempts_per_student": n / max(len(seqs), 1),
        "pass_rate": sum(a.correct for s in seqs.values() for a in s) / max(n, 1),
    }
