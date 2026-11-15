"""ProgSnap2 loader: MainTable.csv (CSEDM 2021, later our own labs) to per-student sequences.

Planned behaviour:
- keep submission events only (Submit, Run.Program); edits and compiles are telemetry
- order each student's events by Order, then ServerTimestamp
- expand a multi-KC problem into one Interaction per KC
- report problems that have no KC mapping instead of guessing one
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from pathlib import Path

from ..interfaces import Interaction


def load_interactions(
    main_table: str | Path, problem_to_kcs: Mapping[str, Sequence[str]], pass_score: float = 1.0
) -> dict[str, list[Interaction]]:
    """Return {student_id: [Interaction, ...]} ordered in time."""
    raise NotImplementedError("planned: see packages/kt/README.md")
