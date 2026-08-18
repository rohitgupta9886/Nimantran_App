from typing import Dict, Any, List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class ConciergeIntent(str, Enum):
    CREATE_EVENT = "CREATE_EVENT"
    MODIFY_EVENT = "MODIFY_EVENT"
    ADD_GUEST = "ADD_GUEST"
    QUERY_RSVP = "QUERY_RSVP"
    GENERATE_INVITATION = "GENERATE_INVITATION"
    PREPARE_CAMPAIGN = "PREPARE_CAMPAIGN"
    RESEND_INVITATION = "RESEND_INVITATION"
    NAVIGATE_OR_ADVISE = "NAVIGATE_OR_ADVISE"
    CONFIRM_ACTION = "CONFIRM_ACTION"
    CANCEL_ACTION = "CANCEL_ACTION"
    GENERAL_CHAT = "GENERAL_CHAT"


class ConciergeActionType(str, Enum):
    CREATE_EVENT = "CREATE_EVENT"
    MODIFY_EVENT = "MODIFY_EVENT"
    ADD_GUEST = "ADD_GUEST"
    QUERY_RSVP = "QUERY_RSVP"
    GENERATE_INVITATION = "GENERATE_INVITATION"
    RESEND_SINGLE_INVITATION = "RESEND_SINGLE_INVITATION"
    SEND_BROADCAST_CAMPAIGN = "SEND_BROADCAST_CAMPAIGN"
    NAVIGATE = "NAVIGATE"
    ADVISE = "ADVISE"


class ConciergeAction(BaseModel):
    action_id: str
    action_type: ConciergeActionType
    event_id: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_prompt: Optional[str] = None
    confirmation_payload: Optional[Dict[str, Any]] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    ui_navigation: Optional[Dict[str, str]] = None
    preview_data: Optional[Dict[str, Any]] = None


class ConciergeChatRequest(BaseModel):
    event_id: Optional[str] = None
    message: str
    thread_id: Optional[str] = "default_concierge_thread"
    confirmed_action_id: Optional[str] = None
    confirmed: Optional[bool] = None


class ConciergeConfirmActionRequest(BaseModel):
    action_id: str
    confirmed: bool = True
    event_id: Optional[str] = None


class ConciergeChatResponse(BaseModel):
    reply_text: str
    intent: ConciergeIntent
    structured_action: Optional[ConciergeAction] = None
    requires_confirmation: bool = False
    action_executed: bool = False
    execution_result: Optional[Dict[str, Any]] = None
    suggested_actions: List[str] = Field(default_factory=list)
    ui_navigation: Optional[Dict[str, str]] = None
