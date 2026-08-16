from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any


@dataclass
class EmailConfigStatus:
    is_configured: bool
    provider_name: str
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    missing_keys: List[str] = field(default_factory=list)
    message: str = ""


@dataclass
class EmailSendResult:
    success: bool
    provider_message_id: Optional[str] = None
    status: str = "SENT"  # SENT, FAILED, INVALID_EMAIL
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    retryable: bool = False
    raw_response: Optional[Dict[str, Any]] = None


@dataclass
class EmailWebhookStatusUpdate:
    provider_event_id: str
    provider_message_id: str
    recipient_email: Optional[str]
    status: str  # SENT, DELIVERED, OPENED, BOUNCED, FAILED
    timestamp: datetime
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_payload: Dict[str, Any] = field(default_factory=dict)


class BaseEmailProvider(ABC):
    """
    Abstract interface for Transactional Email Providers (SMTP, SES, Resend, SendGrid, Mock).
    """

    @abstractmethod
    async def validate_configuration(self) -> EmailConfigStatus:
        """Validates if provider credentials, host, and from address are correctly configured."""
        pass

    @abstractmethod
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        recipient_name: Optional[str] = None,
    ) -> EmailSendResult:
        """Sends an HTML + text invitation email to a single recipient."""
        pass

    @abstractmethod
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[EmailWebhookStatusUpdate]:
        """Parses webhook status and bounce receipts."""
        pass
