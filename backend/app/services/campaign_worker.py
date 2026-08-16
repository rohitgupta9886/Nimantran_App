import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.campaign import (
    Campaign,
    BroadcastMessage,
    CampaignStatus,
    CampaignChannel,
    MessageDeliveryStatus,
)
from app.models.guest import Guest
from app.services.whatsapp import get_whatsapp_provider
from app.services.whatsapp.phone_utils import normalize_phone_number
from app.services.sms import get_sms_provider
from app.services.email import get_email_provider

logger = logging.getLogger("nimantran_ai.campaign_worker")


class MultiChannelCampaignWorker:
    """
    Unified asynchronous multi-channel queue worker for WhatsApp, SMS, and Email Broadcast Campaigns.
    Handles rate-limiting, retries, concurrency, and persists state transitions to the database.
    """

    def __init__(self, dispatch_delay_seconds: float = 0.1):
        self.dispatch_delay = dispatch_delay_seconds
        self.queue: asyncio.Queue[str] = asyncio.Queue()  # Holds message_id
        self.is_running = False
        self._worker_task: Optional[asyncio.Task] = None

    def start(self):
        if not self.is_running:
            self.is_running = True
            self._worker_task = asyncio.create_task(self._worker_loop())
            logger.info("Multi-Channel Campaign Worker started.")
            # Trigger recovery of any pending jobs from previous run
            asyncio.create_task(self._recover_pending_jobs())

    def stop(self):
        self.is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            self._worker_task = None
        logger.info("Multi-Channel Campaign Worker stopped.")

    async def enqueue_message(self, message_id: str):
        """Enqueues a single message job."""
        await self.queue.put(message_id)

    async def enqueue_campaign(self, campaign_id: str):
        """Enqueues all pending/retrying messages for a given campaign."""
        async with AsyncSessionLocal() as db:
            stmt = (
                select(BroadcastMessage.id)
                .where(
                    BroadcastMessage.campaign_id == campaign_id,
                    BroadcastMessage.status.in_([MessageDeliveryStatus.QUEUED, MessageDeliveryStatus.RETRYING]),
                )
                .order_by(BroadcastMessage.created_at.asc())
            )
            res = await db.execute(stmt)
            message_ids = res.scalars().all()

            for msg_id in message_ids:
                await self.queue.put(msg_id)

            logger.info(f"Enqueued {len(message_ids)} message jobs for Campaign {campaign_id}")

    async def _recover_pending_jobs(self):
        """Finds any orphaned QUEUED or RETRYING messages on startup and enqueues them."""
        try:
            async with AsyncSessionLocal() as db:
                stmt = select(BroadcastMessage.id).where(
                    BroadcastMessage.status.in_([MessageDeliveryStatus.QUEUED, MessageDeliveryStatus.RETRYING])
                )
                res = await db.execute(stmt)
                pending_ids = res.scalars().all()

                for msg_id in pending_ids:
                    await self.queue.put(msg_id)

                if pending_ids:
                    logger.info(f"Recovered {len(pending_ids)} pending multi-channel broadcast jobs from database.")
        except Exception as ex:
            logger.error(f"Error during job recovery: {ex}")

    async def _worker_loop(self):
        """Main worker loop processing queue items with rate limiting and retry handling."""
        while self.is_running:
            try:
                message_id = await self.queue.get()
                await self._process_single_message(message_id)
                self.queue.task_done()
                await asyncio.sleep(self.dispatch_delay)
            except asyncio.CancelledError:
                break
            except Exception as ex:
                logger.error(f"Unhandled error in campaign worker loop: {ex}", exc_info=True)
                await asyncio.sleep(1.0)

    async def _process_single_message(self, message_id: str):
        """Processes an individual multi-channel message job transactionally."""
        async with AsyncSessionLocal() as db:
            stmt = select(BroadcastMessage).where(BroadcastMessage.id == message_id)
            res = await db.execute(stmt)
            msg = res.scalars().first()

            if not msg:
                logger.warning(f"BroadcastMessage {message_id} not found.")
                return

            # Idempotency check: Don't resend if already in terminal/sent state
            if msg.status in (
                MessageDeliveryStatus.SENT,
                MessageDeliveryStatus.DELIVERED,
                MessageDeliveryStatus.READ,
                MessageDeliveryStatus.SKIPPED,
                MessageDeliveryStatus.OPTED_OUT,
            ):
                logger.info(f"BroadcastMessage {message_id} already in {msg.status} state. Skipping.")
                return

            # Mark as SENDING
            msg.status = MessageDeliveryStatus.SENDING
            msg.attempt_count += 1
            msg.updated_at = datetime.now(timezone.utc)
            await db.commit()

            if msg.campaign_id:
                await self._refresh_campaign_stats(db, msg.campaign_id)

            channel = msg.channel

            try:
                if channel == CampaignChannel.WHATSAPP:
                    await self._dispatch_whatsapp(db, msg)
                elif channel == CampaignChannel.SMS:
                    await self._dispatch_sms(db, msg)
                elif channel == CampaignChannel.EMAIL:
                    await self._dispatch_email(db, msg)
                else:
                    msg.status = MessageDeliveryStatus.FAILED
                    msg.last_error = f"Unsupported channel: {channel}"
                    msg.failed_at = datetime.now(timezone.utc)
                    await db.commit()

            except Exception as ex:
                logger.error(f"Unexpected exception sending message {message_id}: {ex}", exc_info=True)
                msg.status = MessageDeliveryStatus.FAILED
                msg.last_error = f"Internal exception: {str(ex)}"
                msg.failed_at = datetime.now(timezone.utc)
                await db.commit()

            if msg.campaign_id:
                await self._refresh_campaign_stats(db, msg.campaign_id)

    async def _dispatch_whatsapp(self, db: AsyncSession, msg: BroadcastMessage):
        provider = get_whatsapp_provider()
        is_valid, normalized_phone, reason = normalize_phone_number(msg.recipient)
        if not is_valid or not normalized_phone:
            msg.status = MessageDeliveryStatus.INVALID_NUMBER
            msg.last_error = reason or "Invalid phone number format"
            msg.failed_at = datetime.now(timezone.utc)
            await db.commit()
            return

        msg.normalized_phone = normalized_phone
        text_to_send = msg.personalized_text or "You are warmly invited to our celebration."

        if msg.template_name:
            components = msg.personalized_payload.get("components", []) if msg.personalized_payload else []
            send_res = await provider.send_template_message(
                to_phone=normalized_phone,
                template_name=msg.template_name,
                language=msg.personalized_payload.get("language", "hi") if msg.personalized_payload else "hi",
                components=components,
                fallback_text=text_to_send,
            )
        else:
            send_res = await provider.send_text_message(
                to_phone=normalized_phone,
                text_body=text_to_send,
            )

        if send_res.success:
            msg.status = MessageDeliveryStatus.SENT
            msg.provider_message_id = send_res.provider_message_id
            msg.sent_at = datetime.now(timezone.utc)
            msg.last_error = None
            msg.error_code = None

            await db.execute(
                update(Guest)
                .where(Guest.id == msg.guest_id)
                .values(delivery_status="SENT")
            )
            logger.info(f"WhatsApp message {msg.id} -> {normalized_phone} ACCEPTED [ID: {send_res.provider_message_id}]")

            # In development/mock mode, simulate realistic automatic delivery progression
            if "mock" in (send_res.provider_message_id or "").lower():
                asyncio.create_task(self._simulate_mock_progression(msg.id, "WHATSAPP"))
        else:
            if send_res.status == "INVALID_NUMBER":
                msg.status = MessageDeliveryStatus.INVALID_NUMBER
                msg.last_error = send_res.error_message
                msg.error_code = send_res.error_code
                msg.failed_at = datetime.now(timezone.utc)
            elif send_res.retryable and msg.attempt_count < msg.max_attempts:
                msg.status = MessageDeliveryStatus.RETRYING
                msg.last_error = send_res.error_message
                msg.error_code = send_res.error_code
                backoff_delay = 2.0 ** msg.attempt_count
                asyncio.create_task(self._schedule_retry(msg.id, backoff_delay))
            else:
                msg.status = MessageDeliveryStatus.FAILED
                msg.last_error = send_res.error_message
                msg.error_code = send_res.error_code
                msg.failed_at = datetime.now(timezone.utc)

        await db.commit()

    async def _dispatch_sms(self, db: AsyncSession, msg: BroadcastMessage):
        provider = get_sms_provider()
        is_valid, normalized_phone, reason = normalize_phone_number(msg.recipient)
        if not is_valid or not normalized_phone:
            msg.status = MessageDeliveryStatus.INVALID_NUMBER
            msg.last_error = reason or "Invalid phone number format for SMS"
            msg.failed_at = datetime.now(timezone.utc)
            await db.commit()
            return

        msg.normalized_phone = normalized_phone
        text_to_send = msg.personalized_text or "You are warmly invited to our celebration."

        send_res = await provider.send_sms(
            to_phone=normalized_phone,
            message_text=text_to_send,
        )

        if send_res.success:
            msg.status = MessageDeliveryStatus.SENT
            msg.provider_message_id = send_res.provider_message_id
            msg.sent_at = datetime.now(timezone.utc)
            msg.last_error = None
            msg.error_code = None

            await db.execute(
                update(Guest)
                .where(Guest.id == msg.guest_id)
                .values(delivery_status="SENT")
            )
            logger.info(f"SMS message {msg.id} -> {normalized_phone} ACCEPTED [ID: {send_res.provider_message_id}]")

            if "mock" in (send_res.provider_message_id or "").lower():
                asyncio.create_task(self._simulate_mock_progression(msg.id, "SMS"))
        else:
            if send_res.status == "INVALID_NUMBER":
                msg.status = MessageDeliveryStatus.INVALID_NUMBER
                msg.last_error = send_res.error_message
                msg.error_code = send_res.error_code
                msg.failed_at = datetime.now(timezone.utc)
            elif send_res.retryable and msg.attempt_count < msg.max_attempts:
                msg.status = MessageDeliveryStatus.RETRYING
                msg.last_error = send_res.error_message
                msg.error_code = send_res.error_code
                backoff_delay = 2.0 ** msg.attempt_count
                asyncio.create_task(self._schedule_retry(msg.id, backoff_delay))
            else:
                msg.status = MessageDeliveryStatus.FAILED
                msg.last_error = send_res.error_message
                msg.error_code = send_res.error_code
                msg.failed_at = datetime.now(timezone.utc)

        await db.commit()

    async def _dispatch_email(self, db: AsyncSession, msg: BroadcastMessage):
        provider = get_email_provider()
        to_email = msg.recipient.strip()

        if not to_email or "@" not in to_email or "." not in to_email.split("@")[-1]:
            msg.status = MessageDeliveryStatus.FAILED
            msg.last_error = "Invalid recipient email address"
            msg.error_code = "INVALID_EMAIL"
            msg.failed_at = datetime.now(timezone.utc)
            await db.commit()
            return

        subject = msg.email_subject or "You are cordially invited!"
        html_body = msg.email_body_html or f"<p>{msg.personalized_text or 'You are warmly invited to our celebration.'}</p>"
        text_body = msg.personalized_text or "You are warmly invited to our celebration."

        send_res = await provider.send_email(
            to_email=to_email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            recipient_name=msg.personalized_payload.get("guest_name") if msg.personalized_payload else None,
        )

        if send_res.success:
            msg.status = MessageDeliveryStatus.SENT
            msg.provider_message_id = send_res.provider_message_id
            msg.sent_at = datetime.now(timezone.utc)
            msg.last_error = None
            msg.error_code = None

            await db.execute(
                update(Guest)
                .where(Guest.id == msg.guest_id)
                .values(delivery_status="SENT")
            )
            logger.info(f"Email message {msg.id} -> {to_email} ACCEPTED [ID: {send_res.provider_message_id}]")

            if "mock" in (send_res.provider_message_id or "").lower():
                asyncio.create_task(self._simulate_mock_progression(msg.id, "EMAIL"))
        else:
            if send_res.retryable and msg.attempt_count < msg.max_attempts:
                msg.status = MessageDeliveryStatus.RETRYING
                msg.last_error = send_res.error_message
                msg.error_code = send_res.error_code
                backoff_delay = 2.0 ** msg.attempt_count
                asyncio.create_task(self._schedule_retry(msg.id, backoff_delay))
            else:
                msg.status = MessageDeliveryStatus.FAILED
                msg.last_error = send_res.error_message
                msg.error_code = send_res.error_code
                msg.failed_at = datetime.now(timezone.utc)

        await db.commit()

    async def _simulate_mock_progression(self, message_id: str, channel: str):
        """Simulates realistic asynchronous delivery transitions for development mode."""
        try:
            # 1. Transition to DELIVERED after short delay
            await asyncio.sleep(1.2)
            async with AsyncSessionLocal() as db:
                stmt = select(BroadcastMessage).where(BroadcastMessage.id == message_id)
                res = await db.execute(stmt)
                m = res.scalars().first()
                if m and m.status == MessageDeliveryStatus.SENT:
                    m.status = MessageDeliveryStatus.DELIVERED
                    m.delivered_at = datetime.now(timezone.utc)
                    await db.execute(
                        update(Guest)
                        .where(Guest.id == m.guest_id)
                        .values(delivery_status="DELIVERED", delivered_at=datetime.now(timezone.utc))
                    )
                    await db.commit()
                    if m.campaign_id:
                        await self._refresh_campaign_stats(db, m.campaign_id)

            # 2. Transition to READ for WhatsApp / Email after additional delay
            if channel in ("WHATSAPP", "EMAIL"):
                await asyncio.sleep(2.0)
                async with AsyncSessionLocal() as db:
                    stmt = select(BroadcastMessage).where(BroadcastMessage.id == message_id)
                    res = await db.execute(stmt)
                    m = res.scalars().first()
                    if m and m.status == MessageDeliveryStatus.DELIVERED:
                        m.status = MessageDeliveryStatus.READ
                        m.read_at = datetime.now(timezone.utc)
                        await db.execute(
                            update(Guest)
                            .where(Guest.id == m.guest_id)
                            .values(delivery_status="READ", last_opened_at=datetime.now(timezone.utc))
                        )
                        await db.commit()
                        if m.campaign_id:
                            await self._refresh_campaign_stats(db, m.campaign_id)
        except Exception as ex:
            logger.debug(f"Mock delivery progression simulation ended: {ex}")

    async def _schedule_retry(self, message_id: str, delay_seconds: float):
        """Delays before re-adding message to active queue."""
        await asyncio.sleep(delay_seconds)
        if self.is_running:
            await self.queue.put(message_id)

    async def _refresh_campaign_stats(self, db: AsyncSession, campaign_id: str):
        """Recalculates and persists aggregated counters for the Campaign."""
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
            skipped = sum(1 for m in messages if m.status in (MessageDeliveryStatus.SKIPPED, MessageDeliveryStatus.OPTED_OUT))

            # Determine overall campaign status
            campaign_status = CampaignStatus.PROCESSING
            if total > 0 and (queued + sending) == 0:
                if failed == total and total > 0:
                    campaign_status = CampaignStatus.FAILED
                else:
                    campaign_status = CampaignStatus.COMPLETED

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
                campaign.skipped_count = skipped
                campaign.status = campaign_status

                if campaign.started_at is None and (sending > 0 or sent > 0 or failed > 0):
                    campaign.started_at = datetime.now(timezone.utc)
                if campaign_status in (CampaignStatus.COMPLETED, CampaignStatus.FAILED):
                    campaign.completed_at = datetime.now(timezone.utc)

                await db.commit()
        except Exception as ex:
            logger.error(f"Failed to update campaign stats: {ex}")


# Global Singleton Worker
multi_channel_worker = MultiChannelCampaignWorker()
