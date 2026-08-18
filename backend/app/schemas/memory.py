from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.gallery import ModerationStatus


class CelebrationWishCreate(BaseModel):
    sender_name: str = Field(..., min_length=1, max_length=100)
    relationship: Optional[str] = Field("Well Wisher", max_length=100)
    message: str = Field(..., min_length=1, max_length=1000)


class CelebrationWishUpdate(BaseModel):
    status: Optional[ModerationStatus] = None
    is_featured: Optional[bool] = None
    message: Optional[str] = None


class CelebrationWishRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    guest_id: Optional[str] = None
    sender_name: str
    relationship: str
    message: str
    status: ModerationStatus
    is_featured: bool
    created_at: datetime
    moderated_at: Optional[datetime] = None


class MemoryItemCreate(BaseModel):
    caption: Optional[str] = Field(None, max_length=500)
    album_id: Optional[str] = None
    uploaded_by_name: Optional[str] = Field(None, max_length=100)


class MemoryItemUpdate(BaseModel):
    status: Optional[ModerationStatus] = None
    is_featured: Optional[bool] = None
    caption: Optional[str] = None
    album_id: Optional[str] = None


class MemoryItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    album_id: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    media_type: str
    caption: Optional[str] = None
    uploaded_by_guest_id: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    status: ModerationStatus
    is_approved: bool
    is_featured: bool
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    created_at: datetime


class CelebrationStoryGenerateRequest(BaseModel):
    style: Optional[str] = Field("EMOTIONAL_ROYAL", description="Story tone/style: EMOTIONAL_ROYAL, JOYFUL, TRADITIONAL, POETIC")
    custom_notes: Optional[str] = Field(None, description="Optional extra host notes")


class CelebrationStoryResponse(BaseModel):
    title: str
    event_type: str
    host_name: str
    venue_name: str
    date_str: str
    attendance_grounding: Dict[str, Any]
    story_hindi: str
    story_english: str
    highlights: List[str]
    host_gratitude_note: str
    approved_wishes_count: int
    approved_memories_count: int


class AICaptionRequest(BaseModel):
    milestone_or_tag: Optional[str] = "Celebration Moment"
    guest_name: Optional[str] = None


class AICaptionResponse(BaseModel):
    caption_hindi: str
    caption_english: str
    combined_caption: str


class AIThankYouRequest(BaseModel):
    target_audience: Optional[str] = "ALL_GUESTS"  # ALL_GUESTS, ATTENDEES_ONLY


class AIThankYouResponse(BaseModel):
    thank_you_hindi: str
    thank_you_english: str
    whatsapp_ready_message: str
