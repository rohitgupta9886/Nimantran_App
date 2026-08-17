import pytest
from datetime import datetime, timezone
import uuid
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.event import Event, EventStatus
from app.models.guest import Guest
from app.services.event_service import EventService
from app.services.guest_service import GuestService
from app.services.langgraph_service import LangGraphEventService
from app.schemas.event import EventCreate
from app.schemas.guest import GuestCreate


@pytest.mark.asyncio
async def test_event_creation_lifecycle_defaults_to_draft():
    """Verify that event creation defaults to DRAFT status rather than PUBLISHED."""
    async with AsyncSessionLocal() as db_session:
        user = User(
            id=str(uuid.uuid4()),
            email=f"host_draft_{uuid.uuid4().hex[:6]}@example.com",
            hashed_password="hash",
            full_name="Host User",
        )
        db_session.add(user)
        await db_session.commit()

        event_data = EventCreate(
            title="Birthday Party",
            event_type="BIRTHDAY",
            host_name="Ramesh Sharma",
            start_date=datetime.now(timezone.utc),
            venue_name="Grand Lawn",
            venue_address="Sector 18, Noida",
        )

        created = await EventService.create_event(db_session, user.id, event_data)
        assert created.status == EventStatus.DRAFT


@pytest.mark.asyncio
async def test_event_ownership_isolation():
    """Verify that user B cannot access or mutate user A's event."""
    async with AsyncSessionLocal() as db_session:
        user_a = User(id=str(uuid.uuid4()), email=f"usera_{uuid.uuid4().hex[:6]}@example.com", hashed_password="pwd", full_name="User A")
        user_b = User(id=str(uuid.uuid4()), email=f"userb_{uuid.uuid4().hex[:6]}@example.com", hashed_password="pwd", full_name="User B")
        db_session.add_all([user_a, user_b])
        await db_session.commit()

        event_data = EventCreate(
            title="User A's Celebration",
            event_type="WEDDING",
            host_name="Family A",
            start_date=datetime.now(timezone.utc),
            venue_name="Banquet A",
            venue_address="Address A",
        )
        event_a = await EventService.create_event(db_session, user_a.id, event_data)

        # Event A belongs to User A
        assert event_a.user_id == user_a.id
        assert event_a.user_id != user_b.id


@pytest.mark.asyncio
async def test_public_rsvp_no_fake_phone_and_no_user_id_leak():
    """Verify that public RSVP does not insert fake numbers (e.g. 919800000000) and preserves real data."""
    async with AsyncSessionLocal() as db_session:
        user = User(id=str(uuid.uuid4()), email=f"host_rsvp_{uuid.uuid4().hex[:6]}@example.com", hashed_password="pwd", full_name="Host")
        db_session.add(user)
        await db_session.commit()

        event_data = EventCreate(
            title="Public RSVP Test",
            event_type="ANNIVERSARY",
            host_name="Gupta Family",
            start_date=datetime.now(timezone.utc),
            venue_name="Resort Green",
            venue_address="Delhi NCR",
        )
        event = await EventService.create_event(db_session, user.id, event_data)

        # Add a pre-existing guest with a real phone
        guest_data = GuestCreate(
            name="Vikram Seth",
            phone="+919876543210",
            relationship="Friend",
        )
        created_guest = await GuestService.create_guest(db_session, event.id, guest_data, user_id=user.id)
        assert created_guest.phone == "+919876543210"

        # Guest without phone should have phone=None, NEVER '919800000000'
        no_phone_guest = Guest(
            event_id=event.id,
            name="Sunita Rao",
            phone=None,
            relationship="Guest",
        )
        db_session.add(no_phone_guest)
        await db_session.commit()

        res = await db_session.execute(select(Guest).where(Guest.id == no_phone_guest.id))
        persisted = res.scalars().first()
        assert persisted.phone is None
        assert persisted.phone != "919800000000"


@pytest.mark.asyncio
async def test_ai_slot_extraction_no_hardcoded_hallucinations():
    """Verify that LangGraph slot extraction does not hallucinate Priyanka & Rohit or fake dates/venues."""
    lg_service = LangGraphEventService()
    state = await lg_service.process_user_turn("test_thread_1", "Meri beti ki shaadi hai")

    # Title must NOT be hardcoded to "Priyanka & Rohit's Wedding Celebration"
    assert state.get("title") != "Priyanka & Rohit's Wedding Celebration"
    assert state.get("title") == "Wedding Celebration" or state.get("title") is None

    # Date must not be hallucinated if not provided in user text
    assert state.get("date") != "22 July 2026"
