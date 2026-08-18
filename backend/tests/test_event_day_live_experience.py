import pytest
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.event import Event, EventType, EventStatus
from app.models.guest import Guest, RSVPStatus, GuestCategory
from app.models.welcome import WelcomeMessage
from app.models.qr_pass import GuestEntryPass
from app.services.guest_service import GuestService
from app.schemas.guest import GuestCreate


async def _setup_event_for_welcome_tests(db: AsyncSession):
    user = User(
        email=f"host_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="mock_hashed_password",
        full_name="Host User",
        role=UserRole.HOST,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    event = Event(
        id=f"evt_{uuid.uuid4().hex[:8]}",
        user_id=user.id,
        title="Ananya & Siddharth Grand Wedding",
        slug=f"wedding-{uuid.uuid4().hex[:6]}",
        event_type=EventType.WEDDING,
        status=EventStatus.PUBLISHED,
        start_date=datetime(2026, 11, 20, 19, 0, tzinfo=timezone.utc),
        venue_name="The Leela Palace, Udaipur",
        venue_address="Lake Pichola, Udaipur",
        host_name="Sharma & Verma Family",
    )
    db.add(event)
    await db.flush()

    # Create VIP Guest with custom quote
    g1 = await GuestService.create_guest(
        db,
        event.id,
        GuestCreate(
            name="Uncle Ramesh Sharma",
            phone="+919876543210",
            email="ramesh.private@example.com",
            relationship="Groom's Elder Uncle",
            adults_count=2,
            children_count=1,
            category=GuestCategory.VIP,
        ),
        user_id=user.id,
    )
    g1.custom_welcome_quote = "Wishing the couple infinite love and joyful beginnings! ❤️"
    g1.rsvp_status = RSVPStatus.YES

    # Create Regular Guest
    g2 = await GuestService.create_guest(
        db,
        event.id,
        GuestCreate(
            name="Pooja Mehta",
            phone="+919876543299",
            email="pooja.private@example.com",
            relationship="Bride's College Friend",
            adults_count=1,
            children_count=0,
        ),
        user_id=user.id,
    )
    g2.rsvp_status = RSVPStatus.YES
    await db.commit()

    # Retrieve passes
    stmt = select(GuestEntryPass).where(GuestEntryPass.guest_id.in_([g1.id, g2.id]))
    passes = list((await db.execute(stmt)).scalars().all())
    pass_map = {p.guest_id: p for p in passes}

    return user, event, g1, g2, pass_map[g1.id], pass_map[g2.id]


@pytest.mark.asyncio
async def test_checkin_creates_welcome_message():
    """Verifies that gate check-in persists a WelcomeMessage entry for the TV screen."""
    async with AsyncSessionLocal() as db:
        user, event, g1, g2, p1, p2 = await _setup_event_for_welcome_tests(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": p1.pass_code, "event_id": event.id, "location_name": "Gate 1"},
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["guest_name"] == "Uncle Ramesh Sharma"
        assert "Welcome Uncle Ramesh Sharma" in data["message"]
        assert data["welcome_quote"] == "Wishing the couple infinite love and joyful beginnings! ❤️"

    # Verify database persistence
    async with AsyncSessionLocal() as db:
        wm = (
            await db.execute(
                select(WelcomeMessage).where(WelcomeMessage.guest_id == g1.id)
            )
        ).scalar_one_or_none()
        assert wm is not None
        assert wm.guest_name == "Uncle Ramesh Sharma"
        assert wm.is_vip is True
        assert wm.welcome_quote == "Wishing the couple infinite love and joyful beginnings! ❤️"


@pytest.mark.asyncio
async def test_welcome_feed_sanitization_zero_pii_leaked():
    """Verifies that GET /events/{id}/welcome-feed exposes NO private guest data (no phone, no email)."""
    async with AsyncSessionLocal() as db:
        user, event, g1, g2, p1, p2 = await _setup_event_for_welcome_tests(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Check in g1
        await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": p1.pass_code, "event_id": event.id},
        )

        res = await ac.get(f"/api/v1/events/{event.id}/welcome-feed")
        assert res.status_code == 200
        data = res.json()["data"]

        # Check event branding
        assert data["event"]["title"] == "Ananya & Siddharth Grand Wedding"
        assert data["event"]["host_name"] == "Sharma & Verma Family"
        assert data["event"]["venue_name"] == "The Leela Palace, Udaipur"

        # Check recent arrivals sanitization
        arrivals = data["recent_arrivals"]
        assert len(arrivals) >= 1
        arr = arrivals[0]
        assert arr["guest_name"] == "Uncle Ramesh Sharma"
        assert arr["relationship"] == "Groom's Elder Uncle"
        assert arr["is_vip"] is True

        # STRICT PRIVACY: Zero PII
        raw_json_str = res.text
        assert "ramesh.private@example.com" not in raw_json_str
        assert "+919876543210" not in raw_json_str
        assert "email" not in arr
        assert "phone" not in arr


@pytest.mark.asyncio
async def test_welcome_feed_chronological_ordering():
    """Verifies that multiple check-ins appear in reverse chronological order (latest first)."""
    async with AsyncSessionLocal() as db:
        user, event, g1, g2, p1, p2 = await _setup_event_for_welcome_tests(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Check in g1 first
        await ac.post("/api/v1/scanner/verify", json={"pass_code": p1.pass_code, "event_id": event.id})
        # 2. Check in g2 second
        await ac.post("/api/v1/scanner/verify", json={"pass_code": p2.pass_code, "event_id": event.id})

        res = await ac.get(f"/api/v1/events/{event.id}/welcome-feed")
        assert res.status_code == 200
        arrivals = res.json()["data"]["recent_arrivals"]

        assert len(arrivals) == 2
        # Latest checked-in guest (g2) should be first
        assert arrivals[0]["guest_name"] == "Pooja Mehta"
        assert arrivals[1]["guest_name"] == "Uncle Ramesh Sharma"


@pytest.mark.asyncio
async def test_invalid_event_welcome_feed_404():
    """Verifies that querying a non-existent event ID returns a clean 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/events/evt_nonexistent_9999/welcome-feed")
        assert res.status_code == 404
        assert "Event not found" in res.json()["detail"]
