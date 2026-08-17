from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.invitation_content import CanonicalInvitationContent


class EventContext(BaseModel):
    """
    Unified, strongly-typed factual context for Nimantran AI celebrations.
    Guarantees that AI generation and conversation engines operate strictly
    within verified user-provided ground truth without hallucinating facts.
    """
    event_type: Optional[str] = Field(None, description="Event category: WEDDING, MUNDAN, BIRTHDAY, ANNIVERSARY, etc.")
    title: Optional[str] = Field(None, description="Title of the celebration")
    host_name: Optional[str] = Field(None, description="Primary host / organizer family name")
    co_host_name: Optional[str] = Field(None, description="Secondary or co-host name")
    celebrant_name: Optional[str] = Field(None, description="Name of celebrant, bride/groom, child, or birthday person")
    date: Optional[str] = Field(None, description="Formatted date of the celebration (e.g. '25 December 2026')")
    time: Optional[str] = Field(None, description="Time of the celebration (e.g. '7:00 PM')")
    venue: Optional[str] = Field(None, description="Venue or location name (e.g. 'Ayodhya', 'Taj Hotel')")
    address: Optional[str] = Field(None, description="Detailed venue street address or landmark")
    functions: List[Dict[str, Any]] = Field(default_factory=list, description="Sub-functions/rituals (e.g. Haldi, Sangeet)")
    language: str = Field("HINGLISH", description="Preferred language: ENGLISH, HINDI_DEVANAGARI, HINGLISH")
    tone: str = Field("WARM", description="Tone of the wording: WARM, ROYAL, DEVOTIONAL, FORMAL, CELEBRATORY")
    style: str = Field("MODERN_TRADITIONAL", description="Aesthetic style for card & invitation wording")
    guest_context: Optional[Dict[str, Any]] = Field(None, description="Optional guest personalization context")

    model_config = ConfigDict(from_attributes=True)


class StructuredInvitationOutput(BaseModel):
    """
    Validated Pydantic schema for structured invitation generation.
    Enforces complete, culturally accurate components before returning to UI.
    """
    title: str = Field(..., description="Celebration title")
    greeting: str = Field(..., description="Respectful opening greeting (e.g. 'Dear Guest & Family')")
    intro: str = Field(..., description="Introductory celebration context")
    main_message: str = Field(..., description="Core invitation message and invitation body")
    event_details: Dict[str, Any] = Field(default_factory=dict, description="Date, time, venue, location details")
    host_message: str = Field(..., description="Warm message from the host family")
    closing: str = Field(..., description="Auspicious or formal closing salutation")
    language: str = Field(..., description="Language of generated wording")
    tone: str = Field("WARM", description="Tone applied")
    style: str = Field("MODERN_TRADITIONAL", description="Style applied")
    shloka_header: Optional[str] = Field(None, description="Optional traditional shloka/mantra header")
    bilingual_english: Optional[str] = Field(None, description="English wording for bilingual invitations")
    bilingual_hindi: Optional[str] = Field(None, description="Hindi wording for bilingual invitations")

    model_config = ConfigDict(from_attributes=True)


class ConversationTurnRequest(BaseModel):
    thread_id: str = Field(..., description="Unique conversational session/thread ID")
    message: str = Field(..., description="User message text or voice transcript")
    event_context: Optional[EventContext] = Field(None, description="Existing event context if updating an event")


class ConversationTurnResponse(BaseModel):
    thread_id: str
    reply: str
    event_context: EventContext
    is_complete: bool
    missing_slots: List[str]
    detected_language: str
    suggested_action: str = Field("CONTINUE_CONVERSATION", description="CONTINUE_CONVERSATION, CONFIRM_EVENT, or READY_FOR_GENERATION")
