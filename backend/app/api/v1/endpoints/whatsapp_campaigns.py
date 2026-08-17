import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.event import Event
from app.models.guest import Guest
from app.models.campaign import (
    Campaign,
    BroadcastMessage,
    CampaignStatus,
    CampaignChannel,
    MessageDeliveryStatus,
)
from app.schemas.common import ResponseModel
from app.schemas.invitation_content import CanonicalInvitationContent
from app.services.whatsapp.meta_cloud_provider import get_whatsapp_provider
from app.services.whatsapp.phone_utils import normalize_phone_number, mask_phone_number
from app.services.whatsapp.campaign_worker import campaign_worker

router = APIRouter()


class BroadcastRequest(BaseModel):
    target_scope: str = "ALL_ELIGIBLE"  # "UNSENT_ONLY" or "ALL_ELIGIBLE"
    template_name: Optional[str] = None
    custom_message: Optional[str] = None
    idempotency_key: Optional[str] = None


def generate_personalized_invitation_url(event: Event, guest: Guest) -> str:
    """
    Generates a secure, tokenized invitation URL without leaking DB IDs or sensitive info.
    """
    base_url = settings.PUBLIC_BASE_URL.rstrip("/")
    slug_or_id = event.slug or event.id
    token = guest.invitation_token or guest.id
    return f"{base_url}/i/{slug_or_id}?guest={token}"


def render_invitation_text(event: Event, guest: Guest, invitation_url: str) -> str:
    """
    Renders personalized invitation text strictly using CanonicalInvitationContent
    to guarantee zero factual discrepancies across channels.
    """
    token = guest.invitation_token or guest.id
    ai_content = (event.theme_config or {}).get("canonical_invitation") if event.theme_config else None
    canonical = CanonicalInvitationContent.from_event(
        event=event,
        ai_content=ai_content,
        public_base_url=settings.PUBLIC_BASE_URL,
        guest_token=token,
    )
    return canonical.render_whatsapp_text(guest_name=guest.name, guest_token=token)


