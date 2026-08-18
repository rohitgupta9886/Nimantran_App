import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ModerationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CelebrationWish(Base):
    __tablename__ = "celebration_wishes"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    guest_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("guests.id"), nullable=True, index=True)
    
    sender_name: Mapped[str] = mapped_column(String, nullable=False, default="Well Wisher")
    relationship: Mapped[str] = mapped_column(String, nullable=False, default="Guest")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    status: Mapped[ModerationStatus] = mapped_column(
        SQLEnum(ModerationStatus), default=ModerationStatus.PENDING, nullable=False, index=True
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    moderated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    moderated_by_user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
