"""The package imports cleanly, the KC registry matches the frontend, and planned pieces are
explicit stubs rather than silent no-ops."""
import pytest

from scaffold_kt import encoding, evaluate, split
from scaffold_kt.components import KNOWLEDGE_COMPONENTS, N_KC
from scaffold_kt.data import progsnap2
from scaffold_kt.interfaces import Interaction
from scaffold_kt.models.bkt import BKT, MAX_GUESS, MAX_SLIP
from scaffold_kt.models.dkt import DKT, DKTConfig


def test_eight_unique_knowledge_components():
    assert N_KC == 8
    assert len(set(KNOWLEDGE_COMPONENTS)) == 8


def test_design_constants():
    assert (MAX_GUESS, MAX_SLIP) == (0.30, 0.10)
    cfg = DKTConfig()
    assert 128 <= cfg.hidden <= 200 and cfg.dropout == 0.2 and cfg.max_seq_len == 200


@pytest.mark.parametrize(
    "call",
    [
        lambda: progsnap2.load_interactions("MainTable.csv", {}),
        lambda: encoding.interaction_index(0, True, N_KC),
        lambda: split.train_test_split({}),
        lambda: evaluate.score([], []),
        lambda: BKT().fit({}),
        lambda: DKT(N_KC).update(None, Interaction("s", "p", KNOWLEDGE_COMPONENTS[0], True, 0.0)),
    ],
)
def test_planned_functions_are_explicit_stubs(call):
    with pytest.raises(NotImplementedError):
        call()
