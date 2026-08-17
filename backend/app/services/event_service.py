import re
import uuid
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import Event, EventFunction, Invitation, EventStatus
from app.schemas.event import EventCreate, EventUpdate


class EventService:
    @staticmethod
    def generate_slug(title: str) -> str:
        clean = re.sub(r"[^\w\s-]", "", title.lower())
        slug = re.sub(r"[-\s]+", "-", clean).strip("-")
        return f"{slug}-{uuid.uuid4().hex[:6]}"

    @staticmethod
    async def create_event(db: AsyncSession, user_id: str, data: EventCreate) -> Event:
        slug = data.slug or EventService.generate_slug(data.title)
        
        event = Event(
            user_id=user_id,
            title=data.title,
            slug=slug,
            event_type=data.event_type,
            status=getattr(data, "status", None) or EventStatus.DRAFT,
            host_name=data.host_name,
            co_host_name=data.co_host_name,
            contact_phone=data.contact_phone,
            start_date=data.start_date,
            end_date=data.end_date,
            venue_name=data.venue_name,
            venue_address=data.venue_address,
            google_maps_url=data.google_maps_url,
            description=data.description,
            upi_id=data.upi_id,
            host_upi_mobile=data.host_upi_mobile,
            upi_qr_url=data.upi_qr_url,
            accepts_digital_shagun=data.accepts_digital_shagun,
            theme_config=data.theme_config or {},
        )
        db.add(event)
        await db.flush()

        if data.functions:
            for idx, func_data in enumerate(data.functions, start=1):
                func = EventFunction(
                    event_id=event.id,
                    name=func_data.name,
                    date_time=func_data.date_time,
                    venue_name=func_data.venue_name or data.venue_name,
                    address=func_data.address or data.venue_address,
                    google_maps_url=func_data.google_maps_url or data.google_maps_url,
                    dress_code=func_data.dress_code,
                    description=func_data.description,
                    order_index=idx,
                )
                db.add(func)

        if data.invitation:
            inv = Invitation(
                event_id=event.id,
                title_text=data.invitation.title_text,
                message_text=data.invitation.message_text,
                template_id=data.invitation.template_id,
                language=data.invitation.language,
                custom_colors=data.invitation.custom_colors or {},
                custom_fonts=data.invitation.custom_fonts or {},
            )
            db.add(inv)
        else:
            # Default invitation
            inv = Invitation(
                event_id=event.id,
                title_text=data.title,
                message_text=f"Together with their families, {data.host_name} requests your gracious presence.",
                language="HI_EN",
            )
            db.add(inv)

        await db.commit()
        return await EventService.get_event_by_id(db, event.id)

    @staticmethod
    async def get_event_by_id(db: AsyncSession, event_id: str) -> Optional[Event]:
        stmt = (
            select(Event)
            .where((Event.id == event_id) | (Event.slug == event_id))
            .options(selectinload(Event.functions), selectinload(Event.invitation))
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def get_event_by_slug(db: AsyncSession, slug: str) -> Optional[Event]:
        stmt = (
            select(Event)
            .where(Event.slug == slug)
            .options(selectinload(Event.functions), selectinload(Event.invitation))
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def get_user_events(db: AsyncSession, user_id: str) -> List[Event]:
        stmt = (
            select(Event)
            .where(Event.user_id == user_id)
            .options(selectinload(Event.functions), selectinload(Event.invitation))
            .order_by(Event.start_date.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def delete_event(db: AsyncSession, event: Event) -> bool:
        await db.delete(event)
        await db.commit()
        return True

    @staticmethod
    async def update_event(db: AsyncSession, event: Event, data: dict) -> Event:
        from datetime import datetime
        for field, value in data.items():
            if hasattr(event, field) and value is not None:
                if field in ("start_date", "end_date") and isinstance(value, str):
                    try:
                        clean_val = value.replace("Z", "+00:00")
                        value = datetime.fromisoformat(clean_val)
                    except ValueError:
                        pass
                setattr(event, field, value)
        if "title" in data and event.invitation:
            event.invitation.title_text = data["title"]

        await db.commit()
        db.expire_all()
        return await EventService.get_event_by_id(db, event.id)



