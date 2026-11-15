"""DKT input encoding (design 01 §1.2, §1.3 Fix B).

For M knowledge components:
    x_t = [ one-hot(2M) ; f_t ]
    one-hot slot k     = KC k answered correctly
    one-hot slot k + M = KC k answered incorrectly
    f_t                = telemetry features for that attempt (optional)
Sequences longer than MAX_SEQ_LEN are split into consecutive windows.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from .interfaces import Interaction

MAX_SEQ_LEN = 200  # truncation length from the design reference config


@dataclass(frozen=True)
class EncodedSequence:
    student_id: str
    kc: list[int]
    correct: list[int]
    interaction: list[int]  # one-hot position per step, in [0, 2M)
    features: list[tuple[float, ...]]


def interaction_index(kc_idx: int, correct: bool, n_kc: int) -> int:
    raise NotImplementedError("planned: see packages/kt/README.md")


def encode(seq: Sequence[Interaction], n_kc: int) -> EncodedSequence:
    raise NotImplementedError("planned: see packages/kt/README.md")


def windows(enc: EncodedSequence, max_len: int = MAX_SEQ_LEN) -> list[EncodedSequence]:
    raise NotImplementedError("planned: see packages/kt/README.md")
