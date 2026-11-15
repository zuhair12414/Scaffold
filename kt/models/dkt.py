"""Deep Knowledge Tracing (Piech et al., 2015) with an optional code-vector input (Code-DKT style).

Input at step t:  one-hot over (concept, correct) of size 2C, optionally concatenated with a code
vector z_t of size D. Output: P(correct) for every concept at step t+1.
"""
from __future__ import annotations

import torch
from torch import nn


class DKT(nn.Module):
    def __init__(self, n_concepts: int, hidden: int = 64, code_dim: int = 0, dropout: float = 0.2):
        super().__init__()
        self.n_concepts = n_concepts
        self.code_dim = code_dim
        self.interaction = nn.Embedding(2 * n_concepts, hidden)  # same as one-hot times a matrix
        self.lstm = nn.LSTM(hidden + code_dim, hidden, batch_first=True)
        self.drop = nn.Dropout(dropout)
        self.out = nn.Linear(hidden, n_concepts)

    def forward(self, concept: torch.Tensor, correct: torch.Tensor, code: torch.Tensor | None = None,
                state: tuple[torch.Tensor, torch.Tensor] | None = None):
        """concept, correct: (B, T) long. code: (B, T, D) or None. Returns (probs (B, T, C), (h, c))."""
        x = self.interaction(concept + self.n_concepts * correct)
        if self.code_dim:
            if code is None:
                raise ValueError("model was built with code_dim > 0 but no code vectors were given")
            x = torch.cat([x, code], dim=-1)
        h, state = self.lstm(x, state)
        return torch.sigmoid(self.out(self.drop(h))), state


def next_step_loss(probs: torch.Tensor, concept: torch.Tensor, correct: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
    """Binary cross-entropy of the prediction at step t against the real outcome at step t+1."""
    pred = probs[:, :-1].gather(-1, concept[:, 1:].unsqueeze(-1)).squeeze(-1)
    target = correct[:, 1:].float()
    m = mask[:, 1:].float()
    bce = nn.functional.binary_cross_entropy(pred.clamp(1e-6, 1 - 1e-6), target, reduction="none")
    return (bce * m).sum() / m.sum().clamp(min=1)
