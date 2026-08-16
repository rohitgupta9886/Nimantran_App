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

logger = logging.getLogger("nimantran_ai.sms.twilio")


class TwilioSMSProvider(BaseSMSProvider):
    """
    Production Twilio SMS Provider.
    """

    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_phone_or_sender_id: Optional[str] = None,
    ):
        self.account_sid = account_sid or getattr(settings, "TWILIO_ACCOUNT_SID", None)
        self.auth_token = auth_token or getattr(settings, "TWILIO_AUTH_TOKEN", None)
        self.from_number = from_phone_or_sender_id or getattr(settings, "TWILIO_PHONE_NUMBER", None) or getattr(settings, "SMS_SENDER_ID", None)

    async def validate_configuration(self) -> SMSConfigStatus:
        missing = []
        if not self.account_sid:
            missing.append("TWILIO_ACCOUNT_SID")
        if not self.auth_token:
            missing.append("TWILIO_AUTH_TOKEN")
        if not self.from_number:
            missing.append("TWILIO_PHONE_NUMBER")

        if missing:
            return SMSConfigStatus(
                is_configured=False,
                provider_name="Twilio SMS",
                sender_id=self.from_number,
                missing_keys=missing,
                message=f"Twilio SMS is not configured. Missing: {', '.join(missing)}.",
            )

        return SMSConfigStatus(
            is_configured=True,
            provider_name="Twilio SMS",
            sender_id=self.from_number,
            missing_keys=[],
            message=f"Configured with Twilio Sender Number: {self.from_number}",
        )

    async def send_sms(
        self,
        to_phone: str,
        message_text: str,
        sender_id: Optional[str] = None,
    ) -> SMSSendResult:
        if not self.account_sid or not self.auth_token:
            return SMSSendResult(
                success=False,
                status="FAILED",
                error_message="Twilio SMS credentials are not configured.",
                error_code="CONFIG_MISSING",
                retryable=False,
            )

        from_num = sender_id or self.from_number
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        auth = (self.account_sid, self.auth_token)
        data = {
            "To": to_phone if to_phone.startswith("+") else f"+{to_phone}",
            "From": from_num,
            "Body": message_text,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, data=data, auth=auth)
                resp_json = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}

                if res.status_code in (200, 201):
                    msg_id = resp_json.get("sid")
                    return SMSSendResult(
                        success=True,
                        provider_message_id=msg_id,
                        status="SENT",
                        raw_response=resp_json,
                    )

                err_msg = resp_json.get("message", res.text)
                err_code = str(resp_json.get("code", res.status_code))
                retryable = res.status_code >= 500 or err_code in ("20429", "30001", "30002")

                return SMSSendResult(
                    success=False,
                    status="FAILED",
                    error_message=err_msg,
                    error_code=err_code,
                    retryable=retryable,
                    raw_response=resp_json,
                )
        except httpx.TimeoutException:
            return SMSSendResult(
                success=False,
                status="FAILED",
                error_message="Twilio SMS request timed out",
                error_code="TIMEOUT",
                retryable=True,
            )
        except Exception as ex:
            return SMSSendResult(
                success=False,
                status="FAILED",
                error_message=f"Twilio network error: {str(ex)}",
                error_code="NETWORK_ERROR",
                retryable=True,
            )

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[SMSWebhookStatusUpdate]:
        msg_sid = payload.get("MessageSid") or payload.get("SmsSid")
        if not msg_sid:
            return []

        status_raw = payload.get("MessageStatus", "").upper()
        norm_status = "SENT"
        if status_raw in ("DELIVERED", "SENT"):
            norm_status = "DELIVERED"
        elif status_raw in ("FAILED", "UNDELIVERED"):
            norm_status = "FAILED"

        event_id = f"twilio_{msg_sid}_{norm_status}_{int(datetime.now(timezone.utc).timestamp())}"
        return [
            SMSWebhookStatusUpdate(
                provider_event_id=event_id,
                provider_message_id=msg_sid,
                recipient_phone=payload.get("To"),
                status=norm_status,
                timestamp=datetime.now(timezone.utc),
                error_code=payload.get("ErrorCode"),
                error_message=payload.get("ErrorMessage"),
                raw_payload=payload,
            )
        ]
