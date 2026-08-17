from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.event import Event
from app.models.guest import Guest, RSVPStatus
from app.models.campaign import (
    Campaign,
    BroadcastMessage,
    CampaignStatus,
    CampaignChannel,
    MessageDeliveryStatus,
)
from app.schemas.common import ResponseModel
from app.services.campaign_service import (
    CampaignService,
    DEFAULT_WHATSAPP_TEMPLATE,
    DEFAULT_SMS_TEMPLATE,
    DEFAULT_EMAIL_SUBJECT,
)
from app.services.campaign_worker import multi_channel_worker
from app.services.whatsapp import get_whatsapp_provider
from app.services.sms import get_sms_provider
from app.services.email import get_email_provider
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


from pydantic import BaseModel, Field, field_validator


class CreateCampaignRequest(BaseModel):
    event_id: str
    title: Optional[str] = "Celebration Invitation Broadcast"
    channels: List[str] = ["WHATSAPP"]  # ["WHATSAPP", "SMS", "EMAIL"]
    guest_ids: Optional[List[Any]] = None
    target_audience: str = "ALL"  # ALL, UNSENT_ONLY, PENDING_RSVP, CONFIRMED, VIP
    custom_whatsapp_message: Optional[str] = None
    custom_sms_message: Optional[str] = None
    custom_email_subject: Optional[str] = None
    custom_email_message: Optional[str] = None
    ai_personalized_copies: Optional[Dict[str, str]] = None
    idempotency_key: Optional[str] = None

    @field_validator("guest_ids", mode="before")
    @classmethod
    def sanitize_guest_ids(cls, v):
        if not v:
            return None
        if isinstance(v, list):
            cleaned = [str(x).strip() for x in v if x is not None and str(x).strip() and str(x) != "undefined" and str(x) != "null"]
            return cleaned if cleaned else None
        return None



class PreviewRequest(BaseModel):
    event_id: str
    channel: str = "WHATSAPP"  # WHATSAPP, SMS, EMAIL
    guest_id: Optional[str] = None
    custom_template: Optional[str] = None
    custom_subject: Optional[str] = None


class AiPersonalizeRequest(BaseModel):
    event_id: str
    guest_ids: List[str]
    tone: str = "warm_royal"


