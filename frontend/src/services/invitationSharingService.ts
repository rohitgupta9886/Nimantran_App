/**
 * Nimantran AI — Centralized Universal Invitation Sharing Service
 * Production-ready service for WhatsApp, SMS, Gmail, and Link Copy across the entire application.
 */

export interface ShareEventData {
  id?: string;
  slug?: string;
  title: string;
  event_type?: string;
  host_name?: string;
  co_host_name?: string;
  venue_name?: string;
  venue_address?: string;
  start_date?: string;
  cover_image_url?: string;
}

export interface ShareGuestData {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  group_name?: string;
  pass_code?: string;
  invitation_token?: string;
}

export type ShareChannel = 'whatsapp' | 'sms' | 'gmail' | 'copy';

/**
 * Resolves the clean, public production invitation URL.
 * Never generates localhost in production or returns internal API endpoints.
 */
export const getPublicInvitationUrl = (
  event: ShareEventData,
  guest?: ShareGuestData | null,
  customBaseUrl?: string
): string => {
  // 1. Resolve domain base URL
  let origin = window.location.origin;
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_APP_URL || (import.meta as any).env?.PUBLIC_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    origin = envUrl.replace(/\/+$/, '');
  }
  if (customBaseUrl) {
    origin = customBaseUrl.replace(/\/+$/, '');
  }

  // 2. Determine target path (token-personalized guest route vs public event slug)
  if (guest?.invitation_token) {
    return `${origin}/i/t/${guest.invitation_token}`;
  }

  const identifier = event.slug || event.id || 'celebration';
  const url = `${origin}/i/${identifier}`;

  if (guest?.pass_code) {
    return `${url}?pass=${encodeURIComponent(guest.pass_code)}`;
  }

  return url;
};

/**
 * Formats a clean date string for invitations
 */
export const formatEventDate = (dateStr?: string): { date: string; time: string } => {
  if (!dateStr) {
    return { date: 'Date to be Announced', time: '07:00 PM Onwards' };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { date: 'Date to be Announced', time: '07:00 PM Onwards' };
  }
  const date = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date, time: `${time} Onwards` };
};

/**
 * Generates tailored, human-like, respectful messages for each channel
 */
export const generateInvitationShareMessage = ({
  event,
  guest,
  channel,
  customBaseUrl,
}: {
  event: ShareEventData;
  guest?: ShareGuestData | null;
  channel: ShareChannel;
  customBaseUrl?: string;
}): { subject?: string; text: string; url: string } => {
  const publicUrl = getPublicInvitationUrl(event, guest, customBaseUrl);
  const { date, time } = formatEventDate(event.start_date);
  const host = event.host_name || 'Gupta & Sharma Families';
  const venue = event.venue_name || 'Grand Celebration Banquet Hall';
  const guestName = guest?.name ? guest.name.trim() : '';

  if (channel === 'whatsapp') {
    const greeting = guestName ? `प्रिय ${guestName} जी,\n\n` : `प्रिय महोदय / महोदया,\n\n`;
    const text =
      `*|| श्री गणेशाय नमः ||*\n` +
      `*सपरिवार सादर निमंत्रण*\n\n` +
      `${greeting}` +
      `${host} की ओर से आपको हमारे '${event.title}' के पावन अवसर पर सपरिवार सादर आमंत्रित करते हैं।\n\n` +
      `📅 *दिनांक:* ${date}\n` +
      `⏰ *समय:* ${time}\n` +
      `📍 *स्थान:* ${venue}\n\n` +
      `आपकी उपस्थिति हमारे लिए सम्मान एवं सौभाग्य की बात होगी। कृपया पधारकर हमें अनुग्रहित करें। 🙏\n\n` +
      `✨ *अपनी विशेष व्यक्तिगत डिजिटल आमंत्रण पत्रिका यहाँ देखें:* 👇\n` +
      `${publicUrl}`;

    return { text, url: publicUrl };
  }

  if (channel === 'sms') {
    const recipient = guestName ? `Dear ${guestName}, ` : `Dear Guest, `;
    const text =
      `${recipient}you are warmly invited by ${host} to celebrate '${event.title}'.\n\n` +
      `📅 ${date}, ${time}\n` +
      `📍 ${venue}\n\n` +
      `✨ Open your digital invitation:\n${publicUrl}`;

    return { text, url: publicUrl };
  }

  if (channel === 'gmail') {
    const subject = `✨ You Are Warmly Invited — ${event.title} (${host})`;
    const greeting = guestName ? `Dear ${guestName},` : `Dear Valued Guest,`;
    const text =
      `${greeting}\n\n` +
      `It gives us immense pleasure to invite you and your family to join us in celebrating '${event.title}'.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✦ EVENT DETAILS ✦\n` +
      `Event: ${event.title}\n` +
      `Host: ${host}\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n` +
      `Venue: ${venue}${event.venue_address ? ` (${event.venue_address})` : ''}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✨ Open Your Personalized Digital Invitation & RSVP:\n` +
      `${publicUrl}\n\n` +
      `Your presence will make this auspicious day truly special and memorable.\n\n` +
      `With warm regards & blessings,\n` +
      `${host}`;

    return { subject, text, url: publicUrl };
  }

  // Copy channel
  return {
    text: `✨ You are cordially invited to ${event.title}! Open digital invitation: ${publicUrl}`,
    url: publicUrl,
  };
};

