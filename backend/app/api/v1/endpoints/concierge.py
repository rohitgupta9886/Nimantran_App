from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import ResponseModel
from app.schemas.concierge import (
    ConciergeChatRequest,
    ConciergeChatResponse,
    ConciergeConfirmActionRequest,
)
from app.services.concierge_service import ConciergeService

router = APIRouter(prefix="/concierge", tags=["AI Event Concierge"])


@router.post("/chat", response_model=ResponseModel[ConciergeChatResponse])
async def concierge_chat(
    payload: ConciergeChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 13: Intelligent AI Concierge Endpoint.
    Translates natural language into structured actions, enforces permission boundaries,
    gates expensive/destructive actions with host confirmation, and delegates to application APIs.
    """
    response = await ConciergeService.process_chat(
        db=db,
        user=current_user,
        message=payload.message,
        event_id=payload.event_id,
        thread_id=payload.thread_id or "default_concierge_thread",
        confirmed_action_id=payload.confirmed_action_id,
        confirmed=payload.confirmed,
    )
    return ResponseModel(
        data=response,
        message="Concierge turn processed successfully"
    )


@router.post("/confirm-action", response_model=ResponseModel[ConciergeChatResponse])
async def confirm_concierge_action(
    payload: ConciergeConfirmActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Explicit execution endpoint for high-impact actions confirmed by the host.
    """
    response = await ConciergeService.process_chat(
        db=db,
        user=current_user,
        message="CONFIRM",
        event_id=payload.event_id,
        confirmed_action_id=payload.action_id,
        confirmed=payload.confirmed,
    )
    return ResponseModel(
        data=response,
        message="Action confirmed and processed successfully"
    )
