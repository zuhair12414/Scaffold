"""Evaluation of next-attempt predictions on held-out students (docs/design/05-evaluation.md).

Planned: AUC, accuracy and log-loss for BKT, BKT + telemetry guess, DKT, and DKT + telemetry, each
over the same GroupKFold folds. Results are written to research/ as CSV before any number is cited.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence

from .interfaces import Interaction, KnowledgeTracer


def score(y_true: Sequence[int], y_prob: Sequence[float]) -> dict[str, float]:
    raise NotImplementedError("planned: see packages/kt/README.md")


def cross_validate(tracer: KnowledgeTracer, sequences: Mapping[str, Sequence[Interaction]], k: int = 5) -> list[dict[str, float]]:
    raise NotImplementedError("planned: see packages/kt/README.md")
