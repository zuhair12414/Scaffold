import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Session(Base):
    """A ProgSnap2 session: the span between Session.Start and Session.End.

    tool_instances holds the ProgSnap2 ToolInstances string
    (e.g. "scaffold-ide@0.0.1") identifying the client version.
    """

    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    problem_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("problems.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    tool_instances: Mapped[str] = mapped_column(String(256), nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    student: Mapped["Student"] = relationship(back_populates="sessions")  # type: ignore[name-defined]  # noqa: F821
    problem: Mapped["Problem"] = relationship(back_populates="sessions")  # type: ignore[name-defined]  # noqa: F821
    events: Mapped[list["Event"]] = relationship(back_populates="session")  # type: ignore[name-defined]  # noqa: F821
    hint_requests: Mapped[list["HintRequest"]] = relationship(back_populates="session")  # type: ignore[name-defined]  # noqa: F821
