from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.wish import ModerationStatus
from app.schemas.common import ResponseModel
from app.schemas.memory import (
    CelebrationWishRead,
    CelebrationWishUpdate,
    MemoryItemRead,
    MemoryItemUpdate,
    CelebrationStoryGenerateRequest,
    CelebrationStoryResponse,
    AICaptionRequest,
    AICaptionResponse,
    AIThankYouRequest,
    AIThankYouResponse,
)
from app.services.memory_service import MemoryService
from app.services.ai_service import ai_service


router = APIRouter()


async def _verify_event_ownership(event_id: str, current_user: User, db: AsyncSession) -> Event:
    """Verifies that the current user owns the event or is a platform admin."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    if event.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized: You do not own this event.")
    return event


# ==========================================
# HOST WISHES MODERATION ENDPOINTS
# ==========================================

@router.get("/events/{event_id}/wishes", response_model=ResponseModel[List[CelebrationWishRead]])
async def get_event_wishes(
    event_id: str,
    status_filter: Optional[str] = Query(None, description="Filter by PENDING, APPROVED, REJECTED"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host endpoint: List all guest wishes with optional moderation status filtering."""
    await _verify_event_ownership(event_id, current_user, db)
    wishes = await MemoryService.get_wishes_for_host(db, event_id, status_filter)
    return ResponseModel(
        data=[CelebrationWishRead.model_validate(w) for w in wishes],
        message=f"Retrieved {len(wishes)} wishes successfully."
    )


