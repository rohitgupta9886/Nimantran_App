import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PassStatus(str, Enum):
    VALID = "VALID"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
    USED = "USED"


class GuestEntryPass(Base):
    __tablename__ = "guest_entry_passes"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    guest_id: Mapped[str] = mapped_column(String, ForeignKey("guests.id"), nullable=False, unique=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    
    pass_code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)  # e.g. NIM-ENTRY-8F72A91
    token_hash: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[PassStatus] = mapped_column(SQLEnum(PassStatus), default=PassStatus.VALID, nullable=False)
    
    qr_image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    guest: Mapped["Guest"] = relationship("Guest", back_populates="entry_pass")


class Checkin(Base):
    __tablename__ = "checkins"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    guest_id: Mapped[str] = mapped_column(String, ForeignKey("guests.id"), nullable=False, index=True)
    scanned_by_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    location_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    check_in_method: Mapped[Optional[str]] = mapped_column(String, default="QR_SCAN", nullable=True)
