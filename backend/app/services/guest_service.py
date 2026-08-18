import io
import re
import uuid
import secrets
from typing import List, Optional, Tuple, Dict, Any
import pandas as pd
from sqlalchemy import select, or_, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.guest import Guest, GuestGroup, GuestCategory, RSVPStatus
from app.models.qr_pass import GuestEntryPass, PassStatus
from app.schemas.guest import (
    GuestCreate,
    GuestUpdate,
    GuestRead,
    DuplicateCheckResponse,
    GuestMergeRequest,
    ImportItemCandidate,
    ImportItemValidation,
    ImportPreviewResponse,
)
from app.services.whatsapp.phone_utils import normalize_phone_number


def _normalize_name(name: str) -> str:
    """Normalizes guest names for case/whitespace-insensitive duplicate checks."""
    if not name:
        return ""
    # Lowercase, strip punctuation and collapse whitespace
    cleaned = re.sub(r"[^\w\s]", "", name.lower())
    return " ".join(cleaned.split())


def _is_valid_email(email: Optional[str]) -> bool:
    if not email or not email.strip():
        return False
    email_clean = email.strip()
    return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email_clean))


class GuestService:
    @staticmethod
    async def check_duplicate_guest(
        db: AsyncSession,
        event_id: str,
        name: str,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        exclude_guest_id: Optional[str] = None,
    ) -> DuplicateCheckResponse:
        """
        Safe multi-factor duplicate detection within an event.
        Never auto-merges; returns match details and confidence rating for host confirmation.
        """
        stmt = select(Guest).where(Guest.event_id == event_id)
        if exclude_guest_id:
            stmt = stmt.where(Guest.id != exclude_guest_id)
        
        res = await db.execute(stmt)
        existing_guests = list(res.scalars().all())

        norm_name_query = _normalize_name(name)
        is_phone_valid, norm_phone_query, _ = normalize_phone_number(phone) if phone else (False, None, None)
        clean_email_query = email.strip().lower() if email and email.strip() else None

        # 1. Check exact normalized phone match
        if norm_phone_query:
            for g in existing_guests:
                _, g_norm_phone, _ = normalize_phone_number(g.phone) if g.phone else (False, None, None)
                if g_norm_phone and g_norm_phone == norm_phone_query:
                    matched_dto = await GuestService._to_guest_read(db, g)
                    return DuplicateCheckResponse(
                        has_duplicate=True,
                        duplicate_type="EXACT_PHONE",
                        confidence_score=0.95,
                        matched_guest=matched_dto,
                        warning_message=f"A guest with phone '{g.phone}' ({g.name}) is already on this event's guest list.",
                    )

        # 2. Check exact email match
        if clean_email_query:
            for g in existing_guests:
                g_email = (g.email or "").strip().lower()
                if g_email and g_email == clean_email_query:
                    matched_dto = await GuestService._to_guest_read(db, g)
                    return DuplicateCheckResponse(
                        has_duplicate=True,
                        duplicate_type="EXACT_EMAIL",
                        confidence_score=0.90,
                        matched_guest=matched_dto,
                        warning_message=f"A guest with email '{g.email}' ({g.name}) is already on this event's guest list.",
                    )

        # 3. Check normalized name match
        if norm_name_query:
            for g in existing_guests:
                g_norm_name = _normalize_name(g.name)
                if g_norm_name and g_norm_name == norm_name_query:
                    matched_dto = await GuestService._to_guest_read(db, g)
                    return DuplicateCheckResponse(
                        has_duplicate=True,
                        duplicate_type="SIMILAR_NAME",
                        confidence_score=0.75,
                        matched_guest=matched_dto,
                        warning_message=f"A guest with the name '{g.name}' is already in group '{matched_dto.group_name}'.",
                    )

        return DuplicateCheckResponse(
            has_duplicate=False,
            duplicate_type=None,
            confidence_score=0.0,
            matched_guest=None,
            warning_message=None,
        )

    @staticmethod
    async def create_guest(
        db: AsyncSession,
        event_id: str,
        data: GuestCreate,
        user_id: Optional[str] = None,
    ) -> Guest:
        # Find or create group
        group_id = None
        group_name = data.group_name.strip() if data.group_name else "General"
        if group_name:
            stmt = select(GuestGroup).where(GuestGroup.event_id == event_id, GuestGroup.name == group_name)
            res = await db.execute(stmt)
            group = res.scalars().first()
            if not group:
                group = GuestGroup(event_id=event_id, name=group_name)
                db.add(group)
                await db.flush()
            group_id = group.id

        welcome_quote = data.custom_welcome_quote or f"Welcome {data.name}! We are honored by your presence."
        inv_token = f"nim_{secrets.token_urlsafe(16)}"
        
        # Phone normalization
        norm_phone = data.phone
        if data.phone:
            is_valid, clean_p, _ = normalize_phone_number(data.phone)
            if is_valid and clean_p:
                norm_phone = clean_p

        guest = Guest(
            event_id=event_id,
            group_id=group_id,
            name=data.name.strip(),
            phone=norm_phone,
            email=data.email.strip() if data.email else None,
            relationship=data.relationship or "Guest",
            category=data.category,
            adults_count=data.adults_count if data.adults_count >= 1 else 1,
            children_count=data.children_count if data.children_count >= 0 else 0,
            language=data.language or "AUTO",
            custom_welcome_quote=welcome_quote,
            notes=data.notes,
            invitation_token=inv_token,
            delivery_status="SENT",
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
            try:
                from app.services.master_contact_service import MasterContactService
                from app.schemas.master_contact import MasterContactCreate
                m_create = MasterContactCreate(
                    name=data.name,
                    phone=norm_phone,
                    email=data.email,
                    group_name=group_name,
                    relationship=data.relationship,
                    notes=data.notes,
                    source="EVENT_MANUAL",
                )
                mc = await MasterContactService.create_contact(db, user_id, m_create)
                guest.master_contact_id = mc.id
            except Exception:
                pass

        await db.commit()
        await db.refresh(guest)
        return guest

    @staticmethod
    async def merge_guest(
        db: AsyncSession,
        target_guest_id: str,
        data: GuestMergeRequest,
    ) -> Optional[Guest]:
        """
        Merges contact information and counts into an existing guest record
        without disrupting the existing invitation token, pass code, or RSVP history.
        """
        guest = await GuestService.get_guest_by_id(db, target_guest_id)
        if not guest:
            return None

        if data.phone:
            _, clean_p, _ = normalize_phone_number(data.phone)
            guest.phone = clean_p or data.phone
        if data.email:
            guest.email = data.email.strip()
        if data.relationship:
            guest.relationship = data.relationship
        if data.adults_count is not None:
            guest.adults_count = data.adults_count
        if data.children_count is not None:
            guest.children_count = data.children_count
        if data.language:
            guest.language = data.language
        if data.notes:
            existing_notes = guest.notes or ""
            guest.notes = f"{existing_notes}\n[Merged Note]: {data.notes}".strip() if existing_notes else data.notes

        if data.group_name:
            stmt = select(GuestGroup).where(GuestGroup.event_id == guest.event_id, GuestGroup.name == data.group_name.strip())
            res = await db.execute(stmt)
            group = res.scalars().first()
            if not group:
                group = GuestGroup(event_id=guest.event_id, name=data.group_name.strip())
                db.add(group)
                await db.flush()
            guest.group_id = group.id

        await db.commit()
        await db.refresh(guest)
        return guest

    @staticmethod
    async def get_event_guests(db: AsyncSession, event_id: str) -> List[Guest]:
        from app.services.event_service import EventService
        event = await EventService.get_event_by_id(db, event_id)
        target_id = event.id if event else event_id
        stmt = (
            select(Guest)
            .where(Guest.event_id == target_id)
            .options(selectinload(Guest.entry_pass))
            .order_by(Guest.created_at.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_guest_by_id(db: AsyncSession, guest_id: str) -> Optional[Guest]:
        stmt = select(Guest).where(Guest.id == guest_id).options(selectinload(Guest.entry_pass))
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def update_guest(db: AsyncSession, guest_id: str, data: GuestUpdate) -> Optional[Guest]:
        guest = await GuestService.get_guest_by_id(db, guest_id)
        if not guest:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        
        # Handle group name update
        if "group_name" in update_dict and update_dict["group_name"]:
            g_name = update_dict.pop("group_name").strip()
            stmt = select(GuestGroup).where(GuestGroup.event_id == guest.event_id, GuestGroup.name == g_name)
            res = await db.execute(stmt)
            group = res.scalars().first()
            if not group:
                group = GuestGroup(event_id=guest.event_id, name=g_name)
                db.add(group)
                await db.flush()
            guest.group_id = group.id

        # Handle phone normalization if phone updated
        if "phone" in update_dict and update_dict["phone"]:
            is_valid, clean_p, _ = normalize_phone_number(update_dict["phone"])
            if is_valid and clean_p:
                update_dict["phone"] = clean_p

        for field, val in update_dict.items():
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
    async def preview_import_contacts(
        db: AsyncSession,
        event_id: str,
        raw_items: List[ImportItemCandidate],
    ) -> ImportPreviewResponse:
        """
        Stage 1 of Bulk Import:
        Validates contacts, normalizes phone/email, and detects duplicates before creating records.
        """
        existing_guests = await GuestService.get_event_guests(db, event_id)
        
        # Build lookup maps of existing guests
        existing_phones: Dict[str, Guest] = {}
        existing_emails: Dict[str, Guest] = {}
        existing_names: Dict[str, Guest] = {}

        for eg in existing_guests:
            if eg.phone:
                _, p_clean, _ = normalize_phone_number(eg.phone)
                if p_clean:
                    existing_phones[p_clean] = eg
            if eg.email:
                existing_emails[eg.email.strip().lower()] = eg
            if eg.name:
                existing_names[_normalize_name(eg.name)] = eg

        valid_items: List[ImportItemValidation] = []
        duplicate_items: List[ImportItemValidation] = []
        invalid_items: List[ImportItemValidation] = []

        # Track batch occurrences to detect intra-batch duplicates
        batch_phones: set = set()
        batch_emails: set = set()

        for item in raw_items:
            name_clean = (item.name or "").strip()
            if not name_clean:
                invalid_items.append(
                    ImportItemValidation(
                        raw=item,
                        is_valid=False,
                        is_duplicate=False,
                        error_reason="Missing guest name",
                    )
                )
                continue

            phone_clean = None
            if item.phone and str(item.phone).strip():
                is_p_valid, p_norm, p_err = normalize_phone_number(str(item.phone).strip())
                if not is_p_valid:
                    invalid_items.append(
                        ImportItemValidation(
                            raw=item,
                            is_valid=False,
                            is_duplicate=False,
                            error_reason=p_err or "Invalid phone number format",
                        )
                    )
                    continue
                phone_clean = p_norm

            email_clean = None
            if item.email and str(item.email).strip():
                if not _is_valid_email(item.email):
                    invalid_items.append(
                        ImportItemValidation(
                            raw=item,
                            is_valid=False,
                            is_duplicate=False,
                            error_reason="Invalid email address syntax",
                        )
                    )
                    continue
                email_clean = item.email.strip().lower()

            # Check duplicate against existing event database
            matched_guest = None
            dup_type = None

            if phone_clean and phone_clean in existing_phones:
                matched_guest = existing_phones[phone_clean]
                dup_type = "EXACT_PHONE"
            elif email_clean and email_clean in existing_emails:
                matched_guest = existing_emails[email_clean]
                dup_type = "EXACT_EMAIL"
            elif _normalize_name(name_clean) in existing_names:
                matched_guest = existing_names[_normalize_name(name_clean)]
                dup_type = "SIMILAR_NAME"
            elif phone_clean and phone_clean in batch_phones:
                dup_type = "BATCH_DUPLICATE_PHONE"
            elif email_clean and email_clean in batch_emails:
                dup_type = "BATCH_DUPLICATE_EMAIL"

            if phone_clean:
                batch_phones.add(phone_clean)
            if email_clean:
                batch_emails.add(email_clean)

            if dup_type:
                duplicate_items.append(
                    ImportItemValidation(
                        raw=item,
                        is_valid=True,
                        is_duplicate=True,
                        duplicate_type=dup_type,
                        matched_existing_guest_id=matched_guest.id if matched_guest else None,
                        matched_existing_name=matched_guest.name if matched_guest else None,
                        normalized_phone=phone_clean,
                    )
                )
            else:
                valid_items.append(
                    ImportItemValidation(
                        raw=item,
                        is_valid=True,
                        is_duplicate=False,
                        normalized_phone=phone_clean,
                    )
                )

        return ImportPreviewResponse(
            total_parsed=len(raw_items),
            valid_count=len(valid_items),
            duplicates_count=len(duplicate_items),
            invalid_count=len(invalid_items),
            valid_items=valid_items,
            duplicate_items=duplicate_items,
            invalid_items=invalid_items,
        )

    @staticmethod
    async def confirm_import_contacts(
        db: AsyncSession,
        event_id: str,
        items: List[ImportItemCandidate],
        on_duplicate: str = "SKIP",
        user_id: Optional[str] = None,
        save_to_master_list: bool = False,
    ) -> Dict[str, int]:
        """
        Stage 2 of Bulk Import:
        Inserts valid candidates and executes duplicate resolution policy.
        """
        created_count = 0
        merged_count = 0
        skipped_count = 0

        for item in items:
            name_clean = (item.name or "").strip()
            if not name_clean:
                skipped_count += 1
                continue

            # Check duplicate
            dup_res = await GuestService.check_duplicate_guest(
                db, event_id, name=name_clean, phone=item.phone, email=item.email
            )

            if dup_res.has_duplicate and dup_res.matched_guest:
                if on_duplicate == "SKIP":
                    skipped_count += 1
                    continue
                elif on_duplicate == "MERGE":
                    merge_req = GuestMergeRequest(
                        phone=item.phone,
                        email=item.email,
                        relationship=item.relationship,
                        group_name=item.group_name,
                        adults_count=item.adults_count,
                        children_count=item.children_count,
                        language=item.language,
                        notes=item.notes,
                    )
                    await GuestService.merge_guest(db, dup_res.matched_guest.id, merge_req)
                    merged_count += 1
                    continue
                # If KEEP_SEPARATE, fall through to normal creation

            create_data = GuestCreate(
                name=name_clean,
                phone=item.phone,
                email=item.email,
                group_name=item.group_name or "General",
                relationship=item.relationship or "Guest",
                adults_count=item.adults_count,
                children_count=item.children_count,
                language=item.language or "AUTO",
                notes=item.notes,
                save_to_master_list=save_to_master_list,
                allow_duplicate=True,
            )
            await GuestService.create_guest(db, event_id, create_data, user_id=user_id)
            created_count += 1

        return {
            "created": created_count,
            "merged": merged_count,
            "skipped": skipped_count,
            "total_processed": len(items),
        }

    @staticmethod
    async def parse_csv_or_excel(file_bytes: bytes, filename: str) -> List[ImportItemCandidate]:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))

        df.columns = [str(c).strip().lower() for c in df.columns]
        
        parsed_guests: List[ImportItemCandidate] = []
        for _, row in df.iterrows():
            name = str(row.get("name", "")).strip()
            if not name or name.lower() == "nan":
                continue
            phone = str(row.get("phone", "")).strip() if "phone" in row and str(row["phone"]).lower() != "nan" else None
            email = str(row.get("email", "")).strip() if "email" in row and str(row["email"]).lower() != "nan" else None
            group_name = str(row.get("group", row.get("group_name", "General"))).strip()
            relationship = str(row.get("relationship", "Guest")).strip()
            language = str(row.get("language", "AUTO")).strip().upper()
            notes = str(row.get("notes", "")).strip() if "notes" in row and str(row["notes"]).lower() != "nan" else None
            
            parsed_guests.append(
                ImportItemCandidate(
                    name=name,
                    phone=phone,
                    email=email,
                    group_name=group_name,
                    relationship=relationship,
                    adults_count=int(row.get("adults", 1)) if "adults" in row and str(row["adults"]).isdigit() else 1,
                    children_count=int(row.get("children", 0)) if "children" in row and str(row["children"]).isdigit() else 0,
                    language=language if language in ["HI", "EN", "HINGLISH", "AUTO"] else "AUTO",
                    notes=notes,
                )
            )
        return parsed_guests

    @staticmethod
    async def _to_guest_read(db: AsyncSession, guest: Guest) -> GuestRead:
        group_name = "General"
        if guest.group_id:
            stmt = select(GuestGroup.name).where(GuestGroup.id == guest.group_id)
            res = await db.execute(stmt)
            group_name = res.scalars().first() or "General"

        stmt_pass = select(GuestEntryPass.pass_code).where(GuestEntryPass.guest_id == guest.id)
        res_pass = await db.execute(stmt_pass)
        pass_code = res_pass.scalars().first() or f"NIM-{guest.id[:6].upper()}"

        return GuestRead(
            id=guest.id,
            event_id=guest.event_id,
            group_id=guest.group_id,
            group_name=group_name,
            name=guest.name,
            phone=guest.phone,
            email=guest.email,
            relationship=guest.relationship,
            category=guest.category,
            adults_count=guest.adults_count,
            children_count=guest.children_count,
            language=guest.language or "AUTO",
            rsvp_status=guest.rsvp_status,
            checked_in=guest.checked_in,
            checked_in_at=guest.checked_in_at,
            delivery_status=guest.delivery_status or "SENT",
            open_count=guest.open_count or 0,
            invitation_token=guest.invitation_token,
            custom_welcome_quote=guest.custom_welcome_quote,
            pass_code=pass_code,
            notes=guest.notes,
            created_at=guest.created_at,
        )

