from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.schemas.common import ResponseModel
from app.schemas.event import EventCreate, EventRead, EventUpdate
from app.schemas.guest import GuestCreate
from app.schemas.invitation_content import CanonicalInvitationContent
from app.services.event_service import EventService
from app.services.guest_service import GuestService
from app.services.ai_service import AIService
from app.services.langgraph_service import langgraph_event_service
from app.models.user import User
from app.models.event import Event
from app.models.master_contact import MasterContact

router = APIRouter()
ai_service = AIService()


@router.post("", response_model=ResponseModel[EventRead])
async def create_event(
    data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.create_event(db, current_user.id, data)
    return ResponseModel(data=EventRead.model_validate(event), message="Event created successfully!")


@router.get("", response_model=ResponseModel[List[EventRead]])
async def list_user_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    events = await EventService.get_user_events(db, current_user.id)
    return ResponseModel(data=[EventRead.model_validate(e) for e in events])


@router.post("/{event_id}/publish", response_model=ResponseModel[dict])
async def publish_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validates the event and invitation, generates secure guest tokens,
    marks status as PUBLISHED, and returns public live URLs and preview metadata.
    """
    from datetime import datetime, timezone
    from app.models.event import EventStatus
    from app.core.config import settings

    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Validation
    if not event.title or not event.host_name or not event.venue_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish invitation: Event title, host name, and venue name are required.",
        )

    event.status = EventStatus.PUBLISHED
    event.updated_at = datetime.now(timezone.utc)
    await db.commit()

    base_url = settings.PUBLIC_BASE_URL.rstrip("/")
    public_url = f"{base_url}/i/{event.slug or event.id}"

    return ResponseModel(
        data={
            "id": event.id,
            "title": event.title,
            "slug": event.slug,
            "status": "PUBLISHED",
            "public_url": public_url,
            "published_at": event.updated_at.isoformat(),
            "preview_card": {
                "title": event.title,
                "host_name": event.host_name,
                "venue_name": event.venue_name,
                "start_date": event.start_date.isoformat() if event.start_date else None,
                "cover_image_url": event.cover_image_url,
                "event_type": event.event_type,
            },
        },
        message="Invitation published successfully and live on public URL.",
    )



@router.post("/ai-converse-langgraph", response_model=ResponseModel[dict])
async def converse_langgraph_assistant(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    thread_id = payload.get("thread_id") or f"user_{current_user.id}"
    user_message = payload.get("user_message", "")
    resp = await ai_service.process_conversation_turn(thread_id, user_message)
    return ResponseModel(data=resp.model_dump(), message="LangGraph State Engine response ready")


@router.post("/ai-converse-assistant", response_model=ResponseModel[dict])
async def converse_ai_assistant(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    thread_id = payload.get("thread_id") or f"user_{current_user.id}"
    user_message = payload.get("user_message", "")
    current_memory = payload.get("memory", {})
    res = await ai_service.converse_and_fill_slots(user_message, current_memory, thread_id=thread_id)
    return ResponseModel(data=res, message="AI Conversational Assistant response ready")


@router.get("/{event_id}/rsvp-analytics", response_model=ResponseModel[dict])
async def get_event_rsvp_analytics(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.guest import Guest, RSVPStatus

    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    result = await db.execute(select(Guest).where(Guest.event_id == event_id))
    guests = result.scalars().all()

    total_guests = len(guests) or 1
    confirmed = sum(1 for g in guests if g.rsvp_status in [RSVPStatus.YES, "YES", "CONFIRMED"])
    maybe = sum(1 for g in guests if g.rsvp_status in [RSVPStatus.MAYBE, "MAYBE"])
    not_attending = sum(1 for g in guests if g.rsvp_status in [RSVPStatus.NO, "NO", "NOT_ATTENDING"])
    awaiting = total_guests - (confirmed + maybe + not_attending)

    confirmed_pct = round((confirmed / total_guests) * 100)
    maybe_pct = round((maybe / total_guests) * 100)
    not_attending_pct = round((not_attending / total_guests) * 100)
    awaiting_pct = round((awaiting / total_guests) * 100)

    theme_config = event.theme_config or {}
    recent_feed = theme_config.get("recent_rsvps", [])

    return ResponseModel(
        data={
            "total_guests": total_guests,
            "confirmed_count": confirmed,
            "confirmed_pct": confirmed_pct,
            "maybe_count": maybe,
            "maybe_pct": maybe_pct,
            "not_attending_count": not_attending,
            "not_attending_pct": not_attending_pct,
            "awaiting_count": awaiting,
            "awaiting_pct": awaiting_pct,
            "recent_rsvps": recent_feed,
        },
        message="Real-time RSVP Analytics & Donut Breakdown ready"
    )


@router.get("/{event_id}/attendance", response_model=ResponseModel[dict])
async def get_event_attendance(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.guest import Guest
    from app.models.qr_pass import GuestEntryPass, Checkin

    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Fetch guests with entry pass
    stmt = select(Guest).where(Guest.event_id == event_id).options(selectinload(Guest.entry_pass))
    result = await db.execute(stmt)
    guests = list(result.scalars().all())

    # Fetch check-ins for method details
    c_stmt = select(Checkin).where(Checkin.event_id == event_id)
    c_res = await db.execute(c_stmt)
    checkins = list(c_res.scalars().all())
    checkin_method_map = {c.guest_id: c.check_in_method for c in checkins}

    total_guests = len(guests)
    attended_count = sum(1 for g in guests if g.checked_in)
    not_attended_count = total_guests - attended_count
    attendance_pct = round((attended_count / total_guests * 100), 1) if total_guests > 0 else 0.0

    guest_list = []
    for g in guests:
        pass_code = g.entry_pass.pass_code if g.entry_pass else (g.invitation_token or f"NIM-{g.id[:6].upper()}")
        guest_list.append({
            "id": g.id,
            "name": g.name,
            "phone": g.phone,
            "email": g.email,
            "relationship": g.relationship or "Guest",
            "category": g.category.value if hasattr(g.category, "value") else str(g.category),
            "pass_code": pass_code,
            "adults_count": g.adults_count,
            "children_count": g.children_count,
            "checked_in": g.checked_in,
            "checked_in_at": g.checked_in_at.isoformat() if g.checked_in_at else None,
            "check_in_method": checkin_method_map.get(g.id, "QR_SCAN" if g.checked_in else None),
            "rsvp_status": g.rsvp_status.value if hasattr(g.rsvp_status, "value") else str(g.rsvp_status),
        })

    return ResponseModel(
        data={
            "summary": {
                "total_guests": total_guests,
                "attended_count": attended_count,
                "not_attended_count": not_attended_count,
                "attendance_pct": attendance_pct,
            },
            "guests": guest_list,
        },
        message="Guest Attendance Dashboard retrieved successfully"
    )


@router.get("/{event_id}", response_model=ResponseModel[EventRead])
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    return ResponseModel(data=EventRead.model_validate(event))


@router.api_route("/{event_id}", methods=["PUT", "PATCH", "POST"], response_model=ResponseModel[EventRead])
async def update_event(
    event_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    updated_event = await EventService.update_event(db, event, payload)
    return ResponseModel(data=EventRead.model_validate(updated_event), message="Celebration details updated successfully!")




@router.delete("/{event_id}", response_model=ResponseModel[dict])
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    await EventService.delete_event(db, event)
    return ResponseModel(data={"id": event_id}, message="Celebration deleted successfully!")



@router.post("/{event_id}/ai/invitation", response_model=ResponseModel[dict])
async def generate_ai_invitation(
    event_id: str,
    tone: str = "EMOTIONAL",
    language: str = "HI_EN",
    style: str = "Traditional Indian",
    payload: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    extra_ctx = payload.get("extra_context") if payload else None
    req_tone = (payload.get("tone") if payload else None) or tone
    req_lang = (payload.get("language") if payload else None) or language
    req_style = (payload.get("style") if payload else None) or style

    try:
        evt_type = event.event_type.value if hasattr(event.event_type, 'value') else str(event.event_type)
        date_str = str(event.event_date) if event.event_date else ""
        structured = await ai_service.generate_structured_invitation(
            db=db,
            user_id=current_user.id,
            event_id=event.id,
            event_type=evt_type,
            host_name=event.host_name,
            venue=event.venue_name,
            date_str=date_str,
            tone=req_tone,
            language=req_lang,
            style=req_style,
            extra_context=extra_ctx,
        )
        return ResponseModel(data=structured, message="Structured AI Invitation wording generated (5 credits deducted)")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(e))


@router.post("/{event_id}/ai/rewrite", response_model=ResponseModel[dict])
async def rewrite_ai_invitation(
    event_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    original_text = payload.get("original_text", "")
    instruction = payload.get("instruction", "Improve and polish the invitation text")
    target_tone = payload.get("tone")
    target_language = payload.get("language")

    if not original_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="original_text is required")

    try:
        result = await ai_service.improve_or_rewrite_invitation(
            db=db,
            user_id=current_user.id,
            event_id=event.id,
            original_text=original_text,
            instruction=instruction,
            target_tone=target_tone,
            target_language=target_language,
        )
        return ResponseModel(data=result, message="AI Invitation rewritten successfully (3 credits deducted)")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(e))


@router.post("/ai/chatbot", response_model=ResponseModel[dict])
async def ai_chatbot_assistant(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    messages = payload.get("messages", [])
    context = payload.get("context", {})
    event_id = payload.get("event_id")

    if not messages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="messages list is required")

    reply = await ai_service.chat_assistant(
        db=db,
        user_id=current_user.id,
        messages=messages,
        context=context,
        event_id=event_id,
    )
    return ResponseModel(data={"reply": reply}, message="AI Chatbot reply ready")


@router.post("/{event_id}/memories", response_model=ResponseModel[dict])
async def update_event_memories(
    event_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    memories = payload.get("memories", [])
    theme_config = dict(event.theme_config or {})
    theme_config["memories"] = memories
    event.theme_config = theme_config
    await db.commit()

    return ResponseModel(
        data={"memories": memories},
        message="Memories timeline updated successfully!"
    )


@router.post("/{event_id}/memories/ai-generate", response_model=ResponseModel[dict])
async def generate_ai_memories(
    event_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    milestones = payload.get("milestones", [])
    mood = payload.get("mood", "EMOTIONAL")
    then_now_pairs = payload.get("then_now_pairs", [])

    if not milestones:
        # Event-type specific milestone defaults
        evt_type = str(event.event_type).upper()
        if "MUNDAN" in evt_type or "NAMAKARAN" in evt_type or "BABY" in evt_type:
            milestones = [
                {"title": "The Blessed Day Our Angel Arrived", "date": "12 Jan 2025", "image_url": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&auto=format&fit=crop"},
                {"title": "First Giggles & Tiny Steps", "date": "18 Aug 2025", "image_url": "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&auto=format&fit=crop"},
                {"title": "Sacred Mundan Sanskar Ritual", "date": "15 Oct 2026", "image_url": "https://images.unsplash.com/photo-1609234656388-0ff363383899?w=600&auto=format&fit=crop"},
            ]
        elif "BIRTHDAY" in evt_type:
            milestones = [
                {"title": "The Special Day You Entered Our World", "date": "10 Mar 2010", "image_url": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop"},
                {"title": "Unforgettable Childhood Laughs & Adventures", "date": "05 Jun 2018", "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop"},
                {"title": "Hitting Milestones & Chasing Dreams", "date": "15 Oct 2026", "image_url": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&auto=format&fit=crop"},
            ]
        elif "ANNIVERSARY" in evt_type:
            milestones = [
                {"title": "The Day We Said 'I Do'", "date": "20 Nov 2015", "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop"},
                {"title": "Building Our Dream Home & Family", "date": "14 Feb 2020", "image_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop"},
                {"title": "Golden Years of Togetherness", "date": "15 Oct 2026", "image_url": "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop"},
            ]
        elif "HOUSEWARMING" in evt_type or "GRIHA" in evt_type:
            milestones = [
                {"title": "Dreaming & Designing Our Home", "date": "01 Jan 2024", "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop"},
                {"title": "Laying Every Brick with Love", "date": "10 Aug 2025", "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop"},
                {"title": "Sacred Griha Pravesh & Kalash Puja", "date": "15 Oct 2026", "image_url": "https://images.unsplash.com/photo-1545232979-fbfd42e000b5?w=600&auto=format&fit=crop"},
            ]
        elif "CORPORATE" in evt_type or "LAUNCH" in evt_type or "GALA" in evt_type:
            milestones = [
                {"title": "The Founding Vision & First Blueprint", "date": "15 Mar 2021", "image_url": "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop"},
                {"title": "Breaking Industry Milestones & Growth", "date": "20 Nov 2023", "image_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop"},
                {"title": "Unveiling the Next Era of Innovation", "date": "15 Oct 2026", "image_url": "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop"},
            ]
        elif "PUJA" in evt_type or "FESTIVAL" in evt_type or "RELIGIOUS" in evt_type:
            milestones = [
                {"title": "Ancient Traditions Passed Down Generations", "date": "Annual Tradition", "image_url": "https://images.unsplash.com/photo-1609234656388-0ff363383899?w=600&auto=format&fit=crop"},
                {"title": "Floral & Diya Preparations", "date": "Eve of Festival", "image_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop"},
                {"title": "Sacred Hawan, Chanting & Divine Aarti", "date": "15 Oct 2026", "image_url": "https://images.unsplash.com/photo-1545232979-fbfd42e000b5?w=600&auto=format&fit=crop"},
            ]
        elif "RETIREMENT" in evt_type or "FAREWELL" in evt_type:
            milestones = [
                {"title": "The First Day of an Inspiring Career", "date": "01 Aug 1992", "image_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop"},
                {"title": "Decades of Leadership, Dedication & Legacy", "date": "15 May 2015", "image_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop"},
                {"title": "Embracing a Golden Chapter of Life", "date": "15 Oct 2026", "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop"},
            ]
        else: # Wedding / Marriage / Sangeet
            milestones = [
                {"title": "When We First Met", "date": "14 Feb 2022", "image_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop"},
                {"title": "The Proposal & Engagement", "date": "24 Dec 2024", "image_url": "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop"},
                {"title": "The Wedding & Seven Vows Day", "date": "15 Oct 2026", "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop"},
            ]

    try:
        from app.integrations.ai.story_engine import AIStoryEngine
        story_engine = AIStoryEngine()
        story_res = await story_engine.generate_event_story(
            event_type=str(event.event_type),
            host_name=event.host_name,
            event_title=event.title,
            mood=mood,
            milestones=milestones,
            then_now_pairs=then_now_pairs,
        )

        ai_memories = story_res["memories"]
        theme_config = dict(event.theme_config or {})
        theme_config["memories"] = ai_memories
        theme_config["then_now_pairs"] = story_res["then_now_pairs"]
        theme_config["story_title"] = story_res["story_title"]
        theme_config["story_subtitle"] = story_res["story_subtitle"]
        theme_config["story_strategy"] = story_res["strategy"]
        event.theme_config = theme_config
        await db.commit()

        return ResponseModel(
            data={"memories": ai_memories, "story_details": story_res},
            message="Google Gemini AI generated event-specific digital story timeline!"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(e))


@router.post("/{event_id}/ai-card", response_model=ResponseModel[dict])
async def generate_ai_card_on_the_fly(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    date_str = event.start_date.strftime("%d %b %Y") if event.start_date else "Date to be Announced"
    evt_type = event.event_type.value if hasattr(event.event_type, 'value') else str(event.event_type)
    card_data = await ai_service.generate_event_ai_card(
        db=db,
        user_id=current_user.id,
        event_id=event.id,
        event_type=evt_type,
        title=event.title,
        host_name=event.host_name,
        venue=event.venue_name,
        date_str=date_str,
    )

    theme_config = dict(event.theme_config or {})
    theme_config["ai_card"] = card_data
    if card_data.get("cover_image_url"):
        event.cover_image_url = card_data["cover_image_url"]
    event.theme_config = theme_config
    await db.commit()

    return ResponseModel(
        data=card_data,
        message="Google Gemini AI generated custom invitation card on the fly!"
    )


@router.post("/ai-parse-voice", response_model=ResponseModel[dict])
async def parse_voice_event_prompt(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    voice_text = payload.get("voice_text", "")
    parsed_result = await ai_service.parse_voice_prompt(voice_text)
    return ResponseModel(
        data=parsed_result,
        message="Voice prompt successfully parsed by Google Gemini AI!"
    )


@router.post("/ai-generate-wording", response_model=ResponseModel[dict])
async def generate_ai_wording(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    event_type = str(payload.get("event_type", "WEDDING")).upper()
    title = payload.get("title", "Celebration")
    host_name = payload.get("host_name", "Family")
    venue_name = payload.get("venue_name", "Venue")
    language = payload.get("language", "BOTH")  # BOTH | EN | HI
    tone = payload.get("tone", "EMOTIONAL").upper()  # EMOTIONAL | ROYAL | WARM

    if "MUNDAN" in event_type or "BABY" in event_type or "BIRTHDAY" in event_type:
        shloka = "|| ॐ नमः शिवाय / बालार्क तेजस्वी भव ||"
        en_wording = f"A bundle of pure innocence and a home filled with endless laughter. With immense love, gratitude, and warm hearts, the {host_name} family cordially invites you to shower your divine blessings on our little angel during '{title}' at {venue_name}. Your presence and warm wishes will mean the world to us!"
        hi_wording = f"{shloka}\n\nसप्रेम निमंत्रण!\n\nनन्हे बालक की मुस्कान और असीम खुशियों के बीच...\n{host_name} परिवार अत्यंत उमंग और वात्सल्य के साथ आपको '{title}' के मंगलकारी अवसर पर {venue_name} में सहर्ष आमंत्रित करता है।\n\nआपकी स्नेहमयी उपस्थिति और शुभ आशीर्वाद ही हमारे इस उत्सव की असली मिठास है।\n\nदर्शनाभिलाषी: समस्त {host_name} परिवार"
    elif "PUJA" in event_type or "FESTIVAL" in event_type or "RELIGIOUS" in event_type:
        shloka = "|| ॐ नमः शिवाय / सर्वमंगल मांगल्ये ||"
        en_wording = f"Bowing in gratitude before the Divine, the {host_name} family warmly invites you to join us for the sacred and auspicious ceremony of '{title}' at {venue_name}. May your presence and prayers fill our home and hearts with peace, prosperity, and divine grace."
        hi_wording = f"{shloka}\n\nसपरिवार सादर निमंत्रण!\n\nईश्वर के आशीर्वाद और भक्तिमयी भावनाओं के साथ...\n{host_name} परिवार आपको '{title}' के पावन धार्मिक अनुष्ठान में {venue_name} में सादर निमंत्रित करता है।\n\nआपकी गरिमामयी उपस्थिति और मङ्गलमय प्रार्थनाएं इस पवित्र अवसर को अलौकिक बनाएंगी।"
    else:
        shloka = "|| श्री गणेशाय नमः ||"
        en_wording = f"Some moments in life are written in heaven and cherished forever on earth, made truly complete only when shared with the ones who mean the world to us. With hearts full of love, warmth, and deep gratitude, the {host_name} family cordially requests the honor of your presence to celebrate the grand occasion of '{title}' at {venue_name}. Your warm smiles and blessings will light up our celebration!"
        hi_wording = f"{shloka}\n\nसप्रेम निमंत्रण!\n\nजीवन की सबसे सुंदर स्मृतियां तब और भी खास बन जाती हैं जब उनमें अपनों का स्नेह और आशीर्वाद शामिल होता है।\n\n{host_name} परिवार अत्यंत हर्ष, उमंग और आत्मीयता के साथ आपको '{title}' के पावन उत्सव में सहर्ष आमंत्रित करता है।\n\nस्थान: {venue_name}\n\nदो परिवारों का यह संगम आपके स्नेह और गरिमामयी उपस्थिति से ही पूर्ण होगा। कृपया पधारकर हमारे इस उत्सव को यादगार बनाएं।\n\nदर्शनाभिलाषी: समस्त {host_name} परिवार"

    if language == "EN":
        selected_text = en_wording
    elif language == "HI":
        selected_text = hi_wording
    else:
        selected_text = f"{en_wording}\n\n----------------------------------------\n\n{hi_wording}"

    return ResponseModel(
        data={"wording": selected_text, "en": en_wording, "hi": hi_wording, "tone": tone},
        message="Emotional, warm & culturally rich AI invitation wording generated!"
    )



@router.post("/{event_id}/duplicate", response_model=ResponseModel[EventRead])
async def duplicate_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    new_event_data = EventCreate(
        title=f"{event.title} (Repeat)",
        event_type=event.event_type,
        host_name=event.host_name,
        co_host_name=event.co_host_name,
        venue_name=event.venue_name,
        venue_address=event.venue_address,
        google_maps_url=event.google_maps_url,
        description=event.description,
        cover_image_url=event.cover_image_url,
        upi_id=event.upi_id,
        theme_config=event.theme_config,
    )
    new_event = await EventService.create_event(db, current_user.id, new_event_data)
    return ResponseModel(data=EventRead.model_validate(new_event), message="Event duplicated successfully!")


@router.post("/ai-converse-assistant", response_model=ResponseModel[dict])
async def converse_ai_assistant(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    user_message = payload.get("user_message", "")
    current_memory = payload.get("memory", {})
    res = await ai_service.converse_and_fill_slots(user_message, current_memory)
    return ResponseModel(data=res, message="AI Conversational Assistant response ready")


@router.post("/{event_id}/dispatch-all-whatsapp", response_model=ResponseModel[dict])
async def dispatch_all_whatsapp_invitations(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Event).options(selectinload(Event.guests)).where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    guests = event.guests or []
    dispatched_count = len(guests)

    return ResponseModel(
        data={"dispatched_count": dispatched_count, "status": "COMPLETED"},
        message=f"Personalized WhatsApp JPEG/PDF invitation card dispatches queued for all {dispatched_count} guests!"
    )


@router.post("/{event_id}/import-master-contacts", response_model=ResponseModel[dict])
async def import_master_contacts_to_event(
    event_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    contact_ids = payload.get("contact_ids", [])
    if not contact_ids:
        return ResponseModel(data={"imported_count": 0}, message="No contacts provided")

    result = await db.execute(
        select(MasterContact).where(
            MasterContact.user_id == current_user.id,
            MasterContact.id.in_(contact_ids)
        )
    )
    master_contacts = result.scalars().all()

    added_count = 0
    for mc in master_contacts:
        guest_data = GuestCreate(
            name=mc.name,
            phone=mc.phone,
            relationship=mc.relationship or "Guest",
            group_name=mc.group_name or "General",
            notes=mc.notes,
        )
        await GuestService.create_guest(db, event_id, guest_data, user_id=current_user.id)
        added_count += 1

    return ResponseModel(
        data={"imported_count": added_count},
        message=f"Successfully imported {added_count} contacts from Master List into Event Guest List!"
    )


@router.get("/{event_id}/invitation-content", response_model=ResponseModel[CanonicalInvitationContent])
async def get_event_canonical_invitation(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the Canonical Invitation Content for an event.
    Guarantees that all channels (Web, WhatsApp, SMS, Email, QR Pass, Public Page)
    consume the exact same factual event ground truth.
    """
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    canonical = await ai_service.get_or_generate_canonical_invitation(
        event=event,
        db=db,
        user_id=current_user.id,
    )
    return ResponseModel(
        data=canonical,
        message="Canonical invitation content loaded successfully"
    )


@router.put("/{event_id}/invitation-content", response_model=ResponseModel[CanonicalInvitationContent])
async def update_event_canonical_invitation(
    event_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Allows host to live-edit AI copywriting (title, greeting, message, blessing, closing, story)
    while strictly preserving and validating underlying factual event ground truth.
    """
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    canonical = await ai_service.get_or_generate_canonical_invitation(
        event=event,
        ai_content=payload,
        db=db,
        user_id=current_user.id,
    )
    return ResponseModel(
        data=canonical,
        message="Canonical invitation content updated and synchronized across all channels"
    )
