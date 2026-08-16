import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class VisibilityLevel(str, Enum):
    PRIVATE = "PRIVATE"
    GUESTS_ONLY = "GUESTS_ONLY"
    PUBLIC = "PUBLIC"


class GalleryAlbum(Base):
    __tablename__ = "gallery_albums"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)  # Haldi, Mehendi, Wedding, Reception, Guests
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    visibility: Mapped[VisibilityLevel] = mapped_column(SQLEnum(VisibilityLevel), default=VisibilityLevel.GUESTS_ONLY, nullable=False)
    order_index: Mapped[int] = mapped_column(default=0)


class GalleryItem(Base):
    __tablename__ = "gallery_items"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    album_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("gallery_albums.id"), nullable=True)
    
    media_url: Mapped[str] = mapped_column(String, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    media_type: Mapped[str] = mapped_column(String, default="IMAGE")  # IMAGE, VIDEO
    caption: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    uploaded_by_guest_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("guests.id"), nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
