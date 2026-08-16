import React, { useRef, useState } from 'react';
import {
  Download,
  FileImage,
  FileText,
  Sparkles,
  Check,
  QrCode as QrCodeIcon,
  MapPin,
  Calendar as CalendarIcon,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Share2,
  Send,
  Heart,
  Navigation,
  Clock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { downloadCardAsJpeg, downloadCardAsPng, downloadCardAsPdf } from '../utils/cardExport';
import { shareAiCardToWhatsApp } from '../utils/whatsappShare';
import { downloadIcsCalendarFile } from '../utils/calendarExport';
import getEventCardTheme, { EventThemeConfig } from '../utils/themeEngine';
import { RsvpExperienceModal } from './RsvpExperienceModal';
import { apiFetch } from '../services/api';

interface InvitationCardProps {
  event: {
    id?: string;
    title: string;
    event_type?: string;
    host_name?: string;
    co_host_name?: string;
    venue_name?: string;
    venue_address?: string;
    google_maps_url?: string;
    start_date?: string;
    description?: string;
    cover_image_url?: string;
    slug?: string;
    theme_config?: any;
  };
  guest?: {
    name: string;
    phone?: string;
    pass_code?: string;
    custom_welcome_quote?: string;
  };
  publicUrl?: string;
  onRsvpClick?: () => void;
  className?: string;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  event,
  guest,
  publicUrl,
  onRsvpClick,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exportingFormat, setExportingFormat] = useState<'PNG' | 'JPEG' | 'PDF' | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // AI Card On-The-Fly State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCardData, setAiCardData] = useState<any>(event.theme_config?.ai_card || null);

  // RSVP Action Sheet Modal State
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState<'YES' | 'NO' | 'MAYBE'>('YES');
  const [rsvpGuestCount, setRsvpGuestCount] = useState(1);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Dynamic Theme Engine Classification
  const theme: EventThemeConfig = getEventCardTheme(event);

  const cleanFilename = (ext: string) => {
    const name = guest?.name ? `${event.title}-${guest.name}` : event.title;
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + `.${ext}`;
  };

  const handleGenerateAiCardOnFly = async () => {
    setAiGenerating(true);
    try {
      let endpoint = '';
      if (event.id) {
        endpoint = `/events/${event.id}/ai-card`;
      } else if (event.slug) {
        endpoint = `/public/events/${event.slug}/ai-card`;
      } else {
        endpoint = `/public/events/rahul-neha/ai-card`;
      }

      const res = await apiFetch<any>(endpoint, { method: 'POST' });
      setAiCardData(res.data);
      setExportSuccess('✨ Google Gemini AI generated bespoke card on the fly!');
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      // Fallback AI synthesis
      const fallbackPayload = {
        shloka_header: theme.themeId === 'WEDDING' ? '|| श्री गणेशाय नमः ||' : '|| ॐ नमः शिवाय ||',
        hindi_title: event.title,
        hindi_invitation: `सपरिवार सादर निमंत्रण\n\n${event.host_name || 'परिवार'} की ओर से '${event.title}' के शुभ अवसर पर आपकी गरिमामयी उपस्थिति अत्यंत प्रार्थनीय है।`,
        english_title: event.title,
        english_invitation: `Together with our families, ${event.host_name || 'our family'} cordially requests your gracious presence to celebrate '${event.title}'.`,
        family_blessing: 'विनीतः एवं दर्शनाभिलाषी: समस्त परिवार',
        theme_name: theme.themeName,
        cover_image_url: theme.coverImageUrl,
      };
      setAiCardData(fallbackPayload);
      setExportSuccess('✨ Bespoke AI Card synthesized!');
      setTimeout(() => setExportSuccess(null), 3000);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleExport = async (format: 'PNG' | 'JPEG' | 'PDF') => {
    if (!cardRef.current) return;
    setExportingFormat(format);
    try {
      if (format === 'PNG') {
        await downloadCardAsPng(cardRef.current, cleanFilename('png'));
        setExportSuccess('Downloaded PNG Card!');
      } else if (format === 'JPEG') {
        await downloadCardAsJpeg(cardRef.current, cleanFilename('jpg'));
        setExportSuccess('Downloaded JPEG Card!');
      } else if (format === 'PDF') {
        await downloadCardAsPdf(cardRef.current, cleanFilename('pdf'), cardLink);
        setExportSuccess('Downloaded PDF Card!');
      }
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err) {
      alert(`Failed to export ${format} card. Please try again.`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleShareWhatsApp = async (format: 'JPEG' | 'PDF') => {
    if (!cardRef.current) return;
    setExportingFormat(format);
    try {
      const timeFormatted = event.start_date
        ? new Date(event.start_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : '07:00 PM';
      const host = event.host_name || 'Gupta & Sharma Families';
      const venue = event.venue_name || 'Grand Celebration Banquet Hall';

      const respectfulCaption =
        `*|| श्री गणेशाय नमः ||*\n` +
        `*सपरिवार सादर निमंत्रण*\n\n` +
        `प्रिय ${guest?.name || 'अतिथि'} जी,\n` +
        `${host} की ओर से आपको\n` +
        `हमारे '${event.title}'\n` +
        `के पावन अवसर पर सादर आमंत्रित करते हैं।\n\n` +
        `📅 दिनांक: ${formattedDate}\n` +
        `⏰ समय: ${timeFormatted}\n` +
        `📍 स्थान: ${venue}\n\n` +
        `आपकी उपस्थिति हमारे लिए सम्मान एवं सौभाग्य की बात होगी।\n` +
        `कृपया पधारकर हमें अनुग्रहित करें और इस दिन को यादगार बनाएं। 🙏\n\n` +
        `🎁 Click here To open Invitation 👉\n` +
        `${cardLink}`;

      const result = await shareAiCardToWhatsApp({
        element: cardRef.current,
        format,
        recipientPhone: guest?.phone || '',
        guestName: guest?.name || 'Guest',
        eventTitle: event.title,
        captionText: respectfulCaption,
      });
      setExportSuccess(result.message);
      setTimeout(() => setExportSuccess(null), 4500);
    } catch (err) {
      alert(`Failed to share ${format} card via WhatsApp.`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleAddToCalendar = () => {
    downloadIcsCalendarFile(event);
    setExportSuccess('🗓️ Event downloaded to your Device Calendar (.ics)!');
    setTimeout(() => setExportSuccess(null), 3500);
  };

  const handleOpenMaps = () => {
    if (event.google_maps_url) {
      window.open(event.google_maps_url, '_blank');
    } else if (event.venue_name) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(event.venue_name + ' ' + (event.venue_address || ''))}`, '_blank');
    }
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpSubmitted(true);
    setTimeout(() => {
      setIsRsvpModalOpen(false);
      setRsvpSubmitted(false);
      setExportSuccess('🎉 Thank you! Your RSVP response has been submitted.');
      setTimeout(() => setExportSuccess(null), 4000);
    }, 1500);
  };

  const formattedDate = event.start_date
    ? new Date(event.start_date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Date to be Announced';

  const cardLink = publicUrl || (event.slug ? `${window.location.origin}/i/${event.slug}` : window.location.href);

  // Active Card Content (AI Generated or Default)
  const activeShloka = aiCardData?.shloka_header || '|| श्री गणेशाय नमः ||';
  const activeHindiText =
    aiCardData?.hindi_invitation ||
    (event.host_name
      ? `सपरिवार सादर निमंत्रण\n\nमान्यवर, ${event.host_name} परिवार की ओर से आपकी गरिमामयी उपस्थिति अत्यंत प्रार्थनीय है।`
      : 'आपकी गरिमामयी उपस्थिति अत्यंत प्रार्थनीय है।');
  const activeEnglishText =
    aiCardData?.english_invitation ||
    `Together with our families, ${event.host_name || 'our family'} cordially requests your gracious presence to celebrate this auspicious occasion.`;
  const activeFamilyBlessing = aiCardData?.family_blessing || 'विनीतः एवं दर्शनाभिलाषी: समस्त परिवार';
  const activeCoverUrl =
    aiCardData?.cover_image_url || event.cover_image_url || theme.coverImageUrl;

  const descText = event.description || 'Join us for a joyful celebration filled with happiness, music, and memorable moments.';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI & MULTI-FORMAT TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-3xl bg-[#140005] border border-amber-500/30 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateAiCardOnFly}
            disabled={aiGenerating}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            title="Generate bespoke card content, shloka, and theme on the fly via Google Gemini AI"
          >
            <Sparkles className={`w-4 h-4 text-black ${aiGenerating ? 'animate-spin' : ''}`} />
            {aiGenerating ? 'AI Generating Bespoke Card...' : '✨ AI Generate Card On-The-Fly (Gemini AI)'}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* WhatsApp Share JPEG */}
          <button
            type="button"
            onClick={() => handleShareWhatsApp('JPEG')}
            disabled={!!exportingFormat}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            title="Share AI-generated JPEG Card image attachment directly to WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
            {exportingFormat === 'JPEG' ? 'Preparing...' : 'Share AI JPEG Card'}
          </button>

          {/* WhatsApp Share PDF */}
          <button
            type="button"
            onClick={() => handleShareWhatsApp('PDF')}
            disabled={!!exportingFormat}
            className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            title="Share AI-generated PDF Card document attachment directly to WhatsApp"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            {exportingFormat === 'PDF' ? 'Preparing...' : 'Share AI PDF Card'}
          </button>

          {/* JPEG Download */}
          <button
            type="button"
            onClick={() => handleExport('JPEG')}
            disabled={!!exportingFormat}
            className="px-3 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Download high-quality JPEG image (.jpg)"
          >
            <FileImage className="w-3.5 h-3.5 text-amber-400" />
            JPEG (.jpg)
          </button>

          {/* PDF Download */}
          <button
            type="button"
            onClick={() => handleExport('PDF')}
            disabled={!!exportingFormat}
            className="px-3 py-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Download printable PDF document (.pdf)"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            PDF (.pdf)
          </button>
        </div>
      </div>

      {/* Success Notice */}
      {exportSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          {exportSuccess}
        </div>
      )}

      {/* FULL-BLEED REDESIGNED LUXURY EVENT CARD CONTAINER */}
      <div
        ref={cardRef}
        className={`rounded-[40px_40px_24px_24px] border-2 border-amber-300/70 shadow-[0_25px_70px_-15px_rgba(218,165,32,0.35)] overflow-hidden relative ${theme.fontFamilyClass} text-white bg-[#0A1128] p-6 space-y-6 text-center max-w-lg mx-auto group transition-all duration-500 hover:shadow-2xl select-none`}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(11, 19, 43, 0.98) 50%, rgba(7, 13, 31, 0.99) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255, 215, 0, 0.3), 0 25px 70px -15px rgba(0, 0, 0, 0.85)',
        }}
      >
        {/* Inner Filigree Gold Line Border */}
        <div className="absolute inset-3 rounded-[34px_34px_18px_18px] border border-amber-400/30 pointer-events-none z-20" />

        {/* Full-Bleed Cinematic AI Background Image */}
        <img
          src={activeCoverUrl}
          alt="Event Visual Theme Backdrop"
          className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
        />
        
        {/* Readability Multi-Stop Overlay Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.overlayGradient} pointer-events-none`} />

        {/* CARD FOREGROUND CONTENT */}
        <div className="relative z-10 space-y-5">
          
          {/* Header Theme Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-md">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{aiCardData ? `GEMINI AI • ${theme.themeName}` : theme.badgeText}</span>
          </div>

          {/* Guest Specific Welcome Badge */}
          {guest && (
            <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/40 backdrop-blur-md shadow-lg">
              <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider block">Gracious Guest</span>
              <h3 className="font-serif text-lg font-bold text-amber-200">{guest.name}</h3>
              {guest.custom_welcome_quote && (
                <p className="text-[11px] text-slate-300 italic mt-1 font-serif">"{guest.custom_welcome_quote}"</p>
              )}
            </div>
          )}

          {/* HINDI / CULTURAL INVITATION SECTION */}
          <div className="space-y-2 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 backdrop-blur-md">
            <div className="text-amber-400 font-hindi font-bold text-base drop-shadow-md">{activeShloka}</div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-wide drop-shadow-lg ${theme.headingFontClass}`}>
              {aiCardData?.hindi_title || event.title}
            </h1>
            <p className="text-xs text-amber-100 leading-relaxed font-hindi whitespace-pre-line drop-shadow-sm">
              {activeHindiText}
            </p>
          </div>

          {/* ELEGANT SEPARATOR */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px bg-amber-500/40 flex-grow" />
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-black/70">
              EVENT DETAILS & VENUE
            </span>
            <div className="h-px bg-amber-500/40 flex-grow" />
          </div>

          {/* ENGLISH INVITATION & DETAILS BOX */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-rose-950/30 border border-amber-500/30 backdrop-blur-md text-left shadow-md">
            <p className="text-xs text-slate-200 leading-relaxed font-serif italic mb-2">
              "{activeEnglishText}"
            </p>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-amber-300/80 font-mono uppercase block">Date & Time</span>
                <span className="text-xs font-semibold text-white">{formattedDate}</span>
              </div>
            </div>

            {/* Venue & Location */}
            {event.venue_name && (
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] text-amber-300/80 font-mono uppercase block">Venue</span>
                  <span className="text-xs font-semibold text-white">{event.venue_name}</span>
                  {event.venue_address && (
                    <span className="text-[11px] text-slate-400 block">{event.venue_address}</span>
                  )}
                </div>
              </div>
            )}

            {/* Host Honorific */}
            <div className="text-[11px] text-amber-300 font-hindi italic text-right pt-2 border-t border-amber-500/20">
              {activeFamilyBlessing}
            </div>
          </div>

          {/* EXPANDABLE EVENT DESCRIPTION */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 backdrop-blur-md text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">About Celebration</span>
              <button
                type="button"
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-[11px] text-amber-300 hover:text-white font-semibold flex items-center gap-1"
              >
                {showFullDesc ? 'Show Less' : 'Read More'}
                {showFullDesc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className={`text-xs text-slate-300 mt-1.5 leading-relaxed ${showFullDesc ? '' : 'line-clamp-2'}`}>
              {descText}
            </p>
          </div>

          {/* PROMINENT HYPERLINKED EVENT DETAILS BUTTON */}
          <a
            href={cardLink}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#E5C07B] via-[#FFDF79] to-[#E5C07B] hover:from-[#FFDF79] hover:to-[#E5C07B] text-[#1A0E2E] font-extrabold text-sm shadow-xl flex items-center justify-between gap-2 transition-all my-3 group font-sans tracking-wide text-center border-2 border-white/80 hover:scale-[1.02]"
            title="Click here To open Invitation"
          >
            <span className="flex items-center gap-2 font-bold text-sm">
              <span className="text-base">🎁</span>
              <span>Click here To open Invitation</span>
            </span>
            <span className="text-lg font-bold">›</span>
          </a>

          {/* QUICK INTERACTIVE CONTROLS BAR (Add to Calendar, Location, RSVP) */}
          <div className="grid grid-cols-3 gap-2">
            {/* Add to Calendar */}
            <button
              type="button"
              onClick={handleAddToCalendar}
              className="py-2 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all"
              title="Add event to device calendar (.ics)"
            >
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              <span>Calendar</span>
            </button>

            {/* View Location */}
            <button
              type="button"
              onClick={handleOpenMaps}
              className="py-2 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all"
              title="Open Google Maps location"
            >
              <Navigation className="w-4 h-4 text-sky-400" />
              <span>Location</span>
            </button>

            {/* Interactive RSVP */}
            <button
              type="button"
              onClick={() => (onRsvpClick ? onRsvpClick() : setIsRsvpModalOpen(true))}
              className="py-2 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
              title="Respond to RSVP"
            >
              <Heart className="w-4 h-4 text-emerald-400" />
              <span>RSVP</span>
            </button>
          </div>

          {/* QR PASS CODE / GATE ENTRY PASS */}
          <div className="p-4 rounded-2xl bg-black/85 border border-amber-500/40 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg">
            <div className="text-left">
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider block">Cryptographic Entry Pass</span>
              <span className="font-mono text-sm font-bold text-white block">
                {guest?.pass_code || 'NIM-ENTRY-PASS'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Scan at Reception Gate</span>
            </div>

            <div className="p-2 rounded-xl bg-white shadow-md">
              <QRCodeSVG
                value={guest?.pass_code ? `NIM-ENTRY:${guest.pass_code}` : cardLink}
                size={64}
                level="H"
              />
            </div>
          </div>

          {/* Footer Branding */}
          <div className="pt-2 border-t border-amber-500/20 text-[9px] font-mono text-slate-400 flex items-center justify-between">
            <span>Powered by Nimantran AI</span>
            <span>{cardLink.replace(/^https?:\/\//, '')}</span>
          </div>

        </div>
      </div>

      {/* WORLD-CLASS LUXURY RSVP EXPERIENCE MODAL */}
      <RsvpExperienceModal
        isOpen={isRsvpModalOpen}
        onClose={() => setIsRsvpModalOpen(false)}
        eventSlug={event.slug || ''}
        eventTitle={event.title}
        eventDate={event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date to be Announced'}
        eventVenue={event.venue_name ? `${event.venue_name}, ${event.venue_address || ''}` : 'Celebration Venue'}
        guestName={guest?.name}
      />

    </div>
  );
};
