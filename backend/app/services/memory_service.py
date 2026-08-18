import os
import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, desc, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.guest import Guest
from app.models.wish import CelebrationWish, ModerationStatus
from app.models.gallery import GalleryItem
from app.models.qr_pass import Checkin, GuestEntryPass
from app.integrations.storage.local_storage import LocalStorageProvider
from app.services.ai_service import ai_service


# Security Whitelists
ALLOWED_IMAGE_MIMES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/gif",
}

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".heic",
    ".heif",
    ".gif",
}

FORBIDDEN_EXTENSIONS = {
    ".exe", ".sh", ".bat", ".cmd", ".msi", ".bin", ".ps1", ".vbs",
    ".js", ".php", ".py", ".html", ".htm", ".svg", ".dll", ".so", ".jar"
}

MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024  # 10 Megabytes


class MemoryService:
    storage = LocalStorageProvider()

    @classmethod
    def validate_file_upload(cls, filename: str, content_type: str, file_size_bytes: int) -> str:
        """Strictly validates uploaded media for size, format, extension, and malicious payloads."""
        if file_size_bytes > MAX_PHOTO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed limit of 10MB ({file_size_bytes} bytes uploaded)."
            )

        if not filename or len(filename.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename cannot be empty."
            )

        # Sanitize filename checking for path traversal / null bytes
        if "\0" in filename or ".." in filename or "/" in filename or "\\" in filename:
            clean_name = os.path.basename(filename).replace("\0", "").strip()
        else:
            clean_name = filename.strip()

        ext = os.path.splitext(clean_name)[1].lower()
        if ext in FORBIDDEN_EXTENSIONS or ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported or unsafe file extension '{ext}'. Only standard image formats (JPEG, PNG, WebP, HEIC, GIF) are accepted."
            )

        norm_mime = (content_type or "").lower().split(";")[0].strip()
        if norm_mime not in ALLOWED_IMAGE_MIMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file MIME type '{content_type}'. Only images are allowed."
            )

        return ext

    @classmethod
    async def upload_memory_photo(
        cls,
        file_bytes: bytes,
        filename: str,
        content_type: str = "image/jpeg"
    ) -> Tuple[str, int, str]:
        """Validates and persists a photo to secure opaque storage."""
        file_size = len(file_bytes)
        ext = cls.validate_file_upload(filename, content_type, file_size)

        # Upload using storage provider (which generates an opaque random UUID name)
        media_url = await cls.storage.upload_file(file_bytes, filename=f"photo{ext}", content_type=content_type)
        return media_url, file_size, content_type

    # ==========================================
    # WISHES MANAGEMENT
    # ==========================================

    @classmethod
    async def create_wish(
        cls,
        db: AsyncSession,
        event_id: str,
        sender_name: str,
        message: str,
        relationship: str = "Well Wisher",
        guest_id: Optional[str] = None,
        status: ModerationStatus = ModerationStatus.PENDING,
    ) -> CelebrationWish:
        wish = CelebrationWish(
            event_id=event_id,
            guest_id=guest_id,
            sender_name=sender_name.strip() or "Guest",
            relationship=relationship.strip() or "Well Wisher",
            message=message.strip(),
            status=status,
            is_featured=False,
        )
        db.add(wish)
        await db.commit()
        await db.refresh(wish)
        return wish

    @classmethod
    async def get_wishes_for_host(
        cls,
        db: AsyncSession,
        event_id: str,
        status_filter: Optional[str] = None,
    ) -> List[CelebrationWish]:
        stmt = select(CelebrationWish).where(CelebrationWish.event_id == event_id)
        if status_filter and status_filter.upper() in ["PENDING", "APPROVED", "REJECTED"]:
            stmt = stmt.where(CelebrationWish.status == ModerationStatus(status_filter.upper()))
        stmt = stmt.order_by(desc(CelebrationWish.is_featured), desc(CelebrationWish.created_at))
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def get_approved_wishes_for_public(
        cls,
        db: AsyncSession,
        event_id: str,
    ) -> List[CelebrationWish]:
        stmt = (
            select(CelebrationWish)
            .where(
                CelebrationWish.event_id == event_id,
                CelebrationWish.status == ModerationStatus.APPROVED,
            )
            .order_by(desc(CelebrationWish.is_featured), desc(CelebrationWish.created_at))
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def moderate_wish(
        cls,
        db: AsyncSession,
        wish_id: str,
        event_id: str,
        user_id: str,
        new_status: Optional[ModerationStatus] = None,
        is_featured: Optional[bool] = None,
    ) -> CelebrationWish:
        wish = await db.get(CelebrationWish, wish_id)
        if not wish or wish.event_id != event_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wish not found.")

        if new_status is not None:
            wish.status = new_status
            wish.moderated_at = datetime.now(timezone.utc)
            wish.moderated_by_user_id = user_id

        if is_featured is not None:
            wish.is_featured = is_featured

        await db.commit()
        await db.refresh(wish)
        return wish

    @classmethod
    async def delete_wish(
        cls,
        db: AsyncSession,
        wish_id: str,
        event_id: str,
    ) -> bool:
        wish = await db.get(CelebrationWish, wish_id)
        if not wish or wish.event_id != event_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wish not found.")

        await db.delete(wish)
        await db.commit()
        return True

    # ==========================================
    # MEMORIES / GALLERY MANAGEMENT
    # ==========================================

    @classmethod
    async def create_memory_item(
        cls,
        db: AsyncSession,
        event_id: str,
        media_url: str,
        caption: Optional[str] = None,
        uploaded_by_guest_id: Optional[str] = None,
        uploaded_by_name: Optional[str] = None,
        status: ModerationStatus = ModerationStatus.PENDING,
        is_featured: bool = False,
        file_size_bytes: Optional[int] = None,
        mime_type: Optional[str] = None,
        album_id: Optional[str] = None,
    ) -> GalleryItem:
        item = GalleryItem(
            event_id=event_id,
            album_id=album_id,
            media_url=media_url,
            caption=caption.strip() if caption else None,
            uploaded_by_guest_id=uploaded_by_guest_id,
            uploaded_by_name=uploaded_by_name.strip() if uploaded_by_name else None,
            status=status,
            is_approved=(status == ModerationStatus.APPROVED),
            is_featured=is_featured,
            file_size_bytes=file_size_bytes,
            mime_type=mime_type,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    @classmethod
    async def get_memories_for_host(
        cls,
        db: AsyncSession,
        event_id: str,
        status_filter: Optional[str] = None,
    ) -> List[GalleryItem]:
        stmt = select(GalleryItem).where(GalleryItem.event_id == event_id)
        if status_filter and status_filter.upper() in ["PENDING", "APPROVED", "REJECTED"]:
            stmt = stmt.where(GalleryItem.status == ModerationStatus(status_filter.upper()))
        stmt = stmt.order_by(desc(GalleryItem.is_featured), desc(GalleryItem.created_at))
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def get_approved_memories_for_public(
        cls,
        db: AsyncSession,
        event_id: str,
    ) -> List[GalleryItem]:
        stmt = (
            select(GalleryItem)
            .where(
                GalleryItem.event_id == event_id,
                and_(
                    GalleryItem.status == ModerationStatus.APPROVED,
                    GalleryItem.is_approved == True,
                )
            )
            .order_by(desc(GalleryItem.is_featured), desc(GalleryItem.created_at))
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def moderate_memory_item(
        cls,
        db: AsyncSession,
        item_id: str,
        event_id: str,
        new_status: Optional[ModerationStatus] = None,
        is_featured: Optional[bool] = None,
        caption: Optional[str] = None,
    ) -> GalleryItem:
        item = await db.get(GalleryItem, item_id)
        if not item or item.event_id != event_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory photo not found.")

        if new_status is not None:
            item.status = new_status
            item.is_approved = (new_status == ModerationStatus.APPROVED)

        if is_featured is not None:
            item.is_featured = is_featured

        if caption is not None:
            item.caption = caption.strip()

        await db.commit()
        await db.refresh(item)
        return item

    @classmethod
    async def delete_memory_item(
        cls,
        db: AsyncSession,
        item_id: str,
        event_id: str,
    ) -> bool:
        item = await db.get(GalleryItem, item_id)
        if not item or item.event_id != event_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory photo not found.")

        # Cleanup physical file safely
        if item.media_url:
            try:
                await cls.storage.delete_file(item.media_url)
            except Exception:
                pass

        await db.delete(item)
        await db.commit()
        return True

    # ==========================================
    # GROUNDED POST-EVENT STORY GENERATION
    # ==========================================

    @classmethod
    async def generate_grounded_celebration_story(
        cls,
        db: AsyncSession,
        event_id: str,
        user_id: str,
        style: str = "EMOTIONAL_ROYAL",
    ) -> Dict[str, Any]:
        event = await db.get(Event, event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

        # Factual attendance counts from database
        guests_res = await db.execute(select(Guest).where(Guest.event_id == event_id))
        all_guests = list(guests_res.scalars().all())
        total_guests = len(all_guests)
        checked_in_count = sum(1 for g in all_guests if g.checked_in)

        attendance_summary = {
            "total_guests": total_guests,
            "checked_in_count": checked_in_count,
            "remaining_count": max(0, total_guests - checked_in_count),
            "attendance_rate_pct": round((checked_in_count / total_guests * 100) if total_guests > 0 else 0, 1),
        }

        # Fetch factual approved wishes
        approved_wishes_objs = await cls.get_approved_wishes_for_public(db, event_id)
        approved_wishes = [
            {
                "sender_name": w.sender_name,
                "relationship": w.relationship,
                "message": w.message,
            }
            for w in approved_wishes_objs
        ]

        # Fetch factual approved memories
        approved_memories_objs = await cls.get_approved_memories_for_public(db, event_id)
        approved_memories = [
            {
                "media_url": m.media_url,
                "caption": m.caption or "",
                "uploaded_by_name": m.uploaded_by_name or "Guest",
            }
            for m in approved_memories_objs
        ]

        date_str = event.start_date.strftime("%d %B %Y") if event.start_date else "Special Celebration Date"
        evt_type = event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type)

        event_facts = {
            "id": event.id,
            "title": event.title,
            "host_name": event.host_name or "Sharma & Verma Family",
            "venue_name": event.venue_name or "Celebration Venue",
            "date_str": date_str,
            "event_type": evt_type,
        }

        # Generate grounded story via AI Service
        story_response = await ai_service.generate_celebration_story(
            db=db,
            user_id=user_id,
            event_id=event_id,
            event_facts=event_facts,
            approved_wishes=approved_wishes,
            approved_memories=approved_memories,
            attendance_summary=attendance_summary,
            style=style,
        )

        return story_response
