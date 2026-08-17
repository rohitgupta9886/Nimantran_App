from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.schemas.common import ResponseModel
from app.schemas.event import EventRead
from app.services.event_service import EventService
from app.services.ai_service import AIService
from app.schemas.invitation_content import CanonicalInvitationContent

router = APIRouter()
ai_service = AIService()


@router.get("/events/{slug}", response_model=ResponseModel[dict])
async def get_public_event(slug: str, db: AsyncSession = Depends(get_db)):
    event = await EventService.get_event_by_id(db, slug)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation link not found or expired.")

    now = datetime.now(timezone.utc)
    start_dt = event.start_date.replace(tzinfo=timezone.utc) if event.start_date.tzinfo is None else event.start_date
    end_dt = event.end_date.replace(tzinfo=timezone.utc) if event.end_date and event.end_date.tzinfo is None else event.end_date

    # Calculate Lifecycle phase
    if now < start_dt:
        phase = "BEFORE"
        headline = "You're Graciously Invited"
    elif end_dt and now > end_dt:
        phase = "AFTER"
        headline = "Relive the Celebration & Memories"
    else:
        phase = "DURING"
        headline = "Welcome to the Celebration"

    event_data = EventRead.model_validate(event).model_dump()
    event_data.pop("user_id", None)  # Ensure private internal user_id is never leaked in public APIs
    theme_config = event.theme_config or {}
    wishes = theme_config.get("wishes", [])
    memories = theme_config.get("memories", [])

    canonical = CanonicalInvitationContent.from_event(
        event=event,
        ai_content=theme_config.get("canonical_invitation"),
    )

    return ResponseModel(
        data={
            "event": event_data,
            "canonical_invitation": canonical.model_dump(),
            "lifecycle_phase": phase,
            "headline": headline,
            "wishes": wishes,
            "memories": memories,
        }
    )


