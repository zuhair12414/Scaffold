"""Contracts shared by every knowledge tracer (BKT now, DKT later).

The disclosure policy depends only on these types, so the model behind them can change without
touching the policy or the frontend.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Protocol

# P(mastered) per knowledge component, keyed by KC id. What the disclosure policy reads.
MasteryVector = dict[str, float]


@dataclass(frozen=True)
class Interaction:
    """One graded attempt on one knowledge component."""

    student_id: str
    problem_id: str
    kc: str
    correct: bool
    order: float
    features: tuple[float, ...] = ()  # telemetry f_t (design 01 §1.3); empty when unavailable


class KnowledgeTracer(Protocol):
    """Offline: fit on many students. Runtime: update one student's state per attempt."""

    def fit(self, sequences: Mapping[str, Sequence[Interaction]]) -> None: ...

    def initial_state(self) -> object: ...

    def update(self, state: object, interaction: Interaction) -> object:
        """One forward step for one student. Never changes model weights."""
        ...

    def mastery(self, state: object) -> MasteryVector: ...