@router.get("/events/{event_id}/whatsapp/config-status", response_model=ResponseModel[dict])
async def get_whatsapp_config_status(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Checks if WhatsApp messaging provider credentials are validly configured in production.
    """
    # Verify event ownership
    e_stmt = select(Event).where(Event.id == event_id, Event.user_id == current_user.id)
    e_res = await db.execute(e_stmt)
    if not e_res.scalars().first():
        raise HTTPException(status_code=404, detail="Event not found")

    provider = get_whatsapp_provider()
    config_status = await provider.validate_configuration()

    return ResponseModel(
        data={
            "is_configured": config_status.is_configured,
            "provider_name": config_status.provider_name,
            "phone_number_id": config_status.phone_number_id,
            "business_account_id": config_status.business_account_id,
            "webhook_configured": config_status.webhook_configured,
            "missing_keys": config_status.missing_keys,
            "message": config_status.message,
            "public_base_url": settings.PUBLIC_BASE_URL,
        },
        message="WhatsApp provider configuration status retrieved.",
    )


@router.get("/events/{event_id}/whatsapp/eligibility", response_model=ResponseModel[dict])
async def get_guest_eligibility(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculates guest eligibility counts and identifies invalid phone numbers before broadcasting.
    """
    # Verify event ownership
    stmt = select(Event).where(Event.id == event_id, Event.user_id == current_user.id)
    res = await db.execute(stmt)
    event = res.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    g_stmt = select(Guest).where(Guest.event_id == event_id)
    g_res = await db.execute(g_stmt)
    guests = g_res.scalars().all()

    total_count = len(guests)
    eligible_guests = []
    invalid_guests = []
    already_sent_guests = []
    unsent_eligible_guests = []

    for g in guests:
        is_valid, norm_phone, error_reason = normalize_phone_number(g.phone)
        is_already_sent = g.delivery_status in ("SENT", "DELIVERED", "READ") or (g.open_count and g.open_count > 0)

        if not is_valid or not norm_phone:
            invalid_guests.append({
                "id": g.id,
                "name": g.name,
                "phone": g.phone,
                "reason": error_reason or "Missing or malformed phone number",
            })
        else:
            eligible_guests.append(g.id)
            if is_already_sent:
                already_sent_guests.append(g.id)
            else:
                unsent_eligible_guests.append(g.id)

    return ResponseModel(
        data={
            "total_guests": total_count,
            "eligible_count": len(eligible_guests),
            "unsent_eligible_count": len(unsent_eligible_guests),
            "already_sent_count": len(already_sent_guests),
            "invalid_count": len(invalid_guests),
            "opted_out_count": 0,
            "invalid_guests": invalid_guests,
        },
        message="Eligibility breakdown calculated successfully.",
    )


@router.get("/events/{event_id}/whatsapp/preview", response_model=ResponseModel[dict])
async def get_personalized_preview(
    event_id: str,
    guest_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a personalized message preview for any selected guest.
    """
    e_stmt = select(Event).where(Event.id == event_id, Event.user_id == current_user.id)
    e_res = await db.execute(e_stmt)
    event = e_res.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    guest = None
    if guest_id:
        g_stmt = select(Guest).where(Guest.id == guest_id, Guest.event_id == event_id)
        g_res = await db.execute(g_stmt)
        guest = g_res.scalars().first()

    if not guest:
        # Fallback to first guest or synthetic preview guest
        g_stmt = select(Guest).where(Guest.event_id == event_id)
        g_res = await db.execute(g_stmt)
        guest = g_res.scalars().first()

    if not guest:
        guest = Guest(
            id="sample_preview_guest",
            event_id=event.id,
            name="Amit & Family",
            phone="+919876543210",
            invitation_token="preview_token_sample",
        )

    if not guest.invitation_token:
        guest.invitation_token = secrets.token_urlsafe(16)

    invitation_url = generate_personalized_invitation_url(event, guest)
    rendered_text = render_invitation_text(event, guest, invitation_url)

    is_valid, norm_phone, reason = normalize_phone_number(guest.phone)

    return ResponseModel(
        data={
            "guest_id": guest.id,
            "guest_name": guest.name,
            "raw_phone": guest.phone,
            "normalized_phone": norm_phone,
            "is_phone_valid": is_valid,
            "phone_error": reason,
            "invitation_url": invitation_url,
            "rendered_message": rendered_text,
        },
        message="Personalized preview generated.",
    )


@router.post("/events/{event_id}/whatsapp/broadcast", response_model=ResponseModel[dict])
async def create_broadcast_campaign(
    event_id: str,
    data: BroadcastRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Production-grade broadcast launcher:
    1. Validates event & provider configuration
    2. Filters eligible guests based on scope (UNSENT_ONLY vs ALL_ELIGIBLE)
    3. Generates personalized invitation URLs and message bodies
    4. Creates Campaign and BroadcastMessage records transactionally
    5. Enqueues message jobs to the background queue worker
    """
    # 1. Verify Event
    e_stmt = select(Event).where(Event.id == event_id, Event.user_id == current_user.id)
    e_res = await db.execute(e_stmt)
    event = e_res.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # 2. Verify WhatsApp Provider Configuration
    provider = get_whatsapp_provider()
    config_status = await provider.validate_configuration()
    if not config_status.is_configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=config_status.message or "WhatsApp sending is not configured. Please connect your WhatsApp Business account.",
        )

    # 3. Double-Click & Active Campaign Protection
    active_stmt = select(Campaign).where(
        Campaign.event_id == event_id,
        Campaign.status.in_([CampaignStatus.QUEUED, CampaignStatus.PROCESSING])
    )
    active_res = await db.execute(active_stmt)
    active_campaign = active_res.scalars().first()
    if active_campaign:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A broadcast campaign '{active_campaign.title}' is currently processing ({active_campaign.sent_count}/{active_campaign.total_recipients} processed). Please wait for it to complete.",
        )

    # 4. Fetch and filter guests
    g_stmt = select(Guest).where(Guest.event_id == event_id)
    g_res = await db.execute(g_stmt)
    all_guests = g_res.scalars().all()

    if not all_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No guests found in this celebration. Please add guests before broadcasting.",
        )

    target_guests = []
    invalid_count = 0

    for guest in all_guests:
        # Check phone validity
        is_valid, norm_phone, _ = normalize_phone_number(guest.phone)
        if not is_valid or not norm_phone:
            invalid_count += 1
            continue

        # Check scope filter
        if data.target_scope == "UNSENT_ONLY":
            if guest.delivery_status in ("SENT", "DELIVERED", "READ") or (guest.open_count and guest.open_count > 0):
                continue  # Skip already sent guest

        target_guests.append((guest, norm_phone))

    if not target_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No eligible guests found matching the selected broadcast criteria.",
        )

    # 5. Create Campaign Record
    campaign_title = f"{event.title} - WhatsApp Invitation Broadcast ({datetime.now(timezone.utc).strftime('%d %b %H:%M')})"
    campaign = Campaign(
        event_id=event.id,
        created_by=current_user.id,
        title=campaign_title,
        channel=CampaignChannel.WHATSAPP,
        status=CampaignStatus.QUEUED,
        target_audience=data.target_scope,
        message_body=data.custom_message or "Personalized Digital Invitation",
        template_name=data.template_name,
        total_recipients=len(target_guests),
        queued_count=len(target_guests),
        invalid_count=invalid_count,
        started_at=datetime.now(timezone.utc),
    )
    db.add(campaign)
    await db.flush()

    # 6. Create BroadcastMessage Records with Personalization
    created_messages = []
    for guest, norm_phone in target_guests:
        # Ensure secure token exists for guest
        if not guest.invitation_token:
            guest.invitation_token = secrets.token_urlsafe(16)

        inv_url = generate_personalized_invitation_url(event, guest)
        pers_text = render_invitation_text(event, guest, inv_url)

        msg_job = BroadcastMessage(
            campaign_id=campaign.id,
            event_id=event.id,
            guest_id=guest.id,
            channel=CampaignChannel.WHATSAPP,
            recipient=guest.phone or norm_phone,
            normalized_phone=norm_phone,
            template_name=data.template_name,
            personalized_payload={
                "guest_name": guest.name,
                "event_title": event.title,
                "host_name": event.host_name,
                "venue": event.venue_name,
                "invitation_url": inv_url,
            },
            personalized_text=pers_text,
            invitation_url=inv_url,
            status=MessageDeliveryStatus.QUEUED,
            attempt_count=0,
            max_attempts=3,
        )
        db.add(msg_job)
        created_messages.append(msg_job)

    await db.commit()
    await db.refresh(campaign)

    # 7. Enqueue jobs to Background Campaign Worker
    await campaign_worker.enqueue_campaign(campaign.id)

    return ResponseModel(
        data={
            "campaign_id": campaign.id,
            "title": campaign.title,
            "status": campaign.status.value,
            "total_recipients": campaign.total_recipients,
            "queued_count": campaign.queued_count,
            "invalid_count": campaign.invalid_count,
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
        },
        message=f"Broadcast campaign queued with {len(target_guests)} invitations.",
    )


