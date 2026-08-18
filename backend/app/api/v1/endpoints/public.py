from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
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

    # Fetch approved wishes from database
    from app.models.wish import CelebrationWish, ModerationStatus
    from app.models.gallery import GalleryItem
    from app.services.memory_service import MemoryService
    
    approved_wishes_objs = await MemoryService.get_approved_wishes_for_public(db, event.id)
    wishes = [
        {
            "id": w.id,
            "sender_name": w.sender_name,
            "relationship": w.relationship,
            "message": w.message,
            "is_featured": w.is_featured,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in approved_wishes_objs
    ]
    # Fallback to legacy theme_config wishes if db is empty
    if not wishes:
        wishes = [w for w in theme_config.get("wishes", []) if w.get("status") in [None, "APPROVED"]]

    # Fetch approved memories from database
    approved_memories_objs = await MemoryService.get_approved_memories_for_public(db, event.id)
    memories = [
        {
            "id": m.id,
            "media_url": m.media_url,
            "caption": m.caption,
            "uploaded_by_name": m.uploaded_by_name or "Guest",
            "is_featured": m.is_featured,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in approved_memories_objs
    ]
    if not memories:
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
    from app.models.wish import CelebrationWish, ModerationStatus
    from app.services.memory_service import MemoryService

    event = await EventService.get_event_by_id(db, slug)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation link not found.")

    sender_name = payload.get("sender_name", "").strip() or "Guest"
    relationship = payload.get("relationship", "").strip() or "Well Wisher"
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty.")

    # Create wish in database defaulting to PENDING moderation
    wish = await MemoryService.create_wish(
        db=db,
        event_id=event.id,
        sender_name=sender_name,
        relationship=relationship,
        message=message,
        status=ModerationStatus.PENDING,
    )

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
        data={
            "id": wish.id,
            "sender_name": wish.sender_name,
            "relationship": wish.relationship,
            "message": wish.message,
            "status": wish.status.value,
            "created_at": wish.created_at.isoformat(),
        },
        message="Thank you! Your warm wishes have been submitted and will appear on the celebration wall upon host approval."
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

    adults_raw = payload.get("adults_attending")
    children_raw = payload.get("children_attending", 0)

    if rsvp_enum == RSVPStatus.YES:
        adults_count = max(1, min(int(adults_raw if adults_raw is not None else 1), 20))
        children_count = max(0, min(int(children_raw if children_raw is not None else 0), 20))
        status_label = "Attendance Confirmed"
    elif rsvp_enum == RSVPStatus.MAYBE:
        adults_count = max(1, min(int(adults_raw if adults_raw is not None else 1), 20))
        children_count = max(0, min(int(children_raw if children_raw is not None else 0), 20))
        status_label = "Tentative (Maybe)"
    else:
        adults_count = 0
        children_count = 0
        status_label = "Declined with Regrets"

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
            adults_count=adults_count if rsvp_enum == RSVPStatus.YES else 1,
            children_count=children_count,
            rsvp_status=rsvp_enum,
            notes=f"Meal: {meal_pref} | Note: {notes}" if notes else f"Meal: {meal_pref}",
        )
        db.add(guest)
        await db.flush()
    else:
        guest.rsvp_status = rsvp_enum
        guest.adults_count = adults_count if rsvp_enum == RSVPStatus.YES else (guest.adults_count or 1)
        guest.children_count = children_count
        guest.notes = f"Meal: {meal_pref} | Note: {notes}" if notes else f"Meal: {meal_pref}"
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
            children_attending=children_count,
            dietary_preference=meal_pref,
            wishes_note=notes,
        )
        db.add(rsvp_rec)
    else:
        rsvp_rec.status = rsvp_enum
        rsvp_rec.adults_attending = adults_count
        rsvp_rec.children_attending = children_count
        rsvp_rec.dietary_preference = meal_pref
        rsvp_rec.wishes_note = notes

    # 3. Query GuestEntryPass for real passcode
    from app.models.qr_pass import GuestEntryPass
    pass_stmt = select(GuestEntryPass.pass_code).where(GuestEntryPass.guest_id == guest.id)
    pass_res = await db.execute(pass_stmt)
    pass_code = pass_res.scalar_one_or_none() or "NIM-ENTRY"

    # 4. Log into recent RSVP feed in event theme config for live admin dashboard
    theme_config = dict(event.theme_config or {})
    feed = [item for item in list(theme_config.get("recent_rsvps", [])) if item.get("guest_name") != guest.name]
    feed_entry = {
        "id": f"rsvp_{datetime.now(timezone.utc).timestamp()}",
        "guest_id": guest.id,
        "guest_name": guest.name,
        "status": rsvp_enum.value,
        "status_label": status_label,
        "adults_attending": adults_count,
        "children_attending": children_count,
        "total_attending": adults_count + children_count if rsvp_enum == RSVPStatus.YES else 0,
        "meal_preference": meal_pref,
        "notes": notes,
        "pass_code": pass_code,
        "event_title": event.title,
        "event_date": event.start_date.isoformat() if event.start_date else None,
        "venue_name": event.venue_name,
        "timestamp": "Just now",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    feed.insert(0, feed_entry)
    theme_config["recent_rsvps"] = feed[:20]
    event.theme_config = theme_config

    await db.commit()

    return ResponseModel(
        data=feed_entry,
        message=f"Thank you {guest.name}! Your RSVP has been successfully recorded."
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
    is_family = (guest.category and guest.category.value == "FAMILY") or "family" in (guest.relationship or "").lower()
    salutation = f"Dear {guest.name} & Family ❤️" if is_family else f"Dear {guest.name} ❤️"

    # Query GuestEntryPass for real passcode
    from app.models.qr_pass import GuestEntryPass
    pass_stmt = select(GuestEntryPass.pass_code).where(GuestEntryPass.guest_id == guest.id)
    pass_res = await db.execute(pass_stmt)
    pass_code = pass_res.scalar_one_or_none() or "NIM-ENTRY"

    canonical = CanonicalInvitationContent.from_event(
        event=event,
        ai_content=theme_config.get("canonical_invitation"),
        guest_token=token,
    )

    # Fetch approved wishes from database
    from app.models.wish import CelebrationWish, ModerationStatus
    from app.models.gallery import GalleryItem
    from app.services.memory_service import MemoryService
    
    approved_wishes_objs = await MemoryService.get_approved_wishes_for_public(db, event.id)
    wishes = [
        {
            "id": w.id,
            "sender_name": w.sender_name,
            "relationship": w.relationship,
            "message": w.message,
            "is_featured": w.is_featured,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in approved_wishes_objs
    ]
    if not wishes:
        wishes = [w for w in theme_config.get("wishes", []) if w.get("status") in [None, "APPROVED"]]

    # Fetch approved memories from database
    approved_memories_objs = await MemoryService.get_approved_memories_for_public(db, event.id)
    memories = [
        {
            "id": m.id,
            "media_url": m.media_url,
            "caption": m.caption,
            "uploaded_by_name": m.uploaded_by_name or "Guest",
            "is_featured": m.is_featured,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in approved_memories_objs
    ]
    if not memories:
        memories = theme_config.get("memories", [])

    return ResponseModel(
        data={
            "token": token,
            "guest_id": guest.id,
            "guest_name": guest.name,
            "salutation": salutation,
            "rsvp_status": guest.rsvp_status.value if hasattr(guest.rsvp_status, 'value') else str(guest.rsvp_status),
            "adults_count": guest.adults_count,
            "pass_code": pass_code,
            "notes": guest.notes,
            "event": event_data,
            "canonical_invitation": canonical.model_dump(),
            "wishes": wishes,
            "memories": memories,
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
            detail="This invitation link is invalid or no longer available."
        )

    event = await EventService.get_event_by_id(db, guest.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The celebration event could not be found."
        )

    status_raw = payload.get("status", "YES").upper()
    if status_raw in ["YES", "CONFIRMED", "ATTENDING"]:
        rsvp_enum = RSVPStatus.YES
    elif status_raw in ["MAYBE", "UNCERTAIN"]:
        rsvp_enum = RSVPStatus.MAYBE
    else:
        rsvp_enum = RSVPStatus.NO

    adults_raw = payload.get("adults_attending")
    children_raw = payload.get("children_attending", 0)

    if rsvp_enum == RSVPStatus.YES:
        adults_count = max(1, min(int(adults_raw if adults_raw is not None else (guest.adults_count or 1)), 20))
        children_count = max(0, min(int(children_raw if children_raw is not None else (guest.children_count or 0)), 20))
        status_label = "Attendance Confirmed"
    elif rsvp_enum == RSVPStatus.MAYBE:
        adults_count = max(1, min(int(adults_raw if adults_raw is not None else (guest.adults_count or 1)), 20))
        children_count = max(0, min(int(children_raw if children_raw is not None else (guest.children_count or 0)), 20))
        status_label = "Tentative (Maybe)"
    else:
        adults_count = 0
        children_count = 0
        status_label = "Declined with Regrets"

    meal_pref = payload.get("meal_preference", "Veg (only)")
    notes = payload.get("notes", "").strip()

    guest.rsvp_status = rsvp_enum
    if rsvp_enum == RSVPStatus.YES:
        guest.adults_count = adults_count
    guest.children_count = children_count
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
            children_attending=children_count,
            dietary_preference=meal_pref,
            wishes_note=notes,
        )
        db.add(rsvp_rec)
    else:
        rsvp_rec.status = rsvp_enum
        rsvp_rec.adults_attending = adults_count
        rsvp_rec.children_attending = children_count
        rsvp_rec.dietary_preference = meal_pref
        rsvp_rec.wishes_note = notes

    # Query real passcode
    from app.models.qr_pass import GuestEntryPass
    pass_stmt = select(GuestEntryPass.pass_code).where(GuestEntryPass.guest_id == guest.id)
    pass_res = await db.execute(pass_stmt)
    pass_code = pass_res.scalar_one_or_none() or "NIM-ENTRY"

    # Log into recent feed (replace old entry for same guest if exists)
    theme_config = dict(event.theme_config or {})
    feed = [item for item in list(theme_config.get("recent_rsvps", [])) if item.get("guest_name") != guest.name]
    feed_entry = {
        "id": f"rsvp_{datetime.now(timezone.utc).timestamp()}",
        "guest_id": guest.id,
        "guest_name": guest.name,
        "status": rsvp_enum.value,
        "status_label": status_label,
        "adults_attending": adults_count,
        "children_attending": children_count,
        "total_attending": adults_count + children_count if rsvp_enum == RSVPStatus.YES else 0,
        "meal_preference": meal_pref,
        "notes": notes,
        "pass_code": pass_code,
        "event_title": event.title,
        "event_date": event.start_date.isoformat() if event.start_date else None,
        "venue_name": event.venue_name,
        "timestamp": "Just now",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
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


@router.post("/invitations/t/{token}/wishes", response_model=ResponseModel[dict])
async def submit_public_wish_by_token(
    token: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.guest import Guest
    from app.models.wish import CelebrationWish, ModerationStatus
    from app.services.memory_service import MemoryService

    stmt = select(Guest).where(Guest.invitation_token == token)
    res = await db.execute(stmt)
    guest = res.scalars().first()

    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation link not found.")

    event = await EventService.get_event_by_id(db, guest.event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    sender_name = payload.get("sender_name", "").strip() or guest.name
    relationship = payload.get("relationship", "").strip() or guest.relationship or "Guest"
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty.")

    # Create wish in database with PENDING moderation status
    wish = await MemoryService.create_wish(
        db=db,
        event_id=event.id,
        sender_name=sender_name,
        relationship=relationship,
        message=message,
        guest_id=guest.id,
        status=ModerationStatus.PENDING,
    )

    guest.custom_welcome_quote = f"💬 '{message}' — {sender_name}"
    await db.commit()

    return ResponseModel(
        data={
            "id": wish.id,
            "sender_name": wish.sender_name,
            "relationship": wish.relationship,
            "message": wish.message,
            "status": wish.status.value,
            "created_at": wish.created_at.isoformat(),
        },
        message="Thank you! Your warm wishes have been submitted and will appear on the celebration wall upon host approval."
    )


@router.post("/events/{slug}/memories", response_model=ResponseModel[dict])
async def submit_public_memory_photo(
    slug: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    sender_name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Guest endpoint: Upload a celebration photo memory to the event (defaults to PENDING host review)."""
    from app.models.wish import ModerationStatus
    from app.services.memory_service import MemoryService

    event = await EventService.get_event_by_id(db, slug)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    file_bytes = await file.read()
    media_url, file_size, mime_type = await MemoryService.upload_memory_photo(
        file_bytes=file_bytes,
        filename=file.filename or "photo.jpg",
        content_type=file.content_type or "image/jpeg",
    )

    item = await MemoryService.create_memory_item(
        db=db,
        event_id=event.id,
        media_url=media_url,
        caption=caption,
        uploaded_by_name=sender_name or "Guest",
        status=ModerationStatus.PENDING,
        file_size_bytes=file_size,
        mime_type=mime_type,
    )

    return ResponseModel(
        data={
            "id": item.id,
            "media_url": item.media_url,
            "caption": item.caption,
            "status": item.status.value,
            "created_at": item.created_at.isoformat(),
        },
        message="Photo memory uploaded successfully! It will appear on the celebration wall once approved by the host."
    )


@router.post("/invitations/t/{token}/memories", response_model=ResponseModel[dict])
async def submit_public_memory_photo_by_token(
    token: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Personalized guest endpoint: Upload a photo memory linked to an invitation token."""
    from sqlalchemy import select
    from app.models.guest import Guest
    from app.models.wish import ModerationStatus
    from app.services.memory_service import MemoryService

    stmt = select(Guest).where(Guest.invitation_token == token)
    res = await db.execute(stmt)
    guest = res.scalars().first()

    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation link not found.")

    event = await EventService.get_event_by_id(db, guest.event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    file_bytes = await file.read()
    media_url, file_size, mime_type = await MemoryService.upload_memory_photo(
        file_bytes=file_bytes,
        filename=file.filename or "photo.jpg",
        content_type=file.content_type or "image/jpeg",
    )

    item = await MemoryService.create_memory_item(
        db=db,
        event_id=event.id,
        media_url=media_url,
        caption=caption,
        uploaded_by_guest_id=guest.id,
        uploaded_by_name=guest.name,
        status=ModerationStatus.PENDING,
        file_size_bytes=file_size,
        mime_type=mime_type,
    )

    return ResponseModel(
        data={
            "id": item.id,
            "media_url": item.media_url,
            "caption": item.caption,
            "uploaded_by_name": guest.name,
            "status": item.status.value,
            "created_at": item.created_at.isoformat(),
        },
        message=f"Thank you {guest.name}! Your photo memory has been submitted for host review."
    )


@router.get("/events/{slug}/memories", response_model=ResponseModel[dict])
async def get_public_event_memories_wall(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint: Returns all approved photo memories and approved wishes for the event wall."""
    from app.services.memory_service import MemoryService

    event = await EventService.get_event_by_id(db, slug)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    approved_wishes_objs = await MemoryService.get_approved_wishes_for_public(db, event.id)
    approved_memories_objs = await MemoryService.get_approved_memories_for_public(db, event.id)

    return ResponseModel(
        data={
            "event_title": event.title,
            "host_name": event.host_name,
            "wishes": [
                {
                    "id": w.id,
                    "sender_name": w.sender_name,
                    "relationship": w.relationship,
                    "message": w.message,
                    "is_featured": w.is_featured,
                    "created_at": w.created_at.isoformat() if w.created_at else None,
                }
                for w in approved_wishes_objs
            ],
            "memories": [
                {
                    "id": m.id,
                    "media_url": m.media_url,
                    "caption": m.caption,
                    "uploaded_by_name": m.uploaded_by_name or "Guest",
                    "is_featured": m.is_featured,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                }
                for m in approved_memories_objs
            ],
        },
        message="Approved public memories and wishes retrieved successfully."
    )


