import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, MapPin, QrCode, Heart, Sparkles, Send, CheckCircle2, 
  Clock, Image as ImageIcon, MessageSquare, X, Download, UserCheck, Check, Monitor,
  Volume2, VolumeX, Gift, ExternalLink, ChevronDown, ShieldCheck, Compass, Copy, Bookmark
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '../services/api';
import { PublicInvitationHero } from '../components/PublicInvitationHero';
import { WebGLShaderBackground } from '../components/WebGLShaderBackground';
import { getThemeTokens } from '../utils/themeEngine';
import { downloadIcsCalendarFile } from '../utils/calendarExport';

// 🌟 LAZY-LOADED BELOW-THE-FOLD COMPONENTS (EXTREMELY FAST INITIAL LANDING LOAD) 🌟
const ParallaxStoryEngine = lazy(() => import('../components/ParallaxStoryEngine').then(m => ({ default: m.ParallaxStoryEngine })));
const DigitalShagunModal = lazy(() => import('../components/DigitalShagunModal').then(m => ({ default: m.DigitalShagunModal })));
const RsvpExperienceModal = lazy(() => import('../components/RsvpExperienceModal').then(m => ({ default: m.RsvpExperienceModal })));
const EventWelcomeWallModal = lazy(() => import('../components/EventWelcomeWallModal').then(m => ({ default: m.EventWelcomeWallModal })));

