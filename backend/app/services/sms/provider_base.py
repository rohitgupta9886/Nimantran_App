from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any


@dataclass
class SMSConfigStatus:
    is_configured: bool
    provider_name: str
    sender_id: Optional[str] = None
    missing_keys: List[str] = field(default_factory=list)
    message: str = ""


@dataclass
class SMSSendResult:
    success: bool
    provider_message_id: Optional[str] = None
    status: str = "SENT"  # SENT, FAILED, INVALID_NUMBER
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    retryable: bool = False
    raw_response: Optional[Dict[str, Any]] = None


@dataclass
class SMSWebhookStatusUpdate:
    provider_event_id: str
    provider_message_id: str
    recipient_phone: Optional[str]
    status: str  # SENT, DELIVERED, FAILED
    timestamp: datetime
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_payload: Dict[str, Any] = field(default_factory=dict)


class BaseSMSProvider(ABC):
    """
    Abstract interface for SMS Gateway Providers (Twilio, Fast2SMS, Generic HTTP, Mock).
    """

    @abstractmethod
    async def validate_configuration(self) -> SMSConfigStatus:
        """Validates if provider credentials and sender IDs are correctly configured."""
        pass

    @abstractmethod
    async def send_sms(
        self,
        to_phone: str,
        message_text: str,
        sender_id: Optional[str] = None,
    ) -> SMSSendResult:
        """Sends an SMS message to a single recipient."""
        pass

    @abstractmethod
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[SMSWebhookStatusUpdate]:
        """Parses webhook status delivery receipts."""
        pass
