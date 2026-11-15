"""Deep Knowledge Tracing (Piech et al., 2015), design 01 §1.2 and §1.3 Fix B.

Planned architecture:
    input   x_t = [one-hot(2M) ; f_t]
    LSTM    1 layer, hidden 128-200, dropout 0.2
    output  M sigmoids: P(correct) on every KC at step t+1
    loss    BCE masked to the KC attempted next, plus DKT+ reconstruction and waviness terms
            (Yeung & Yeung, 2018) so mastery does not dip after a correct answer or oscillate
Runtime state per student is the LSTM's (h, c); one attempt is one forward step.
PyTorch is added as a dependency when this is implemented.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from ..interfaces import Interaction, MasteryVector


@dataclass(frozen=True)
class DKTConfig:
    hidden: int = 128
    dropout: float = 0.2
    n_features: int = 0  # telemetry features per step; 0 = plain DKT
    lr: float = 1e-3
    batch_size: int = 32
    epochs: int = 20
    max_seq_len: int = 200
    lambda_r: float = 0.1  # DKT+ reconstruction
    lambda_w1: float = 0.003  # DKT+ waviness, L1
    lambda_w2: float = 3.0  # DKT+ waviness, L2


class DKT:
    """Implements interfaces.KnowledgeTracer."""

    def __init__(self, n_kc: int, config: DKTConfig | None = None) -> None:
        self.n_kc = n_kc
        self.config = config or DKTConfig()

    def fit(self, sequences: Mapping[str, Sequence[Interaction]]) -> None:
        raise NotImplementedError("planned: see packages/kt/README.md")

    def initial_state(self) -> object:
        raise NotImplementedError("planned: see packages/kt/README.md")

    def update(self, state: object, interaction: Interaction) -> object:
        raise NotImplementedError("planned: see packages/kt/README.md")

    def mastery(self, state: object) -> MasteryVector:
        raise NotImplementedError("planned: see packages/kt/README.md")
