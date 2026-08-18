import re
import uuid
import logging
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.event import Event, EventStatus
from app.models.guest import Guest, RSVPStatus, GuestCategory
from app.models.campaign import CampaignChannel
from app.schemas.event import EventCreate, EventUpdate
from app.schemas.guest import GuestCreate
from app.schemas.concierge import (
    ConciergeIntent,
    ConciergeActionType,
    ConciergeAction,
    ConciergeChatResponse,
)
from app.services.event_service import EventService
from app.services.guest_service import GuestService
from app.services.campaign_service import CampaignService
from app.services.ai_service import AIService

logger = logging.getLogger("nimantran_ai.concierge_service")


class ConciergeService:
    """
    Intelligent AI Concierge Layer:
    Interprets natural language intents in Hindi, Hinglish, and English,
    enforces permission boundaries, mandates user confirmation for high-impact actions,
    and executes strictly via existing application domain services.
    """

    # In-memory store for pending confirmation actions
    _pending_actions: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def register_pending_action(
        cls,
        action_id: str,
        user_id: str,
        event_id: str,
        action_type: ConciergeActionType,
        payload: Dict[str, Any],
    ) -> None:
        cls._pending_actions[action_id] = {
            "action_id": action_id,
            "user_id": user_id,
            "event_id": event_id,
            "action_type": action_type,
            "payload": payload,
        }

    @classmethod
    def get_pending_action(cls, action_id: str) -> Optional[Dict[str, Any]]:
        return cls._pending_actions.get(action_id)

    @classmethod
    def pop_pending_action(cls, action_id: str) -> Optional[Dict[str, Any]]:
        return cls._pending_actions.pop(action_id, None)

    # =========================================================================
    # INTENT CLASSIFIER & PARAMETER PARSER
    # =========================================================================
    @classmethod
    def detect_intent(cls, message: str) -> Tuple[ConciergeIntent, Dict[str, Any]]:
        msg = message.strip().lower()
        params: Dict[str, Any] = {}

        # 1. Confirmation / Cancellation
        # Exact short confirmation or explicit phrases without intent keywords
        if (
            re.search(r"^(send now|confirm|haan bhej do|bhej do|kar do|proceed|yes|haan|theek hai)$", msg.strip(" .!?"))
            or (
                re.search(r"\b(send now|haan bhej do|proceed)\b", msg)
                and not re.search(r"\b(sabko|whatsapp|reminder|invitation|add|guest|guests|kitne|rsvp)\b", msg)
            )
        ):
            return ConciergeIntent.CONFIRM_ACTION, params
        if re.search(r"^(cancel|mat bhejo|abort|no|nahi|rehne do|discard)$", msg.strip(" .!?")) or re.search(r"\b(cancel action|mat bhejo|abort)\b", msg):
            return ConciergeIntent.CANCEL_ACTION, params

        # 2. Guidance / Best Practices / Navigation (Check first for advice queries)
        if re.search(r"\b(kya karna chahiye|kya karein|guide|advice|suggestion|suggestions|planning|kaise manage karein|kya karna)\b", msg) or (re.search(r"\b(\d+)\s*(?:guests|log|mehmaan)\b", msg) and re.search(r"\b(kya|kaise|help|guide)\b", msg)):
            cnt_m = re.search(r"\b(\d+)\b", msg)
            if cnt_m:
                params["guest_count"] = int(cnt_m.group(1))
            return ConciergeIntent.NAVIGATE_OR_ADVISE, params

        # 3. Broadcast / Send Campaigns (Requires Confirmation)
        if (
            re.search(r"\b(sabko|all|broadcast)\b", msg)
            and re.search(r"\b(whatsapp|bhej\w*|send\w*|invitation\w*|message\w*)\b", msg)
        ):
            params["audience"] = "ALL"
            params["channel"] = "WHATSAPP"
            return ConciergeIntent.PREPARE_CAMPAIGN, params

        if (
            re.search(r"\b(reminder\w*|pending\w*|bache hue|remind\w*)\b", msg)
            and re.search(r"\b(bhej\w*|send\w*|whatsapp\w*|remind\w*|karo|karein|do)\b", msg)
        ):
            params["audience"] = "PENDING_RSVP"
            params["channel"] = "WHATSAPP"
            return ConciergeIntent.PREPARE_CAMPAIGN, params

        # 4. Add Guest / Upload Guest List
        if re.search(r"\b(guest list upload|upload guest|import contacts|excel|csv)\b", msg):
            params["action"] = "NAVIGATE_IMPORT"
            return ConciergeIntent.NAVIGATE_OR_ADVISE, params

        if (re.search(r"\b(add|jodo|daalo|shamil)\b", msg) and re.search(r"\b(guest|list|ko|to)\b", msg)) or ("add" in msg and ("guest" in msg or "list" in msg or "ko" in msg)):
            phone_match = re.search(r"\b(\+?\d{10,13})\b", msg)
            if phone_match:
                params["phone"] = phone_match.group(1)
            
            name_m = re.search(r"^([a-zA-Z\u0900-\u097F\s]+?)\s+(?:ko|to|\d|\+)", msg)
            if not name_m:
                name_m = re.search(r"(?:add|jodo|daalo)\s+(?:guest\s+)?([a-zA-Z\u0900-\u097F\s]+?)(?:\s+(?:to|ko|in|mein|with|\d|\+)|$)", msg)
            
            raw_name = name_m.group(1).strip() if name_m else "Guest"
            raw_name = re.sub(r"\b(guest|list|mein|ko|to|add|jodo|daalo|karo|karein|please)\b", "", raw_name).strip()
            params["guest_name"] = raw_name.title() if raw_name else "Guest"
            return ConciergeIntent.ADD_GUEST, params

        # 5. Resend Single Invitation
        # Name before 'ko' or 'to'
        resend_match = re.search(r"^([a-zA-Z\u0900-\u097F\s]+?)\s*(?:ko|to)\s*(?:invitation|message)?\s*(?:dobara|wapas|phir se|resend)", msg)
        if not resend_match:
            # Name after 'resend/dobara'
            resend_match = re.search(r"(?:resend|dobara bhej\w*|wapas bhej\w*|phir se bhej\w*)\s*(?:invitation|message)?\s*(?:to|ko)?\s*([a-zA-Z\u0900-\u097F\s]+)", msg)
        if resend_match:
            guest_name = resend_match.group(1).strip()
            guest_name = re.sub(r"\b(ko|to|invitation|message|dobara|wapas|phir se|resend|bhejna|hai|bhej|do|karo)\b", "", guest_name).strip()
            if guest_name and guest_name.lower() not in ["sabko", "all", "guests", "whatsapp", "reminder", "rsvp", "pending"]:
                params["guest_name"] = guest_name.title()
                return ConciergeIntent.RESEND_INVITATION, params

        # 6. Query RSVP / Attendance
        if (re.search(r"\b(kitne|how many|count|status|kaun|who|kya)\b", msg) and re.search(r"\b(guest|guests|rsvp|confirm|confirmed|attending|aa rahe|aayenge|attendance|hazri)\b", msg)) or ("rsvp" in msg and ("status" in msg or "check" in msg or "kitne" in msg or "confirm" in msg)):
            return ConciergeIntent.QUERY_RSVP, params

        # 7. Modify Event (Colors / Theme / Title / Venue / Date)
        if re.search(r"\b(colour|color|theme|rang|design)\b", msg) and re.search(r"\b(change|badal|set|karo|karna)\b", msg):
            color_match = re.search(r"\b(red|gold|blue|green|pink|purple|royal|emerald|ruby|crimson|maroon|yellow)\b", msg)
            if color_match:
                params["color"] = color_match.group(1)
            params["modify_type"] = "THEME_COLOR"
            return ConciergeIntent.MODIFY_EVENT, params

        if re.search(r"\b(venue|location|jagah|address)\b", msg) and re.search(r"\b(change|badal|update)\b", msg):
            params["modify_type"] = "VENUE"
            return ConciergeIntent.MODIFY_EVENT, params

        if re.search(r"\b(date|tarikh|shubh din|time|samay)\b", msg) and re.search(r"\b(change|badal|update)\b", msg):
            params["modify_type"] = "DATE_TIME"
            return ConciergeIntent.MODIFY_EVENT, params

        # 8. Generate Invitation / Wording (Hindi/English/Tone)
        if re.search(r"\b(hindi|english|wording|shloka|sandesh|kavita|shayari|tone|emotional|royal)\b", msg) and re.search(r"\b(invitation|card|likho|generate|chahiye|banana)\b", msg):
            if "hindi" in msg:
                params["language"] = "HI"
            elif "english" in msg:
                params["language"] = "EN"
            else:
                params["language"] = "BOTH"
            return ConciergeIntent.GENERATE_INVITATION, params

        # 9. Create Event
        if re.search(r"\b(create|banana|shuru|new|naya)\b", msg) and re.search(r"\b(event|invitation|card|shaadi|wedding|birthday|party|puja|ceremony)\b", msg):
            if "wedding" in msg or "shaadi" in msg or "vivah" in msg:
                params["event_type"] = "WEDDING"
            elif "birthday" in msg or "janamdin" in msg:
                params["event_type"] = "BIRTHDAY"
            elif "puja" in msg or "havan" in msg:
                params["event_type"] = "PUJA"
            else:
                params["event_type"] = "CELEBRATION"
            return ConciergeIntent.CREATE_EVENT, params

        # Fallback Guidance / Best Practices
        if re.search(r"\b(kya karna chahiye|guests hain|help|guide|kaise|advice|suggestions)\b", msg):
            return ConciergeIntent.NAVIGATE_OR_ADVISE, params

        # 9. Guidance / Best Practices / Navigation
        if re.search(r"\b(kya karna chahiye|guests hain|help|guide|kaise|advice|suggestions)\b", msg):
            # Extract guest count if mentioned
            count_match = re.search(r"\b(\d{2,4})\b", msg)
            if count_match:
                params["guest_count"] = int(count_match.group(1))
            return ConciergeIntent.NAVIGATE_OR_ADVISE, params

        return ConciergeIntent.GENERAL_CHAT, params

    # =========================================================================
    # CORE DISPATCHER & LOGIC EXECUTION
    # =========================================================================
    @classmethod
    async def process_chat(
        cls,
        db: AsyncSession,
        user: User,
        message: str,
        event_id: Optional[str] = None,
        thread_id: str = "default_concierge_thread",
        confirmed_action_id: Optional[str] = None,
        confirmed: Optional[bool] = None,
    ) -> ConciergeChatResponse:
        """
        Executes the intelligent concierge loop with permission checks, confirmation gating,
        and delegation to application domain services.
        """
        # A. Handle explicit confirmed action ID
        if confirmed_action_id:
            pending = cls.get_pending_action(confirmed_action_id)
            if not pending:
                return ConciergeChatResponse(
                    reply_text="यह Action एक्सपायर हो चुका है या पहले ही निष्पादित हो चुका है.",
                    intent=ConciergeIntent.CANCEL_ACTION,
                    suggested_actions=["Dashboard dekhein", "New action start karein"],
                )
            if pending["user_id"] != user.id:
                return ConciergeChatResponse(
                    reply_text="Unauthorized action confirmation.",
                    intent=ConciergeIntent.CANCEL_ACTION,
                )
            if confirmed is False:
                cls.pop_pending_action(confirmed_action_id)
                return ConciergeChatResponse(
                    reply_text="Operation रद्द कर दिया गया है. कोई भी संदेश नहीं भेजा गया.",
                    intent=ConciergeIntent.CANCEL_ACTION,
                    suggested_actions=["Guest list dekhein", "RSVP check karein"],
                )
            
            # Execute confirmed action
            return await cls._execute_confirmed_action(db, user, pending)

        # B. Classify user message
        intent, params = cls.detect_intent(message)

        # If user explicitly said "confirm" or "cancel" without action_id, check most recent pending action for this user
        if intent == ConciergeIntent.CONFIRM_ACTION or intent == ConciergeIntent.CANCEL_ACTION:
            recent_action = None
            for act_id, act_data in list(cls._pending_actions.items()):
                if act_data["user_id"] == user.id and (not event_id or act_data["event_id"] == event_id):
                    recent_action = act_data
                    break
            if recent_action:
                if intent == ConciergeIntent.CANCEL_ACTION:
                    cls.pop_pending_action(recent_action["action_id"])
                    return ConciergeChatResponse(
                        reply_text="Operation रद्द कर दिया गया है. कोई संदेश नहीं भेजा गया.",
                        intent=ConciergeIntent.CANCEL_ACTION,
                        suggested_actions=["Guest list dekhein", "RSVP status check karein"],
                    )
                else:
                    return await cls._execute_confirmed_action(db, user, recent_action)

        # C. Verify event context if required
        event = None
        if event_id:
            event = await EventService.get_event_by_id(db, event_id)
            if not event or event.user_id != user.id:
                return ConciergeChatResponse(
                    reply_text="Event नहीं मिला या आपके पास इसका एक्सेस नहीं है.",
                    intent=ConciergeIntent.GENERAL_CHAT,
                )

        # D. Execute Intent Handlers
        if intent == ConciergeIntent.CREATE_EVENT:
            return await cls._handle_create_event(db, user, params, message)

        elif intent == ConciergeIntent.MODIFY_EVENT:
            if not event:
                return ConciergeChatResponse(
                    reply_text="कृपया पहले किसी Event को चुनें जिसमें आप बदलाव करना चाहते हैं.",
                    intent=intent,
                    suggested_actions=["Select an Event", "Create New Event"],
                )
            return await cls._handle_modify_event(db, user, event, params, message)

        elif intent == ConciergeIntent.ADD_GUEST:
            if not event:
                return ConciergeChatResponse(
                    reply_text="Guest add करने के लिए कृपया पहले Event सिलेक्ट करें.",
                    intent=intent,
                    suggested_actions=["Go to Events"],
                )
            return await cls._handle_add_guest(db, user, event, params)

        elif intent == ConciergeIntent.QUERY_RSVP:
            if not event:
                return ConciergeChatResponse(
                    reply_text="RSVP जानने के लिए कृपया पहले एक Event सिलेक्ट करें.",
                    intent=intent,
                )
            return await cls._handle_query_rsvp(db, user, event)

        elif intent == ConciergeIntent.GENERATE_INVITATION:
            if not event:
                return ConciergeChatResponse(
                    reply_text="Invitation wording तैयार करने के लिए कृपया पहले Event सिलेक्ट करें.",
                    intent=intent,
                )
            return await cls._handle_generate_invitation(db, user, event, params)

        elif intent == ConciergeIntent.RESEND_INVITATION:
            if not event:
                return ConciergeChatResponse(
                    reply_text="Invitation resend करने के लिए कृपया पहले Event सिलेक्ट करें.",
                    intent=intent,
                )
            return await cls._handle_resend_invitation(db, user, event, params)

        elif intent == ConciergeIntent.PREPARE_CAMPAIGN:
            if not event:
                return ConciergeChatResponse(
                    reply_text="WhatsApp campaign भेजने के लिए कृपया पहले Event सिलेक्ट करें.",
                    intent=intent,
                )
            return await cls._handle_prepare_campaign(db, user, event, params)

        elif intent == ConciergeIntent.NAVIGATE_OR_ADVISE:
            return await cls._handle_navigate_or_advise(db, user, event, params, message)

        else:
            # Fallback to general conversational concierge
            return ConciergeChatResponse(
                reply_text=f"नमस्ते! मैं आपका Nimantran AI Event Concierge हूँ ❤️ मैं आपके इवेंट के लिए:\n• 💌 Digital Invitation तैयार कर सकता हूँ\n• 👥 Guest List मैनेज और RSVP ट्रैक कर सकता हूँ\n• 📱 WhatsApp Broadcast व Reminders भेज सकता हूँ\n• 🎨 Theme और Colors कस्टमाइज़ कर सकता हूँ\n\nआप क्या करना चाहते हैं?",
                intent=ConciergeIntent.GENERAL_CHAT,
                suggested_actions=[
                    "Guest list upload karna hai",
                    "Kitne guests confirm hain?",
                    "Sabko WhatsApp bhej do",
                    "Mujhe Hindi invitation chahiye",
                ],
            )

    # =========================================================================
    # INTENT HANDLER IMPLEMENTATIONS (Calling Existing APIs)
    # =========================================================================

    @classmethod
    async def _handle_create_event(cls, db: AsyncSession, user: User, params: Dict[str, Any], message: str) -> ConciergeChatResponse:
        from datetime import datetime, timezone
        evt_type = params.get("event_type", "WEDDING")
        title = f"{user.full_name or 'Host'}'s {evt_type.title()} Celebration"
        event_in = EventCreate(
            title=title,
            event_type=evt_type,
            host_name=user.full_name or "Host Family",
            start_date=datetime.now(timezone.utc),
            venue_name="Grand Celebration Hall",
            venue_address="City Center",
            description=f"AI Concierge created celebration invitation from user request: '{message}'",
        )
        created_event = await EventService.create_event(db, user.id, event_in)
        return ConciergeChatResponse(
            reply_text=f"🎉 बहुत बढ़िया! मैंने आपका नया इवेंट **'{created_event.title}'** तैयार कर दिया है.\n\nअब आप इसमें Guests जोड़ सकते हैं या Invitation Design कस्टमाइज़ कर सकते हैं.",
            intent=ConciergeIntent.CREATE_EVENT,
            action_executed=True,
            execution_result={"event_id": created_event.id, "title": created_event.title, "slug": created_event.slug},
            ui_navigation={"tab": "details", "event_id": created_event.id},
            suggested_actions=["Guest list upload karna hai", "Mujhe Hindi invitation chahiye", "Design select karein"],
        )

    @classmethod
    async def _handle_modify_event(cls, db: AsyncSession, user: User, event: Event, params: Dict[str, Any], message: str) -> ConciergeChatResponse:
        mod_type = params.get("modify_type", "THEME_COLOR")
        theme_config = dict(event.theme_config or {})

        if mod_type == "THEME_COLOR":
            color = params.get("color", "royal_gold")
            theme_config["primary_color"] = color
            theme_config["color_palette"] = color
            theme_config["accent_style"] = f"{color.title()} Elegance"
            updated = await EventService.update_event(db, event, {"theme_config": theme_config})
            return ConciergeChatResponse(
                reply_text=f"✨ आपके निमंत्रण पत्र का Theme Color सफलतापूर्वक **{color.title()}** में अपडेट कर दिया गया है!",
                intent=ConciergeIntent.MODIFY_EVENT,
                action_executed=True,
                execution_result={"event_id": updated.id, "theme_config": updated.theme_config},
                ui_navigation={"tab": "design", "event_id": updated.id},
                suggested_actions=["Preview Invitation", "Guest list upload karna hai", "Sabko WhatsApp bhej do"],
            )
        else:
            return ConciergeChatResponse(
                reply_text=f"इवेंट डिटेल्स में बदलाव करने के लिए आप सीधे Event Edit पेज पर जा सकते हैं.",
                intent=ConciergeIntent.MODIFY_EVENT,
                ui_navigation={"tab": "details", "event_id": event.id},
                suggested_actions=["Event details edit karein", "Guest list check karein"],
            )

    @classmethod
    async def _handle_add_guest(cls, db: AsyncSession, user: User, event: Event, params: Dict[str, Any]) -> ConciergeChatResponse:
        guest_name = params.get("guest_name", "Guest")
        phone = params.get("phone", None)
        guest_data = GuestCreate(
            name=guest_name,
            phone=phone,
            relationship="Guest",
            group_name="General",
        )
        created_guest = await GuestService.create_guest(db, event.id, guest_data, user_id=user.id)
        return ConciergeChatResponse(
            reply_text=f"✅ **{created_guest.name}** ({created_guest.phone or 'No phone'}) को आपकी Guest List में जोड़ दिया गया है.",
            intent=ConciergeIntent.ADD_GUEST,
            action_executed=True,
            execution_result={"guest_id": created_guest.id, "name": created_guest.name, "phone": created_guest.phone},
            ui_navigation={"tab": "guests", "event_id": event.id},
            suggested_actions=["Kitne guests confirm hain?", f"{created_guest.name} ko invitation dobara bhejna hai", "Sabko WhatsApp bhej do"],
        )

    @classmethod
    async def _handle_query_rsvp(cls, db: AsyncSession, user: User, event: Event) -> ConciergeChatResponse:
        stmt = select(Guest).where(Guest.event_id == event.id)
        res = await db.execute(stmt)
        all_guests = list(res.scalars().all())

        total = len(all_guests)
        attending = sum(1 for g in all_guests if g.rsvp_status == RSVPStatus.YES)
        maybe = sum(1 for g in all_guests if g.rsvp_status == RSVPStatus.MAYBE)
        declined = sum(1 for g in all_guests if g.rsvp_status == RSVPStatus.NO)
        pending = sum(1 for g in all_guests if g.rsvp_status == RSVPStatus.PENDING)
        total_headcount = sum((g.adults_count or 1) + (g.children_count or 0) for g in all_guests if g.rsvp_status == RSVPStatus.YES)

        reply = (
            f"📊 **'{event.title}' का लाइव RSVP स्टेटस:**\n\n"
            f"• 👥 कुल आमंत्रित (Total Invited): **{total}**\n"
            f"• ✅ कन्फर्म उपस्थित (Attending): **{attending}** (कुल {total_headcount} व्यक्ति)\n"
            f"• 🤔 शायद (Maybe): **{maybe}**\n"
            f"• ❌ असमर्थ (Declined): **{declined}**\n"
            f"• ⏳ प्रतीक्षारत (Pending RSVP): **{pending}**\n"
        )
        if pending > 0:
            reply += f"\n💡 क्या आप बचे हुए **{pending} प्रतीक्षारत अतिथियों** को WhatsApp reminder भेजना चाहते हैं?"

        return ConciergeChatResponse(
            reply_text=reply,
            intent=ConciergeIntent.QUERY_RSVP,
            action_executed=True,
            execution_result={
                "total": total,
                "attending": attending,
                "attending_headcount": total_headcount,
                "maybe": maybe,
                "declined": declined,
                "pending": pending,
            },
            ui_navigation={"tab": "rsvp", "event_id": event.id},
            suggested_actions=["RSVP pending guests ko reminder bhejo", "Sabko WhatsApp bhej do", "Guest list dekhein"],
        )

    @classmethod
    async def _handle_generate_invitation(cls, db: AsyncSession, user: User, event: Event, params: Dict[str, Any]) -> ConciergeChatResponse:
        lang = params.get("language", "HI")
        ai_svc = AIService()
        canonical = await ai_svc.get_or_generate_canonical_invitation(event=event, db=db, user_id=user.id)
        
        reply = (
            f"📜 **आपके लिए तैयार सांस्कृतिक व भावनात्मक निमंत्रण संदेश ({lang}):**\n\n"
            f"*{canonical.blessing}*\n\n"
            f"{canonical.message}\n\n"
            f"— {canonical.closing}\n\n"
            f"यह संदेश आपके सभी चैनल्स (Web Card, WhatsApp, SMS, Email) पर ऑटो-सिंक हो गया है."
        )
        return ConciergeChatResponse(
            reply_text=reply,
            intent=ConciergeIntent.GENERATE_INVITATION,
            action_executed=True,
            execution_result={"canonical": canonical.model_dump()},
            ui_navigation={"tab": "design", "event_id": event.id},
            suggested_actions=["Sabko WhatsApp bhej do", "Theme color change karna hai", "Preview card"],
        )

    @classmethod
    async def _handle_resend_invitation(cls, db: AsyncSession, user: User, event: Event, params: Dict[str, Any]) -> ConciergeChatResponse:
        target_name = params.get("guest_name", "").strip().lower()
        stmt = select(Guest).where(Guest.event_id == event.id)
        res = await db.execute(stmt)
        all_guests = list(res.scalars().all())

        matched_guest = None
        for g in all_guests:
            if target_name in g.name.lower() or g.name.lower() in target_name:
                matched_guest = g
                break

        if not matched_guest:
            return ConciergeChatResponse(
                reply_text=f"'{target_name}' नाम का कोई अतिथि आपकी Guest List में नहीं मिला. कृपया नाम दोबारा चेक करें.",
                intent=ConciergeIntent.RESEND_INVITATION,
                suggested_actions=["Guest list dekhein", "Add guest"],
            )

        # Create a single targeted broadcast using create_broadcast_campaign
        campaign = await CampaignService.create_broadcast_campaign(
            db=db,
            event_id=event.id,
            user_id=user.id,
            channels=["WHATSAPP"],
            title=f"Single Resend: {matched_guest.name}",
            guest_ids=[matched_guest.id],
            target_audience="CUSTOM",
        )

        return ConciergeChatResponse(
            reply_text=f"🚀 **{matched_guest.name}** ({matched_guest.phone or 'Default contact'}) को आपका डिजिटल निमंत्रण और Entry QR Pass सफलतापूर्वक पुनः भेज दिया गया है!",
            intent=ConciergeIntent.RESEND_INVITATION,
            action_executed=True,
            execution_result={"guest_id": matched_guest.id, "guest_name": matched_guest.name, "campaign_id": campaign.id},
            suggested_actions=["Kitne guests confirm hain?", "Sabko WhatsApp bhej do", "RSVP status"],
        )

    @classmethod
    async def _handle_prepare_campaign(cls, db: AsyncSession, user: User, event: Event, params: Dict[str, Any]) -> ConciergeChatResponse:
        audience = params.get("audience", "ALL")
        channel = params.get("channel", "WHATSAPP")

        stmt = select(Guest).where(Guest.event_id == event.id)
        res = await db.execute(stmt)
        all_guests = list(res.scalars().all())

        if audience == "PENDING_RSVP":
            target_guests = [
                g for g in all_guests
                if g.rsvp_status == RSVPStatus.PENDING
                or str(g.rsvp_status) == "PENDING"
                or str(getattr(g.rsvp_status, "value", "")).upper() == "PENDING"
            ]
        else:
            target_guests = all_guests
        target_count = len(target_guests)

        if target_count == 0:
            return ConciergeChatResponse(
                reply_text="इस कैटेगरी में कोई भी गेस्ट नहीं मिला जिसे मैसेज भेजा जा सके.",
                intent=ConciergeIntent.PREPARE_CAMPAIGN,
                suggested_actions=["Guest list upload karna hai", "RSVP check karein"],
            )

        action_id = f"act_{uuid.uuid4().hex[:12]}"
        action_payload = {
            "event_id": event.id,
            "audience": audience,
            "channel": channel,
            "target_count": target_count,
            "guest_ids": [g.id for g in target_guests],
            "campaign_name": f"{'Pending RSVP Reminder' if audience == 'PENDING_RSVP' else 'Full Celebration Broadcast'} via AI Concierge",
        }
        cls.register_pending_action(action_id, user.id, event.id, ConciergeActionType.SEND_BROADCAST_CAMPAIGN, action_payload)

        prompt = (
            f"आप **{target_count} guests** को WhatsApp { 'RSVP reminder' if audience == 'PENDING_RSVP' else 'invitation' } भेजने वाले हैं.\n\n"
            f"📊 **Estimated messages:** {target_count}\n"
            f"📱 **Channel:** WhatsApp\n\n"
            f"क्या आप इसे अभी भेजना चाहते हैं?"
        )

        structured_action = ConciergeAction(
            action_id=action_id,
            action_type=ConciergeActionType.SEND_BROADCAST_CAMPAIGN,
            event_id=event.id,
            requires_confirmation=True,
            confirmation_prompt=prompt,
            confirmation_payload=action_payload,
            parameters=params,
            preview_data={
                "target_count": target_count,
                "channel": channel,
                "audience": audience,
                "sample_recipient": target_guests[0].name if target_guests else "Guest",
            },
        )

        return ConciergeChatResponse(
            reply_text=prompt,
            intent=ConciergeIntent.PREPARE_CAMPAIGN,
            structured_action=structured_action,
            requires_confirmation=True,
            action_executed=False,
            suggested_actions=["Send Now", "Preview", "Cancel"],
        )

    @classmethod
    async def _handle_navigate_or_advise(cls, db: AsyncSession, user: User, event: Optional[Event], params: Dict[str, Any], message: str) -> ConciergeChatResponse:
        if params.get("action") == "NAVIGATE_IMPORT":
            return ConciergeChatResponse(
                reply_text="Guest List अपलोड करने के लिए आप Excel, CSV या vCard फ़ाइल का उपयोग कर सकते हैं. मैं आपको Guest Import स्क्रीन पर ले जा रहा हूँ.",
                intent=ConciergeIntent.NAVIGATE_OR_ADVISE,
                ui_navigation={"tab": "guests", "modal": "import", "event_id": event.id if event else None},
                suggested_actions=["Upload CSV", "Manual Add Guest", "Check RSVP"],
            )

        guest_count = params.get("guest_count", 250)
        advice = (
            f"💡 **{guest_count} मेहमानों के भव्य आयोजन के लिए मेरी विशेषज्ञ सलाह:**\n\n"
            f"1. 📋 **Guest List:** अतिथियों को परिवार/मित्र श्रेणियों में बाँटें ताकि भोजन व बैठक व्यवस्था सुगम रहे.\n"
            f"2. 💌 **Invitation Delivery:** शादी से 3-4 सप्ताह पूर्व डिजिटल निमंत्रण भेजें ताकि अधिकतम RSVP प्राप्त हो सके.\n"
            f"3. 🎫 **QR Gate Entry Pass:** रिसेप्शन पर भीड़ से बचने के लिए Nimantran Gate Scanner का उपयोग करें.\n"
            f"4. ⏳ **RSVP Reminders:** इवेंट से 1 सप्ताह पहले 'Pending RSVP' वाले मेहमानों को 1-क्लिक रिमाइंडर भेजें.\n\n"
            f"क्या आप अभी Guest List अपलोड करना चाहते हैं या WhatsApp ब्रॉडकास्ट तैयार करें?"
        )
        return ConciergeChatResponse(
            reply_text=advice,
            intent=ConciergeIntent.NAVIGATE_OR_ADVISE,
            suggested_actions=["Guest list upload karna hai", "Sabko WhatsApp bhej do", "Kitne guests confirm hain?"],
        )

    @classmethod
    async def _execute_confirmed_action(cls, db: AsyncSession, user: User, pending: Dict[str, Any]) -> ConciergeChatResponse:
        act_type = pending.get("action_type")
        payload = pending.get("payload", {})
        event_id = pending.get("event_id")

        event = await EventService.get_event_by_id(db, event_id)
        if not event or event.user_id != user.id:
            return ConciergeChatResponse(
                reply_text="Event authorization failed for confirmed action.",
                intent=ConciergeIntent.CANCEL_ACTION,
            )

        if act_type == ConciergeActionType.SEND_BROADCAST_CAMPAIGN:
            audience = payload.get("audience", "ALL")
            guest_ids = payload.get("guest_ids", [])
            camp_name = payload.get("campaign_name", "AI Concierge Broadcast")

            campaign = await CampaignService.create_broadcast_campaign(
                db=db,
                event_id=event.id,
                user_id=user.id,
                channels=["WHATSAPP"],
                title=camp_name,
                guest_ids=guest_ids if audience == "PENDING_RSVP" else None,
                target_audience=audience,
            )

            cls.pop_pending_action(pending["action_id"])

            return ConciergeChatResponse(
                reply_text=f"🚀 **सफलतापूर्वक प्रेषित!** {campaign.total_recipients} मेहमानों को WhatsApp निमंत्रण संदेश कतार में जोड़ दिया गया है.",
                intent=ConciergeIntent.CONFIRM_ACTION,
                action_executed=True,
                execution_result={
                    "campaign_id": campaign.id,
                    "total_recipients": campaign.total_recipients,
                    "status": campaign.status.value,
                },
                ui_navigation={"tab": "delivery", "event_id": event.id},
                suggested_actions=["Delivery status dekhein", "Kitne guests confirm hain?", "Dashboard par jayein"],
            )

        return ConciergeChatResponse(
            reply_text="Action executed successfully.",
            intent=ConciergeIntent.CONFIRM_ACTION,
            action_executed=True,
        )


concierge_service = ConciergeService()
