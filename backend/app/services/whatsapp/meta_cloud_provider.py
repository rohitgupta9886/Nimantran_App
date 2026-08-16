import uuid
import hmac
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import httpx

from app.core.config import settings
from app.services.whatsapp.provider_base import (
    BaseWhatsAppProvider,
    WhatsAppConfigStatus,
    WhatsAppSendResult,
    WhatsAppWebhookStatusUpdate,
)

logger = logging.getLogger("nimantran_ai.whatsapp")


class MetaCloudWhatsAppProvider(BaseWhatsAppProvider):
    """
    Production Meta WhatsApp Business Platform (Cloud API) Provider.
    Calls official Facebook Graph API endpoints.
    """

    GRAPH_API_VERSION = "v19.0"
    BASE_URL = "https://graph.facebook.com"

    def __init__(
        self,
        access_token: Optional[str] = None,
        phone_number_id: Optional[str] = None,
        business_account_id: Optional[str] = None,
        verify_token: Optional[str] = None,
        app_secret: Optional[str] = None,
    ):
        self.access_token = access_token or settings.WHATSAPP_ACCESS_TOKEN
        self.phone_number_id = phone_number_id or settings.WHATSAPP_PHONE_NUMBER_ID
        self.business_account_id = business_account_id or settings.WHATSAPP_BUSINESS_ACCOUNT_ID
        self.verify_token = verify_token or settings.WHATSAPP_VERIFY_TOKEN
        self.app_secret = app_secret or getattr(settings, "WHATSAPP_APP_SECRET", None)

    async def validate_configuration(self) -> WhatsAppConfigStatus:
        missing = []
        if not self.access_token:
            missing.append("WHATSAPP_ACCESS_TOKEN")
        if not self.phone_number_id:
            missing.append("WHATSAPP_PHONE_NUMBER_ID")

        if missing:
            return WhatsAppConfigStatus(
                is_configured=False,
                provider_name="Meta WhatsApp Cloud API",
                phone_number_id=self.phone_number_id,
                business_account_id=self.business_account_id,
                webhook_configured=bool(self.verify_token),
                missing_keys=missing,
                message=f"WhatsApp Cloud API is not fully configured. Missing: {', '.join(missing)}. Connect your WhatsApp Business credentials.",
            )

        # Test reachability against Meta Graph API if credentials exist
        try:
            url = f"{self.BASE_URL}/{self.GRAPH_API_VERSION}/{self.phone_number_id}"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    display_num = data.get("display_phone_number", self.phone_number_id)
                    verified_name = data.get("verified_name", "Verified Business")
                    return WhatsAppConfigStatus(
                        is_configured=True,
                        provider_name="Meta WhatsApp Cloud API",
                        phone_number_id=self.phone_number_id,
                        business_account_id=self.business_account_id,
                        webhook_configured=bool(self.verify_token),
                        missing_keys=[],
                        message=f"Connected to WhatsApp Business Phone: {display_num} ({verified_name}).",
                    )
                else:
                    err_json = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = err_json.get("error", {}).get("message", res.text)
                    return WhatsAppConfigStatus(
                        is_configured=False,
                        provider_name="Meta WhatsApp Cloud API",
                        phone_number_id=self.phone_number_id,
                        business_account_id=self.business_account_id,
                        webhook_configured=bool(self.verify_token),
                        missing_keys=[],
                        message=f"Meta API authentication failed ({res.status_code}): {err_msg}",
                    )
        except Exception as e:
            return WhatsAppConfigStatus(
                is_configured=False,
                provider_name="Meta WhatsApp Cloud API",
                phone_number_id=self.phone_number_id,
                business_account_id=self.business_account_id,
                webhook_configured=bool(self.verify_token),
                missing_keys=[],
                message=f"Unable to connect to Meta WhatsApp Cloud API: {str(e)}",
            )

    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        language: str,
        components: List[Dict[str, Any]],
        fallback_text: str = "",
    ) -> WhatsAppSendResult:
        """
        Sends an official WhatsApp template message via Meta Cloud API.
        """
        if not self.access_token or not self.phone_number_id:
            return WhatsAppSendResult(
                success=False,
                status="FAILED",
                error_message="Meta WhatsApp Cloud API credentials are not configured.",
                error_code="CONFIG_MISSING",
                retryable=False,
            )

        # Meta expects recipient digits without '+' sign
        clean_recipient = to_phone.replace("+", "").strip()

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_recipient,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language or "hi"},
                "components": components,
            },
        }

        return await self._execute_post(payload, clean_recipient)

    async def send_text_message(
        self,
        to_phone: str,
        text_body: str,
    ) -> WhatsAppSendResult:
        """
        Sends a personalized text message with link preview enabled via Meta Cloud API.
        """
        if not self.access_token or not self.phone_number_id:
            return WhatsAppSendResult(
                success=False,
                status="FAILED",
                error_message="Meta WhatsApp Cloud API credentials are not configured.",
                error_code="CONFIG_MISSING",
                retryable=False,
            )

        clean_recipient = to_phone.replace("+", "").strip()

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_recipient,
            "type": "text",
            "text": {
                "preview_url": True,
                "body": text_body,
            },
        }

        return await self._execute_post(payload, clean_recipient)

    async def _execute_post(self, payload: Dict[str, Any], recipient: str) -> WhatsAppSendResult:
        url = f"{self.BASE_URL}/{self.GRAPH_API_VERSION}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                resp_text = response.text
                
                try:
                    resp_json = response.json()
                except Exception:
                    resp_json = {"raw": resp_text}

                if response.status_code in (200, 201):
                    # Successful submission to Meta Cloud API
                    messages = resp_json.get("messages", [])
                    message_id = messages[0].get("id") if messages else None
                    return WhatsAppSendResult(
                        success=True,
                        provider_message_id=message_id,
                        status="SENT",
                        raw_response=resp_json,
                    )

                # Error handling from Meta API
                err_data = resp_json.get("error", {})
                code = err_data.get("code")
                subcode = err_data.get("error_subcode")
                message = err_data.get("message", resp_text)
                details = err_data.get("error_data", {}).get("details", "")
                full_err = f"{message} {f'({details})' if details else ''}".strip()

                # Determine retryability
                # Rate limits (130429, 130430, 80007) and 5xx are retryable
                # Invalid number (131026, 100), template not found (132001) are not retryable
                retryable = False
                if response.status_code >= 500 or code in (130429, 130430, 80007, 4, 17, 32):
                    retryable = True

                status = "FAILED"
                if code in (100, 131026):
                    status = "INVALID_NUMBER"

                logger.warning(f"Meta WhatsApp API Error [{code}/{subcode}]: {full_err} for {recipient}")

                return WhatsAppSendResult(
                    success=False,
                    status=status,
                    error_message=full_err or f"HTTP {response.status_code} from Meta API",
                    error_code=str(code or response.status_code),
                    retryable=retryable,
                    raw_response=resp_json,
                )

        except httpx.TimeoutException:
            return WhatsAppSendResult(
                success=False,
                status="FAILED",
                error_message="Meta WhatsApp API request timed out",
                error_code="TIMEOUT",
                retryable=True,
            )
        except Exception as ex:
            return WhatsAppSendResult(
                success=False,
                status="FAILED",
                error_message=f"Network error connecting to Meta WhatsApp API: {str(ex)}",
                error_code="NETWORK_ERROR",
                retryable=True,
            )

    def verify_webhook_signature(self, signature_header: Optional[str], raw_body: bytes) -> bool:
        """
        Verifies X-Hub-Signature-256 header sent by Meta using HMAC SHA256.
        """
        if not self.app_secret:
            # If app secret not configured, verify token check handles GET challenge
            return True

        if not signature_header or not signature_header.startswith("sha256="):
            return False

        expected_sig = signature_header.split("sha256=", 1)[1].strip()
        computed_sig = hmac.new(
            self.app_secret.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_sig, computed_sig)

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[WhatsAppWebhookStatusUpdate]:
        """
        Parses Meta WhatsApp Webhook event payload into a list of normalized status updates.
        """
        updates: List[WhatsAppWebhookStatusUpdate] = []

        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                statuses = value.get("statuses", [])
                
                for st in statuses:
                    msg_id = st.get("id")
                    if not msg_id:
                        continue

                    raw_status = st.get("status", "").upper()
                    # Meta statuses: "sent", "delivered", "read", "failed"
                    norm_status = "SENT"
                    if raw_status == "DELIVERED":
                        norm_status = "DELIVERED"
                    elif raw_status == "READ":
                        norm_status = "READ"
                    elif raw_status == "FAILED":
                        norm_status = "FAILED"

                    ts_val = st.get("timestamp")
                    try:
                        timestamp = datetime.fromtimestamp(int(ts_val), tz=timezone.utc) if ts_val else datetime.now(timezone.utc)
                    except Exception:
                        timestamp = datetime.now(timezone.utc)

                    recipient = st.get("recipient_id")
                    
                    err_code = None
                    err_msg = None
                    errors = st.get("errors", [])
                    if errors:
                        err_code = str(errors[0].get("code", ""))
                        err_msg = errors[0].get("title", "") or errors[0].get("message", "")

                    # Create a deterministic provider event id for deduplication
                    event_id = f"meta_{msg_id}_{norm_status}_{ts_val or int(timestamp.timestamp())}"

                    updates.append(
                        WhatsAppWebhookStatusUpdate(
                            provider_event_id=event_id,
                            provider_message_id=msg_id,
                            recipient_phone=recipient,
                            status=norm_status,
                            timestamp=timestamp,
                            error_code=err_code,
                            error_message=err_msg,
                            raw_payload=st,
                        )
                    )

        return updates


