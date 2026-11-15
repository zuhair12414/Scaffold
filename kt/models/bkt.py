"""Bayesian Knowledge Tracing, one model per concept, fitted by grid search on log-likelihood.

Matches the update in src/student/BKTStudentModel.ts so fitted parameters can be exported to the IDE.
"""
from __future__ import annotations

import itertools
import math
from dataclasses import dataclass


@dataclass
class BKTParams:
    p_init: float = 0.3
    p_learn: float = 0.1
    p_slip: float = 0.1
    p_guess: float = 0.2


def predict_correct(L: float, p: BKTParams) -> float:
    return L * (1 - p.p_slip) + (1 - L) * p.p_guess


def update(L: float, correct: bool, p: BKTParams) -> float:
    if correct:
        post = L * (1 - p.p_slip) / (L * (1 - p.p_slip) + (1 - L) * p.p_guess)
    else:
        post = L * p.p_slip / (L * p.p_slip + (1 - L) * (1 - p.p_guess))
    return post + (1 - post) * p.p_learn


def trace(outcomes: list[bool], p: BKTParams) -> list[float]:
    """P(correct) predicted before each attempt."""
    L, preds = p.p_init, []
    for y in outcomes:
        preds.append(predict_correct(L, p))
        L = update(L, y, p)
    return preds


def log_likelihood(sequences: list[list[bool]], p: BKTParams) -> float:
    ll = 0.0
    for seq in sequences:
        for y, q in zip(seq, trace(seq, p)):
            q = min(max(q, 1e-6), 1 - 1e-6)
            ll += math.log(q if y else 1 - q)
    return ll


def fit(sequences: list[list[bool]], steps: int = 9) -> BKTParams:
    """Coarse grid search. Slip and guess are capped at 0.3 to keep the model identifiable."""
    grid = [i / (steps + 1) for i in range(1, steps + 1)]
    small = [g for g in grid if g <= 0.3]
    best, best_ll = BKTParams(), -math.inf
    for pi, pl, ps, pg in itertools.product(grid, small, small, small):
        cand = BKTParams(pi, pl, ps, pg)
        ll = log_likelihood(sequences, cand)
        if ll > best_ll:
            best, best_ll = cand, ll
    return best
