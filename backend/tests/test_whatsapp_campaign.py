import pytest
import asyncio
from datetime import datetime, timezone
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.event import Event, EventType, EventStatus
from app.models.guest import Guest, RSVPStatus, GuestCategory
from app.models.campaign import (
    Campaign,
    BroadcastMessage,
    CampaignStatus,
    CampaignChannel,
    MessageDeliveryStatus,
    WhatsAppWebhookEvent,
)
from app.services.whatsapp.phone_utils import normalize_phone_number, mask_phone_number
from app.services.whatsapp.provider_base import WhatsAppSendResult
from app.services.whatsapp.meta_cloud_provider import MetaCloudWhatsAppProvider
from app.services.whatsapp.campaign_worker import WhatsAppCampaignWorker
from app.api.v1.endpoints.whatsapp_campaigns import (
    generate_personalized_invitation_url,
    render_invitation_text,
)


def test_phone_normalization():
    # 1. 10-digit Indian numbers
    ok, norm, _ = normalize_phone_number("9876543210")
    assert ok is True
    assert norm == "+919876543210"

    # 2. Formatted with spaces, dashes, +91
    ok, norm, _ = normalize_phone_number("+91 98765-43210")
    assert ok is True
    assert norm == "+919876543210"

    # 3. Leading 0 in India
    ok, norm, _ = normalize_phone_number("09876543210")
    assert ok is True
    assert norm == "+919876543210"

    # 4. International numbers (US, UK)
    ok, norm, _ = normalize_phone_number("+1 (415) 555-2671")
    assert ok is True
    assert norm == "+14155552671"

    ok, norm, _ = normalize_phone_number("+44 7911 123456")
    assert ok is True
    assert norm == "+447911123456"

    # 5. Invalid / malformed numbers
    ok, norm, reason = normalize_phone_number("")
    assert ok is False

    ok, norm, reason = normalize_phone_number("123")
    assert ok is False

    ok, norm, reason = normalize_phone_number("invalid_phone")
    assert ok is False


def test_mask_phone_number():
    masked = mask_phone_number("+919876543210")
    assert masked == "+9198****210"
    assert "7654" not in masked


def test_personalization_rendering():
    event = Event(
        id="evt_123",
        title="Rohit & Neha's Royal Wedding",
        slug="rohit-neha-wedding",
        host_name="Rohit & Neha Gupta",
        venue_name="The Taj Palace, Udaipur",
        start_date=datetime(2026, 12, 18, 18, 0, tzinfo=timezone.utc),
    )
    guest = Guest(
        id="gst_456",
        event_id="evt_123",
        name="Amit Sharma & Family",
        phone="+919811111111",
        invitation_token="secure_token_abc789",
    )

    url = generate_personalized_invitation_url(event, guest)
    assert "rohit-neha-wedding" in url
    assert "guest=secure_token_abc789" in url
    assert "gst_456" not in url  # DB ID must not be leaked

    rendered = render_invitation_text(event, guest, url)
    assert "Amit Sharma & Family" in rendered
    assert "The Taj Palace, Udaipur" in rendered
    assert "18 December 2026" in rendered
    assert url in rendered


def test_webhook_signature_verification():
    secret = "test_webhook_app_secret_12345"
    provider = MetaCloudWhatsAppProvider(app_secret=secret)

    raw_body = b'{"object": "whatsapp_business_account", "entry": []}'
    import hmac, hashlib
    expected_sig = "sha256=" + hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()

    # Valid signature
    assert provider.verify_webhook_signature(expected_sig, raw_body) is True

    # Tampered signature
    assert provider.verify_webhook_signature("sha256=invalid_hash_123", raw_body) is False


def test_webhook_payload_parsing():
    provider = MetaCloudWhatsAppProvider()

    sample_meta_payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "123456789",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {"display_phone_number": "1555001122"},
                            "statuses": [
                                {
                                    "id": "wamid.HBgM1234567890",
                                    "status": "delivered",
                                    "timestamp": "1771234567",
                                    "recipient_id": "919876543210",
                                }
                            ],
                        },
                        "field": "messages",
                    }
                ],
            }
        ],
    }

    updates = provider.parse_webhook_payload(sample_meta_payload)
    assert len(updates) == 1
    upd = updates[0]
    assert upd.provider_message_id == "wamid.HBgM1234567890"
    assert upd.status == "DELIVERED"
    assert upd.recipient_phone == "919876543210"
    assert "delivered_wamid.HBgM1234567890" in upd.provider_event_id


