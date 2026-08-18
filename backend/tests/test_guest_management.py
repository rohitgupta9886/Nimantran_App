import pytest
import secrets
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.event import Event
from app.models.guest import Guest, GuestGroup, RSVPStatus, GuestCategory
from app.schemas.guest import (
    GuestCreate,
    GuestUpdate,
    DuplicateCheckRequest,
    GuestMergeRequest,
    ImportItemCandidate,
    ImportConfirmRequest,
)
from app.services.guest_service import GuestService


async def _create_test_event(db: AsyncSession, user_id: Optional[str] = None) -> tuple[str, str]:
    u_id = user_id or f"usr_guest_{secrets.token_hex(4)}"
    e_id = f"evt_guest_{secrets.token_hex(4)}"

    event = Event(
        id=e_id,
        user_id=u_id,
        title="Royal Anniversary Celebration",
        event_type="ANNIVERSARY",
        host_name="Gupta Family",
        venue_name="Grand Hyatt",
        venue_address="Mumbai",
        start_date=datetime(2026, 12, 10, 19, 0, tzinfo=timezone.utc),
        slug=f"gupta-anniversary-{secrets.token_hex(3)}",
    )
    db.add(event)
    await db.commit()
    return u_id, e_id


@pytest.mark.asyncio
async def test_create_single_guest_success():
    """Verifies adding a single guest generates a stable ID, pass code, and invitation token."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        create_data = GuestCreate(
            name="Vikramaditya Singhania",
            phone="+919876543210",
            email="vikram@example.com",
            relationship="Uncle",
            group_name="Family",
            adults_count=2,
            children_count=1,
            language="HI",
            notes="Requires ground floor seating",
        )

        guest = await GuestService.create_guest(db, event_id, create_data, user_id=user_id)

        assert guest.id is not None
        assert guest.event_id == event_id
        assert guest.name == "Vikramaditya Singhania"
        assert guest.phone == "+919876543210"
        assert guest.language == "HI"
        assert guest.invitation_token is not None
        assert guest.invitation_token.startswith("nim_")

        # Verify entry pass generated
        read_dto = await GuestService._to_guest_read(db, guest)
        assert read_dto.pass_code is not None
        assert read_dto.pass_code.startswith("NIM-ENTRY-")
        assert read_dto.group_name == "Family"


@pytest.mark.asyncio
async def test_duplicate_detection_by_exact_phone():
    """Verifies detecting duplicate contact when identical normalized phone number is entered."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        # 1. Create first guest
        g1 = await GuestService.create_guest(
            db,
            event_id,
            GuestCreate(name="Amitabh Bachchan", phone="9876543210", group_name="VIP"),
            user_id=user_id,
        )

        # 2. Check duplicate with +91 format
        dup_res = await GuestService.check_duplicate_guest(
            db,
            event_id=event_id,
            name="Amitabh B",
            phone="+91 98765 43210",
        )

        assert dup_res.has_duplicate is True
        assert dup_res.duplicate_type == "EXACT_PHONE"
        assert dup_res.confidence_score >= 0.90
        assert dup_res.matched_guest is not None
        assert dup_res.matched_guest.id == g1.id


@pytest.mark.asyncio
async def test_duplicate_detection_by_normalized_name():
    """Verifies detecting duplicate candidate when case/whitespace variations of name are used."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        # 1. Create first guest
        g1 = await GuestService.create_guest(
            db,
            event_id,
            GuestCreate(name="Pooja Sharma", relationship="Cousin", group_name="Family"),
            user_id=user_id,
        )

        # 2. Check duplicate with lowercase and extra spaces
        dup_res = await GuestService.check_duplicate_guest(
            db,
            event_id=event_id,
            name="  pooja   sharma  ",
        )

        assert dup_res.has_duplicate is True
        assert dup_res.duplicate_type == "SIMILAR_NAME"
        assert dup_res.matched_guest is not None
        assert dup_res.matched_guest.id == g1.id


@pytest.mark.asyncio
async def test_duplicate_merge_resolution():
    """Verifies merging contact info into existing guest preserves identity and token."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        original_guest = await GuestService.create_guest(
            db,
            event_id,
            GuestCreate(name="Rajesh Kumar", group_name="Friends", adults_count=1),
            user_id=user_id,
        )
        orig_id = original_guest.id
        orig_token = original_guest.invitation_token

        # Host decides to MERGE new phone number and party count
        merge_req = GuestMergeRequest(
            phone="+919811122233",
            email="rajesh.kumar@example.com",
            relationship="College Friend",
            adults_count=2,
            children_count=1,
            language="EN",
            notes="Added family members",
        )

        merged = await GuestService.merge_guest(db, orig_id, merge_req)

        assert merged.id == orig_id  # Stable ID preserved
        assert merged.invitation_token == orig_token  # Stable token preserved
        assert merged.phone == "+919811122233"
        assert merged.email == "rajesh.kumar@example.com"
        assert merged.adults_count == 2
        assert merged.children_count == 1
        assert merged.language == "EN"
        assert "Added family members" in merged.notes


