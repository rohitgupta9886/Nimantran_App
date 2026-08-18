from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.schemas.common import ResponseModel
from app.models.event import Event
from app.models.welcome import WelcomeMessage
from app.services.welcome_service import welcome_manager

router = APIRouter()


@router.websocket("/ws/events/{event_id}/welcome")
async def welcome_screen_websocket(websocket: WebSocket, event_id: str):
    await welcome_manager.connect(event_id, websocket)
    try:
        while True:
            # Keep connection open & listen for client pings/messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        welcome_manager.disconnect(event_id, websocket)


@router.get("/events/{event_id}/welcome-feed", response_model=ResponseModel[dict])
async def get_event_welcome_feed(
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Publicly safe event-day welcome feed providing approved event branding and recent check-ins without private guest details."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Fetch recent welcome messages in descending order (latest arrival first)
    stmt = (
        select(WelcomeMessage)
        .where(WelcomeMessage.event_id == event_id)
        .order_by(desc(WelcomeMessage.displayed_at))
        .limit(20)
    )
    res = await db.execute(stmt)
    messages = list(res.scalars().all())

    recent_arrivals = [
        {
            "id": m.id,
            "guest_name": m.guest_name,
            "relationship": m.relationship or "Honored Guest",
            "welcome_quote": m.welcome_quote,
            "photo_url": m.photo_url,
            "is_vip": m.is_vip,
            "checked_in_at": m.displayed_at.isoformat() if m.displayed_at else None,
        }
        for m in messages
    ]

    theme_name = event.theme_config.get("theme_name") if isinstance(event.theme_config, dict) else getattr(event, "theme_name", "ROYAL_GOLD")

    return ResponseModel(
        data={
            "event": {
                "id": event.id,
                "title": event.title,
                "host_name": event.host_name,
                "venue_name": event.venue_name,
                "event_type": event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type),
                "theme_name": theme_name,
                "start_date": event.start_date.isoformat() if event.start_date else None,
            },
            "recent_arrivals": recent_arrivals,
            "latest_checkin": recent_arrivals[0] if recent_arrivals else None,
        },
        message="Event Welcome Feed retrieved successfully"
    )
