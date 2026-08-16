import re
from typing import List, Optional, Dict, Any
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.master_contact import MasterContact
from app.models.guest import Guest
from app.schemas.master_contact import MasterContactCreate, MasterContactUpdate
from app.schemas.guest import GuestCreate
from app.services.guest_service import GuestService


def normalize_phone(phone: Optional[str]) -> str:
    """Normalizes phone numbers to digits only for idempotent duplicate matching."""
    if not phone:
        return ""
    digits = re.sub(r"[^\d]", "", str(phone))
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits


class MasterContactService:
    @staticmethod
    async def get_user_contacts(
        db: AsyncSession,
        user_id: str,
        search_query: Optional[str] = None,
        group_filter: Optional[str] = None,
    ) -> List[MasterContact]:
        stmt = select(MasterContact).where(MasterContact.user_id == user_id)

        if group_filter and group_filter.upper() != "ALL":
            stmt = stmt.where(MasterContact.group_name == group_filter)

        if search_query:
            q = f"%{search_query.strip()}%"
            stmt = stmt.where(
                or_(
                    MasterContact.name.ilike(q),
                    MasterContact.phone.ilike(q),
                    MasterContact.email.ilike(q),
                    MasterContact.relationship.ilike(q),
                    MasterContact.group_name.ilike(q),
                )
            )

        stmt = stmt.order_by(MasterContact.name.asc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_contact_by_id(db: AsyncSession, user_id: str, contact_id: str) -> Optional[MasterContact]:
        stmt = select(MasterContact).where(MasterContact.user_id == user_id, MasterContact.id == contact_id)
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def create_contact(db: AsyncSession, user_id: str, data: MasterContactCreate) -> MasterContact:
        norm_phone = normalize_phone(data.phone)
        norm_email = (data.email or "").strip().lower()

        # Check existing contact for duplicate prevention
        existing_contacts = await MasterContactService.get_user_contacts(db, user_id)
        for contact in existing_contacts:
            c_norm_phone = normalize_phone(contact.phone)
            c_norm_email = (contact.email or "").strip().lower()
            if (norm_phone and c_norm_phone and norm_phone == c_norm_phone) or (norm_email and c_norm_email and norm_email == c_norm_email):
                # Update existing contact instead of creating duplicate
                if data.name: contact.name = data.name
                if data.relationship: contact.relationship = data.relationship
                if data.group_name: contact.group_name = data.group_name
                if data.notes: contact.notes = data.notes
                await db.commit()
                await db.refresh(contact)
                return contact

        contact = MasterContact(
            user_id=user_id,
            name=data.name.strip(),
            phone=data.phone.strip() if data.phone else None,
            email=data.email.strip().lower() if data.email else None,
            group_name=data.group_name or "General",
            relationship=data.relationship.strip() if data.relationship else None,
            notes=data.notes,
            source=data.source or "MANUAL",
        )
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
        return contact

    @staticmethod
    async def update_contact(
        db: AsyncSession, user_id: str, contact_id: str, data: MasterContactUpdate
    ) -> Optional[MasterContact]:
        contact = await MasterContactService.get_contact_by_id(db, user_id, contact_id)
        if not contact:
            return None

        for field, val in data.model_dump(exclude_unset=True).items():
            if val is not None:
                setattr(contact, field, val)

        await db.commit()
        await db.refresh(contact)
        return contact

    @staticmethod
    async def delete_contact(db: AsyncSession, user_id: str, contact_id: str) -> bool:
        contact = await MasterContactService.get_contact_by_id(db, user_id, contact_id)
        if not contact:
            return False
        await db.delete(contact)
        await db.commit()
        return True

    @staticmethod
    async def sync_contacts(
        db: AsyncSession, user_id: str, contacts_data: List[MasterContactCreate]
    ) -> Dict[str, Any]:
        existing_contacts = await MasterContactService.get_user_contacts(db, user_id)
        existing_map: Dict[str, MasterContact] = {}

        for c in existing_contacts:
            np = normalize_phone(c.phone)
            ne = (c.email or "").strip().lower()
            if np:
                existing_map[f"p_{np}"] = c
            if ne:
                existing_map[f"e_{ne}"] = c

        added_count = 0
        updated_count = 0

        for item in contacts_data:
            if not item.name or not item.name.strip():
                continue

            np = normalize_phone(item.phone)
            ne = (item.email or "").strip().lower()

            matched_contact: Optional[MasterContact] = None
            if np and f"p_{np}" in existing_map:
                matched_contact = existing_map[f"p_{np}"]
            elif ne and f"e_{ne}" in existing_map:
                matched_contact = existing_map[f"e_{ne}"]

            if matched_contact:
                # Update details idempotently
                if item.name: matched_contact.name = item.name.strip()
                if item.phone: matched_contact.phone = item.phone.strip()
                if item.email: matched_contact.email = item.email.strip().lower()
                if item.relationship: matched_contact.relationship = item.relationship.strip()
                if item.group_name and item.group_name != "General": matched_contact.group_name = item.group_name.strip()
                updated_count += 1
            else:
                new_c = MasterContact(
                    user_id=user_id,
                    name=item.name.strip(),
                    phone=item.phone.strip() if item.phone else None,
                    email=item.email.strip().lower() if item.email else None,
                    group_name=item.group_name or "General",
                    relationship=item.relationship.strip() if item.relationship else "Guest",
                    notes=item.notes,
                    source=item.source or "MOBILE_SYNC",
                )
                db.add(new_c)
                await db.flush()

                if np: existing_map[f"p_{np}"] = new_c
                if ne: existing_map[f"e_{ne}"] = new_c
                added_count += 1

        await db.commit()
        return {
            "total_synced": len(contacts_data),
            "added_count": added_count,
            "updated_count": updated_count,
        }

    @staticmethod
    async def add_contacts_to_event(
        db: AsyncSession, user_id: str, event_id: str, contact_ids: List[str]
    ) -> Dict[str, Any]:
        # Get host contacts
        stmt = select(MasterContact).where(
            MasterContact.user_id == user_id,
            MasterContact.id.in_(contact_ids)
        )
        res = await db.execute(stmt)
        contacts = list(res.scalars().all())

        # Get current event guests to avoid duplicating guests in the same event
        existing_guests = await GuestService.get_event_guests(db, event_id)
        existing_phones = {normalize_phone(g.phone) for g in existing_guests if g.phone}
        existing_names = {g.name.lower().strip() for g in existing_guests}

        added_guests = 0
        skipped = 0

        for c in contacts:
            c_norm_phone = normalize_phone(c.phone)
            c_norm_name = c.name.lower().strip()

            if (c_norm_phone and c_norm_phone in existing_phones) or (c_norm_name in existing_names):
                skipped += 1
                continue

            guest_data = GuestCreate(
                name=c.name,
                phone=c.phone,
                email=c.email,
                group_name=c.group_name or "General",
                relationship=c.relationship or "Guest",
                notes=c.notes,
            )
            created_guest = await GuestService.create_guest(db, event_id, guest_data)
            created_guest.master_contact_id = c.id
            await db.flush()
            added_guests += 1

            if c_norm_phone: existing_phones.add(c_norm_phone)
            existing_names.add(c_norm_name)

        await db.commit()
        return {
            "added_count": added_guests,
            "skipped_count": skipped,
            "total_selected": len(contact_ids),
        }
