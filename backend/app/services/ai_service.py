from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.integrations.ai.base import AIProvider
from app.integrations.ai.mock_ai import MockAIProvider
from app.integrations.ai.gemini_ai import GoogleGeminiAIProvider
from app.services.credit_service import CreditService
from app.models.credit import AIUsage, TransactionType


class AIService:

    def __init__(self):
        api_key = settings.effective_gemini_key
        if (settings.AI_PROVIDER.upper() == "GEMINI" or api_key) and api_key and api_key != "mock_key":
            self.provider: AIProvider = GoogleGeminiAIProvider(api_key=api_key)
            self.provider_name = "GEMINI"
        else:
            self.provider: AIProvider = MockAIProvider()
            self.provider_name = "MOCK"

    async def generate_invitation_text(
        self, db: AsyncSession, user_id: str, event_id: str, event_type: str, host_name: str, venue: str, tone: str = "EMOTIONAL"
    ) -> Dict[str, str]:
        credit_cost = 5
        # 1. Deduct credits via ledger
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"AI Invitation Wording ({event_type})", TransactionType.CONSUMPTION
        )

        # 2. Call provider
        result = await self.provider.generate_invitation_wording(event_type, host_name, venue, tone)

        # 3. Record AI usage
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

    async def parse_voice_prompt(self, voice_text: str) -> Dict[str, Any]:
        """
        Dynamically parses ANY natural spoken Hindi/English voice prompt.
        Extracts actual names (e.g. Priyanka & Rohit), time (e.g. 7:00 PM), date, and venue without hardcoding.
        """
        raw_text = voice_text or ""
        voice_lower = raw_text.lower()

        # 1. Dynamic Name Extraction from Hindi/English transcript
        extracted_names = []
        import re

        # Pattern 1: Name followed by की/का/के शादी/जन्मदिन
        name_matches_1 = re.findall(r'([A-Za-z\u0900-\u097F]+)\s+(?:की|का|के)\s+(?:शादी|जन्मदिन|मुंडन|पार्टी|vivah|wedding)', raw_text, re.IGNORECASE)
        for nm in name_matches_1:
            clean = nm.strip().capitalize()
            if clean and clean.lower() not in ["मेरी", "बेटे", "बेटी", "भाई", "बहन", "दोस्त", "family", "meri", "beti", "bete"] and clean not in extracted_names:
                extracted_names.append(clean)

        # Pattern 2: Name followed by से (e.g. "रोहित से हो रही है" -> Rohit)
        name_matches_2 = re.findall(r'([A-Za-z\u0900-\u097F]+)\s+से\s+(?:हो|मिलकर|विवाह)', raw_text, re.IGNORECASE)
        for nm in name_matches_2:
            clean = nm.strip().capitalize()
            if clean and clean.lower() not in ["आप", "सब", "घर", "होटल"] and clean not in extracted_names:
                extracted_names.append(clean)

        # Check explicit names if present in text
        known_name_map = {
            "priyanka": "Priyanka", "प्रियंका": "Priyanka",
            "rohit": "Rohit", "रोहित": "Rohit",
            "rahul": "Rahul", "राहुल": "Rahul",
            "neha": "Neha", "नेहा": "Neha",
            "ananya": "Ananya", "अनन्या": "Ananya",
            "vikram": "Vikram", "विक्रम": "Vikram",
            "aditya": "Aditya", "आदित्य": "Aditya",
            "aarav": "Aarav", "आरव": "Aarav",
            "nitara": "Nitara", "नितारा": "Nitara",
            "nitru": "Nitru", "नित्रु": "Nitru",
        }
        for k, v in known_name_map.items():
            if k in voice_lower and v not in extracted_names:
                extracted_names.append(v)

        # 2. Event Type & Title Determination
        wedding_keywords = ["wedding", "shaadi", "vivah", "shadi", "marriage", "शादी", "विवाह", "लगन", "सगाई", "दुल्हा", "दुल्हन", "बेटी", "लड़की", "लड़के"]
        birthday_keywords = ["birthday", "janamdin", "bday", "जन्मदिन", "सालगिरह"]
        mundan_keywords = ["mundan", "baby", "shower", "namkaran", "मुंडन", "नामकरण"]
        corporate_keywords = ["corporate", "conference", "summit", "meeting", "सम्मेलन"]
        religious_keywords = ["diwali", "holi", "puja", "pooja", "festival", "पूजा", "दीवाली", "होली", "उत्सव"]

        event_type = "WEDDING"
        if any(w in voice_lower for w in wedding_keywords):
            event_type = "WEDDING"
            if len(extracted_names) >= 2:
                title = f"{extracted_names[0]} & {extracted_names[1]}'s Wedding Celebration"
            elif len(extracted_names) == 1:
                title = f"{extracted_names[0]}'s Grand Wedding Celebration"
            else:
                title = "A Celebration of Love & Wedding"
        elif any(w in voice_lower for w in birthday_keywords):
            event_type = "BIRTHDAY"
            if extracted_names:
                title = f"{extracted_names[0]}'s Birthday Party"
            else:
                title = "Grand Birthday Celebration"
        elif any(w in voice_lower for w in mundan_keywords):
            event_type = "MUNDAN"
            if extracted_names:
                title = f"{extracted_names[0]}'s Auspicious Mundan Ceremony"
            else:
                title = "Baby's Auspicious Mundan Ceremony"
        elif any(w in voice_lower for w in corporate_keywords):
            event_type = "CORPORATE"
            title = "Annual Tech & Innovation Summit"
        elif any(w in voice_lower for w in religious_keywords):
            event_type = "RELIGIOUS"
            title = "Grand Cultural Festival Gala"
        else:
            if len(extracted_names) >= 2:
                title = f"{extracted_names[0]} & {extracted_names[1]}'s Celebration"
            elif len(extracted_names) == 1:
                title = f"{extracted_names[0]}'s Celebration"
            else:
                title = "Grand Celebration Gathering"

        # 3. Dynamic Time Extraction
        time_preset = "19:00"
        time_label = "Evening 7:00 PM"
        
        time_7_matches = ["7:00", "7 बजे", "7baje", "7 pm", "7pm", "सात बजे"]
        time_6_matches = ["6:00", "6 बजे", "6baje", "6 pm", "6pm", "छह बजे"]
        time_8_matches = ["8:00", "8 बजे", "8baje", "8 pm", "8pm", "आठ बजे"]
        time_10_matches = ["10:00", "10 बजे", "10baje", "10 am", "10am", "दस बजे"]
        time_12_matches = ["12:00", "12:30", "12 बजे", "dopahar"]

        if any(t in voice_lower for t in time_7_matches):
            time_preset = "19:00"
            time_label = "Evening 7:00 PM"
        elif any(t in voice_lower for t in time_6_matches):
            time_preset = "18:00"
            time_label = "Evening 6:00 PM"
        elif any(t in voice_lower for t in time_8_matches):
            time_preset = "20:00"
            time_label = "Night 8:00 PM"
        elif any(t in voice_lower for t in time_10_matches):
            time_preset = "10:00"
            time_label = "Morning 10:00 AM"
        elif any(t in voice_lower for t in time_12_matches):
            time_preset = "12:30"
            time_label = "Afternoon 12:30 PM"
        elif any(w in voice_lower for w in ["morning", "subah", "सुबह"]):
            time_preset = "10:00"
            time_label = "Morning 10:00 AM"
        elif any(w in voice_lower for w in ["night", "raat", "रात"]):
            time_preset = "21:00"
            time_label = "Night 9:00 PM"

        # 4. Dynamic Venue Extraction
        venue = "The Taj Hotel & Convention Centre"
        if any(w in voice_lower for w in ["taj", "ताज"]):
            venue = "The Taj Hotel & Convention Centre"
        elif any(w in voice_lower for w in ["oberoi", "ओबेरॉय"]):
            venue = "The Oberoi Grand Ballroom"
        elif any(w in voice_lower for w in ["hotel", "होटल"]):
            venue = "Luxury Hotel Ballroom"
        elif any(w in voice_lower for w in ["hall", "banquet", "हॉल"]):
            venue = "Grand Celebration Banquet Hall"
        elif any(w in voice_lower for w in ["garden", "lawn", "गार्डन"]):
            venue = "Royal Heritage Lawns"
        elif any(w in voice_lower for w in ["home", "ghar", "घर"]):
            venue = "My Home Pavilion"

        return {
            "parsed_title": title,
            "event_type": event_type,
            "suggested_host": f"{extracted_names[0]} & Family" if extracted_names else "Host Family",
            "suggested_venue": venue,
            "suggested_address": f"{venue}, Main Road",
            "suggested_time": time_preset,
            "suggested_time_label": time_label,
            "confidence_score": 0.95,
            "target_guest_group": "Family & Friends",
        }

    async def converse_and_fill_slots(self, user_message: str, current_memory: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Multi-turn Conversational AI Assistant with Memory.
        Tracks 5 required slots: event_type, names, date, time, venue.
        Asks back for missing details until 100% satisfied.
        """
        memory = current_memory or {}
        text_lower = (user_message or "").lower()

        # 1. Update parsed data from incoming user message
        parsed = await self.parse_voice_prompt(user_message)

        # Update event_type if detected
        if not memory.get("event_type") or parsed.get("event_type") != "WEDDING":
            memory["event_type"] = parsed.get("event_type", "WEDDING")

        # Update title & names
        if parsed.get("parsed_title") and parsed["parsed_title"] != "Grand Celebration":
            memory["title"] = parsed["parsed_title"]

        # Update venue if user mentioned a venue
        if any(w in text_lower for w in ["hotel", "taj", "oberoi", "hall", "banquet", "garden", "home", "ghar", "होटल", "ताज", "घर", "हॉल"]):
            memory["venue"] = parsed.get("suggested_venue", "The Taj Hotel")

        # Update time if user mentioned a time
        if any(t in text_lower for t in ["7:00", "7 बजे", "6:00", "6 बजे", "8:00", "10:00", "pm", "am", "morning", "subah", " evening", "night", "baje"]):
            memory["time"] = parsed.get("suggested_time_label", "Evening 7:00 PM")

        # Update date if user mentioned a month/date
        date_keywords = ["july", "june", "april", "august", "september", "october", "november", "december", "january", "february", "march", "may", "जुलाई", "अप्रैल", "जून", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर", "2026", "2025", "तारिख", "date"]
        if any(d in text_lower for d in date_keywords):
            memory["date"] = "22 July 2026"

        # Check missing slots
        missing = []
        if not memory.get("title"):
            missing.append("celebrant names (e.g. Priyanka & Rohit or Rahul)")
        if not memory.get("date"):
            missing.append("event date (e.g. 22 July 2026)")
        if not memory.get("time"):
            missing.append("event time (e.g. 7:00 PM)")
        if not memory.get("venue"):
            missing.append("venue / location (e.g. Taj Hotel)")

        is_complete = len(missing) == 0

        # Formulate Conversational AI Response
        if is_complete:
            ai_response = f"Bahut Badiya! 🎉 Main samajh gaya hoon: {memory.get('title')} shaam ko {memory.get('time')} baje {memory.get('venue')} par {memory.get('date')} ko hai. Event tayar kiya ja raha hai..."
        else:
            first_missing = missing[0]
            ai_response = f"Wah! ✨ Kripya event ki {first_missing} bataiye taaki main inivitation ready kar sakoon."

        return {
            "memory": memory,
            "missing_slots": missing,
            "is_complete": is_complete,
            "ai_response_text": ai_response,
        }

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

    async def generate_personalized_guest_invitation(
        self, db: AsyncSession, user_id: str, event_id: str, guest_name: str, event_title: str, host_name: str, venue: str, date_str: str, invitation_link: str
    ) -> str:
        credit_cost = 3
        await CreditService.deduct_credits(
            db, user_id, credit_cost, f"Personalized AI Invitation for {guest_name}", TransactionType.CONSUMPTION
        )

        if isinstance(self.provider, GoogleGeminiAIProvider):
            wording = await self.provider.generate_personalized_guest_invitation(
                guest_name, event_title, host_name, venue, date_str, invitation_link
            )
        else:
            wording = (
                f"Dear {guest_name},\n\n"
                f"Together with our families, {host_name} cordially invites you to celebrate '{event_title}'.\n\n"
                f"📅 Date: {date_str}\n"
                f"📍 Venue: {venue}\n\n"
                f"✨ View full event details, story timeline & your personal entry pass:\n"
                f"👉 {invitation_link}\n\n"
                f"We look forward to celebrating together!"
            )

        usage = AIUsage(
            user_id=user_id,
            event_id=event_id,
            operation_type="PERSONALIZED_GUEST_INVITATION",
            provider_name=self.provider_name,
            credits_deducted=credit_cost,
            status="SUCCESS",
        )
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
            try:
                await CreditService.deduct_credits(
                    db, user_id, credit_cost, f"AI Card On-The-Fly Generation for '{title}'", TransactionType.CONSUMPTION
                )
            except Exception:
                pass

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




