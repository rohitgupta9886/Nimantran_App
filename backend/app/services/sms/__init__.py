from app.core.config import settings
from app.services.sms.provider_base import (
    BaseSMSProvider,
    SMSConfigStatus,
    SMSSendResult,
    SMSWebhookStatusUpdate,
)
from app.services.sms.twilio_provider import TwilioSMSProvider
from app.services.sms.generic_http_provider import Fast2SMSSMSProvider
from app.services.sms.mock_provider import MockSMSProvider


def get_sms_provider() -> BaseSMSProvider:
    provider_name = (getattr(settings, "SMS_PROVIDER", "MOCK") or "MOCK").upper()

    if provider_name == "TWILIO":
        return TwilioSMSProvider()
    elif provider_name in ("FAST2SMS", "GENERIC_HTTP", "INDIAN_GATEWAY"):
        return Fast2SMSSMSProvider()
    else:
        return MockSMSProvider()


__all__ = [
    "BaseSMSProvider",
    "SMSConfigStatus",
    "SMSSendResult",
    "SMSWebhookStatusUpdate",
    "get_sms_provider",
]
