import React from 'react';
import {
  Calendar,
  Heart,
  Sparkles,
  ChevronDown,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import { ThemeTokens } from '../utils/themeEngine';
import { getCelebrationConfig } from '../utils/celebrationEngine';
import { InteractiveGiftBox } from './InteractiveGiftBox';

interface PublicInvitationHeroProps {
  title: string;
  hindiTitle?: string;
  englishTitle?: string;
  coupleNames?: string;
  celebrantName?: string;
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
  celebrantName,
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
  const cfg = getCelebrationConfig(eventType, hostName || '', celebrantName || coupleNames || '');

  const formattedDate = formatDateSafe(startDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = startDate
    ? new Date(startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '07:00 PM';

  const scrollToContent = () => {
    const target = document.getElementById('event-details-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayName = celebrantName || coupleNames || title;

  return (
    <section
      id="hero-invitation-section"
      className="relative w-full min-h-[100svh] min-h-[100dvh] min-h-screen flex flex-col justify-between items-center text-center px-3 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] select-none overflow-x-hidden"
    >
      {/* Top Controls: Type Badge + Music Toggle */}
      <div className="w-full flex items-center justify-between z-30 pt-1 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-md">
          <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
          <span>{cfg.heroTag}</span>
        </div>

        <div className="flex items-center gap-2">
          {isGiftOpened && onResetGift && (
            <button
              type="button"
              onClick={() => {
                onResetGift();
                document.getElementById('hero-invitation-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-[11px] font-mono font-bold flex items-center gap-1 backdrop-blur-md hover:bg-black/80 transition-all shadow-md active:scale-95"
              title="Close Gift Box to unwrap again"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Close Box ↺</span>
            </button>
          )}

          {musicUrl && onToggleMusic && (
            <button
              type="button"
              onClick={onToggleMusic}
              className={`p-2.5 rounded-full border border-amber-300/60 shadow-lg backdrop-blur-md transition-all ${
                isPlayingMusic
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_#FFD700]'
                  : 'bg-black/60 text-amber-300 hover:bg-black/80'
              }`}
              title={isPlayingMusic ? 'Mute Music' : 'Play Celebration Music'}
            >
              {isPlayingMusic ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Center Area: Gift Box (if unopened) or Cinematic Unveiled Invitation Card */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto z-20 max-w-2xl mx-auto py-4">
        {!isGiftOpened ? (
          <InteractiveGiftBox
            eventTitle={title}
            coupleNames={coupleNames}
            celebrantName={celebrantName}
            hindiTitle={hindiTitle}
            salutation={salutation}
            guestName={guestName}
            eventType={eventType}
            musicUrl={musicUrl}
            isOpened={isGiftOpened}
            onOpenComplete={onOpenGiftComplete}
            onReset={onResetGift}
          />
        ) : (
          /* 🌟 CINEMATIC REVEALED INVITATION CARD 🌟 */
          <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* Auspicious / Formal Header if present */}
            {hindiTitle && (
              <div className="text-amber-300 font-serif font-bold text-sm sm:text-base tracking-widest drop-shadow-md">
                {hindiTitle}
              </div>
            )}

            {/* Celebration Title / Celebrant */}
            <div className="space-y-2">
              <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.25em] font-extrabold text-amber-200/90 block">
                {salutation || cfg.salutationPrefix}
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5DC] via-[#FFD700] to-[#E5C07B] drop-shadow-[0_4px_15px_rgba(212,175,55,0.4)] tracking-wide leading-tight">
                {displayName}
              </h1>
              <p className="font-serif text-sm sm:text-lg text-amber-100/90 italic font-medium max-w-xl mx-auto">
                {invitationMessage || `Cordially request the pleasure of your presence to celebrate with us.`}
              </p>
            </div>

            {/* Date & Venue Highlight */}
            <div className="p-4 sm:p-6 rounded-3xl bg-black/40 border border-amber-300/40 backdrop-blur-xl shadow-2xl space-y-3 max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-2 text-amber-300 font-serif text-base sm:text-xl font-bold">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-mono text-amber-200">
                <span>⏰ {formattedTime} Onwards</span>
                <span>•</span>
                <span className="truncate max-w-[220px]">📍 {venueName}</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              {onOpenRsvpModal && (
                <button
                  type="button"
                  onClick={onOpenRsvpModal}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full font-serif font-extrabold text-xs sm:text-sm text-white shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 border-2 border-amber-300 active:scale-95 transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #6E2035 0%, #521626 50%, #3A1420 100%)',
                  }}
                >
                  <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>RSVP • CONFIRM ATTENDANCE</span>
                </button>
              )}

              <button
                type="button"
                onClick={scrollToContent}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-black/50 hover:bg-black/70 text-amber-200 border border-amber-400/50 font-serif font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span>Explore Details</span>
                <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scroll Down Indicator */}
      {isGiftOpened && (
        <button
          type="button"
          onClick={scrollToContent}
          className="z-30 text-amber-300/80 hover:text-amber-200 flex flex-col items-center gap-1 text-[11px] font-mono font-bold tracking-widest uppercase transition-colors"
        >
          <span>Scroll to Explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </button>
      )}
    </section>
  );
};
