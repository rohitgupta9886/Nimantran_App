from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.qr_pass import GuestEntryPass, Checkin, PassStatus
from app.models.guest import Guest, GuestCategory, RSVPStatus
from app.models.event import Event
from app.models.welcome import WelcomeMessage
from app.schemas.qr_pass import CheckinResponse


class QRService:
    @staticmethod
    async def verify_and_checkin(
        db: AsyncSession,
        pass_code: str,
        expected_event_id: Optional[str] = None,
        current_user_id: Optional[str] = None,
        scanned_by_id: Optional[str] = None,
        location_name: Optional[str] = "Main Entrance",
        check_in_method: Optional[str] = "QR_SCAN",
    ) -> CheckinResponse:
        # Search entry pass by pass_code or invitation_token fallback
        stmt = (
            select(GuestEntryPass)
            .where(GuestEntryPass.pass_code == pass_code)
            .options(selectinload(GuestEntryPass.guest))
        )
        res = await db.execute(stmt)
        pass_obj = res.scalars().first()

        # Fallback search by guest invitation_token if pass_code wasn't found directly
        if not pass_obj:
            g_stmt = (
                select(Guest)
                .where(Guest.invitation_token == pass_code)
                .options(selectinload(Guest.entry_pass))
            )
            g_res = await db.execute(g_stmt)
            guest_by_token = g_res.scalars().first()
            if guest_by_token and guest_by_token.entry_pass:
                pass_obj = guest_by_token.entry_pass

        if not pass_obj:
            raise ValueError(f"Invalid QR Pass Code or Token: '{pass_code}'")

        # 1. STRICT EVENT MATCH VALIDATION
        if expected_event_id and pass_obj.event_id != expected_event_id:
            raise ValueError("Invalid Event: This Guest QR code / Pass Code belongs to another event.")

        # 2. EVENT & HOST OWNERSHIP VALIDATION
        e_stmt = select(Event).where(Event.id == pass_obj.event_id)
        e_res = await db.execute(e_stmt)
        event = e_res.scalars().first()
        if not event:
            raise ValueError("Associated Event for this QR pass was not found.")

        if current_user_id and event.user_id != current_user_id:
            raise ValueError("Unauthorized: You do not have permission to check in guests for this event.")

        # 3. PASS STATUS & GUEST PERMISSION VALIDATION
        if pass_obj.status == PassStatus.REVOKED:
            raise ValueError("This QR pass has been revoked by the event host.")
        if pass_obj.status == PassStatus.EXPIRED:
            raise ValueError("This QR pass has expired.")

        guest = pass_obj.guest
        if not guest:
            raise ValueError("Associated Guest record for this QR pass was not found.")

        if hasattr(guest, "rsvp_status") and guest.rsvp_status == RSVPStatus.DECLINED:
            raise ValueError(f"Guest '{guest.name}' RSVP status is DECLINED for this event.")

        already_checked = guest.checked_in
        now = datetime.now(timezone.utc)

        if not already_checked:
            guest.checked_in = True
            guest.checked_in_at = now
            pass_obj.status = PassStatus.USED

            # Create checkin audit entry with host/event/guest relationship
            checkin_entry = Checkin(
                event_id=pass_obj.event_id,
                guest_id=guest.id,
                scanned_by_id=scanned_by_id or current_user_id,
                checked_in_at=now,
                location_name=location_name,
                check_in_method=check_in_method or "QR_SCAN",
            )
            db.add(checkin_entry)

            # Store welcome screen notification entry
            welcome_msg = WelcomeMessage(
                event_id=pass_obj.event_id,
                guest_id=guest.id,
                guest_name=guest.name,
                relationship=guest.relationship or "Honored Guest",
                welcome_quote=guest.custom_welcome_quote or f"Welcome {guest.name}! We are delighted to have you at {event.title}.",
                photo_url=guest.photo_url,
                is_vip=(guest.category == GuestCategory.VIP or guest.category == GuestCategory.SPECIAL),
                displayed_at=now,
            )
            db.add(welcome_msg)
            await db.commit()

        welcome_quote = guest.custom_welcome_quote or f"Welcome {guest.name}! We are delighted to have you at {event.title}."
        msg = "Guest Checked In Successfully!" if not already_checked else "WARNING: Guest Already Checked In!"

        return CheckinResponse(
            success=True,
            message=msg,
            event_id=pass_obj.event_id,
            event_title=event.title,
            guest_name=guest.name,
            pass_code=pass_obj.pass_code,
            relationship=guest.relationship,
            adults_count=guest.adults_count,
            children_count=guest.children_count,
            already_checked_in=already_checked,
            checked_in_at=now if not already_checked else (guest.checked_in_at or now),
            check_in_method=check_in_method or "QR_SCAN",
            welcome_quote=welcome_quote,
        )
