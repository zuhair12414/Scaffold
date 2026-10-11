from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class CodeState(Base):
    """Content-addressed code snapshot.

    sha1 is the primary key — identical submissions from different students
    map to the same row, which deduplicates the stored snapshots.
    Snapshots are written on compile, submit, and every Nth edit.
    """

    __tablename__ = "code_states"

    sha1: Mapped[str] = mapped_column(String(40), primary_key=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(32), nullable=False, server_default="cpp")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
