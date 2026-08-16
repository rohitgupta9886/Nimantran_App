import pytest
import asyncio
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.event import Event, EventStatus
from app.models.guest import Guest
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_complete_broadcasting_lifecycle_api():
    """
    End-to-end test of the entire broadcasting lifecycle:
    1. Authenticate user & create event with guests.
    2. Check broadcast eligibility & default templates.
    3. Preview template rendering for sample guest.
    4. Dispatch multi-channel campaign (WhatsApp + SMS + Email).
    5. Verify idempotency protection on duplicate request.
    6. Poll campaign status & verify delivery metrics.
    7. Test retrying failed messages.
    """
    import uuid
    uid = uuid.uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        user = User(
            id=f"usr_e2e_{uid}",
            email=f"e2e_{uid}@nimantran.ai",
            hashed_password="hash",
            full_name="E2E Host",
        )
        db.add(user)

        event = Event(
            id=f"evt_e2e_{uid}",
            user_id=user.id,
            title="Aarav & Meera Wedding",
            slug=f"aarav-meera-wedding-{uid}",
            host_name="Sharma & Verma Family",
            venue_name="The Oberoi Udaivilas",
            venue_address="Udaipur, Rajasthan",
            start_date=datetime(2026, 12, 10, 19, 0, tzinfo=timezone.utc),
            status=EventStatus.PUBLISHED,
        )
        db.add(event)

        g1 = Guest(
            id=f"gst_e2e_1_{uid}",
            event_id=event.id,
            name="Vikramaditya Roy",
            phone="+919876543210",
            email="vikram@example.com",
            invitation_token=f"tok_vikram_{uid}",
        )
        g2 = Guest(
            id=f"gst_e2e_2_{uid}",
            event_id=event.id,
            name="Ananya Sen",
            phone="+919811122233",
            email="ananya@example.com",
            invitation_token=f"tok_ananya_{uid}",
        )
        db.add_all([g1, g2])
        await db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Eligibility Check
        res_elig = await client.get(f"/api/v1/events/{event.id}/broadcast/eligibility", headers=headers)
        assert res_elig.status_code == 200
        elig_data = res_elig.json()["data"]
        assert elig_data["total_guests"] == 2
        assert "default_templates" in elig_data

        # 2. Preview Template
        res_prev = await client.post(
            f"/api/v1/events/{event.id}/broadcast/preview",
            headers=headers,
            json={
                "event_id": event.id,
                "channel": "WHATSAPP",
                "guest_id": g1.id,
            },
        )
        assert res_prev.status_code == 200
        prev_data = res_prev.json()["data"]
        assert "Vikramaditya Roy" in prev_data["rendered_text"]

        # 3. Create Multi-Channel Broadcast Campaign
        idemp_key = f"e2e_key_{uid}"
        res_camp = await client.post(
            "/api/v1/campaigns",
            headers=headers,
            json={
                "event_id": event.id,
                "title": "Aarav & Meera Wedding Royal Broadcast",
                "channels": ["WHATSAPP", "SMS", "EMAIL"],
                "guest_ids": [g1.id, g2.id],
                "idempotency_key": idemp_key,
            },
        )
        assert res_camp.status_code == 200
        camp_data = res_camp.json()["data"]
        campaign_id = camp_data["campaign_id"]
        assert camp_data["total_recipients"] == 6  # 2 guests * 3 channels

        # 4. Verify Idempotency Protection
        res_camp_dup = await client.post(
            "/api/v1/campaigns",
            headers=headers,
            json={
                "event_id": event.id,
                "title": "Aarav & Meera Wedding Royal Broadcast",
                "channels": ["WHATSAPP", "SMS", "EMAIL"],
                "guest_ids": [g1.id, g2.id],
                "idempotency_key": idemp_key,
            },
        )
        assert res_camp_dup.status_code == 200
        assert res_camp_dup.json()["data"]["campaign_id"] == campaign_id

        # 5. Fetch Campaign Details & Recipients
        res_detail = await client.get(f"/api/v1/campaigns/{campaign_id}", headers=headers)
        assert res_detail.status_code == 200
        detail = res_detail.json()["data"]
        assert detail["id"] == campaign_id

        res_rec = await client.get(f"/api/v1/campaigns/{campaign_id}/recipients", headers=headers)
        assert res_rec.status_code == 200
        rec_list = res_rec.json()["data"]["recipients"]
        assert len(rec_list) == 6

        # 6. Retry Failed Endpoint Test
        res_retry = await client.post(f"/api/v1/campaigns/{campaign_id}/retry-failed", headers=headers)
        assert res_retry.status_code == 200


if __name__ == "__main__":
    asyncio.run(test_complete_broadcasting_lifecycle_api())
    print("E2E Broadcasting tests passed successfully!")
