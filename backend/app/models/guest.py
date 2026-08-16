import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship as sa_relationship
from app.core.database import Base


class RSVPStatus(str, Enum):
    PENDING = "PENDING"
    YES = "YES"
    NO = "NO"
    MAYBE = "MAYBE"


class GuestCategory(str, Enum):
    NORMAL = "NORMAL"
    FAMILY = "FAMILY"
    VIP = "VIP"
    SPECIAL = "SPECIAL"


class GuestGroup(Base):
    __tablename__ = "guest_groups"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)  # Family, Relatives, Friends, Colleagues, VIP


class Guest(Base):
    __tablename__ = "guests"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    group_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("guest_groups.id"), nullable=True)
    master_contact_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("master_contacts.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    relationship: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Groom's Friend, Uncle, etc.
    language: Mapped[str] = mapped_column(String, default="HI")
    
    category: Mapped[GuestCategory] = mapped_column(SQLEnum(GuestCategory), default=GuestCategory.NORMAL, nullable=False)
    
    adults_count: Mapped[int] = mapped_column(Integer, default=1)
    children_count: Mapped[int] = mapped_column(Integer, default=0)
    
    rsvp_status: Mapped[RSVPStatus] = mapped_column(SQLEnum(RSVPStatus), default=RSVPStatus.PENDING, nullable=False)
    checked_in: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    photo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    custom_welcome_quote: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Signature Digital Invitation Token & Delivery Tracking
    invitation_token: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    delivery_status: Mapped[str] = mapped_column(String, default="SENT")  # QUEUED, SENT, DELIVERED, READ, FAILED
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    first_opened_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_opened_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    open_count: Mapped[int] = mapped_column(Integer, default=0)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    event: Mapped["Event"] = sa_relationship("Event", back_populates="guests")
    entry_pass: Mapped[Optional["GuestEntryPass"]] = sa_relationship("GuestEntryPass", back_populates="guest", uselist=False, cascade="all, delete-orphan")
    rsvp: Mapped[Optional["RSVP"]] = sa_relationship("RSVP", back_populates="guest", uselist=False, cascade="all, delete-orphan")


class RSVP(Base):
    __tablename__ = "rsvps"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    guest_id: Mapped[str] = mapped_column(String, ForeignKey("guests.id"), nullable=False, unique=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    
    status: Mapped[RSVPStatus] = mapped_column(SQLEnum(RSVPStatus), nullable=False)
    adults_attending: Mapped[int] = mapped_column(Integer, default=1)
    children_attending: Mapped[int] = mapped_column(Integer, default=0)
    
    accommodation_required: Mapped[bool] = mapped_column(Boolean, default=False)
    transport_required: Mapped[bool] = mapped_column(Boolean, default=False)
    dietary_preference: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    wishes_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    guest: Mapped["Guest"] = sa_relationship("Guest", back_populates="rsvp")

