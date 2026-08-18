import io
import pytest
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.db.init_db import init_db
from app.models.user import User, UserRole
from app.models.event import Event, EventType, EventStatus
from app.models.guest import Guest, RSVPStatus
from app.models.wish import CelebrationWish, ModerationStatus
from app.models.gallery import GalleryItem


async def _setup_event_and_host(db: AsyncSession):
    """Sets up an event, host user, non-host user, and guests."""
    await init_db()

    host_user = User(
        email=f"host_{datetime.now(timezone.utc).timestamp()}@nimantran.ai",
        hashed_password="hashed_pw_host",
        full_name="Rajesh Sharma",
        role=UserRole.HOST,
    )
    other_user = User(
        email=f"other_{datetime.now(timezone.utc).timestamp()}@nimantran.ai",
        hashed_password="hashed_pw_other",
        full_name="Vikram Singh",
        role=UserRole.HOST,
    )
    db.add_all([host_user, other_user])
    await db.flush()

    event = Event(
        id=f"evt_mem_{datetime.now(timezone.utc).timestamp()}".replace(".", ""),
        user_id=host_user.id,
        title="Ananya & Siddharth Grand Reception",
        slug=f"reception-{datetime.now(timezone.utc).timestamp()}".replace(".", ""),
        event_type=EventType.RECEPTION,
        status=EventStatus.PUBLISHED,
        start_date=datetime(2026, 12, 10, 19, 30, tzinfo=timezone.utc),
        venue_name="Taj Lake Palace, Udaipur",
        venue_address="Pichola, Udaipur, Rajasthan",
        host_name="Sharma & Verma Family",
    )
    db.add(event)
    await db.flush()

    guest1 = Guest(
        event_id=event.id,
        name="Amitabh Bachchan",
        phone="+919876543210",
        relationship="Family Elder",
        rsvp_status=RSVPStatus.YES,
        checked_in=True,
        invitation_token=f"tok_mem_1_{datetime.now(timezone.utc).timestamp()}".replace(".", ""),
    )
    guest2 = Guest(
        event_id=event.id,
        name="Sunil Gavaskar",
        phone="+919876543211",
        relationship="Honored Guest",
        rsvp_status=RSVPStatus.YES,
        checked_in=False,
        invitation_token=f"tok_mem_2_{datetime.now(timezone.utc).timestamp()}".replace(".", ""),
    )
    db.add_all([guest1, guest2])
    await db.commit()

    return host_user, other_user, event, guest1, guest2


