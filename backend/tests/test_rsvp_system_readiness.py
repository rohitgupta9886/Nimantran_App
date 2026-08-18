import pytest
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.event import Event, EventType, EventStatus
from app.models.guest import Guest, GuestCategory, RSVPStatus, RSVP
from app.models.qr_pass import GuestEntryPass
from app.services.guest_service import GuestService
from app.schemas.guest import GuestCreate


async def _create_test_event_with_guests(db: AsyncSession, count: int = 2):
    """Helper to create a test event with multiple distinct guests and passes."""
    user = User(
        email=f"host_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="mock_hashed_password",
        full_name="Host User",
        role=UserRole.HOST,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    event_slug = f"celebration-{uuid.uuid4().hex[:6]}"
    event = Event(
        id=f"evt_{uuid.uuid4().hex[:8]}",
        user_id=user.id,
        title="Royal Celebration",
        slug=event_slug,
        event_type=EventType.WEDDING,
        status=EventStatus.PUBLISHED,
        start_date=datetime(2026, 12, 25, 18, 30, tzinfo=timezone.utc),
        venue_name="Grand Palace",
        venue_address="Lucknow, UP",
        host_name="Gupta Family",
        theme_config={"theme_id": "royal-amber", "recent_rsvps": []},
    )
    db.add(event)
    await db.flush()

    guests = []
    for i in range(count):
        g_create = GuestCreate(
            name=f"Guest Person {i+1}",
            phone=f"+9198765{i:05d}",
            email=f"guest{i+1}@example.com",
            relationship="Friend",
            group_name="Friends",
            category="NORMAL",
            adults_count=2,
            children_count=1,
        )
        g = await GuestService.create_guest(db, event.id, g_create, user_id=user.id)
        guests.append(g)

    await db.commit()
    return user, event, guests


@pytest.mark.asyncio
async def test_new_rsvp_token_submission():
    """Verifies new RSVP submission via personal token sets attendance, meal preference, and pass info."""
    async with AsyncSessionLocal() as db:
        user, event, guests = await _create_test_event_with_guests(db, count=1)
        guest = guests[0]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/rsvp",
            json={
                "status": "CONFIRMED",
                "adults_attending": 3,
                "children_attending": 1,
                "meal_preference": "Jain (only)",
                "notes": "Looking forward!",
            },
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["guest_name"] == guest.name
        assert data["status"] == "YES"
        assert data["status_label"] == "Attendance Confirmed"
        assert data["adults_attending"] == 3
        assert data["children_attending"] == 1
        assert data["total_attending"] == 4
        assert data["meal_preference"] == "Jain (only)"
        assert data["event_title"] == "Royal Celebration"


@pytest.mark.asyncio
async def test_repeat_rsvp_change_state_and_idempotency():
    """Verifies that changing RSVP (Attending -> Maybe -> Declined -> Attending) updates single record cleanly."""
    async with AsyncSessionLocal() as db:
        user, event, guests = await _create_test_event_with_guests(db, count=1)
        guest = guests[0]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Attending
        res1 = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/rsvp",
            json={"status": "CONFIRMED", "adults_attending": 2},
        )
        assert res1.status_code == 200
        assert res1.json()["data"]["status"] == "YES"

        # 2. Change to Maybe
        res2 = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/rsvp",
            json={"status": "MAYBE", "adults_attending": 2},
        )
        assert res2.status_code == 200
        assert res2.json()["data"]["status"] == "MAYBE"
        assert res2.json()["data"]["status_label"] == "Tentative (Maybe)"

        # 3. Change to Declined
        res3 = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/rsvp",
            json={"status": "NOT_ATTENDING"},
        )
        assert res3.status_code == 200
        assert res3.json()["data"]["status"] == "NO"
        assert res3.json()["data"]["adults_attending"] == 0

        # 4. Change back to Attending
        res4 = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/rsvp",
            json={"status": "CONFIRMED", "adults_attending": 4},
        )
        assert res4.status_code == 200
        assert res4.json()["data"]["status"] == "YES"
        assert res4.json()["data"]["adults_attending"] == 4

    # Verify single RSVP row exists in DB for this guest
    async with AsyncSessionLocal() as db:
        stmt = select(func.count(RSVP.id)).where(RSVP.guest_id == guest.id)
        res = await db.execute(stmt)
        count = res.scalar_one()
        assert count == 1


