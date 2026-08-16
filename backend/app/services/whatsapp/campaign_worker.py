import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.campaign import Campaign, BroadcastMessage, CampaignStatus, MessageDeliveryStatus
from app.models.guest import Guest
from app.services.whatsapp.meta_cloud_provider import get_whatsapp_provider
from app.services.whatsapp.phone_utils import normalize_phone_number

logger = logging.getLogger("nimantran_ai.campaign_worker")


class WhatsAppCampaignWorker:
    """
    Asynchronous queue worker for WhatsApp Broadcast Campaigns.
    Controls dispatch rate, retries, concurrency, and persists state transitions to DB.
    """

    def __init__(self, dispatch_delay_seconds: float = 0.15):
        self.dispatch_delay = dispatch_delay_seconds
        self.queue: asyncio.Queue[str] = asyncio.Queue()  # Holds message_id
        self.is_running = False
        self._worker_task: Optional[asyncio.Task] = None
        self._provider = get_whatsapp_provider()

    def start(self):
        if not self.is_running:
            self.is_running = True
            self._worker_task = asyncio.create_task(self._worker_loop())
            logger.info("WhatsApp Campaign Worker started.")
            # Trigger recovery of any pending jobs from previous run
            asyncio.create_task(self._recover_pending_jobs())

    def stop(self):
        self.is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            self._worker_task = None
        logger.info("WhatsApp Campaign Worker stopped.")

    async def enqueue_message(self, message_id: str):
        """Enqueues a single message job."""
        await self.queue.put(message_id)

    async def enqueue_campaign(self, campaign_id: str):
        """Enqueues all pending messages for a given campaign."""
        async with AsyncSessionLocal() as db:
            stmt = (
                select(BroadcastMessage.id)
                .where(
                    BroadcastMessage.campaign_id == campaign_id,
                    BroadcastMessage.status.in_([MessageDeliveryStatus.QUEUED, MessageDeliveryStatus.RETRYING])
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
                    logger.info(f"Recovered {len(pending_ids)} pending WhatsApp message jobs from database.")
        except Exception as ex:
            logger.error(f"Error during job recovery: {ex}")

    async def _worker_loop(self):
        """Main worker loop processing queue items with rate limiting and retry handling."""
        while self.is_running:
            try:
                message_id = await self.queue.get()
                await self._process_single_message(message_id)
                self.queue.task_done()
                # Rate limit pacing
                await asyncio.sleep(self.dispatch_delay)
            except asyncio.CancelledError:
                break
            except Exception as ex:
                logger.error(f"Unhandled error in WhatsApp worker loop: {ex}", exc_info=True)
                await asyncio.sleep(1.0)

    async def _process_single_message(self, message_id: str):
        """Processes an individual message job transactionally."""
        async with AsyncSessionLocal() as db:
            # 1. Fetch message with row lock
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

            # 2. Mark message as SENDING
            msg.status = MessageDeliveryStatus.SENDING
            msg.attempt_count += 1
            msg.updated_at = datetime.now(timezone.utc)
            await db.commit()

            # Update Campaign sending counter
            if msg.campaign_id:
                await self._refresh_campaign_stats(db, msg.campaign_id)

            # 3. Validate & normalize phone number
            is_valid, normalized_phone, reason = normalize_phone_number(msg.recipient)
            if not is_valid or not normalized_phone:
                msg.status = MessageDeliveryStatus.INVALID_NUMBER
                msg.last_error = reason or "Invalid phone number format"
                msg.failed_at = datetime.now(timezone.utc)
                await db.commit()
                if msg.campaign_id:
                    await self._refresh_campaign_stats(db, msg.campaign_id)
                return

            msg.normalized_phone = normalized_phone

            # 4. Dispatch through WhatsApp Provider
            try:
                # Prepare payload
                text_to_send = msg.personalized_text or "You are warmly invited to our celebration."
                
                # Check if template specified or send text with preview
                if msg.template_name:
                    components = msg.personalized_payload.get("components", []) if msg.personalized_payload else []
                    send_res = await self._provider.send_template_message(
                        to_phone=normalized_phone,
                        template_name=msg.template_name,
                        language=msg.personalized_payload.get("language", "hi") if msg.personalized_payload else "hi",
                        components=components,
                        fallback_text=text_to_send,
                    )
                else:
                    send_res = await self._provider.send_text_message(
                        to_phone=normalized_phone,
                        text_body=text_to_send,
                    )

                # 5. Handle Provider Result
                if send_res.success:
                    msg.status = MessageDeliveryStatus.SENT
                    msg.provider_message_id = send_res.provider_message_id
                    msg.sent_at = datetime.now(timezone.utc)
                    msg.last_error = None
                    msg.error_code = None

                    # Also update guest delivery status
                    await db.execute(
                        update(Guest)
                        .where(Guest.id == msg.guest_id)
                        .values(delivery_status="SENT")
                    )
                    logger.info(f"BroadcastMessage {message_id} -> {normalized_phone} ACCEPTED by Meta [ID: {send_res.provider_message_id}]")
                else:
                    if send_res.status == "INVALID_NUMBER":
                        msg.status = MessageDeliveryStatus.INVALID_NUMBER
                        msg.last_error = send_res.error_message
                        msg.error_code = send_res.error_code
                        msg.failed_at = datetime.now(timezone.utc)
                    elif send_res.retryable and msg.attempt_count < msg.max_attempts:
                        # Schedule exponential backoff retry
                        msg.status = MessageDeliveryStatus.RETRYING
                        msg.last_error = send_res.error_message
                        msg.error_code = send_res.error_code
                        backoff_delay = 2.0 ** msg.attempt_count
                        logger.warning(f"BroadcastMessage {message_id} failed retryable error ({send_res.error_message}). Retrying in {backoff_delay}s (Attempt {msg.attempt_count}/{msg.max_attempts}).")
                        asyncio.create_task(self._schedule_retry(message_id, backoff_delay))
                    else:
                        msg.status = MessageDeliveryStatus.FAILED
                        msg.last_error = send_res.error_message
                        msg.error_code = send_res.error_code
                        msg.failed_at = datetime.now(timezone.utc)
                        logger.error(f"BroadcastMessage {message_id} permanently failed: {send_res.error_message}")

                await db.commit()

            except Exception as ex:
                logger.error(f"Unexpected exception sending message {message_id}: {ex}", exc_info=True)
                msg.status = MessageDeliveryStatus.FAILED
                msg.last_error = f"Worker internal exception: {str(ex)}"
                msg.failed_at = datetime.now(timezone.utc)
                await db.commit()

            # 6. Recalculate campaign progress
            if msg.campaign_id:
                await self._refresh_campaign_stats(db, msg.campaign_id)

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
                # All messages reached a terminal or sent state
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
campaign_worker = WhatsAppCampaignWorker()
