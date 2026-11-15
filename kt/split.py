"""Split sequences by student. Never split one student's attempts across train and test."""
from __future__ import annotations

import random
from typing import TypeVar

T = TypeVar("T")


def split_by_student(seqs: dict[str, list[T]], test_frac: float = 0.2, seed: int = 0) -> tuple[dict[str, list[T]], dict[str, list[T]]]:
    ids = sorted(seqs)
    random.Random(seed).shuffle(ids)
    cut = int(len(ids) * (1 - test_frac))
    return {i: seqs[i] for i in ids[:cut]}, {i: seqs[i] for i in ids[cut:]}
