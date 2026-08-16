import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from app.services.sms.provider_base import (
    BaseSMSProvider,
    SMSConfigStatus,
    SMSSendResult,
    SMSWebhookStatusUpdate,
)

logger = logging.getLogger("nimantran_ai.sms.mock")


class MockSMSProvider(BaseSMSProvider):
    """
    Realistic Development Mock SMS Provider.
    Simulates real SMS delivery cycle without incurring telecom charges.
    """

    async def validate_configuration(self) -> SMSConfigStatus:
        return SMSConfigStatus(
            is_configured=True,
            provider_name="Development / Mock SMS Gateway",
            sender_id="NIMTRN",
            missing_keys=[],
            message="Development Mock SMS Gateway active. Messages will simulate delivery receipts.",
        )

    async def send_sms(
        self,
        to_phone: str,
        message_text: str,
        sender_id: Optional[str] = None,
    ) -> SMSSendResult:
        await asyncio.sleep(0.05)  # Simulate network hop

        # Simulate invalid phone number if too short
        clean_digits = "".join(filter(str.isdigit, to_phone))
        if len(clean_digits) < 8:
            return SMSSendResult(
                success=False,
                status="INVALID_NUMBER",
                error_message="Invalid recipient phone number format for SMS dispatch.",
                error_code="INVALID_RECIPIENT",
                retryable=False,
            )

        mock_id = f"sms_mock_{uuid.uuid4().hex[:12]}"
        logger.info(f"[DEV MOCK SMS] Sent to {to_phone}: {message_text[:80]}... [ID: {mock_id}]")

        return SMSSendResult(
            success=True,
            provider_message_id=mock_id,
            status="SENT",
            raw_response={"mock": True, "to": to_phone, "sid": mock_id},
        )

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[SMSWebhookStatusUpdate]:
        msg_id = payload.get("message_id") or payload.get("id") or f"mock_{uuid.uuid4().hex[:8]}"
        status = payload.get("status", "DELIVERED").upper()
        return [
            SMSWebhookStatusUpdate(
                provider_event_id=f"mock_sms_ev_{uuid.uuid4().hex[:8]}",
                provider_message_id=msg_id,
                recipient_phone=payload.get("to"),
                status=status,
                timestamp=datetime.now(timezone.utc),
                raw_payload=payload,
            )
        ]