/**
 * Cleans and formats phone numbers with country code (defaults to 91 for 10-digit Indian numbers)
 */
export const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    return `91${clean}`;
  }
  return clean;
};

/**
 * Share via WhatsApp (opens WhatsApp Web or Mobile App)
 */
export const shareViaWhatsApp = async ({
  event,
  guest,
  customMessage,
  customBaseUrl,
}: {
  event: ShareEventData;
  guest?: ShareGuestData | null;
  customMessage?: string;
  customBaseUrl?: string;
}): Promise<{ success: boolean; method: string; message: string }> => {
  const generated = generateInvitationShareMessage({ event, guest, channel: 'whatsapp', customBaseUrl });
  const messageToSend = customMessage || generated.text;
  const encodedText = encodeURIComponent(messageToSend);
  const formattedPhone = formatPhoneNumber(guest?.phone);

  const waUrl = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // Check if native Web Share API with text is supported and on a touch device
  if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: `${event.title} Invitation`,
        text: messageToSend,
      });
      return { success: true, method: 'NATIVE_SHARE', message: 'Shared invitation via WhatsApp!' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'CANCELLED', message: 'Share cancelled.' };
      }
    }
  }

  // Fallback / Standard: Open WhatsApp Web / App URL
  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return {
    success: true,
    method: 'WHATSAPP_URL',
    message: formattedPhone ? `Opened WhatsApp chat with +${formattedPhone}` : 'Opened WhatsApp to share invitation!',
  };
};

/**
 * Share via SMS (opens native SMS compose screen)
 */
export const shareViaSMS = async ({
  event,
  guest,
  customMessage,
  customBaseUrl,
}: {
  event: ShareEventData;
  guest?: ShareGuestData | null;
  customMessage?: string;
  customBaseUrl?: string;
}): Promise<{ success: boolean; message: string }> => {
  const generated = generateInvitationShareMessage({ event, guest, channel: 'sms', customBaseUrl });
  const messageToSend = customMessage || generated.text;
  const encodedText = encodeURIComponent(messageToSend);
  const formattedPhone = formatPhoneNumber(guest?.phone);

  // iOS uses &body= whereas Android/standard uses ?body=
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';

  const smsUrl = formattedPhone
    ? `sms:${formattedPhone}${separator}body=${encodedText}`
    : `sms:${separator}body=${encodedText}`;

  window.open(smsUrl, '_self');
  return {
    success: true,
    message: formattedPhone ? `Opened SMS compose for +${formattedPhone}` : 'Opened SMS compose!',
  };
};

/**
 * Share via Gmail (opens Gmail Web compose with mailto fallback)
 */
export const shareViaGmail = async ({
  event,
  guest,
  customSubject,
  customMessage,
  customBaseUrl,
}: {
  event: ShareEventData;
  guest?: ShareGuestData | null;
  customSubject?: string;
  customMessage?: string;
  customBaseUrl?: string;
}): Promise<{ success: boolean; message: string }> => {
  const generated = generateInvitationShareMessage({ event, guest, channel: 'gmail', customBaseUrl });
  const subject = customSubject || generated.subject || `✨ Invitation: ${event.title}`;
  const body = customMessage || generated.text;
  const email = (guest?.email || '').trim();

  const encodedTo = encodeURIComponent(email);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  // Direct Gmail Web Compose link
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;

  try {
    const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      // Popup blocked or failed -> fallback to mailto:
      const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
      window.open(mailtoUrl, '_self');
    }
    return {
      success: true,
      message: email ? `Opened Gmail compose for ${email}` : 'Opened Gmail compose screen!',
    };
  } catch {
    const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
    window.open(mailtoUrl, '_self');
    return { success: true, message: 'Opened email compose application.' };
  }
};

/**
 * Copy clean invitation link to clipboard with reliable fallback
 */
export const copyInvitationLink = async ({
  event,
  guest,
  customBaseUrl,
}: {
  event: ShareEventData;
  guest?: ShareGuestData | null;
  customBaseUrl?: string;
}): Promise<{ success: boolean; url: string; message: string }> => {
  const url = getPublicInvitationUrl(event, guest, customBaseUrl);

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return { success: true, url, message: '✓ Invitation link copied to clipboard!' };
    }
  } catch (err) {
    console.warn('Navigator clipboard write failed, using textarea fallback:', err);
  }

  // Fallback for non-secure contexts or older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      return { success: true, url, message: '✓ Invitation link copied to clipboard!' };
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }

  return {
    success: false,
    url,
    message: 'Could not automatically copy. Please copy the link manually.',
  };
};
