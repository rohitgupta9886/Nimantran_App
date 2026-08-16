import asyncio
import email.utils
import logging
import smtplib
import uuid
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List, Dict, Any

from app.core.config import settings
from app.services.email.provider_base import (
    BaseEmailProvider,
    EmailConfigStatus,
    EmailSendResult,
    EmailWebhookStatusUpdate,
)

logger = logging.getLogger("nimantran_ai.email.smtp")


class SMTPEmailProvider(BaseEmailProvider):
    """
    Production SMTP Email Provider (supports Gmail, Amazon SES, SendGrid SMTP, Mailgun, custom SMTP).
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: bool = True,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ):
        self.host = host or getattr(settings, "SMTP_HOST", None) or getattr(settings, "EMAIL_HOST", None)
        self.port = port or int(getattr(settings, "SMTP_PORT", 587) or 587)
        self.username = username or getattr(settings, "SMTP_USER", None) or getattr(settings, "EMAIL_USER", None)
        self.password = password or getattr(settings, "SMTP_PASSWORD", None) or getattr(settings, "EMAIL_PASSWORD", None)
        self.use_tls = use_tls
        self.from_email = from_email or getattr(settings, "EMAIL_FROM_ADDRESS", None) or getattr(settings, "SMTP_FROM", "invitations@nimantran.ai")
        self.from_name = from_name or getattr(settings, "EMAIL_FROM_NAME", "Nimantran AI Celebrations")

    async def validate_configuration(self) -> EmailConfigStatus:
        missing = []
        if not self.host:
            missing.append("SMTP_HOST / EMAIL_HOST")
        if not self.username:
            missing.append("SMTP_USER / EMAIL_USER")
        if not self.password:
            missing.append("SMTP_PASSWORD / EMAIL_PASSWORD")

        if missing:
            return EmailConfigStatus(
                is_configured=False,
                provider_name="SMTP Email Provider",
                from_email=self.from_email,
                from_name=self.from_name,
                missing_keys=missing,
                message=f"SMTP Email is not configured. Missing: {', '.join(missing)}.",
            )

        return EmailConfigStatus(
            is_configured=True,
            provider_name="SMTP Email Provider",
            from_email=self.from_email,
            from_name=self.from_name,
            missing_keys=[],
            message=f"SMTP active ({self.host}:{self.port}) sending as {self.from_name} <{self.from_email}>",
        )

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        recipient_name: Optional[str] = None,
    ) -> EmailSendResult:
        if not self.host or not self.username:
            return EmailSendResult(
                success=False,
                status="FAILED",
                error_message="SMTP credentials are not configured.",
                error_code="CONFIG_MISSING",
                retryable=False,
            )

        # Basic email validation
        if not to_email or "@" not in to_email or "." not in to_email.split("@")[-1]:
            return EmailSendResult(
                success=False,
                status="FAILED",
                error_message=f"Invalid email address: {to_email}",
                error_code="INVALID_EMAIL",
                retryable=False,
            )

        msg_id_header = email.utils.make_msg_id(domain="nimantran.ai")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = f"{recipient_name} <{to_email}>" if recipient_name else to_email
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = msg_id_header

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        def _send_sync():
            with smtplib.SMTP(self.host, self.port, timeout=12.0) as server:
                if self.use_tls:
                    server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)

        try:
            await asyncio.to_thread(_send_sync)
            logger.info(f"SMTP Email successfully dispatched to {to_email} [ID: {msg_id_header}]")
            return EmailSendResult(
                success=True,
                provider_message_id=msg_id_header,
                status="SENT",
                raw_response={"message_id": msg_id_header, "to": to_email},
            )
        except smtplib.SMTPAuthenticationError as ex:
            return EmailSendResult(
                success=False,
                status="FAILED",
                error_message=f"SMTP authentication failed: {str(ex)}",
                error_code="AUTH_FAILED",
                retryable=False,
            )
        except smtplib.SMTPRecipientsRefused as ex:
            return EmailSendResult(
                success=False,
                status="FAILED",
                error_message=f"Recipient email rejected: {str(ex)}",
                error_code="RECIPIENT_REJECTED",
                retryable=False,
            )
        except Exception as ex:
            return EmailSendResult(
                success=False,
                status="FAILED",
                error_message=f"SMTP dispatch error: {str(ex)}",
                error_code="SMTP_ERROR",
                retryable=True,
            )

    def parse_webhook_payload(self, payload: Dict[str, Any]) -> List[EmailWebhookStatusUpdate]:
        return []
