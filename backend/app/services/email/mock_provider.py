import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from app.services.email.provider_base import (
    BaseEmailProvider,
    EmailConfigStatus,
    EmailSendResult,
    EmailWebhookStatusUpdate,
)

logger = logging.getLogger("nimantran_ai.email.mock")


class MockEmailProvider(BaseEmailProvider):
    """
    Realistic Development Mock Email Provider.
    Simulates sending emails, verifying formatting, and returning delivery events.
    """

    async def validate_configuration(self) -> EmailConfigStatus:
        return EmailConfigStatus(
            is_configured=True,
            provider_name="Development / Mock Email Gateway",
            from_email="invitations@nimantran.ai",
            from_name="Nimantran AI Celebrations",
            missing_keys=[],
            message="Development Mock Email Gateway active. HTML invitations rendered and simulated.",
        )

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        recipient_name: Optional[str] = None,
    ) -> EmailSendResult:
        await asyncio.sleep(0.05)  # Simulate network hop

        if not to_email or "@" not in to_email or "." not in to_email.split("@")[-1]:
            return EmailSendResult(
                success=False,
                status="FAILED",
                error_message=f"Invalid email address format: {to_email}",
                error_code="INVALID_EMAIL",
                retryable=False,
            )

        mock_id = f"email_mock_{uuid.uuid4().hex[:12]}@nimantran.ai"
        logger.info(f"[DEV MOCK EMAIL] Sent to {to_email} ({recipient_name}): '{subject}' [ID: {mock_id}]")

        return EmailSendResult(
            success=True,
            provider_message_id=mock_id,
            status="SENT",
            raw_response={"mock": True, "to": to_email, "subject": subject, "message_id": mock_id},
        )

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[EmailWebhookStatusUpdate]:
        msg_id = payload.get("message_id") or payload.get("id") or f"mock_email_{uuid.uuid4().hex[:8]}"
        status = payload.get("status", "DELIVERED").upper()
        return [
            EmailWebhookStatusUpdate(
                provider_event_id=f"mock_email_ev_{uuid.uuid4().hex[:8]}",
                provider_message_id=msg_id,
                recipient_email=payload.get("to"),
                status=status,
                timestamp=datetime.now(timezone.utc),
                raw_payload=payload,
            )
        ]