class MockWhatsAppProvider(BaseWhatsAppProvider):
    """
    Realistic Development Mock WhatsApp Provider.
    Simulates Meta WhatsApp Business Cloud API responses with zero external dependencies.
    """

    async def validate_configuration(self) -> WhatsAppConfigStatus:
        return WhatsAppConfigStatus(
            is_configured=True,
            provider_name="Development / Mock WhatsApp (Cloud API Simulator)",
            phone_number_id="mock_phone_919876543210",
            business_account_id="mock_waba_1001",
            webhook_configured=True,
            missing_keys=[],
            message="Development Mock Mode Active. Simulates Meta Cloud API with instant test delivery.",
        )

    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        language: str,
        components: List[Dict[str, Any]],
        fallback_text: str = "",
    ) -> WhatsAppSendResult:
        mock_msg_id = f"wamid.HBgLMock{to_phone.replace('+', '')}V{uuid.uuid4().hex[:10]}"
        logger.info(f"[DEV MOCK WHATSAPP] Template '{template_name}' sent to {to_phone} [ID: {mock_msg_id}]")
        return WhatsAppSendResult(
            success=True,
            provider_message_id=mock_msg_id,
            status="SENT",
            raw_response={"messaging_product": "whatsapp", "messages": [{"id": mock_msg_id}]},
        )

    async def send_text_message(
        self,
        to_phone: str,
        text_body: str,
    ) -> WhatsAppSendResult:
        mock_msg_id = f"wamid.HBgLMockText{to_phone.replace('+', '')}V{uuid.uuid4().hex[:10]}"
        logger.info(f"[DEV MOCK WHATSAPP] Text invitation sent to {to_phone}: {text_body[:80]}... [ID: {mock_msg_id}]")
        return WhatsAppSendResult(
            success=True,
            provider_message_id=mock_msg_id,
            status="SENT",
            raw_response={"messaging_product": "whatsapp", "messages": [{"id": mock_msg_id}]},
        )

    def verify_webhook_signature(self, signature_header: Optional[str], raw_body: bytes) -> bool:
        return True

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[WhatsAppWebhookStatusUpdate]:
        # Handle simple mock payload or Meta payload format
        if "entry" in payload:
            return MetaCloudWhatsAppProvider().parse_webhook_payload(payload)

        msg_id = payload.get("message_id") or payload.get("id") or f"wamid.Mock{uuid.uuid4().hex[:10]}"
        status = payload.get("status", "DELIVERED").upper()
        return [
            WhatsAppWebhookStatusUpdate(
                provider_event_id=f"mock_wa_ev_{uuid.uuid4().hex[:8]}",
                provider_message_id=msg_id,
                recipient_phone=payload.get("to") or payload.get("recipient_id"),
                status=status,
                timestamp=datetime.now(timezone.utc),
                raw_payload=payload,
            )
        ]


def get_whatsapp_provider() -> BaseWhatsAppProvider:
    """
    Factory function returning the active WhatsApp Provider instance.
    """
    provider_type = (getattr(settings, "WHATSAPP_PROVIDER", "MOCK") or "MOCK").upper()
    if provider_type in ("META", "REAL", "PRODUCTION") and settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID:
        return MetaCloudWhatsAppProvider()
    elif provider_type == "MOCK":
        return MockWhatsAppProvider()
    else:
        # If set to META but missing keys, return MetaCloudWhatsAppProvider so validate_configuration reports missing keys
        return MetaCloudWhatsAppProvider()