@router.post("/events/{slug}/wishes", response_model=ResponseModel[dict])
async def submit_public_wish(
    slug: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, slug)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation link not found.")

    sender_name = payload.get("sender_name", "").strip() or "Guest"
    relationship = payload.get("relationship", "").strip() or "Well Wisher"
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty.")

    theme_config = dict(event.theme_config or {})
    wishes = list(theme_config.get("wishes", []))
    
    new_wish = {
        "id": f"wish_{datetime.now(timezone.utc).timestamp()}",
        "sender_name": sender_name,
        "relationship": relationship,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    wishes.insert(0, new_wish)
    theme_config["wishes"] = wishes
    event.theme_config = theme_config

    # Also check if this matches an existing guest by name to update their welcome quote for TV screen
    from sqlalchemy import select
    from app.models.guest import Guest
    stmt = select(Guest).where(Guest.event_id == event.id, Guest.name.ilike(f"%{sender_name}%"))
    res = await db.execute(stmt)
    guest = res.scalars().first()
    if guest:
        guest.custom_welcome_quote = f"💬 '{message}' — {sender_name}"

    await db.commit()

    return ResponseModel(
        data=new_wish,
        message="Thank you! Your warm wishes and blessings have been added to the celebration wall."
    )


@router.post("/events/{slug}/ai-card", response_model=ResponseModel[dict])
async def generate_public_ai_card(slug: str, db: AsyncSession = Depends(get_db)):
    event = await EventService.get_event_by_id(db, slug)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation link not found.")

    date_str = event.start_date.strftime("%d %b %Y") if event.start_date else "Date to be Announced"
    evt_type = event.event_type.value if hasattr(event.event_type, 'value') else str(event.event_type)
    card_data = await ai_service.generate_event_ai_card(
        db=db,
        user_id=None,
        event_id=event.id,
        event_type=evt_type,
        title=event.title,
        host_name=event.host_name,
        venue=event.venue_name,
        date_str=date_str,
    )

    return ResponseModel(
        data=card_data,
        message="Google Gemini AI generated invitation card on the fly!"
    )


@router.post("/events/{slug}/rsvp", response_model=ResponseModel[dict])
async def submit_public_rsvp(
    slug: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.guest import Guest, RSVPStatus, RSVP

    event = await EventService.get_event_by_id(db, slug)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation link not found.")

    guest_name = payload.get("guest_name", "").strip() or "Valued Guest"
    phone = payload.get("phone", "").strip() or None
    status_raw = payload.get("status", "CONFIRMED").upper()

    if status_raw in ["YES", "CONFIRMED", "ATTENDING"]:
        rsvp_enum = RSVPStatus.YES
    elif status_raw in ["MAYBE", "UNCERTAIN"]:
        rsvp_enum = RSVPStatus.MAYBE
    else:
        rsvp_enum = RSVPStatus.NO

    adults_count = int(payload.get("adults_attending", 1))
    meal_pref = payload.get("meal_preference", "Veg (only)")
    notes = payload.get("notes", "").strip()

    # 1. Deterministic find or create guest (check phone first, then name)
    guest = None
    if phone:
        stmt_phone = select(Guest).where(Guest.event_id == event.id, Guest.phone == phone)
        res_phone = await db.execute(stmt_phone)
        guest = res_phone.scalars().first()

    if not guest:
        stmt_name = select(Guest).where(Guest.event_id == event.id, Guest.name.ilike(f"%{guest_name}%"))
        res_name = await db.execute(stmt_name)
        guest = res_name.scalars().first()

    if not guest:
        guest = Guest(
            event_id=event.id,
            name=guest_name,
            phone=phone,
            relationship="Guest",
            adults_count=adults_count,
            rsvp_status=rsvp_enum,
        )
        db.add(guest)
        await db.flush()
    else:
        guest.rsvp_status = rsvp_enum
        guest.adults_count = adults_count
        if phone and not guest.phone:
            guest.phone = phone

    # 2. Upsert RSVP record
    stmt_rsvp = select(RSVP).where(RSVP.guest_id == guest.id)
    res_rsvp = await db.execute(stmt_rsvp)
    rsvp_rec = res_rsvp.scalars().first()

    if not rsvp_rec:
        rsvp_rec = RSVP(
            guest_id=guest.id,
            event_id=event.id,
            status=rsvp_enum,
            adults_attending=adults_count,
            children_attending=0,
            dietary_preference=meal_pref,
            wishes_note=notes,
        )
        db.add(rsvp_rec)
    else:
        rsvp_rec.status = rsvp_enum
        rsvp_rec.adults_attending = adults_count
        rsvp_rec.dietary_preference = meal_pref
        rsvp_rec.wishes_note = notes

    # 3. Log into recent RSVP feed in event theme config for live admin dashboard
    theme_config = dict(event.theme_config or {})
    feed = list(theme_config.get("recent_rsvps", []))
    feed_entry = {
        "id": f"rsvp_{datetime.now(timezone.utc).timestamp()}",
        "guest_name": guest_name,
        "status": rsvp_enum.value,
        "adults_attending": adults_count,
        "meal_preference": meal_pref,
        "timestamp": "Just now",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    feed.insert(0, feed_entry)
    theme_config["recent_rsvps"] = feed[:20]
    event.theme_config = theme_config

    await db.commit()

    return ResponseModel(
        data=feed_entry,
        message=f"Thank you {guest_name}! Your RSVP has been successfully recorded."
    )


@router.get("/invitations/t/{token}", response_model=ResponseModel[dict])
async def get_public_invitation_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.guest import Guest, RSVPStatus
    from app.models.event import Event

    stmt = select(Guest).where(Guest.invitation_token == token)
    res = await db.execute(stmt)
    guest = res.scalars().first()

    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This invitation link is invalid or no longer available."
        )

    # Fetch event
    event = await EventService.get_event_by_id(db, guest.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The celebration event could not be found."
        )

    now = datetime.now(timezone.utc)
    guest.open_count = (guest.open_count or 0) + 1
    guest.delivery_status = "READ"
    guest.last_opened_at = now
    if not guest.first_opened_at:
        guest.first_opened_at = now

    await db.commit()

    event_data = EventRead.model_validate(event).model_dump()
    event_data.pop("user_id", None)  # Ensure private internal user_id is never leaked in public APIs
    theme_config = event.theme_config or {}

    # Format personalized greeting
    salutation = f"Dear {guest.name}"
    if guest.category and guest.category.value == "FAMILY":
        salutation = f"Dear {guest.name} & Family"

    canonical = CanonicalInvitationContent.from_event(
        event=event,
        ai_content=theme_config.get("canonical_invitation"),
        guest_token=token,
    )

    return ResponseModel(
        data={
            "token": token,
            "guest_id": guest.id,
            "guest_name": guest.name,
            "salutation": salutation,
            "rsvp_status": guest.rsvp_status.value if hasattr(guest.rsvp_status, 'value') else str(guest.rsvp_status),
            "adults_count": guest.adults_count,
            "notes": guest.notes,
            "event": event_data,
            "canonical_invitation": canonical.model_dump(),
            "wishes": theme_config.get("wishes", []),
            "memories": theme_config.get("memories", []),
            "music_url": theme_config.get("music_url", "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"),
            "theme_id": theme_config.get("theme_id", "romantic-blush"),
        },
        message="Signature Digital Invitation loaded successfully"
    )


@router.post("/invitations/t/{token}/rsvp", response_model=ResponseModel[dict])
async def submit_public_rsvp_by_token(
    token: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.guest import Guest, RSVPStatus, RSVP

    stmt = select(Guest).where(Guest.invitation_token == token)
    res = await db.execute(stmt)
    guest = res.scalars().first()

    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation token."
        )

    event = await EventService.get_event_by_id(db, guest.event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    status_raw = payload.get("status", "CONFIRMED").upper()
    if status_raw in ["YES", "CONFIRMED", "ATTENDING"]:
        rsvp_enum = RSVPStatus.CONFIRMED
    elif status_raw in ["MAYBE", "UNCERTAIN"]:
        rsvp_enum = RSVPStatus.MAYBE
    else:
        rsvp_enum = RSVPStatus.NOT_ATTENDING

    adults_count = int(payload.get("adults_attending", guest.adults_count or 1))
    meal_pref = payload.get("meal_preference", "Veg (only)")
    notes = payload.get("notes", "").strip()

    guest.rsvp_status = rsvp_enum
    guest.adults_count = adults_count
    guest.notes = f"Meal: {meal_pref} | Note: {notes}" if notes else f"Meal: {meal_pref}"

    # Upsert RSVP
    stmt_rsvp = select(RSVP).where(RSVP.guest_id == guest.id)
    res_rsvp = await db.execute(stmt_rsvp)
    rsvp_rec = res_rsvp.scalars().first()

    if not rsvp_rec:
        rsvp_rec = RSVP(
            guest_id=guest.id,
            event_id=event.id,
            status=rsvp_enum,
            adults_attending=adults_count,
            children_attending=0,
            dietary_preference=meal_pref,
            wishes_note=notes,
        )
        db.add(rsvp_rec)
    else:
        rsvp_rec.status = rsvp_enum
        rsvp_rec.adults_attending = adults_count
        rsvp_rec.dietary_preference = meal_pref
        rsvp_rec.wishes_note = notes

    # Log into recent feed
    theme_config = dict(event.theme_config or {})
    feed = list(theme_config.get("recent_rsvps", []))
    feed_entry = {
        "id": f"rsvp_{datetime.now(timezone.utc).timestamp()}",
        "guest_name": guest.name,
        "status": rsvp_enum.value,
        "adults_attending": adults_count,
        "meal_preference": meal_pref,
        "timestamp": "Just now",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    feed.insert(0, feed_entry)
    theme_config["recent_rsvps"] = feed[:20]
    event.theme_config = theme_config

    await db.commit()

    return ResponseModel(
        data=feed_entry,
        message=f"Thank you {guest.name}! Your RSVP has been confirmed."
    )


