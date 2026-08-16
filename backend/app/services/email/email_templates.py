import html
from typing import Optional


def render_luxury_invitation_email(
    guest_name: str,
    event_title: str,
    host_name: str,
    event_date: str,
    event_time: str,
    venue_name: str,
    venue_address: str,
    invitation_url: str,
    rsvp_url: Optional[str] = None,
    personal_message: Optional[str] = None,
    event_type: str = "Celebration",
) -> tuple[str, str]:
    """
    Renders high-aesthetic Indian luxury HTML email template and plain text fallback.
    Returns: (html_body, text_body)
    """
    safe_guest = html.escape(guest_name)
    safe_title = html.escape(event_title)
    safe_host = html.escape(host_name)
    safe_venue = html.escape(venue_name)
    safe_address = html.escape(venue_address)
    safe_date = html.escape(event_date)
    safe_time = html.escape(event_time)
    safe_inv_url = html.escape(invitation_url)
    safe_rsvp_url = html.escape(rsvp_url or invitation_url)
    safe_message = html.escape(personal_message or "We would be deeply honored and delighted by your presence to celebrate this auspicious occasion.")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{safe_title}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #120306;
      font-family: 'Georgia', 'Playfair Display', serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #FFFDFB;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background: linear-gradient(180deg, #1A0308 0%, #0D0104 100%);
      padding: 30px 10px;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      background-color: #20050B;
      border: 1px solid #D4AF37;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }}
    .header-banner {{
      background: linear-gradient(135deg, #800020 0%, #4A0012 100%);
      padding: 40px 24px 28px;
      text-align: center;
      border-bottom: 2px solid #D4AF37;
    }}
    .shloka {{
      font-size: 13px;
      color: #F3E5AB;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 12px;
      font-weight: 600;
    }}
    .event-title {{
      font-size: 26px;
      line-height: 1.3;
      color: #FFFFFF;
      margin: 0 0 8px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }}
    .host-name {{
      font-size: 14px;
      color: #E6C280;
      margin: 0;
      font-style: italic;
    }}
    .content-body {{
      padding: 36px 30px;
      text-align: center;
    }}
    .salutation {{
      font-size: 18px;
      color: #F3E5AB;
      margin-bottom: 16px;
      font-weight: 600;
    }}
    .invitation-text {{
      font-size: 15px;
      line-height: 1.7;
      color: #E8D8D8;
      margin-bottom: 28px;
    }}
    .card-box {{
      background: rgba(255, 255, 255, 0.04);
      border: 1px dashed #D4AF37;
      border-radius: 16px;
      padding: 22px;
      margin: 0 auto 30px;
      text-align: left;
    }}
    .detail-row {{
      margin-bottom: 12px;
      font-size: 14px;
      color: #F7EFE2;
    }}
    .detail-row:last-child {{
      margin-bottom: 0;
    }}
    .detail-label {{
      color: #D4AF37;
      font-weight: bold;
      display: inline-block;
      min-width: 70px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .btn-container {{
      margin: 32px 0 16px;
      text-align: center;
    }}
    .primary-btn {{
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37 0%, #AA820A 100%);
      color: #1A0006 !important;
      text-decoration: none;
      font-weight: bold;
      font-size: 15px;
      letter-spacing: 1px;
      padding: 16px 36px;
      border-radius: 50px;
      box-shadow: 0 8px 20px rgba(212, 175, 55, 0.35);
      text-transform: uppercase;
    }}
    .footer {{
      background-color: #120205;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #8C7B7D;
      border-top: 1px solid rgba(212, 175, 55, 0.2);
    }}
    .footer-link {{
      color: #D4AF37;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-banner">
        <div class="shloka">|| शुभ निमंत्रण ||</div>
        <h1 class="event-title">{safe_title}</h1>
        <p class="host-name">Hosted with love by {safe_host}</p>
      </div>

      <div class="content-body">
        <div class="salutation">Dear {safe_guest},</div>
        <p class="invitation-text">{safe_message}</p>

        <div class="card-box">
          <div class="detail-row">
            <span class="detail-label">📅 Date</span> <strong>{safe_date}</strong>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏰ Time</span> <strong>{safe_time}</strong>
          </div>
          <div class="detail-row">
            <span class="detail-label">📍 Venue</span> <strong>{safe_venue}</strong>
          </div>
          <div class="detail-row" style="margin-top: 4px; font-size: 12px; color: #BAA6A8;">
            <span class="detail-label"></span> {safe_address}
          </div>
        </div>

        <div class="btn-container">
          <a href="{safe_inv_url}" target="_blank" class="primary-btn">
            ✨ Open Digital Invitation & Gate Pass
          </a>
        </div>

        <p style="font-size: 12px; color: #A89597; margin-top: 20px;">
          Can't click the button? Copy and paste this link into your browser:<br>
          <a href="{safe_inv_url}" style="color: #D4AF37; word-break: break-all;">{safe_inv_url}</a>
        </p>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px;">Sent with love via <strong>Nimantran AI</strong></p>
        <p style="margin: 0;">One Invitation. One Link. Entire Celebration.</p>
      </div>
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Dear {guest_name},

You are warmly invited to {event_title}.

Hosted with love by: {host_name}

EVENT DETAILS:
Date: {event_date}
Time: {event_time}
Venue: {venue_name}
Address: {venue_address}

{personal_message or "We would be delighted to have you celebrate with us."}

Open your personalized digital invitation card & QR gate pass:
{invitation_url}

Sent via Nimantran AI
"""

    return html_content, text_content
