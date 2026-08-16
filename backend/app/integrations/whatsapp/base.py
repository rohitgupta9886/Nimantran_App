from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class WhatsAppProvider(ABC):
    @abstractmethod
    async def send_invitation_card(
        self,
        recipient_phone: str,
        guest_name: str,
        event_title: str,
        invitation_link: str,
        pass_link: Optional[str] = None,
        cover_image_url: Optional[str] = None,
        media_type: str = "IMAGE",
        personalized_caption: Optional[str] = None,
        card_format: str = "JPEG",
    ) -> Dict[str, Any]:
        """Send formatted WhatsApp AI card as JPEG image or PDF document media message via Meta Cloud API / Mock."""
        pass


    @abstractmethod
    async def send_reminder(
        self, recipient_phone: str, message: str, action_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send reminder notification."""
        pass

    @abstractmethod
    async def send_thank_you(
        self, recipient_phone: str, message: str, gallery_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send post-event thank you message."""
        pass