@router.patch("/events/{event_id}/wishes/{wish_id}", response_model=ResponseModel[CelebrationWishRead])
async def moderate_event_wish(
    event_id: str,
    wish_id: str,
    payload: CelebrationWishUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host endpoint: Approve, Reject, or Feature a guest wish."""
    await _verify_event_ownership(event_id, current_user, db)
    updated = await MemoryService.moderate_wish(
        db=db,
        wish_id=wish_id,
        event_id=event_id,
        user_id=current_user.id,
        new_status=payload.status,
        is_featured=payload.is_featured,
    )
    return ResponseModel(
        data=CelebrationWishRead.model_validate(updated),
        message=f"Wish updated successfully (Status: {updated.status.value})."
    )


@router.delete("/events/{event_id}/wishes/{wish_id}", response_model=ResponseModel[dict])
async def delete_event_wish(
    event_id: str,
    wish_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host endpoint: Permanently delete a guest wish."""
    await _verify_event_ownership(event_id, current_user, db)
    await MemoryService.delete_wish(db, wish_id, event_id)
    return ResponseModel(data={"deleted": True, "id": wish_id}, message="Wish deleted successfully.")


# ==========================================
# HOST MEMORIES / PHOTOS MODERATION ENDPOINTS
# ==========================================

@router.get("/events/{event_id}/memories", response_model=ResponseModel[List[MemoryItemRead]])
async def get_event_memories(
    event_id: str,
    status_filter: Optional[str] = Query(None, description="Filter by PENDING, APPROVED, REJECTED"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host endpoint: List all photo memories with optional moderation status filtering."""
    await _verify_event_ownership(event_id, current_user, db)
    memories = await MemoryService.get_memories_for_host(db, event_id, status_filter)
    return ResponseModel(
        data=[MemoryItemRead.model_validate(m) for m in memories],
        message=f"Retrieved {len(memories)} photo memories successfully."
    )


@router.post("/events/{event_id}/memories/upload", response_model=ResponseModel[MemoryItemRead])
async def host_upload_memory_photo(
    event_id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    is_featured: Optional[bool] = Form(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host endpoint: Direct photo upload by the event host (auto-approved)."""
    event = await _verify_event_ownership(event_id, current_user, db)
    
    file_bytes = await file.read()
    media_url, file_size, mime_type = await MemoryService.upload_memory_photo(
        file_bytes=file_bytes,
        filename=file.filename or "photo.jpg",
        content_type=file.content_type or "image/jpeg"
    )

    item = await MemoryService.create_memory_item(
        db=db,
        event_id=event.id,
        media_url=media_url,
        caption=caption,
        uploaded_by_name=current_user.full_name or "Host",
        status=ModerationStatus.APPROVED,
        is_featured=is_featured or False,
        file_size_bytes=file_size,
        mime_type=mime_type,
    )
    return ResponseModel(
        data=MemoryItemRead.model_validate(item),
        message="Photo uploaded and published successfully."
    )


@router.patch("/events/{event_id}/memories/{item_id}", response_model=ResponseModel[MemoryItemRead])
async def moderate_event_memory(
    event_id: str,
    item_id: str,
    payload: MemoryItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host endpoint: Approve, Reject, or Feature a memory photo."""
    await _verify_event_ownership(event_id, current_user, db)
    updated = await MemoryService.moderate_memory_item(
        db=db,
        item_id=item_id,
        event_id=event_id,
        new_status=payload.status,
        is_featured=payload.is_featured,
        caption=payload.caption,
    )
    return ResponseModel(
        data=MemoryItemRead.model_validate(updated),
        message=f"Memory photo updated successfully (Status: {updated.status.value})."
    )


@router.delete("/events/{event_id}/memories/{item_id}", response_model=ResponseModel[dict])
async def delete_event_memory(
    event_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host endpoint: Permanently delete a memory photo and remove its physical file."""
    await _verify_event_ownership(event_id, current_user, db)
    await MemoryService.delete_memory_item(db, item_id, event_id)
    return ResponseModel(data={"deleted": True, "id": item_id}, message="Memory photo deleted successfully.")


# ==========================================
# POST-EVENT AI CELEBRATION STORY & CAPTIONS
# ==========================================

@router.post("/events/{event_id}/celebration-story", response_model=ResponseModel[CelebrationStoryResponse])
async def create_event_celebration_story(
    event_id: str,
    payload: CelebrationStoryGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Post-Event AI: Generates a grounded, factual celebration summary derived from approved wishes, memories, and actual attendance."""
    event = await _verify_event_ownership(event_id, current_user, db)
    
    story_data = await MemoryService.generate_grounded_celebration_story(
        db=db,
        event_id=event.id,
        user_id=current_user.id,
        style=payload.style or "EMOTIONAL_ROYAL",
    )
    return ResponseModel(
        data=CelebrationStoryResponse.model_validate(story_data),
        message="Celebration Story generated successfully based on factual event data."
    )


@router.post("/events/{event_id}/memories/ai-caption", response_model=ResponseModel[AICaptionResponse])
async def generate_ai_memory_caption(
    event_id: str,
    payload: AICaptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI helper: Generates an emotional bilingual photo caption."""
    event = await _verify_event_ownership(event_id, current_user, db)
    evt_type = event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type)

    caption_res = await ai_service.generate_memory_caption(
        db=db,
        user_id=current_user.id,
        event_id=event.id,
        event_type=evt_type,
        milestone_or_tag=payload.milestone_or_tag or "Celebration Moment",
        guest_name=payload.guest_name,
    )
    return ResponseModel(
        data=AICaptionResponse.model_validate(caption_res),
        message="Memory caption generated successfully."
    )


@router.post("/events/{event_id}/memories/ai-thank-you", response_model=ResponseModel[AIThankYouResponse])
async def generate_ai_thank_you_note(
    event_id: str,
    payload: AIThankYouRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI helper: Generates grounded post-event thank you message based on verified attendance."""
    event = await _verify_event_ownership(event_id, current_user, db)
    
    # Get attendance facts
    from app.models.guest import Guest
    from sqlalchemy import select
    res = await db.execute(select(Guest).where(Guest.event_id == event.id))
    all_guests = list(res.scalars().all())
    checked_in = sum(1 for g in all_guests if g.checked_in)

    event_facts = {
        "title": event.title,
        "host_name": event.host_name or "Host Family",
    }
    attendance_summary = {
        "total_guests": len(all_guests),
        "checked_in_count": checked_in,
    }

    thank_you_res = await ai_service.generate_attendance_thank_you(
        db=db,
        user_id=current_user.id,
        event_id=event.id,
        event_facts=event_facts,
        attendance_summary=attendance_summary,
    )
    return ResponseModel(
        data=AIThankYouResponse.model_validate(thank_you_res),
        message="Grounded thank-you message generated successfully."
    )
