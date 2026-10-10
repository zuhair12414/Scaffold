import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

# Valid values for action_taken
ACTION_DELIVERED = "delivered"
ACTION_REGENERATED = "regenerated"   # blocked; re-ran one level lower
ACTION_REFUSED = "refused"           # should never happen — see CLAUDE.md rule 3


class HintRequest(Base):
    """One row per hint requested by the student.

    Records the full disclosure audit trail: what level was requested by the
    policy, what was actually delivered, the guardrail leakage score, and whether
    a fallback (regeneration at a lower level) was triggered.

    A bare refusal (action_taken = 'refused') violates rule 3 in CLAUDE.md;
    the field exists so violations are observable, not silently swallowed.
    """

    __tablename__ = "hint_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("events.event_id", ondelete="SET NULL"), nullable=True
    )

    # ── Disclosure audit ───────────────────────────────────────────────────
    level_requested: Mapped[int] = mapped_column(Integer, nullable=False)
    level_delivered: Mapped[int] = mapped_column(Integer, nullable=False)
    leakage_score: Mapped[float] = mapped_column(Float, nullable=False)
    action_taken: Mapped[str] = mapped_column(String(32), nullable=False, default=ACTION_DELIVERED)
    fallback_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── Inference metadata ─────────────────────────────────────────────────
    model: Mapped[str] = mapped_column(String(128), nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session: Mapped["Session"] = relationship(back_populates="hint_requests")  # type: ignore[name-defined]  # noqa: F821
