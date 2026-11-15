"""Student-grouped splits (design 01 §1.2, "Splitting").

Never split by interaction: the same learner in train and test inflates AUC. Both functions will
assign whole students to one side.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import TypeVar

T = TypeVar("T")


def train_test_split(seqs: Mapping[str, T], test_frac: float = 0.2, seed: int = 42) -> tuple[dict[str, T], dict[str, T]]:
    raise NotImplementedError("planned: see packages/kt/README.md")


def group_k_fold(seqs: Mapping[str, T], k: int = 5, seed: int = 42) -> list[tuple[dict[str, T], dict[str, T]]]:
    raise NotImplementedError("planned: see packages/kt/README.md")
