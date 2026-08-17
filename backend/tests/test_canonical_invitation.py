import pytest
from datetime import datetime, timezone
from pydantic import BaseModel
from app.models.event import Event, EventType
from app.models.guest import Guest
from app.schemas.invitation_content import CanonicalInvitationContent
from app.services.ai_service import AIService


@pytest.fixture
def mock_wedding_event():
    return Event(
        id="evt_test_wedding_123",
        user_id="usr_test_host",
        title="Rohit & Neha's Wedding Celebration",
        event_type="WEDDING",
        host_name="Gupta Family",
        co_host_name="Sharma Family",
        start_date=datetime(2026, 12, 25, 19, 0, tzinfo=timezone.utc),
        venue_name="Taj Mahal Palace Hotel",
        venue_address="Apollo Bunder, Colaba, Mumbai",
        slug="rohit-neha-2026",
        theme_config={
            "theme_id": "royal-amber",
            "canonical_invitation": {
                "greeting": "सपरिवार सादर निमंत्रण | Auspicious Wedding Invitation",
                "message": "With heartfelt joy, the Gupta & Sharma families invite you to celebrate the wedding union of Rohit and Neha.",
                "blessing": "|| वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ||",
                "closing": "With best compliments from Gupta & Sharma families.",
                "story": "Two souls united by destiny, blessed by love.",
                "language": "HINGLISH",
                "tone": "ROYAL",
            }
        }
    )


@pytest.fixture
def mock_guest():
    return Guest(
        id="gst_test_456",
        event_id="evt_test_wedding_123",
        name="Amitabh Bachchan",
        phone="+919876543210",
        invitation_token="token_amitabh_789",
    )


def test_canonical_invitation_content_consistency(mock_wedding_event, mock_guest):
    """
    Verifies that CanonicalInvitationContent ensures strict factual consistency
    across all communication channels without conflicting dates, venues, or names.
    """
    canonical = CanonicalInvitationContent.from_event(
        event=mock_wedding_event,
        ai_content=mock_wedding_event.theme_config.get("canonical_invitation"),
        public_base_url="https://nimantran.ai",
        guest_token=mock_guest.invitation_token,
    )

    # 1. Check Factual Fields
    assert canonical.event_id == "evt_test_wedding_123"
    assert canonical.event_type == "WEDDING"
    assert canonical.title == "Rohit & Neha's Wedding Celebration"
    assert canonical.host_name == "Gupta Family"
    assert canonical.date_formatted == "25 December 2026"
    assert canonical.time_formatted == "07:00 PM"
    assert canonical.venue_name == "Taj Mahal Palace Hotel"
    assert canonical.venue_address == "Apollo Bunder, Colaba, Mumbai"
    assert "https://nimantran.ai/i/rohit-neha-2026?guest=token_amitabh_789" in canonical.public_url

    # 2. Check AI Content Layer Separation
    assert canonical.greeting == "सपरिवार सादर निमंत्रण | Auspicious Wedding Invitation"
    assert "wedding union of Rohit and Neha" in canonical.message
    assert canonical.blessing == "|| वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ||"
    assert canonical.closing == "With best compliments from Gupta & Sharma families."
    assert canonical.story == "Two souls united by destiny, blessed by love."

    # 3. Check WhatsApp Channel Render
    whatsapp_text = canonical.render_whatsapp_text(
        guest_name=mock_guest.name,
        guest_token=mock_guest.invitation_token
    )
    assert "Amitabh Bachchan" in whatsapp_text
    assert "Rohit & Neha's Wedding Celebration" in whatsapp_text
    assert "25 December 2026" in whatsapp_text
    assert "07:00 PM" in whatsapp_text
    assert "Taj Mahal Palace Hotel" in whatsapp_text
    assert "https://nimantran.ai/i/rohit-neha-2026?guest=token_amitabh_789" in whatsapp_text

    # 4. Check SMS Channel Render
    sms_text = canonical.render_sms_text(
        guest_name=mock_guest.name,
        guest_token=mock_guest.invitation_token
    )
    assert "Amitabh Bachchan" in sms_text
    assert "25 December 2026" in sms_text
    assert "Taj Mahal Palace Hotel" in sms_text

    # 5. Check Email Channel Render
    email_subj, email_html = canonical.render_email_subject_and_body(
        guest_name=mock_guest.name,
        guest_token=mock_guest.invitation_token
    )
    assert "Rohit & Neha's Wedding Celebration" in email_subj
    assert "Amitabh Bachchan" in email_html
    assert "25 December 2026" in email_html
    assert "Taj Mahal Palace Hotel" in email_html
    assert "|| वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ||" in email_html

    # 6. Check QR Gate Pass Payload
    qr_payload = canonical.render_qr_pass_payload(
        guest_id=mock_guest.id,
        pass_code="PASS-9988"
    )
    assert qr_payload["event_id"] == "evt_test_wedding_123"
    assert qr_payload["event_title"] == "Rohit & Neha's Wedding Celebration"
    assert qr_payload["event_date"] == "25 December 2026"
    assert qr_payload["venue"] == "Taj Mahal Palace Hotel"
    assert qr_payload["pass_code"] == "PASS-9988"


@pytest.mark.asyncio
async def test_ai_service_canonical_invitation_generation(mock_wedding_event):
    """
    Verifies that AIService synthesizes canonical invitation content cleanly
    without requiring or generating unnecessary images.
    """
    ai_service = AIService()
    canonical = await ai_service.get_or_generate_canonical_invitation(
        event=mock_wedding_event,
        language="HINGLISH",
        tone="ROYAL",
    )

    assert isinstance(canonical, CanonicalInvitationContent)
    assert canonical.title == "Rohit & Neha's Wedding Celebration"
    assert canonical.venue_name == "Taj Mahal Palace Hotel"
    assert canonical.date_formatted == "25 December 2026"
    assert canonical.greeting is not None
    assert canonical.message is not None
