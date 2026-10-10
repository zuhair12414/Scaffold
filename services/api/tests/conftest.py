"""Shared pytest fixtures.

Tests run against an in-memory SQLite database so no live Postgres is required.
Tables are created directly from the ORM metadata (skipping Alembic and the
TimescaleDB hypertable call, which is PostgreSQL-only).
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import get_db
from app.main import app
from app.models import Base, Problem, Session, Student

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    SessionFactory = sessionmaker(bind=engine)
    session = SessionFactory()
    yield session
    session.rollback()
    session.close()


@pytest.fixture
def client(engine):
    SessionFactory = sessionmaker(bind=engine)

    def override_get_db():
        session = SessionFactory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Reusable object factories ──────────────────────────────────────────────

@pytest.fixture
def student(db):
    s = Student(subject_id=f"test-student-{uuid.uuid4().hex[:8]}")
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@pytest.fixture
def problem(db):
    p = Problem(slug=f"lab1-q{uuid.uuid4().hex[:4]}", title="Test Problem")
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture
def session_obj(db, student, problem):
    s = Session(
        student_id=student.id,
        problem_id=problem.id,
        tool_instances="scaffold-ide@0.0.1",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
