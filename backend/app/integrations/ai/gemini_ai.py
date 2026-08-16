import json
import logging
import httpx
from typing import Dict, Any, Optional, List
from app.integrations.ai.base import AIProvider
from app.integrations.ai.mock_ai import MockAIProvider

logger = logging.getLogger("nimantran_ai")


class GoogleGeminiAIProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.mock_fallback = MockAIProvider()
        self.endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    async def _call_gemini_raw(self, prompt: str) -> Optional[str]:
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 800,
            }
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    self.endpoint_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
                logger.warning(f"[GEMINI AI] Non-200 response ({response.status_code}): {response.text}")
        except Exception as e:
            logger.error(f"[GEMINI AI] Request exception: {e}")
        return None

    async def generate_invitation_wording(
        self, event_type: str, host_name: str, venue: str, tone: str = "EMOTIONAL", language: str = "HI_EN"
    ) -> Dict[str, str]:
        prompt = f"""
        You are an elite Indian invitation copywriter. Generate structured invitation text for a {event_type} celebration hosted by {host_name} at {venue}.
        Tone: {tone}. Language preference: {language}.
        Respond strictly in JSON format with two keys:
        "title_text": Short elegant main invitation title.
        "message_text": Warm, emotional 2-3 sentence invitation message with family sentiments and RSVP call.
        Do NOT wrap in markdown formatting or codeblocks. Output plain raw JSON string.
        """
        raw_text = await self._call_gemini_raw(prompt)
        if raw_text:
            try:
                cleaned = raw_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                data = json.loads(cleaned)
                if "title_text" in data and "message_text" in data:
                    return data
            except Exception as parse_err:
                logger.error(f"[GEMINI AI] JSON parse error: {parse_err}. Raw text: {raw_text}")

        return await self.mock_fallback.generate_invitation_wording(event_type, host_name, venue, tone, language)

    async def generate_welcome_quote(
        self, guest_name: str, relationship: str, event_type: str, tone: str = "WARM"
    ) -> str:
        prompt = f"""
        Generate a personalized 1-sentence welcome quote for guest '{guest_name}' (Relationship: {relationship}) attending a {event_type}. Tone: {tone}.
        Keep it under 20 words, culturally warm (Hinglish/English), perfect for display on a smart reception TV welcome screen.
        Return ONLY the quote text without quotes.
        """
        quote = await self._call_gemini_raw(prompt)
        if quote:
            return quote.replace('"', '').strip()
        return await self.mock_fallback.generate_welcome_quote(guest_name, relationship, event_type, tone)

    async def generate_our_story(
        self, prompt_info: str, style: str = "ROMANTIC"
    ) -> Dict[str, Any]:
        prompt = f"""
        Create a 3-milestone celebration story timeline based on: "{prompt_info}". Style: {style}.
        Return JSON with key "milestones", which is an array of objects each having "title", "date", and "description".
        Raw JSON string only.
        """
        raw_text = await self._call_gemini_raw(prompt)
        if raw_text:
            try:
                cleaned = raw_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                return json.loads(cleaned)
            except Exception:
                pass
        return await self.mock_fallback.generate_our_story(prompt_info, style)

    async def generate_thank_you_message(
        self, guest_name: str, relationship: str, language: str = "HI"
    ) -> str:
        prompt = f"Write a sweet 2-sentence post-event thank you message to {guest_name} ({relationship}). Language: {language}."
        msg = await self._call_gemini_raw(prompt)
        if msg:
            return msg.strip()
        return await self.mock_fallback.generate_thank_you_message(guest_name, relationship, language)

    async def analyze_guest_duplicates(
        self, guest_list: list
    ) -> list:
        return await self.mock_fallback.analyze_guest_duplicates(guest_list)

    async def generate_memory_stories(
        self, event_type: str, host_name: str, milestones: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        milestone_descriptions = ", ".join([f"{m.get('title')} ({m.get('date', 'Date N/A')})" for m in milestones])
        prompt = f"""
        You are a deeply emotional, poetic Indian storyteller for a {event_type} celebration hosted by '{host_name}'.
        Generate attractive, high-gravity bilingual memory story captions (Hindi First in Devanagari script + English Second underneath) for each milestone:
        {milestone_descriptions}

        Requirements for story captions:
        - Top Half: Deeply emotional, respectful Hindi text in Devanagari script (वात्सल्य, अटूट स्नेह, पारिवारिक आशीर्वाद).
        - Bottom Half: Corresponding dignified English story.

        Respond strictly in raw JSON format with key "memories", an array of objects matching the input milestones in order. Each object must contain:
        - "title": milestone title
        - "date": milestone date string
        - "hindi_story": poetic Hindi story text
        - "english_story": elegant English story text
        - "story": combined bilingual string formatted as:
          (Hindi Story Text)

          ───────────────────────

          (English Story Text)

        Raw JSON string only, no markdown formatting.
        """
        raw_text = await self._call_gemini_raw(prompt)
        if raw_text:
            try:
                cleaned = raw_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                data = json.loads(cleaned)
                if "memories" in data and isinstance(data["memories"], list):
                    return data["memories"]
            except Exception as e:
                logger.error(f"[GEMINI AI] memory stories parse error: {e}")

        # Fallback default bilingual stories with event-type specific sentiment
        results = []
        evt_upper = (event_type or "").upper()
        for m in milestones:
            title = m.get("title", "Cherished Milestone")
            date_str = m.get("date", "")
            if "MUNDAN" in evt_upper or "BABY" in evt_upper or "NAMAKARAN" in evt_upper:
                hindi = f"नन्हे बालक की मुस्कान और '|| बालार्क तेजस्वी भव ||' के आशीर्वाद के साथ, '{title}' ({date_str}) का यह वात्सल्यपूर्ण क्षण हमारे पूरे परिवार के लिए अटूट स्मृति बन गया।"
                english = f"Surrounded by affection and divine warmth, '{title}' on {date_str} became a golden memory in our child's life journey."
            elif "BIRTHDAY" in evt_upper:
                hindi = f"उमंग, हंसी और स्नेहमयी यादों से परिपूर्ण, '{title}' ({date_str}) का यह खास दिन जीवन की सुंदरतम उपलब्धियों और खुशियों की नई शुरुआत प्रस्तुत करता है।"
                english = f"Filled with laughter and wonderful memories, '{title}' on {date_str} marks a beautiful chapter of growth, dreams, and joyful celebrations."
            elif "HOUSEWARMING" in evt_upper or "GRIHA" in evt_upper:
                hindi = f"गृह प्रवेश के इस मांगलिक अवसर पर '{title}' ({date_str}) से हमारे घर में सुख, शांति और समृद्धि की मंगल धारा प्रवाहित हुई। अपनों की उपस्थिति से यह प्रांगण निखर उठा।"
                english = f"Blessing our home with warmth and peace, '{title}' on {date_str} brought together family and loved ones to celebrate this new sanctuary."
            elif "CORPORATE" in evt_upper or "LAUNCH" in evt_upper or "GALA" in evt_upper:
                hindi = f"विज़न, नेतृत्व और उत्कृष्टता के मार्ग पर '{title}' ({date_str}) ने सफलता का नया मील का पत्थर स्थापित किया। हमारी इस ऐतिहासिक यात्रा में आपका योगदान अतुलनीय है।"
                english = f"Driven by vision and excellence, '{title}' on {date_str} marks a major milestone in our corporate journey, celebrating innovation and shared triumph."
            elif "PUJA" in evt_upper or "FESTIVAL" in evt_upper or "RELIGIOUS" in evt_upper:
                hindi = f"|| ॐ नमः शिवाय || ईश्वर के दिव्य अनुग्रह और वैदिक मंत्रोच्चार के बीच '{title}' ({date_str}) का यह धार्मिक अनुष्ठान हमें असीम शांति और आत्मिक ऊर्जा से भर देता है।"
                english = f"Immersed in holy chants and spiritual devotion, '{title}' on {date_str} filled our home with divine grace, peace, and eternal blessings."
            elif "RETIREMENT" in evt_upper or "FAREWELL" in evt_upper:
                hindi = f"दशकों की निष्ठा, नेतृत्व और प्रेरणादायी सेवा के साथ '{title}' ({date_str}) का यह क्षण सम्मान और गर्व से भरा हुआ है। आपके स्वर्णिम भविष्य हेतु ढेरों शुभकामनाएं!"
                english = f"Honoring decades of dedication and inspiring leadership, '{title}' on {date_str} celebrates a magnificent legacy and a golden new beginning."
            else: # Wedding / Marriage / Anniversary
                hindi = f"जीवन के इस पावन मोड़ पर '{title}' ({date_str}) का यह मंगलमय क्षण हमारे दिलों में सदा के लिए अंकित हो गया। अपनों के अपार स्नेह और ईश्वर के दिव्य आशीर्वाद से परिपूर्ण यह यात्रा अनवरत जारी है।"
                english = f"On this sacred juncture of life, '{title}' on {date_str} became an eternal memory. Surrounded by family love and divine grace, our journey continues with warmth."

            results.append({
                "title": title,
                "date": date_str,
                "hindi_story": hindi,
                "english_story": english,
                "story": f"{hindi}\n\n───────────────────────\n\n{english}"
            })
        return results


    async def generate_bilingual_invitation_card(
        self, guest_name: str, event_title: str, host_name: str, venue: str, date_str: str, invitation_link: str
    ) -> Dict[str, str]:
        prompt = f"""
        Generate a structured bilingual (Hindi First + English Second) Indian celebration invitation message for '{guest_name}' for '{event_title}' hosted by '{host_name}'.
        Venue: {venue}, Date: {date_str}. Webpage Link: {invitation_link}

        Respond in raw JSON format with keys:
        - "hindi_text": Traditional auspicious Hindi invitation starting with '|| श्री गणेशाय नमः ||' and 'सपरिवार सादर निमंत्रण'
        - "english_text": Gracious English invitation starting with 'Together with their families...'
        - "full_bilingual": Combined text formatted as:
          [HINDI SECTION]
          || श्री गणेशाय नमः ||
          (Hindi Text)

          ───────────────────────

          [ENGLISH SECTION]
          (English Text)

          ✨ Explore More → {invitation_link}

        Raw JSON only.
        """
        raw_text = await self._call_gemini_raw(prompt)
        if raw_text:
            try:
                cleaned = raw_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                data = json.loads(cleaned)
                if "hindi_text" in data and "english_text" in data:
                    return data
            except Exception as e:
                logger.error(f"[GEMINI AI] bilingual card parse error: {e}")

        # Fallback default bilingual wording
        hindi = f"|| श्री गणेशाय नमः ||\n\nसपरिवार सादर निमंत्रण\n\nप्रिय {guest_name} जी,\n{host_name} परिवार की ओर से ' {event_title} ' के पावन अवसर पर आपकी गरिमामयी उपस्थिति सहर्ष प्रार्थनीय है।\n\nदिनांक: {date_str}\nस्थान: {venue}"
        english = f"Dear {guest_name},\n\nTogether with their families, {host_name} cordially requests your gracious presence to celebrate '{event_title}'.\n\nDate: {date_str}\nVenue: {venue}"
        full = f"{hindi}\n\n───────────────────────\n\n{english}\n\n✨ Explore More → {invitation_link}"
        
        return {
            "hindi_text": hindi,
            "english_text": english,
            "full_bilingual": full
        }

    async def generate_personalized_guest_invitation(
        self, guest_name: str, event_title: str, host_name: str, venue: str, date_str: str, invitation_link: str
    ) -> str:

        prompt = f"""
        Write a personalized WhatsApp invitation message to '{guest_name}' for '{event_title}' hosted by {host_name}.
        Venue: {venue}, Date: {date_str}.
        Include emotional warmth, emojis, and explicitly instruct them to click the digital invitation link: {invitation_link}
        Return ONLY the formatted message body.
        """
        msg = await self._call_gemini_raw(prompt)
        if msg:
            return msg.strip()
        return (
            f"Dear {guest_name},\n\n"
            f"Together with our families, {host_name} cordially invites you to celebrate '{event_title}'.\n\n"
            f"📅 Date: {date_str}\n"
            f"📍 Venue: {venue}\n\n"
            f"✨ View full event details, story timeline & your personal entry pass:\n"
            f"👉 {invitation_link}\n\n"
            f"We look forward to celebrating together!"
        )

    async def generate_ai_card_on_the_fly(
        self, event_type: str, title: str, host_name: str, venue: str, date_str: str
    ) -> Dict[str, Any]:
        prompt = f"""
        You are an elite Indian celebration designer & copywriter. Generate a dynamic, bespoke AI invitation card payload on the fly for:
        Event Type: {event_type}
        Title: {title}
        Host Name: {host_name}
        Venue: {venue}
        Date: {date_str}

        Requirements:
        1. "shloka_header": Auspicious Sanskrit shloka or heading in Devanagari (e.g. '|| श्री गणेशाय नमः ||', '|| ॐ नमः शिवाय ||', '|| सर्वमंगल मांगल्ये... ||' or bespoke for {event_type})
        2. "hindi_title": Title in Hindi Devanagari script.
        3. "hindi_invitation": Deeply emotional, respectful 2-sentence invitation in Hindi Devanagari.
        4. "english_title": Title in English.
        5. "english_invitation": Formal 2-sentence English invitation message.
        6. "family_blessing": Family honorific / blessing line in Hindi (e.g. 'विनीतः एवं दर्शनाभिलाषी: समस्त परिवार').
        7. "theme_name": Dynamic theme name (e.g., 'Royal Marigold Gold', 'Empire Burgundy & Gold', 'Pastel Rose Blossom', 'Sacred Emerald').
        8. "primary_color": Hex color (e.g., '#800020', '#7B341E', '#064E3B').
        9. "accent_color": Hex accent color (e.g., '#D4AF37', '#FEEBC8', '#FCE7F3').
        10. "cover_image_url": A high-res Unsplash image URL matching the event theme.

        Return strictly raw JSON string only, no markdown formatting.
        """
        raw_text = await self._call_gemini_raw(prompt)
        if raw_text:
            try:
                cleaned = raw_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                data = json.loads(cleaned)
                if "shloka_header" in data and "hindi_invitation" in data:
                    return data
            except Exception as e:
                logger.error(f"[GEMINI AI] card on the fly parse error: {e}")

        return await self.mock_fallback.generate_ai_card_on_the_fly(event_type, title, host_name, venue, date_str)


