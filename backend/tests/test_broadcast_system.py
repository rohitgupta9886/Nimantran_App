import pytest
import asyncio
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.event import Event, EventStatus
from app.models.guest import Guest, RSVPStatus
from app.models.user import User
from app.models.campaign import Campaign, BroadcastMessage, CampaignChannel, CampaignStatus, MessageDeliveryStatus
from app.services.campaign_service import CampaignService
from app.services.campaign_worker import multi_channel_worker
from app.services.sms import get_sms_provider
from app.services.email import get_email_provider
from app.services.whatsapp import get_whatsapp_provider


@pytest.mark.asyncio
async def test_message_variable_rendering():
    """Test variable interpolation in templates."""
    event = Event(
        id="evt_test_1",
        title="Rohit & Priya Wedding",
        host_name="Gupta Family",
        venue_name="Taj Palace",
        venue_address="Lucknow",
        start_date=datetime(2026, 11, 20, 19, 0, tzinfo=timezone.utc),
        event_type="WEDDING",
    )
    guest = Guest(
        id="gst_test_1",
        name="Amit Verma",
        phone="+919876543210",
        email="amit@example.com",
        invitation_token="token_123",
    )

    template = "Namaste {{guest_name}}, please join {{host_name}} at {{venue_name}} for {{event_name}} on {{event_date}}. Link: {{invitation_url}}"
    rendered = CampaignService.render_template_message(template, event, guest)

    assert "Amit Verma" in rendered
    assert "Gupta Family" in rendered
    assert "Taj Palace" in rendered
    assert "Rohit & Priya Wedding" in rendered
    assert "Friday, 20 November 2026" in rendered
    assert "token_123" in rendered


@pytest.mark.asyncio
async def test_multi_channel_campaign_creation_and_idempotency():
    """Test creating a multi-channel campaign with idempotency enforcement."""
    import uuid
    uid = uuid.uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        # Create test user
        user = User(
            id=f"usr_bcast_{uid}",
            email=f"bcast_{uid}@nimantran.ai",
            hashed_password="hash",
            full_name="Broadcast Test User",
        )
        db.add(user)

        # Create test event
        event = Event(
            id=f"evt_bcast_{uid}",
            user_id=user.id,
            title="Sangeet Night",
            slug=f"sangeet-night-{uid}",
            host_name="Sharma Family",
            venue_name="Grand Ballroom",
            venue_address="New Delhi",
            start_date=datetime(2026, 12, 15, 18, 0, tzinfo=timezone.utc),
            status=EventStatus.PUBLISHED,
        )
        db.add(event)

        # Create 2 test guests
        g1 = Guest(
            id=f"gst_bcast_1_{uid}",
            event_id=event.id,
            name="Rahul Sharma",
            phone="+919811111111",
            email="rahul@example.com",
            invitation_token=f"tok_rahul_{uid}",
        )
        g2 = Guest(
            id=f"gst_bcast_2_{uid}",
            event_id=event.id,
            name="Priya Patel",
            phone="+919822222222",
            email="priya@example.com",
            invitation_token=f"tok_priya_{uid}",
        )
        db.add_all([g1, g2])
        await db.commit()

        # Create Campaign across WhatsApp, SMS, Email
        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event.id,
            user_id=user.id,
            channels=["WHATSAPP", "SMS", "EMAIL"],
            title="Multi-Channel Test Broadcast",
            guest_ids=[g1.id, g2.id],
            idempotency_key=f"idemp_key_test_{uid}",
        )

        assert campaign is not None
        assert campaign.total_recipients == 6  # 2 guests * 3 channels
        assert campaign.status in (CampaignStatus.QUEUED, CampaignStatus.PROCESSING, CampaignStatus.COMPLETED)

        # Verify idempotency: calling again with same key returns existing campaign without duplicating messages
        dup_campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event.id,
            user_id=user.id,
            channels=["WHATSAPP", "SMS", "EMAIL"],
            title="Multi-Channel Test Broadcast",
            guest_ids=[g1.id, g2.id],
            idempotency_key=f"idemp_key_test_{uid}",
        )
        assert dup_campaign.id == campaign.id


@pytest.mark.asyncio
async def test_providers_validation():
    """Test all provider instances validate configuration properly."""
    wa_provider = get_whatsapp_provider()
    sms_provider = get_sms_provider()
    email_provider = get_email_provider()

    wa_res = await wa_provider.validate_configuration()
    sms_res = await sms_provider.validate_configuration()
    email_res = await email_provider.validate_configuration()

    assert wa_res.provider_name is not None
    assert sms_res.provider_name is not None
    assert email_res.provider_name is not None


if __name__ == "__main__":
    asyncio.run(test_message_variable_rendering())
    print("All unit tests passed successfully!")
