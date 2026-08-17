import re
from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.schemas.ai import EventContext


class EventAssistantState(TypedDict):
    thread_id: str
    messages: List[Dict[str, str]]
    event_type: Optional[str]
    title: Optional[str]
    celebrant_name: Optional[str]
    host_name: Optional[str]
    date: Optional[str]
    time: Optional[str]
    venue: Optional[str]
    address: Optional[str]
    is_complete: bool
    missing_slots: List[str]
    ai_response_text: str
    detected_language: str
    intent: str
    event_id: Optional[str]


class LangGraphEventService:
    def __init__(self):
        self.memory_saver = MemorySaver()
        self.graph = self._build_graph()

    def _detect_language(self, text: str) -> str:
        """
        Detects user language mode naturally:
        - HINDI_DEVANAGARI: If text contains Devanagari script (\u0900-\u097F)
        - HINGLISH: If text contains Latin transliterated Hindi
        - ENGLISH: Default English
        """
        if re.search(r'[\u0900-\u097F]', text):
            return "HINDI_DEVANAGARI"

        text_lower = text.lower()
        hinglish_indicators = [
            "beti", "bete", "bachche", "shaadi", "shadi", "vivah", "mundan", "janamdin",
            "hai", "karo", "kab", "kya", "ko", "par", "mein", "me", "ghar", "baat",
            "diya", "bhai", "samajh", "bataiye", "dijiye", "batao", "hamari", "uske",
            "liye", "baje", "sham", "subah", "raat", "ji", "kripya", "nahi", "shubh"
        ]
        
        match_count = sum(1 for w in hinglish_indicators if re.search(r'\b' + re.escape(w) + r'\b', text_lower))
        if match_count >= 1:
            return "HINGLISH"

        return "ENGLISH"

    def _extract_corrections(self, text: str, state: EventAssistantState) -> bool:
        """
        Detects and applies user slot corrections (e.g. 'Actually venue Lucknow nahi, Ayodhya hai').
        Replaces previous values without leaving stale state.
        Returns True if a correction was applied.
        """
        text_clean = text.strip()

        # 1. Venue correction: "Actually venue Lucknow nahi, Ayodhya hai"
        venue_corr = re.search(
            r'(?:actually\s+)?(?:venue|location|jagah|स्थान|वेन्यू|जगह)\s+([A-Za-z0-9\s\u0900-\u097F]{2,25}?)\s+(?:nahi|not|नहीं)[,\s]+([A-Za-z0-9\s\u0900-\u097F]{2,25}?)\s*(?:hai|में|mein|par|पर|है|$)',
            text_clean,
            re.IGNORECASE,
        )
        if venue_corr:
            target_val = venue_corr.group(2).strip().title()
            target_val = re.sub(r'\s+(?:hai|mein|me|par|में|पर|है)$', '', target_val, flags=re.IGNORECASE).strip()
            if target_val and len(target_val) >= 2 and target_val.lower() not in ["nahi", "not", "नहीं"]:
                state["venue"] = target_val
                state["intent"] = "CORRECTION"
                return True

        # 2. Date correction: "Actually date 25 Dec nahi, 26 Dec hai"
        date_corr = re.search(
            r'(?:date|तारीख|दिनांक)\s+.*?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z\u0900-\u097F]+|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(?:nahi|not|नहीं)[,\s]+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z\u0900-\u097F]+|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)',
            text_clean,
            re.IGNORECASE,
        )
        if date_corr:
            new_date_str = date_corr.group(2)
            parsed_d = self._extract_flexible_date(new_date_str)
            if parsed_d:
                state["date"] = parsed_d
                state["intent"] = "CORRECTION"
                return True

        return False

    def _extract_flexible_date(self, text: str) -> Optional[str]:
        """
        Parses full date string in Devanagari Hindi, English, ISO 8601, or numeric formats.
        """
        text_lower = text.lower()

        # 1. ISO 8601 date match: YYYY-MM-DD
        iso_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', text)
        if iso_match:
            y, m, d = iso_match.group(1), int(iso_match.group(2)), int(iso_match.group(3))
            month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
            if 1 <= m <= 12:
                return f"{d} {month_names[m - 1]} {y}"

        # 2. Devanagari Hindi Month (e.g. 15 अक्टूबर, 25 दिसंबर)
        devanagari_months = {
            "जनवरी": "January", "फरवरी": "February", "मार्च": "March", "अप्रैल": "April",
            "मई": "May", "जून": "June", "जुलाई": "July", "अगस्त": "August",
            "सितंबर": "September", "अक्टूबर": "October", "नवंबर": "November", "दिसंबर": "December"
        }
        for dev_key, eng_val in devanagari_months.items():
            if dev_key in text:
                day_match = re.search(r'(\d{1,2})\s*' + dev_key, text)
                year_match = re.search(r'\b(202[4-9]|203[0-9])\b', text)
                year = year_match.group(1) if year_match else "2026"
                if day_match:
                    return f"{day_match.group(1)} {eng_val} {year}"
                else:
                    return f"{eng_val} {year}"

        # 3. English Month Name (e.g. 15 October, 25 December, 5 September)
        english_months = {
            "january": "January", "jan": "January",
            "february": "February", "feb": "February",
            "march": "March", "mar": "March",
            "april": "April", "apr": "April",
            "may": "May",
            "june": "June", "jun": "June",
            "july": "July", "jul": "July",
            "august": "August", "aug": "August",
            "september": "September", "sep": "September", "sept": "September",
            "october": "October", "oct": "October",
            "november": "November", "nov": "November",
            "december": "December", "dec": "December"
        }

        # Pattern: 15 October, 25th Dec
        match_d_m = re.search(r'(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)', text_lower)
        if match_d_m:
            day = match_d_m.group(1)
            m_word = match_d_m.group(2)
            for mk, mv in english_months.items():
                if m_word == mk or (len(m_word) >= 3 and mk.startswith(m_word)):
                    year_match = re.search(r'\b(202[4-9]|203[0-9])\b', text)
                    year = year_match.group(1) if year_match else "2026"
                    return f"{day} {mv} {year}"

        # Pattern: October 15, Dec 25th
        match_m_d = re.search(r'([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?', text_lower)
        if match_m_d:
            m_word = match_m_d.group(1)
            day = match_m_d.group(2)
            for mk, mv in english_months.items():
                if m_word == mk or (len(m_word) >= 3 and mk.startswith(m_word)):
                    year_match = re.search(r'\b(202[4-9]|203[0-9])\b', text)
                    year = year_match.group(1) if year_match else "2026"
                    return f"{day} {mv} {year}"

        # Month only pattern (e.g. "December mein hai")
        for mk, mv in english_months.items():
            if re.search(r'\b' + re.escape(mk) + r'\b', text_lower):
                year_match = re.search(r'\b(202[4-9]|203[0-9])\b', text)
                year = year_match.group(1) if year_match else "2026"
                return f"{mv} {year}"

        # 4. Numeric format: 15/10/2026 or 25-12-2026
        num_match = re.search(r'(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?', text_lower)
        if num_match:
            d = num_match.group(1)
            m = int(num_match.group(2))
            y = num_match.group(3) or "2026"
            month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
            if 1 <= m <= 12:
                return f"{d} {month_names[m - 1]} {y}"

        return None

    def _extract_flexible_time(self, text: str) -> Optional[str]:
        """
        Parses time string in Devanagari Hindi, English, ISO 8601, or informal formats.
        """
        text_lower = text.lower()

        # 1. ISO 8601 time string match: T19:00:00
        iso_time_match = re.search(r'T(\d{2}):(\d{2})', text)
        if iso_time_match:
            hour = int(iso_time_match.group(1))
            min_str = iso_time_match.group(2)
            period = "PM" if hour >= 12 else "AM"
            display_h = hour if hour <= 12 else hour - 12
            display_h = 12 if display_h == 0 else display_h
            return f"{display_h}:{min_str} {period}"

        # 2. Time format with colon/dot: 7:00, 7.00, 7:00 pm, sham ko 7:00
        match_time = re.search(r'(\d{1,2})[\:\.](\d{2})', text_lower)
        if match_time:
            hour = int(match_time.group(1))
            min_str = match_time.group(2)
            is_pm = any(w in text_lower for w in ["pm", "shaam", "sham", "evening", "night", "raat", "शाम", "रात"])
            if is_pm and hour < 12:
                hour += 12
            display_h = hour if hour <= 12 else hour - 12
            display_h = 12 if display_h == 0 else display_h
            period = "PM" if hour >= 12 else "AM"
            return f"{display_h}:{min_str} {period}"

        # 3. Single hour digit: 7 baje, 7 pm, sham ko 7 baje, 7 बजे
        match_single_hour = re.search(r'(\d{1,2})\s*(?:बजे|baje|pm|am)', text_lower)
        if match_single_hour:
            hour = int(match_single_hour.group(1))
            is_pm = any(w in text_lower for w in ["pm", "shaam", "sham", "evening", "night", "raat", "शाम", "रात"])
            if is_pm and hour < 12:
                hour += 12
            display_h = hour if hour <= 12 else hour - 12
            display_h = 12 if display_h == 0 else display_h
            period = "PM" if hour >= 12 else "AM"
            return f"{display_h}:00 {period}"

        return None

    def _extract_flexible_venue(self, text: str) -> Optional[str]:
        """
        Parses venue name/city ONLY if supplied in the text.
        Never invents or defaults to fake venues.
        """
        text_clean = text.strip()
        text_lower = text_clean.lower()

        stop_words = ["2026", "2027", "december", "october", "september", "baje", "shaadi", "wedding", "mundan", "birthday", "hai", "है", "selected"]

        # 1. Match pattern: "Ayodhya mein hai" / "लखनऊ में है" / "Lucknow mein"
        suffix_match = re.search(r'([A-Za-z\u0900-\u097F]{2,25})\s+(?:mein|me|par|में|पर)\s+(?:hai|h|है)', text_clean, re.IGNORECASE)
        if suffix_match:
            val = suffix_match.group(1).strip()
            val = re.sub(r'^(?:ko|ki|ka|ke|को|की|का|के)\s+', '', val, flags=re.IGNORECASE).strip()
            if len(val) >= 2 and val.lower() not in stop_words:
                return val.title() if re.match(r'^[A-Za-z]', val) else val

        # 2. English preposition match: "in Lucknow" / "at Lucknow" / "at Taj Hotel" (with word boundary)
        loc_prep = re.search(r'\b(?:at|in)\s+([A-Za-z0-9\s\,\u0900-\u097F]{2,25}?)(?:[\.\,\!]|\s+(?:on|for|from|with|and)|\s*$)', text_clean, re.IGNORECASE)
        if loc_prep:
            val = loc_prep.group(1).strip()
            val = re.sub(r'\s+(?:par|mein|me|ko|aur|and|se|hai|है|में|पर|को)$', '', val, flags=re.IGNORECASE).strip()
            if len(val) >= 2 and val.lower() not in stop_words and val.lower() not in ["december", "october", "september", "november"]:
                return val.title() if re.match(r'^[A-Za-z]', val) else val

        # 3. Explicit keyword: "venue: Lucknow" / "venue is Lucknow" / "वेन्यू: लखनऊ"
        loc_match = re.search(r'\b(?:venue|location|place|स्थान|वेन्यू|जगह)\s*(?:is|hai|है|:|\-)?\s*([A-Za-z0-9\s\,\u0900-\u097F]{2,25})', text_clean, re.IGNORECASE)
        if loc_match:
            val = loc_match.group(1).strip()
            val = re.sub(r'\s+(?:par|mein|me|ko|aur|and|se|hai|है|में|पर|को)$', '', val, flags=re.IGNORECASE).strip()
            if len(val) >= 2 and val.lower() not in stop_words:
                return val.title() if re.match(r'^[A-Za-z]', val) else val

        # 4. Known venue noun match (hotel, hall, lawn, residence, resort, bhawan)
        if any(w in text_lower for w in ["hotel", "होटल", "hall", "banquet", "garden", "lawn", "home", "ghar", "घर", "residence", "palace", "resort", "bhawan", "भवन", "mandap"]):
            if "home" in text_lower or "ghar" in text_lower or "घर" in text_lower:
                return "Family Residence"
            match_phrase = re.search(r'([A-Za-z0-9\s\u0900-\u097F]{2,30}\s*(?:hotel|hall|banquet|lawn|lawns|garden|residence|palace|resort|convention|center|centre|bhawan|mandap|होटल|भवन))', text_clean, re.IGNORECASE)
            if match_phrase:
                return match_phrase.group(1).strip().title()

        return None

    def _extract_event_and_celebrant(self, text: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Extracts event_type, celebrant_name, and synthesized title without hallucination.
        Returns: (event_type, celebrant_name, title)
        """
        text_clean = text.strip()
        text_lower = text_clean.lower()

        # 1. MUNDAN CEREMONY
        if any(w in text_lower for w in ["mundan", "मुंडन", "tonsur", "chudakarana"]):
            event_type = "MUNDAN"
            celebrant_match = re.search(r'(?:bete|beti|bachche|son|daughter|child|mere bete|meri beti|mere bache|mera beta|meri beti)?\s*([A-Za-z\u0900-\u097F]+)(?:\s+ka|\s+ki|\s+ke|\'s)?\s+(?:mundan|मुंडन)', text_clean, re.IGNORECASE)
            celebrant = None
            if celebrant_match:
                candidate = celebrant_match.group(1).strip().capitalize()
                if candidate.lower() not in ["mere", "mera", "meri", "bete", "beti", "bachche", "son", "daughter", "child", "का", "की", "के", "मुंडन"]:
                    celebrant = candidate

            title = f"{celebrant}'s Mundan Ceremony" if celebrant else "Mundan Sanskar Ceremony"
            return event_type, celebrant, title

        # 2. BIRTHDAY CELEBRATION
        if any(w in text_lower for w in ["birthday", "janamdin", "जन्मदिन", "bday"]):
            event_type = "BIRTHDAY"
            celebrant_match = re.search(r'([A-Za-z\u0900-\u097F]+)(?:\s+ka|\s+ki|\s+ke|\'s)?\s+(?:birthday|janamdin|जन्मदिन|bday)', text_clean, re.IGNORECASE)
            celebrant = None
            if celebrant_match:
                candidate = celebrant_match.group(1).strip().capitalize()
                if candidate.lower() not in ["mera", "meri", "mere", "ka", "ki", "का", "की", "जन्मदिन", "today"]:
                    celebrant = candidate

            title = f"{celebrant}'s Birthday Celebration" if celebrant else "Birthday Celebration"
            return event_type, celebrant, title

        # 3. WEDDING CELEBRATION
        if any(w in text_lower for w in ["shaadi", "wedding", "vivah", "shadi", "शादी", "विवाह"]):
            event_type = "WEDDING"
            # Match couple: Rohit and Neha
            couple_match = re.search(r'([A-Za-z\u0900-\u097F]+)\s+(?:aur|and|&|\+)\s+([A-Za-z\u0900-\u097F]+)(?:\s+ki|\s+ke|\'s)?\s+(?:shaadi|wedding|vivah|शादी|विवाह)', text_clean, re.IGNORECASE)
            if couple_match:
                c1 = couple_match.group(1).strip().capitalize()
                c2 = couple_match.group(2).strip().capitalize()
                celebrant = f"{c1} & {c2}"
                title = f"{celebrant}'s Wedding Celebration"
                return event_type, celebrant, title

            # Match single celebrant (e.g. "Meri beti Ananya ki shaadi" / "My daughter Ananya's wedding")
            single_match = re.search(r'(?:beti|bete|daughter|son)\s+([A-Za-z\u0900-\u097F]+)(?:\s+ki|\s+ke|\'s)?\s+(?:shaadi|wedding|vivah|शादी|विवाह)', text_clean, re.IGNORECASE)
            if single_match:
                cand = single_match.group(1).strip().capitalize()
                if cand.lower() not in ["meri", "mere", "ki", "ke", "ka", "शादी", "विवाह"]:
                    celebrant = cand
                    title = f"{celebrant}'s Wedding Celebration"
                    return event_type, celebrant, title

            return event_type, None, "Wedding Celebration"

        # 4. ANNIVERSARY
        if any(w in text_lower for w in ["anniversary", "saalgirah", "सालगिरह"]):
            return "ANNIVERSARY", None, "Anniversary Celebration"

        # 5. GRIHA PRAVESH
        if any(w in text_lower for w in ["griha pravesh", "housewarming", "गृह प्रवेश", "grihapravesh"]):
            return "GRIHA_PRAVESH", None, "Griha Pravesh Ceremony"

        # 6. ENGAGEMENT
        if any(w in text_lower for w in ["engagement", "sagai", "roka", "सगाई", "रोका"]):
            return "ENGAGEMENT", None, "Engagement Ceremony"

        return None, None, None

    async def _extract_slots_node(self, state: EventAssistantState) -> EventAssistantState:
        """
        LangGraph Node 1: NLU Intent Detection, Slot Extraction & Correction Handling.
        """
        messages = state.get("messages", [])
        if not messages:
            return state

        latest_user_text = messages[-1].get("text", "")
        text_clean = latest_user_text.strip()
        lang_mode = self._detect_language(latest_user_text)
        state["detected_language"] = lang_mode

        # Check for user corrections first (e.g. "Actually venue Lucknow nahi, Ayodhya hai")
        is_corrected = self._extract_corrections(latest_user_text, state)

        # Check for skip intent
        text_lower = text_clean.lower()
        is_skip = any(w in text_lower for w in ["skip", "baad mein", "baad me", "abhi nahi", "pata nahi", "later", "not now"])
        if is_skip:
            if not state.get("venue") and state.get("date"):
                state["venue"] = "Celebration Venue"
            elif not state.get("time"):
                state["time"] = "Evening 7:00 PM"

        # Extract Event Type & Celebrant
        extracted_type, extracted_celebrant, extracted_title = self._extract_event_and_celebrant(latest_user_text)
        if extracted_type and (not state.get("event_type") or state.get("event_type") != extracted_type):
            state["event_type"] = extracted_type

        # If user didn't mention event type explicitly but mentioned "card", "invitation", default to WEDDING or current
        if not state.get("event_type") and any(w in text_lower for w in ["shaadi", "shadi", "wedding", "vivah", "dulha", "dulhan", "bride", "groom"]):
            state["event_type"] = "WEDDING"

        # Contextual celebrant / couple extraction when user answers conversational follow-up
        if not state.get("celebrant_name") and not extracted_celebrant and state.get("event_type"):
            curr_type = state.get("event_type")
            if curr_type == "WEDDING":
                # Matches: "Rohit aur Neha", "Rohit and Neha", "Neha & Rohit", "Dulha Rohit, Dulhan Neha"
                couple_match = re.search(
                    r'^(?:dulha\s+)?([A-Za-z\u0900-\u097F]{2,20})\s+(?:aur|and|&|\+|व|तथा|,\s*dulhan\s+)\s*(?:dulhan\s+)?([A-Za-z\u0900-\u097F]{2,20})(?:\s+hai|\s+hain|\s+ki|\s+ke|\s*[\.\!])*$',
                    text_clean,
                    re.IGNORECASE,
                )
                if couple_match:
                    c1 = couple_match.group(1).strip().capitalize()
                    c2 = couple_match.group(2).strip().capitalize()
                    state["celebrant_name"] = f"{c1} & {c2}"
                    state["title"] = f"{state['celebrant_name']}'s Wedding Celebration"
            elif curr_type in ["BIRTHDAY", "MUNDAN"]:
                # Matches single name reply: "Aarav", "Aarav ka hai", "Riya"
                single_name = re.search(
                    r'^(?:naam\s+)?([A-Za-z\u0900-\u097F]{2,20})(?:\s+ka|\s+ki|\s+hai|\s+naam\s+hai|\s*[\.\!])*$',
                    text_clean,
                    re.IGNORECASE,
                )
                if single_name:
                    cand = single_name.group(1).strip().capitalize()
                    stop_words = ["haan", "nahi", "yes", "no", "ok", "theek", "shaadi", "wedding", "birthday", "mundan", "date", "venue", "today", "tomorrow"]
                    if cand.lower() not in stop_words:
                        state["celebrant_name"] = cand
                        event_label = "Birthday Celebration" if curr_type == "BIRTHDAY" else "Mundan Ceremony"
                        state["title"] = f"{cand}'s {event_label}"

        if extracted_celebrant:
            state["celebrant_name"] = extracted_celebrant

        if extracted_title and (not state.get("title") or state.get("title") in ["Grand Celebration", "Wedding Celebration", "Birthday Celebration", "Mundan Sanskar Ceremony"]):
            state["title"] = extracted_title

        # Extract Date
        if not is_corrected or not state.get("date"):
            extracted_date = self._extract_flexible_date(latest_user_text)
            if extracted_date:
                state["date"] = extracted_date

        # Extract Time
        extracted_time = self._extract_flexible_time(latest_user_text)
        if extracted_time:
            state["time"] = extracted_time

        # Extract Venue / Location if not already corrected
        if not is_corrected and not state.get("venue"):
            extracted_venue = self._extract_flexible_venue(latest_user_text)
            if extracted_venue:
                state["venue"] = extracted_venue
            elif state.get("date") and not is_skip:
                # If date is already known and user sends a short single venue/city phrase (e.g. "Lucknow", "Ayodhya", "Hotel Taj Lucknow")
                cand_venue = text_clean.strip(" .!,")
                words = cand_venue.split()
                stop_words = [
                    "haan", "nahi", "yes", "no", "ok", "theek", "shaadi", "shadi", "wedding", "vivah",
                    "birthday", "janamdin", "mundan", "date", "venue", "time", "card", "banana", "hai",
                    "meri", "mera", "mere", "hamari", "h", "mein", "me", "ko", "par", "please", "karo"
                ]
                if 1 <= len(words) <= 3 and not any(w.lower() in stop_words for w in words) and not re.match(r'^\d+$', cand_venue):
                    state["venue"] = cand_venue.title() if re.match(r'^[A-Za-z]', cand_venue) else cand_venue

        return state

    async def _evaluate_state_node(self, state: EventAssistantState) -> EventAssistantState:
        """
        LangGraph Node 2: Progressive Disclosure Celebration Concierge.
        Evaluates required slots and asks ONLY 1 focused, warm question at a time
        with delightful celebration concierge tone and emojis.
        """
        event_type = state.get("event_type", "WEDDING")
        missing: List[str] = []

        # Determine strictly missing slots based on event category
        if event_type == "MUNDAN":
            if not state.get("celebrant_name"):
                missing.append("child_name")
            if not state.get("date"):
                missing.append("date")
            elif re.match(r'^[a-zA-Z]+\s+\d{4}$', state.get("date", "")):
                missing.append("exact_date")
            if not state.get("venue"):
                missing.append("venue")

        elif event_type == "BIRTHDAY":
            if not state.get("celebrant_name"):
                missing.append("birthday_person")
            if not state.get("date"):
                missing.append("date")
            elif re.match(r'^[a-zA-Z]+\s+\d{4}$', state.get("date", "")):
                missing.append("exact_date")

        elif event_type == "WEDDING":
            if not state.get("celebrant_name"):
                missing.append("couple_names")
            if not state.get("date"):
                missing.append("date")
            elif re.match(r'^[a-zA-Z]+\s+\d{4}$', state.get("date", "")):
                missing.append("exact_date")
            if not state.get("venue"):
                missing.append("venue")

        else:
            if not state.get("title"):
                missing.append("title")
            if not state.get("date"):
                missing.append("date")
            elif re.match(r'^[a-zA-Z]+\s+\d{4}$', state.get("date", "")):
                missing.append("exact_date")
            if not state.get("venue"):
                missing.append("venue")

        state["missing_slots"] = missing
        state["is_complete"] = len(missing) == 0
        lang = state.get("detected_language", "HINGLISH")

        if state["is_complete"]:
            # State is 100% complete
            title_display = state.get("title") or f"{event_type.title()} Celebration"
            date_display = state.get("date") or "Date TBD"
            venue_display = state.get("venue") or "Celebration Venue"

            if lang == "HINDI_DEVANAGARI":
                ai_response = (
                    f"अद्भुत! 🎉 आपके {title_display} का डिजिटल निमंत्रण पत्र तैयार है!\n\n"
                    f"📅 पावन तिथि: {date_display}\n"
                    f"📍 स्थान: {venue_display}\n\n"
                    f"आप नीचे दिए गए बटनों से कार्ड देख सकते हैं, डिज़ाइन चुन सकते हैं या मेहमानों को भेज सकते हैं।"
                )
            elif lang == "ENGLISH":
                ai_response = (
                    f"Perfect! 🎉 Your invitation for {title_display} is ready to preview.\n\n"
                    f"📅 Date: {date_display}\n"
                    f"📍 Venue: {venue_display}\n\n"
                    f"You can choose a design, add your guest list, or send invitations directly below."
                )
            else:
                # HINGLISH
                ai_response = (
                    f"Perfect! 🎉 {title_display} ka digital invitation preview ke liye taiyaar hai.\n\n"
                    f"📅 Date: {date_display}\n"
                    f"📍 Venue: {venue_display}\n\n"
                    f"Aap neeche diye buttons se card preview kar sakte hain, design choose kar sakte hain ya guests ko send kar sakte hain!"
                )
        else:
            # PROGRESSIVE DISCLOSURE: Ask only for the primary next missing slot warmly
            primary_missing = missing[0]

            if primary_missing in ["couple_names", "child_name", "birthday_person", "title"]:
                if event_type == "WEDDING":
                    if lang == "HINDI_DEVANAGARI":
                        ai_response = "बिल्कुल ❤️ मैं आपके लिए पूरा डिजिटल निमंत्रण पत्र तैयार कर दूँगा। सबसे पहले वर और वधू (दूल्हा और दुल्हन) का शुभ नाम बताइए।"
                    elif lang == "ENGLISH":
                        ai_response = "Certainly! ❤️ I would love to create your digital wedding invitation. First, please tell me the bride and groom's names."
                    else:
                        ai_response = "Bilkul ❤️ Main aapke liye poora digital invitation bana sakta hoon. Sabse pehle dulha aur dulhan ke naam bataiye."
                elif event_type == "BIRTHDAY":
                    if lang == "HINDI_DEVANAGARI":
                        ai_response = "बिल्कुल! 🎂 जन्मदिन का प्यारा डिजिटल निमंत्रण पत्र बनाते हैं। जिनका जन्मदिन है, उनका शुभ नाम बताइए?"
                    elif lang == "ENGLISH":
                        ai_response = "Wonderful! 🎂 Let's create a special birthday invitation. Whose birthday are we celebrating?"
                    else:
                        ai_response = "Bilkul! 🎂 Birthday celebration ka digital card ready karte hain. Kiska birthday hai, unka naam bataiye?"
                elif event_type == "MUNDAN":
                    if lang == "HINDI_DEVANAGARI":
                        ai_response = "शुभ काम! 👶 बच्चे का शुभ नाम बताइए जिनका मुंडन संस्कार होना है।"
                    elif lang == "ENGLISH":
                        ai_response = "A blessed occasion! 👶 Please share the name of the child for the Mundan ceremony."
                    else:
                        ai_response = "Shubh kaam! 👶 Bachche ka naam bataiye jinka mundan sanskar hai."
                else:
                    if lang == "HINDI_DEVANAGARI":
                        ai_response = "नमस्ते! 🙏 आपके इस शुभ उत्सव का क्या नाम है?"
                    elif lang == "ENGLISH":
                        ai_response = "Hello! 🙏 What is the name of this celebration?"
                    else:
                        ai_response = "Namaste! 🙏 Aapke is shubh utsav ka kya naam hai?"

            elif primary_missing in ["date", "exact_date"]:
                celebrant = state.get("celebrant_name")
                event_label = "shaadi" if event_type == "WEDDING" else ("birthday" if event_type == "BIRTHDAY" else "celebration")
                if lang == "HINDI_DEVANAGARI":
                    prefix = f"बहुत सुंदर! 💍" if event_type == "WEDDING" else "बहुत बढ़िया! 🎉"
                    ai_response = f"{prefix} अब {state.get('title', 'उत्सव')} की पावन तिथि (तारीख) बता दीजिए (जैसे 25 दिसंबर 2026)।"
                elif lang == "ENGLISH":
                    prefix = "Wonderful! 💍" if event_type == "WEDDING" else "Great! 🎉"
                    ai_response = f"{prefix} What date is the celebration planned for (e.g. 25 December 2026)?"
                else:
                    prefix = "Bahut sundar! 💍" if event_type == "WEDDING" else "Bahut badiya! 🎉"
                    ai_response = f"{prefix} Ab {event_label} ki shubh date bata dijiye (jaise 25 Dec 2026)."

            elif primary_missing == "venue":
                if lang == "HINDI_DEVANAGARI":
                    ai_response = "शानदार! 📅 अब उत्सव का वेन्यू या शहर बता दीजिए (जैसे लखनऊ या होटल का नाम)।"
                elif lang == "ENGLISH":
                    ai_response = "Great! 📅 Please share the venue or city (e.g. Lucknow or hotel name)."
                else:
                    ai_response = "Shandar! 📅 Ab shaadi/utsav ka venue ya city bata dijiye (jaise Lucknow ya Hotel Taj)."
            else:
                if lang == "HINDI_DEVANAGARI":
                    ai_response = "कृपया कार्यक्रम का समय या अन्य विवरण बता दीजिए।"
                elif lang == "ENGLISH":
                    ai_response = "Please share the time or any special details for the event."
                else:
                    ai_response = "Event ka time ya koi special detail bata dijiye."

        state["ai_response_text"] = ai_response
        state.setdefault("messages", []).append({"sender": "ai", "text": ai_response})
        return state

    def _build_graph(self):
        builder = StateGraph(EventAssistantState)
        builder.add_node("extract_slots", self._extract_slots_node)
        builder.add_node("evaluate_state", self._evaluate_state_node)

        builder.set_entry_point("extract_slots")
        builder.add_edge("extract_slots", "evaluate_state")
        builder.add_edge("evaluate_state", END)

        return builder.compile(checkpointer=self.memory_saver)

    async def process_user_turn(self, thread_id: str, user_message: str, existing_context: Optional[EventContext] = None) -> Dict[str, Any]:
        """
        Executes LangGraph Async State Engine with Thread Persistence & EventContext Syncing.
        """
        config = {"configurable": {"thread_id": thread_id}}
        
        current_state = await self.graph.aget_state(config)
        state_values = current_state.values if current_state and current_state.values else {
            "thread_id": thread_id,
            "messages": [],
            "event_type": existing_context.event_type if existing_context else None,
            "title": existing_context.title if existing_context else None,
            "celebrant_name": existing_context.celebrant_name if existing_context else None,
            "host_name": existing_context.host_name if existing_context else None,
            "date": existing_context.date if existing_context else None,
            "time": existing_context.time if existing_context else None,
            "venue": existing_context.venue if existing_context else None,
            "address": existing_context.address if existing_context else None,
            "is_complete": False,
            "missing_slots": [],
            "ai_response_text": "",
            "detected_language": existing_context.language if existing_context else "HINGLISH",
            "intent": "PROVIDE_INFO",
            "event_id": None,
        }

        state_values.setdefault("messages", []).append({"sender": "user", "text": user_message})

        final_state = await self.graph.ainvoke(state_values, config)
        return final_state

    def to_event_context(self, state: Dict[str, Any]) -> EventContext:
        """
        Transforms LangGraph state into strongly typed EventContext.
        """
        return EventContext(
            event_type=state.get("event_type"),
            title=state.get("title"),
            celebrant_name=state.get("celebrant_name"),
            host_name=state.get("host_name"),
            date=state.get("date"),
            time=state.get("time"),
            venue=state.get("venue"),
            address=state.get("address"),
            language=state.get("detected_language", "HINGLISH"),
        )


langgraph_event_service = LangGraphEventService()
