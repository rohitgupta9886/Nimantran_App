from typing import Dict, Any, List, Optional
from app.integrations.ai.base import AIProvider


class MockAIProvider(AIProvider):
    async def generate_invitation_wording(
        self, event_type: str, host_name: str, venue: str, tone: str = "EMOTIONAL", language: str = "HI_EN"
    ) -> Dict[str, str]:
        return {
            "title": f"Celebration of {event_type.capitalize()}",
            "formal_hindi": f"सप्रेम निमंत्रण! {host_name} के परिवार द्वारा आयोजित इस पावन {event_type} समारोह में आपकी उपस्थिति सादर प्रार्थनीय है। स्थान: {venue}।",
            "formal_english": f"Together with their families, {host_name} requests the honor of your presence at the auspicious {event_type.lower()} celebration at {venue}.",
            "hinglish": f"{host_name} family warmly invites you to join the grand {event_type.lower()} celebration at {venue}. Aapki presence hamare liye bohot special hai!",
            "short_whatsapp": f"✨ *{host_name} Family Invitation* ✨\nWe invite you to join our {event_type.lower()} celebration at {venue}. Click the link to view the complete interactive card!",
        }

    async def generate_welcome_quote(
        self, guest_name: str, relationship: str, event_type: str, tone: str = "WARM"
    ) -> str:
        rel_str = f" ({relationship})" if relationship else ""
        return f"A warm welcome to {guest_name}{rel_str}! Your presence adds grace and joy to our auspicious celebration."

    async def generate_our_story(
        self, prompt_info: str, style: str = "ROMANTIC"
    ) -> Dict[str, Any]:
        return {
            "title": "Our Journey Together",
            "style": style,
            "timeline": [
                {"year_label": "2019", "title": "The First Hello", "description": "Destiny brought us together for a casual coffee conversation that lasted hours."},
                {"year_label": "2022", "title": "The Proposal", "description": "Under a star-filled sky in Udaipur, we promised each other forever."},
                {"year_label": "2026", "title": "The Celebration", "description": "Beginning our lifetime of love, laughter, and togetherness."},
            ]
        }

    async def generate_thank_you_message(
        self, guest_name: str, relationship: str, language: str = "HI"
    ) -> str:
        if language == "HI":
            return f"आदरणीय {guest_name} जी, हमारे शुभ अवसर पर आपकी गरिमामयी उपस्थिति और असीम आशीर्वाद के लिए सहृदय धन्यवाद।"
        return f"Dear {guest_name}, thank you from the bottom of our hearts for joining our celebration and showering your warmest blessings upon us!"

    async def analyze_guest_duplicates(self, guest_list: list) -> list:
        # Simple mock fuzzy match check
        duplicates = []
        names = [g.get("name", "").strip().lower() for g in guest_list]
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                if names[i] and names[j] and (names[i] in names[j] or names[j] in names[i]):
                    duplicates.append({
                        "original": guest_list[i],
                        "potential_duplicate": guest_list[j],
                        "confidence": 0.88,
                    })
        return duplicates

    async def generate_ai_card_on_the_fly(
        self, event_type: str, title: str, host_name: str, venue: str, date_str: str
    ) -> Dict[str, Any]:
        evt_type_upper = (event_type or "").upper()
        if "MUNDAN" in evt_type_upper or "BABY" in evt_type_upper or "BIRTHDAY" in evt_type_upper:
            shloka = "|| ॐ नमः शिवाय / बालार्क तेजस्वी भव ||"
            bg_img = "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200&auto=format&fit=crop"
            primary_color = "#7B341E"
            accent_color = "#FEEBC8"
            hindi_text = f"नन्हे बालक के पावन {title} उत्सव पर {host_name} परिवार की ओर से आपकी गरिमामयी उपस्थिति अत्यंत प्रार्थनीय है।"
            english_text = f"With immense joy and love, {host_name} family cordially invites you to bless our little one on the auspicious occasion of {title}."
        else:
            shloka = "|| श्री गणेशाय नमः ||"
            bg_img = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop"
            primary_color = "#800020"
            accent_color = "#D4AF37"
            hindi_text = f"सपरिवार सादर निमंत्रण\n\n{host_name} परिवार की ओर से '{title}' के पावन अवसर पर आपकी गरिमामयी उपस्थिति सहर्ष प्रार्थनीय है।"
            english_text = f"Together with our families, {host_name} cordially requests your gracious presence to celebrate '{title}'."

        return {
            "shloka_header": shloka,
            "hindi_title": title,
            "hindi_invitation": hindi_text,
            "english_title": title,
            "english_invitation": english_text,
            "theme_name": "Royal Gold & Burgundy",
            "primary_color": primary_color,
            "accent_color": accent_color,
            "cover_image_url": bg_img,
            "family_blessing": "आशीर्वाद व स्नेहाकांक्षी: समस्त परिवार"
        }

    async def generate_structured_invitation(
        self,
        event_type: str,
        host_name: str,
        venue: str,
        date_str: str = "",
        tone: str = "EMOTIONAL",
        language: str = "HI_EN",
        style: str = "Traditional Indian",
        extra_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        lang_upper = (language or "HI_EN").upper()
        if "HINGLISH" in lang_upper:
            greeting = "Namaste! Warm Invitation"
            intro = f"{host_name} family cordially invites you to celebrate with us!"
            main_message = f"Aapki presence hamare {event_type} celebration ko aur bhi special bana degi. Please join us for an evening of joy and blessings!"
            closing = "Warm regards, Host Family"
        elif "HI" in lang_upper and "EN" not in lang_upper:
            greeting = "|| श्री गणेशाय नमः ||\nसपरिवार सादर निमंत्रण"
            intro = f"अत्यंत हर्ष के साथ {host_name} परिवार आपको आमंत्रित करता है।"
            main_message = f"हमारे प्रिय {event_type} के मांगलिक अवसर पर आपकी गरिमामयी उपस्थिति हमारे आनंद को द्विगुणित करेगी।"
            closing = "दर्शनाभिलाषी: समस्त परिवार"
        else:
            greeting = "Together with their families"
            intro = f"{host_name} requests the honor of your gracious presence."
            main_message = f"Please join us in celebrating the auspicious occasion of our {event_type}."
            closing = "With Warmest Blessings & Regards"

        details_str = f"Date: {date_str or 'To be announced'} | Venue: {venue or 'Venue details'}"

        return {
            "title": f"Auspicious {event_type.capitalize()} Celebration",
            "greeting": greeting,
            "intro": intro,
            "main_message": main_message,
            "event_details": details_str,
            "host_message": f"Hosted with love by {host_name}",
            "closing": closing,
            "language": language,
            "tone": tone,
            "style": style,
            "title_text": f"Auspicious {event_type.capitalize()} Celebration",
            "message_text": f"{greeting}\n\n{intro}\n\n{main_message}\n\n📍 {details_str}\n\n{closing}",
        }

    async def improve_or_rewrite_invitation(
        self,
        original_text: str,
        instruction: str,
        target_tone: Optional[str] = None,
        target_language: Optional[str] = None,
    ) -> Dict[str, str]:
        tone_str = target_tone or "Polished"
        lang_str = target_language or "Selected Language"
        rewritten = f"✨ [{tone_str} Style in {lang_str}]\n\n{original_text}\n\n(Enhanced with warmth and cultural elegance)"
        return {
            "improved_text": rewritten,
            "tone": tone_str,
            "language": lang_str,
            "change_summary": f"Refined text to match {tone_str} tone and {lang_str} preference based on instruction: {instruction}",
        }

    async def chat_invitation_assistant(
        self,
        messages: list,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        last_msg = messages[-1].get("content", "") if messages else "Hello"
        return f"Namaste! 🙏 Main Nimantran AI assistant hoon. Main aapke invitation ko aur bhi shandar banane mein madad kar sakta hoon. (Response to: '{last_msg}')"

    async def generate_personalized_guest_invitation(
        self,
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
        rel_honorific = f" ({relationship})" if relationship else ""
        return (
            f"Dear {guest_name}{rel_honorific},\n\n"
            f"Together with our families, {host_name} cordially invites you to celebrate '{event_title}'.\n\n"
            f"📅 Date: {date_str}\n"
            f"📍 Venue: {venue}\n\n"
            f"✨ View full event details & your personal digital entry pass:\n"
            f"👉 {invitation_link}\n\n"
            f"We look forward to welcoming you with warmest regards!"
        )

    async def generate_celebration_story(
        self,
        event_facts: Dict[str, Any],
        approved_wishes: List[Dict[str, Any]],
        approved_memories: List[Dict[str, Any]],
        attendance_summary: Dict[str, Any],
        style: str = "EMOTIONAL_ROYAL",
    ) -> Dict[str, Any]:
        title = event_facts.get("title", "Celebration")
        host_name = event_facts.get("host_name", "Our Family")
        venue_name = event_facts.get("venue_name", "The Celebration Venue")
        date_str = event_facts.get("date_str", "This Special Day")
        event_type = event_facts.get("event_type", "CELEBRATION")
        checked_in = attendance_summary.get("checked_in_count", 0)
        total_guests = attendance_summary.get("total_guests", 0)

        wishes_count = len(approved_wishes)
        memories_count = len(approved_memories)

        top_wishes_text = [
            f"\"{w.get('message')}\" — {w.get('sender_name')}"
            for w in approved_wishes[:3]
        ]
        highlights = [
            f"Over {checked_in} honored guests gathered at {venue_name} to celebrate with {host_name}.",
            f"Received {wishes_count} heartfelt blessings and congratulations from family and close friends.",
            f"Preserved {memories_count} captured photographic memories from the milestone functions.",
        ]
        if top_wishes_text:
            highlights.append(f"Cherished blessings: {'; '.join(top_wishes_text)}")

        story_hi = (
            f"|| श्री गणेशाय नमः ||\n\n"
            f"'{title}' का यह अलौकिक उत्सव {host_name} परिवार के लिए जीवन का एक अविस्मरणीय स्वर्णिम अध्याय बन गया। "
            f"{venue_name} के पावन प्रांगण में उपस्थित {checked_in} आत्मीय जनों की गरिमामयी उपस्थिति ने इस दिन को अनंत खुशियों और देवतुल्य आशीर्वाद से भर दिया।"
        )

        story_en = (
            f"The grand celebration of '{title}' hosted with immense grace by {host_name} at {venue_name} "
            f"concluded on a note of supreme joy and gratitude. Surrounded by {checked_in} cherished guests and enveloped in {wishes_count} warm blessings, "
            f"every single moment captured an enduring testament to love, heritage, and togetherness."
        )

        gratitude_note = (
            f"With profound gratitude, the {host_name} family extends heartfelt thanks to all {checked_in} guests who graced '{title}' "
            f"and showered us with their eternal love and blessings."
        )

        return {
            "title": f"Celebration Chronicles: {title}",
            "event_type": event_type,
            "host_name": host_name,
            "venue_name": venue_name,
            "date_str": date_str,
            "attendance_grounding": attendance_summary,
            "story_hindi": story_hi,
            "story_english": story_en,
            "highlights": highlights,
            "host_gratitude_note": gratitude_note,
            "approved_wishes_count": wishes_count,
            "approved_memories_count": memories_count,
        }

    async def generate_memory_caption(
        self, event_type: str, milestone_or_tag: str = "Celebration Moment", guest_name: Optional[str] = None
    ) -> Dict[str, str]:
        who = f"with {guest_name}" if guest_name else "with loved ones"
        hi_caption = f"खुशियों और आत्मीयता से सराबोर एक अनमोल पल — '{milestone_or_tag}' की मधुर स्मृति {who}।"
        en_caption = f"A timeless moment of pure joy and celebration during '{milestone_or_tag}' {who}."
        return {
            "caption_hindi": hi_caption,
            "caption_english": en_caption,
            "combined_caption": f"{hi_caption}\n{en_caption}",
        }

    async def generate_attendance_thank_you(
        self, event_facts: Dict[str, Any], attendance_summary: Dict[str, Any]
    ) -> Dict[str, str]:
        title = event_facts.get("title", "our celebration")
        host = event_facts.get("host_name", "Our Family")

        hi = f"सप्रेम धन्यवाद! '{title}' के पावन अवसर पर आपकी गरिमामयी उपस्थिति ने हमारे उत्साह को द्विगुणित कर दिया। {host} परिवार आपकी शुभकामनाओं के लिए सदैव आभारी रहेगा।"
        en = f"Heartfelt Thank You! Your gracious presence at '{title}' made our special day truly memorable. The {host} family warmly thanks you for your love and blessings."
        whatsapp = f"🙏 *Heartfelt Gratitude from {host}*\n\nThank you for gracing *{title}* with your presence and blessings! Your warmth made the celebration truly unforgettable. ❤️✨"

        return {
            "thank_you_hindi": hi,
            "thank_you_english": en,
            "whatsapp_ready_message": whatsapp,
        }


