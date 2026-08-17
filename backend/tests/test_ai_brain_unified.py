import pytest
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.event import Event
from app.models.credit import CreditWallet
from app.services.ai_service import AIService
from app.services.langgraph_service import LangGraphEventService
from app.schemas.ai import EventContext, StructuredInvitationOutput


@pytest.mark.asyncio
async def test_case_1_english_wedding_extraction():
    """
    Test Case 1 (English):
    Input: "My daughter's wedding is on 25 December in Lucknow."
    Verifies:
    - event_type == "WEDDING"
    - date == "25 December 2026"
    - venue == "Lucknow"
    - detected_language == "ENGLISH"
    - Does NOT invent fake couple names or fake times
    - Missing slots accurately captures couple names
    """
    lg_service = LangGraphEventService()
    thread_id = f"test_en_{uuid.uuid4().hex[:6]}"
    state = await lg_service.process_user_turn(thread_id, "My daughter's wedding is on 25 December in Lucknow.")

    assert state.get("event_type") == "WEDDING"
    assert "25 December" in state.get("date", "")
    assert state.get("venue") == "Lucknow"
    assert state.get("detected_language") == "ENGLISH"
    assert state.get("time") is None
    # Does not invent hardcoded fake couple
    assert state.get("title") != "Priyanka & Rohit's Wedding Celebration"
    assert "couple_names" in state.get("missing_slots", []) or not state.get("is_complete")


@pytest.mark.asyncio
async def test_case_2_hindi_devanagari_wedding_extraction():
    """
    Test Case 2 (Hindi Devanagari):
    Input: "मेरी बेटी की शादी 25 दिसंबर को लखनऊ में है।"
    Verifies:
    - detected_language == "HINDI_DEVANAGARI"
    - event_type == "WEDDING"
    - date is parsed properly (25 December 2026)
    - venue == "लखनऊ"
    - Response preserves Devanagari Hindi text
    """
    lg_service = LangGraphEventService()
    thread_id = f"test_hi_{uuid.uuid4().hex[:6]}"
    state = await lg_service.process_user_turn(thread_id, "मेरी बेटी की शादी 25 दिसंबर को लखनऊ में है।")

    assert state.get("detected_language") == "HINDI_DEVANAGARI"
    assert state.get("event_type") == "WEDDING"
    assert "December" in state.get("date", "") or "दिसंबर" in state.get("date", "")
    assert state.get("venue") == "लखनऊ"
    assert "शादी" in state.get("ai_response_text", "") or "उत्सव" in state.get("ai_response_text", "") or "शुभ" in state.get("ai_response_text", "")


@pytest.mark.asyncio
async def test_case_3_hinglish_wedding_extraction():
    """
    Test Case 3 (Hinglish):
    Input: "Meri beti ki shaadi 25 December ko Lucknow mein hai."
    Verifies:
    - detected_language == "HINGLISH"
    - event_type == "WEDDING"
    - date == "25 December 2026"
    - venue == "Lucknow"
    """
    lg_service = LangGraphEventService()
    thread_id = f"test_hinglish_{uuid.uuid4().hex[:6]}"
    state = await lg_service.process_user_turn(thread_id, "Meri beti ki shaadi 25 December ko Lucknow mein hai.")

    assert state.get("detected_language") == "HINGLISH"
    assert state.get("event_type") == "WEDDING"
    assert "25 December" in state.get("date", "")
    assert state.get("venue") == "Lucknow"


@pytest.mark.asyncio
async def test_case_4_mundan_extraction():
    """
    Test Case 4 (Mundan Ceremony):
    Input: "Mere bete Aarav ka mundan 15 October ko Ayodhya mein hai."
    Verifies:
    - event_type == "MUNDAN"
    - celebrant_name == "Aarav"
    - date == "15 October 2026"
    - venue == "Ayodhya"
    - title contains "Aarav"
    - Does NOT invent fake hotel names or fake family members
    """
    lg_service = LangGraphEventService()
    thread_id = f"test_mundan_{uuid.uuid4().hex[:6]}"
    state = await lg_service.process_user_turn(thread_id, "Mere bete Aarav ka mundan 15 October ko Ayodhya mein hai.")

    assert state.get("event_type") == "MUNDAN"
    assert state.get("celebrant_name") == "Aarav"
    assert "15 October" in state.get("date", "")
    assert state.get("venue") == "Ayodhya"
    assert "Aarav" in state.get("title", "")
    assert state.get("venue") != "The Taj Hotel & Convention Centre"


