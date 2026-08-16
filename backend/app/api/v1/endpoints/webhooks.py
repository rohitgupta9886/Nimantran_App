import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Header
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings
from app.models.campaign import (
    Campaign,
    BroadcastMessage,
    MessageDeliveryStatus,
    WhatsAppWebhookEvent,
)
from app.models.guest import Guest
from app.services.whatsapp.meta_cloud_provider import get_whatsapp_provider

logger = logging.getLogger("nimantran_ai.webhooks")
router = APIRouter()


@router.get("/webhooks/whatsapp")
async def verify_webhook(request: Request):
    """
    Meta Webhook handshake verification endpoint.
    Meta sends GET request with hub.mode, hub.verify_token, hub.challenge.
    """
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    expected_token = settings.WHATSAPP_VERIFY_TOKEN or "nimantran_webhook_token_2026"

    if mode == "subscribe" and token == expected_token:
        logger.info("Meta WhatsApp Webhook handshake verified successfully.")
        return Response(content=challenge, media_type="text/plain")

    logger.warning(f"Meta WhatsApp Webhook verification failed. Token mismatch: received '{token}'")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification token mismatch")


@router.post("/webhooks/whatsapp")
async def receive_webhook_event(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_hub_signature_256: Optional[str] = Header(None),
):
    """
    Production Meta WhatsApp Webhook event receiver for delivery status (SENT, DELIVERED, READ, FAILED).
    Includes HMAC signature verification, deduplication, and atomic state updates.
    """
    raw_body = await request.body()
    provider = get_whatsapp_provider()

    # 1. Verify HMAC SHA-256 signature if app secret is configured
    if not provider.verify_webhook_signature(x_hub_signature_256, raw_body):
        logger.error("Invalid Webhook HMAC SHA-256 signature received from Meta.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    # 2. Parse JSON payload
    try:
        payload = await request.json()
    except Exception:
        logger.error("Failed to parse incoming webhook payload as JSON")
        return {"status": "INVALID_JSON"}

    # 3. Extract normalized status updates from provider parser
    updates = provider.parse_webhook_payload(payload)

    for upd in updates:
        try:
            # 4. Check for duplicate webhook event
            dup_stmt = select(WhatsAppWebhookEvent).where(
                WhatsAppWebhookEvent.provider_event_id == upd.provider_event_id
            )
            dup_res = await db.execute(dup_stmt)
            if dup_res.scalars().first():
                logger.info(f"Duplicate webhook event {upd.provider_event_id} discarded.")
                continue

            # Record event in event log
            event_log = WhatsAppWebhookEvent(
                provider_event_id=upd.provider_event_id,
                event_type="status_update",
                payload=upd.raw_payload,
                processed=True,
                processed_at=datetime.now(timezone.utc),
            )
            db.add(event_log)

            # 5. Find corresponding BroadcastMessage
            m_stmt = select(BroadcastMessage).where(
                BroadcastMessage.provider_message_id == upd.provider_message_id
            )
            m_res = await db.execute(m_stmt)
            msg = m_res.scalars().first()

            if not msg:
                logger.warning(f"Webhook received for unknown provider_message_id: {upd.provider_message_id}")
                await db.commit()
                continue

            # 6. Apply state machine transition
            if upd.status == "DELIVERED":
                # Only transition forward from QUEUED/SENDING/SENT
                if msg.status in (MessageDeliveryStatus.QUEUED, MessageDeliveryStatus.SENDING, MessageDeliveryStatus.SENT):
                    msg.status = MessageDeliveryStatus.DELIVERED
                    msg.delivered_at = upd.timestamp
                    await db.execute(
                        update(Guest)
                        .where(Guest.id == msg.guest_id)
                        .values(delivery_status="DELIVERED", delivered_at=upd.timestamp)
                    )
            elif upd.status == "READ":
                # READ is highest delivery status
                msg.status = MessageDeliveryStatus.READ
                msg.read_at = upd.timestamp
                if not msg.delivered_at:
                    msg.delivered_at = upd.timestamp
                await db.execute(
                    update(Guest)
                    .where(Guest.id == msg.guest_id)
                    .values(delivery_status="READ")
                )
            elif upd.status == "FAILED":
                msg.status = MessageDeliveryStatus.FAILED
                msg.failed_at = upd.timestamp
                msg.error_code = upd.error_code
                msg.last_error = upd.error_message or "Delivery failed according to WhatsApp network"
                await db.execute(
                    update(Guest)
                    .where(Guest.id == msg.guest_id)
                    .values(delivery_status="FAILED")
                )

            msg.updated_at = datetime.now(timezone.utc)
            await db.commit()

            # 7. Update parent campaign counts
            if msg.campaign_id:
                await _update_campaign_metrics(db, msg.campaign_id)

            logger.info(f"Updated BroadcastMessage {msg.id} to status {upd.status} via Webhook.")

        except Exception as ex:
            logger.error(f"Error processing webhook update {upd}: {ex}", exc_info=True)
            await db.rollback()

    return {"status": "EVENT_RECEIVED"}


@router.post("/webhooks/sms")
async def receive_sms_webhook_event(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    SMS delivery receipt webhook receiver (Twilio / Fast2SMS / Generic).
    """
    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            payload = await request.json()
        else:
            form_data = await request.form()
            payload = dict(form_data)
    except Exception:
        return {"status": "INVALID_PAYLOAD"}

    from app.services.sms import get_sms_provider
    provider = get_sms_provider()
    updates = provider.parse_webhook_payload(payload)

    for upd in updates:
        try:
            m_stmt = select(BroadcastMessage).where(
                BroadcastMessage.provider_message_id == upd.provider_message_id
            )
            m_res = await db.execute(m_stmt)
            msg = m_res.scalars().first()
            if msg:
                if upd.status == "DELIVERED":
                    msg.status = MessageDeliveryStatus.DELIVERED
                    msg.delivered_at = upd.timestamp
                elif upd.status == "FAILED":
                    msg.status = MessageDeliveryStatus.FAILED
                    msg.failed_at = upd.timestamp
                    msg.last_error = upd.error_message
                await db.commit()
                if msg.campaign_id:
                    await _update_campaign_metrics(db, msg.campaign_id)
        except Exception as ex:
            logger.error(f"Error handling SMS webhook: {ex}")

    return {"status": "SMS_EVENT_PROCESSED"}


@router.post("/webhooks/email")
async def receive_email_webhook_event(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Email delivery and bounce webhook receiver (SES, SendGrid, Resend).
    """
    try:
        payload = await request.json()
    except Exception:
        return {"status": "INVALID_PAYLOAD"}

    from app.services.email import get_email_provider
    provider = get_email_provider()
    updates = provider.parse_webhook_payload(payload)

    for upd in updates:
        try:
            m_stmt = select(BroadcastMessage).where(
                BroadcastMessage.provider_message_id == upd.provider_message_id
            )
            m_res = await db.execute(m_stmt)
            msg = m_res.scalars().first()
            if msg:
                if upd.status in ("DELIVERED", "OPENED"):
                    msg.status = MessageDeliveryStatus.DELIVERED if upd.status == "DELIVERED" else MessageDeliveryStatus.READ
                    msg.delivered_at = upd.timestamp
                elif upd.status in ("BOUNCED", "FAILED"):
                    msg.status = MessageDeliveryStatus.FAILED
                    msg.failed_at = upd.timestamp
                    msg.last_error = upd.error_message or "Email bounced"
                await db.commit()
                if msg.campaign_id:
                    await _update_campaign_metrics(db, msg.campaign_id)
        except Exception as ex:
            logger.error(f"Error handling Email webhook: {ex}")

    return {"status": "EMAIL_EVENT_PROCESSED"}


async def _update_campaign_metrics(db: AsyncSession, campaign_id: str):
    """Refreshes campaign metrics based on current message delivery states."""
    try:
        stmt = select(BroadcastMessage).where(BroadcastMessage.campaign_id == campaign_id)
        res = await db.execute(stmt)
        messages = res.scalars().all()

        total = len(messages)
        queued = sum(1 for m in messages if m.status in (MessageDeliveryStatus.QUEUED, MessageDeliveryStatus.RETRYING))
        sending = sum(1 for m in messages if m.status == MessageDeliveryStatus.SENDING)
        sent = sum(1 for m in messages if m.status == MessageDeliveryStatus.SENT)
        delivered = sum(1 for m in messages if m.status == MessageDeliveryStatus.DELIVERED)
        read = sum(1 for m in messages if m.status == MessageDeliveryStatus.READ)
        failed = sum(1 for m in messages if m.status == MessageDeliveryStatus.FAILED)
        invalid = sum(1 for m in messages if m.status == MessageDeliveryStatus.INVALID_NUMBER)

        c_stmt = select(Campaign).where(Campaign.id == campaign_id)
        c_res = await db.execute(c_stmt)
        campaign = c_res.scalars().first()
        if campaign:
            campaign.total_recipients = total
            campaign.queued_count = queued
            campaign.sending_count = sending
            campaign.sent_count = sent
            campaign.delivered_count = delivered
            campaign.read_count = read
            campaign.failed_count = failed
            campaign.invalid_count = invalid
            await db.commit()
    except Exception as ex:
        logger.error(f"Error updating campaign metrics in webhook: {ex}")

