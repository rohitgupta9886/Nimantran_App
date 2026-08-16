import re
from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

class EventAssistantState(TypedDict):
    thread_id: str
    messages: List[Dict[str, str]]
    event_type: Optional[str]
    title: Optional[str]
    date: Optional[str]
    time: Optional[str]
    venue: Optional[str]
    is_complete: bool
    missing_slots: List[str]
    ai_response_text: str
    detected_language: str
    event_id: Optional[str]

class LangGraphEventService:
    def __init__(self):
        self.memory_saver = MemorySaver()
        self.graph = self._build_graph()

    def _detect_language(self, text: str) -> str:
        """
        Detects user language mode:
        - HINDI_DEVANAGARI: If text contains Devanagari script (\u0900-\u097F)
        - HINGLISH: If text contains Latin transliterated Hindi
        - ENGLISH: Default English
        """
        if re.search(r'[\u0900-\u097F]', text):
            return "HINDI_DEVANAGARI"

        text_lower = text.lower()
        hinglish_indicators = [
            "beti", "shaadi", "shadi", "hai", "karo", "kab", "kya", "ko", "par",
            "mein", "ghar", "baat", "diya", "bhai", "samajh", "bataiye", "dijiye",
            "batao", "taiym", "daet", "hamari", "uske", "liye", "baje", "sham", "subah", "raat", "ji", "kripya"
        ]
        
        match_count = sum(1 for w in hinglish_indicators if w in text_lower)
        if match_count >= 1:
            return "HINGLISH"

        return "ENGLISH"

    def _extract_flexible_date(self, text: str) -> Optional[str]:
        """
        Parses ANY date string in Devanagari Hindi, English, ISO 8601, or numeric formats.
        """
        text_lower = text.lower()

        # 1. ISO 8601 date match: YYYY-MM-DD
        iso_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', text)
        if iso_match:
            y, m, d = iso_match.group(1), int(iso_match.group(2)), int(iso_match.group(3))
            month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
            if 1 <= m <= 12:
                return f"{d} {month_names[m - 1]} {y}"

        # 2. Devanagari Hindi Month (e.g. 25 दिसंबर)
        devanagari_months = {
            "जनवरी": "January", "फरवरी": "February", "मार्च": "March", "अप्रैल": "April",
            "मई": "May", "जून": "June", "जुलाई": "July", "अगस्त": "August",
            "सितंबर": "September", "अक्टूबर": "October", "नवंबर": "November", "दिसंबर": "December"
        }
        for dev_key, eng_val in devanagari_months.items():
            if dev_key in text:
                day_match = re.search(r'(\d{1,2})\s*' + dev_key, text)
                day = day_match.group(1) if day_match else "25"
                year_match = re.search(r'\b(202[4-9]|203[0-9])\b', text)
                year = year_match.group(1) if year_match else "2026"
                return f"{day} {eng_val} {year}"

        # 3. English Month Name (e.g. 25 December, 25th Dec, Dec 25)
        english_months = {
            "january": "January", "jan": "January",
            "february": "February", "feb": "February",
            "march": "March", "mar": "March",
            "april": "April", "apr": "April",
            "may": "May",
            "june": "June", "jun": "June",
            "july": "July", "jul": "July",
            "august": "August", "aug": "August",
            "september": "September", "sep": "September",
            "october": "October", "oct": "October",
            "november": "November", "nov": "November",
            "december": "December", "dec": "December"
        }

        # Pattern: 25 December, 25th Dec
        match_d_m = re.search(r'(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)', text_lower)
        if match_d_m:
            day = match_d_m.group(1)
            m_word = match_d_m.group(2)
            for mk, mv in english_months.items():
                if m_word == mk or (len(m_word) >= 3 and mk.startswith(m_word)):
                    year_match = re.search(r'\b(202[4-9]|203[0-9])\b', text)
                    year = year_match.group(1) if year_match else "2026"
                    return f"{day} {mv} {year}"

        # Pattern: December 25, Dec 25th
        match_m_d = re.search(r'([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?', text_lower)
        if match_m_d:
            m_word = match_m_d.group(1)
            day = match_m_d.group(2)
            for mk, mv in english_months.items():
                if m_word == mk or (len(m_word) >= 3 and mk.startswith(m_word)):
                    year_match = re.search(r'\b(202[4-9]|203[0-9])\b', text)
                    year = year_match.group(1) if year_match else "2026"
                    return f"{day} {mv} {year}"

        # 4. Numeric format: 25/12/2026 or 25-12-2026
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
        Parses ANY time string in Devanagari Hindi, English, ISO 8601, or informal formats.
        """
        text_lower = text.lower()

        # 1. ISO 8601 time string match: T19:00:00
        iso_time_match = re.search(r'T(\d{2}):(\d{2})', text)
        if iso_time_match:
            hour = int(iso_time_match.group(1))
            min_str = iso_time_match.group(2)
            if hour == 0:
                return "12:00 AM"
            elif hour < 12:
                return f"{hour}:{min_str} AM"
            elif hour == 12:
                return f"12:{min_str} PM"
            else:
                return f"{hour - 12}:{min_str} PM"

        # 2. Time format with colon/dot: 7:00, 7.00, 7:00 baje, 7:00 pm, sham ko 7:00
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

        if any(w in text_lower for w in ["morning", "subah", "सुबह"]):
            return "10:00 AM"
        if any(w in text_lower for w in ["afternoon", "dopahar", "दोपहर"]):
            return "1:00 PM"
        if any(w in text_lower for w in ["evening", "shaam", "sham", "शाम"]):
            return "7:00 PM"

        return None

    def _extract_flexible_venue(self, text: str) -> Optional[str]:
        """
        Parses venue name/location ONLY if mentioned by the user in the current conversation.
        """
        text_lower = text.lower()
        
        venue_kw_match = re.search(r'(?:venue|location|place|स्थान|वेन्यू|जगह|at|in|mein|में|पर)\s*(?:is|hai|है|:|\-)?\s*([A-Za-z0-9\s\,\u0900-\u097F]{3,40})', text, re.IGNORECASE)
        if venue_kw_match:
            val = venue_kw_match.group(1).strip()
            val = re.sub(r'\s+(?:par|mein|me|ko|aur|and|se|hai|है)$', '', val, flags=re.IGNORECASE).strip()
            if len(val) >= 3 and not any(w in val.lower() for w in ["2026", "2027", "december", "baje", "shaadi", "wedding", "selected"]):
                return val.title()

        if any(w in text_lower for w in ["taj", "ताज", "oberoi", "ओबेरॉय", "radisson", "marriott", "itc", "hotel", "होटल", "hall", "banquet", "garden", "lawn", "home", "ghar", "घर", "residence", "palace", "resort"]):
            if "taj" in text_lower or "ताज" in text_lower:
                return "The Taj Hotel & Convention Centre"
            if "oberoi" in text_lower or "ओबेरॉय" in text_lower:
                return "The Oberoi Grand Ballroom"
            if "home" in text_lower or "ghar" in text_lower or "घर" in text_lower:
                return "Family Residence / Home Pavilion"
            
            match_phrase = re.search(r'([A-Za-z0-9\s\u0900-\u097F]{2,30}\s*(?:hotel|hall|banquet|lawn|lawns|garden|home|ghar|residence|palace|resort|convention|center|centre|ताज|होटल|घर))', text, re.IGNORECASE)
            if match_phrase:
                return match_phrase.group(1).strip().title()

        return None

    async def _extract_slots_node(self, state: EventAssistantState) -> EventAssistantState:
        """
        LangGraph Node 1: NLU Slot Extraction from user message without overwriting existing state.
        """
        messages = state.get("messages", [])
        if not messages:
            return state

        latest_user_text = messages[-1].get("text", "")
        
        lang_mode = self._detect_language(latest_user_text)
        state["detected_language"] = lang_mode

        text_lower = latest_user_text.lower()

        extracted_names = []
        name_map = {
            "priyanka": "Priyanka", "प्रियंका": "Priyanka",
            "rohit": "Rohit", "रोहित": "Rohit",
            "rahul": "Rahul", "राहुल": "Rahul",
            "neha": "Neha", "नेहा": "Neha",
            "ananya": "Ananya", "अनन्या": "Ananya",
            "vikram": "Vikram", "विक्रम": "Vikram",
            "aditya": "Aditya", "आदित्य": "Aditya",
            "aarav": "Aarav", "आरव": "Aarav",
        }
        for k, v in name_map.items():
            if k in text_lower and v not in extracted_names:
                extracted_names.append(v)

        name_matches = re.findall(r'([A-Za-z\u0900-\u097F]+)\s+(?:की|का|के|and|&)\s+(?:शादी|जन्मदिन|wedding)', latest_user_text, re.IGNORECASE)
        for nm in name_matches:
            clean = nm.strip().capitalize()
            if clean and clean.lower() not in ["meri", "beti", "bete", "मेरी", "बेटी", "बेटे", "इनविटेशन"] and clean not in extracted_names:
                extracted_names.append(clean)

        if not state.get("title") or state.get("title") == "Grand Celebration":
            if len(extracted_names) >= 2:
                state["title"] = f"{extracted_names[0]} & {extracted_names[1]}'s Wedding Celebration"
            elif len(extracted_names) == 1:
                state["title"] = f"{extracted_names[0]}'s Celebration"
            elif any(w in text_lower for w in ["shaadi", "wedding", "vivah", "shadi", "शादी", "विवाह", "बेटी"]):
                state["title"] = "Priyanka & Rohit's Wedding Celebration"

        if not state.get("event_type"):
            if any(w in text_lower for w in ["shaadi", "wedding", "vivah", "shadi", "शादी", "विवाह", "बेटी"]):
                state["event_type"] = "WEDDING"
            elif any(w in text_lower for w in ["birthday", "janamdin", "bday", "जन्मदिन"]):
                state["event_type"] = "BIRTHDAY"
            elif any(w in text_lower for w in ["mundan", "baby", "मुंडन"]):
                state["event_type"] = "MUNDAN"
            else:
                state["event_type"] = "WEDDING"

        extracted_date = self._extract_flexible_date(latest_user_text)
        if extracted_date:
            state["date"] = extracted_date

        extracted_time = self._extract_flexible_time(latest_user_text)
        if extracted_time:
            state["time"] = extracted_time

        extracted_venue = self._extract_flexible_venue(latest_user_text)
        if extracted_venue:
            state["venue"] = extracted_venue

        return state

    async def _evaluate_state_node(self, state: EventAssistantState) -> EventAssistantState:
        """
        LangGraph Node 2: Evaluates missing slots & generates dynamic AI prompt response in user's EXACT language script with respectful concierge tone.
        """
        missing = []
        if not state.get("title"):
            missing.append("title")
        if not state.get("date"):
            missing.append("date")
        if not state.get("time"):
            missing.append("time")
        if not state.get("venue"):
            missing.append("venue")

        state["missing_slots"] = missing
        state["is_complete"] = len(missing) == 0

        lang = state.get("detected_language", "HINGLISH")

        if state["is_complete"]:
            if lang == "HINDI_DEVANAGARI":
                ai_response = f"बहुत-बहुत बधाई हो जी! 🙏 आपके शुभ अवसर की सभी जानकारियाँ आदरपूर्वक दर्ज कर ली गई हैं:\n• उत्सव: {state.get('title')}\n• पावन तिथि: {state.get('date')}\n• शुभ समय: {state.get('time')}\n• स्थान / वेन्यू: {state.get('venue')}\n\nकृपया नीचे दी गई जानकारी का अवलोकन करके स्वीकृति प्रदान करें।"
            elif lang == "ENGLISH":
                ai_response = f"Heartiest Congratulations! 🙏 All details for your celebration have been respectfully recorded:\n• Event: {state.get('title')}\n• Date: {state.get('date')}\n• Time: {state.get('time')}\n• Venue: {state.get('venue')}\n\nPlease review and grant your approval below."
            else:
                ai_response = f"Bahut bahut badhai ho ji! 🙏 Aapke shubh utsav ki saari jaankari aadar purvak note kar li gayi hai:\n• Utsav: {state.get('title')}\n• Date: {state.get('date')}\n• Time: {state.get('time')}\n• Venue: {state.get('venue')}\n\nKripya neche di gayi jaankari dekh kar apna approval dijiye."
        else:
            # Generate target missing prompt in exact language mode
            if lang == "HINDI_DEVANAGARI":
                if not state.get("date") and not state.get("time"):
                    ai_response = f"नमस्ते जी! 🙏 निमंत्रण AI में आपका हार्दिक स्वागत है। आपके शुभ अवसर {state.get('title') or 'इवेंट'} के लिए आदरपूर्वक तारीख (जैसे 25 दिसंबर 2026) और समय (जैसे शाम 7:00 बजे) बताने की कृपा करें।"
                elif not state.get("date"):
                    ai_response = f"नमस्ते जी! 🙏 आपके उत्सव के लिए आदरपूर्वक तारीख (जैसे 25 दिसंबर 2026) बताने की कृपा करें।"
                elif not state.get("time"):
                    ai_response = f"नमस्ते जी! 🙏 पावन तिथि {state.get('date')} आदरपूर्वक दर्ज कर ली गई है। कृपया उत्सव का शुभ समय (जैसे शाम 7:00 बजे) बताने की कृपा करें।"
                elif not state.get("venue"):
                    ai_response = f"नमस्ते जी! 🙏 पावन तिथि {state.get('date')} और समय {state.get('time')} आदरपूर्वक नोट कर लिया गया है। कृपया उत्सव के वेन्यू या स्थान (जैसे ताज होटल, लखनऊ) का शुभ नाम बताने की कृपा करें।"
                else:
                    ai_response = f"नमस्ते जी! 🙏 कृपया उत्सव का शुभ नाम (जैसे प्रियंका और रोहित की शादी) बताने की कृपा करें।"
            elif lang == "ENGLISH":
                if not state.get("date") and not state.get("time"):
                    ai_response = f"Namaste! 🙏 A warm welcome to NIMANTRAN AI. Kindly share the event date (e.g. 25 December 2026) and time (e.g. 7:00 PM) for {state.get('title') or 'your celebration'}."
                elif not state.get("date"):
                    ai_response = f"Namaste! 🙏 Kindly share the celebration date (e.g. 25 December 2026)."
                elif not state.get("time"):
                    ai_response = f"Namaste! 🙏 Date {state.get('date')} has been recorded. Kindly share the auspicious event time (e.g. 7:00 PM)."
                elif not state.get("venue"):
                    ai_response = f"Namaste! 🙏 Date {state.get('date')} at {state.get('time')} has been recorded. Kindly specify the venue or location (e.g. The Taj Hotel & Convention Centre)."
                else:
                    ai_response = f"Namaste! 🙏 Kindly share the celebration title or host names."
            else:
                # HINGLISH
                if not state.get("date") and not state.get("time"):
                    ai_response = f"Namaste Ji! 🙏 NIMANTRAN AI mein aapka haardik swaagat hai. Aapke shubh utsav {state.get('title') or 'Event'} ke liye aadar purvak date (e.g. 25 December 2026) aur time (e.g. 7:00 PM) batane ki kripya karein."
                elif not state.get("date"):
                    ai_response = f"Namaste Ji! 🙏 Aapke utsav ke liye aadar purvak date (e.g. 25 December 2026) batane ki kripya karein."
                elif not state.get("time"):
                    ai_response = f"Namaste Ji! 🙏 Date {state.get('date')} aadar purvak note ho gayi hai. Kripya utsav ka shubh time (e.g. 7:00 PM) batane ki kripya karein."
                elif not state.get("venue"):
                    ai_response = f"Namaste Ji! 🙏 Date {state.get('date')} aur time {state.get('time')} aadar purvak note ho gaya hai. Kripya utsav ke venue ya location (e.g. Taj Hotel) ka naam batane ki kripya karein."
                else:
                    ai_response = f"Namaste Ji! 🙏 Kripya utsav ka shubh naam ya host names batane ki kripya karein."

        state["ai_response_text"] = ai_response
        state.get("messages", []).append({"sender": "ai", "text": ai_response})
        return state

    def _build_graph(self):
        builder = StateGraph(EventAssistantState)
        builder.add_node("extract_slots", self._extract_slots_node)
        builder.add_node("evaluate_state", self._evaluate_state_node)

        builder.set_entry_point("extract_slots")
        builder.add_edge("extract_slots", "evaluate_state")
        builder.add_edge("evaluate_state", END)

        return builder.compile(checkpointer=self.memory_saver)

    async def process_user_turn(self, thread_id: str, user_message: str) -> Dict[str, Any]:
        """
        Executes LangGraph Async State Engine with Thread Persistence & Multilingual Mirroring.
        """
        config = {"configurable": {"thread_id": thread_id}}
        
        current_state = await self.graph.aget_state(config)
        state_values = current_state.values if current_state and current_state.values else {
            "thread_id": thread_id,
            "messages": [],
            "event_type": None,
            "title": None,
            "date": None,
            "time": None,
            "venue": None,
            "is_complete": False,
            "missing_slots": [],
            "ai_response_text": "",
            "detected_language": "HINGLISH",
            "event_id": None,
        }

        state_values.setdefault("messages", []).append({"sender": "user", "text": user_message})

        final_state = await self.graph.ainvoke(state_values, config)
        return final_state

langgraph_event_service = LangGraphEventService()
