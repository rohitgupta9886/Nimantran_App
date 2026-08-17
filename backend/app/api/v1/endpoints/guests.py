from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.schemas.common import ResponseModel
from app.schemas.guest import GuestCreate, GuestRead, GuestUpdate
from app.services.guest_service import GuestService
from app.services.event_service import EventService
from app.services.ai_service import AIService
from app.integrations.whatsapp.mock_whatsapp import MockWhatsAppProvider
from app.core.config import settings
from app.models.user import User

router = APIRouter()
ai_service = AIService()
whatsapp_provider = MockWhatsAppProvider()


@router.post("/events/{event_id}/guests", response_model=ResponseModel[GuestRead])
async def create_guest(
    event_id: str,
    data: GuestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    guest = await GuestService.create_guest(db, event_id, data, user_id=current_user.id)
    return ResponseModel(data=GuestRead.model_validate(guest), message="Guest added successfully!")


@router.post("/events/{event_id}/guests/bulk", response_model=ResponseModel[dict])
async def bulk_create_guests(
    event_id: str,
    guests_data: List[GuestCreate],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    created = 0
    for g_data in guests_data:
        await GuestService.create_guest(db, event_id, g_data)
        created += 1

    return ResponseModel(
        data={"imported_count": created},
        message=f"Successfully imported {created} mobile contacts into your guest list!",
    )


@router.get("/events/{event_id}/guests", response_model=ResponseModel[List[GuestRead]])
async def list_guests(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    guests = await GuestService.get_event_guests(db, event_id)
    return ResponseModel(data=[GuestRead.model_validate(g) for g in guests])


@router.put("/events/{event_id}/guests/{guest_id}", response_model=ResponseModel[GuestRead])
async def update_guest(
    event_id: str,
    guest_id: str,
    data: GuestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    updated = await GuestService.update_guest(db, guest_id, data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    return ResponseModel(data=GuestRead.model_validate(updated), message="Guest details updated successfully!")


@router.delete("/events/{event_id}/guests/{guest_id}", response_model=ResponseModel[dict])
async def delete_guest(
    event_id: str,
    guest_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    success = await GuestService.delete_guest(db, guest_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
    return ResponseModel(data={"deleted": True}, message="Guest removed from celebration list!")


@router.post("/events/{event_id}/guests/import", response_model=ResponseModel[dict])
async def import_guests_file(
    event_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    file_bytes = await file.read()
    parsed = await GuestService.parse_csv_or_excel(file_bytes, file.filename)
    
    created_count = 0
    for item in parsed:
        guest_data = GuestCreate(
            name=item["name"],
            phone=item.get("phone"),
            email=item.get("email"),
            group_name=item.get("group_name", "General"),
            relationship=item.get("relationship", "Guest"),
            adults_count=item.get("adults_count", 1),
            children_count=item.get("children_count", 0),
        )
        await GuestService.create_guest(db, event_id, guest_data)
        created_count += 1

    return ResponseModel(
        data={"total_imported": created_count},
        message=f"Successfully imported {created_count} guests from {file.filename}!",
    )


@router.post("/events/{event_id}/guests/{guest_id}/bilingual-card", response_model=ResponseModel[dict])
async def generate_bilingual_wording(
    event_id: str,
    guest_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    guest = await GuestService.get_guest_by_id(db, guest_id)
    if not guest or guest.event_id != event.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")

    date_str = event.start_date.strftime("%d %B %Y, %I:%M %p")
    invitation_url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/i/{event.slug or event.id}"

    bilingual_data = await ai_service.generate_bilingual_invitation_card(
        db=db,
        user_id=current_user.id,
        event_id=event_id,
        guest_name=guest.name,
        event_title=event.title,
        host_name=event.host_name,
        venue=event.venue_name,
        date_str=date_str,
        invitation_link=invitation_url,
    )

    return ResponseModel(
        data={
            "guest_id": guest.id,
            "guest_name": guest.name,
            "hindi_text": bilingual_data.get("hindi_text"),
            "english_text": bilingual_data.get("english_text"),
            "full_bilingual": bilingual_data.get("full_bilingual"),
            "invitation_url": invitation_url,
        },
        message="Bilingual (Hindi First + English Second) AI invitation card generated!"
    )


@router.post("/events/{event_id}/guests/{guest_id}/personalized-wording", response_model=ResponseModel[dict])
async def generate_personalized_wording(

    event_id: str,
    guest_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    guest = await GuestService.get_guest_by_id(db, guest_id)
    if not guest or guest.event_id != event.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")

    date_str = event.start_date.strftime("%d %B %Y, %I:%M %p")
    invitation_url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/i/{event.slug or event.id}"

    wording = await ai_service.generate_personalized_guest_invitation(
        db=db,
        user_id=current_user.id,
        event_id=event_id,
        guest_name=guest.name,
        event_title=event.title,
        host_name=event.host_name,
        venue=event.venue_name,
        date_str=date_str,
        invitation_link=invitation_url,
    )

    return ResponseModel(
        data={
            "guest_id": guest.id,
            "guest_name": guest.name,
            "personalized_text": wording,
            "invitation_url": invitation_url,
        },
        message="Personalized AI invitation wording generated using Google Gemini AI (3 credits deducted)"
    )


@router.post("/events/{event_id}/guests/{guest_id}/send-whatsapp", response_model=ResponseModel[dict])
async def send_whatsapp_invitation(
    event_id: str,
    guest_id: str,
    payload: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    guest = await GuestService.get_guest_by_id(db, guest_id)
    if not guest or guest.event_id != event.id or not guest.phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Guest not found or phone number missing")

    body = payload or {}
    card_format = (body.get("card_format") or body.get("format") or "JPEG").upper()
    media_type = "DOCUMENT" if card_format == "PDF" else "IMAGE"
    
    # 1. Synthesize AI Card on the fly for this specific event & guest
    date_str = event.start_date.strftime("%d %b %Y") if event.start_date else "Date to be Announced"
    evt_type = event.event_type.value if hasattr(event.event_type, 'value') else str(event.event_type)
    
    ai_card = await ai_service.generate_event_ai_card(
        db=db,
        user_id=current_user.id,
        event_id=event.id,
        event_type=evt_type,
        title=event.title,
        host_name=event.host_name,
        venue=event.venue_name,
        date_str=date_str,
    )

    cover_image = body.get("cover_image_url") or ai_card.get("cover_image_url") or event.cover_image_url or "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop"
    
    invitation_url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/i/{event.slug or event.id}"
    custom_caption = body.get("personalized_caption") or (
        f"✨ *{ai_card.get('shloka_header', '|| श्री गणेशाय नमः ||')}*\n\n"
        f"Dear {guest.name},\n"
        f"{ai_card.get('english_invitation', 'Together with our families, we cordially invite you.')}\n\n"
        f"📅 Date: {date_str}\n"
        f"📍 Venue: {event.venue_name}\n"
        f"🔑 Gate Pass Code: *{guest.pass_code or 'NIM-ENTRY-PASS'}*\n\n"
        f"👉 View & Download AI Invitation: {invitation_url}"
    )

    res = await whatsapp_provider.send_invitation_card(
        recipient_phone=guest.phone,
        guest_name=guest.name,
        event_title=event.title,
        invitation_link=invitation_url,
        cover_image_url=cover_image,
        media_type=media_type,
        personalized_caption=custom_caption,
        card_format=card_format,
    )

    return ResponseModel(
        data=res,
        message=f"AI Generated {card_format} Media Invitation Card sent to {guest.name} ({guest.phone}) on WhatsApp!"
    )



@router.post("/events/{event_id}/guests/{guest_id}/send-sms", response_model=ResponseModel[dict])
async def send_sms_invitation(
    event_id: str,
    guest_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    guest = await GuestService.get_guest_by_id(db, guest_id)
    if not guest or guest.event_id != event.id or not guest.phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Guest not found or phone number missing")

    invitation_url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/i/{event.slug or event.id}"
    sms_text = f"Dear {guest.name}, {event.host_name} cordially invites you to {event.title} on {event.start_date.strftime('%b %d')}. View your invitation & entry pass: {invitation_url}"

    return ResponseModel(
        data={
            "success": True,
            "recipient": guest.phone,
            "sms_text": sms_text,
            "status": "DISPATCHED",
        },
        message=f"Personalized SMS Invitation dispatched to {guest.name} ({guest.phone})!"
    )

