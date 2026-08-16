from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.guest import RSVPStatus, GuestCategory


class GuestCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    group_name: Optional[str] = "General"
    category: GuestCategory = GuestCategory.NORMAL
    adults_count: int = 1
    children_count: int = 0
    language: str = "HI"
    custom_welcome_quote: Optional[str] = None
    notes: Optional[str] = None
    save_to_master_list: bool = False


class GuestUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    category: Optional[GuestCategory] = None
    adults_count: Optional[int] = None
    children_count: Optional[int] = None
    rsvp_status: Optional[RSVPStatus] = None
    custom_welcome_quote: Optional[str] = None
    notes: Optional[str] = None


class GuestRead(BaseModel):
    id: str
    event_id: str
    group_id: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    category: GuestCategory
    adults_count: int
    children_count: int
    rsvp_status: RSVPStatus
    checked_in: bool
    checked_in_at: Optional[datetime] = None
    custom_welcome_quote: Optional[str] = None
    pass_code: Optional[str] = None

    class Config:
        from_attributes = True


class RSVPCreate(BaseModel):
    status: RSVPStatus
    adults_attending: int = 1
    children_attending: int = 0
    accommodation_required: bool = False
    transport_required: bool = False
    dietary_preference: Optional[str] = None
    wishes_note: Optional[str] = None
