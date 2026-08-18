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
from app.models.guest import Guest, GuestCategory, RSVPStatus, RSVP
from app.models.qr_pass import GuestEntryPass, PassStatus
from app.services.guest_service import GuestService
from app.schemas.guest import GuestCreate


async def _create_test_event_and_guest(db: AsyncSession, is_family: bool = False):
    """Helper to create a test event with a guest, pass code, and invitation token."""
    user = User(
        email=f"host_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="mock_hashed_password",
        full_name="Host User",
        role=UserRole.HOST,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    event_slug = f"priyanka-rohit-{uuid.uuid4().hex[:6]}"
    event = Event(
        id=f"evt_{uuid.uuid4().hex[:8]}",
        user_id=user.id,
        title="Priyanka & Rohit Wedding",
        slug=event_slug,
        event_type=EventType.WEDDING,
        status=EventStatus.PUBLISHED,
        start_date=datetime(2026, 12, 25, 18, 30, tzinfo=timezone.utc),
        venue_name="The Grand Palace",
        venue_address="Vipin Khand, Gomti Nagar, Lucknow",
        host_name="Gupta Family",
        theme_config={
            "theme_id": "royal-amber",
            "wishes": [],
            "memories": [{"title": "Our First Meeting", "story": "Coffee on a rainy afternoon."}],
        },
    )
    db.add(event)
    await db.flush()

    guest_create = GuestCreate(
        name="Rahul Verma",
        phone="+919876500001",
        email="rahul@example.com",
        relationship="Family Uncle" if is_family else "Friend",
        group_name="Family" if is_family else "Friends",
        category="FAMILY" if is_family else "NORMAL",
        adults_count=2,
        children_count=1,
    )
    guest = await GuestService.create_guest(db, event.id, guest_create, user_id=user.id)
    await db.commit()

    return user.id, event.id, event.slug, guest


@pytest.mark.asyncio
async def test_personalized_token_lookup_success():
    """Verifies token lookup returns guest salutation, real pass code, and zero leaked PII."""
    async with AsyncSessionLocal() as db:
        user_id, event_id, event_slug, guest = await _create_test_event_and_guest(db, is_family=False)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/public/invitations/t/{guest.invitation_token}")
        assert res.status_code == 200
        data = res.json()["data"]

        assert data["guest_name"] == "Rahul Verma"
        assert "Dear Rahul Verma" in data["salutation"]
        assert data["token"] == guest.invitation_token
        assert data["event"]["title"] == "Priyanka & Rohit Wedding"
        assert data["pass_code"] is not None
        assert "NIM" in data["pass_code"] or len(data["pass_code"]) > 3
        # Critical privacy assertion: private host user_id must NOT be leaked
        assert "user_id" not in data["event"]


@pytest.mark.asyncio
async def test_family_category_salutation_formatting():
    """Verifies guests in Family category receive 'Dear {Name} & Family ❤️' salutation."""
    async with AsyncSessionLocal() as db:
        user_id, event_id, event_slug, guest = await _create_test_event_and_guest(db, is_family=True)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/public/invitations/t/{guest.invitation_token}")
        assert res.status_code == 200
        data = res.json()["data"]
        assert "Rahul Verma & Family" in data["salutation"]


@pytest.mark.asyncio
async def test_delivery_tracking_updates_open_count():
    """Verifies that viewing an invitation marks delivery status as READ and increments open_count."""
    async with AsyncSessionLocal() as db:
        user_id, event_id, event_slug, guest = await _create_test_event_and_guest(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Open 1st time
        await ac.get(f"/api/v1/public/invitations/t/{guest.invitation_token}")
        # Open 2nd time
        await ac.get(f"/api/v1/public/invitations/t/{guest.invitation_token}")

    async with AsyncSessionLocal() as db:
        stmt = select(Guest).where(Guest.id == guest.id)
        res = await db.execute(stmt)
        updated_guest = res.scalar_one()
        assert updated_guest.delivery_status == "READ"
        assert updated_guest.open_count >= 2
        assert updated_guest.first_opened_at is not None
        assert updated_guest.last_opened_at is not None


@pytest.mark.asyncio
async def test_generic_slug_lookup_no_fake_guest_names():
    """Verifies generic slug lookup returns clean event info without fabricating guest names."""
    async with AsyncSessionLocal() as db:
        user_id, event_id, event_slug, guest = await _create_test_event_and_guest(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/public/events/{event_slug}")
        assert res.status_code == 200
        data = res.json()["data"]

        assert data["event"]["title"] == "Priyanka & Rohit Wedding"
        # Ensure no fake guest name is returned in generic response
        assert "guest_name" not in data
        assert "pass_code" not in data
        assert "user_id" not in data["event"]


@pytest.mark.asyncio
async def test_token_based_rsvp_submission():
    """Verifies that submitting RSVP via token updates guest record and upserts RSVP."""
    async with AsyncSessionLocal() as db:
        user_id, event_id, event_slug, guest = await _create_test_event_and_guest(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/rsvp",
            json={
                "status": "CONFIRMED",
                "adults_attending": 3,
                "meal_preference": "Jain (only)",
                "notes": "Wheelchair access needed",
            },
        )
        assert res.status_code == 200
        assert "confirmed" in res.json()["message"].lower()

    async with AsyncSessionLocal() as db:
        stmt = select(Guest).where(Guest.id == guest.id)
        res = await db.execute(stmt)
        updated = res.scalar_one()
        assert updated.rsvp_status == RSVPStatus.YES
        assert updated.adults_count == 3
        assert "Jain" in (updated.notes or "")


@pytest.mark.asyncio
async def test_slug_based_rsvp_submission():
    """Verifies that submitting RSVP via generic event slug finds/creates guest and records RSVP."""
    async with AsyncSessionLocal() as db:
        user_id, event_id, event_slug, _ = await _create_test_event_and_guest(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/public/events/{event_slug}/rsvp",
            json={
                "guest_name": "Meera Sen",
                "phone": "+919811223344",
                "status": "YES",
                "adults_attending": 2,
                "meal_preference": "Veg (only)",
                "notes": "Looking forward!",
            },
        )
        assert res.status_code == 200
        assert "recorded" in res.json()["message"].lower()

    async with AsyncSessionLocal() as db:
        stmt = select(Guest).where(Guest.event_id == event_id, Guest.name == "Meera Sen")
        res = await db.execute(stmt)
        created = res.scalar_one_or_none()
        assert created is not None
        assert created.rsvp_status == RSVPStatus.YES
        assert created.phone == "+919811223344"


@pytest.mark.asyncio
async def test_token_based_wish_submission():
    """Verifies that submitting a blessing via token adds wish and updates guest quote."""
    async with AsyncSessionLocal() as db:
        user_id, event_id, event_slug, guest = await _create_test_event_and_guest(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/public/invitations/t/{guest.invitation_token}/wishes",
            json={
                "sender_name": "Rahul Verma",
                "relationship": "Friend",
                "message": "Wishing you both a lifetime of eternal joy and happiness!",
            },
        )
        assert res.status_code == 200
        assert res.json()["data"]["message"] == "Wishing you both a lifetime of eternal joy and happiness!"

    async with AsyncSessionLocal() as db:
        stmt = select(Guest).where(Guest.id == guest.id)
        res = await db.execute(stmt)
        updated = res.scalar_one()
        assert "eternal joy" in (updated.custom_welcome_quote or "")


@pytest.mark.asyncio
async def test_invalid_token_returns_clean_404():
    """Verifies that an invalid token returns clean 404 with friendly detail."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/public/invitations/t/invalid_token_xyz999")
        assert res.status_code == 404
        assert "invalid" in res.json()["detail"].lower() or "not found" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_invalid_slug_returns_clean_404():
    """Verifies that an invalid event slug returns clean 404 with friendly detail."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/public/events/nonexistent_event_slug_123")
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower() or "expired" in res.json()["detail"].lower()
