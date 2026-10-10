import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Problem(Base):
    """A lab problem definition.

    slug is human-readable (e.g. "lab1-q2"). The reference solution lives in
    problems/ on disk — never in this table — so it never reaches the model.
    """

    __tablename__ = "problems"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    sessions: Mapped[list["Session"]] = relationship(back_populates="problem")  # type: ignore[name-defined]  # noqa: F821
