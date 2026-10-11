"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-10-11
"""

from __future__ import annotations

import uuid

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── students ────────────────────────────────────────────────────────────
    op.create_table(
        "students",
        sa.Column("id", sa.Uuid(), primary_key=True, default=uuid.uuid4),
        sa.Column("subject_id", sa.String(128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("subject_id", name="uq_students_subject_id"),
    )
    op.create_index("ix_students_subject_id", "students", ["subject_id"])

    # ── problems ────────────────────────────────────────────────────────────
    op.create_table(
        "problems",
        sa.Column("id", sa.Uuid(), primary_key=True, default=uuid.uuid4),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_problems_slug"),
    )
    op.create_index("ix_problems_slug", "problems", ["slug"])

    # ── code_states ─────────────────────────────────────────────────────────
    op.create_table(
        "code_states",
        sa.Column("sha1", sa.String(40), primary_key=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("language", sa.String(32), nullable=False, server_default="cpp"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── sessions ────────────────────────────────────────────────────────────
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), primary_key=True, default=uuid.uuid4),
        sa.Column("student_id", sa.Uuid(), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False),
        sa.Column("problem_id", sa.Uuid(), sa.ForeignKey("problems.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("tool_instances", sa.String(256), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sessions_student_id", "sessions", ["student_id"])
    op.create_index("ix_sessions_problem_id", "sessions", ["problem_id"])

    # ── events (ProgSnap2 MainTable) ─────────────────────────────────────────
    op.create_table(
        "events",
        sa.Column("event_id", sa.Uuid(), primary_key=True, default=uuid.uuid4),
        sa.Column("order", sa.BigInteger(), nullable=False),
        sa.Column("subject_id", sa.String(128), nullable=False),
        sa.Column("tool_instances", sa.String(256), nullable=False),
        sa.Column("code_state_id", sa.String(40), sa.ForeignKey("code_states.sha1", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("ts", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("client_ts", sa.DateTime(timezone=True), nullable=True),
        sa.Column("session_id", sa.Uuid(), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        # X- extension columns
        sa.Column("x_paste_chars", sa.Integer(), nullable=True),
        sa.Column("x_paste_lines", sa.Integer(), nullable=True),
        sa.Column("x_paste_sha1", sa.String(40), nullable=True),
        sa.Column("x_blur_duration_ms", sa.Integer(), nullable=True),
        sa.Column("x_idle_ms", sa.Integer(), nullable=True),
        sa.Column("x_revert_to_code_state_id", sa.String(40), nullable=True),
        sa.Column("x_keystroke_count", sa.Integer(), nullable=True),
        sa.Column("x_keystroke_iki_entropy", sa.Float(), nullable=True),
        sa.Column("x_kc_ids", sa.String(512), nullable=True),
        sa.Column("x_hint_level", sa.Integer(), nullable=True),
        sa.Column("x_hint_blocked", sa.Boolean(), nullable=True),
    )
    op.create_index("ix_events_subject_id", "events", ["subject_id"])
    op.create_index("ix_events_event_type", "events", ["event_type"])
    op.create_index("ix_events_session_id", "events", ["session_id"])
    op.create_index("ix_events_ts", "events", ["ts"])

    # Make events a TimescaleDB hypertable partitioned by ts.
    # This is a no-op (with a log warning) on plain Postgres or SQLite.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        try:
            bind.execute(sa.text("SELECT create_hypertable('events', 'ts', if_not_exists => TRUE)"))
        except Exception as exc:  # noqa: BLE001
            import warnings
            warnings.warn(f"create_hypertable skipped (TimescaleDB not installed?): {exc}")

    # ── hint_requests ───────────────────────────────────────────────────────
    op.create_table(
        "hint_requests",
        sa.Column("id", sa.Uuid(), primary_key=True, default=uuid.uuid4),
        sa.Column("session_id", sa.Uuid(), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_id", sa.Uuid(), sa.ForeignKey("events.event_id", ondelete="SET NULL"), nullable=True),
        sa.Column("level_requested", sa.Integer(), nullable=False),
        sa.Column("level_delivered", sa.Integer(), nullable=False),
        sa.Column("leakage_score", sa.Float(), nullable=False),
        sa.Column("action_taken", sa.String(32), nullable=False),
        sa.Column("fallback_used", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("model", sa.String(128), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hint_requests_session_id", "hint_requests", ["session_id"])


def downgrade() -> None:
    op.drop_table("hint_requests")
    op.drop_table("events")
    op.drop_table("sessions")
    op.drop_table("code_states")
    op.drop_table("problems")
    op.drop_table("students")
