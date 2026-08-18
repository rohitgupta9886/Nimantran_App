from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.models.guest import RSVPStatus, GuestCategory


class GuestCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = "Guest"
    group_name: Optional[str] = "General"
    category: GuestCategory = GuestCategory.NORMAL
    adults_count: int = 1
    children_count: int = 0
    language: str = "AUTO"  # HI, EN, HINGLISH, AUTO
    custom_welcome_quote: Optional[str] = None
    notes: Optional[str] = None
    save_to_master_list: bool = False
    allow_duplicate: bool = False


class GuestUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    group_name: Optional[str] = None
    category: Optional[GuestCategory] = None
    adults_count: Optional[int] = None
    children_count: Optional[int] = None
    language: Optional[str] = None
    rsvp_status: Optional[RSVPStatus] = None
    custom_welcome_quote: Optional[str] = None
    notes: Optional[str] = None


class GuestRead(BaseModel):
    id: str
    event_id: str
    group_id: Optional[str] = None
    group_name: Optional[str] = "General"
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    category: GuestCategory = GuestCategory.NORMAL
    adults_count: int = 1
    children_count: int = 0
    language: str = "AUTO"
    rsvp_status: RSVPStatus = RSVPStatus.PENDING
    checked_in: bool = False
    checked_in_at: Optional[datetime] = None
    delivery_status: str = "SENT"
    open_count: int = 0
    invitation_token: Optional[str] = None
    custom_welcome_quote: Optional[str] = None
    pass_code: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DuplicateCheckRequest(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    exclude_guest_id: Optional[str] = None


class DuplicateCheckResponse(BaseModel):
    has_duplicate: bool
    duplicate_type: Optional[str] = None  # EXACT_PHONE, EXACT_EMAIL, SIMILAR_NAME, NONE
    confidence_score: float = 0.0
    matched_guest: Optional[GuestRead] = None
    warning_message: Optional[str] = None


class GuestMergeRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    group_name: Optional[str] = None
    adults_count: Optional[int] = None
    children_count: Optional[int] = None
    language: Optional[str] = None
    notes: Optional[str] = None


class ImportItemCandidate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    group_name: Optional[str] = "General"
    relationship: Optional[str] = "Guest"
    adults_count: int = 1
    children_count: int = 0
    language: str = "AUTO"
    notes: Optional[str] = None


class ImportItemValidation(BaseModel):
    raw: ImportItemCandidate
    is_valid: bool
    is_duplicate: bool
    duplicate_type: Optional[str] = None
    matched_existing_guest_id: Optional[str] = None
    matched_existing_name: Optional[str] = None
    normalized_phone: Optional[str] = None
    error_reason: Optional[str] = None


class ImportPreviewResponse(BaseModel):
    total_parsed: int
    valid_count: int
    duplicates_count: int
    invalid_count: int
    valid_items: List[ImportItemValidation]
    duplicate_items: List[ImportItemValidation]
    invalid_items: List[ImportItemValidation]


class ImportConfirmRequest(BaseModel):
    items: List[ImportItemCandidate]
    on_duplicate: str = "SKIP"  # SKIP, MERGE, KEEP_SEPARATE
    save_to_master_list: bool = False


class RSVPCreate(BaseModel):
    status: RSVPStatus
    adults_attending: int = 1
    children_attending: int = 0
    accommodation_required: bool = False
    transport_required: bool = False
    dietary_preference: Optional[str] = None
    wishes_note: Optional[str] = None
