import React, { useState } from 'react';
import { MapPin, Calendar, Heart, Sparkles, Gift, ExternalLink, Download, ChevronDown, Volume2, VolumeX, ShieldCheck, RotateCcw } from 'lucide-react';
import { ThemeTokens } from '../utils/themeEngine';
import { downloadIcsCalendarFile } from '../utils/calendarExport';
import { InteractiveGiftBox } from './InteractiveGiftBox';

interface PublicInvitationHeroProps {
  title: string;
  hindiTitle?: string;
  englishTitle?: string;
  coupleNames?: string;
  invitationMessage?: string;
  eventType?: string;
  startDate?: string;
  venueName?: string;
  venueAddress?: string;
  googleMapsUrl?: string;
  hostName?: string;
  salutation?: string;
  guestName?: string;
  passCode?: string;
  musicUrl?: string;
  theme: ThemeTokens;
  formatDateSafe: (dateStr: any, options: Intl.DateTimeFormatOptions) => string;
  onOpenRsvpModal?: () => void;
  onOpenShagunModal?: () => void;
  isPlayingMusic?: boolean;
  onToggleMusic?: () => void;
  isGiftOpened?: boolean;
  onOpenGiftComplete?: () => void;
  onResetGift?: () => void;
}

export const PublicInvitationHero: React.FC<PublicInvitationHeroProps> = ({
  title,
  hindiTitle,
  englishTitle,
  coupleNames,
  invitationMessage,
  eventType = 'CELEBRATION',
  startDate,
  venueName = 'Celebration Venue',
  venueAddress,
  googleMapsUrl,
  hostName,
  salutation,
  guestName,
  passCode = 'NIM-ENTRY-1001',
  musicUrl,
  theme,
  formatDateSafe,
  onOpenRsvpModal,
  onOpenShagunModal,
  isPlayingMusic,
  onToggleMusic,
  isGiftOpened = false,
  onOpenGiftComplete,
  onResetGift,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const formattedDate = formatDateSafe(startDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = startDate
    ? new Date(startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '07:00 PM';

  const fullVenue = venueName ? `${venueName}${venueAddress ? ', ' + venueAddress : ''}` : 'Celebration Venue';
  const mapsUrl = googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(fullVenue)}`;

  // 🌟 GOOGLE CALENDAR ADD EVENT HANDLER 🌟
  const handleGoogleCalendar = () => {
    const eventDateObj = startDate ? new Date(startDate) : new Date('2026-12-18T18:30:00');
    const validDate = isNaN(eventDateObj.getTime()) ? new Date('2026-12-18T18:30:00') : eventDateObj;
    const start = validDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(validDate.getTime() + 4 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const details = invitationMessage || `You are graciously invited to celebrate ${title}!`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title || 'Celebration')}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(fullVenue)}&dates=${start}/${end}`;
    window.open(gcalUrl, '_blank', 'noopener,noreferrer');
  };

  // 🌟 APPLE / OUTLOOK / ICS DOWNLOAD HANDLER 🌟
  const handleDownloadIcs = () => {
    const validDateStr = startDate && !isNaN(new Date(startDate).getTime()) ? startDate : new Date('2026-12-18T18:30:00').toISOString();
    downloadIcsCalendarFile({
      title: title || 'Grand Celebration',
      description: invitationMessage || `You are graciously invited to celebrate ${title}!`,
      venue_name: fullVenue,
      start_date: validDateStr,
    });
  };

  const scrollToContent = () => {
    const target = document.getElementById('event-details-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero-invitation-section"
      className="relative w-full min-h-[100svh] min-h-[100dvh] min-h-screen flex flex-col justify-between items-center text-center px-3 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] select-none overflow-x-hidden"
    >
      {/* Top Floating Music / Ambient Control */}
      <div className="w-full flex items-center justify-between z-30 pt-1">
        {/* Left Sacred Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-md">
          <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
          <span>{eventType.toUpperCase()}</span>
        </div>

        {/* Right Floating Controls: Re-close Box + Music Player Toggle */}
        <div className="flex items-center gap-2">
          {isGiftOpened ? (
            <button
              type="button"
              onClick={() => {
                if (onResetGift) onResetGift();
                document.getElementById('hero-invitation-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-full bg-[#0A1128]/90 border border-amber-300/80 text-amber-200 text-[11px] font-mono font-bold flex items-center gap-1 backdrop-blur-md hover:bg-slate-900 transition-all shadow-md hover:scale-105 active:scale-95"
              title="Close Gift Box to unwrap again"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Close Box ↺</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onOpenGiftComplete) onOpenGiftComplete();
              }}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#7E223B] to-[#5E000F] border border-amber-300 text-amber-100 text-[11px] font-mono font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md hover:scale-105 active:scale-95 animate-pulse"
              title="Open Gift Box"
            >
              <Gift className="w-3 h-3 text-amber-300" />
              <span>Open Box 🎁</span>
            </button>
          )}

          {musicUrl && onToggleMusic && (
            <button
              type="button"
              onClick={onToggleMusic}
              className={`p-2 rounded-full border border-amber-300/60 shadow-lg backdrop-blur-md transition-all ${
                isPlayingMusic
                  ? 'bg-amber-500 text-black animate-pulse shadow-[0_0_15px_#FFD700]'
                  : 'bg-black/60 text-amber-300 hover:bg-black/80'
              }`}
              title={isPlayingMusic ? 'Mute Music' : 'Play Celebration Music'}
            >
              {isPlayingMusic ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Center Main Hero Card Container */}
      <div 
        className="w-full max-w-xl my-auto py-6 sm:py-9 px-4 sm:px-8 rounded-[38px_38px_24px_24px] border-2 border-amber-300/80 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.95)] backdrop-blur-xl relative space-y-3 overflow-hidden z-20"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(11, 19, 43, 0.98) 50%, rgba(30, 15, 45, 0.96) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255, 215, 0, 0.4), 0 25px 70px -15px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Inner Gold Filigree Borders */}
        <div className="absolute inset-2.5 sm:inset-3 rounded-[32px_32px_18px_18px] border border-amber-400/30 pointer-events-none" />
        <div className="absolute inset-3.5 sm:inset-4 rounded-[28px_28px_14px_14px] border border-amber-300/15 pointer-events-none" />

        {/* Floating Romantic Embellishments */}
        <div className="absolute top-4 left-5 pointer-events-none opacity-40 text-2xl animate-pulse">🥂</div>
        <div className="absolute top-4 right-5 pointer-events-none opacity-40 text-2xl animate-pulse">🍷</div>
        <div className="absolute bottom-4 left-6 pointer-events-none opacity-30 text-xl animate-bounce">🌹</div>
        <div className="absolute bottom-4 right-6 pointer-events-none opacity-30 text-xl animate-bounce">💖</div>

        <div className="relative z-10 space-y-2.5">
          {/* Sacred Header Shloka */}
          <div className="text-amber-300 font-serif font-bold text-xs sm:text-base tracking-widest drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
            {hindiTitle || '|| श्री गणेशाय नमः ||'}
          </div>

          {/* Subheader */}
          <div className="text-[#E2D5C3] font-serif text-[11px] sm:text-xs tracking-wider">
             सादर सपरिवार आमंत्रण
          </div>

          {/* Main Couple Names or Event Title */}
          <div className="py-0.5">
            {coupleNames ? (
              <h1 className="font-serif italic font-extrabold text-2xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#FFE58F] via-[#FFDF79] to-[#E5C07B] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-wide leading-tight">
                {coupleNames}
              </h1>
            ) : (
              <h1 className="font-serif font-extrabold text-2xl sm:text-3xl md:text-4xl text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-tight leading-tight">
                {englishTitle || title}
              </h1>
            )}

            {coupleNames && (
              <h2 className="font-serif font-bold text-sm sm:text-base text-white/90 mt-0.5">
                {englishTitle || title}
              </h2>
            )}
          </div>

          {/* Personal Guest Salutation Badge */}
          {salutation && (
            <div className="py-1.5 px-3.5 rounded-full bg-amber-950/60 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-serif italic inline-block shadow-inner backdrop-blur-sm max-w-full truncate">
              "{salutation}"
            </div>
          )}

          {/* 🌟 THE CORE 3D INTERACTIVE GIFT BOX EXPERIENCE 🌟 */}
          <InteractiveGiftBox
            eventTitle={title}
            coupleNames={coupleNames}
            hindiTitle={hindiTitle}
            salutation={salutation}
            guestName={guestName}
            eventType={eventType}
            musicUrl={musicUrl}
            isOpened={isGiftOpened}
            onOpenComplete={onOpenGiftComplete}
            onReset={onResetGift}
          />

          {/* 🌟 REVEALED INVITATION CARD & ACTIONS (DISPLAYED ONCE GIFT IS OPENED) 🌟 */}
          {isGiftOpened && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
              {/* Warm Cultural Invitation Text */}
              <p className="text-xs sm:text-sm font-serif italic text-slate-200 leading-relaxed px-1 max-w-md mx-auto drop-shadow-sm">
                {invitationMessage || `"You are warmly invited to celebrate with us. Your gracious presence will make this special day even more memorable."`}
              </p>

              {/* Compact Date & Venue Info Pill */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-black/40 border border-amber-400/25 space-y-1 text-xs font-mono">
                <div className="font-bold text-amber-200 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs">
                  <span>🗓️ {formattedDate}</span>
                  <span className="text-amber-400">•</span>
                  <span>⏰ {formattedTime}</span>
                </div>
                <div className="text-slate-300 text-[10px] sm:text-[11px] truncate flex items-center justify-center gap-1">
                  <span>📍 {fullVenue}</span>
                </div>
              </div>

              {/* 🌟 PRIMARY DOMINATING CTA: RSVP NOW (LARGE TOUCH-FRIENDLY BUTTON) 🌟 */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenRsvpModal}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-full font-serif font-extrabold text-xs sm:text-sm text-white shadow-2xl flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2 border-amber-300/90 tracking-wider uppercase group"
                  style={{
                    background: 'linear-gradient(135deg, #7E223B 0%, #63182C 50%, #3B0E1B 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 10px 30px rgba(126, 34, 59, 0.7), 0 0 20px rgba(255, 215, 0, 0.3)',
                  }}
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-300 text-amber-300 animate-pulse group-hover:scale-125 transition-transform" />
                  <span>❤️ RSVP NOW — I'LL BE THERE</span>
                </button>
              </div>

              {/* 🌟 Quick 2-Column Action Buttons: GET DIRECTIONS & ADD TO CALENDAR 🌟 */}
              <div className="grid grid-cols-2 gap-2 pt-0.5 relative">
                {/* Get Directions */}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-400/40 text-[11px] sm:text-xs font-serif font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>Directions</span>
                </a>

                {/* Add to Calendar with Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-400/40 text-[11px] sm:text-xs font-serif font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    <span>Calendar</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Calendar Dropdown */}
                  {isCalendarOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-52 p-2 rounded-2xl bg-[#0F172A] border-2 border-amber-400 shadow-2xl z-50 space-y-1.5 text-left animate-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => { handleGoogleCalendar(); setIsCalendarOpen(false); }}
                        className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-serif font-bold text-amber-100 flex items-center justify-between"
                      >
                        <span>📅 Google Calendar</span>
                        <ExternalLink className="w-3 h-3 text-amber-300" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleDownloadIcs(); setIsCalendarOpen(false); }}
                        className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-serif font-bold text-amber-100 flex items-center justify-between"
                      >
                        <span>📥 Apple / Outlook (.ics)</span>
                        <Download className="w-3 h-3 text-amber-300" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom Bouncing Scroll Prompt (Safe-Area Aware) */}
      <button
        type="button"
        onClick={scrollToContent}
        className="flex flex-col items-center gap-1 text-amber-300/80 hover:text-amber-200 text-[11px] font-mono tracking-widest uppercase transition-colors z-20 pt-1 pb-1"
      >
        <span className="text-[10px]">Scroll to explore invitation</span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </button>

    </section>
  );
};

