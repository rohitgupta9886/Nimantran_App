import asyncio
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from app.core.config import Settings
from app.integrations.ai.gemini_ai import GoogleGeminiAIProvider
from app.integrations.ai.mock_ai import MockAIProvider
from app.services.ai_service import AIService


def test_ai_configuration_defaults_and_resolution():
    """Verify AI configuration defaults to gemini-2.5-flash and respects precedence."""
    # 1. Default model
    s1 = Settings(AI_MODEL="gemini-2.5-flash")
    assert s1.effective_ai_model == "gemini-2.5-flash"

    # 2. Custom AI_MODEL override
    s2 = Settings(AI_MODEL="gemini-2.5-pro")
    assert s2.effective_ai_model == "gemini-2.5-pro"

    # 3. Backward compatibility with GEMINI_MODEL if AI_MODEL is unset
    s3 = Settings(AI_MODEL="", GEMINI_MODEL="gemini-2.5-flash-custom")
    assert s3.effective_ai_model == "gemini-2.5-flash-custom"

    # 4. API Key precedence: GEMINI_API_KEY > GOOGLE_API_KEY > AI_API_KEY
    s_key1 = Settings(GEMINI_API_KEY="key_gemini", GOOGLE_API_KEY="key_google", AI_API_KEY="key_ai")
    assert s_key1.effective_gemini_key == "key_gemini"

    s_key2 = Settings(GEMINI_API_KEY=None, GOOGLE_API_KEY="key_google", AI_API_KEY="key_ai")
    assert s_key2.effective_gemini_key == "key_google"

    s_key3 = Settings(GEMINI_API_KEY=None, GOOGLE_API_KEY=None, AI_API_KEY="key_ai")
    assert s_key3.effective_gemini_key == "key_ai"


def test_gemini_provider_initialization_and_url_sanitization():
    """Verify endpoint uses configured model and sanitizes logs."""
    provider = GoogleGeminiAIProvider(api_key="secret_test_key_12345", model_name="gemini-2.5-flash")
    assert provider.model_name == "gemini-2.5-flash"
    assert "models/gemini-2.5-flash:generateContent" in provider.endpoint_url
    assert "secret_test_key_12345" in provider.endpoint_url
    assert "secret_test_key_12345" not in provider.sanitized_endpoint
    assert "key=REDACTED" in provider.sanitized_endpoint


def test_json_extraction_and_safe_parsing():
    """Verify JSON parsing safely strips markdown codeblocks and recovers valid JSON."""
    provider = GoogleGeminiAIProvider(api_key="test_key", model_name="gemini-2.5-flash")

    # 1. Clean JSON string
    raw_clean = '{"title": "Grand Wedding", "main_message": "Join us!"}'
    parsed1 = provider._extract_and_parse_json(raw_clean)
    assert parsed1 == {"title": "Grand Wedding", "main_message": "Join us!"}

    # 2. Markdown codeblock wrapped JSON
    raw_markdown = '```json\n{\n  "title": "Auspicious Mundan",\n  "main_message": "Bless the child"\n}\n```'
    parsed2 = provider._extract_and_parse_json(raw_markdown)
    assert parsed2 == {"title": "Auspicious Mundan", "main_message": "Bless the child"}

    # 3. Text surrounding JSON object
    raw_surrounded = 'Here is the response:\n{\n  "title": "Birthday Gala",\n  "main_message": "Celebration"\n}\nHope you like it!'
    parsed3 = provider._extract_and_parse_json(raw_surrounded)
    assert parsed3 == {"title": "Birthday Gala", "main_message": "Celebration"}

    # 4. Completely invalid text -> safe None (never crashes)
    raw_invalid = "This is not json at all."
    parsed4 = provider._extract_and_parse_json(raw_invalid)
    assert parsed4 is None


@pytest.mark.asyncio
async def test_mock_structured_invitation_generation():
    """Verify structured invitation generation in Mock provider."""
    mock_provider = MockAIProvider()
    
    # 1. Hindi mode
    res_hi = await mock_provider.generate_structured_invitation(
        event_type="WEDDING",
        host_name="Rohit & Priyanka",
        venue="Taj Mahal Palace",
        date_str="25 December 2026",
        tone="TRADITIONAL",
        language="HI",
        style="Traditional Indian",
    )
    assert "title" in res_hi
    assert "greeting" in res_hi
    assert "main_message" in res_hi
    assert "|| श्री गणेशाय नमः ||" in res_hi["greeting"]
    assert "Taj Mahal Palace" in res_hi["event_details"]

    # 2. Hinglish mode
    res_hinglish = await mock_provider.generate_structured_invitation(
        event_type="BIRTHDAY",
        host_name="Sharma Family",
        venue="Heritage Lawns",
        tone="MODERN",
        language="HINGLISH",
    )
    assert "special bana degi" in res_hinglish["main_message"]

    # 3. English mode
    res_en = await mock_provider.generate_structured_invitation(
        event_type="ANNIVERSARY",
        host_name="Gupta Family",
        venue="Grand Ballroom",
        tone="ELEGANT",
        language="EN",
    )
    assert "honor of your gracious presence" in res_en["intro"]


