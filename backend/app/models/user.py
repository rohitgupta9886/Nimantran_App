import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SUPER = "SUPER"
    PRO = "PRO"
    FREE = "FREE"
    HOST = "HOST"
    FAMILY_MEMBER = "FAMILY_MEMBER"
    STAFF = "STAFF"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole), default=UserRole.FREE, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    events: Mapped[List["Event"]] = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    master_contacts: Mapped[List["MasterContact"]] = relationship("MasterContact", back_populates="user", cascade="all, delete-orphan")
    credit_wallet: Mapped[Optional["CreditWallet"]] = relationship("CreditWallet", back_populates="user", uselist=False)
    subscription: Mapped[Optional["Subscription"]] = relationship("Subscription", back_populates="user", uselist=False)


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    owner_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class MemberRole(str, Enum):
    OWNER = "OWNER"
    FAMILY_ADMIN = "FAMILY_ADMIN"
    EDITOR = "EDITOR"
    GUEST_MANAGER = "GUEST_MANAGER"
    SCANNER = "SCANNER"
    VIEWER = "VIEWER"


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    organization_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    role: Mapped[MemberRole] = mapped_column(SQLEnum(MemberRole), default=MemberRole.EDITOR, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
