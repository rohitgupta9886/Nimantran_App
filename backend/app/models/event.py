import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class EventType(str, Enum):
    WEDDING = "WEDDING"
    BIRTHDAY = "BIRTHDAY"
    MUNDAN = "MUNDAN"
    ENGAGEMENT = "ENGAGEMENT"
    SAGAI = "SAGAI"
    HALDI = "HALDI"
    MEHNDI = "MEHNDI"
    SANGEET = "SANGEET"
    RECEPTION = "RECEPTION"
    GRIHA_PRAVESH = "GRIHA_PRAVESH"
    PUJA = "PUJA"
    HAVAN = "HAVAN"
    KATHA = "KATHA"
    JAGRAN = "JAGRAN"
    ANNIVERSARY = "ANNIVERSARY"
    BABY_SHOWER = "BABY_SHOWER"
    NAAMKARAN = "NAAMKARAN"
    ANNAPRASHAN = "ANNAPRASHAN"
    FIRST_BIRTHDAY = "FIRST_BIRTHDAY"
    RETIREMENT = "RETIREMENT"
    RELIGIOUS = "RELIGIOUS"
    CORPORATE = "CORPORATE"
    CONFERENCE = "CONFERENCE"
    HOUSEWARMING = "HOUSEWARMING"
    REUNION = "REUNION"
    GRADUATION = "GRADUATION"
    CONVOCATION = "CONVOCATION"
    OTHER = "OTHER"


class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    UPCOMING = "UPCOMING"
    LIVE = "LIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String, default="WEDDING", nullable=False)
    status: Mapped[EventStatus] = mapped_column(SQLEnum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    
    host_name: Mapped[str] = mapped_column(String, nullable=False)
    co_host_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    venue_name: Mapped[str] = mapped_column(String, nullable=False)
    venue_address: Mapped[str] = mapped_column(Text, nullable=False)
    google_maps_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    cover_image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    background_music_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    upi_qr_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    upi_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    host_upi_mobile: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    accepts_digital_shagun: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    theme_config: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="events")
    functions: Mapped[List["EventFunction"]] = relationship("EventFunction", back_populates="event", cascade="all, delete-orphan")
    invitation: Mapped[Optional["Invitation"]] = relationship("Invitation", back_populates="event", uselist=False, cascade="all, delete-orphan")
    guests: Mapped[List["Guest"]] = relationship("Guest", back_populates="event", cascade="all, delete-orphan")


class EventFunction(Base):
    __tablename__ = "event_functions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)  # Haldi, Mehendi, Wedding, Reception
    date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    venue_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    google_maps_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    dress_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(default=0)

    event: Mapped["Event"] = relationship("Event", back_populates="functions")


class InvitationTemplate(Base):
    __tablename__ = "invitation_templates"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)  # Royal, Traditional, Modern, Minimal, Floral
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    style_config: Mapped[dict] = mapped_column(JSON, default=dict)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, unique=True)
    template_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("invitation_templates.id"), nullable=True)
    
    title_text: Mapped[str] = mapped_column(String, nullable=False)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String, default="HI_EN")  # HINDI, ENGLISH, HINGLISH
    
    custom_colors: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    custom_fonts: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    event: Mapped["Event"] = relationship("Event", back_populates="invitation")
