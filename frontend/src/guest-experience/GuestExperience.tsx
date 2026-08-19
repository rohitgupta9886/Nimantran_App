import React, { useState, useRef, Suspense, lazy } from 'react';
import { getCelebrationThemeById, getRecommendedThemeForOccasion, CelebrationTheme } from '../utils/themeCatalog';
import { getCelebrationConfig } from '../utils/celebrationEngine';
import { getExperienceTheme } from './engine/ExperienceThemeEngine';
import { WebGLShaderBackground } from '../components/WebGLShaderBackground';
import { CelebrationCountdown } from '../components/CelebrationCountdown';

import { OpeningScene } from './scenes/OpeningScene';
import { HeroScene } from './scenes/HeroScene';
import { DetailsScene } from './scenes/DetailsScene';
import { ItineraryScene } from './scenes/ItineraryScene';
import { BlessingsScene } from './scenes/BlessingsScene';
import { RSVPScene } from './scenes/RSVPScene';
import { VIPPassScene } from './scenes/VIPPassScene';
import { WishesScene } from './scenes/WishesScene';
import { ClosingScene } from './scenes/ClosingScene';
import { FloatingActionDock } from './components/FloatingActionDock';

const ParallaxStoryEngine = lazy(() =>
  import('../components/ParallaxStoryEngine').then((m) => ({ default: m.ParallaxStoryEngine }))
);
const DigitalShagunModal = lazy(() =>
  import('../components/DigitalShagunModal').then((m) => ({ default: m.DigitalShagunModal }))
);
const RsvpExperienceModal = lazy(() =>
  import('../components/RsvpExperienceModal').then((m) => ({ default: m.RsvpExperienceModal }))
);
const EventWelcomeWallModal = lazy(() =>
  import('../components/EventWelcomeWallModal').then((m) => ({ default: m.EventWelcomeWallModal }))
);

interface GuestExperienceProps {
  data: any;
  guestPersonalization?: any;
  slug?: string;
  token?: string;
  onPostWish: (name: string, rel: string, msg: string) => Promise<boolean>;
  onQuickRsvp: (status: string) => Promise<boolean>;
}

