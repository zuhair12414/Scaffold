import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Event(Base):
    """ProgSnap2 MainTable — one row per telemetry event.

    Required ProgSnap2 columns: EventID, Order, SubjectID, ToolInstances,
    CodeStateID, EventType.  Custom X- columns are stored individually for
    queryability; all are nullable because most events only populate a subset.

    ts is the server-assigned receive time and is the TimescaleDB hypertable
    partition key.  client_ts is what the browser reported (used for skew
    estimation per §2.3 of the design doc).
    """

    __tablename__ = "events"

    # ── ProgSnap2 required ──────────────────────────────────────────────────
    event_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order: Mapped[int] = mapped_column(BigInteger, nullable=False)
    subject_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    tool_instances: Mapped[str] = mapped_column(String(256), nullable=False)
    code_state_id: Mapped[str | None] = mapped_column(
        ForeignKey("code_states.sha1", ondelete="SET NULL"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # ── Timestamps ─────────────────────────────────────────────────────────
    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    client_ts: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Foreign keys ───────────────────────────────────────────────────────
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # ── X- extension columns (ProgSnap2 §4) ────────────────────────────────
    x_paste_chars: Mapped[int | None] = mapped_column(Integer, nullable=True)
    x_paste_lines: Mapped[int | None] = mapped_column(Integer, nullable=True)
    x_paste_sha1: Mapped[str | None] = mapped_column(String(40), nullable=True)

    x_blur_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    x_idle_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    x_revert_to_code_state_id: Mapped[str | None] = mapped_column(String(40), nullable=True)

    x_keystroke_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    x_keystroke_iki_entropy: Mapped[float | None] = mapped_column(Float, nullable=True)

    # JSON-encoded list of KC identifiers, e.g. '["recursion","base-case"]'
    x_kc_ids: Mapped[str | None] = mapped_column(String(512), nullable=True)

    x_hint_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    x_hint_blocked: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # ── Relationships ───────────────────────────────────────────────────────
    session: Mapped["Session"] = relationship(back_populates="events")  # type: ignore[name-defined]  # noqa: F821
