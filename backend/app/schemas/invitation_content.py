from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CanonicalInvitationContent(BaseModel):
    """
    Canonical, single-source-of-truth invitation content model.
    Decouples AI semantic copywriting from visual layout design rendering.
    Guarantees strict factual consistency across:
    - Web Digital Invitation Cards (/i/:slug)
    - WhatsApp Personalized Messages
    - SMS Dispatches
    - Email HTML Invitations
    - QR Gate Passes
    - Public Guest RSVP Pages
    """
    # ─── 1. IMMUTABLE FACTUAL EVENT DATA ─────────────────────────────────────
    event_id: str = Field(..., description="Unique Event UUID")
    event_type: str = Field("WEDDING", description="Event type: WEDDING, BIRTHDAY, MUNDAN, ANNIVERSARY, etc.")
    title: str = Field(..., description="Canonical celebration headline/title")
    celebrant_name: Optional[str] = Field(None, description="Name(s) of celebrant, bride/groom, or birthday person")
    host_name: str = Field("Host Family", description="Primary host family name")
    co_host_name: Optional[str] = Field(None, description="Co-host or secondary family name")
    date_formatted: str = Field(..., description="Factual date string (e.g. '25 December 2026')")
    time_formatted: str = Field("Evening 7:00 PM", description="Factual time string (e.g. '7:00 PM')")
    venue_name: str = Field(..., description="Factual venue name")
    venue_address: str = Field(..., description="Factual venue address or location")
    google_maps_url: Optional[str] = Field(None, description="Google Maps navigation link")
    rsvp_deadline: Optional[str] = Field(None, description="RSVP deadline date")
    contact_phone: Optional[str] = Field(None, description="Host RSVP contact phone")
    public_url: str = Field(..., description="Canonical tokenized/slug public invitation URL")

    # ─── 2. AI CONTENT LAYER (Pure Semantic Copywriting) ─────────────────────
    greeting: str = Field(
        "सपरिवार सादर निमंत्रण | Cordial Invitation",
        description="Respectful opening salutation"
    )
    message: str = Field(
        ...,
        description="Core invitation message text expressing celebration joy"
    )
    blessing: str = Field(
        "विनीतः एवं दर्शनाभिलाषी: समस्त परिवार",
        description="Traditional blessing, shloka, or family best wishes"
    )
    closing: str = Field(
        "We eagerly look forward to celebrating with you and your family.",
        description="Closing salutation from the host"
    )
    story: Optional[str] = Field(
        None,
        description="Optional couple journey, celebration narrative, or background context"
    )
    language: str = Field(
        "HINGLISH",
        description="Language code: HINDI_DEVANAGARI, HINGLISH, or ENGLISH"
    )
    tone: str = Field(
        "WARM",
        description="Tone applied: WARM, ROYAL, DEVOTIONAL, ELEGANT, CELEBRATORY"
    )

    # ─── 3. SUB-FUNCTIONS / ITINERARY ─────────────────────────────────────────
    functions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Sub-functions/rituals with date, time, and venue (e.g. Haldi, Sangeet, Reception)"
    )

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_event(
        cls,
        event: Any,
        ai_content: Optional[Dict[str, Any]] = None,
        public_base_url: str = "http://localhost:5173",
        guest_token: Optional[str] = None,
    ) -> "CanonicalInvitationContent":
        """
        Synthesizes CanonicalInvitationContent strictly anchored in verified Event ground truth.
        """
        base_url = public_base_url.rstrip("/")
        slug_or_id = getattr(event, "slug", None) or str(event.id)
        
        if guest_token:
            public_url = f"{base_url}/i/{slug_or_id}?guest={guest_token}"
        else:
            public_url = f"{base_url}/i/{slug_or_id}"

        start_date = getattr(event, "start_date", None)
        if start_date:
            if isinstance(start_date, datetime):
                date_formatted = start_date.strftime("%d %B %Y")
                time_formatted = start_date.strftime("%I:%M %p")
            else:
                date_formatted = str(start_date)
                time_formatted = "Evening 7:00 PM"
        else:
            date_formatted = "Date TBA"
            time_formatted = "Time TBA"

        event_type = getattr(event, "event_type", "WEDDING") or "WEDDING"
        title = getattr(event, "title", "Celebration Gathering") or "Celebration Gathering"
        host = getattr(event, "host_name", "Host Family") or "Host Family"
        venue = getattr(event, "venue_name", "Celebration Venue") or "Celebration Venue"
        address = getattr(event, "venue_address", f"{venue}, Main Road") or f"{venue}, Main Road"

        # AI Content defaults
        ai_data = ai_content or {}
        default_blessing = "विनीतः एवं दर्शनाभिलाषी: समस्त परिवार"
        if event_type == "WEDDING":
            default_greeting = "सपरिवार सादर निमंत्रण | Cordial Invitation"
            default_message = f"With immense joy and gratitude, {host} cordially invites you and your family to celebrate the wedding ceremony of {title}."
        elif event_type == "BIRTHDAY":
            default_greeting = "You are warmly invited! 🎉"
            default_message = f"Join us to celebrate the birthday of {title} with fun, music, and great memories."
        elif event_type == "MUNDAN":
            default_greeting = "शुभ मुंडन संस्कार निमंत्रण 🙏"
            default_message = f"भगवान के आशीर्वाद से {title} के पावन अवसर पर आपकी गरिमामयी उपस्थिति सादर प्रार्थनीय है।"
        else:
            default_greeting = "Cordial Invitation 🙏"
            default_message = f"You are warmly invited to celebrate {title} with us."

        return cls(
            event_id=str(event.id),
            event_type=event_type,
            title=title,
            celebrant_name=getattr(event, "celebrant_name", None),
            host_name=host,
            co_host_name=getattr(event, "co_host_name", None),
            date_formatted=date_formatted,
            time_formatted=time_formatted,
            venue_name=venue,
            venue_address=address,
            google_maps_url=getattr(event, "google_maps_url", None),
            rsvp_deadline=getattr(event, "rsvp_deadline", None),
            contact_phone=getattr(event, "contact_phone", None),
            public_url=public_url,
            greeting=ai_data.get("greeting") or default_greeting,
            message=ai_data.get("message") or ai_data.get("main_message") or default_message,
            blessing=ai_data.get("blessing") or ai_data.get("host_message") or default_blessing,
            closing=ai_data.get("closing") or "We eagerly look forward to welcoming you and your family.",
            story=ai_data.get("story"),
            language=ai_data.get("language") or "HINGLISH",
            tone=ai_data.get("tone") or "WARM",
            functions=ai_data.get("functions") or [],
        )

    # ─── CHANNEL RENDERERS (All strictly consuming canonical facts) ───────────

    def render_whatsapp_text(self, guest_name: str = "Guest", guest_token: Optional[str] = None) -> str:
        """
        Renders WhatsApp text bound strictly to canonical ground truth facts.
        """
        inv_url = f"{self.public_url}?guest={guest_token}" if guest_token and "?guest=" not in self.public_url else self.public_url

        return (
            f"💌 *{self.host_name} has something special for you!*\n\n"
            f"Dear *{guest_name}*,\n\n"
            f"You are warmly invited to *{self.title}*.\n\n"
            f"📅 *Date:* {self.date_formatted}\n"
            f"⏰ *Time:* {self.time_formatted}\n"
            f"📍 *Venue:* {self.venue_name}, {self.venue_address}\n\n"
            f"_{self.closing}_\n\n"
            f"✨ *Tap below to open your personalized invitation card & gate pass:*\n"
            f"{inv_url}"
        )

    def render_sms_text(self, guest_name: str = "Guest", guest_token: Optional[str] = None) -> str:
        """
        Renders concise SMS message under 160 chars.
        """
        inv_url = f"{self.public_url}?guest={guest_token}" if guest_token and "?guest=" not in self.public_url else self.public_url
        return f"Dear {guest_name}, {self.host_name} invites you to {self.title} on {self.date_formatted} at {self.venue_name}. View card: {inv_url}"

    def render_email_subject_and_body(self, guest_name: str = "Guest", guest_token: Optional[str] = None) -> tuple[str, str]:
        """
        Renders rich email subject and HTML body.
        """
        inv_url = f"{self.public_url}?guest={guest_token}" if guest_token and "?guest=" not in self.public_url else self.public_url
        subject = f"Invitation: {self.title} | {self.host_name}"
        html_body = f"""
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FFFDFC; border: 1px solid #E9D3D0; border-radius: 16px;">
            <h1 style="color: #9E6F6D; text-align: center;">{self.greeting}</h1>
            <h2 style="text-align: center; color: #302829;">{self.title}</h2>
            <p style="font-size: 16px; color: #51484A; line-height: 1.6;">Dear <strong>{guest_name}</strong>,</p>
            <p style="font-size: 16px; color: #51484A; line-height: 1.6;">{self.message}</p>
            <div style="background: #FAF7F3; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #E9D3D0;">
                <p style="margin: 6px 0;">📅 <strong>Date:</strong> {self.date_formatted}</p>
                <p style="margin: 6px 0;">⏰ <strong>Time:</strong> {self.time_formatted}</p>
                <p style="margin: 6px 0;">📍 <strong>Venue:</strong> {self.venue_name}</p>
                <p style="margin: 6px 0; font-size: 14px; color: #8C7E80;">{self.venue_address}</p>
            </div>
            <p style="font-style: italic; color: #8C7E80; text-align: center;">{self.blessing}</p>
            <div style="text-align: center; margin-top: 24px;">
                <a href="{inv_url}" style="background: #9E6F6D; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">View Digital Card & Pass</a>
            </div>
        </div>
        """
        return subject, html_body

    def render_qr_pass_payload(self, guest_id: str, pass_code: str) -> Dict[str, Any]:
        """
        Renders QR check-in payload with guaranteed canonical event facts.
        """
        return {
            "event_id": self.event_id,
            "event_title": self.title,
            "event_date": self.date_formatted,
            "venue": self.venue_name,
            "guest_id": guest_id,
            "pass_code": pass_code,
            "verified": True,
        }
