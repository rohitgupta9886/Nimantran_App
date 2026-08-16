import re
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Set
from sqlalchemy import select, and_, or_, update, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.campaign import (
    Campaign,
    BroadcastMessage,
    CampaignChannel,
    CampaignStatus,
    MessageDeliveryStatus,
)
from app.models.event import Event
from app.models.guest import Guest, RSVPStatus
from app.services.email.email_templates import render_luxury_invitation_email
from app.services.campaign_worker import multi_channel_worker
from app.services.ai_service import AIService

logger = logging.getLogger("nimantran_ai.campaign_service")


# Dynamic Variable Placeholders
DEFAULT_WHATSAPP_TEMPLATE = """💌 *{{host_name}} has a special invitation for you!*

Dear *{{guest_name}}*,

You are warmly invited to *{{event_name}}*.

📅 *Date:* {{event_date}}
⏰ *Time:* {{event_time}}
📍 *Venue:* {{venue_name}}

We would be delighted to celebrate this joyous occasion with you.

✨ *Tap below to open your personalized digital invitation & gate pass:*
{{invitation_url}}

— {{host_name}}"""

DEFAULT_SMS_TEMPLATE = """Dear {{guest_name}}, you are warmly invited to {{event_name}} on {{event_date}} at {{venue_name}}. Open your invitation & pass: {{invitation_url}} - {{host_name}}"""

DEFAULT_EMAIL_SUBJECT = """Invitation: {{event_name}} — Warmly invited by {{host_name}}"""


