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
import { getCelebrationThemeById, getRecommendedThemeForOccasion } from '../utils/themeCatalog';
import { InteractiveGiftBox } from './InteractiveGiftBox';
import { Invitation3DCard } from './Invitation3DCard';

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

  // Resolve 3D theme for the physical card
  const active3DTheme =
    getCelebrationThemeById(theme?.id || 'wedding-royal-heritage') ||
    getRecommendedThemeForOccasion(eventType) ||
    getCelebrationThemeById('wedding-royal-heritage');

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
      {/* Top Glassmorphism Controls: Occasion Badge + Reset + Music Toggle */}
      <div className="w-full flex items-center justify-between z-30 pt-1 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/50 text-amber-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-xl shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
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
              className="px-3.5 py-1.5 rounded-full bg-black/60 border border-amber-400/50 text-amber-200 text-[11px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-xl hover:bg-black/80 transition-all shadow-lg active:scale-95"
              title="Close Gift Box to unwrap again"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Close Box ↺</span>
            </button>
          )}

          {musicUrl && onToggleMusic && (
            <button
              type="button"
              onClick={onToggleMusic}
              className={`p-2.5 rounded-full border border-amber-300/70 shadow-xl backdrop-blur-xl transition-all flex items-center gap-1.5 ${
                isPlayingMusic
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_20px_rgba(255,215,0,0.6)] animate-pulse'
                  : 'bg-black/60 text-amber-300 hover:bg-black/80'
              }`}
              title={isPlayingMusic ? 'Mute Music' : 'Play Celebration Music'}
            >
              {isPlayingMusic ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-[10px] font-mono font-extrabold uppercase pr-1">Audio On</span>
                </>
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Center Stage: 3D Royal Gift Box OR Unveiled 3D Invitation Card */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto z-20 max-w-2xl mx-auto py-3 sm:py-6">
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
          /* 🌟 3D CINEMATIC UNVEILED PHYSICAL INVITATION CARD 🌟 */
          <div className="w-full max-w-md sm:max-w-lg space-y-6 animate-in fade-in zoom-in-95 duration-700">
            {/* 3D Physical Paper Stationery Card */}
            <div className="w-full h-80 sm:h-96 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden">
              <Invitation3DCard
                theme={active3DTheme}
                title={displayName}
                hindiTitle={hindiTitle}
                dateStr={formattedDate}
                venueName={venueName}
                venueAddress={venueAddress}
                hostName={hostName}
                interactiveTilt={true}
                className="w-full h-full"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 max-w-md mx-auto">
              {onOpenRsvpModal && (
                <button
                  type="button"
                  onClick={onOpenRsvpModal}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full font-serif font-extrabold text-xs sm:text-sm text-white shadow-[0_10px_35px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 border-2 border-amber-300 active:scale-95 transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #7E1E34 0%, #591626 50%, #3D0D19 100%)',
                  }}
                >
                  <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>RSVP • CONFIRM ATTENDANCE</span>
                </button>
              )}

              <button
                type="button"
                onClick={scrollToContent}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-400/50 font-serif font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all backdrop-blur-xl"
              >
                <span>Explore Details</span>
                <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Scroll Down Indicator */}
      {isGiftOpened && (
        <button
          type="button"
          onClick={scrollToContent}
          className="z-30 text-amber-300/90 hover:text-amber-200 flex flex-col items-center gap-1 text-[11px] font-mono font-bold tracking-widest uppercase transition-colors"
        >
          <span>Scroll for Venue & RSVP</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-amber-400" />
        </button>
      )}
    </section>
  );
};