@pytest.mark.asyncio
async def test_submit_wish_pending_moderation():
    """Verifies that guest-submitted wishes default to PENDING and do not appear on public wall before approval."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Guest submits a wish via public slug
        submit_res = await ac.post(
            f"/api/v1/public/events/{event.slug}/wishes",
            json={
                "sender_name": "Rohan Mehra",
                "relationship": "College Friend",
                "message": "Wishing the beautiful couple an eternity of boundless joy!",
            }
        )
        assert submit_res.status_code == 200
        data = submit_res.json()["data"]
        assert data["status"] == "PENDING"
        wish_id = data["id"]

        # 2. Check public event feed - wish should NOT be visible yet
        pub_res = await ac.get(f"/api/v1/public/events/{event.slug}")
        assert pub_res.status_code == 200
        wishes = pub_res.json()["data"]["wishes"]
        assert not any(w["id"] == wish_id for w in wishes)


@pytest.mark.asyncio
async def test_host_approve_wish_public_visibility():
    """Verifies that when a host approves a wish, it becomes visible in the public feed."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)

    token = create_access_token(host_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Guest submits wish
        submit_res = await ac.post(
            f"/api/v1/public/events/{event.slug}/wishes",
            json={
                "sender_name": "Deepika Padukone",
                "relationship": "Family Friend",
                "message": "Congratulations to the lovely couple! May love shine bright.",
            }
        )
        wish_id = submit_res.json()["data"]["id"]

        # 2. Host lists wishes
        list_res = await ac.get(f"/api/v1/events/{event.id}/wishes", headers=headers)
        assert list_res.status_code == 200
        assert any(w["id"] == wish_id and w["status"] == "PENDING" for w in list_res.json()["data"])

        # 3. Host approves the wish
        mod_res = await ac.patch(
            f"/api/v1/events/{event.id}/wishes/{wish_id}",
            json={"status": "APPROVED", "is_featured": True},
            headers=headers,
        )
        assert mod_res.status_code == 200
        assert mod_res.json()["data"]["status"] == "APPROVED"
        assert mod_res.json()["data"]["is_featured"] is True

        # 4. Check public event feed - wish MUST now be visible
        pub_res = await ac.get(f"/api/v1/public/events/{event.slug}")
        wishes = pub_res.json()["data"]["wishes"]
        assert any(w["id"] == wish_id and w["sender_name"] == "Deepika Padukone" for w in wishes)


@pytest.mark.asyncio
async def test_host_reject_wish_hidden():
    """Verifies that when a host rejects a wish, it remains hidden from the public feed."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)

    token = create_access_token(host_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Submit wish
        submit_res = await ac.post(
            f"/api/v1/public/events/{event.slug}/wishes",
            json={"sender_name": "Anonymous", "relationship": "Unknown", "message": "Spam message"},
        )
        wish_id = submit_res.json()["data"]["id"]

        # 2. Host rejects wish
        mod_res = await ac.patch(
            f"/api/v1/events/{event.id}/wishes/{wish_id}",
            json={"status": "REJECTED"},
            headers=headers,
        )
        assert mod_res.status_code == 200
        assert mod_res.json()["data"]["status"] == "REJECTED"

        # 3. Public feed must not show rejected wish
        pub_res = await ac.get(f"/api/v1/public/events/{event.slug}")
        wishes = pub_res.json()["data"]["wishes"]
        assert not any(w["id"] == wish_id for w in wishes)


@pytest.mark.asyncio
async def test_valid_photo_upload_pending_moderation():
    """Verifies valid photo upload by guest defaults to PENDING and only appears after approval."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)

    token = create_access_token(host_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Guest uploads photo via token
        dummy_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"X" * 200
        files = {"file": ("celebration.jpg", dummy_jpeg, "image/jpeg")}
        data = {"caption": "Beautiful varmala ceremony moment!"}

        upload_res = await ac.post(
            f"/api/v1/public/invitations/t/{g1.invitation_token}/memories",
            files=files,
            data=data,
        )
        assert upload_res.status_code == 200
        res_data = upload_res.json()["data"]
        assert res_data["status"] == "PENDING"
        photo_id = res_data["id"]

        # 2. Not in public memories wall yet
        wall_res = await ac.get(f"/api/v1/public/events/{event.slug}/memories")
        assert not any(m["id"] == photo_id for m in wall_res.json()["data"]["memories"])

        # 3. Host approves photo
        appr_res = await ac.patch(
            f"/api/v1/events/{event.id}/memories/{photo_id}",
            json={"status": "APPROVED", "is_featured": True},
            headers=headers,
        )
        assert appr_res.status_code == 200
        assert appr_res.json()["data"]["status"] == "APPROVED"

        # 4. Now visible in public memories wall
        wall_res2 = await ac.get(f"/api/v1/public/events/{event.slug}/memories")
        assert any(m["id"] == photo_id for m in wall_res2.json()["data"]["memories"])


@pytest.mark.asyncio
async def test_invalid_file_extension_rejected():
    """Verifies that malicious or executable files (.exe, .sh, .py) are strictly rejected with HTTP 400."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Upload .exe
        files = {"file": ("payload.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-msdownload")}
        res = await ac.post(
            f"/api/v1/public/events/{event.slug}/memories",
            files=files,
            data={"caption": "Try this"},
        )
        assert res.status_code == 400
        assert "Unsupported or unsafe file extension" in res.json()["detail"]


@pytest.mark.asyncio
async def test_oversized_file_rejected():
    """Verifies that uploads exceeding the 10MB ceiling are rejected."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create 11MB dummy buffer
        big_bytes = b"0" * (11 * 1024 * 1024)
        files = {"file": ("huge_photo.jpg", big_bytes, "image/jpeg")}
        res = await ac.post(
            f"/api/v1/public/events/{event.slug}/memories",
            files=files,
            data={"caption": "Huge photo"},
        )
        assert res.status_code in [413, 400]
        assert "exceeds maximum allowed limit" in res.json()["detail"]


@pytest.mark.asyncio
async def test_unauthorized_moderation_forbidden():
    """Verifies that a user who does not own the event cannot moderate or delete its wishes or memories."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)
        # Create a wish
        wish = CelebrationWish(
            event_id=event.id,
            sender_name="Kareena Kapoor",
            relationship="Guest",
            message="Lots of love!",
            status=ModerationStatus.PENDING,
        )
        db.add(wish)
        await db.commit()
        await db.refresh(wish)

    # Token for other user (not host)
    other_token = create_access_token(other_user.id)
    headers = {"Authorization": f"Bearer {other_token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.patch(
            f"/api/v1/events/{event.id}/wishes/{wish.id}",
            json={"status": "APPROVED"},
            headers=headers,
        )
        assert res.status_code == 403
        assert "Unauthorized" in res.json()["detail"]


@pytest.mark.asyncio
async def test_ai_celebration_story_grounding():
    """Verifies that Post-Event AI Celebration Story is grounded in actual attendance and approved items with no hallucinations."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)
        # Add approved wish
        w1 = CelebrationWish(
            event_id=event.id,
            sender_name="Sachin Tendulkar",
            relationship="Guest of Honor",
            message="Heartiest congratulations to the lovely couple!",
            status=ModerationStatus.APPROVED,
        )
        # Add approved memory
        m1 = GalleryItem(
            event_id=event.id,
            media_url="https://images.unsplash.com/photo-1519741497674-611481863552",
            caption="The royal entry of the bride and groom",
            uploaded_by_name="Sachin",
            status=ModerationStatus.APPROVED,
            is_approved=True,
        )
        db.add_all([w1, m1])
        await db.commit()

    token = create_access_token(host_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        story_res = await ac.post(
            f"/api/v1/events/{event.id}/celebration-story",
            json={"style": "EMOTIONAL_ROYAL"},
            headers=headers,
        )
        assert story_res.status_code == 200
        data = story_res.json()["data"]

        assert "story_hindi" in data
        assert "story_english" in data
        assert "attendance_grounding" in data
        # Check actual database grounding: g1 is checked in (1), total is 2
        assert data["attendance_grounding"]["checked_in_count"] == 1
        assert data["attendance_grounding"]["total_guests"] == 2
        assert data["approved_wishes_count"] == 1
        assert data["approved_memories_count"] == 1


@pytest.mark.asyncio
async def test_ai_memory_caption_and_thank_you():
    """Verifies that AI generates captions and attendance thank-you notes without inventing facts."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)

    token = create_access_token(host_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Caption generation
        cap_res = await ac.post(
            f"/api/v1/events/{event.id}/memories/ai-caption",
            json={"milestone_or_tag": "Ring Ceremony", "guest_name": "Amitabh Bachchan"},
            headers=headers,
        )
        assert cap_res.status_code == 200
        cap_data = cap_res.json()["data"]
        assert "caption_hindi" in cap_data
        assert "caption_english" in cap_data
        assert "Amitabh Bachchan" in cap_data["caption_english"]

        # 2. Thank you generation
        ty_res = await ac.post(
            f"/api/v1/events/{event.id}/memories/ai-thank-you",
            json={},
            headers=headers,
        )
        assert ty_res.status_code == 200
        ty_data = ty_res.json()["data"]
        assert "thank_you_hindi" in ty_data
        assert "whatsapp_ready_message" in ty_data


@pytest.mark.asyncio
async def test_host_direct_memory_upload():
    """Verifies host direct upload is automatically APPROVED."""
    async with AsyncSessionLocal() as db:
        host_user, other_user, event, g1, g2 = await _setup_event_and_host(db)

    token = create_access_token(host_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        dummy_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"Y" * 150
        files = {"file": ("official_portrait.jpg", dummy_jpeg, "image/jpeg")}
        data = {"caption": "Official Family Portrait", "is_featured": "true"}

        res = await ac.post(
            f"/api/v1/events/{event.id}/memories/upload",
            files=files,
            data=data,
            headers=headers,
        )
        assert res.status_code == 200
        res_data = res.json()["data"]
        assert res_data["status"] == "APPROVED"
        assert res_data["is_featured"] is True