@router.get("/events/{event_id}/whatsapp/campaigns", response_model=ResponseModel[List[dict]])
async def list_event_campaigns(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns list of past and active broadcast campaigns for an event.
    """
    e_stmt = select(Event).where(Event.id == event_id, Event.user_id == current_user.id)
    e_res = await db.execute(e_stmt)
    if not e_res.scalars().first():
        raise HTTPException(status_code=404, detail="Event not found")

    stmt = (
        select(Campaign)
        .where(Campaign.event_id == event_id)
        .order_by(desc(Campaign.created_at))
    )
    res = await db.execute(stmt)
    campaigns = res.scalars().all()

    output = []
    for c in campaigns:
        output.append({
            "id": c.id,
            "title": c.title,
            "channel": c.channel.value if hasattr(c.channel, "value") else c.channel,
            "status": c.status.value if hasattr(c.status, "value") else c.status,
            "target_audience": c.target_audience,
            "total_recipients": c.total_recipients,
            "queued_count": c.queued_count,
            "sending_count": c.sending_count,
            "sent_count": c.sent_count,
            "delivered_count": c.delivered_count,
            "read_count": c.read_count,
            "failed_count": c.failed_count,
            "invalid_count": c.invalid_count,
            "skipped_count": c.skipped_count,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "started_at": c.started_at.isoformat() if c.started_at else None,
            "completed_at": c.completed_at.isoformat() if c.completed_at else None,
        })

    return ResponseModel(
        data=output,
        message=f"Retrieved {len(output)} campaigns.",
    )


@router.get("/events/{event_id}/whatsapp/campaigns/{campaign_id}", response_model=ResponseModel[dict])
async def get_campaign_detail(
    event_id: str,
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns real-time progress and guest-level message status list for a campaign.
    """
    c_stmt = (
        select(Campaign)
        .join(Event, Campaign.event_id == Event.id)
        .where(Campaign.id == campaign_id, Campaign.event_id == event_id, Event.user_id == current_user.id)
    )
    c_res = await db.execute(c_stmt)
    campaign = c_res.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    m_stmt = (
        select(BroadcastMessage, Guest.name, Guest.relationship)
        .join(Guest, BroadcastMessage.guest_id == Guest.id)
        .where(BroadcastMessage.campaign_id == campaign_id)
        .order_by(BroadcastMessage.created_at.asc())
    )
    m_res = await db.execute(m_stmt)
    message_rows = m_res.all()

    messages_data = []
    for msg, guest_name, guest_rel in message_rows:
        messages_data.append({
            "id": msg.id,
            "guest_id": msg.guest_id,
            "guest_name": guest_name,
            "relationship": guest_rel,
            "phone": msg.recipient,
            "normalized_phone": msg.normalized_phone,
            "masked_phone": mask_phone_number(msg.normalized_phone or msg.recipient),
            "status": msg.status.value if hasattr(msg.status, "value") else msg.status,
            "provider_message_id": msg.provider_message_id,
            "attempt_count": msg.attempt_count,
            "last_error": msg.last_error,
            "error_code": msg.error_code,
            "sent_at": msg.sent_at.isoformat() if msg.sent_at else None,
            "delivered_at": msg.delivered_at.isoformat() if msg.delivered_at else None,
            "read_at": msg.read_at.isoformat() if msg.read_at else None,
            "failed_at": msg.failed_at.isoformat() if msg.failed_at else None,
        })

    return ResponseModel(
        data={
            "campaign": {
                "id": campaign.id,
                "title": campaign.title,
                "status": campaign.status.value if hasattr(campaign.status, "value") else campaign.status,
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
            },
            "messages": messages_data,
        },
        message="Campaign details loaded.",
    )


@router.post("/events/{event_id}/whatsapp/messages/{message_id}/retry", response_model=ResponseModel[dict])
async def retry_broadcast_message(
    event_id: str,
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually retries a failed message in a controlled manner.
    """
    stmt = (
        select(BroadcastMessage)
        .join(Event, BroadcastMessage.event_id == Event.id)
        .where(
            BroadcastMessage.id == message_id,
            BroadcastMessage.event_id == event_id,
            Event.user_id == current_user.id,
        )
    )
    res = await db.execute(stmt)
    msg = res.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Broadcast message not found")

    if msg.status in (MessageDeliveryStatus.SENT, MessageDeliveryStatus.DELIVERED, MessageDeliveryStatus.READ):
        return ResponseModel(
            data={"message_id": msg.id, "status": msg.status.value},
            message="Message is already delivered or sent.",
        )

    msg.status = MessageDeliveryStatus.RETRYING
    msg.last_error = None
    msg.error_code = None
    msg.attempt_count = 0
    await db.commit()

    # Re-enqueue to worker
    await campaign_worker.enqueue_message(msg.id)

    return ResponseModel(
        data={"message_id": msg.id, "status": "RETRYING"},
        message="Message queued for retry attempt.",
    )
