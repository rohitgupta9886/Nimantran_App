import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone

from app.main import app
from app.core.database import AsyncSessionLocal
from app.db.init_db import init_db
from app.core.security import create_access_token
from app.models.user import User
from app.models.event import Event, EventType, EventStatus
from app.models.guest import Guest, RSVPStatus, GuestCategory
from app.models.campaign import Campaign, CampaignStatus


async def _setup_host_and_event(db):
    await init_db()
    # 1. Create Host User
    host = User(
        email=f"concierge_host_{datetime.now(timezone.utc).timestamp()}@example.com",
        hashed_password="hashed_pwd_secret",
        full_name="Rajesh Sharma",
        phone="919876543210",
        is_active=True,
    )
    # 2. Create Another User
    other = User(
        email=f"other_user_{datetime.now(timezone.utc).timestamp()}@example.com",
        hashed_password="hashed_pwd_secret",
        full_name="Other Person",
        phone="919876543211",
        is_active=True,
    )
    db.add_all([host, other])
    await db.commit()
    await db.refresh(host)
    await db.refresh(other)

    # 3. Create Event for Host
    event = Event(
        user_id=host.id,
        title="Priyanka & Rohit's Wedding",
        slug=f"priyanka-rohit-wedding-{datetime.now(timezone.utc).timestamp()}",
        event_type=EventType.WEDDING,
        status=EventStatus.PUBLISHED,
        host_name="Rajesh Sharma",
        start_date=datetime(2026, 12, 25, 18, 0, tzinfo=timezone.utc),
        venue_name="Grand Palace Lucknow",
        venue_address="Vipin Khand, Gomti Nagar, Lucknow",
        theme_config={"primary_color": "royal_crimson"},
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # 4. Add initial guests with distinct RSVP statuses
    g1 = Guest(
        event_id=event.id,
        name="Rahul Verma",
        phone="919876500001",
        relationship="Friend",
        rsvp_status=RSVPStatus.YES,
        adults_count=2,
        children_count=1,
    )
    g2 = Guest(
        event_id=event.id,
        name="Amitabh Bachchan",
        phone="919876500002",
        relationship="VIP",
        rsvp_status=RSVPStatus.PENDING,
        adults_count=1,
        children_count=0,
    )
    g3 = Guest(
        event_id=event.id,
        name="Sunita Kapoor",
        phone="919876500003",
        relationship="Relative",
        rsvp_status=RSVPStatus.NO,
        adults_count=1,
        children_count=0,
    )
    db.add_all([g1, g2, g3])
    await db.commit()

    return host, other, event, g1, g2, g3


@pytest.mark.asyncio
async def test_concierge_create_event():
    """Verifies that AI understands event creation intent and invokes EventService."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={"message": "Shaadi ka invitation card create karna hai."},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["intent"] == "CREATE_EVENT"
        assert data["action_executed"] is True
        assert "event_id" in data["execution_result"]
        assert "Wedding" in data["execution_result"]["title"]


@pytest.mark.asyncio
async def test_concierge_modify_event():
    """Verifies that AI changes theme colors/design via EventService."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={
                "event_id": event.id,
                "message": "Invitation ka colour change karke Emerald Gold karna hai.",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["intent"] == "MODIFY_EVENT"
        assert data["action_executed"] is True
        assert "Emerald" in data["reply_text"] or "gold" in str(data["execution_result"]).lower()


@pytest.mark.asyncio
async def test_concierge_add_guest():
    """Verifies that AI understands intent to add a guest and calls GuestService."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={
                "event_id": event.id,
                "message": "Vikas Khanna ko 919811223344 guest list mein add karo.",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["intent"] == "ADD_GUEST"
        assert data["action_executed"] is True
        assert "Vikas" in data["execution_result"]["name"]


@pytest.mark.asyncio
async def test_concierge_query_rsvp():
    """Verifies that AI queries live guest stats and explains real attendance numbers."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={
                "event_id": event.id,
                "message": "Kitne guests confirm hain?",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["intent"] == "QUERY_RSVP"
        assert data["action_executed"] is True
        # 1 attending (Rahul Verma with 2 adults + 1 child = 3 headcount), 1 pending, 1 declined = 3 total
        assert data["execution_result"]["total"] == 3
        assert data["execution_result"]["attending"] == 1
        assert data["execution_result"]["pending"] == 1


@pytest.mark.asyncio
async def test_concierge_generate_invitation():
    """Verifies that AI generates culturally rich wording using canonical AIService."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={
                "event_id": event.id,
                "message": "Mujhe Hindi invitation chahiye.",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["intent"] == "GENERATE_INVITATION"
        assert data["action_executed"] is True
        assert "canonical" in data["execution_result"]


@pytest.mark.asyncio
async def test_concierge_preview_campaign_requires_confirmation():
    """
    CRITICAL SAFETY REQUIREMENT:
    AI should NEVER directly execute destructive or expensive broadcast actions without confirmation.
    """
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={
                "event_id": event.id,
                "message": "Sabko WhatsApp bhej do.",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["intent"] == "PREPARE_CAMPAIGN"
        assert data["requires_confirmation"] is True
        assert data["action_executed"] is False
        assert data["structured_action"] is not None
        assert data["structured_action"]["preview_data"]["target_count"] == 3
        assert "Estimated messages" in data["reply_text"]


@pytest.mark.asyncio
async def test_concierge_send_campaign_after_confirmation():
    """Verifies that broadcast campaign ONLY executes after host explicitly confirms."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Trigger broadcast intent
        prep_res = await ac.post(
            "/api/v1/concierge/chat",
            json={"event_id": event.id, "message": "Sabko WhatsApp bhej do."},
            headers=headers,
        )
        assert prep_res.status_code == 200
        prep_data = prep_res.json()["data"]
        action_id = prep_data["structured_action"]["action_id"]

        # Step 2: Confirm action
        confirm_res = await ac.post(
            "/api/v1/concierge/confirm-action",
            json={"action_id": action_id, "confirmed": True, "event_id": event.id},
            headers=headers,
        )
        assert confirm_res.status_code == 200
        confirm_data = confirm_res.json()["data"]
        assert confirm_data["action_executed"] is True
        assert confirm_data["execution_result"]["total_recipients"] == 3


@pytest.mark.asyncio
async def test_concierge_cancel_campaign():
    """Verifies that host cancellation aborts broadcast with zero sent messages."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Trigger broadcast intent
        prep_res = await ac.post(
            "/api/v1/concierge/chat",
            json={"event_id": event.id, "message": "RSVP pending guests ko reminder bhejo."},
            headers=headers,
        )
        prep_data = prep_res.json()["data"]
        action_id = prep_data["structured_action"]["action_id"]

        # Step 2: Cancel action
        cancel_res = await ac.post(
            "/api/v1/concierge/confirm-action",
            json={"action_id": action_id, "confirmed": False, "event_id": event.id},
            headers=headers,
        )
        assert cancel_res.status_code == 200
        cancel_data = cancel_res.json()["data"]
        assert cancel_data["action_executed"] is False
        assert "रद्द" in cancel_data["reply_text"] or "cancelled" in cancel_data["reply_text"].lower()


@pytest.mark.asyncio
async def test_concierge_resend_single_guest_invitation():
    """Verifies that host can resend invitation to a specific individual guest."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={
                "event_id": event.id,
                "message": "Rahul ko invitation dobara bhejna hai.",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["intent"] == "RESEND_INVITATION"
        assert data["action_executed"] is True
        assert "Rahul Verma" in data["reply_text"]


@pytest.mark.asyncio
async def test_concierge_advice_and_navigation():
    """Verifies that AI provides expert advice for high guest counts and navigates smoothly."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    token = create_access_token(host.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={
                "event_id": event.id,
                "message": "Wedding mein 250 guests hain, kya karna chahiye?",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["intent"] == "NAVIGATE_OR_ADVISE"
        assert "250" in data["reply_text"]
        assert "QR" in data["reply_text"] or "Guest List" in data["reply_text"]


@pytest.mark.asyncio
async def test_concierge_unauthorized_event_access_forbidden():
    """Verifies that a user cannot query or modify another user's event through concierge."""
    async with AsyncSessionLocal() as db:
        host, other, event, g1, g2, g3 = await _setup_host_and_event(db)

    other_token = create_access_token(other.id)
    headers = {"Authorization": f"Bearer {other_token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/concierge/chat",
            json={
                "event_id": event.id,
                "message": "Kitne guests confirm hain?",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert "एक्सेस नहीं है" in data["reply_text"] or "नहीं मिला" in data["reply_text"]
