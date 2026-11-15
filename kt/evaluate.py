"""Score next-attempt predictions. Always run on held-out students (see split.py)."""
from __future__ import annotations

from sklearn.metrics import accuracy_score, roc_auc_score


def score(y_true: list[int], y_prob: list[float]) -> dict[str, float]:
    return {
        "auc": float(roc_auc_score(y_true, y_prob)) if len(set(y_true)) > 1 else float("nan"),
        "accuracy": float(accuracy_score(y_true, [p >= 0.5 for p in y_prob])),
        "n": len(y_true),
    }