@pytest.mark.asyncio
async def test_mock_invitation_rewriting_and_chatbot():
    """Verify rewriting, polishing, and interactive chatbot assistant."""
    mock_provider = MockAIProvider()

    # Rewriting
    rewrite_res = await mock_provider.improve_or_rewrite_invitation(
        original_text="Join us for our wedding celebration.",
        instruction="Make it royal and emotional in Hindi",
        target_tone="Royal",
        target_language="Hindi",
    )
    assert "improved_text" in rewrite_res
    assert rewrite_res["tone"] == "Royal"

    # Chatbot
    chat_reply = await mock_provider.chat_invitation_assistant(
        messages=[{"role": "user", "content": "How do I write an invitation for my baby's mundan ceremony?"}]
    )
    assert "Nimantran AI" in chat_reply


@pytest.mark.asyncio
async def test_mock_personalized_guest_invitation():
    """Verify personalized message incorporates relationship without inventing facts."""
    mock_provider = MockAIProvider()
    guest_msg = await mock_provider.generate_personalized_guest_invitation(
        guest_name="Rajesh Sharma",
        relationship="Uncle (Father's Elder Brother)",
        event_title="Aarav's Grand Wedding",
        host_name="Gupta Family",
        venue="The Oberoi Grand",
        date_str="15 November 2026",
        invitation_link="https://nimantran.app/invite/123",
        tone="WARM",
        language="HI_EN",
    )
    assert "Rajesh Sharma (Uncle (Father's Elder Brother))" in guest_msg
    assert "The Oberoi Grand" in guest_msg
    assert "https://nimantran.app/invite/123" in guest_msg


@pytest.mark.asyncio
async def test_gemini_provider_mocked_http_structured_invitation():
    """Verify GoogleGeminiAIProvider parses live response from Gemini 2.5 Flash."""
    provider = GoogleGeminiAIProvider(api_key="mock_api_key_valid", model_name="gemini-2.5-flash")

    mock_gemini_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps({
                                "title": "Shubh Vivah Celebration",
                                "greeting": "|| श्री गणेशाय नमः ||",
                                "intro": "With the divine blessings of elders, Gupta family cordially invites you.",
                                "main_message": "Join us to celebrate the joyous union of Rahul & Priya.",
                                "event_details": "Date: 22 Dec 2026 | Venue: The Oberoi",
                                "host_message": "Warm regards from Gupta Family",
                                "closing": "दर्शनाभिलाषी: समस्त परिवार",
                                "language": "HI_EN",
                                "tone": "TRADITIONAL",
                                "style": "Traditional Indian",
                                "title_text": "Shubh Vivah Celebration",
                                "message_text": "|| श्री गणेशाय नमः ||\n\nJoin us for Shubh Vivah!"
                            })
                        }
                    ]
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_gemini_response

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await provider.generate_structured_invitation(
            event_type="WEDDING",
            host_name="Gupta Family",
            venue="The Oberoi",
            date_str="22 Dec 2026",
            tone="TRADITIONAL",
            language="HI_EN",
        )

        assert result["title"] == "Shubh Vivah Celebration"
        assert result["greeting"] == "|| श्री गणेशाय नमः ||"
        assert result["closing"] == "दर्शनाभिलाषी: समस्त परिवार"
        assert mock_post.called


@pytest.mark.asyncio
async def test_gemini_provider_rate_limit_retry_handling():
    """Verify Gemini provider retries on 429 and eventually falls back gracefully."""
    provider = GoogleGeminiAIProvider(api_key="mock_api_key_valid", model_name="gemini-2.5-flash")

    # Simulate 429 rate limit response
    mock_429_resp = MagicMock()
    mock_429_resp.status_code = 429
    mock_429_resp.text = "RESOURCE_EXHAUSTED: Rate limit exceeded"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            mock_post.return_value = mock_429_resp

            # Should attempt retry then cleanly fall back to mock without raising an uncaught exception
            result = await provider.generate_structured_invitation(
                event_type="WEDDING",
                host_name="Sharma Family",
                venue="Royal Lawns",
            )

            # Fallback returns valid structured data
            assert result is not None
            assert "title" in result
            assert mock_sleep.called
