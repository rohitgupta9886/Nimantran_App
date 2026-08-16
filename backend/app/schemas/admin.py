from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole
from app.schemas.auth import UserRead


class AdminUserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None
    role: UserRole = UserRole.FREE
    is_active: bool = True
    password: Optional[str] = None  # If none provided, a temporary password is generated


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class AdminRoleChangeRequest(BaseModel):
    role: UserRole


class AdminStatusChangeRequest(BaseModel):
    is_active: bool


class AdminUserDetail(UserRead):
    event_count: int = 0
    guest_count: int = 0
    wallet_balance: int = 0
    recent_events: List[Dict[str, Any]] = []


class AdminPaginatedUsers(BaseModel):
    items: List[UserRead]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminAuditLogRead(BaseModel):
    id: str
    user_id: Optional[str] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminPaginatedAuditLogs(BaseModel):
    items: List[AdminAuditLogRead]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminPlatformStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    pro_users: int
    free_users: int
    admin_users: int
    total_events: int
    total_invitations_shared: int
    total_rsvps: int
    system_health: str = "OPTIMAL"
    db_status: str = "CONNECTED"
    redis_status: str = "CONNECTED"
