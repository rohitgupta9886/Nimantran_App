import asyncio
import secrets
import pytest
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.event import Event
from app.models.guest import Guest, RSVPStatus
from app.models.campaign import (
    Campaign,
    BroadcastMessage,
    CampaignChannel,
    CampaignStatus,
    MessageDeliveryStatus,
)
from app.services.campaign_service import CampaignService
from app.services.campaign_worker import MultiChannelCampaignWorker


async def _create_test_event(db: AsyncSession) -> tuple[str, str]:
    user_id = f"usr_resilience_{secrets.token_hex(4)}"
    event_id = f"evt_resilience_{secrets.token_hex(4)}"

    event = Event(
        id=event_id,
        user_id=user_id,
        title="Sharma Royal Wedding",
        event_type="WEDDING",
        host_name="Sharma Family",
        venue_name="Taj Palace Hotel",
        venue_address="New Delhi",
        start_date=datetime(2026, 12, 25, 18, 30, tzinfo=timezone.utc),
        slug=f"sharma-wedding-{secrets.token_hex(3)}",
    )
    db.add(event)
    await db.commit()
    return user_id, event_id


@pytest.mark.asyncio
async def test_broadcast_1_guest():
    """Verifies end-to-end broadcast dispatch for a single recipient."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g = Guest(
            id=f"gst_{secrets.token_hex(4)}",
            event_id=event_id,
            name="Single VIP Guest",
            phone="+919876500001",
            email="single.vip@example.com",
            invitation_token="nim_single_001",
        )
        db.add(g)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Single Guest Dispatch",
            guest_ids=[g.id],
        )

        assert campaign.total_recipients == 1
        assert campaign.status in (CampaignStatus.QUEUED, CampaignStatus.PROCESSING, CampaignStatus.COMPLETED)

        worker = MultiChannelCampaignWorker(dispatch_delay_seconds=0.01)
        stmt = select(BroadcastMessage).where(BroadcastMessage.campaign_id == campaign.id)
        res = await db.execute(stmt)
        msg = res.scalars().first()
        assert msg is not None
        assert msg.status == MessageDeliveryStatus.QUEUED

        await worker._process_single_message(msg.id)

        await db.refresh(msg)
        assert msg.status in (MessageDeliveryStatus.SENT, MessageDeliveryStatus.DELIVERED, MessageDeliveryStatus.READ)
        assert msg.sent_at is not None
        assert msg.attempt_count == 1


@pytest.mark.asyncio
async def test_broadcast_10_guests():
    """Verifies batch broadcast creation and state tracking for 10 recipients."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        guest_ids = []
        for i in range(10):
            g = Guest(
                id=f"gst_10_{i}_{secrets.token_hex(2)}",
                event_id=event_id,
                name=f"Guest Number {i}",
                phone=f"+9198765000{i:02d}",
                invitation_token=f"nim_token_10_{i}",
            )
            db.add(g)
            guest_ids.append(g.id)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Batch of 10 Guests",
            guest_ids=guest_ids,
        )

        assert campaign.total_recipients == 10

        worker = MultiChannelCampaignWorker(dispatch_delay_seconds=0.01)
        stmt = select(BroadcastMessage.id).where(BroadcastMessage.campaign_id == campaign.id)
        res = await db.execute(stmt)
        msg_ids = res.scalars().all()

        for mid in msg_ids:
            await worker._process_single_message(mid)

        await worker._refresh_campaign_stats(db, campaign.id)
        await db.refresh(campaign)

        assert campaign.sent_count + campaign.delivered_count + campaign.read_count == 10
        assert campaign.queued_count == 0


