import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class TransactionType(str, Enum):
    PURCHASE = "PURCHASE"
    GRANT = "GRANT"
    SUBSCRIPTION_BONUS = "SUBSCRIPTION_BONUS"
    CONSUMPTION = "CONSUMPTION"
    REFUND = "REFUND"
    PROMOTION = "PROMOTION"
    ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT"
    EXPIRY = "EXPIRY"


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)  # FREE, PLUS, PRO, EVENT_PASS
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    price_inr: Mapped[float] = mapped_column(Float, default=0.0)
    billing_period: Mapped[str] = mapped_column(String, default="ONCE")  # MONTHLY, ANNUAL, ONCE
    
    max_events: Mapped[int] = mapped_column(Integer, default=1)
    max_guests_per_event: Mapped[int] = mapped_column(Integer, default=100)
    included_ai_credits: Mapped[int] = mapped_column(Integer, default=50)
    features_config: Mapped[dict] = mapped_column(JSON, default=dict)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, unique=True)
    plan_id: Mapped[str] = mapped_column(String, ForeignKey("plans.id"), nullable=False)
    
    status: Mapped[str] = mapped_column(String, default="ACTIVE")  # ACTIVE, CANCELLED, EXPIRED
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    user: Mapped["User"] = relationship("User", back_populates="subscription")


class CreditWallet(Base):
    __tablename__ = "credit_wallets"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, unique=True)
    balance: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="credit_wallet")


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    wallet_id: Mapped[str] = mapped_column(String, ForeignKey("credit_wallets.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # positive for grant/purchase, negative for consumption
    transaction_type: Mapped[TransactionType] = mapped_column(SQLEnum(TransactionType), nullable=False)
    
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    reference_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # AI usage ID, Payment ID
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class AIUsage(Base):
    __tablename__ = "ai_usage"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    event_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("events.id"), nullable=True, index=True)
    
    operation_type: Mapped[str] = mapped_column(String, nullable=False)  # INVITATION_TEXT, STORY, WELCOME_QUOTE, REEL
    provider_name: Mapped[str] = mapped_column(String, default="MOCK")
    model_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    credits_deducted: Mapped[int] = mapped_column(Integer, nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    
    status: Mapped[str] = mapped_column(String, default="SUCCESS")  # SUCCESS, FAILED, REFUNDED
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
