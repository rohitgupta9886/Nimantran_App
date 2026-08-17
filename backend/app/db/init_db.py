import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, UserRole, Event, EventFunction, EventType, EventStatus,
    Invitation, InvitationTemplate, Guest, GuestGroup, MasterContact, RSVP, RSVPStatus, GuestCategory,
    GuestEntryPass, PassStatus, Story, StoryTimelineItem, GalleryAlbum, GalleryItem,
    Plan, CreditWallet, CreditTransaction, TransactionType, FeatureFlag, WelcomeMessage
)

logger = logging.getLogger("nimantran_ai")


async def init_db():
    from sqlalchemy import text as sa_text
    from app.core.config import settings

    async with engine.begin() as conn:
        logger.info("Creating database tables if not present...")
        await conn.run_sync(Base.metadata.create_all)

        # Auto-migrate SQLite schema for legacy local database files if new columns are missing
        if "sqlite" in settings.async_database_url:
            cols_to_add = [
                ("guests", "invitation_token", "VARCHAR"),
                ("guests", "delivery_status", "VARCHAR DEFAULT 'SENT'"),
                ("guests", "delivered_at", "DATETIME"),
                ("guests", "first_opened_at", "DATETIME"),
                ("guests", "last_opened_at", "DATETIME"),
                ("guests", "open_count", "INTEGER DEFAULT 0"),
                ("users", "last_login_at", "DATETIME"),
                ("users", "is_deleted", "BOOLEAN DEFAULT 0"),
                ("audit_logs", "actor_name", "VARCHAR"),
                ("audit_logs", "actor_role", "VARCHAR"),
                ("audit_logs", "target_type", "VARCHAR"),
                ("audit_logs", "target_id", "VARCHAR"),
                ("campaigns", "channels_list", "JSON"),
                ("campaigns", "email_subject", "VARCHAR"),
                ("campaigns", "email_body_html", "TEXT"),
                ("campaigns", "idempotency_key", "VARCHAR"),
                ("campaigns", "created_by", "VARCHAR"),
                ("campaigns", "template_name", "VARCHAR"),
                ("campaigns", "template_language", "VARCHAR DEFAULT 'hi'"),
                ("campaigns", "total_recipients", "INTEGER DEFAULT 0"),
                ("campaigns", "queued_count", "INTEGER DEFAULT 0"),
                ("campaigns", "sending_count", "INTEGER DEFAULT 0"),
                ("campaigns", "delivered_count", "INTEGER DEFAULT 0"),
                ("campaigns", "read_count", "INTEGER DEFAULT 0"),
                ("campaigns", "invalid_count", "INTEGER DEFAULT 0"),
                ("campaigns", "skipped_count", "INTEGER DEFAULT 0"),
                ("campaigns", "started_at", "DATETIME"),
                ("campaigns", "completed_at", "DATETIME"),
                ("campaigns", "updated_at", "DATETIME"),
                ("broadcast_messages", "normalized_phone", "VARCHAR"),
                ("broadcast_messages", "template_name", "VARCHAR"),
                ("broadcast_messages", "personalized_payload", "JSON"),
                ("broadcast_messages", "personalized_text", "TEXT"),
                ("broadcast_messages", "email_subject", "VARCHAR"),
                ("broadcast_messages", "email_body_html", "TEXT"),
                ("broadcast_messages", "invitation_url", "VARCHAR"),
                ("broadcast_messages", "idempotency_key", "VARCHAR"),
                ("broadcast_messages", "attempt_count", "INTEGER DEFAULT 0"),
                ("broadcast_messages", "max_attempts", "INTEGER DEFAULT 3"),
                ("broadcast_messages", "last_error", "TEXT"),
                ("broadcast_messages", "error_code", "VARCHAR"),
                ("broadcast_messages", "queued_at", "DATETIME"),
                ("broadcast_messages", "delivered_at", "DATETIME"),
                ("broadcast_messages", "read_at", "DATETIME"),
                ("broadcast_messages", "failed_at", "DATETIME"),
                ("broadcast_messages", "updated_at", "DATETIME"),
            ]
            for tbl_name, col_name, col_type in cols_to_add:
                try:
                    res = await conn.execute(sa_text(f"PRAGMA table_info({tbl_name})"))
                    existing_cols = {row[1] for row in res.fetchall()}
                    if col_name not in existing_cols:
                        await conn.execute(sa_text(f"ALTER TABLE {tbl_name} ADD COLUMN {col_name} {col_type}"))
                except Exception as e:
                    logger.debug(f"SQLite column migration check: {e}")

    async with AsyncSessionLocal() as session:
        # 1. Seed Plans
        res = await session.execute(select(Plan))
        if not res.scalars().first():
            logger.info("Seeding default subscription plans...")
            plans = [
                Plan(name="Free Plan", code="FREE", price_inr=0.0, billing_period="MONTHLY", max_events=2, max_guests_per_event=100, included_ai_credits=50),
                Plan(name="Nimantran Plus", code="PLUS", price_inr=199.0, billing_period="MONTHLY", max_events=5, max_guests_per_event=500, included_ai_credits=500),
                Plan(name="Nimantran Pro", code="PRO", price_inr=499.0, billing_period="MONTHLY", max_events=20, max_guests_per_event=2000, included_ai_credits=2000),
                Plan(name="One-Time Event Pass", code="EVENT_PASS", price_inr=149.0, billing_period="ONCE", max_events=1, max_guests_per_event=1000, included_ai_credits=300),
            ]
            session.add_all(plans)

        # 2. Seed Feature Flags
        res = await session.execute(select(FeatureFlag))
        if not res.scalars().first():
            logger.info("Seeding feature flags...")
            flags = [
                FeatureFlag(flag_key="AI_STORY", is_enabled=True, description="AI Story timeline generator"),
                FeatureFlag(flag_key="AI_REEL", is_enabled=True, description="AI wedding reel creator"),
                FeatureFlag(flag_key="SHAGUN", is_enabled=True, description="Digital Shagun UPI payment options"),
                FeatureFlag(flag_key="WELCOME_SCREEN", is_enabled=True, description="Real-time WebSocket Smart Welcome Screen"),
                FeatureFlag(flag_key="GUEST_UPLOAD", is_enabled=True, description="Guest media upload moderation queue"),
            ]
            session.add_all(flags)

        # 3. Seed Invitation Templates
        res = await session.execute(select(InvitationTemplate))
        if not res.scalars().first():
            logger.info("Seeding invitation templates...")
            templates = [
                InvitationTemplate(name="Royal Indian Gold", category="Royal", style_config={"bg": "#1A0006", "accent": "#D4AF37", "font": "Cinzel"}, is_premium=True),
                InvitationTemplate(name="Traditional Marigold", category="Traditional", style_config={"bg": "#FFF8DC", "accent": "#FF8C00", "font": "Rozha One"}, is_premium=False),
                InvitationTemplate(name="Modern Minimalist", category="Modern", style_config={"bg": "#FAFAFA", "accent": "#2B2B2B", "font": "Inter"}, is_premium=False),
                InvitationTemplate(name="Floral Pastels", category="Floral", style_config={"bg": "#FFF0F5", "accent": "#DB7093", "font": "Playfair Display"}, is_premium=False),
            ]
            session.add_all(templates)

        # 4. Bootstrap Master Admin Account
        admin_email = os.getenv("INITIAL_ADMIN_EMAIL") or os.getenv("ADMIN_EMAIL") or "rohitgupta9886@gmail.com"
        admin_pass = os.getenv("INITIAL_ADMIN_PASSWORD") or os.getenv("ADMIN_PASSWORD") or "AdminSecurePass2026!"
        res = await session.execute(select(User).where(User.email == admin_email))
        admin_user = res.scalars().first()
        if not admin_user:
            admin_pass_bytes = len(admin_pass.encode("utf-8"))
            if admin_pass_bytes > 72:
                logger.error(
                    f"INITIAL_ADMIN_PASSWORD / ADMIN_PASSWORD exceeds bcrypt's maximum supported input length of 72 bytes "
                    f"(received {admin_pass_bytes} bytes). Configure an admin password of at most 72 UTF-8 bytes."
                )
                raise ValueError(
                    f"INITIAL_ADMIN_PASSWORD exceeds bcrypt's maximum supported input length of 72 bytes "
                    f"(received {admin_pass_bytes} UTF-8 bytes). Please configure an admin password with at most 72 UTF-8 bytes."
                )
            logger.info(f"Bootstrapping initial Admin account ({admin_email})...")
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_pass),
                full_name="Rohit Gupta (Platform Admin)",
                phone="+919886000000",
                role=UserRole.ADMIN,
                is_active=True,
                is_superuser=True,
            )
            session.add(admin_user)
            await session.flush()

            admin_wallet = CreditWallet(user_id=admin_user.id, balance=99999)
            session.add(admin_wallet)
            await session.flush()
        else:
            # Ensure admin permissions remain active
            admin_user.role = UserRole.ADMIN
            admin_user.is_superuser = True
            admin_user.is_active = True
            await session.flush()

        # 5. Seed Demo User
        res = await session.execute(select(User).where(User.email == "demo@nimantran.ai"))
        demo_user = res.scalars().first()
        if not demo_user:
            logger.info("Creating demo account (demo@nimantran.ai)...")
            demo_user = User(
                email="demo@nimantran.ai",
                hashed_password=get_password_hash("password123"),
                full_name="Rohit & Neha Gupta",
                phone="+919876543210",
                role=UserRole.PRO,
                is_superuser=False,
            )
            session.add(demo_user)
            await session.flush()

            # Credit Wallet
            wallet = CreditWallet(user_id=demo_user.id, balance=2450)
            session.add(wallet)
            await session.flush()

            tx = CreditTransaction(
                wallet_id=wallet.id,
                user_id=demo_user.id,
                amount=2450,
                transaction_type=TransactionType.GRANT,
                balance_after=2450,
                description="Initial welcome credit bonus",
            )
            session.add(tx)

            # Seed Demo Events (Multiple Event Types & Themes)
            events_to_seed = [
                {
                    "title": "Rahul & Neha's Wedding Celebration",
                    "slug": "rahul-neha",
                    "event_type": EventType.WEDDING,
                    "host_name": "Sharma & Gupta Families",
                    "venue_name": "The Taj Hotel & Convention Centre",
                    "venue_address": "Vipul Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010",
                    "description": "Together with their families, Rahul & Neha request the pleasure of your company as they celebrate their love.",
                    "cover_image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop",
                    "theme_config": {"primary_color": "#800020", "secondary_color": "#D4AF37", "theme": "Royal Indian"},
                },
                {
                    "title": "Aditya's 25th Milestone Birthday Bash",
                    "slug": "aditya-25th-birthday",
                    "event_type": EventType.BIRTHDAY,
                    "host_name": "Aditya & Friends",
                    "venue_name": "Sky Lounge & Terrace Bar",
                    "venue_address": "Indiranagar, Bengaluru, Karnataka 560038",
                    "description": "Join us for an unforgettable night of music, cocktails, and celebration for Aditya's 25th milestone birthday!",
                    "cover_image_url": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&auto=format&fit=crop",
                    "theme_config": {"primary_color": "#7C3AED", "secondary_color": "#F472B6", "theme": "Celebratory Amethyst"},
                },
                {
                    "title": "Ananya & Vikram's Mehendi & Sangeet Night",
                    "slug": "ananya-vikram-sangeet",
                    "event_type": EventType.WEDDING,
                    "host_name": "Roy & Verma Families",
                    "venue_name": "The Oberoi Grand Ballroom",
                    "venue_address": "MG Road, New Delhi 110001",
                    "description": "An evening of vibrant colors, traditional Mehendi, energetic dance performances, and delicious royal cuisine.",
                    "cover_image_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop",
                    "theme_config": {"primary_color": "#9D174D", "secondary_color": "#F59E0B", "theme": "Festive Sunset Gala"},
                },
                {
                    "title": "Nimantran AI Tech & Innovation Summit 2026",
                    "slug": "nimantran-tech-summit-2026",
                    "event_type": EventType.CORPORATE,
                    "host_name": "Nimantran AI Engineering Team",
                    "venue_name": "Cyber City Convention Center",
                    "venue_address": "DLF Phase 2, Gurugram, Haryana 122002",
                    "description": "Gathering technology leaders, AI researchers, and digital innovators for keynotes, workshops, and networking.",
                    "cover_image_url": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop",
                    "theme_config": {"primary_color": "#0369A1", "secondary_color": "#22D3EE", "theme": "Futuristic Tech"},
                },
                {
                    "title": "Aarav's Grand Mundan Sanskar & Naming Ceremony",
                    "slug": "aarav-mundan-sanskar",
                    "event_type": EventType.MUNDAN,
                    "host_name": "Sharma Family",
                    "venue_name": "Riverfront Sacred Garden & Pavilion",
                    "venue_address": "Naya Ghat, Ayodhya, Uttar Pradesh 224123",
                    "description": "Seeking divine blessings for radiant health, wisdom, and protection for baby Aarav on his auspicious Mundan ceremony.",
                    "cover_image_url": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200&auto=format&fit=crop",
                    "theme_config": {"primary_color": "#7B341E", "secondary_color": "#FDBA74", "theme": "Warm Pastel Copper"},
                },
                {
                    "title": "Grand Diwali & Cultural Festival Gala 2026",
                    "slug": "diwali-gala-2026",
                    "event_type": EventType.RELIGIOUS,
                    "host_name": "Community Cultural Association",
                    "venue_name": "Royal Heritage Lawns",
                    "venue_address": "Civil Lines, Jaipur, Rajasthan 302006",
                    "description": "Celebrate the festival of lights with traditional diya illuminations, cultural music, fireworks, and festive feasts.",
                    "cover_image_url": "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1200&auto=format&fit=crop",
                    "theme_config": {"primary_color": "#C2410C", "secondary_color": "#FACC15", "theme": "Traditional Cultural"},
                },
                {
                    "title": "Sharma Family Annual Dinner Reception",
                    "slug": "sharma-family-reception",
                    "event_type": EventType.ANNIVERSARY,
                    "host_name": "Mr. & Mrs. Suresh Sharma",
                    "venue_name": "The ITC Maurya Grand Hall",
                    "venue_address": "Diplomatic Enclave, New Delhi 110021",
                    "description": "An intimate evening of fine dining, champagne, and family reunion to express gratitude to our nearest and dearest.",
                    "cover_image_url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop",
                    "theme_config": {"primary_color": "#064E3B", "secondary_color": "#D4AF37", "theme": "Luxury Emerald Gala"},
                },
            ]

            created_events = []
            for i, evt_data in enumerate(events_to_seed):
                evt_start = datetime.now(timezone.utc) + timedelta(days=15 + (i * 10))
                evt_obj = Event(
                    user_id=demo_user.id,
                    title=evt_data["title"],
                    slug=evt_data["slug"],
                    event_type=evt_data["event_type"],
                    status=EventStatus.PUBLISHED,
                    host_name=evt_data["host_name"],
                    contact_phone="+919876543210",
                    start_date=evt_start,
                    end_date=evt_start + timedelta(days=1),
                    venue_name=evt_data["venue_name"],
                    venue_address=evt_data["venue_address"],
                    google_maps_url=f"https://maps.google.com/?q={evt_data['venue_name'].replace(' ', '+')}",
                    description=evt_data["description"],
                    cover_image_url=evt_data["cover_image_url"],
                    upi_id="demo@upi",
                    theme_config=evt_data["theme_config"],
                )
                session.add(evt_obj)
                created_events.append(evt_obj)

            await session.flush()
            event = created_events[0]
            event_start = datetime.now(timezone.utc) + timedelta(days=30)

            # Event Functions for Primary Wedding Event
            functions = [
                EventFunction(event_id=event.id, name="Haldi Ceremony", date_time=event_start, venue_name="Poolside Lawn, Taj", address="Lucknow", dress_code="Yellow Traditional", order_index=1),
                EventFunction(event_id=event.id, name="Mehendi & Sangeet", date_time=event_start + timedelta(hours=8), venue_name="Grand Ballroom, Taj", address="Lucknow", dress_code="Indo-Western", order_index=2),
                EventFunction(event_id=event.id, name="Wedding Ceremony", date_time=event_start + timedelta(days=1), venue_name="Royal Mandap, Taj", address="Lucknow", dress_code="Royal Ethic", order_index=3),
                EventFunction(event_id=event.id, name="Reception Gala", date_time=event_start + timedelta(days=1, hours=8), venue_name="Crystal Hall, Taj", address="Lucknow", dress_code="Formal / Evening Wear", order_index=4),
            ]
            session.add_all(functions)

            # Invitation Wording
            invitation = Invitation(
                event_id=event.id,
                title_text="Rahul ❤️ Neha",
                message_text="Together with their families, request your gracious presence at their wedding celebration.",
                language="HI_EN",
            )
            session.add(invitation)

            # Guest Groups & Demo Guests
            family_group = GuestGroup(event_id=event.id, name="Close Family")
            friends_group = GuestGroup(event_id=event.id, name="Friends & Colleagues")
            session.add_all([family_group, friends_group])
            await session.flush()

            sample_guests = [
                ("Amit Gupta", "+919811111111", "Groom's Brother", family_group.id, GuestCategory.FAMILY, RSVPStatus.YES, 2, 1, True, "Excited to celebrate brother!"),
                ("Priya Sharma", "+919822222222", "Bride's Sister", family_group.id, GuestCategory.FAMILY, RSVPStatus.YES, 2, 0, True, "Can't wait!"),
                ("Suresh Sharma", "+919833333333", "Senior Uncle", family_group.id, GuestCategory.VIP, RSVPStatus.YES, 2, 0, False, "Blessings to couple."),
                ("Vikram Verma", "+919844444444", "Groom's Friend", friends_group.id, GuestCategory.NORMAL, RSVPStatus.MAYBE, 1, 0, False, None),
                ("Ananya Roy", "+919855555555", "College Friend", friends_group.id, GuestCategory.NORMAL, RSVPStatus.PENDING, 1, 0, False, None),
            ]

            for idx, (g_name, g_phone, g_rel, g_group, g_cat, rsvp_st, adults, kids, chk, wish) in enumerate(sample_guests, start=1):
                guest = Guest(
                    event_id=event.id,
                    group_id=g_group,
                    name=g_name,
                    phone=g_phone,
                    relationship=g_rel,
                    category=g_cat,
                    rsvp_status=rsvp_st,
                    adults_count=adults,
                    children_count=kids,
                    checked_in=chk,
                    custom_welcome_quote=f"Welcome {g_name}! Your presence brings immense joy to our celebration.",
                )
                session.add(guest)
                await session.flush()

                # Generate QR Pass
                pass_code = f"NIM-ENTRY-100{idx}"
                pass_obj = GuestEntryPass(
                    guest_id=guest.id,
                    event_id=event.id,
                    pass_code=pass_code,
                    token_hash=f"hash_{pass_code}",
                    status=PassStatus.VALID,
                )
                session.add(pass_obj)

                # RSVP record
                if rsvp_st != RSVPStatus.PENDING:
                    rsvp_rec = RSVP(
                        guest_id=guest.id,
                        event_id=event.id,
                        status=rsvp_st,
                        adults_attending=adults,
                        children_attending=kids,
                        wishes_note=wish,
                    )
                    session.add(rsvp_rec)

            # Story
            story = Story(event_id=event.id, title="Our Journey of Love", subtitle="Rahul & Neha", style="ROMANTIC")
            session.add(story)
            await session.flush()

            timeline_items = [
                StoryTimelineItem(story_id=story.id, year_label="2019", title="First Meeting", description="Met during a college festival in Delhi.", order_index=1),
                StoryTimelineItem(story_id=story.id, year_label="2022", title="The Proposal", description="A heartwarming sunset proposal in Udaipur.", order_index=2),
                StoryTimelineItem(story_id=story.id, year_label="2026", title="The Wedding", description="Starting our forever journey together.", order_index=3),
            ]
            session.add_all(timeline_items)

            # Gallery Albums
            album = GalleryAlbum(event_id=event.id, title="Highlights", description="Pre-wedding and ceremony highlights", order_index=1)
            session.add(album)
            await session.flush()

            gallery_items = [
                GalleryItem(event_id=event.id, album_id=album.id, media_url="https://images.unsplash.com/photo-1519741497674-611481863552", caption="Rahul & Neha Pre-Wedding"),
                GalleryItem(event_id=event.id, album_id=album.id, media_url="https://images.unsplash.com/photo-1511285560929-80b456fea0bc", caption="Sangeet Night Lights"),
            ]
            session.add_all(gallery_items)

        # 5. Seed Host Master Contact Database
        if demo_user:
            res_mc = await session.execute(select(MasterContact).where(MasterContact.user_id == demo_user.id))
            if not res_mc.scalars().first():
                logger.info("Seeding Master Contact Database for demo host...")
                master_contacts = [
                    MasterContact(user_id=demo_user.id, name="Amit Gupta", phone="+919811111111", email="amit.gupta@gmail.com", group_name="Family", relationship="Groom's Brother", source="MANUAL"),
                    MasterContact(user_id=demo_user.id, name="Priya Sharma", phone="+919822222222", email="priya.sharma@yahoo.com", group_name="Family", relationship="Bride's Sister", source="MOBILE_SYNC"),
                    MasterContact(user_id=demo_user.id, name="Suresh Sharma", phone="+919833333333", email="suresh.sharma@gmail.com", group_name="VIP", relationship="Senior Uncle", source="MANUAL"),
                    MasterContact(user_id=demo_user.id, name="Vikram Verma", phone="+919844444444", email="vikram.verma@outlook.com", group_name="Friends", relationship="Groom's Best Friend", source="MOBILE_SYNC"),
                    MasterContact(user_id=demo_user.id, name="Ananya Roy", phone="+919855555555", email="ananya.roy@gmail.com", group_name="Friends", relationship="College Friend", source="MOBILE_SYNC"),
                    MasterContact(user_id=demo_user.id, name="Dr. Rajesh Mehra", phone="+919866666666", email="dr.mehra@hospital.org", group_name="VIP", relationship="Family Doctor", source="MANUAL"),
                    MasterContact(user_id=demo_user.id, name="Kavita Singhania", phone="+919877777777", email="kavita@singhania.com", group_name="Relatives", relationship="Aunt (Masi)", source="MOBILE_SYNC"),
                    MasterContact(user_id=demo_user.id, name="Rohan Kapur", phone="+919888888888", email="rohan.k@techcorp.com", group_name="Colleagues", relationship="Office Manager", source="MOBILE_SYNC"),
                    MasterContact(user_id=demo_user.id, name="Sunita Aggarwal", phone="+919899999999", email="sunita.a@gmail.com", group_name="Relatives", relationship="Chachi", source="MANUAL"),
                    MasterContact(user_id=demo_user.id, name="Deepak Malhotra", phone="+919800000000", email="deepak.m@gmail.com", group_name="Friends", relationship="Childhood Friend", source="MOBILE_SYNC"),
                ]
                session.add_all(master_contacts)

        await session.commit()
        logger.info("Database initialization and seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