@router.get("/broadcast/providers-status", response_model=ResponseModel[dict])
async def get_providers_status(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the real infrastructure configuration status for WhatsApp, SMS, and Email providers.
    """
    wa_provider = get_whatsapp_provider()
    sms_provider = get_sms_provider()
    email_provider = get_email_provider()

    wa_status = await wa_provider.validate_configuration()
    sms_status = await sms_provider.validate_configuration()
    email_status = await email_provider.validate_configuration()

    is_dev_mode = (
        getattr(settings, "WHATSAPP_PROVIDER", "MOCK") == "MOCK"
        or getattr(settings, "SMS_PROVIDER", "MOCK") == "MOCK"
        or getattr(settings, "EMAIL_PROVIDER", "MOCK") == "MOCK"
    )

    return ResponseModel(
        data={
            "is_dev_mode": is_dev_mode,
            "whatsapp": {
                "is_configured": wa_status.is_configured,
                "provider_name": wa_status.provider_name,
                "message": wa_status.message,
                "missing_keys": wa_status.missing_keys,
            },
            "sms": {
                "is_configured": sms_status.is_configured,
                "provider_name": sms_status.provider_name,
                "sender_id": sms_status.sender_id,
                "message": sms_status.message,
                "missing_keys": sms_status.missing_keys,
            },
            "email": {
                "is_configured": email_status.is_configured,
                "provider_name": email_status.provider_name,
                "from_email": email_status.from_email,
                "from_name": email_status.from_name,
                "message": email_status.message,
                "missing_keys": email_status.missing_keys,
            },
        },
        message="Broadcast providers status retrieved.",
    )


@router.get("/events/{event_id}/broadcast/eligibility", response_model=ResponseModel[dict])
async def get_broadcast_eligibility(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Inspects guest list for an event and calculates channel-specific eligibility (WhatsApp, SMS, Email).
    """
    event_stmt = select(Event).where(Event.id == event_id)
    event_res = await db.execute(event_stmt)
    event = event_res.scalars().first()
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    guest_stmt = select(Guest).where(Guest.event_id == event_id)
    guest_res = await db.execute(guest_stmt)
    guests = guest_res.scalars().all()

    total_guests = len(guests)
    whatsapp_eligible = sum(1 for g in guests if g.phone and len("".join(filter(str.isdigit, str(g.phone)))) >= 8)
    sms_eligible = sum(1 for g in guests if g.phone and len("".join(filter(str.isdigit, str(g.phone)))) >= 8)
    email_eligible = sum(1 for g in guests if g.email and "@" in g.email and "." in g.email.split("@")[-1])

    unsent_count = sum(1 for g in guests if not g.delivery_status or g.delivery_status in ("NOT_SENT", "FAILED"))
    delivered_count = sum(1 for g in guests if g.delivery_status in ("DELIVERED", "READ", "SENT"))

    return ResponseModel(
        data={
            "total_guests": total_guests,
            "whatsapp_eligible_count": whatsapp_eligible,
            "sms_eligible_count": sms_eligible,
            "email_eligible_count": email_eligible,
            "unsent_count": unsent_count,
            "delivered_count": delivered_count,
            "default_templates": {
                "whatsapp": DEFAULT_WHATSAPP_TEMPLATE,
                "sms": DEFAULT_SMS_TEMPLATE,
                "email_subject": DEFAULT_EMAIL_SUBJECT,
                "email_body": "We would be delighted to have you celebrate with us.",
            },
        },
        message="Guest broadcast eligibility calculated.",
    )


@router.post("/events/{event_id}/broadcast/preview", response_model=ResponseModel[dict])
async def preview_broadcast_message(
    event_id: str,
    req: PreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Renders personalized message preview for a selected channel and sample guest.
    """
    event_stmt = select(Event).where(Event.id == event_id)
    event_res = await db.execute(event_stmt)
    event = event_res.scalars().first()
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Pick specified guest or first event guest
    guest = None
    if req.guest_id:
        g_stmt = select(Guest).where(Guest.id == req.guest_id, Guest.event_id == event_id)
        g_res = await db.execute(g_stmt)
        guest = g_res.scalars().first()

    if not guest:
        g_stmt = select(Guest).where(Guest.event_id == event_id).limit(1)
        g_res = await db.execute(g_stmt)
        guest = g_res.scalars().first()

    # If no guests, mock sample
    if not guest:
        guest = Guest(
            id="sample_guest_01",
            event_id=event.id,
            name="Rohit Sharma",
            phone="+919876543210",
            email="rohit.sharma@example.com",
            relationship="Family Friend",
            invitation_token="nim_sample_preview",
        )

    inv_url = CampaignService.generate_personalized_invitation_url(event, guest)
    rsvp_url = CampaignService.generate_rsvp_url(event, guest)

    channel = req.channel.upper()

    if channel == "WHATSAPP":
        tmpl = req.custom_template or DEFAULT_WHATSAPP_TEMPLATE
        rendered = CampaignService.render_template_message(tmpl, event, guest, inv_url, rsvp_url)
        return ResponseModel(
            data={"channel": "WHATSAPP", "rendered_text": rendered, "invitation_url": inv_url, "guest_name": guest.name},
            message="WhatsApp preview generated.",
        )

    elif channel == "SMS":
        tmpl = req.custom_template or DEFAULT_SMS_TEMPLATE
        rendered = CampaignService.render_template_message(tmpl, event, guest, inv_url, rsvp_url)
        return ResponseModel(
            data={"channel": "SMS", "rendered_text": rendered, "invitation_url": inv_url, "guest_name": guest.name},
            message="SMS preview generated.",
        )

    elif channel == "EMAIL":
        subj_tmpl = req.custom_subject or DEFAULT_EMAIL_SUBJECT
        body_tmpl = req.custom_template or "We would be delighted to have you celebrate with us."
        rendered_subj = CampaignService.render_template_message(subj_tmpl, event, guest, inv_url, rsvp_url)
        rendered_body = CampaignService.render_template_message(body_tmpl, event, guest, inv_url, rsvp_url)

        start_dt = event.start_date
        date_str = start_dt.strftime("%A, %d %B %Y") if start_dt else "TBA"
        time_str = start_dt.strftime("%I:%M %p") if start_dt else "TBA"

        html_body, text_body = render_luxury_invitation_email(
            guest_name=guest.name,
            event_title=event.title,
            host_name=event.host_name,
            event_date=date_str,
            event_time=time_str,
            venue_name=event.venue_name,
            venue_address=event.venue_address,
            invitation_url=inv_url,
            rsvp_url=rsvp_url,
            personal_message=rendered_body,
            event_type=event.event_type,
        )
        return ResponseModel(
            data={
                "channel": "EMAIL",
                "subject": rendered_subj,
                "rendered_html": html_body,
                "rendered_text": text_body,
                "invitation_url": inv_url,
                "guest_name": guest.name,
            },
            message="Email preview generated.",
        )

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported channel: {channel}")


@router.post("/events/{event_id}/broadcast/ai-personalize", response_model=ResponseModel[dict])
async def ai_personalize_copies(
    event_id: str,
    req: AiPersonalizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates AI personalized invitation copies for selected guests.
    """
    event_stmt = select(Event).where(Event.id == event_id)
    event_res = await db.execute(event_stmt)
    event = event_res.scalars().first()
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    g_stmt = select(Guest).where(Guest.id.in_(req.guest_ids), Guest.event_id == event_id)
    g_res = await db.execute(g_stmt)
    guests = g_res.scalars().all()

    copies = await CampaignService.generate_ai_personalized_batch(
        event=event,
        guests=guests,
        ai_service=ai_service,
        tone=req.tone,
    )

    return ResponseModel(
        data={"copies": copies, "total_generated": len(copies)},
        message="AI personalized messages generated successfully.",
    )


@router.post("/campaigns", response_model=ResponseModel[dict])
async def create_campaign(
    req: CreateCampaignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a multi-channel broadcast campaign and initiates delivery in background queue.
    """
    event_stmt = select(Event).where(Event.id == req.event_id)
    event_res = await db.execute(event_stmt)
    event = event_res.scalars().first()
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    try:
        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=req.event_id,
            user_id=current_user.id,
            channels=req.channels,
            title=req.title or f"{event.title} Broadcast",
            guest_ids=req.guest_ids,
            target_audience=req.target_audience,
            custom_whatsapp_message=req.custom_whatsapp_message,
            custom_sms_message=req.custom_sms_message,
            custom_email_subject=req.custom_email_subject,
            custom_email_message=req.custom_email_message,
            ai_personalized_copies=req.ai_personalized_copies,
            idempotency_key=req.idempotency_key,
        )

        return ResponseModel(
            data={
                "campaign_id": campaign.id,
                "title": campaign.title,
                "status": campaign.status,
                "channels": campaign.channels_list,
                "total_recipients": campaign.total_recipients,
                "queued_count": campaign.queued_count,
            },
            message=f"Broadcast Campaign '{campaign.title}' created and enqueued for delivery.",
        )
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))


@router.get("/campaigns/{campaign_id}", response_model=ResponseModel[dict])
async def get_campaign_detail(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves real-time status and statistics for a broadcast campaign.
    """
    stmt = (
        select(Campaign)
        .join(Event, Campaign.event_id == Event.id)
        .where(Campaign.id == campaign_id, Event.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    campaign = res.scalars().first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Get channel-specific breakdown
    msg_stmt = select(BroadcastMessage.channel, BroadcastMessage.status).where(BroadcastMessage.campaign_id == campaign_id)
    msg_res = await db.execute(msg_stmt)
    rows = msg_res.all()

    channel_stats: Dict[str, Dict[str, int]] = {
        "WHATSAPP": {"total": 0, "delivered": 0, "sent": 0, "read": 0, "failed": 0, "queued": 0},
        "SMS": {"total": 0, "delivered": 0, "sent": 0, "read": 0, "failed": 0, "queued": 0},
        "EMAIL": {"total": 0, "delivered": 0, "sent": 0, "read": 0, "failed": 0, "queued": 0},
    }

    for ch, st in rows:
        ch_str = str(ch.value if hasattr(ch, "value") else ch).upper()
        if ch_str not in channel_stats:
            channel_stats[ch_str] = {"total": 0, "delivered": 0, "sent": 0, "read": 0, "failed": 0, "queued": 0}

        channel_stats[ch_str]["total"] += 1
        st_str = str(st.value if hasattr(st, "value") else st).upper()

        if st_str == "DELIVERED":
            channel_stats[ch_str]["delivered"] += 1
        elif st_str == "READ":
            channel_stats[ch_str]["delivered"] += 1
            channel_stats[ch_str]["read"] += 1
        elif st_str == "SENT":
            channel_stats[ch_str]["sent"] += 1
        elif st_str in ("FAILED", "INVALID_NUMBER"):
            channel_stats[ch_str]["failed"] += 1
        elif st_str in ("QUEUED", "SENDING", "RETRYING"):
            channel_stats[ch_str]["queued"] += 1

    return ResponseModel(
        data={
            "id": campaign.id,
            "event_id": campaign.event_id,
            "title": campaign.title,
            "status": campaign.status,
            "channels": campaign.channels_list,
            "total_recipients": campaign.total_recipients,
            "queued_count": campaign.queued_count,
            "sending_count": campaign.sending_count,
            "sent_count": campaign.sent_count,
            "delivered_count": campaign.delivered_count,
            "read_count": campaign.read_count,
            "failed_count": campaign.failed_count,
            "invalid_count": campaign.invalid_count,
            "skipped_count": campaign.skipped_count,
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
            "started_at": campaign.started_at.isoformat() if campaign.started_at else None,
            "completed_at": campaign.completed_at.isoformat() if campaign.completed_at else None,
            "channel_stats": channel_stats,
        },
        message="Campaign details retrieved.",
    )


@router.get("/campaigns/{campaign_id}/recipients", response_model=ResponseModel[dict])
async def get_campaign_recipients(
    campaign_id: str,
    channel: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns guest-level delivery status and error details for a broadcast campaign.
    """
    # Verify campaign ownership
    c_stmt = (
        select(Campaign)
        .join(Event, Campaign.event_id == Event.id)
        .where(Campaign.id == campaign_id, Event.user_id == current_user.id)
    )
    c_res = await db.execute(c_stmt)
    if not c_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    stmt = (
        select(BroadcastMessage, Guest.name.label("guest_name"), Guest.relationship.label("guest_rel"))
        .join(Guest, BroadcastMessage.guest_id == Guest.id)
        .where(BroadcastMessage.campaign_id == campaign_id)
    )

    if channel:
        stmt = stmt.where(BroadcastMessage.channel == CampaignChannel(channel.upper()))
    if status_filter:
        stmt = stmt.where(BroadcastMessage.status == MessageDeliveryStatus(status_filter.upper()))
    if search:
        s = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                Guest.name.ilike(s),
                BroadcastMessage.recipient.ilike(s),
            )
        )

    stmt = stmt.order_by(desc(BroadcastMessage.created_at))

    # Pagination
    offset = (page - 1) * limit
    paged_stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(paged_stmt)
    rows = res.all()

    recipients_data = []
    for msg, g_name, g_rel in rows:
        recipients_data.append({
            "id": msg.id,
            "campaign_id": msg.campaign_id,
            "guest_id": msg.guest_id,
            "guest_name": g_name,
            "relationship": g_rel,
            "channel": msg.channel.value if hasattr(msg.channel, "value") else str(msg.channel),
            "recipient": msg.recipient,
            "status": msg.status.value if hasattr(msg.status, "value") else str(msg.status),
            "provider_message_id": msg.provider_message_id,
            "attempts": msg.attempt_count,
            "last_error": msg.last_error,
            "error_code": msg.error_code,
            "invitation_url": msg.invitation_url,
            "queued_at": msg.queued_at.isoformat() if msg.queued_at else None,
            "sent_at": msg.sent_at.isoformat() if msg.sent_at else None,
            "delivered_at": msg.delivered_at.isoformat() if msg.delivered_at else None,
            "read_at": msg.read_at.isoformat() if msg.read_at else None,
            "failed_at": msg.failed_at.isoformat() if msg.failed_at else None,
        })

    return ResponseModel(
        data={"recipients": recipients_data, "page": page, "limit": limit, "count": len(recipients_data)},
        message="Campaign recipients retrieved.",
    )


@router.post("/campaigns/{campaign_id}/retry-failed", response_model=ResponseModel[dict])
async def retry_failed_campaign_messages(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retries all failed or rejected recipients for a campaign.
    """
    c_stmt = (
        select(Campaign)
        .join(Event, Campaign.event_id == Event.id)
        .where(Campaign.id == campaign_id, Event.user_id == current_user.id)
    )
    c_res = await db.execute(c_stmt)
    if not c_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    count = await CampaignService.retry_failed_recipients(db, campaign_id)
    return ResponseModel(
        data={"requeued_count": count},
        message=f"Successfully re-queued {count} failed messages for delivery retry.",
    )


@router.post("/campaigns/{campaign_id}/cancel", response_model=ResponseModel[dict])
async def cancel_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancels any remaining queued or retrying dispatches for a campaign.
    """
    c_stmt = (
        select(Campaign)
        .join(Event, Campaign.event_id == Event.id)
        .where(Campaign.id == campaign_id, Event.user_id == current_user.id)
    )
    c_res = await db.execute(c_stmt)
    if not c_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    success = await CampaignService.cancel_campaign(db, campaign_id)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return ResponseModel(
        data={"success": True},
        message="Broadcast campaign cancelled successfully.",
    )


@router.post("/campaigns/resend-single/{message_id}", response_model=ResponseModel[dict])
async def resend_single_message(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Re-sends an individual message to a specific guest.
    """
    stmt = (
        select(BroadcastMessage)
        .join(Event, BroadcastMessage.event_id == Event.id)
        .where(BroadcastMessage.id == message_id, Event.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    msg = res.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Broadcast message not found")

    msg.status = MessageDeliveryStatus.QUEUED
    msg.attempt_count = 0
    msg.last_error = None
    msg.error_code = None
    await db.commit()

    await multi_channel_worker.enqueue_message(msg.id)

    return ResponseModel(
        data={"message_id": msg.id, "status": "QUEUED"},
        message="Individual invitation re-queued for delivery.",
    )


@router.get("/events/{event_id}/campaigns", response_model=ResponseModel[List[dict]])
async def list_event_campaigns(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves full campaign history for an event.
    """
    event_stmt = select(Event).where(Event.id == event_id)
    event_res = await db.execute(event_stmt)
    event = event_res.scalars().first()
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    stmt = select(Campaign).where(Campaign.event_id == event_id).order_by(desc(Campaign.created_at))
    res = await db.execute(stmt)
    campaigns = res.scalars().all()

    data = [
        {
            "id": c.id,
            "title": c.title,
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "channels": c.channels_list or [c.channel.value if hasattr(c.channel, "value") else str(c.channel)],
            "target_audience": c.target_audience,
            "total_recipients": c.total_recipients,
            "queued_count": c.queued_count,
            "sending_count": c.sending_count,
            "sent_count": c.sent_count,
            "delivered_count": c.delivered_count,
            "read_count": c.read_count,
            "failed_count": c.failed_count,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "completed_at": c.completed_at.isoformat() if c.completed_at else None,
        }
        for c in campaigns
    ]

    return ResponseModel(data=data, message="Event campaigns history retrieved.")
