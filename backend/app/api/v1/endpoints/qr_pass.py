from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user_optional
from app.models.user import User
from app.schemas.common import ResponseModel
from app.schemas.qr_pass import ScanVerifyRequest, CheckinResponse
from app.services.qr_service import QRService
from app.services.welcome_service import welcome_manager

router = APIRouter()


@router.post("/scanner/verify", response_model=ResponseModel[CheckinResponse])
async def verify_and_checkin_pass(
    data: ScanVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    try:
        res = await QRService.verify_and_checkin(
            db,
            pass_code=data.pass_code,
            expected_event_id=data.event_id,
            current_user_id=current_user.id if current_user else None,
            scanned_by_id=current_user.id if current_user else None,
            location_name=data.location_name,
            check_in_method=data.check_in_method or "QR_SCAN",
        )

        # Broadcast WebSocket message to Smart Welcome Screen TV/LED displays!
        ws_payload = {
            "type": "guest_checked_in",
            "guest_name": res.guest_name,
            "event_title": res.event_title,
            "relationship": res.relationship or "Honored Guest",
            "adults_count": res.adults_count,
            "children_count": res.children_count,
            "welcome_quote": res.welcome_quote,
            "already_checked_in": res.already_checked_in,
            "timestamp": res.checked_in_at.isoformat() if res.checked_in_at else None,
        }
        
        # Broadcast to all connected TV screens for this specific event
        if hasattr(res, "event_id") and res.event_id:
            await welcome_manager.broadcast_checkin(res.event_id, ws_payload)

        return ResponseModel(data=res, message=res.message)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
