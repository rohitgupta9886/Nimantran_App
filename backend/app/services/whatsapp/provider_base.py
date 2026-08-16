from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any


@dataclass
class WhatsAppConfigStatus:
    is_configured: bool
    provider_name: str
    phone_number_id: Optional[str] = None
    business_account_id: Optional[str] = None
    webhook_configured: bool = False
    missing_keys: List[str] = field(default_factory=list)
    message: str = ""


@dataclass
class WhatsAppSendResult:
    success: bool
    provider_message_id: Optional[str] = None
    status: str = "SENT"  # SENT, FAILED, INVALID_NUMBER
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    retryable: bool = False
    raw_response: Optional[Dict[str, Any]] = None


@dataclass
class WhatsAppWebhookStatusUpdate:
    provider_event_id: str
    provider_message_id: str
    recipient_phone: Optional[str]
    status: str  # SENT, DELIVERED, READ, FAILED
    timestamp: datetime
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_payload: Dict[str, Any] = field(default_factory=dict)


class BaseWhatsAppProvider(ABC):
    """
    Abstract interface for WhatsApp Business Messaging Providers (Meta Cloud API, etc.)
    """

    @abstractmethod
    async def validate_configuration(self) -> WhatsAppConfigStatus:
        """Checks if provider credentials and endpoints are validly configured."""
        pass

    @abstractmethod
    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        language: str,
        components: List[Dict[str, Any]],
        fallback_text: str = "",
    ) -> WhatsAppSendResult:
        """Sends an approved WhatsApp Business template message."""
        pass

    @abstractmethod
    async def send_text_message(
        self,
        to_phone: str,
        text_body: str,
    ) -> WhatsAppSendResult:
        """Sends a standard text invitation message."""
        pass

    @abstractmethod
    def verify_webhook_signature(self, signature_header: Optional[str], raw_body: bytes) -> bool:
        """Verifies HMAC SHA256 signature from Meta webhook."""
        pass

    @abstractmethod
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[WhatsAppWebhookStatusUpdate]:
        """Parses webhook status callbacks into normalized updates."""
        pass