@pytest.mark.asyncio
async def test_plus_ones_headcount_boundary_validation():
    """Verifies that plus-ones headcount clamps invalid/negative/excessive numbers safely."""
    async with AsyncSessionLocal() as db:
        user, event, guests = await _create_test_event_with_guests(db, count=1)
        guest = guests[0]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Negative value should be clamped to 1
        res_neg = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/rsvp",
            json={"status": "CONFIRMED", "adults_attending": -5},
        )
        assert res_neg.status_code == 200
        assert res_neg.json()["data"]["adults_attending"] == 1

        # Excessive value (> 20) should be clamped to 20
        res_high = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/rsvp",
            json={"status": "CONFIRMED", "adults_attending": 999},
        )
        assert res_high.status_code == 200
        assert res_high.json()["data"]["adults_attending"] == 20


@pytest.mark.asyncio
async def test_multiple_guests_independent_rsvp():
    """Verifies multiple guests in the same event update their own RSVPs independently."""
    async with AsyncSessionLocal() as db:
        user, event, guests = await _create_test_event_with_guests(db, count=2)
        guest1, guest2 = guests[0], guests[1]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Guest 1 confirms 3 attendees
        await ac.post(
            f"/api/v1/public/invitations/t/{guest1.invitation_token}/rsvp",
            json={"status": "CONFIRMED", "adults_attending": 3},
        )
        # Guest 2 declines
        await ac.post(
            f"/api/v1/public/invitations/t/{guest2.invitation_token}/rsvp",
            json={"status": "NOT_ATTENDING"},
        )

    async with AsyncSessionLocal() as db:
        stmt1 = select(Guest).where(Guest.id == guest1.id)
        g1 = (await db.execute(stmt1)).scalar_one()
        stmt2 = select(Guest).where(Guest.id == guest2.id)
        g2 = (await db.execute(stmt2)).scalar_one()

        assert g1.rsvp_status == RSVPStatus.YES
        assert g1.adults_count == 3
        assert g2.rsvp_status == RSVPStatus.NO


@pytest.mark.asyncio
async def test_host_dashboard_expected_guests_headcount():
    """Verifies that host dashboard computes total expected headcount as the sum of attending guests."""
    async with AsyncSessionLocal() as db:
        user, event, guests = await _create_test_event_with_guests(db, count=3)
        g1, g2, g3 = guests[0], guests[1], guests[2]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # g1: 3 adults + 2 children = 5
        await ac.post(
            f"/api/v1/public/invitations/t/{g1.invitation_token}/rsvp",
            json={"status": "CONFIRMED", "adults_attending": 3, "children_attending": 2},
        )
        # g2: 2 adults + 1 child = 3
        await ac.post(
            f"/api/v1/public/invitations/t/{g2.invitation_token}/rsvp",
            json={"status": "CONFIRMED", "adults_attending": 2, "children_attending": 1},
        )
        # g3: Declines = 0
        await ac.post(
            f"/api/v1/public/invitations/t/{g3.invitation_token}/rsvp",
            json={"status": "NOT_ATTENDING"},
        )

        from app.core.security import create_access_token
        token = create_access_token(subject=user.id)
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get(f"/api/v1/events/{event.id}/rsvp-analytics", headers=headers)
        assert res.status_code == 200
        stats = res.json()["data"]

        assert stats["total_invited"] == 3
        assert stats["confirmed_count"] == 2
        assert stats["declined_count"] == 1
        # Expected headcount = 5 (from g1) + 3 (from g2) = 8 total expected people!
        assert stats["total_expected_guests"] == 8
        assert stats["total_expected_adults"] == 5
        assert stats["total_expected_children"] == 3


@pytest.mark.asyncio
async def test_invalid_token_rejected_404():
    """Verifies that an invalid/non-existent invitation token returns 404 cleanly."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/public/invitations/t/fake_non_existent_token/rsvp",
            json={"status": "CONFIRMED", "adults_attending": 2},
        )
        assert res.status_code == 404
        assert "invalid" in res.json()["detail"].lower() or "not found" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_generic_slug_rsvp_flow():
    """Verifies that RSVP via public event slug identifies/creates guest and returns proper confirmation."""
    async with AsyncSessionLocal() as db:
        user, event, guests = await _create_test_event_with_guests(db, count=1)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/public/events/{event.slug}/rsvp",
            json={
                "guest_name": "New Walk-in Friend",
                "phone": "+919999988888",
                "status": "CONFIRMED",
                "adults_attending": 2,
                "children_attending": 0,
                "meal_preference": "Veg (only)",
                "notes": "Excited!",
            },
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["guest_name"] == "New Walk-in Friend"
        assert data["status"] == "YES"
        assert data["status_label"] == "Attendance Confirmed"
        assert data["adults_attending"] == 2
