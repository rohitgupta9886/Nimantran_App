import contextvars
import uuid
from typing import Optional, Dict, Any

# Contextvars for async request tracking
_request_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)
_event_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("event_id", default=None)
_campaign_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("campaign_id", default=None)
_message_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("message_id", default=None)
_user_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id", default=None)


def generate_request_id() -> str:
    """Generates a unique request correlation ID."""
    return f"req_{uuid.uuid4().hex[:12]}"


def set_request_id(req_id: Optional[str] = None) -> str:
    """Sets current request_id in context. Generates one if not provided."""
    actual_id = req_id.strip() if req_id and req_id.strip() else generate_request_id()
    _request_id_ctx.set(actual_id)
    return actual_id


def get_request_id() -> str:
    """Retrieves current request_id from context, or returns fallback."""
    rid = _request_id_ctx.get()
    return rid or "req_system"


def set_event_id(event_id: Optional[str]) -> None:
    _event_id_ctx.set(event_id)


def get_event_id() -> Optional[str]:
    return _event_id_ctx.get()


def set_campaign_id(campaign_id: Optional[str]) -> None:
    _campaign_id_ctx.set(campaign_id)


def get_campaign_id() -> Optional[str]:
    return _campaign_id_ctx.get()


def set_message_id(message_id: Optional[str]) -> None:
    _message_id_ctx.set(message_id)


def get_message_id() -> Optional[str]:
    return _message_id_ctx.get()


def set_user_id(user_id: Optional[str]) -> None:
    _user_id_ctx.set(user_id)


def get_user_id() -> Optional[str]:
    return _user_id_ctx.get()


def get_current_context() -> Dict[str, Any]:
    """Returns a dictionary of all active correlation identifiers in the current async context."""
    ctx: Dict[str, Any] = {"request_id": get_request_id()}
    if eid := get_event_id():
        ctx["event_id"] = eid
    if cid := get_campaign_id():
        ctx["campaign_id"] = cid
    if mid := get_message_id():
        ctx["message_id"] = mid
    if uid := get_user_id():
        ctx["user_id"] = uid
    return ctx


def clear_context() -> None:
    """Clears all contextual correlation IDs."""
    _request_id_ctx.set(None)
    _event_id_ctx.set(None)
    _campaign_id_ctx.set(None)
    _message_id_ctx.set(None)
    _user_id_ctx.set(None)