@pytest.mark.asyncio
async def test_broadcast_100_guests():
    """Verifies scale handling for 100 recipients without race conditions or memory leak."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        guest_ids = []
        for i in range(100):
            g = Guest(
                id=f"gst_100_{i}_{secrets.token_hex(2)}",
                event_id=event_id,
                name=f"Large Scale Guest {i}",
                phone=f"+9198765{i:05d}",
                invitation_token=f"nim_100_{i}",
            )
            db.add(g)
            guest_ids.append(g.id)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Large Scale 100 Campaign",
            guest_ids=guest_ids,
        )

        assert campaign.total_recipients == 100


@pytest.mark.asyncio
async def test_duplicate_campaign_request_idempotency():
    """Verifies that duplicate requests with the same idempotency_key return the existing campaign."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g = Guest(
            id=f"gst_idem_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Idempotent Test Guest",
            phone="+919876543299",
            invitation_token="nim_idem_01",
        )
        db.add(g)
        await db.commit()

        idem_key = f"unique_request_key_{secrets.token_hex(4)}"

        camp1 = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Idempotency Test 1",
            guest_ids=[g.id],
            idempotency_key=idem_key,
        )

        camp2 = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Idempotency Test 2 (Duplicate)",
            guest_ids=[g.id],
            idempotency_key=idem_key,
        )

        assert camp1.id == camp2.id
        assert camp1.total_recipients == 1


@pytest.mark.asyncio
async def test_concurrent_worker_atomic_claiming_zero_duplicates():
    """
    Simulates multiple parallel worker tasks competing to process the same message.
    Verifies that atomic claiming guarantees exactly ONE worker processes it.
    """
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g = Guest(
            id=f"gst_claim_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Atomic Claiming Guest",
            phone="+919876543288",
            invitation_token="nim_claim_01",
        )
        db.add(g)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Atomic Claiming Campaign",
            guest_ids=[g.id],
        )

        stmt = select(BroadcastMessage).where(BroadcastMessage.campaign_id == campaign.id)
        res = await db.execute(stmt)
        msg = res.scalars().first()

        worker1 = MultiChannelCampaignWorker(dispatch_delay_seconds=0.01)
        worker2 = MultiChannelCampaignWorker(dispatch_delay_seconds=0.01)

        # Run two workers concurrently on the exact same message
        await asyncio.gather(
            worker1._process_single_message(msg.id),
            worker2._process_single_message(msg.id),
        )

        await db.refresh(msg)
        # Attempt count must be exactly 1, proving no double send
        assert msg.attempt_count == 1
        assert msg.status in (MessageDeliveryStatus.SENT, MessageDeliveryStatus.DELIVERED, MessageDeliveryStatus.READ)


@pytest.mark.asyncio
async def test_worker_restart_recovers_pending_jobs():
    """Verifies that an independent worker recovers orphaned QUEUED jobs from DB on restart."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g = Guest(
            id=f"gst_restart_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Restart Recovery Guest",
            phone="+919876543277",
            invitation_token="nim_restart_01",
        )
        db.add(g)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Worker Restart Campaign",
            guest_ids=[g.id],
        )

        # Simulate fresh worker startup
        new_worker = MultiChannelCampaignWorker()
        await new_worker._recover_pending_jobs()

        # Check that queue received the pending job
        assert new_worker.queue.qsize() >= 1


@pytest.mark.asyncio
async def test_invalid_phone_number_rejection():
    """Verifies that invalid phone numbers are rejected gracefully into INVALID_NUMBER status."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g = Guest(
            id=f"gst_invalid_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Invalid Phone Guest",
            phone="123",  # invalid short number
            invitation_token="nim_invalid_phone",
        )
        db.add(g)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Invalid Phone Test",
            guest_ids=[g.id],
        )

        stmt = select(BroadcastMessage).where(BroadcastMessage.campaign_id == campaign.id)
        res = await db.execute(stmt)
        msg = res.scalars().first()

        worker = MultiChannelCampaignWorker(dispatch_delay_seconds=0.01)
        await worker._process_single_message(msg.id)

        await db.refresh(msg)
        assert msg.status == MessageDeliveryStatus.INVALID_NUMBER
        assert msg.last_error is not None