export const GuestExperience: React.FC<GuestExperienceProps> = ({
  data,
  guestPersonalization,
  slug,
  token,
  onPostWish,
  onQuickRsvp,
}) => {
  const evt = data?.event || {};
  const canonical = data?.canonical_invitation || {};
  const wishesList = data?.wishes || [];
  const memoriesList = data?.memories || [];
  const functionsList = evt?.functions || [];

  // Opening State
  const [isOpened, setIsOpened] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modals state
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [isConfirmedState, setIsConfirmedState] = useState(
    guestPersonalization?.rsvp_status === 'CONFIRMED'
  );
  const [isShagunModalOpen, setIsShagunModalOpen] = useState(false);
  const [isWelcomeWallOpen, setIsWelcomeWallOpen] = useState(false);

  // Quick RSVP state
  const [quickRsvpSubmitting, setQuickRsvpSubmitting] = useState(false);

  const celebrationType = evt.event_type || 'WEDDING';
  const cfg = getCelebrationConfig(celebrationType, evt.host_name || '', evt.title || '');
  const expTheme = getExperienceTheme(celebrationType, guestPersonalization?.theme_id || evt.theme_config?.theme);

  const activeTheme: CelebrationTheme =
    getCelebrationThemeById(guestPersonalization?.theme_id || evt.theme_config?.theme || 'wedding-royal-heritage') ||
    getRecommendedThemeForOccasion(celebrationType) ||
    getCelebrationThemeById('wedding-royal-heritage')!;

  const musicUrl = guestPersonalization?.music_url || evt.theme_config?.music_url;

  const handleOpenComplete = () => {
    setIsOpened(true);
    if (audioRef.current && !isPlayingMusic && musicUrl) {
      audioRef.current
        .play()
        .then(() => setIsPlayingMusic(true))
        .catch(() => { });
    }
  };

  const handleReplay = () => {
    setIsOpened(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => { });
    }
  };

  const formatDateSafe = (dateStr: any) => {
    if (!dateStr) return 'Date to be Announced';
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return 'Date to be Announced';
    return parsed.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formattedDate = formatDateSafe(evt.start_date);
  const formattedTime = evt.start_date
    ? new Date(evt.start_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '07:00 PM';

  const fullVenue = [evt.venue_name, evt.venue_address].filter(Boolean).join(', ');
  const mapsUrl =
    evt.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullVenue || 'Event Venue')}`;

  const handleQuickRsvp = async (status: 'CONFIRMED' | 'TENTATIVE' | 'DECLINED') => {
    setQuickRsvpSubmitting(true);
    const success = await onQuickRsvp(status);
    setQuickRsvpSubmitting(false);
    if (success && status === 'CONFIRMED') {
      setIsConfirmedState(true);
    }
  };

  const hasShagun = Boolean(evt.accepts_digital_shagun || evt.upi_id || evt.host_upi_mobile || evt.upi_qr_url);

  return (
    <div className="min-h-[100svh] min-h-screen relative overflow-x-hidden text-[#FFFDF9] select-none pb-36 font-sans">
      {/* Background Audio */}
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="auto" />}

      {/* 3D WebGL Multi-Depth Parallax Background */}
      <WebGLShaderBackground eventType={celebrationType} />

      {/* 🌟 1. SCENE 1: OPENING EXPERIENCE (CONTINUOUS SKY DOVE FLIGHT & 3D ENVELOPE) 🌟 */}
      {!isOpened ? (
        <OpeningScene
          title={evt.title || 'Celebration'}
          hindiTitle={evt.hindi_title}
          salutation={guestPersonalization?.salutation || canonical.greeting}
          guestName={guestPersonalization?.guest_name}
          theme={expTheme}
          onOpenComplete={handleOpenComplete}
        />
      ) : (
        /* 🌟 2. SCENE 2: CINEMATIC UNVEILED HERO SECTION 🌟 */
        <HeroScene
          title={evt.title || 'Rohit & Priyanka'}
          hindiTitle={evt.hindi_title}
          formattedDate={formattedDate}
          venueName={evt.venue_name}
          venueAddress={evt.venue_address}
          hostName={evt.host_name}
          heroTag={cfg.heroTag}
          activeTheme={activeTheme}
          musicUrl={musicUrl}
          isPlayingMusic={isPlayingMusic}
          onToggleMusic={toggleMusic}
          onReplay={handleReplay}
          onOpenRsvp={() => setIsRsvpModalOpen(true)}
        />
      )}

      {/* 🌟 3. STORYTELLING CHAPTERS (WHEN OPENED) 🌟 */}
      {isOpened && (
        <div
          id="invitation-chapters"
          className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16 pt-8 relative z-10 animate-in fade-in duration-700"
        >
          {/* Chapter 1: Live Celebration Countdown */}
          {evt.start_date && (
            <CelebrationCountdown
              targetDate={evt.start_date}
              celebrationType={celebrationType}
            />
          )}

          {/* Chapter 2: When & Where We Celebrate */}
          <DetailsScene
            title={evt.title || 'Celebration'}
            startDate={evt.start_date}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            venueName={evt.venue_name}
            venueAddress={evt.venue_address}
            fullVenue={fullVenue}
            mapsUrl={mapsUrl}
          />

          {/* Chapter 3: Program Itinerary (if available) */}
          <ItineraryScene functionsList={functionsList} />

          {/* Chapter 4: Formal Blessings & Family Message */}
          <BlessingsScene
            content={canonical.content}
            hostName={evt.host_name}
            vedicHeader={expTheme.typography.vedicHeader}
          />

          {/* Chapter 5: Parallax Memories / Story (if available) */}
          {memoriesList && memoriesList.length > 0 && (
            <Suspense fallback={<div className="h-48 flex items-center justify-center text-amber-200">Loading memories...</div>}>
              <ParallaxStoryEngine
                memories={memoriesList}
                theme={activeTheme as any}
              />
            </Suspense>
          )}

          {/* Chapter 6: Interactive RSVP Section */}
          <RSVPScene
            isConfirmedState={isConfirmedState}
            quickRsvpSubmitting={quickRsvpSubmitting}
            onQuickRsvp={handleQuickRsvp}
            onOpenRsvpModal={() => setIsRsvpModalOpen(true)}
          />

          {/* Chapter 7: Digital VIP Entry Pass */}
          <VIPPassScene
            passcode={guestPersonalization?.qr_passcode || 'NIM-ENTRY-1001'}
            qrValue={guestPersonalization?.qr_passcode || token || slug || 'NIM-VIP-1001'}
          />

          {/* Chapter 8: Digital Shagun & Wall of Love Wishes */}
          <WishesScene
            hasShagun={hasShagun}
            wishesList={wishesList}
            onOpenShagunModal={() => setIsShagunModalOpen(true)}
            onPostWish={onPostWish}
          />

          {/* Chapter 9: Closing Signature & Share */}
          <ClosingScene
            title={evt.title || 'The Celebration'}
            onReplay={handleReplay}
          />
        </div>
      )}

      {/* 🌟 4. FLOATING LUXURY ACTION DOCK (BOTTOM PILL FOR MOBILE & DESKTOP) 🌟 */}
      {isOpened && (
        <FloatingActionDock
          hasShagun={hasShagun}
          onOpenRsvp={() => setIsRsvpModalOpen(true)}
          onOpenShagun={() => setIsShagunModalOpen(true)}
          onReplay={handleReplay}
        />
      )}

      {/* 🌟 5. LAZY-LOADED MODALS 🌟 */}
      <Suspense fallback={null}>
        {isRsvpModalOpen && (
          <RsvpExperienceModal
            isOpen={isRsvpModalOpen}
            onClose={() => setIsRsvpModalOpen(false)}
            eventSlug={slug}
            token={token}
            eventTitle={evt.title}
            eventDate={formattedDate}
            eventVenue={fullVenue}
            guestName={guestPersonalization?.guest_name}
            onRsvpSuccess={() => {
              setIsConfirmedState(true);
              setIsRsvpModalOpen(false);
            }}
          />
        )}

        {isShagunModalOpen && (
          <DigitalShagunModal
            isOpen={isShagunModalOpen}
            onClose={() => setIsShagunModalOpen(false)}
            hostName={evt.host_name || 'Host Family'}
            eventTitle={evt.title || 'Celebration'}
            upiId={evt.upi_id}
            upiMobile={evt.host_upi_mobile}
            upiQrUrl={evt.upi_qr_url}
          />
        )}

        {isWelcomeWallOpen && (
          <EventWelcomeWallModal
            isOpen={isWelcomeWallOpen}
            onClose={() => setIsWelcomeWallOpen(false)}
            guestName={guestPersonalization?.guest_name}
            salutation={guestPersonalization?.salutation}
            eventTitle={evt.title}
            passCode={guestPersonalization?.qr_passcode}
            theme={activeTheme as any}
          />
        )}
      </Suspense>
    </div>
  );
};
