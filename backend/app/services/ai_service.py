from typing import Dict, Any, List, Optional
import re
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.integrations.ai.base import AIProvider
from app.integrations.ai.mock_ai import MockAIProvider
from app.integrations.ai.gemini_ai import GoogleGeminiAIProvider
from app.services.credit_service import CreditService
from app.services.langgraph_service import langgraph_event_service, LangGraphEventService
from app.schemas.ai import EventContext, StructuredInvitationOutput, ConversationTurnResponse
from app.schemas.invitation_content import CanonicalInvitationContent
from app.models.credit import AIUsage, TransactionType
from app.models.event import Event


class AIService:
    """
    Unified Nimantran AI Brain:
    Coordinates LangGraph Conversation Engine, Gemini Generation Engine,
    and EventContext validation layer.
    """

    def __init__(self):
        api_key = settings.effective_gemini_key
        model_name = settings.effective_ai_model
        if (settings.AI_PROVIDER.upper() == "GEMINI" or api_key) and api_key and api_key != "mock_key":
            self.provider: AIProvider = GoogleGeminiAIProvider(api_key=api_key, model_name=model_name)
            self.provider_name = "GEMINI"
        else:
            self.provider: AIProvider = MockAIProvider()
            self.provider_name = "MOCK"

        self.langgraph = langgraph_event_service

    # =========================================================================
    # 1. CONVERSATION ENGINE (LangGraph State Machine)
    # =========================================================================
    async def process_conversation_turn(
        self, thread_id: str, user_message: str, current_context: Optional[EventContext] = None
    ) -> ConversationTurnResponse:
        """
        Processes a conversation turn using LangGraph with conversational memory,
        entity extraction, slot resolution, and correction handling.
        """
        state = await self.langgraph.process_user_turn(
            thread_id=thread_id,
            user_message=user_message,
            existing_context=current_context,
        )

        event_ctx = self.langgraph.to_event_context(state)
        is_complete = state.get("is_complete", False)
        missing_slots = state.get("missing_slots", [])
        reply = state.get("ai_response_text", "")
        detected_lang = state.get("detected_language", "HINGLISH")

        action = "READY_FOR_GENERATION" if is_complete else "CONTINUE_CONVERSATION"

        return ConversationTurnResponse(
            thread_id=thread_id,
            reply=reply,
            event_context=event_ctx,
            is_complete=is_complete,
            missing_slots=missing_slots,
            detected_language=detected_lang,
            suggested_action=action,
        )

    async def converse_and_fill_slots(
        self, user_message: str, current_memory: Optional[Dict[str, Any]] = None, thread_id: str = "default_thread"
    ) -> Dict[str, Any]:
        """
        Backward compatible slot filler delegating to the unified LangGraph engine.
        """
        existing_ctx = None
        if current_memory:
            existing_ctx = EventContext(
                event_type=current_memory.get("event_type"),
                title=current_memory.get("title"),
                celebrant_name=current_memory.get("celebrant_name"),
                host_name=current_memory.get("host_name"),
                date=current_memory.get("date"),
                time=current_memory.get("time"),
                venue=current_memory.get("venue"),
                address=current_memory.get("address"),
            )

        resp = await self.process_conversation_turn(
            thread_id=thread_id,
            user_message=user_message,
            current_context=existing_ctx,
        )

        memory = {
            "event_type": resp.event_context.event_type or "WEDDING",
            "title": resp.event_context.title,
            "celebrant_name": resp.event_context.celebrant_name,
            "host_name": resp.event_context.host_name,
            "date": resp.event_context.date,
            "time": resp.event_context.time,
            "venue": resp.event_context.venue,
            "address": resp.event_context.address,
        }

        return {
            "memory": memory,
            "missing_slots": resp.missing_slots,
            "is_complete": resp.is_complete,
            "ai_response_text": resp.reply,
        }

    async def parse_voice_prompt(self, voice_text: str) -> Dict[str, Any]:
        """
        Parses natural spoken voice prompt into initial event draft slots without hallucination.
        """
        res = await self.langgraph.process_user_turn(
            thread_id=f"voice_prompt_{hash(voice_text)}",
            user_message=voice_text,
        )
        ctx = self.langgraph.to_event_context(res)

        return {
            "parsed_title": ctx.title or "Celebration Gathering",
            "event_type": ctx.event_type or "WEDDING",
            "suggested_host": ctx.host_name or "Host Family",
            "suggested_venue": ctx.venue or "Celebration Venue",
            "suggested_address": ctx.address or (f"{ctx.venue}, Main Road" if ctx.venue else "Celebration Venue, Main Road"),
            "suggested_time": "19:00",
            "suggested_time_label": ctx.time or "Evening 7:00 PM",
            "confidence_score": 0.95,
            "target_guest_group": "Family & Friends",
        }

    # =========================================================================
    # 2. GENERATION ENGINE (Gemini Grounded Copywriting)
    # =========================================================================
    async def generate_invitation_from_context(
        self,
        db: AsyncSession,
        user_id: str,
        event_id: str,
        context: EventContext,
    ) -> StructuredInvitationOutput:
        """
        Generates validated, culturally grounded invitation wording strictly from EventContext.
        """
        credit_cost = 5
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Structured Invitation ({context.event_type or 'Event'})", TransactionType.CONSUMPTION
        )

        event_type = context.event_type or "WEDDING"
        host_name = context.host_name or "Host Family"
        venue = context.venue or "Celebration Venue"
        date_str = context.date or "Date to be Announced"

        extra_info = {
            "title": context.title,
            "celebrant_name": context.celebrant_name,
            "time": context.time,
            "address": context.address,
            "functions": context.functions,
        }

        raw_result = await self.provider.generate_structured_invitation(
            event_type=event_type,
            host_name=host_name,
            venue=venue,
            date_str=date_str,
            tone=context.tone,
            language=context.language,
            style=context.style,
            extra_context=extra_info,
        )

        # Validate result against schema with safe fallback
        try:
            invitation = StructuredInvitationOutput(
                title=raw_result.get("title") or context.title or f"{event_type.title()} Celebration",
                greeting=raw_result.get("greeting") or "Dear Valued Guests,",
                intro=raw_result.get("intro") or f"With immense joy and gratitude, {host_name} cordially invites you.",
                main_message=raw_result.get("main_message") or raw_result.get("message_text") or "Please join us to celebrate this auspicious milestone.",
                event_details={
                    "date": date_str,
                    "time": context.time or "Evening 7:00 PM",
                    "venue": venue,
                    "address": context.address or venue,
                },
                host_message=raw_result.get("host_message") or f"Warm regards from {host_name}",
                closing=raw_result.get("closing") or "We eagerly look forward to welcoming you.",
                language=raw_result.get("language") or context.language,
                tone=raw_result.get("tone") or context.tone,
                style=raw_result.get("style") or context.style,
                shloka_header=raw_result.get("shloka_header"),
                bilingual_english=raw_result.get("bilingual_english"),
                bilingual_hindi=raw_result.get("bilingual_hindi"),
            )
        except Exception:
            # Deterministic safe fallback
            invitation = StructuredInvitationOutput(
                title=context.title or f"{event_type.title()} Celebration",
                greeting="Dear Guest & Family,",
                intro=f"Together with our family, {host_name} warmly invites you to celebrate with us.",
                main_message=f"We request the pleasure of your company on the auspicious occasion of {context.title or event_type.title()}.",
                event_details={
                    "date": date_str,
                    "time": context.time or "7:00 PM",
                    "venue": venue,
                    "address": context.address or venue,
                },
                host_message=f"Best compliments from {host_name} and family.",
                closing="Warmest Regards & Blessings",
                language=context.language,
                tone=context.tone,
                style=context.style,
            )

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="STRUCTURED_INVITATION",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()

        return invitation

    async def get_or_generate_canonical_invitation(
        self,
        event: Event,
        ai_content: Optional[Dict[str, Any]] = None,
        db: Optional[AsyncSession] = None,
        user_id: Optional[str] = None,
        language: str = "HINGLISH",
        tone: str = "WARM",
    ) -> CanonicalInvitationContent:
        """
        Retrieves or generates a CanonicalInvitationContent schema for an event.
        Guarantees that all channels (Web, WhatsApp, SMS, Email, QR Pass, Public Page)
        consume identical factual ground truth without conflicting details.
        """
        existing_ai = (event.theme_config or {}).get("canonical_invitation") if event.theme_config else None
        
        if ai_content:
            merged_ai = {**(existing_ai or {}), **ai_content}
        elif existing_ai:
            merged_ai = existing_ai
        else:
            # Generate clean structured semantic content anchored in event ground truth
            date_str = event.start_date.strftime("%d %B %Y") if event.start_date else "Date TBA"
            try:
                raw = await self.provider.generate_structured_invitation(
                    event_type=event.event_type or "WEDDING",
                    host_name=event.host_name or "Host Family",
                    venue=event.venue_name or "Celebration Venue",
                    date_str=date_str,
                    tone=tone,
                    language=language,
                    style="MODERN_TRADITIONAL",
                    extra_context={
                        "title": event.title,
                        "co_host_name": event.co_host_name,
                        "venue_address": event.venue_address,
                    }
                )
                merged_ai = {
                    "greeting": raw.get("greeting"),
                    "message": raw.get("main_message") or raw.get("message_text"),
                    "blessing": raw.get("shloka_header") or raw.get("host_message"),
                    "closing": raw.get("closing"),
                    "language": language,
                    "tone": tone,
                }
            except Exception:
                merged_ai = {}

        canonical = CanonicalInvitationContent.from_event(
            event=event,
            ai_content=merged_ai,
            public_base_url=settings.PUBLIC_BASE_URL,
        )

        # Persist into theme_config if db session is provided
        if db and event:
            current_theme_config = dict(event.theme_config or {})
            current_theme_config["canonical_invitation"] = canonical.model_dump()
            event.theme_config = current_theme_config
            db.add(event)
            await db.commit()

        return canonical

    async def generate_invitation_text(
        self, db: AsyncSession, user_id: str, event_id: str, event_type: str, host_name: str, venue: str, tone: str = "EMOTIONAL"
    ) -> Dict[str, str]:
        credit_cost = 5
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Invitation Wording ({event_type})", TransactionType.CONSUMPTION
        )

        result = await self.provider.generate_invitation_wording(event_type, host_name, venue, tone)

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="INVITATION_TEXT",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return result

    async def generate_welcome_quote(
        self, db: AsyncSession, user_id: str, event_id: str, guest_name: str, relationship: str, event_type: str
    ) -> str:
        credit_cost = 2
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Welcome Quote for {guest_name}", TransactionType.CONSUMPTION
        )

        quote = await self.provider.generate_welcome_quote(guest_name, relationship, event_type)

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="WELCOME_QUOTE",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return quote

    async def generate_memory_stories(
        self, db: AsyncSession, user_id: str, event_id: str, event_type: str, host_name: str, milestones: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        credit_cost = 4
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Memory Story Generation ({event_type})", TransactionType.CONSUMPTION
        )

        if isinstance(self.provider, GoogleGeminiAIProvider):
            stories = await self.provider.generate_memory_stories(event_type, host_name, milestones)
        else:
            stories = [
                {
                    "title": m.get("title", "Milestone"),
                    "date": m.get("date", ""),
                    "story": f"A precious moment captured during {m.get('title')} on {m.get('date')}. Cherished forever with warmth and love."
                }
                for m in milestones
            ]

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="MEMORY_STORIES",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return stories

    async def generate_celebration_story(
        self,
        db: AsyncSession,
        user_id: str,
        event_id: str,
        event_facts: Dict[str, Any],
        approved_wishes: List[Dict[str, Any]],
        approved_memories: List[Dict[str, Any]],
        attendance_summary: Dict[str, Any],
        style: str = "EMOTIONAL_ROYAL",
    ) -> Dict[str, Any]:
        credit_cost = 5
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Celebration Story Generation ({event_facts.get('event_type', 'EVENT')})", TransactionType.CONSUMPTION
        )

        story_result = await self.provider.generate_celebration_story(
            event_facts, approved_wishes, approved_memories, attendance_summary, style
        )

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="CELEBRATION_STORY",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return story_result

    async def generate_memory_caption(
        self,
        db: AsyncSession,
        user_id: str,
        event_id: str,
        event_type: str,
        milestone_or_tag: str = "Celebration Moment",
        guest_name: Optional[str] = None,
    ) -> Dict[str, str]:
        credit_cost = 1
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Memory Caption Generation", TransactionType.CONSUMPTION
        )

        caption_result = await self.provider.generate_memory_caption(
            event_type, milestone_or_tag, guest_name
        )

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="MEMORY_CAPTION",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return caption_result

    async def generate_attendance_thank_you(
        self,
        db: AsyncSession,
        user_id: str,
        event_id: str,
        event_facts: Dict[str, Any],
        attendance_summary: Dict[str, Any],
    ) -> Dict[str, str]:
        credit_cost = 2
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Attendance Thank-You Note", TransactionType.CONSUMPTION
        )

        thank_you_res = await self.provider.generate_attendance_thank_you(event_facts, attendance_summary)

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="ATTENDANCE_THANK_YOU",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return thank_you_res

    async def generate_structured_invitation(
        self,
        db: AsyncSession,
        user_id: str,
        event_id: str,
        event_type: str,
        host_name: str,
        venue: str,
        date_str: str = "",
        tone: str = "EMOTIONAL",
        language: str = "HI_EN",
        style: str = "Traditional Indian",
        extra_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        credit_cost = 5
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Structured Invitation ({event_type})", TransactionType.CONSUMPTION
        )

        result = await self.provider.generate_structured_invitation(
            event_type=event_type,
            host_name=host_name,
            venue=venue,
            date_str=date_str,
            tone=tone,
            language=language,
            style=style,
            extra_context=extra_context,
        )

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="STRUCTURED_INVITATION",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return result

    async def improve_or_rewrite_invitation(
        self,
        db: AsyncSession,
        user_id: str,
        event_id: str,
        original_text: str,
        instruction: str,
        target_tone: Optional[str] = None,
        target_language: Optional[str] = None,
    ) -> Dict[str, str]:
        credit_cost = 3
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Invitation Polish / Rewrite", TransactionType.CONSUMPTION
        )

        result = await self.provider.improve_or_rewrite_invitation(
            original_text=original_text,
            instruction=instruction,
            target_tone=target_tone,
            target_language=target_language,
        )

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="INVITATION_REWRITE",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return result

    async def chat_assistant(
        self,
        db: Optional[AsyncSession],
        user_id: Optional[str],
        messages: List[Dict[str, str]],
        context: Optional[Dict[str, Any]] = None,
        event_id: Optional[str] = None,
    ) -> str:
        credit_cost = 1
        if db and user_id:
            await CreditService.deduct_credits(
                db, user_id, credit_cost, "Nimantran AI Chatbot Assistant", TransactionType.CONSUMPTION
            )

        reply = await self.provider.chat_invitation_assistant(messages=messages, context=context)

        if db and user_id:
            usage = AIUsage(
                user_id=user_id,
                event_id=event_id,
                operation_type="CHATBOT_ASSISTANT",
                provider_name=self.provider_name,
                credits_deducted=credit_cost,
                status="SUCCESS",
            )
            db.add(usage)
            await db.commit()

        return reply

    async def generate_personalized_guest_invitation(
        self,
        db: AsyncSession,
        user_id: str,
        event_id: str,
        guest_name: str,
        event_title: str,
        host_name: str,
        venue: str,
        date_str: str,
        invitation_link: str,
        relationship: str = "",
        tone: str = "WARM",
        language: str = "HI_EN",
    ) -> str:
        credit_cost = 3
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"Personalized AI Invitation for {guest_name}", TransactionType.CONSUMPTION
        )

        wording = await self.provider.generate_personalized_guest_invitation(
            guest_name=guest_name,
            event_title=event_title,
            host_name=host_name,
            venue=venue,
            date_str=date_str,
            invitation_link=invitation_link,
            relationship=relationship,
            tone=tone,
            language=language,
        )

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="PERSONALIZED_GUEST_INVITATION",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return wording

    async def generate_bilingual_invitation_card(
        self, db: AsyncSession, user_id: str, event_id: str, guest_name: str, event_title: str, host_name: str, venue: str, date_str: str, invitation_link: str
    ) -> Dict[str, str]:
        credit_cost = 3
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"Personalized Bilingual AI Card for {guest_name}", TransactionType.CONSUMPTION
        )

        if isinstance(self.provider, GoogleGeminiAIProvider):
            res = await self.provider.generate_bilingual_invitation_card(
                guest_name, event_title, host_name, venue, date_str, invitation_link
            )
        else:
            hindi = f"|| श्री गणेशाय नमः ||\n\nसपरिवार सादर निमंत्रण\n\nप्रिय {guest_name} जी,\n{host_name} परिवार की ओर से ' {event_title} ' के पावन अवसर पर आपकी गरिमामयी उपस्थिति सहर्ष प्रार्थनीय है।\n\nदिनांक: {date_str}\nस्थान: {venue}"
            english = f"Dear {guest_name},\n\nTogether with their families, {host_name} cordially requests your gracious presence to celebrate '{event_title}'.\n\nDate: {date_str}\nVenue: {venue}"
            full = f"{hindi}\n\n───────────────────────\n\n{english}\n\n✨ Explore More → {invitation_link}"
            res = {
                "hindi_text": hindi,
                "english_text": english,
                "full_bilingual": full
            }

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="BILINGUAL_GUEST_INVITATION",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
        db.add(usage)
        await db.commit()
        return res

    async def generate_event_ai_card(
        self, db: AsyncSession, user_id: Optional[str], event_id: str, event_type: str, title: str, host_name: str, venue: str, date_str: str
    ) -> Dict[str, Any]:
        credit_cost = 4
        if user_id:
            await CreditService.deduct_credits(
                db, user_id, credit_cost, f"AI Card On-The-Fly Generation for '{title}'", TransactionType.CONSUMPTION
            )

        card_data = await self.provider.generate_ai_card_on_the_fly(
            event_type=event_type,
            title=title,
            host_name=host_name,
            venue=venue,
            date_str=date_str,
        )

        if user_id:
            usage = AIUsage(
                user_id=user_id,
                event_id=event_id,
                operation_type="AI_CARD_ON_THE_FLY",
                provider_name=self.provider_name,
                credits_deducted=credit_cost,
                status="SUCCESS",
            )
            db.add(usage)
            await db.commit()

        return card_data


ai_service = AIService()
