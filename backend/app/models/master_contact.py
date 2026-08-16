import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship as sa_relationship
from app.core.database import Base


class MasterContact(Base):
    __tablename__ = "master_contacts"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    group_name: Mapped[Optional[str]] = mapped_column(String, default="General", nullable=True)  # Family, Relatives, Friends, VIP, Colleagues
    relationship: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Groom's Friend, Cousin, etc.
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    source: Mapped[str] = mapped_column(String, default="MANUAL", nullable=False)  # MANUAL, MOBILE_SYNC, CSV_IMPORT

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = sa_relationship("User", back_populates="master_contacts")
