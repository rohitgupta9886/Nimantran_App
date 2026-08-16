import json
import logging
from typing import Dict, Any, List, Optional
from app.integrations.ai.gemini_ai import GoogleGeminiAIProvider
from app.integrations.ai.mock_ai import MockAIProvider

logger = logging.getLogger("nimantran_story_engine")


class AIStoryEngine:
    """
    NIMANTRAN AI Signature Event Story Engine:
    Translates Host Photos, Voice Notes, Dates, and Event Context into
    Event-Specific, Emotional Digital Magazine Story Timelines without hallucinating facts.
    """

    def __init__(self, gemini_provider: Optional[GoogleGeminiAIProvider] = None):
        self.gemini = gemini_provider
        self.mock = MockAIProvider()

    def get_event_strategy(self, event_type: str, mood: str = "EMOTIONAL") -> Dict[str, Any]:
        evt = (event_type or "").upper()

        if "WEDDING" in evt or "MARRIAGE" in evt or "SANGEET" in evt or "RECEPTION" in evt:
            return {
                "category": "WEDDING",
                "default_title": "Two Stories. One Journey.",
                "subtitle": "Before We Say Forever...",
                "sections": ["How We Met", "The Beginning", "Moments We Cherish", "The Proposal", "Seven Vows Day"],
                "theme_name": "Ivory Gold & Velvet Burgundy",
                "bg_gradient": "from-[#1A030A] via-[#0D0205] to-[#1F040E]",
                "border_color": "border-amber-500/40",
                "accent_color": "#D4AF37",
                "shloka_header": "|| श्री गणेशाय नमः ||",
                "writing_style": "Poetic, romantic, deeply emotional with family warmth",
            }
        elif "BIRTHDAY" in evt:
            if "KIDS" in evt or "BABY" in evt or "1ST" in evt:
                return {
                    "category": "BIRTHDAY_KIDS",
                    "default_title": "Growing Through the Years",
                    "subtitle": "A Little Tale of Giggles & Joy",
                    "sections": ["The Day You Arrived", "First Smiles & Steps", "Little Adventures", "Today's Celebration"],
                    "theme_name": "Vibrant Pastel Delight",
                    "bg_gradient": "from-[#0F172A] via-[#0B0F19] to-[#1E1B4B]",
                    "border_color": "border-cyan-400/40",
                    "accent_color": "#38BDF8",
                    "shloka_header": "|| ॐ नमः शिवाय / बालार्क तेजस्वी भव ||",
                    "writing_style": "Playful, bright, joyful and affectionate",
                }
            return {
                "category": "BIRTHDAY_MILESTONE",
                "default_title": "Countless Memories. One Celebrating Heart.",
                "subtitle": "The Chapters of an Inspiring Journey",
                "sections": ["The Beginning", "Childhood Laughs", "Chasing Dreams", "Family & Friends", "Cheers to Today"],
                "theme_name": "Midnight Gold Gala",
                "bg_gradient": "from-[#180018] via-[#0A000A] to-[#12001A]",
                "border_color": "border-purple-500/40",
                "accent_color": "#C084FC",
                "shloka_header": "|| ॐ श्री गणेशाय नमः ||",
                "writing_style": "Warm, celebratory, nostalgic and inspiring",
            }
        elif "ANNIVERSARY" in evt:
            return {
                "category": "ANNIVERSARY",
                "default_title": "Years Together. Memories Forever.",
                "subtitle": "A Journey of Unconditional Love",
                "sections": ["The Day We Said 'I Do'", "Building Our Home", "Raising Dreams Together", "Golden Years"],
                "theme_name": "Royal Emerald & Gold",
                "bg_gradient": "from-[#021A12] via-[#010D09] to-[#04261B]",
                "border_color": "border-emerald-500/40",
                "accent_color": "#34D399",
                "shloka_header": "|| ॐ नमः शिवाय ||",
                "writing_style": "Enduring, romantic, respectful and family-centered",
            }
        elif "BABY" in evt or "MUNDAN" in evt or "NAMAKARAN" in evt or "SHOWER" in evt:
            return {
                "category": "BABY_CELEBRATION",
                "default_title": "A Little Story Before We Meet",
                "subtitle": "The Beginning of a Beautiful Life",
                "sections": ["Waiting With Love", "The Day You Arrived", "First Family Moments", "Sacred Blessing Ritual"],
                "theme_name": "Soft Rose Quartz & Gold",
                "bg_gradient": "from-[#1C0D17] via-[#0D040A] to-[#260F1F]",
                "border_color": "border-rose-400/40",
                "accent_color": "#FB7185",
                "shloka_header": "|| ॐ श्री गणेशाय नमः / बालार्क तेजस्वी भव ||",
                "writing_style": "Gentle, tender, वात्सल्य (parental love) and divine blessings",
            }
        elif "HOUSEWARMING" in evt or "GRIHA" in evt:
            return {
                "category": "HOUSEWARMING",
                "default_title": "A New Home. A New Chapter.",
                "subtitle": "Where Love & Family Reside",
                "sections": ["The Dream", "Building the Dream", "The First Key", "A House Becomes a Home"],
                "theme_name": "Golden Terracotta & Wood",
                "bg_gradient": "from-[#1A1208] via-[#0C0803] to-[#24170A]",
                "border_color": "border-amber-600/40",
                "accent_color": "#F59E0B",
                "shloka_header": "|| ॐ वास्तु पुरुषाय नमः ||",
                "writing_style": "Peaceful, welcoming, prosperous and homely",
            }
        elif "REUNION" in evt:
            return {
                "category": "REUNION",
                "default_title": "Then → Now → Together Again",
                "subtitle": "Reconnecting Unforgettable Moments",
                "sections": ["Remember This?", "Those Golden Days", "The People We Became", "Together Again"],
                "theme_name": "Vintage Nostalgia Sepia",
                "bg_gradient": "from-[#1A1810] via-[#0A0906] to-[#242114]",
                "border_color": "border-yellow-600/40",
                "accent_color": "#EAB308",
                "shloka_header": "|| पुरानी यादें, नया संगम ||",
                "writing_style": "Nostalgic, fun, warm and conversational",
            }
        elif "CORPORATE" in evt or "LAUNCH" in evt or "GALA" in evt:
            return {
                "category": "CORPORATE",
                "default_title": "The Journey Behind the Innovation",
                "subtitle": "Excellence, Growth & Shared Milestones",
                "sections": ["The Founding Blueprint", "Overcoming Challenges", "Breakthrough Growth", "The Next Era"],
                "theme_name": "Platinum Executive Minimal",
                "bg_gradient": "from-[#0F172A] via-[#020617] to-[#1E293B]",
                "border_color": "border-slate-500/40",
                "accent_color": "#94A3B8",
                "shloka_header": "EXCELLENCE & INNOVATION",
                "writing_style": "Professional, inspiring, clean, non-emotional",
            }
        elif "PUJA" in evt or "FESTIVAL" in evt or "RELIGIOUS" in evt:
            return {
                "category": "FESTIVAL",
                "default_title": "Sacred Traditions & Divine Blessings",
                "subtitle": "Immersed in Faith and Togetherness",
                "sections": ["Ancient Traditions", "Floral & Diya Preparations", "Sacred Hawan & Chanting", "Divine Aarti"],
                "theme_name": "Temple Saffron & Gold Glow",
                "bg_gradient": "from-[#1A0900] via-[#0A0400] to-[#240D00]",
                "border_color": "border-amber-500/50",
                "accent_color": "#F97316",
                "shloka_header": "|| ॐ नमः शिवाय / सर्वमंगल मांगल्ये ||",
                "writing_style": "Spiritual, sacred, auspicious and respectful",
            }
        elif "RETIREMENT" in evt or "FAREWELL" in evt:
            return {
                "category": "RETIREMENT",
                "default_title": "Decades of Legacy, Dedication & Pride",
                "subtitle": "Honoring an Illustrious Journey",
                "sections": ["The First Day", "Leadership & Mentorship", "Unforgettable Achievements", "A Golden Chapter"],
                "theme_name": "Royal Sapphire & Gold",
                "bg_gradient": "from-[#0B132B] via-[#040817] to-[#1C2541]",
                "border_color": "border-blue-400/40",
                "accent_color": "#60A5FA",
                "shloka_header": "|| कृतज्ञता व ढेरों शुभकामनाएं ||",
                "writing_style": "Dignified, respectful, inspiring and warm",
            }
        else:
            return {
                "category": "GENERIC",
                "default_title": "A Story Worth Celebrating",
                "subtitle": "Cherished Moments & Shared Joy",
                "sections": ["The Beginning", "Special Moments", "Together Today"],
                "theme_name": "Classic Nimantran Luxury",
                "bg_gradient": "from-[#140005] via-[#0A0002] to-[#1F0008]",
                "border_color": "border-amber-500/40",
                "accent_color": "#D4AF37",
                "shloka_header": "|| श्री गणेशाय नमः ||",
                "writing_style": "Warm, joyful, respectful",
            }

    async def generate_event_story(
        self,
        event_type: str,
        host_name: str,
        event_title: str,
        mood: str = "EMOTIONAL",
        milestones: Optional[List[Dict[str, Any]]] = None,
        then_now_pairs: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        strategy = self.get_event_strategy(event_type, mood)

        processed_memories = []
        raw_milestones = milestones or []

        for idx, m in enumerate(raw_milestones):
            title = m.get("title", f"Milestone #{idx + 1}")
            date_str = m.get("date", "Date TBA")
            image_url = m.get("image_url") or "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop"
            user_text = m.get("user_text", "")
            voice_audio_url = m.get("voice_audio_url", "")

            # Strict Fact Preservation Prompting
            if self.gemini:
                prompt = f"""
                You are an elite Indian storytelling AI for NIMANTRAN AI.
                Event Type: {event_type}. Host: '{host_name}'. Event Title: '{event_title}'. Mood: {mood}.
                Milestone Title: '{title}'. Milestone Date: '{date_str}'. Host Notes: '{user_text}'.

                CRITICAL RULE: DO NOT FABRICATE OR INVENT FAKE PERSONAL FACTS, DATES, OR UNPROVIDED NAMES.
                Enhance, polish, and structure the host's provided information into poetic, high-gravity story text.

                Respond in raw JSON format with keys:
                - "hindi_story": Traditional, respectful Hindi text in Devanagari script.
                - "english_story": Elegant, dignified English story text.
                - "title": polished milestone title.

                Raw JSON only, no markdown wrappers.
                """
                res = await self.gemini._call_gemini_raw(prompt)
                if res:
                    try:
                        cleaned = res.strip()
                        if cleaned.startswith("```"):
                            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                        parsed = json.loads(cleaned)
                        hindi = parsed.get("hindi_story", "")
                        english = parsed.get("english_story", "")
                        if hindi and english:
                            processed_memories.append({
                                "title": parsed.get("title", title),
                                "date": date_str,
                                "image_url": image_url,
                                "voice_audio_url": voice_audio_url,
                                "hindi_story": hindi,
                                "english_story": english,
                                "story": f"{hindi}\n\n───────────────────────\n\n{english}",
                            })
                            continue
                    except Exception as err:
                        logger.warn(f"Failed to parse Gemini story: {err}")

            # Fallback story generation using event strategy
            category = strategy["category"]
            if category == "BABY_CELEBRATION" or category == "BIRTHDAY_KIDS":
                hi_text = f"नन्हे बालक की मुस्कान और '|| बालार्क तेजस्वी भव ||' के आशीर्वाद के साथ, '{title}' ({date_str}) का यह वात्सल्यपूर्ण क्षण हमारे पूरे परिवार के लिए अनमोल स्मृति बन गया।"
                en_text = f"Surrounded by family love and divine grace, '{title}' on {date_str} became a golden milestone in our child's journey."
            elif category == "HOUSEWARMING":
                hi_text = f"गृह प्रवेश के इस पावन अवसर पर '{title}' ({date_str}) से हमारे घर में सुख, शांति और समृद्धि का शुभ आगमन हुआ। अपनों की गरिमामयी उपस्थिति से यह प्रांगण निखर उठा।"
                en_text = f"Blessing our new home with peace and warmth, '{title}' on {date_str} brought family together to inaugurate our sanctuary."
            elif category == "CORPORATE":
                hi_text = f"विज़न और उत्कृष्टता के मार्ग पर '{title}' ({date_str}) ने सफलता का नया मील का पत्थर स्थापित किया। हमारी इस ऐतिहासिक यात्रा में आपकी सहभागिता अतुलनीय है।"
                en_text = f"Driven by vision and commitment, '{title}' on {date_str} marks a major milestone in our corporate journey of innovation and shared triumph."
            elif category == "FESTIVAL":
                hi_text = f"|| ॐ नमः शिवाय || ईश्वर के दिव्य अनुग्रह और वैदिक मन्त्रोच्चार के बीच '{title}' ({date_str}) का यह धार्मिक अनुष्ठान हमें असीम शांति और आत्मिक ऊर्जा से भर देता है।"
                en_text = f"Immersed in holy chants and spiritual devotion, '{title}' on {date_str} filled our home with divine peace and eternal blessings."
            elif category == "RETIREMENT":
                hi_text = f"दशकों की निष्ठा, नेतृत्व और प्रेरणादायी सेवा के साथ '{title}' ({date_str}) का यह क्षण सम्मान और गर्व से भरा हुआ है। आपके स्वर्णिम भविष्य हेतु हार्दिक शुभकामनाएं!"
                en_text = f"Honoring decades of dedication and inspiring leadership, '{title}' on {date_str} celebrates a magnificent legacy and a golden new beginning."
            else:
                hi_text = f"जीवन के इस पावन मोड़ पर '{title}' ({date_str}) का यह मंगलमय क्षण हमारे दिलों में सदा के लिए अंकित हो गया। अपनों के अपार स्नेह और ईश्वर के आशीर्वाद से परिपूर्ण यह यात्रा जारी है।"
                en_text = f"On this sacred juncture of life, '{title}' on {date_str} became an eternal memory. Surrounded by family love and togetherness, our journey continues."

            processed_memories.append({
                "title": title,
                "date": date_str,
                "image_url": image_url,
                "voice_audio_url": voice_audio_url,
                "hindi_story": hi_text,
                "english_story": en_text,
                "story": f"{hi_text}\n\n───────────────────────\n\n{en_text}",
            })

        processed_then_now = []
        for pair in (then_now_pairs or []):
            processed_then_now.append({
                "label": pair.get("label", "Then → Now Transformation"),
                "before_label": pair.get("before_label", "Then"),
                "before_image_url": pair.get("before_image_url", "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop"),
                "after_label": pair.get("after_label", "Now"),
                "after_image_url": pair.get("after_image_url", "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop"),
                "caption": pair.get("caption", "How time flies, but memories stay eternal."),
            })

        return {
            "story_title": strategy["default_title"],
            "story_subtitle": strategy["subtitle"],
            "strategy": strategy,
            "mood": mood,
            "memories": processed_memories,
            "then_now_pairs": processed_then_now,
        }
