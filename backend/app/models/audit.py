import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True, index=True)
    actor_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    actor_role: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False, index=True)  # USER_LOGIN, USER_CREATE, USER_UPDATE, ROLE_CHANGE, STATUS_CHANGE, USER_DELETE, PASSWORD_CHANGE
    target_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # USER, EVENT, SYSTEM
    target_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    flag_key: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)  # AI_STORY, AI_REEL, SHAGUN
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
