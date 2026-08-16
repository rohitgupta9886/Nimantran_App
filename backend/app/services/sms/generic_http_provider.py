import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import httpx

from app.core.config import settings
from app.services.sms.provider_base import (
    BaseSMSProvider,
    SMSConfigStatus,
    SMSSendResult,
    SMSWebhookStatusUpdate,
)

logger = logging.getLogger("nimantran_ai.sms.fast2sms")


class Fast2SMSSMSProvider(BaseSMSProvider):
    """
    Fast2SMS (India Bulk & Quick SMS) Gateway Provider.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        sender_id: Optional[str] = None,
    ):
        self.api_key = api_key or getattr(settings, "FAST2SMS_API_KEY", None) or getattr(settings, "SMS_API_KEY", None)
        self.sender_id = sender_id or getattr(settings, "SMS_SENDER_ID", "NIMTRN")

    async def validate_configuration(self) -> SMSConfigStatus:
        if not self.api_key:
            return SMSConfigStatus(
                is_configured=False,
                provider_name="Fast2SMS Indian Gateway",
                sender_id=self.sender_id,
                missing_keys=["FAST2SMS_API_KEY / SMS_API_KEY"],
                message="Fast2SMS API key not configured.",
            )

        return SMSConfigStatus(
            is_configured=True,
            provider_name="Fast2SMS Indian Gateway",
            sender_id=self.sender_id,
            missing_keys=[],
            message="Fast2SMS Gateway active for Indian domestic numbers.",
        )

    async def send_sms(
        self,
        to_phone: str,
        message_text: str,
        sender_id: Optional[str] = None,
    ) -> SMSSendResult:
        if not self.api_key:
            return SMSSendResult(
                success=False,
                status="FAILED",
                error_message="Fast2SMS API key not configured.",
                error_code="CONFIG_MISSING",
                retryable=False,
            )

        # Fast2SMS expects 10 digit Indian number
        clean_number = to_phone.replace("+91", "").replace("+", "").strip()
        if len(clean_number) < 10:
            clean_number = clean_number[-10:]

        url = "https://www.fast2sms.com/dev/bulkV2"
        headers = {
            "authorization": self.api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "route": "q",
            "message": message_text,
            "language": "english",
            "flash": 0,
            "numbers": clean_number,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                resp_json = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}

                if res.status_code == 200 and resp_json.get("return") is True:
                    req_id = resp_json.get("request_id") or resp_json.get("message", [""])[0]
                    return SMSSendResult(
                        success=True,
                        provider_message_id=str(req_id),
                        status="SENT",
                        raw_response=resp_json,
                    )

                err_msg = resp_json.get("message", res.text)
                return SMSSendResult(
                    success=False,
                    status="FAILED",
                    error_message=str(err_msg),
                    error_code=str(res.status_code),
                    retryable=res.status_code >= 500,
                    raw_response=resp_json,
                )
        except Exception as ex:
            return SMSSendResult(
                success=False,
                status="FAILED",
                error_message=f"Fast2SMS error: {str(ex)}",
                error_code="NETWORK_ERROR",
                retryable=True,
            )

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[SMSWebhookStatusUpdate]:
        return []