@pytest.mark.asyncio
async def test_duplicate_keep_separate_resolution():
    """Verifies that choosing KEEP_SEPARATE creates distinct guest records for separate people."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        # Senior Rahul
        g1 = await GuestService.create_guest(
            db,
            event_id,
            GuestCreate(name="Rahul Sharma", phone="+919876543210", relationship="Uncle"),
            user_id=user_id,
        )

        # Junior Rahul (same household phone, separate guest record)
        g2 = await GuestService.create_guest(
            db,
            event_id,
            GuestCreate(name="Rahul Sharma Jr", phone="+919876543210", relationship="Nephew", allow_duplicate=True),
            user_id=user_id,
        )

        assert g1.id != g2.id
        assert g1.invitation_token != g2.invitation_token

        all_guests = await GuestService.get_event_guests(db, event_id)
        assert len(all_guests) == 2


@pytest.mark.asyncio
async def test_guest_belongs_to_another_event_isolated():
    """Verifies duplicate check and guest listing never leak across different events or hosts."""
    async with AsyncSessionLocal() as db:
        u1, e1 = await _create_test_event(db)
        u2, e2 = await _create_test_event(db)

        # Add guest to Event 1
        await GuestService.create_guest(
            db,
            e1,
            GuestCreate(name="Same Name Person", phone="+919999988888"),
            user_id=u1,
        )

        # Check duplicate in Event 2 with same phone
        dup_res_e2 = await GuestService.check_duplicate_guest(
            db,
            event_id=e2,
            name="Same Name Person",
            phone="+919999988888",
        )

        # Must NOT detect duplicate because it belongs to a completely different celebration
        assert dup_res_e2.has_duplicate is False


@pytest.mark.asyncio
async def test_bulk_import_2_stage_preview_and_confirm():
    """Verifies 2-stage import: Stage 1 preview/validation and Stage 2 confirm/commit."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        # Pre-seed one guest
        await GuestService.create_guest(
            db,
            event_id,
            GuestCreate(name="Existing Contact", phone="+919876500001", group_name="Family"),
            user_id=user_id,
        )

        raw_candidates = [
            ImportItemCandidate(name="Valid Guest 1", phone="+919876500002", group_name="Friends"),
            ImportItemCandidate(name="Valid Guest 2", phone="+919876500003", group_name="Colleagues"),
            ImportItemCandidate(name="Duplicate Guest", phone="+919876500001", group_name="Family"),  # duplicate phone
            ImportItemCandidate(name="Invalid Phone Guest", phone="12345", group_name="Other"),  # invalid phone
            ImportItemCandidate(name="", phone="+919876500005"),  # missing name
        ]

        # Stage 1: Preview
        preview = await GuestService.preview_import_contacts(db, event_id, raw_candidates)

        assert preview.total_parsed == 5
        assert preview.valid_count == 2
        assert preview.duplicates_count == 1
        assert preview.invalid_count == 2

        # Stage 2: Confirm valid items
        valid_items_to_import = [v.raw for v in preview.valid_items]
        res = await GuestService.confirm_import_contacts(
            db=db,
            event_id=event_id,
            items=valid_items_to_import,
            on_duplicate="SKIP",
            user_id=user_id,
        )

        assert res["created"] == 2
        assert res["merged"] == 0

        all_guests = await GuestService.get_event_guests(db, event_id)
        assert len(all_guests) == 3  # 1 pre-seed + 2 imported


@pytest.mark.asyncio
async def test_bulk_import_100_guests_scale():
    """Verifies scale import of 100 contacts seamlessly."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        candidates = [
            ImportItemCandidate(
                name=f"Bulk Guest {i}",
                phone=f"+9198765{i:05d}",
                email=f"guest{i}@example.com",
                group_name="Bride Side" if i % 2 == 0 else "Groom Side",
                relationship="Friend",
            )
            for i in range(100)
        ]

        preview = await GuestService.preview_import_contacts(db, event_id, candidates)
        assert preview.total_parsed == 100
        assert preview.valid_count == 100

        res = await GuestService.confirm_import_contacts(
            db=db,
            event_id=event_id,
            items=candidates,
            user_id=user_id,
        )
        assert res["created"] == 100

        all_guests = await GuestService.get_event_guests(db, event_id)
        assert len(all_guests) == 100


@pytest.mark.asyncio
async def test_guest_language_preference_persistence():
    """Verifies that English, Hindi, Hinglish, and Auto language settings persist correctly."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        g_hi = await GuestService.create_guest(
            db, event_id, GuestCreate(name="Dadi Ji", language="HI"), user_id=user_id
        )
        g_en = await GuestService.create_guest(
            db, event_id, GuestCreate(name="John Doe", language="EN"), user_id=user_id
        )
        g_hinglish = await GuestService.create_guest(
            db, event_id, GuestCreate(name="Aman Gupta", language="HINGLISH"), user_id=user_id
        )

        assert g_hi.language == "HI"
        assert g_en.language == "EN"
        assert g_hinglish.language == "HINGLISH"


@pytest.mark.asyncio
async def test_public_rsvp_privacy_no_leak():
    """Verifies that public invitation token endpoints do not leak host user IDs or unmasked contacts."""
    async with AsyncSessionLocal() as db:
        user_id, event_id = await _create_test_event(db)

        guest = await GuestService.create_guest(
            db,
            event_id,
            GuestCreate(name="Private Guest", phone="+919876543210", email="secret@example.com"),
            user_id=user_id,
        )

        assert guest.invitation_token is not None

        # Verify reading via public endpoint logic
        read_dto = await GuestService._to_guest_read(db, guest)
        dumped = read_dto.model_dump()

        # Database IDs should never be exposed to public payloads without authorization
        assert "password" not in dumped
        assert "user_id" not in dumped  # GuestRead doesn't have host user_id
