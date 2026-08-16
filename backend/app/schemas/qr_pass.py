from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.qr_pass import PassStatus


class EntryPassRead(BaseModel):
    id: str
    guest_id: str
    event_id: str
    pass_code: str
    status: PassStatus
    guest_name: str
    relationship: Optional[str] = None
    adults_count: int
    children_count: int
    checked_in: bool

    class Config:
        from_attributes = True


class ScanVerifyRequest(BaseModel):
    pass_code: str
    location_name: Optional[str] = "Main Entrance Gate"
    check_in_method: Optional[str] = "QR_SCAN"
    event_id: Optional[str] = None


class CheckinResponse(BaseModel):
    success: bool
    message: str
    event_id: Optional[str] = None
    event_title: Optional[str] = None
    guest_name: str
    pass_code: Optional[str] = None
    relationship: Optional[str] = None
    adults_count: int
    children_count: int
    already_checked_in: bool
    checked_in_at: datetime
    check_in_method: Optional[str] = "QR_SCAN"
    welcome_quote: str

