from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.event import EventType, EventStatus


class EventFunctionCreate(BaseModel):
    name: str
    date_time: datetime
    venue_name: Optional[str] = None
    address: Optional[str] = None
    google_maps_url: Optional[str] = None
    dress_code: Optional[str] = None
    description: Optional[str] = None
    order_index: int = 0


class EventFunctionRead(EventFunctionCreate):
    id: str

    class Config:
        from_attributes = True


class InvitationCreate(BaseModel):
    title_text: str
    message_text: str
    template_id: Optional[str] = None
    language: str = "HI_EN"
    custom_colors: Optional[dict] = None
    custom_fonts: Optional[dict] = None


class InvitationRead(InvitationCreate):
    id: str

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    event_type: str = "WEDDING"
    host_name: str
    co_host_name: Optional[str] = None
    contact_phone: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    venue_name: str
    venue_address: str
    google_maps_url: Optional[str] = None
    description: Optional[str] = None
    upi_id: Optional[str] = None
    host_upi_mobile: Optional[str] = None
    upi_qr_url: Optional[str] = None
    accepts_digital_shagun: bool = False
    theme_config: Optional[dict] = None
    functions: Optional[List[EventFunctionCreate]] = []
    invitation: Optional[InvitationCreate] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    host_name: Optional[str] = None
    co_host_name: Optional[str] = None
    contact_phone: Optional[str] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    google_maps_url: Optional[str] = None
    description: Optional[str] = None
    upi_id: Optional[str] = None
    host_upi_mobile: Optional[str] = None
    upi_qr_url: Optional[str] = None
    accepts_digital_shagun: Optional[bool] = None
    theme_config: Optional[dict] = None
    status: Optional[EventStatus] = None


class EventRead(BaseModel):
    id: str
    user_id: str
    title: str
    slug: str
    event_type: str
    status: EventStatus
    host_name: str
    co_host_name: Optional[str] = None
    contact_phone: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    venue_name: str
    venue_address: str
    google_maps_url: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    background_music_url: Optional[str] = None
    upi_qr_url: Optional[str] = None
    upi_id: Optional[str] = None
    host_upi_mobile: Optional[str] = None
    accepts_digital_shagun: bool = False
    theme_config: Optional[dict] = None
    functions: List[EventFunctionRead] = []
    invitation: Optional[InvitationRead] = None
    created_at: datetime

    class Config:
        from_attributes = True
