import uuid
import logging
from typing import Dict, Any, Optional
from app.integrations.whatsapp.base import WhatsAppProvider

logger = logging.getLogger("nimantran_ai")


class MockWhatsAppProvider(WhatsAppProvider):
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
        fmt = (card_format or "JPEG").upper()
        msg_id = f"wamid.MULTIMEDIA_{fmt}_MOCK_{uuid.uuid4().hex[:12]}"
        image_header = cover_image_url or "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop"
        
        doc_filename = f"{event_title}-{guest_name}".lower().replace(" ", "_") + (".pdf" if fmt == "PDF" else ".jpg")
        logger.info(
            f"[MOCK WHATSAPP MEDIA DISPATCH] Sent AI Card ({fmt} Format: {doc_filename}) to {recipient_phone} ({guest_name}). Header/Doc: {image_header}, Link: {invitation_link}"
        )
        return {
            "success": True,
            "provider_message_id": msg_id,
            "status": "DELIVERED",
            "recipient": recipient_phone,
            "card_format": f"WHATSAPP_{fmt}_DOCUMENT_ATTACHMENT" if fmt == "PDF" else "WHATSAPP_JPEG_IMAGE_ATTACHMENT",
            "media_type": "DOCUMENT" if fmt == "PDF" else "IMAGE",
            "file_name": doc_filename,
            "header_media_url": image_header,
            "caption": personalized_caption,
            "action_button": "✨ Open Digital Invitation Webpage →",
        }


    async def send_reminder(
        self, recipient_phone: str, message: str, action_url: Optional[str] = None
    ) -> Dict[str, Any]:
        msg_id = f"wamid.MOCK_{uuid.uuid4().hex[:12]}"
        logger.info(f"[MOCK WHATSAPP] Sent reminder to {recipient_phone}: {message}")
        return {
            "success": True,
            "provider_message_id": msg_id,
            "status": "DELIVERED",
            "recipient": recipient_phone,
        }

    async def send_thank_you(
        self, recipient_phone: str, message: str, gallery_url: Optional[str] = None
    ) -> Dict[str, Any]:
        msg_id = f"wamid.MOCK_{uuid.uuid4().hex[:12]}"
        logger.info(f"[MOCK WHATSAPP] Sent thank you to {recipient_phone}: {message}")
        return {
            "success": True,
            "provider_message_id": msg_id,
            "status": "DELIVERED",
            "recipient": recipient_phone,
        }