class CampaignService:
    @staticmethod
    def generate_personalized_invitation_url(event: Event, guest: Guest) -> str:
        """
        Generates a tokenized public invitation link for the guest.
        """
        base_url = settings.PUBLIC_BASE_URL.rstrip("/")
        slug_or_id = event.slug or event.id
        token = guest.invitation_token or guest.id
        return f"{base_url}/i/{slug_or_id}?guest={token}"

    @staticmethod
    def generate_rsvp_url(event: Event, guest: Guest) -> str:
        base_url = settings.PUBLIC_BASE_URL.rstrip("/")
        slug_or_id = event.slug or event.id
        token = guest.invitation_token or guest.id
        return f"{base_url}/i/{slug_or_id}?guest={token}&rsvp=open"

    @staticmethod
    def render_template_message(
        template_str: str,
        event: Event,
        guest: Guest,
        invitation_url: Optional[str] = None,
        rsvp_url: Optional[str] = None,
    ) -> str:
        """
        Substitutes standard placeholders in template string with real data.
        """
        inv_url = invitation_url or CampaignService.generate_personalized_invitation_url(event, guest)
        r_url = rsvp_url or CampaignService.generate_rsvp_url(event, guest)

        start_dt = event.start_date
        date_str = start_dt.strftime("%A, %d %B %Y") if start_dt else "TBA"
        time_str = start_dt.strftime("%I:%M %p") if start_dt else "TBA"

        replacements = {
            "{{guest_name}}": guest.name or "Honored Guest",
            "{{host_name}}": event.host_name or "Host Family",
            "{{event_name}}": event.title or "Our Celebration",
            "{{event_title}}": event.title or "Our Celebration",
            "{{event_date}}": date_str,
            "{{event_time}}": time_str,
            "{{venue_name}}": event.venue_name or "Celebration Venue",
            "{{venue_address}}": event.venue_address or "",
            "{{invitation_url}}": inv_url,
            "{{rsvp_url}}": r_url,
            "{{event_type}}": event.event_type or "Celebration",
            "{{pass_code}}": guest.invitation_token or "NIM-PASS",
        }

        rendered = template_str
        for k, v in replacements.items():
            rendered = rendered.replace(k, str(v))
        return rendered

    @staticmethod
    async def create_broadcast_campaign(
        db: AsyncSession,
        event_id: str,
        user_id: str,
        channels: List[str],  # ["WHATSAPP", "SMS", "EMAIL"]
        title: str,
        guest_ids: Optional[List[str]] = None,
        target_audience: str = "ALL",  # ALL, UNSENT_ONLY, PENDING_RSVP, CONFIRMED, VIP
        custom_whatsapp_message: Optional[str] = None,
        custom_sms_message: Optional[str] = None,
        custom_email_subject: Optional[str] = None,
        custom_email_message: Optional[str] = None,
        ai_personalized_copies: Optional[Dict[str, str]] = None,  # {guest_id: text}
        idempotency_key: Optional[str] = None,
    ) -> Campaign:
        """
        Creates a multi-channel broadcast campaign, generates individualized recipient records,
        and enqueues background worker delivery jobs atomically.
        """
        # 1. Fetch Event
        event_stmt = select(Event).where(Event.id == event_id)
        event_res = await db.execute(event_stmt)
        event = event_res.scalars().first()
        if not event:
            raise ValueError("Event not found")

        # 2. Check Idempotency Key
        if idempotency_key:
            existing_campaign_stmt = select(Campaign).where(
                Campaign.event_id == event_id,
                Campaign.idempotency_key == idempotency_key,
            )
            existing_res = await db.execute(existing_campaign_stmt)
            existing = existing_res.scalars().first()
            if existing:
                logger.info(f"Idempotent duplicate request detected for key {idempotency_key}. Returning existing Campaign {existing.id}.")
                return existing

        # 3. Fetch Selected / Filtered Guests
        query = select(Guest).where(Guest.event_id == event_id)
        if guest_ids:
            query = query.where(Guest.id.in_(guest_ids))
        else:
            if target_audience == "UNSENT_ONLY":
                query = query.where(or_(Guest.delivery_status == None, Guest.delivery_status == "NOT_SENT", Guest.delivery_status == "FAILED"))
            elif target_audience == "PENDING_RSVP":
                query = query.where(Guest.rsvp_status == RSVPStatus.PENDING)
            elif target_audience == "CONFIRMED":
                query = query.where(Guest.rsvp_status == RSVPStatus.YES)
            elif target_audience == "VIP":
                query = query.where(Guest.category == "VIP")

        guest_res = await db.execute(query)
        guests = guest_res.scalars().all()

        if not guests:
            raise ValueError("No matching guests found for this broadcast criteria.")

        # 4. Normalize Channels List
        normalized_channels = [c.upper() for c in channels if c.upper() in ("WHATSAPP", "SMS", "EMAIL")]
        if not normalized_channels:
            normalized_channels = ["WHATSAPP"]

        primary_channel = CampaignChannel(normalized_channels[0])

        # 5. Create Campaign Entity
        wa_template = custom_whatsapp_message or DEFAULT_WHATSAPP_TEMPLATE
        sms_template = custom_sms_message or DEFAULT_SMS_TEMPLATE
        email_subj_template = custom_email_subject or DEFAULT_EMAIL_SUBJECT
        email_body_template = custom_email_message or "We would be delighted to have you celebrate with us."

        campaign = Campaign(
            event_id=event_id,
            created_by=user_id,
            title=title or f"{event.title} Broadcast",
            channel=primary_channel,
            channels_list=normalized_channels,
            target_audience=target_audience,
            message_body=wa_template,
            email_subject=email_subj_template,
            email_body_html=email_body_template,
            idempotency_key=idempotency_key or f"campaign_{event_id}_{secrets.token_hex(8)}",
            status=CampaignStatus.QUEUED,
            total_recipients=0,
            queued_count=0,
            started_at=datetime.now(timezone.utc),
        )
        db.add(campaign)
        await db.flush()

        # 6. Generate Recipient Messages with Idempotency across (campaign_id, guest_id, channel)
        created_messages: List[BroadcastMessage] = []
        ai_copies = ai_personalized_copies or {}

        for guest in guests:
            # Ensure invitation token is populated
            if not guest.invitation_token:
                guest.invitation_token = f"nim_{secrets.token_urlsafe(12)}"
                db.add(guest)

            inv_url = CampaignService.generate_personalized_invitation_url(event, guest)
            rsvp_url = CampaignService.generate_rsvp_url(event, guest)

            # Check channels selected for this guest
            for ch in normalized_channels:
                recipient_val = None
                if ch in ("WHATSAPP", "SMS"):
                    recipient_val = guest.phone
                elif ch == "EMAIL":
                    recipient_val = guest.email

                if not recipient_val or not str(recipient_val).strip():
                    # Skip if guest has no phone for WhatsApp/SMS or no email for Email
                    continue

                clean_recipient = str(recipient_val).strip()

                # Determine message content
                custom_text = None
                email_html = None
                email_subj = None

                if ch == "WHATSAPP":
                    if guest.id in ai_copies:
                        custom_text = ai_copies[guest.id]
                    else:
                        custom_text = CampaignService.render_template_message(wa_template, event, guest, inv_url, rsvp_url)
                elif ch == "SMS":
                    custom_text = CampaignService.render_template_message(sms_template, event, guest, inv_url, rsvp_url)
                elif ch == "EMAIL":
                    email_subj = CampaignService.render_template_message(email_subj_template, event, guest, inv_url, rsvp_url)
                    rendered_body_note = CampaignService.render_template_message(email_body_template, event, guest, inv_url, rsvp_url)
                    start_dt = event.start_date
                    date_str = start_dt.strftime("%A, %d %B %Y") if start_dt else "TBA"
                    time_str = start_dt.strftime("%I:%M %p") if start_dt else "TBA"
                    email_html, custom_text = render_luxury_invitation_email(
                        guest_name=guest.name,
                        event_title=event.title,
                        host_name=event.host_name,
                        event_date=date_str,
                        event_time=time_str,
                        venue_name=event.venue_name,
                        venue_address=event.venue_address,
                        invitation_url=inv_url,
                        rsvp_url=rsvp_url,
                        personal_message=rendered_body_note,
                        event_type=event.event_type,
                    )

                msg = BroadcastMessage(
                    campaign_id=campaign.id,
                    event_id=event_id,
                    guest_id=guest.id,
                    channel=CampaignChannel(ch),
                    recipient=clean_recipient,
                    personalized_text=custom_text,
                    email_subject=email_subj,
                    email_body_html=email_html,
                    invitation_url=inv_url,
                    personalized_payload={"guest_name": guest.name, "language": guest.language or "HI"},
                    status=MessageDeliveryStatus.QUEUED,
                    idempotency_key=f"{campaign.id}_{guest.id}_{ch}",
                )
                db.add(msg)
                created_messages.append(msg)

        await db.flush()

        campaign.total_recipients = len(created_messages)
        campaign.queued_count = len(created_messages)
        await db.commit()

        # 7. Enqueue worker jobs
        await multi_channel_worker.enqueue_campaign(campaign.id)

        logger.info(f"Created multi-channel Campaign {campaign.id} ({campaign.title}) with {len(created_messages)} recipients across channels: {normalized_channels}.")
        return campaign

    @staticmethod
    async def retry_failed_recipients(db: AsyncSession, campaign_id: str) -> int:
        """
        Re-queues only failed recipients for a campaign with reset retry counters.
        """
        stmt = (
            select(BroadcastMessage)
            .where(
                BroadcastMessage.campaign_id == campaign_id,
                BroadcastMessage.status.in_([MessageDeliveryStatus.FAILED, MessageDeliveryStatus.INVALID_NUMBER]),
            )
        )
        res = await db.execute(stmt)
        failed_messages = res.scalars().all()

        if not failed_messages:
            return 0

        for msg in failed_messages:
            msg.status = MessageDeliveryStatus.QUEUED
            msg.attempt_count = 0
            msg.last_error = None
            msg.error_code = None
            msg.failed_at = None
            await multi_channel_worker.enqueue_message(msg.id)

        # Update campaign status
        c_stmt = select(Campaign).where(Campaign.id == campaign_id)
        c_res = await db.execute(c_stmt)
        campaign = c_res.scalars().first()
        if campaign:
            campaign.status = CampaignStatus.PROCESSING
            campaign.failed_count = 0

        await db.commit()
        logger.info(f"Re-queued {len(failed_messages)} failed messages for Campaign {campaign_id}.")
        return len(failed_messages)

    @staticmethod
    async def cancel_campaign(db: AsyncSession, campaign_id: str) -> bool:
        """
        Cancels any remaining QUEUED or RETRYING jobs in the campaign.
        """
        stmt = select(Campaign).where(Campaign.id == campaign_id)
        res = await db.execute(stmt)
        campaign = res.scalars().first()
        if not campaign:
            return False

        campaign.status = CampaignStatus.CANCELLED

        await db.execute(
            update(BroadcastMessage)
            .where(
                BroadcastMessage.campaign_id == campaign_id,
                BroadcastMessage.status.in_([MessageDeliveryStatus.QUEUED, MessageDeliveryStatus.RETRYING]),
            )
            .values(status=MessageDeliveryStatus.SKIPPED, last_error="Cancelled by host")
        )
        await db.commit()
        return True

    @staticmethod
    async def generate_ai_personalized_batch(
        event: Event,
        guests: List[Guest],
        ai_service: AIService,
        tone: str = "warm_royal",
    ) -> Dict[str, str]:
        """
        Optionally generates personalized invitation text per guest using AI.
        Gracefully falls back to standard templates on AI error.
        """
        results: Dict[str, str] = {}
        for g in guests:
            try:
                rel = g.relationship or "Honored Guest"
                prompt = (
                    f"Generate a personalized 3-sentence wedding/event invitation message for guest '{g.name}' "
                    f"who is the host's '{rel}'. Event is '{event.title}' hosted by '{event.host_name}'. "
                    f"Tone: {tone}. Keep it warm, polite, and elegant in Hindi-English (Hinglish) or English."
                )
                ai_text = await ai_service.generate_wording(
                    event_type=event.event_type,
                    language=g.language or "HI_EN",
                    tone=tone,
                    hosts=event.host_name,
                    custom_prompt=prompt,
                )
                if ai_text:
                    inv_url = CampaignService.generate_personalized_invitation_url(event, g)
                    results[g.id] = f"{ai_text}\n\n✨ Open your digital invitation & gate pass:\n{inv_url}"
            except Exception as ex:
                logger.warning(f"AI personalization skipped for guest {g.id}: {ex}")

        return results