@pytest.mark.asyncio
async def test_end_to_end_campaign_workflow():
    async with AsyncSessionLocal() as db:
        # 1. Create a test event & guests
        event = Event(
            title="Test Broadcast Gala",
            slug="test-broadcast-gala",
            event_type=EventType.WEDDING,
            status=EventStatus.PUBLISHED,
            host_name="Sharma Family",
            venue_name="Taj Lake Palace",
            start_date=datetime.now(timezone.utc),
        )
        db.add(event)
        await db.flush()

        guest1 = Guest(
            event_id=event.id,
            name="Rahul Kapoor",
            phone="+919811223344",
            invitation_token="token_rahul_111",
        )
        guest2 = Guest(
            event_id=event.id,
            name="Pooja Mehta",
            phone="9822334455",
            invitation_token="token_pooja_222",
        )
        db.add_all([guest1, guest2])
        await db.commit()

        # 2. Create Broadcast Campaign & Message Jobs
        campaign = Campaign(
            event_id=event.id,
            title="Test Gala Invites",
            channel=CampaignChannel.WHATSAPP,
            status=CampaignStatus.QUEUED,
            total_recipients=2,
            queued_count=2,
        )
        db.add(campaign)
        await db.flush()

        msg1 = BroadcastMessage(
            campaign_id=campaign.id,
            event_id=event.id,
            guest_id=guest1.id,
            recipient=guest1.phone,
            normalized_phone="+919811223344",
            status=MessageDeliveryStatus.QUEUED,
            attempt_count=0,
            max_attempts=3,
        )
        msg2 = BroadcastMessage(
            campaign_id=campaign.id,
            event_id=event.id,
            guest_id=guest2.id,
            recipient=guest2.phone,
            normalized_phone="+919822334455",
            status=MessageDeliveryStatus.QUEUED,
            attempt_count=0,
            max_attempts=3,
        )
        db.add_all([msg1, msg2])
        await db.commit()

        # 3. Simulate Provider Mock for Worker Test
        worker = WhatsAppCampaignWorker(dispatch_delay_seconds=0.01)
        
        # Mock provider send method to return valid provider message ID
        class MockProvider:
            async def send_text_message(self, to_phone, text_body):
                return WhatsAppSendResult(
                    success=True,
                    provider_message_id=f"wamid.mock_{to_phone}",
                    status="SENT",
                )
            async def send_template_message(self, to_phone, template_name, language, components, fallback_text=""):
                return WhatsAppSendResult(
                    success=True,
                    provider_message_id=f"wamid.mock_{to_phone}",
                    status="SENT",
                )

        worker._provider = MockProvider()

        # Process single message through worker
        await worker._process_single_message(msg1.id)
        await worker._process_single_message(msg2.id)

        # Verify DB state updated to SENT
        await db.refresh(msg1)
        await db.refresh(msg2)
        assert msg1.status == MessageDeliveryStatus.SENT
        assert msg1.provider_message_id == "+919811223344" or "wamid.mock_" in msg1.provider_message_id
        assert msg2.status == MessageDeliveryStatus.SENT

        # 4. Simulate Delivery Webhook Callback
        from app.api.v1.endpoints.webhooks import receive_webhook_event
        from starlette.requests import Request
        import json

        webhook_data = {
            "object": "whatsapp_business_account",
            "entry": [
                {
                    "id": "123",
                    "changes": [
                        {
                            "value": {
                                "messaging_product": "whatsapp",
                                "statuses": [
                                    {
                                        "id": msg1.provider_message_id,
                                        "status": "delivered",
                                        "timestamp": "1771234567",
                                        "recipient_id": "919811223344",
                                    },
                                    {
                                        "id": msg2.provider_message_id,
                                        "status": "read",
                                        "timestamp": "1771234589",
                                        "recipient_id": "919822334455",
                                    }
                                ],
                            },
                            "field": "messages",
                        }
                    ],
                }
            ],
        }

        class MockRequest:
            async def body(self):
                return json.dumps(webhook_data).encode("utf-8")
            async def json(self):
                return webhook_data

        await receive_webhook_event(request=MockRequest(), db=db, x_hub_signature_256=None)

        # Verify msg1 is DELIVERED and msg2 is READ
        await db.refresh(msg1)
        await db.refresh(msg2)
        assert msg1.status == MessageDeliveryStatus.DELIVERED
        assert msg2.status == MessageDeliveryStatus.READ

        # Verify guest records updated
        await db.refresh(guest1)
        await db.refresh(guest2)
        assert guest1.delivery_status == "DELIVERED"
        assert guest2.delivery_status == "READ"
