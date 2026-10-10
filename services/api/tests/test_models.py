"""Tests for all six ORM models against a temporary SQLite database."""

import uuid

from app.models import CodeState, Event, HintRequest, Problem, Session, Student
from app.models.hint_request import ACTION_DELIVERED, ACTION_REGENERATED


# ── Student ────────────────────────────────────────────────────────────────

def test_student_created(db):
    s = Student(subject_id="anon-42")
    db.add(s)
    db.commit()
    db.refresh(s)
    assert s.id is not None
    assert s.subject_id == "anon-42"
    assert s.created_at is not None


def test_student_subject_id_unique(db):
    import pytest
    from sqlalchemy.exc import IntegrityError

    db.add(Student(subject_id="dup-subject"))
    db.commit()
    db.add(Student(subject_id="dup-subject"))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


# ── Problem ────────────────────────────────────────────────────────────────

def test_problem_created(db):
    p = Problem(slug="lab2-q1", title="Linked list insert")
    db.add(p)
    db.commit()
    db.refresh(p)
    assert p.id is not None
    assert p.slug == "lab2-q1"


def test_problem_slug_unique(db):
    import pytest
    from sqlalchemy.exc import IntegrityError

    db.add(Problem(slug="dup-slug", title="A"))
    db.commit()
    db.add(Problem(slug="dup-slug", title="B"))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


# ── Session ────────────────────────────────────────────────────────────────

def test_session_created(db, student, problem):
    s = Session(
        student_id=student.id,
        problem_id=problem.id,
        tool_instances="scaffold-ide@0.0.1",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    assert s.id is not None
    assert s.ended_at is None


def test_session_end_recorded(db, session_obj):
    from datetime import datetime, timezone

    session_obj.ended_at = datetime.now(tz=timezone.utc)
    db.commit()
    db.refresh(session_obj)
    assert session_obj.ended_at is not None


# ── CodeState ──────────────────────────────────────────────────────────────

def test_code_state_deduplication(db):
    sha = "a" * 40
    cs1 = CodeState(sha1=sha, content="int main(){}")
    db.add(cs1)
    db.commit()

    # Inserting the same sha1 again must raise a PK violation
    import pytest
    from sqlalchemy.exc import IntegrityError

    db.add(CodeState(sha1=sha, content="int main(){}"))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_code_state_default_language(db):
    cs = CodeState(sha1="b" * 40, content="// hello")
    db.add(cs)
    db.commit()
    db.refresh(cs)
    assert cs.language == "cpp"


# ── Event ──────────────────────────────────────────────────────────────────

def test_event_minimal(db, session_obj):
    ev = Event(
        order=1,
        subject_id=session_obj.student.subject_id,
        tool_instances="scaffold-ide@0.0.1",
        event_type="File.Edit",
        session_id=session_obj.id,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    assert ev.event_id is not None
    assert ev.ts is not None


def test_event_x_columns_nullable(db, session_obj):
    ev = Event(
        order=2,
        subject_id=session_obj.student.subject_id,
        tool_instances="scaffold-ide@0.0.1",
        event_type="Compile",
        session_id=session_obj.id,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    assert ev.x_paste_chars is None
    assert ev.x_hint_blocked is None


def test_event_x_paste_columns(db, session_obj):
    ev = Event(
        order=3,
        subject_id=session_obj.student.subject_id,
        tool_instances="scaffold-ide@0.0.1",
        event_type="File.Edit",
        session_id=session_obj.id,
        x_paste_chars=120,
        x_paste_lines=5,
        x_paste_sha1="c" * 40,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    assert ev.x_paste_chars == 120
    assert ev.x_paste_lines == 5


def test_event_with_code_state(db, session_obj):
    sha = "d" * 40
    db.add(CodeState(sha1=sha, content="struct Node{};"))
    db.commit()

    ev = Event(
        order=4,
        subject_id=session_obj.student.subject_id,
        tool_instances="scaffold-ide@0.0.1",
        event_type="Compile",
        session_id=session_obj.id,
        code_state_id=sha,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    assert ev.code_state_id == sha


# ── HintRequest ────────────────────────────────────────────────────────────

def test_hint_request_delivered(db, session_obj):
    hr = HintRequest(
        session_id=session_obj.id,
        level_requested=2,
        level_delivered=2,
        leakage_score=0.05,
        action_taken=ACTION_DELIVERED,
        fallback_used=False,
        model="llama3.2:3b",
        latency_ms=312,
    )
    db.add(hr)
    db.commit()
    db.refresh(hr)
    assert hr.id is not None
    assert hr.fallback_used is False
    assert hr.action_taken == "delivered"


def test_hint_request_fallback(db, session_obj):
    hr = HintRequest(
        session_id=session_obj.id,
        level_requested=3,
        level_delivered=2,   # one level lower after guardrail blocked
        leakage_score=0.72,
        action_taken=ACTION_REGENERATED,
        fallback_used=True,
        model="llama3.2:3b",
        latency_ms=889,
    )
    db.add(hr)
    db.commit()
    db.refresh(hr)
    assert hr.fallback_used is True
    assert hr.level_delivered == hr.level_requested - 1
