from app.core.config import settings
from app.services.email.provider_base import (
    BaseEmailProvider,
    EmailConfigStatus,
    EmailSendResult,
    EmailWebhookStatusUpdate,
)
from app.services.email.smtp_provider import SMTPEmailProvider
from app.services.email.mock_provider import MockEmailProvider
from app.services.email.email_templates import render_luxury_invitation_email


def get_email_provider() -> BaseEmailProvider:
    provider_name = (getattr(settings, "EMAIL_PROVIDER", "MOCK") or "MOCK").upper()

    if provider_name in ("SMTP", "SES", "SENDGRID", "RESEND", "GMAIL"):
        return SMTPEmailProvider()
    else:
        return MockEmailProvider()


__all__ = [
    "BaseEmailProvider",
    "EmailConfigStatus",
    "EmailSendResult",
    "EmailWebhookStatusUpdate",
    "get_email_provider",
    "render_luxury_invitation_email",
]