export const PublicEventPage: React.FC = () => {
  const { slug, token } = useParams<{ slug?: string; token?: string }>();
  const [data, setData] = useState<any>(null);
  const [guestPersonalization, setGuestPersonalization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Audio Music Player State
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Interactive Gift Box Unwrapped State - Always present & closed when guest lands
  const [isGiftOpened, setIsGiftOpened] = useState<boolean>(false);

  const handleOpenGiftComplete = () => {
    setIsGiftOpened(true);
    // Autoplay ambient celebration music on user gift opening interaction
    if (audioRef.current && !isPlayingMusic) {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch((e) => {
        console.log('Audio autoplay note:', e);
      });
    }
  };

  const handleResetGift = () => {
    setIsGiftOpened(false);
  };

  // Scroll Tracking for Mobile Floating Bottom Action Bar
  const [showStickyBar, setShowStickyBar] = useState(false);

  // RSVP Modal & State
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [isConfirmedState, setIsConfirmedState] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isWelcomeWallOpen, setIsWelcomeWallOpen] = useState(false);
  const [isShagunModalOpen, setIsShagunModalOpen] = useState(false);
  const [quickRsvpSubmitting, setQuickRsvpSubmitting] = useState(false);

  // Invitee Message Wall state
  const [wishName, setWishName] = useState('');
  const [wishRel, setWishRel] = useState('Family & Friends');
  const [wishMessage, setWishMessage] = useState('');
  const [wishesList, setWishesList] = useState<any[]>([]);
  const [submittingWish, setSubmittingWish] = useState(false);
  const [wishSuccessMsg, setWishSuccessMsg] = useState<string | null>(null);

  // 1-Tap Copy states for friction-free UX
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

  // Photo Zoom Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Safe Date Formatting helper preventing crashes
  const formatDateSafe = (dateStr: any, options: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return 'Date to be Announced';
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return 'Date to be Announced';
    return parsed.toLocaleDateString('en-IN', options);
  };

  useEffect(() => {
    const handleScroll = () => {
      // Show floating bottom action bar when user scrolls past 280px (past hero)
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
      // Fetch via cryptographic token
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
          console.error('Fetch public invitation by token error:', err);
          setData(null);
        })
        .finally(() => setLoading(false));
    } else if (cleanSlug) {
      // Fetch via event slug
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
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch((e) => {
        console.warn('Audio auto-play prevented:', e);
      });
    }
  };

  // 1-Tap Quick RSVP Submission
  const handleQuickRsvp = async (status: 'CONFIRMED' | 'MAYBE' | 'NOT_ATTENDING') => {
    const targetIdentifier = slug || token;
    if (!targetIdentifier) return;
    setQuickRsvpSubmitting(true);
    try {
      await apiFetch<any>(`/public/events/${targetIdentifier}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({
          guest_name: guestPersonalization?.guest_name || 'Valued Guest',
          status: status,
          adults_attending: status === 'CONFIRMED' ? 2 : 1,
        }),
      });
      if (status === 'CONFIRMED') {
        setIsConfirmedState(true);
      }
      setWishSuccessMsg(status === 'CONFIRMED' ? '🎉 RSVP Confirmed! We look forward to celebrating with you!' : 'RSVP updated successfully.');
      setTimeout(() => setWishSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Could not submit RSVP response.');
    } finally {
      setQuickRsvpSubmitting(false);
    }
  };

  // Submit Invitee Wish / Blessing
  const handlePostWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishMessage || (!slug && !token)) return;
    const targetIdentifier = slug || token;
    setSubmittingWish(true);
    try {
      const res = await apiFetch<any>(`/public/events/${targetIdentifier}/wishes`, {
        method: 'POST',
        body: JSON.stringify({
          sender_name: wishName || guestPersonalization?.guest_name || 'Well Wisher',
          relationship: wishRel || 'Guest',
          message: wishMessage,
        }),
      });
      setWishesList([res.data, ...wishesList]);
      setWishName('');
      setWishRel('');
      setWishMessage('');
      setWishSuccessMsg(res.message || 'Your warm blessing has been added to the celebration wall!');
      setTimeout(() => setWishSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to post wish');
    } finally {
      setSubmittingWish(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100svh] min-h-screen bg-[#0A1128] flex flex-col items-center justify-center text-amber-400 font-serif text-sm p-4 text-center space-y-3">
        <Sparkles className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
        <div className="text-base font-bold text-amber-200">Opening Your Personal Digital Invitation...</div>
        <div className="text-xs text-slate-400 font-mono">Nimantran AI — Luxury Celebration Experience</div>
      </div>
    );
  }

  if (!data || !data.event) {
    return (
      <div className="min-h-[100svh] min-h-screen bg-[#0A1128] flex flex-col items-center justify-center p-4 text-center space-y-4 text-white">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
          <X className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold">Invitation Unavailable</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          The requested invitation link is either expired or does not exist.
        </p>
        <a href="/" className="px-6 py-3 rounded-full bg-amber-500 text-black font-bold text-xs shadow-lg">
          Return to Nimantran AI Home
        </a>
      </div>
    );
  }

  const evt = data.event;
  const evtType = (evt.event_type || '').toUpperCase();
  const theme = getThemeTokens(guestPersonalization?.theme_id || evt?.theme_config?.theme);

  // Extract conditional datasets
  const memoriesList = (data.memories && data.memories.length > 0) ? data.memories : (evt.theme_config?.memories || []);
  const functionsList = (evt.functions && evt.functions.length > 0) ? evt.functions : (evt.theme_config?.functions || []);
  const speakersList = evt.theme_config?.speakers || [];

  const formattedDate = formatDateSafe(evt.start_date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = evt.start_date
    ? new Date(evt.start_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '07:00 PM';

  const fullVenue = evt.venue_name ? `${evt.venue_name}${evt.venue_address ? ', ' + evt.venue_address : ''}` : 'Celebration Venue';
  const mapsUrl = evt.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(fullVenue)}`;

  // Google Calendar handler
  const handleGoogleCalendar = () => {
    const eventDateObj = evt.start_date ? new Date(evt.start_date) : new Date('2026-12-18T18:30:00');
    const validDate = isNaN(eventDateObj.getTime()) ? new Date('2026-12-18T18:30:00') : eventDateObj;
    const start = validDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(validDate.getTime() + 4 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const details = evt.invitation_message || `You are graciously invited to celebrate ${evt.title}!`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evt.title || 'Celebration')}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(fullVenue)}&dates=${start}/${end}`;
    window.open(gcalUrl, '_blank', 'noopener,noreferrer');
  };

  // Apple / Outlook .ics download handler
  const handleDownloadIcs = () => {
    const validDateStr = evt.start_date && !isNaN(new Date(evt.start_date).getTime()) ? evt.start_date : new Date('2026-12-18T18:30:00').toISOString();
    downloadIcsCalendarFile({
      title: evt.title || 'Grand Celebration',
      description: evt.invitation_message || `You are graciously invited to celebrate ${evt.title}!`,
      venue_name: fullVenue,
      start_date: validDateStr,
    });
  };

  const musicTrackUrl = guestPersonalization?.music_url || evt.theme_config?.music_url || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';

  return (
    <div 
      className="min-h-[100svh] min-h-screen font-sans pb-32 relative overflow-x-hidden text-[#302829] selection:bg-amber-400 selection:text-black"
      style={{ backgroundColor: '#070D1F' }}
    >
      {/* Background Celebration Audio Element */}
      {musicTrackUrl && (
        <audio
          ref={audioRef}
          src={musicTrackUrl}
          loop
          preload="auto"
        />
      )}

      {/* 0. INTERACTIVE WEBGL / SHADER CANVAS BACKGROUND */}
      <WebGLShaderBackground theme={theme} />

      {/* 🌟 1. HERO SECTION — FULL MOBILE VIEWPORT 100svh (ONLY THIS SECTION INITIALLY VISIBLE) 🌟 */}
      <PublicInvitationHero
        title={evt.title}
        hindiTitle={evt.hindi_title}
        englishTitle={evt.english_title}
        coupleNames={evt.couple_names || (evt.bride_name && evt.groom_name ? `${evt.groom_name} & ${evt.bride_name}` : undefined)}
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

      {/* MAIN PROGRESSIVE INVITATION EXPERIENCE BODY */}
      <div id="invitation-experience" className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16 pt-4 relative z-10">
        
        {/* 🌟 2. EVENT DETAILS & 1-TAP ACTION CARDS SECTION 🌟 */}
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
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 19, 43, 0.97) 100%)',
              }}
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center mx-auto shadow-md">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                  DATE & TIME
                </span>
                <h3 className="font-serif text-lg font-bold text-white">
                  {formattedDate}
                </h3>
                <p className="text-xs font-mono text-amber-200">
                  ⏰ {formattedTime} Onwards
                </p>
              </div>

              {/* Add to Calendar Button */}
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
                  className="flex-1 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-400/30 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
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
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 19, 43, 0.97) 100%)',
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
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {evt.venue_address}
                  </p>
                )}
              </div>

              {/* Get Directions & Copy Address Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all border border-emerald-400/50"
                >
                  <Compass className="w-4 h-4 text-emerald-200" />
                  <span>GET DIRECTIONS</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </a>

                {fullVenue && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(fullVenue, 'address')}
                    className="py-3 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
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
              className="w-full py-4 px-6 rounded-3xl font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase text-amber-100 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border-2 border-amber-300/80 shadow-[0_12px_30px_-5px_rgba(218,165,32,0.35)] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #4C1D95 0%, #3B0764 45%, #1E1B4B 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 30px rgba(234, 179, 8, 0.3), 0 10px 30px -5px rgba(0, 0, 0, 0.6)',
              }}
            >
              <Gift className="w-5 h-5 text-amber-300 animate-bounce" />
              <span className="drop-shadow-md tracking-widest text-amber-200">
                🎁 SEND DIGITAL SHAGUN & BLESSINGS (UPI)
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            </button>
          </div>
        </section>

        {/* 🌟 3. FORMAL INVITATION MESSAGE & FAMILY BLESSINGS 🌟 */}
        <section id="invitation-message-section" className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/60 bg-gradient-to-b from-[#0F172A]/90 to-[#1E1B4B]/90 backdrop-blur-xl text-center space-y-4 shadow-xl">
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

        {/* 🌟 4. STORY TIMELINE (LAZY LOADED & RESPONSIVE WITH NO TIME INFO) 🌟 */}
        {memoriesList.length > 0 && (
          <section id="story-timeline-section" className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>OUR CHERISHED JOURNEY</span>
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
                Storybook Timeline
              </h2>
              <p className="text-xs font-serif italic text-amber-100/90 max-w-md mx-auto">
                The beautiful moments that brought us to this celebration.
              </p>
            </div>

            <Suspense fallback={<div className="p-8 text-center text-amber-400 text-xs">Loading Romantic Storyline...</div>}>
              <ParallaxStoryEngine
                memories={memoriesList}
                theme={theme}
                onSelectMemory={(m) => setSelectedPhoto(m)}
              />
            </Suspense>
          </section>
        )}

        {/* 🌟 5. RSVP CONFIRMATION & WALL OF LOVE (BLESSINGS) 🌟 */}
        <section id="rsvp-and-blessings-section" className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>CONFIRM ATTENDANCE & BLESSINGS</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
              Will You Grace Our Celebration?
            </h2>
          </div>

          {/* Quick RSVP Card */}
          <div 
            className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/70 shadow-2xl backdrop-blur-xl text-center space-y-5"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 15, 45, 0.97) 100%)',
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

                {/* 3 Large Touch-Friendly Quick Choice Buttons */}
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
                    className="py-4 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-xs shadow-md flex items-center justify-center gap-2 border border-amber-400/40 active:scale-95 transition-all"
                  >
                    <span>🤔 MAYBE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRsvp('NOT_ATTENDING')}
                    disabled={quickRsvpSubmitting}
                    className="py-4 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs shadow-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
                  >
                    <span>😔 CAN'T MAKE IT</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRsvpModalOpen(true)}
                    className="text-xs font-mono text-amber-300 underline hover:text-amber-200"
                  >
                    Need to add meal preferences or guests? Open Full RSVP Form →
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
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-emerald-300 border border-emerald-400/40 text-xs font-bold"
                  >
                    Edit Response
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Blessing Wall */}
          <div className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/60 bg-[#0F172A]/90 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-extrabold text-amber-300 block">
                  ✦ WALL OF LOVE ✦
                </span>
                <h3 className="font-serif text-xl font-extrabold text-white">
                  Send Your Warm Blessings
                </h3>
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
                  className="px-4 py-3 rounded-xl border border-amber-400/30 bg-slate-950/80 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  placeholder="Relationship (e.g. Family, Friend)"
                  value={wishRel}
                  onChange={(e) => setWishRel(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-amber-400/30 bg-slate-950/80 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Write your blessing or heartfelt wish..."
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-amber-400/30 bg-slate-950/80 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-amber-400"
              />

              {/* 1-Tap Quick Blessing Preset Chips */}
              <div className="space-y-1.5 pt-0.5 text-left">
                <span className="text-[10px] font-mono text-amber-300/80 font-bold uppercase tracking-wider block">
                  ⚡ 1-Tap Quick Blessing:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "💐 Heartiest Congratulations & Best Wishes!",
                    "✨ Wishing you a lifetime of love and happiness!",
                    "🙏 May God shower eternal blessings upon you both!",
                    "🎉 Excited to celebrate this special day with you!",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWishMessage(preset)}
                      className="py-1 px-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-amber-400/30 text-[11px] font-serif text-slate-200 hover:text-amber-200 transition-all active:scale-95 text-left shadow-sm"
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
                  background: 'linear-gradient(135deg, #1E2A4A 0%, #10192D 60%, #0B132B 100%)',
                }}
              >
                <Send className="w-3.5 h-3.5 text-amber-300" /> {submittingWish ? 'Sending Blessing...' : 'Post Blessing'}
              </button>
            </form>

            {/* Wishes Feed */}
            {wishesList.length > 0 && (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 pt-2 custom-scrollbar">
                {wishesList.map((w: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-amber-400/25 bg-black/40 space-y-1 text-left">
                    <div className="flex items-center justify-between text-xs font-extrabold text-amber-200">
                      <span>{w.sender_name}</span>
                      <span className="text-[10px] font-mono text-amber-300/70 font-normal">{w.relationship || 'Guest'}</span>
                    </div>
                    <p className="text-xs font-serif italic text-slate-200 leading-relaxed">"{w.message}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 🌟 6. DIGITAL GATE ENTRY PASS & QR CODE SECTION 🌟 */}
        <section id="guest-pass-section" className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300/70 bg-gradient-to-b from-[#0F172A] to-[#0B0F19] text-center space-y-5 shadow-2xl">
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
              value={guestPersonalization?.pass_code ? `${window.location.origin}/scan/${evt.id}?code=${guestPersonalization.pass_code}` : `${window.location.origin}/i/${evt.slug || evt.id}`} 
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
              onClick={() => handleCopyText(guestPersonalization?.pass_code || 'NIM-ENTRY-1001', 'passcode')}
              className="py-2.5 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
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

        {/* 🌟 7. PROGRAM SCHEDULE HIGHLIGHTS (IF CONFIGURED) 🌟 */}
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
                <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-amber-300/40 bg-slate-950/80 flex items-start gap-3.5 text-left shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-base shrink-0">
                    ✨
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="font-serif font-extrabold text-sm text-white">{fn.name}</div>
                    <div className="text-xs font-mono text-amber-300 font-bold">⏰ {fn.date_time || 'Scheduled Time'}</div>
                    {fn.venue_name && <div className="text-xs text-slate-300 font-mono">📍 {fn.venue_name}</div>}
                    {fn.description && <p className="text-xs font-serif italic text-slate-400 pt-1">"{fn.description}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🌟 8. CLOSING ROYAL FOOTER 🌟 */}
        <footer className="text-center py-10 space-y-2 border-t border-amber-400/30">
          <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white">
            WE CAN'T WAIT TO CELEBRATE WITH YOU.
          </h3>
          <p className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-amber-300">
            NIMANTRAN AI — ONE INVITATION. ONE LINK. ENTIRE CELEBRATION.
          </p>
        </footer>

      </div>

      {/* 🌟 9. MOBILE FLOATING STICKY ACTION BAR (PINNED TO BOTTOM WITH SAFE-AREA INSET) 🌟 */}
      {showStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 pt-2 bg-[#0A1128]/90 border-t border-amber-400/40 backdrop-blur-xl shadow-2xl transition-all animate-in slide-in-from-bottom duration-300 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
            {/* Primary RSVP Action */}
            <button
              type="button"
              onClick={() => setIsRsvpModalOpen(true)}
              className="flex-1 py-3 px-4 rounded-full font-serif font-extrabold text-xs text-white shadow-xl flex items-center justify-center gap-1.5 border border-amber-300 active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(135deg, #7E223B 0%, #63182C 50%, #3B0E1B 100%)',
              }}
            >
              <Heart className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>{isConfirmedState ? '✓ RSVP CONFIRMED' : '❤️ RSVP NOW'}</span>
            </button>

            {/* Directions Map Action */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3.5 rounded-full bg-slate-900 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
              title="Open Location in Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Map</span>
            </a>

            {/* Shagun Action */}
            <button
              type="button"
              onClick={() => setIsShagunModalOpen(true)}
              className="py-3 px-3.5 rounded-full bg-purple-900 border border-purple-400/40 text-amber-200 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
              title="Send Digital Shagun via UPI"
            >
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>Shagun</span>
            </button>

            {/* Pass Action */}
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
          eventSlug={slug || token || ''}
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
          <div className="max-w-sm w-full p-6 sm:p-8 rounded-3xl text-center space-y-5 relative shadow-2xl border-2 border-amber-400 bg-gradient-to-b from-[#0F172A] to-[#0A1128] text-white">
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
                value={guestPersonalization?.pass_code ? `${window.location.origin}/scan/${evt.id}?code=${guestPersonalization.pass_code}` : `${window.location.origin}/i/${evt.slug || evt.id}`} 
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
          <div className="max-w-lg w-full p-6 rounded-3xl bg-slate-900 border-2 border-amber-400/60 space-y-4 relative text-white shadow-2xl">
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