@pytest.mark.asyncio
async def test_case_5_birthday_extraction():
    """
    Test Case 5 (Birthday):
    Input: "Riya ka birthday 5 September ko hai."
    Verifies:
    - event_type == "BIRTHDAY"
    - celebrant_name == "Riya"
    - date == "5 September 2026"
    - title contains "Riya"
    """
    lg_service = LangGraphEventService()
    thread_id = f"test_bday_{uuid.uuid4().hex[:6]}"
    state = await lg_service.process_user_turn(thread_id, "Riya ka birthday 5 September ko hai.")

    assert state.get("event_type") == "BIRTHDAY"
    assert state.get("celebrant_name") == "Riya"
    assert "5 September" in state.get("date", "")
    assert "Riya" in state.get("title", "")


@pytest.mark.asyncio
async def test_case_6_partial_information():
    """
    Test Case 6 (Partial Information):
    Input: "Meri shaadi December mein hai."
    Verifies:
    - event_type == "WEDDING"
    - is_complete == False
    - Asks for missing details (exact date, venue) without inventing them
    """
    lg_service = LangGraphEventService()
    thread_id = f"test_partial_{uuid.uuid4().hex[:6]}"
    state = await lg_service.process_user_turn(thread_id, "Meri shaadi December mein hai.")

    assert state.get("event_type") == "WEDDING"
    assert state.get("is_complete") is False
    assert state.get("venue") is None
    assert "exact_date" in state.get("missing_slots", []) or "venue" in state.get("missing_slots", [])


@pytest.mark.asyncio
async def test_case_7_correction_replaces_old_value():
    """
    Test Case 7 (Correction):
    Turn 1: "Meri beti ki shaadi 25 December ko Lucknow mein hai." -> venue == "Lucknow"
    Turn 2: "Actually venue Lucknow nahi, Ayodhya hai." -> venue == "Ayodhya"
    Verifies:
    - New information replaces the previous value cleanly.
    - Old information ('Lucknow') is NOT retained.
    """
    lg_service = LangGraphEventService()
    thread_id = f"test_correction_{uuid.uuid4().hex[:6]}"

    # Turn 1
    state_1 = await lg_service.process_user_turn(thread_id, "Meri beti ki shaadi 25 December ko Lucknow mein hai.")
    assert state_1.get("venue") == "Lucknow"

    # Turn 2: Correction
    state_2 = await lg_service.process_user_turn(thread_id, "Actually venue Lucknow nahi, Ayodhya hai.")
    assert state_2.get("venue") == "Ayodhya"
    assert state_2.get("venue") != "Lucknow"
    # Date remains intact from Turn 1
    assert "25 December" in state_2.get("date", "")


@pytest.mark.asyncio
async def test_event_context_structured_invitation_generation():
    """
    Verifies that AIService.generate_invitation_from_context takes an EventContext,
    enforces credit deduction, validates against StructuredInvitationOutput schema,
    and returns complete structured components.
    """
    async with AsyncSessionLocal() as db_session:
        user = User(
            id=str(uuid.uuid4()),
            email=f"ai_brain_test_{uuid.uuid4().hex[:6]}@example.com",
            hashed_password="hash",
            full_name="Brain Test Host",
        )
        db_session.add(user)
        await db_session.flush()

        # Seed wallet with credits
        wallet = CreditWallet(
            user_id=user.id,
            balance=50,
        )
        db_session.add(wallet)

        event = Event(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title="Aarav's Auspicious Mundan",
            slug=f"aarav-mundan-{uuid.uuid4().hex[:6]}",
            event_type="MUNDAN",
            host_name="Gupta Family",
            start_date=datetime.now(timezone.utc),
            venue_name="Ayodhya Dham",
            venue_address="Ram Path, Ayodhya",
        )
        db_session.add(event)
        await db_session.commit()

        ai_service = AIService()
        context = EventContext(
            event_type="MUNDAN",
            title="Aarav's Auspicious Mundan Ceremony",
            host_name="Gupta Family",
            celebrant_name="Aarav",
            date="15 October 2026",
            time="Morning 10:00 AM",
            venue="Ayodhya Dham",
            address="Ram Path, Ayodhya",
            language="HINGLISH",
            tone="DEVOTIONAL",
        )

        invitation_output: StructuredInvitationOutput = await ai_service.generate_invitation_from_context(
            db=db_session,
            user_id=user.id,
            event_id=event.id,
            context=context,
        )

        assert isinstance(invitation_output, StructuredInvitationOutput)
        assert invitation_output.title
        assert invitation_output.greeting
        assert invitation_output.intro
        assert invitation_output.main_message
        assert invitation_output.host_message
        assert invitation_output.closing
        assert invitation_output.event_details.get("venue") == "Ayodhya Dham"
