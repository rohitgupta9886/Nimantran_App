import React, { useState, useRef, Suspense, lazy } from 'react';
import {
  Calendar,
  MapPin,
  QrCode,
  Heart,
  Sparkles,
  Send,
  Download,
  Check,
  Volume2,
  VolumeX,
  Gift,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Compass,
  Copy,
  RotateCcw,
  Share2,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CelebrationTheme, getCelebrationThemeById, getRecommendedThemeForOccasion } from '../utils/themeCatalog';
import { getCelebrationConfig } from '../utils/celebrationEngine';
import { downloadIcsCalendarFile } from '../utils/calendarExport';
import { WebGLShaderBackground } from '../components/WebGLShaderBackground';
import { EnvelopeExperience } from './opening/EnvelopeExperience';
import { Invitation3DCard } from '../components/Invitation3DCard';
import { CelebrationCountdown } from '../components/CelebrationCountdown';

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
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isShagunModalOpen, setIsShagunModalOpen] = useState(false);
  const [isWelcomeWallOpen, setIsWelcomeWallOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Quick RSVP state
  const [quickRsvpSubmitting, setQuickRsvpSubmitting] = useState(false);

  // Wishes Form state
  const [wishName, setWishName] = useState('');
  const [wishRel, setWishRel] = useState('Family & Friends');
  const [wishMessage, setWishMessage] = useState('');
  const [submittingWish, setSubmittingWish] = useState(false);
  const [wishSuccessMsg, setWishSuccessMsg] = useState<string | null>(null);

  // Copy state
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const celebrationType = evt.event_type || 'WEDDING';
  const cfg = getCelebrationConfig(celebrationType, evt.host_name || '', evt.title || '');

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
        .catch(() => {});
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
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
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

  const handleCopyText = (text: string, type: 'passcode' | 'address' | 'link') => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      if (type === 'passcode') {
        setCopiedPasscode(true);
        setTimeout(() => setCopiedPasscode(false), 2500);
      } else if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (e) {}
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: evt.title || 'Celebration Invitation',
          text: `You're cordially invited to celebrate ${evt.title} with us!`,
          url: shareUrl,
        });
        return;
      } catch (e) {}
    }
    handleCopyText(shareUrl, 'link');
  };

  const handleQuickRsvpSubmit = async (status: string) => {
    setQuickRsvpSubmitting(true);
    const ok = await onQuickRsvp(status);
    setQuickRsvpSubmitting(false);
    if (ok && status === 'CONFIRMED') {
      setIsConfirmedState(true);
    }
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishMessage.trim()) return;
    setSubmittingWish(true);
    const ok = await onPostWish(wishName.trim() || 'Valued Guest', wishRel.trim(), wishMessage.trim());
    setSubmittingWish(false);
    if (ok) {
      setWishMessage('');
      setWishSuccessMsg('✨ Your warm blessing has been shared!');
      setTimeout(() => setWishSuccessMsg(null), 4000);
    }
  };

  const hasShagun = Boolean(evt.accepts_digital_shagun || evt.upi_id || evt.host_upi_mobile || evt.upi_qr_url);

  return (
    <div className="min-h-[100svh] min-h-screen relative overflow-x-hidden text-[#FFFDF9] select-none pb-32">
      {/* Background Audio */}
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="auto" />}

      {/* 3D WebGL Multi-Depth Parallax Background */}
      <WebGLShaderBackground eventType={celebrationType} />

      {/* 🌟 1. HERO INVITATION EXPERIENCE (ENVELOPE OR 3D CARD HERO) 🌟 */}
      {!isOpened ? (
        <EnvelopeExperience
          title={evt.title || 'Celebration'}
          hindiTitle={evt.hindi_title}
          salutation={guestPersonalization?.salutation || canonical.greeting}
          guestName={guestPersonalization?.guest_name}
          eventType={celebrationType}
          theme={activeTheme}
          musicUrl={musicUrl}
          onOpenComplete={handleOpenComplete}
          onToggleMusic={toggleMusic}
          isPlayingMusic={isPlayingMusic}
        />
      ) : (
        /* 🌟 2. CINEMATIC UNVEILED HERO SECTION 🌟 */
        <section
          id="hero-section"
          className="relative w-full min-h-[90svh] flex flex-col justify-between items-center text-center px-4 sm:px-6 pt-4 pb-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700"
        >
          {/* Top Controls: Tag Badge + Replay + Audio */}
          <div className="w-full flex items-center justify-between z-30 pt-1">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/60 border border-amber-300/60 text-amber-200 text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-widest backdrop-blur-xl shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{cfg.heroTag}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReplay}
                className="px-3.5 py-1.5 rounded-full bg-black/60 border border-amber-300/60 text-amber-200 text-[11px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-xl hover:bg-black/80 transition-all shadow-md active:scale-95"
                title="Replay Envelope Opening"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Replay ↺</span>
              </button>

              {musicUrl && (
                <button
                  type="button"
                  onClick={toggleMusic}
                  className={`p-2.5 rounded-full border border-amber-300/70 shadow-lg backdrop-blur-xl transition-all ${
                    isPlayingMusic
                      ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                      : 'bg-black/60 text-amber-300 hover:bg-black/80'
                  }`}
                  title={isPlayingMusic ? 'Mute Audio' : 'Play Audio'}
                >
                  {isPlayingMusic ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* 3D Physical Stationery Card */}
          <div className="w-full h-80 sm:h-96 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden my-auto">
            <Invitation3DCard
              theme={activeTheme}
              title={evt.title || 'Rohit & Priyanka'}
              hindiTitle={evt.hindi_title}
              dateStr={formattedDate}
              venueName={evt.venue_name}
              venueAddress={evt.venue_address}
              hostName={evt.host_name}
              interactiveTilt={true}
              className="w-full h-full"
            />
          </div>

          {/* RSVP Call-to-Action & Explore Indicator */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
            <button
              type="button"
              onClick={() => setIsRsvpModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-serif font-extrabold text-xs sm:text-sm text-white shadow-[0_10px_35px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 border-2 border-amber-300 active:scale-95 transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #7E1E38 0%, #591628 50%, #3D0D19 100%)',
              }}
            >
              <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>RSVP • CONFIRM ATTENDANCE</span>
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('invitation-chapters')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-400/50 font-serif font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all backdrop-blur-xl"
            >
              <span>Explore Details</span>
              <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
            </button>
          </div>
        </section>
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
          <section id="venue-details-chapter" className="space-y-5">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>WHEN & WHERE WE CELEBRATE</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
                Event Schedule & Location
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Card */}
              <div
                className="p-6 rounded-3xl border-2 border-amber-300/70 shadow-2xl backdrop-blur-2xl space-y-4 text-center flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(42, 10, 20, 0.95) 0%, rgba(22, 4, 11, 0.98) 100%)',
                }}
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center mx-auto shadow-md">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                    DATE & TIME
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">{formattedDate}</h3>
                  <p className="text-xs font-mono text-amber-200">⏰ {formattedTime} Onwards</p>
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      evt.title || 'Celebration'
                    )}&dates=${
                      evt.start_date
                        ? new Date(evt.start_date).toISOString().replace(/-|:|\.\d\d\d/g, '')
                        : ''
                    }&location=${encodeURIComponent(fullVenue)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Google Cal</span>
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      downloadIcsCalendarFile({
                        title: evt.title || 'Celebration',
                        start_date: evt.start_date || new Date().toISOString(),
                        venue_name: evt.venue_name || '',
                        venue_address: evt.venue_address || '',
                        description: evt.description || '',
                      })
                    }
                    className="flex-1 py-3 px-3 rounded-2xl bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-400/40 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Apple / .ics</span>
                  </button>
                </div>
              </div>

              {/* Venue Card */}
              <div
                className="p-6 rounded-3xl border-2 border-amber-300/70 shadow-2xl backdrop-blur-2xl space-y-4 text-center flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(42, 10, 20, 0.95) 0%, rgba(22, 4, 11, 0.98) 100%)',
                }}
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center mx-auto shadow-md">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
                    CELEBRATION VENUE
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {evt.venue_name || 'Celebration Venue'}
                  </h3>
                  {evt.venue_address && (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{evt.venue_address}</p>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all border border-emerald-400/50"
                  >
                    <Compass className="w-4 h-4 text-emerald-200" />
                    <span>VIEW LOCATION</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                  </a>

                  {fullVenue && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(fullVenue, 'address')}
                      className="py-3 px-3.5 rounded-2xl bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
                    >
                      {copiedAddress ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-300" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Featured Digital Shagun Button */}
            {hasShagun && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsShagunModalOpen(true)}
                  className="w-full py-4 px-6 rounded-3xl font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase text-amber-100 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border-2 border-amber-300/80 shadow-[0_12px_30px_-5px_rgba(200,155,90,0.35)] overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #7E1E38 0%, #591628 50%, #3D0D19 100%)',
                  }}
                >
                  <Gift className="w-5 h-5 text-amber-300 animate-bounce" />
                  <span className="drop-shadow-md tracking-widest text-amber-200">
                    {cfg.shagunButtonText}
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                </button>
              </div>
            )}
          </section>

          {/* Chapter 3: Formal Invitation Blessing & Shloka */}
          {(evt.invitation_message || canonical.message || evt.description) && (
            <section
              id="formal-invitation-chapter"
              className="p-6 sm:p-9 rounded-3xl border-2 border-amber-300/70 relative overflow-hidden backdrop-blur-2xl text-center space-y-4 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(42, 10, 20, 0.95) 0%, rgba(22, 4, 11, 0.98) 100%)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), inset 0 0 30px rgba(245, 158, 11, 0.08)',
              }}
            >
              {/* Corner Brackets */}
              <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

              {evt.hindi_title && (
                <div className="text-amber-300 font-serif font-bold text-base sm:text-lg tracking-widest drop-shadow-md">
                  {evt.hindi_title}
                </div>
              )}
              {canonical.greeting && (
                <div className="text-amber-200 font-serif text-sm sm:text-base font-semibold tracking-wide">
                  {canonical.greeting}
                </div>
              )}
              <p className="text-sm sm:text-base md:text-lg font-serif italic text-amber-50/95 leading-relaxed max-w-xl mx-auto drop-shadow-sm">
                "{evt.invitation_message || canonical.message || evt.description}"
              </p>
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto my-3" />
              <div className="text-xs sm:text-sm text-amber-300 font-serif italic pt-1">
                {canonical.blessing || `विनीतः: ${evt.host_name || 'समस्त परिवार'}`}
              </div>
            </section>
          )}

          {/* Chapter 4: Story Timeline (When Memories Exist) */}
          {memoriesList.length > 0 && (
            <section id="story-timeline-chapter" className="space-y-6">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>OUR CHERISHED JOURNEY</span>
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
                  Our Story
                </h2>
              </div>

              <Suspense fallback={<div className="p-8 text-center text-amber-400 text-xs">Loading Romantic Story...</div>}>
                <ParallaxStoryEngine
                  memories={memoriesList}
                  theme={{ ...activeTheme, id: activeTheme.id } as any}
                  onSelectMemory={(m) => setSelectedPhoto(m)}
                />
              </Suspense>
            </section>
          )}

          {/* Chapter 5: RSVP Attendance Section */}
          <section id="rsvp-attendance-chapter" className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{cfg.rsvpQuestion.toUpperCase()}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
                Confirm Attendance
              </h2>
            </div>

            <div
              className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/70 shadow-2xl backdrop-blur-2xl text-center space-y-5"
              style={{
                background: 'linear-gradient(135deg, rgba(42, 10, 20, 0.96) 0%, rgba(22, 4, 11, 0.98) 100%)',
              }}
            >
              {guestPersonalization?.guest_name && (
                <div className="text-amber-200 font-serif font-bold text-base">
                  Dear {guestPersonalization.guest_name}
                </div>
              )}

              {!isConfirmedState ? (
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm font-serif italic text-slate-200 max-w-md mx-auto leading-relaxed">
                    Kindly let us know if you will be joining us so we can prepare a warm welcome for you.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuickRsvpSubmit('CONFIRMED')}
                      disabled={quickRsvpSubmitting}
                      className="py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 border border-emerald-400 active:scale-95 transition-all"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      <span>{cfg.rsvpYesCta}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickRsvpSubmit('MAYBE')}
                      disabled={quickRsvpSubmitting}
                      className="py-4 px-4 rounded-2xl bg-black/60 hover:bg-black/80 text-amber-200 font-bold text-xs shadow-md flex items-center justify-center gap-2 border border-amber-400/40 active:scale-95 transition-all"
                    >
                      <span>{cfg.rsvpMaybeCta}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickRsvpSubmit('NOT_ATTENDING')}
                      disabled={quickRsvpSubmitting}
                      className="py-4 px-4 rounded-2xl bg-black/40 hover:bg-black/60 text-slate-400 font-bold text-xs shadow-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
                    >
                      <span>{cfg.rsvpNoCta}</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRsvpModalOpen(true)}
                      className="text-xs font-mono text-amber-300 underline hover:text-amber-200"
                    >
                      Need to add dietary preferences or plus-ones? Open Full RSVP Form →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-3xl bg-emerald-950/80 border border-emerald-400 text-emerald-100 space-y-3">
                  <div className="flex items-center justify-center gap-2 font-serif text-lg font-extrabold text-emerald-300">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span>✓ Attendance Confirmed!</span>
                  </div>
                  <p className="text-xs font-serif italic text-emerald-200">
                    "Your presence means the world to us. We look forward to celebrating together!"
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsPassModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md border border-emerald-400/40"
                    >
                      <QrCode className="w-4 h-4" /> View Entry Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRsvpModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-black/60 text-emerald-300 border border-emerald-400/40 text-xs font-bold"
                    >
                      Edit Response
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Wall of Love Wishes Form */}
            <div className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/70 bg-[#2A0A14]/95 backdrop-blur-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-extrabold text-amber-300 block">
                    ✦ CELEBRATION WISHES ✦
                  </span>
                  <h3 className="font-serif text-xl font-extrabold text-white">Send Your Warm Blessings</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold">
                  {wishesList.length} Wishes
                </div>
              </div>

              {wishSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-200 font-bold text-xs text-center border border-emerald-400/50 animate-bounce">
                  {wishSuccessMsg}
                </div>
              )}

              <form onSubmit={handleWishSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-amber-400/30 bg-black/60 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Family, Friend)"
                    value={wishRel}
                    onChange={(e) => setWishRel(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-amber-400/30 bg-black/60 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Write your blessing or heartfelt wish..."
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-amber-400/30 bg-black/60 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-amber-400"
                />

                <button
                  type="submit"
                  disabled={submittingWish}
                  className="w-full py-3.5 rounded-xl font-serif font-extrabold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] border border-amber-300/50 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #7E1E38 0%, #591628 50%, #3D0D19 100%)',
                  }}
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />{' '}
                  {submittingWish ? 'Sending Blessing...' : 'Post Blessing'}
                </button>
              </form>

              {wishesList.length > 0 && (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 pt-2 custom-scrollbar">
                  {wishesList.map((w: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-amber-400/25 bg-black/40 space-y-1 text-left">
                      <div className="flex items-center justify-between text-xs font-extrabold text-amber-200">
                        <span>{w.sender_name}</span>
                        <span className="text-[10px] font-mono text-amber-300/70 font-normal">
                          {w.relationship || 'Guest'}
                        </span>
                      </div>
                      <p className="text-xs font-serif italic text-slate-200 leading-relaxed">"{w.message}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Chapter 6: Digital VIP Entry Pass */}
          <section
            id="digital-vip-pass-chapter"
            className="p-6 sm:p-9 rounded-3xl border-2 border-amber-300/80 text-center space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(35, 6, 15, 0.96) 0%, rgba(16, 2, 8, 0.98) 100%)',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 0 35px rgba(245, 158, 11, 0.1)',
            }}
          >
            <div className="space-y-1">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest font-extrabold text-emerald-400 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/40">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> OFFICIAL GUEST ENTRY PASS
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5DC] via-[#FFD700] to-[#E5C07B] drop-shadow-md">
                {guestPersonalization?.guest_name || 'Valued Guest'}
              </h3>
              <p className="text-xs font-mono text-amber-200/80">
                Present this QR Code or Passcode at the reception entrance.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border-4 border-amber-400 w-44 h-44 mx-auto flex items-center justify-center shadow-2xl">
              <QRCodeSVG
                value={
                  guestPersonalization?.pass_code
                    ? `${window.location.origin}/scan/${evt.id}?code=${guestPersonalization.pass_code}`
                    : `${window.location.origin}/i/${evt.slug || evt.id}`
                }
                size={144}
                level="M"
              />
            </div>

            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <div className="flex-1 py-2.5 px-4 rounded-2xl bg-black border border-amber-400/60 font-mono text-base sm:text-lg font-extrabold text-amber-300 tracking-widest shadow-inner truncate">
                {guestPersonalization?.pass_code || 'NIM-ENTRY-1001'}
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopyText(guestPersonalization?.pass_code || 'NIM-ENTRY-1001', 'passcode')
                }
                className="py-2.5 px-3.5 rounded-2xl bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
              >
                {copiedPasscode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Chapter 7: Program Highlights (If present) */}
          {functionsList.length > 0 && (
            <section id="program-schedule-chapter" className="space-y-6">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300">
                  PROGRAM HIGHLIGHTS
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
                  Celebration Schedule
                </h2>
              </div>

              <div className="space-y-3">
                {functionsList.map((fn: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl border border-amber-300/40 bg-black/60 flex items-start gap-3.5 text-left shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-base shrink-0">
                      ✨
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="font-serif font-extrabold text-sm text-white">{fn.name || fn.title}</div>
                      <div className="text-xs font-mono text-amber-300 font-bold">
                        ⏰ {fn.date_time || fn.start_time || 'Scheduled Time'}
                      </div>
                      {fn.venue_name && <div className="text-xs text-slate-300 font-mono">📍 {fn.venue_name}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Chapter 8: Closing Signature, Share & Replay */}
          <footer className="text-center py-12 space-y-4 border-t border-amber-400/30">
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5DC] via-[#FFD700] to-[#E5C07B]">
              {cfg.closingSalutation}
            </h3>
            <p className="text-xs font-serif italic text-amber-100/80 max-w-sm mx-auto">
              "Thank you for being an indispensable part of our lives and celebration."
            </p>

            {/* Replay and Share Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReplay}
                className="px-5 py-2.5 rounded-full bg-black/60 border border-amber-400/50 text-amber-200 text-xs font-serif font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all hover:bg-black/80"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Replay Invitation</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-serif font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link Copied!' : 'Share Invitation'}</span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* 🌟 4. MOBILE FLOATING ACTION BAR 🌟 */}
      {isOpened && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 pt-2 bg-[#1A0309]/95 border-t border-amber-400/40 backdrop-blur-xl shadow-2xl transition-all pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsRsvpModalOpen(true)}
              className="flex-1 py-3 px-4 rounded-full font-serif font-extrabold text-xs text-white shadow-xl flex items-center justify-center gap-1.5 border border-amber-300 active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(135deg, #7E1E38 0%, #591628 50%, #3D0D19 100%)',
              }}
            >
              <Heart className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>{isConfirmedState ? '✓ RSVP CONFIRMED' : 'RSVP NOW'}</span>
            </button>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Map</span>
            </a>

            {hasShagun && (
              <button
                type="button"
                onClick={() => setIsShagunModalOpen(true)}
                className="py-3 px-3.5 rounded-full bg-[#4A1220] border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
              >
                <Gift className="w-3.5 h-3.5 text-amber-300" />
                <span>Shagun</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPassModalOpen(true)}
              className="py-3 px-3.5 rounded-full bg-emerald-950 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pass</span>
            </button>
          </div>
        </div>
      )}

      {/* 🌟 5. MODALS 🌟 */}
      <Suspense fallback={null}>
        <RsvpExperienceModal
          isOpen={isRsvpModalOpen}
          onClose={() => setIsRsvpModalOpen(false)}
          eventSlug={slug || ''}
          token={token || ''}
          eventTitle={evt.title}
          eventDate={formattedDate}
          eventVenue={fullVenue}
          guestName={guestPersonalization?.guest_name}
          onRsvpSuccess={() => {
            setIsConfirmedState(true);
            setIsRsvpModalOpen(false);
          }}
        />
      </Suspense>

      {hasShagun && (
        <Suspense fallback={null}>
          <DigitalShagunModal
            isOpen={isShagunModalOpen}
            onClose={() => setIsShagunModalOpen(false)}
            hostName={evt.host_name || evt.title || 'The Host'}
            eventTitle={evt.title}
            upiId={evt.upi_id}
            upiMobile={evt.host_upi_mobile}
            upiQrUrl={evt.upi_qr_url}
          />
        </Suspense>
      )}

      {isPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-sm w-full p-6 sm:p-8 rounded-3xl text-center space-y-5 relative shadow-2xl border-2 border-amber-400 bg-gradient-to-b from-[#20050E] to-[#120207] text-white">
            <button
              onClick={() => setIsPassModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-md border-2 border-emerald-400 bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-emerald-400">
                OFFICIAL ENTRY PASS
              </span>
              <h3 className="font-serif text-2xl font-extrabold text-amber-200">
                {guestPersonalization?.guest_name || 'Valued Guest'}
              </h3>
              <p className="text-xs font-mono text-slate-300">{evt.title}</p>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-amber-400 w-40 h-40 mx-auto flex items-center justify-center shadow-lg">
              <QRCodeSVG
                value={
                  guestPersonalization?.pass_code
                    ? `${window.location.origin}/scan/${evt.id}?code=${guestPersonalization.pass_code}`
                    : `${window.location.origin}/i/${evt.slug || evt.id}`
                }
                size={132}
                level="M"
              />
            </div>

            <div className="p-3 rounded-2xl border border-amber-400/50 bg-black/70 font-mono text-lg font-bold text-amber-300 tracking-widest">
              {guestPersonalization?.pass_code || 'NIM-ENTRY-1001'}
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-[#20050E] border-2 border-amber-400/60 space-y-4 relative text-white shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-xl font-bold text-amber-300">{selectedPhoto.title}</h3>
            {selectedPhoto.image_url && (
              <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-amber-400/30">
                <img src={selectedPhoto.image_url} alt={selectedPhoto.title} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