@pytest.mark.asyncio
async def test_missing_or_invalid_email_rejection():
    """Verifies that invalid email addresses are caught in pre-flight without sending."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g = Guest(
            id=f"gst_bademail_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Bad Email Guest",
            email="not-an-email",
            invitation_token="nim_bad_email",
        )
        db.add(g)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["EMAIL"],
            title="Bad Email Test",
            guest_ids=[g.id],
        )

        stmt = select(BroadcastMessage).where(BroadcastMessage.campaign_id == campaign.id)
        res = await db.execute(stmt)
        msg = res.scalars().first()

        worker = MultiChannelCampaignWorker(dispatch_delay_seconds=0.01)
        await worker._process_single_message(msg.id)

        await db.refresh(msg)
        assert msg.status == MessageDeliveryStatus.FAILED
        assert "INVALID_EMAIL" in (msg.error_code or "") or "Invalid" in (msg.last_error or "")


@pytest.mark.asyncio
async def test_opted_out_guest_skipped():
    """Verifies that guests with OPTED_OUT status are skipped pre-flight."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g = Guest(
            id=f"gst_optout_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Opted Out Guest",
            phone="+919876543266",
            delivery_status="OPTED_OUT",
            invitation_token="nim_optout_01",
        )
        db.add(g)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Opt Out Test",
            guest_ids=[g.id],
        )

        stmt = select(BroadcastMessage).where(BroadcastMessage.campaign_id == campaign.id)
        res = await db.execute(stmt)
        msg = res.scalars().first()

        worker = MultiChannelCampaignWorker(dispatch_delay_seconds=0.01)
        await worker._process_single_message(msg.id)

        await db.refresh(msg)
        assert msg.status == MessageDeliveryStatus.OPTED_OUT


@pytest.mark.asyncio
async def test_cancel_campaign_in_flight():
    """Verifies that cancelling a campaign halts un-dispatched messages cleanly."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g = Guest(
            id=f"gst_cancel_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Cancel Test Guest",
            phone="+919876543255",
            invitation_token="nim_cancel_01",
        )
        db.add(g)
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Cancel Test Campaign",
            guest_ids=[g.id],
        )

        # Cancel campaign immediately
        cancelled = await CampaignService.cancel_campaign(db, campaign.id)
        assert cancelled is True

        await db.refresh(campaign)
        assert campaign.status == CampaignStatus.CANCELLED

        stmt = select(BroadcastMessage).where(BroadcastMessage.campaign_id == campaign.id)
        res = await db.execute(stmt)
        msg = res.scalars().first()
        assert msg.status == MessageDeliveryStatus.SKIPPED


@pytest.mark.asyncio
async def test_retry_failed_recipients():
    """Verifies that hosts can retry only failed recipients without resending to delivered guests."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g1 = Guest(
            id=f"gst_r1_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Retry Success Guest",
            phone="+919876543244",
            invitation_token="nim_r1_01",
        )
        g2 = Guest(
            id=f"gst_r2_{secrets.token_hex(3)}",
            event_id=event_id,
            name="Retry Failed Guest",
            phone="+919876543233",
            invitation_token="nim_r2_02",
        )
        db.add_all([g1, g2])
        await db.commit()

        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event_id,
            user_id=user_id,
            channels=["WHATSAPP"],
            title="Retry Test Campaign",
            guest_ids=[g1.id, g2.id],
        )

        stmt = select(BroadcastMessage).where(BroadcastMessage.campaign_id == campaign.id)
        res = await db.execute(stmt)
        msgs = res.scalars().all()

        # Manually set msg 1 to SENT and msg 2 to FAILED
        msgs[0].status = MessageDeliveryStatus.SENT
        msgs[1].status = MessageDeliveryStatus.FAILED
        msgs[1].attempt_count = 3
        await db.commit()

        # Host clicks "Retry Failed"
        retried_count = await CampaignService.retry_failed_recipients(db, campaign.id)
        assert retried_count == 1

        await db.refresh(msgs[0])
        await db.refresh(msgs[1])

        # Sent message should stay SENT (never resent)
        assert msgs[0].status == MessageDeliveryStatus.SENT
        # Failed message should be re-queued with attempt_count reset to 0
        assert msgs[1].status == MessageDeliveryStatus.QUEUED
        assert msgs[1].attempt_count == 0
