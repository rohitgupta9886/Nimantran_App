import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class WelcomeMessage(Base):
    __tablename__ = "welcome_messages"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    guest_id: Mapped[str] = mapped_column(String, ForeignKey("guests.id"), nullable=False, index=True)
    
    guest_name: Mapped[str] = mapped_column(String, nullable=False)
    relationship: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    welcome_quote: Mapped[str] = mapped_column(Text, nullable=False)
    photo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_vip: Mapped[bool] = mapped_column(Boolean, default=False)
    
    displayed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class WelcomeScreenSession(Base):
    __tablename__ = "welcome_screen_sessions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    session_token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_ping: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
