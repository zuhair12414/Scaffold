"""BKT baseline (design 01 §1.1), the model DKT has to beat on held-out students.

Planned: one 4-parameter model per KC (prior, learn, guess, slip), fitted by grid search with the
Baker/Corbett bound P(G) <= 0.30, P(S) <= 0.10, and an optional per-attempt guess
P(G | f_t) = sigmoid(beta_0 + beta . f_t) for the telemetry-conditioned variant (§1.3 Fix A).
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from ..interfaces import Interaction, MasteryVector

MAX_GUESS = 0.30
MAX_SLIP = 0.10


@dataclass(frozen=True)
class BKTParams:
    prior: float = 0.3
    learn: float = 0.1
    guess: float = 0.2
    slip: float = 0.1


class BKT:
    """Implements interfaces.KnowledgeTracer."""

    def __init__(self) -> None:
        self.params: dict[str, BKTParams] = {}

    def fit(self, sequences: Mapping[str, Sequence[Interaction]]) -> None:
        raise NotImplementedError("planned: see packages/kt/README.md")

    def initial_state(self) -> MasteryVector:
        raise NotImplementedError("planned: see packages/kt/README.md")

    def update(self, state: MasteryVector, interaction: Interaction) -> MasteryVector:
        raise NotImplementedError("planned: see packages/kt/README.md")

    def mastery(self, state: MasteryVector) -> MasteryVector:
        raise NotImplementedError("planned: see packages/kt/README.md")
