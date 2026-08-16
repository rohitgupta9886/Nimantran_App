import io
import uuid
from typing import List, Optional
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.guest import Guest, GuestGroup, GuestCategory, RSVPStatus
from app.models.qr_pass import GuestEntryPass, PassStatus
from app.schemas.guest import GuestCreate, GuestUpdate


class GuestService:
    @staticmethod
    async def create_guest(db: AsyncSession, event_id: str, data: GuestCreate, user_id: Optional[str] = None) -> Guest:
        # Find or create group
        group_id = None
        if data.group_name:
            stmt = select(GuestGroup).where(GuestGroup.event_id == event_id, GuestGroup.name == data.group_name)
            res = await db.execute(stmt)
            group = res.scalars().first()
            if not group:
                group = GuestGroup(event_id=event_id, name=data.group_name)
                db.add(group)
                await db.flush()
            group_id = group.id

        welcome_quote = data.custom_welcome_quote or f"Welcome {data.name}! We are honored by your presence."
        guest = Guest(
            event_id=event_id,
            group_id=group_id,
            name=data.name,
            phone=data.phone,
            email=data.email,
            relationship=data.relationship,
            category=data.category,
            adults_count=data.adults_count,
            children_count=data.children_count,
            language=data.language,
            custom_welcome_quote=welcome_quote,
            notes=data.notes,
        )
        db.add(guest)
        await db.flush()

        # Generate unique signed entry pass
        pass_code = f"NIM-ENTRY-{uuid.uuid4().hex[:7].upper()}"
        pass_obj = GuestEntryPass(
            guest_id=guest.id,
            event_id=event_id,
            pass_code=pass_code,
            token_hash=f"hash_{pass_code}",
            status=PassStatus.VALID,
        )
        db.add(pass_obj)

        # Save to Master List if requested
        if data.save_to_master_list and user_id:
            from app.services.master_contact_service import MasterContactService
            from app.schemas.master_contact import MasterContactCreate
            m_create = MasterContactCreate(
                name=data.name,
                phone=data.phone,
                email=data.email,
                group_name=data.group_name or "General",
                relationship=data.relationship,
                notes=data.notes,
                source="EVENT_MANUAL",
            )
            mc = await MasterContactService.create_contact(db, user_id, m_create)
            guest.master_contact_id = mc.id

        await db.commit()
        await db.refresh(guest)
        return guest

    @staticmethod
    async def get_event_guests(db: AsyncSession, event_id: str) -> List[Guest]:
        from app.services.event_service import EventService
        event = await EventService.get_event_by_id(db, event_id)
        target_id = event.id if event else event_id
        stmt = select(Guest).where(Guest.event_id == target_id).order_by(Guest.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_guest_by_id(db: AsyncSession, guest_id: str) -> Optional[Guest]:
        stmt = select(Guest).where(Guest.id == guest_id)
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def update_guest(db: AsyncSession, guest_id: str, data: GuestUpdate) -> Optional[Guest]:
        guest = await GuestService.get_guest_by_id(db, guest_id)
        if not guest:
            return None

        for field, val in data.model_dump(exclude_unset=True).items():
            setattr(guest, field, val)

        await db.commit()
        await db.refresh(guest)
        return guest

    @staticmethod
    async def delete_guest(db: AsyncSession, guest_id: str) -> bool:
        guest = await GuestService.get_guest_by_id(db, guest_id)
        if not guest:
            return False
        await db.delete(guest)
        await db.commit()
        return True

    @staticmethod
    async def parse_csv_or_excel(file_bytes: bytes, filename: str) -> List[dict]:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))

        # Standardize column headers
        df.columns = [str(c).strip().lower() for c in df.columns]
        
        parsed_guests = []
        for _, row in df.iterrows():
            name = str(row.get("name", "")).strip()
            if not name or name.lower() == "nan":
                continue
            phone = str(row.get("phone", "")).strip() if "phone" in row and str(row["phone"]).lower() != "nan" else None
            email = str(row.get("email", "")).strip() if "email" in row and str(row["email"]).lower() != "nan" else None
            group_name = str(row.get("group", "General")).strip()
            relationship = str(row.get("relationship", "Guest")).strip()
            
            parsed_guests.append({
                "name": name,
                "phone": phone,
                "email": email,
                "group_name": group_name,
                "relationship": relationship,
                "adults_count": int(row.get("adults", 1)) if "adults" in row and str(row["adults"]).isdigit() else 1,
                "children_count": int(row.get("children", 0)) if "children" in row and str(row["children"]).isdigit() else 0,
            })
        return parsed_guests

