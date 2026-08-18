import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  QrCode,
  Heart,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  X,
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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '../services/api';
import { PublicInvitationHero } from '../components/PublicInvitationHero';
import { WebGLShaderBackground } from '../components/WebGLShaderBackground';
import { getThemeTokens } from '../utils/themeEngine';
import { downloadIcsCalendarFile } from '../utils/calendarExport';

// Lazy-load below-the-fold modal and story components
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

export const PublicEventPage: React.FC = () => {
  const { slug, token } = useParams<{ slug?: string; token?: string }>();
  const [data, setData] = useState<any>(null);
  const [guestPersonalization, setGuestPersonalization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Audio Music Player State
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Interactive Gift Box Unwrapped State
  const [isGiftOpened, setIsGiftOpened] = useState<boolean>(false);

  const handleOpenGiftComplete = () => {
    setIsGiftOpened(true);
    if (audioRef.current && !isPlayingMusic) {
      audioRef.current
        .play()
        .then(() => setIsPlayingMusic(true))
        .catch((e) => {
          console.log('Audio autoplay note:', e);
        });
    }
  };

  const handleResetGift = () => {
    setIsGiftOpened(false);
  };

  // Scroll Tracking for Mobile Floating Sticky Bar
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Modals state
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [isConfirmedState, setIsConfirmedState] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isWelcomeWallOpen, setIsWelcomeWallOpen] = useState(false);
  const [isShagunModalOpen, setIsShagunModalOpen] = useState(false);
  const [quickRsvpSubmitting, setQuickRsvpSubmitting] = useState(false);

  // Wishes Wall state
  const [wishName, setWishName] = useState('');
  const [wishRel, setWishRel] = useState('Family & Friends');
  const [wishMessage, setWishMessage] = useState('');
  const [wishesList, setWishesList] = useState<any[]>([]);
  const [submittingWish, setSubmittingWish] = useState(false);
  const [wishSuccessMsg, setWishSuccessMsg] = useState<string | null>(null);

  // 1-Tap Copy feedback states
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyText = (text: string, type: 'passcode' | 'address') => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      if (type === 'passcode') {
        setCopiedPasscode(true);
        setTimeout(() => setCopiedPasscode(false), 2500);
      } else {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2500);
      }
    } catch (err) {
      console.log('Clipboard note:', err);
    }
  };

  // Photo Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  const formatDateSafe = (dateStr: any, options: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return 'Date to be Announced';
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return 'Date to be Announced';
    return parsed.toLocaleDateString('en-IN', options);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const cleanSlug = (slug || '').split('#')[0].split('?')[0];
    const cleanToken = (token || '').split('#')[0].split('?')[0];

    if (cleanToken) {
      apiFetch<any>(`/public/invitations/t/${cleanToken}`)
        .then((res) => {
          if (res && res.data) {
            setData({
              event: res.data.event,
              wishes: res.data.wishes || [],
              memories: res.data.memories || [],
              headline: `You're Graciously Invited`,
              lifecycle_phase: 'BEFORE',
            });
            setGuestPersonalization({
              guest_name: res.data.guest_name,
              salutation: res.data.salutation,
              rsvp_status: res.data.rsvp_status,
              music_url: res.data.music_url,
              theme_id: res.data.theme_id,
              pass_code: res.data.pass_code,
            });
            if (res.data.guest_name) {
              setWishName(res.data.guest_name);
            }
            if (res.data.rsvp_status === 'CONFIRMED' || res.data.rsvp_status === 'YES') {
              setIsConfirmedState(true);
            }
            setWishesList(res.data.wishes || []);
          } else {
            setData(null);
          }
        })
        .catch((err) => {
          console.error('Fetch public invitation error:', err);
          setData(null);
        })
        .finally(() => setLoading(false));
    } else if (cleanSlug) {
      apiFetch<any>(`/public/events/${cleanSlug}`)
        .then((res) => {
          if (res && res.data) {
            setData(res.data);
            setWishesList(res.data.wishes || []);
          } else {
            setData(null);
          }
        })
        .catch((err) => {
          console.error('Fetch public event error:', err);
          setData(null);
        })
        .finally(() => setLoading(false));
    }
  }, [slug, token]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingMusic(true);
        })
        .catch((e) => {
          console.warn('Audio auto-play prevented:', e);
        });
    }
  };

  // 1-Tap Quick RSVP Submission
  const handleQuickRsvp = async (status: 'CONFIRMED' | 'MAYBE' | 'NOT_ATTENDING') => {
    if (!slug && !token) return;
    setQuickRsvpSubmitting(true);
    try {
      const endpoint = token
        ? `/public/invitations/t/${token}/rsvp`
        : `/public/events/${slug}/rsvp`;

      const res = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          guest_name: guestPersonalization?.guest_name || 'Valued Guest',
          status: status === 'CONFIRMED' ? 'YES' : status,
          adults_attending: status === 'CONFIRMED' ? 2 : 1,
        }),
      });

      if (status === 'CONFIRMED') {
        setIsConfirmedState(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit RSVP');
    } finally {
      setQuickRsvpSubmitting(false);
    }
  };

  // Handle Post Blessing Wish
  const handlePostWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishMessage.trim() || (!slug && !token)) return;

    setSubmittingWish(true);
    try {
      const endpoint = token
        ? `/public/invitations/t/${token}/wishes`
        : `/public/events/${slug}/wishes`;

      const res = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          sender_name: wishName.trim() || 'Well Wisher',
          relationship: wishRel.trim() || 'Guest',
          message: wishMessage.trim(),
        }),
      });

      setWishesList([
        {
          sender_name: wishName.trim() || 'Well Wisher',
          relationship: wishRel.trim() || 'Guest',
          message: wishMessage.trim(),
          created_at: new Date().toISOString(),
        },
        ...wishesList,
      ]);

      setWishMessage('');
      setWishSuccessMsg('✨ Blessing sent with warm love!');
      setTimeout(() => setWishSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to post blessing');
    } finally {
      setSubmittingWish(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#140005] text-amber-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center animate-pulse mb-4 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
          <Sparkles className="w-7 h-7 animate-spin" />
        </div>
        <p className="font-serif italic text-lg text-amber-100 tracking-wide">
          Preparing your celebration invitation...
        </p>
      </div>
    );
  }

  const evt = data?.event || {
    title: 'Wedding Celebration',
    event_type: 'WEDDING',
    host_name: 'Gupta & Sharma Families',
    start_date: '2026-12-18T18:30:00',
    venue_name: 'The Taj Convention Centre',
    venue_address: 'Vipul Khand, Gomti Nagar, Lucknow',
    hindi_title: '|| श्री गणेशाय नमः ||',
    invitation_message:
      'Together with our families, we cordially invite you to celebrate our special day with us.',
  };

  const themeId = guestPersonalization?.theme_id || evt.theme_config?.theme || 'romantic-blush';
  const theme = getThemeTokens(themeId);
  const memoriesList = data?.memories || evt.theme_config?.memories || [];
  const functionsList = evt.functions || [];

  const formattedDate = formatDateSafe(evt.start_date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = evt.start_date
    ? new Date(evt.start_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '07:00 PM';

  const fullVenue = evt.venue_name
    ? `${evt.venue_name}${evt.venue_address ? ', ' + evt.venue_address : ''}`
    : 'Celebration Venue';
  const mapsUrl = evt.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(fullVenue)}`;

  const handleGoogleCalendar = () => {
    const eventDateObj = evt.start_date ? new Date(evt.start_date) : new Date('2026-12-18T18:30:00');
    const validDate = isNaN(eventDateObj.getTime()) ? new Date('2026-12-18T18:30:00') : eventDateObj;
    const start = validDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(validDate.getTime() + 4 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const details = evt.invitation_message || `You are graciously invited to celebrate ${evt.title}!`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      evt.title || 'Celebration'
    )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(fullVenue)}&dates=${start}/${end}`;
    window.open(gcalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = () => {
    const validDateStr =
      evt.start_date && !isNaN(new Date(evt.start_date).getTime())
        ? evt.start_date
        : new Date('2026-12-18T18:30:00').toISOString();
    downloadIcsCalendarFile({
      title: evt.title || 'Grand Celebration',
      description: evt.invitation_message || `You are graciously invited to celebrate ${evt.title}!`,
      venue_name: fullVenue,
      start_date: validDateStr,
    });
  };

  const musicTrackUrl =
    guestPersonalization?.music_url ||
    evt.theme_config?.music_url ||
    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';

  return (
    <div
      className="min-h-[100svh] min-h-screen font-sans pb-32 relative overflow-x-hidden text-[#302829] selection:bg-amber-400 selection:text-black"
      style={{ backgroundColor: '#0F0206' }}
    >
      {/* Background Celebration Audio Element */}
      {musicTrackUrl && <audio ref={audioRef} src={musicTrackUrl} loop preload="auto" />}

      {/* 0. INTERACTIVE ATMOSPHERIC CANVAS BACKGROUND */}
      <WebGLShaderBackground theme={theme} />

      {/* 🌟 1. HERO SECTION (100svh) 🌟 */}
      <PublicInvitationHero
        title={evt.title}
        hindiTitle={evt.hindi_title}
        englishTitle={evt.english_title}
        coupleNames={
          evt.couple_names ||
          (evt.bride_name && evt.groom_name ? `${evt.groom_name} & ${evt.bride_name}` : undefined)
        }
        invitationMessage={evt.invitation_message}
        eventType={evt.event_type}
        startDate={evt.start_date}
        venueName={evt.venue_name}
        venueAddress={evt.venue_address}
        googleMapsUrl={evt.google_maps_url}
        hostName={evt.host_name}
        salutation={guestPersonalization?.salutation}
        guestName={guestPersonalization?.guest_name}
        passCode={guestPersonalization?.pass_code || 'NIM-ENTRY-1001'}
        musicUrl={musicTrackUrl}
        theme={theme}
        formatDateSafe={formatDateSafe}
        onOpenRsvpModal={() => setIsRsvpModalOpen(true)}
        onOpenShagunModal={() => setIsShagunModalOpen(true)}
        isPlayingMusic={isPlayingMusic}
        onToggleMusic={toggleMusic}
        isGiftOpened={isGiftOpened}
        onOpenGiftComplete={handleOpenGiftComplete}
        onResetGift={handleResetGift}
      />

      {/* MAIN INVITATION BODY */}
      <div
        id="invitation-experience"
        className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16 pt-4 relative z-10"
      >
        {/* 🌟 2. EVENT DETAILS & VENUE SECTION 🌟 */}
        <section id="event-details-section" className="space-y-5">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>EVENT DETAILS & VENUE</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
              When & Where We Celebrate
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date & Time Card */}
            <div
              className="p-6 rounded-3xl border-2 border-amber-300/60 shadow-xl backdrop-blur-xl space-y-4 text-center flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 8, 16, 0.95) 0%, rgba(18, 3, 8, 0.97) 100%)',
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

              {/* Add to Calendar */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleGoogleCalendar}
                  className="flex-1 py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Google Cal</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="flex-1 py-3 px-3 rounded-2xl bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-400/40 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Apple / .ics</span>
                </button>
              </div>
            </div>

            {/* Venue & Directions Card */}
            <div
              className="p-6 rounded-3xl border-2 border-amber-300/60 shadow-xl backdrop-blur-xl space-y-4 text-center flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 8, 16, 0.95) 0%, rgba(18, 3, 8, 0.97) 100%)',
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
                  {evt.venue_name || 'Grand Banquet Hall'}
                </h3>
                {evt.venue_address && (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{evt.venue_address}</p>
                )}
              </div>

              {/* Get Directions & Copy Address */}
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
                    title="Copy full venue address"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-300" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Featured Digital Shagun Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsShagunModalOpen(true)}
              className="w-full py-4 px-6 rounded-3xl font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase text-amber-100 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border-2 border-amber-300/80 shadow-[0_12px_30px_-5px_rgba(200,155,90,0.35)] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #6E2035 0%, #521626 50%, #3A1420 100%)',
              }}
            >
              <Gift className="w-5 h-5 text-amber-300 animate-bounce" />
              <span className="drop-shadow-md tracking-widest text-amber-200">
                🎁 BLESSINGS & DIGITAL SHAGUN (UPI)
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            </button>
          </div>
        </section>

        {/* 🌟 3. FORMAL INVITATION BLESSINGS 🌟 */}
        <section
          id="invitation-message-section"
          className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/60 bg-gradient-to-b from-[#2A0A14]/90 to-[#1A040C]/90 backdrop-blur-xl text-center space-y-4 shadow-xl"
        >
          <div className="text-amber-300 font-serif font-bold text-base">|| श्री गणेशाय नमः ||</div>
          <div className="text-amber-200 font-serif text-sm font-semibold">सपरिवार सादर निमंत्रण</div>

          <p className="text-sm sm:text-base font-serif italic text-white leading-relaxed max-w-xl mx-auto">
            "मान्यवर, {evt.host_name || 'परिवार'} की ओर से '{evt.title}' के शुभ अवसर पर आपकी गरिमामयी उपस्थिति अत्यंत प्रार्थनीय है।"
          </p>

          <div className="w-24 h-px bg-amber-400/40 mx-auto my-2" />

          <p className="text-xs text-slate-300 font-serif italic leading-relaxed max-w-lg mx-auto">
            "Together with our families, we cordially request the honor of your presence and warm blessings as we celebrate this joyous milestone."
          </p>

          <div className="text-xs text-amber-300 font-serif italic pt-2">
            विनीतः एवं दर्शनाभिलाषी: समस्त परिवार
          </div>
        </section>

        {/* 🌟 4. STORY TIMELINE 🌟 */}
        {memoriesList.length > 0 && (
          <section id="story-timeline-section" className="space-y-6">
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
                theme={theme}
                onSelectMemory={(m) => setSelectedPhoto(m)}
              />
            </Suspense>
          </section>
        )}

        {/* 🌟 5. RSVP ATTENDANCE SECTION 🌟 */}
        <section id="rsvp-and-blessings-section" className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>WILL YOU CELEBRATE WITH US?</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
              Confirm Attendance
            </h2>
          </div>

          <div
            className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/70 shadow-2xl backdrop-blur-xl text-center space-y-5"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 8, 16, 0.96) 0%, rgba(18, 3, 8, 0.97) 100%)',
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

                {/* 3 Touch-Friendly Choice Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickRsvp('CONFIRMED')}
                    disabled={quickRsvpSubmitting}
                    className="py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 border border-emerald-400 active:scale-95 transition-all"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>❤️ YES, I'LL BE THERE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRsvp('MAYBE')}
                    disabled={quickRsvpSubmitting}
                    className="py-4 px-4 rounded-2xl bg-black/60 hover:bg-black/80 text-amber-200 font-bold text-xs shadow-md flex items-center justify-center gap-2 border border-amber-400/40 active:scale-95 transition-all"
                  >
                    <span>🤍 MAYBE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRsvp('NOT_ATTENDING')}
                    disabled={quickRsvpSubmitting}
                    className="py-4 px-4 rounded-2xl bg-black/40 hover:bg-black/60 text-slate-400 font-bold text-xs shadow-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
                  >
                    <span>SORRY, CAN'T MAKE IT</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRsvpModalOpen(true)}
                    className="text-xs font-mono text-amber-300 underline hover:text-amber-200"
                  >
                    Need to add meal preferences or additional guests? Open Full RSVP Form →
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
                  "We are overjoyed that you are joining us to celebrate!"
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

          {/* Wall of Love Blessings Form */}
          <div className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/60 bg-[#2A0A14]/90 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-extrabold text-amber-300 block">
                  ✦ WALL OF LOVE ✦
                </span>
                <h3 className="font-serif text-xl font-extrabold text-white">Send Your Warm Blessings</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold">
                {wishesList.length} Blessings
              </div>
            </div>

            {wishSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-200 font-bold text-xs text-center border border-emerald-400/50 animate-bounce">
                {wishSuccessMsg}
              </div>
            )}

            <form onSubmit={handlePostWish} className="space-y-3">
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

              {/* 1-Tap Quick Blessing Preset Chips */}
              <div className="space-y-1.5 pt-0.5 text-left">
                <span className="text-[10px] font-mono text-amber-300/80 font-bold uppercase tracking-wider block">
                  ⚡ 1-Tap Quick Blessing:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '💐 Heartiest Congratulations & Best Wishes!',
                    '✨ Wishing you a lifetime of love and happiness!',
                    '🙏 May God shower eternal blessings upon you both!',
                    '🎉 Excited to celebrate this special day with you!',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWishMessage(preset)}
                      className="py-1 px-2.5 rounded-full bg-black/60 hover:bg-black/80 border border-amber-400/30 text-[11px] font-serif text-slate-200 hover:text-amber-200 transition-all active:scale-95 text-left shadow-sm"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingWish}
                className="w-full py-3.5 rounded-xl font-serif font-extrabold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] border border-amber-300/50 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #6E2035 0%, #521626 50%, #3A1420 100%)',
                }}
              >
                <Send className="w-3.5 h-3.5 text-amber-300" />{' '}
                {submittingWish ? 'Sending Blessing...' : 'Post Blessing'}
              </button>
            </form>

            {/* Wishes Feed */}
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

        {/* 🌟 6. DIGITAL ENTRY PASS SECTION 🌟 */}
        <section
          id="guest-pass-section"
          className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/70 bg-gradient-to-b from-[#20050E] to-[#120207] text-center space-y-5 shadow-2xl"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-emerald-400 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> OFFICIAL GUEST ENTRY PASS
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white">
              {guestPersonalization?.guest_name || 'Valued Guest'}
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Present this QR Code or Passcode at the venue reception gate.
            </p>
          </div>

          {/* QR Code Graphic */}
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

          {/* Passcode Pill with 1-Tap Copy */}
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
              title="Copy Passcode"
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

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsPassModalOpen(true)}
              className="py-2.5 px-5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/50 text-emerald-200 text-xs font-serif font-bold inline-flex items-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <QrCode className="w-4 h-4 text-emerald-300" />
              <span>Full Screen Gate Pass</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-serif italic">
            ✓ Invitation Verified • Nimantran AI Pass System
          </p>
        </section>

        {/* 🌟 7. PROGRAM SCHEDULE (IF CONFIGURED) 🌟 */}
        {functionsList.length > 0 && (
          <section id="schedule-section" className="space-y-6">
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
                    <div className="font-serif font-extrabold text-sm text-white">{fn.name}</div>
                    <div className="text-xs font-mono text-amber-300 font-bold">
                      ⏰ {fn.date_time || 'Scheduled Time'}
                    </div>
                    {fn.venue_name && <div className="text-xs text-slate-300 font-mono">📍 {fn.venue_name}</div>}
                    {fn.description && (
                      <p className="text-xs font-serif italic text-slate-400 pt-1">"{fn.description}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🌟 8. EMOTIONAL CLOSING FRAME 🌟 */}
        <footer className="text-center py-12 space-y-3 border-t border-amber-400/30">
          <div className="text-amber-300 font-serif text-lg sm:text-xl font-bold">
            With Joyful Hearts & Love,
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5DC] via-[#FFD700] to-[#E5C07B]">
            {evt.couple_names || evt.title}
          </h3>
          <p className="text-xs font-serif italic text-amber-100/80 max-w-sm mx-auto">
            "Thank you for being an indispensable part of our lives and celebration."
          </p>
          <div className="pt-2 text-[10px] font-mono uppercase tracking-widest text-amber-300/70">
            NIMANTRAN AI CELEBRATION STUDIO
          </div>
        </footer>
      </div>

      {/* 🌟 9. SINGLE MOBILE FLOATING STICKY ACTION BAR 🌟 */}
      {showStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 pt-2 bg-[#1A0309]/95 border-t border-amber-400/40 backdrop-blur-xl shadow-2xl transition-all animate-in slide-in-from-bottom duration-300 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsRsvpModalOpen(true)}
              className="flex-1 py-3 px-4 rounded-full font-serif font-extrabold text-xs text-white shadow-xl flex items-center justify-center gap-1.5 border border-amber-300 active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(135deg, #6E2035 0%, #521626 50%, #3A1420 100%)',
              }}
            >
              <Heart className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>{isConfirmedState ? '✓ RSVP CONFIRMED' : '❤️ RSVP NOW'}</span>
            </button>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
              title="Open Location in Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Map</span>
            </a>

            <button
              type="button"
              onClick={() => setIsShagunModalOpen(true)}
              className="py-3 px-3.5 rounded-full bg-[#4A1220] border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
              title="Send Digital Shagun via UPI"
            >
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>Shagun</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPassModalOpen(true)}
              className="py-3 px-3.5 rounded-full bg-emerald-950 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
              title="View Entry Gate Pass"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pass</span>
            </button>
          </div>
        </div>
      )}

      {/* 🌟 10. MODALS 🌟 */}

      {/* RSVP Modal */}
      <Suspense fallback={null}>
        <RsvpExperienceModal
          isOpen={isRsvpModalOpen}
          onClose={() => setIsRsvpModalOpen(false)}
          eventSlug={slug || ''}
          token={token || ''}
          eventTitle={evt.title}
          eventDate={formatDateSafe(evt.start_date, { day: 'numeric', month: 'short', year: 'numeric' })}
          eventVenue={fullVenue}
          guestName={guestPersonalization?.guest_name}
          onRsvpSuccess={() => {
            setIsConfirmedState(true);
            setIsRsvpModalOpen(false);
          }}
        />
      </Suspense>

      {/* Digital Shagun Modal */}
      <Suspense fallback={null}>
        <DigitalShagunModal
          isOpen={isShagunModalOpen}
          onClose={() => setIsShagunModalOpen(false)}
          hostName={evt.host_name || 'Gupta & Sharma Families'}
          eventTitle={evt.title}
          upiId={evt.upi_id}
          upiMobile={evt.host_upi_mobile}
          upiQrUrl={evt.upi_qr_url}
        />
      </Suspense>

      {/* Gate Entry Pass Modal */}
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

            {/* QR Code */}
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

            <p className="text-[11px] text-slate-300 italic font-serif">
              Present this QR Code or Passcode at the venue reception for seamless entry.
            </p>
          </div>
        </div>
      )}

      {/* Big Screen LED Welcome Wall Display Modal */}
      <Suspense fallback={null}>
        <EventWelcomeWallModal
          isOpen={isWelcomeWallOpen}
          onClose={() => setIsWelcomeWallOpen(false)}
          guestName={guestPersonalization?.guest_name || 'Amit Gupta & Family'}
          salutation={guestPersonalization?.salutation || 'Dear Valued Guest'}
          eventTitle={evt.title}
          passCode={guestPersonalization?.pass_code || 'NIM-ENTRY-PASS'}
          theme={theme}
        />
      </Suspense>

      {/* Photo Lightbox Modal */}
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
            <p className="text-xs font-serif italic text-slate-200 leading-relaxed">
              "{selectedPhoto.story || selectedPhoto.hindi_story || selectedPhoto.english_story || ''}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
