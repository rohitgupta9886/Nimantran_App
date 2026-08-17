import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Any
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CampaignChannel(str, Enum):
    WHATSAPP = "WHATSAPP"
    SMS = "SMS"
    EMAIL = "EMAIL"


class CampaignStatus(str, Enum):
    DRAFT = "DRAFT"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class MessageDeliveryStatus(str, Enum):
    QUEUED = "QUEUED"
    SENDING = "SENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"
    RETRYING = "RETRYING"
    SKIPPED = "SKIPPED"
    INVALID_NUMBER = "INVALID_NUMBER"
    OPTED_OUT = "OPTED_OUT"


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    created_by: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    channel: Mapped[CampaignChannel] = mapped_column(SQLEnum(CampaignChannel), default=CampaignChannel.WHATSAPP, nullable=False)
    status: Mapped[CampaignStatus] = mapped_column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False)
    
    target_audience: Mapped[str] = mapped_column(String, default="ALL")  # ALL, UNSENT_ONLY, PENDING_RSVP, CONFIRMED, VIP
    channels_list: Mapped[Optional[list[str]]] = mapped_column(JSON, default=list)  # ["WHATSAPP", "SMS", "EMAIL"]
    message_body: Mapped[str] = mapped_column(Text, nullable=False)
    email_subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email_body_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    template_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    template_language: Mapped[str] = mapped_column(String, default="hi")
    idempotency_key: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    
    total_recipients: Mapped[int] = mapped_column(Integer, default=0)
    queued_count: Mapped[int] = mapped_column(Integer, default=0)
    sending_count: Mapped[int] = mapped_column(Integer, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    delivered_count: Mapped[int] = mapped_column(Integer, default=0)
    read_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    invalid_count: Mapped[int] = mapped_column(Integer, default=0)
    skipped_count: Mapped[int] = mapped_column(Integer, default=0)
    
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc), nullable=True
    )

    # Relationships
    messages: Mapped[list["BroadcastMessage"]] = relationship("BroadcastMessage", back_populates="campaign", cascade="all, delete-orphan")


BroadcastCampaign = Campaign


class BroadcastMessage(Base):
    __tablename__ = "broadcast_messages"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    campaign_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("campaigns.id"), nullable=True, index=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, index=True)
    guest_id: Mapped[str] = mapped_column(String, ForeignKey("guests.id"), nullable=False, index=True)
    
    channel: Mapped[CampaignChannel] = mapped_column(SQLEnum(CampaignChannel), default=CampaignChannel.WHATSAPP, nullable=False)
    recipient: Mapped[str] = mapped_column(String, nullable=False)  # raw phone or email
    normalized_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    
    template_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    personalized_payload: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    personalized_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email_subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email_body_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    invitation_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    
    status: Mapped[MessageDeliveryStatus] = mapped_column(SQLEnum(MessageDeliveryStatus), default=MessageDeliveryStatus.QUEUED, nullable=False, index=True)
    provider_message_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    queued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc), nullable=True
    )

    # Table constraints for database-level idempotency
    __table_args__ = (
        UniqueConstraint("campaign_id", "guest_id", "channel", name="uq_broadcast_campaign_guest_channel"),
    )

    # Relationships
    campaign: Mapped[Optional["Campaign"]] = relationship("Campaign", back_populates="messages")


# Keep MessageLog as alias for compatibility
MessageLog = BroadcastMessage


class WhatsAppWebhookEvent(Base):
    __tablename__ = "whatsapp_webhook_events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    provider_event_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)  # status, message, error
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

