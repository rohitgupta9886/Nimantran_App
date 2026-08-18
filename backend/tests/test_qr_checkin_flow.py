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
from app.models.guest import Guest, RSVPStatus
from app.models.qr_pass import GuestEntryPass, Checkin, PassStatus
from app.services.guest_service import GuestService
from app.schemas.guest import GuestCreate
from app.core.security import create_access_token


async def _create_test_event_with_pass(db: AsyncSession, guest_name: str = "Rahul Sharma", rsvp_status: RSVPStatus = RSVPStatus.YES):
    """Helper to create an event and guest with generated entry pass."""
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
        title="Priyanka & Rohit Wedding",
        slug=f"wedding-{uuid.uuid4().hex[:6]}",
        event_type=EventType.WEDDING,
        status=EventStatus.PUBLISHED,
        start_date=datetime(2026, 12, 25, 18, 30, tzinfo=timezone.utc),
        venue_name="Taj Palace",
        venue_address="Delhi, India",
        host_name="Gupta Family",
    )
    db.add(event)
    await db.flush()

    g_create = GuestCreate(
        name=guest_name,
        phone="+919876543210",
        email="rahul@example.com",
        relationship="Close Friend",
        adults_count=2,
        children_count=1,
    )
    guest = await GuestService.create_guest(db, event.id, g_create, user_id=user.id)
    guest.rsvp_status = rsvp_status
    await db.commit()

    # Re-query guest with entry pass
    stmt = select(Guest).where(Guest.id == guest.id)
    res = await db.execute(stmt)
    guest = res.scalars().first()

    stmt_pass = select(GuestEntryPass).where(GuestEntryPass.guest_id == guest.id)
    res_pass = await db.execute(stmt_pass)
    pass_obj = res_pass.scalars().first()

    return user, event, guest, pass_obj


@pytest.mark.asyncio
async def test_valid_qr_checkin_first_time():
    """Verifies that a valid QR pass scans and checks in the guest successfully."""
    async with AsyncSessionLocal() as db:
        user, event, guest, pass_obj = await _create_test_event_with_pass(db, "Rahul Sharma")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/scanner/verify",
            json={
                "pass_code": pass_obj.pass_code,
                "event_id": event.id,
                "location_name": "Main Gate",
            },
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["guest_name"] == "Rahul Sharma"
        assert data["already_checked_in"] is False
        assert "Welcome Rahul Sharma" in data["message"]
        assert "Entry confirmed" in data["message"]

    # Verify database state
    async with AsyncSessionLocal() as db:
        g = (await db.execute(select(Guest).where(Guest.id == guest.id))).scalar_one()
        assert g.checked_in is True
        assert g.checked_in_at is not None

        c_count = (await db.execute(select(func.count(Checkin.id)).where(Checkin.guest_id == guest.id))).scalar_one()
        assert c_count == 1


@pytest.mark.asyncio
async def test_duplicate_qr_scan_warning_and_zero_duplicate_records():
    """Verifies that scanning a QR code a second time warns 'Already checked in at...' and does NOT create duplicate checkin rows."""
    async with AsyncSessionLocal() as db:
        user, event, guest, pass_obj = await _create_test_event_with_pass(db, "Priya Singh")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First Scan
        res1 = await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": pass_obj.pass_code, "event_id": event.id},
        )
        assert res1.status_code == 200
        assert res1.json()["data"]["already_checked_in"] is False

        # Second Scan (Duplicate)
        res2 = await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": pass_obj.pass_code, "event_id": event.id},
        )
        assert res2.status_code == 200
        data2 = res2.json()["data"]
        assert data2["already_checked_in"] is True
        assert "Already checked in at" in data2["message"]

    # Verify exactly 1 Checkin audit record exists
    async with AsyncSessionLocal() as db:
        c_count = (await db.execute(select(func.count(Checkin.id)).where(Checkin.guest_id == guest.id))).scalar_one()
        assert c_count == 1


@pytest.mark.asyncio
async def test_invalid_passcode_or_token_rejected():
    """Verifies that non-existent/invalid QR pass code returns clean 400 error without leaking internals."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": "INVALID-PASS-9999", "event_id": "evt_123"},
        )
        assert res.status_code == 400
        assert "Invalid QR Pass Code" in res.json()["detail"]


@pytest.mark.asyncio
async def test_cross_event_scan_rejection():
    """Verifies that a QR pass from Event A scanned at Event B is strictly rejected."""
    async with AsyncSessionLocal() as db:
        user, event_a, guest_a, pass_a = await _create_test_event_with_pass(db, "Event A Guest")
        _, event_b, _, _ = await _create_test_event_with_pass(db, "Event B Guest")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": pass_a.pass_code, "event_id": event_b.id},
        )
        assert res.status_code == 400
        assert "belongs to another event" in res.json()["detail"]


@pytest.mark.asyncio
async def test_declined_guest_checkin_denied():
    """Verifies that a guest who explicitly DECLINED RSVP is denied entry."""
    async with AsyncSessionLocal() as db:
        user, event, guest, pass_obj = await _create_test_event_with_pass(db, "Declined Guest", rsvp_status=RSVPStatus.NO)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": pass_obj.pass_code, "event_id": event.id},
        )
        assert res.status_code == 400
        assert "DECLINED" in res.json()["detail"]


@pytest.mark.asyncio
async def test_revoked_pass_denied():
    """Verifies that a revoked pass is denied entry."""
    async with AsyncSessionLocal() as db:
        user, event, guest, pass_obj = await _create_test_event_with_pass(db, "Revoked Pass Guest")
        pass_obj.status = PassStatus.REVOKED
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": pass_obj.pass_code, "event_id": event.id},
        )
        assert res.status_code == 400
        assert "revoked" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_attendance_dashboard_metrics():
    """Verifies that GET /events/{id}/attendance returns correct total_expected, checked_in, and remaining counts."""
    async with AsyncSessionLocal() as db:
        user, event, guest1, pass1 = await _create_test_event_with_pass(db, "Guest 1", rsvp_status=RSVPStatus.YES)
        # Create Guest 2
        g_create2 = GuestCreate(name="Guest 2", phone="+919876500002", relationship="Family", adults_count=3, children_count=0)
        guest2 = await GuestService.create_guest(db, event.id, g_create2, user_id=user.id)
        guest2.rsvp_status = RSVPStatus.YES
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Check in Guest 1
        await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": pass1.pass_code, "event_id": event.id},
        )

        token = create_access_token(subject=user.id)
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get(f"/api/v1/events/{event.id}/attendance", headers=headers)
        assert res.status_code == 200
        summary = res.json()["data"]["summary"]

        assert summary["total_guests"] == 2
        assert summary["checked_in_count"] == 1
        assert summary["remaining_count"] == 1
        assert summary["attendance_pct"] == 50.0
        # total expected headcount = (2 adults + 1 child from guest1) + (3 adults from guest2) = 6
        assert summary["total_expected"] == 6
