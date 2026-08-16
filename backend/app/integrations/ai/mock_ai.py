from typing import Dict, Any, List
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

