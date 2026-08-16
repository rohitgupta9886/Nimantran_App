import React, { useState, useRef } from 'react';
import { Sparkles, Heart, Volume2, VolumeX, Check, Key, Lock, Unlock, Calendar, MapPin, ShieldCheck, ChevronDown, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getEventThemeProfile, EventThemeProfile } from '../utils/themeEngine';

interface SignatureInvitationOpeningProps {
  event?: any;
  guestName?: string;
  salutation?: string;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
  themeId?: string;
  eventType?: string;
  musicUrl?: string;
  passCode?: string;
  onOpenComplete?: () => void;
  onOpenRsvpModal?: () => void;
  onGlobalReset?: () => void;
}

export const SignatureInvitationOpening: React.FC<SignatureInvitationOpeningProps> = ({
  event,
  guestName = 'Valued Guest',
  salutation = 'Dear Valued Guest',
  eventTitle = "Priyanka & Rohit's Wedding Celebration",
  eventDate = '18 Dec 2026',
  eventVenue = 'The Grand Riviera Udaipur, Rajasthan',
  themeId = 'romantic-blush',
  eventType = 'WEDDING',
  musicUrl = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  passCode = 'NIM-ENTRY-1001',
  onOpenComplete,
  onOpenRsvpModal,
  onGlobalReset,
}) => {
  // Resolve DATA-DRIVEN EVENT THEME PROFILE for this event
  const themeProfile: EventThemeProfile = getEventThemeProfile(
    event || {
      event_type: eventType,
      title: eventTitle,
      theme_config: { theme: themeId },
    }
  );

  // 6 SEQUENTIAL STAGES (Gift opens, card emerges, and open letter displays cleanly):
  // 1: CHEST AT REST (Isolated studio 3D gift box with roses, wine glass, paper scroll)
  // 2: GOLD LOCK UNLOCKS (Golden keyhole glow & unlock pulse)
  // 3: CHEST VISIBLY OPENS (Lid lifts back & golden light beam erupts from box interior)
  // 4: MAGICAL BURST (2-Second Sub-bass boom sound & explosive event-specific particle shower)
  // 5: INVITATION CARD RISES (Card emerges vertically from top of open gift box)
  // 6: CARD OPENS LIKE A BOOK & REMAINS OPEN PERMANENTLY (Gift box is hidden as requested)
  const [activeStage, setActiveStage] = useState<number>(1);
  const [isSequenceRunning, setIsSequenceRunning] = useState<boolean>(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Interactive 3D Physics Tilt State
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.15s ease-out',
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle Interactive 3D Tilt on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeStage >= 2) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (-y / (rect.height / 2)) * 12; // Max 12deg X tilt
    const rotateY = (x / (rect.width / 2)) * 12; // Max 12deg Y tilt
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.04, 1.04, 1.04)`,
      transition: 'transform 0.08s ease-out',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out',
    });
  };

  // Synthesize DEEP BOOM SOUND & MAGICAL CHIME (2 FULL SECONDS DURATION)
  const playBoomSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const freq = themeProfile.audio.boomFrequency || 170;

      // Deep Sub-Bass Impact Boom (Extends to 2.0 Seconds)
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'triangle';
      boomOsc.frequency.setValueAtTime(freq, ctx.currentTime);
      boomOsc.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 2.0);
      boomGain.gain.setValueAtTime(1.0, ctx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomOsc.start();
      boomOsc.stop(ctx.currentTime + 2.0);

      // Magical Chime Sweep (Extends to 2.0 Seconds)
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(320, ctx.currentTime);
      chimeOsc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 1.0);
      chimeOsc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 2.0);
      chimeGain.gain.setValueAtTime(0.6, ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start();
      chimeOsc.stop(ctx.currentTime + 2.0);
    } catch (e) {
      console.log('Audio synthesis error:', e);
    }
  };

  // Trigger Dynamic Event-Specific Particle Explosion
  const triggerParticleExplosion = () => {
    try {
      confetti({
        particleCount: 350,
        spread: 200,
        origin: { y: 0.5 },
        colors: themeProfile.particleSystem.confettiColors,
        shapes: ['circle', 'star'],
        scalar: 1.5,
        ticks: 400,
      });
    } catch (e) {
      console.log('Confetti error:', e);
    }
  };

  // RUN ALL 6 STAGES IN PERFECT SEQUENTIAL MANNER ON USER CLICK (+2 SECONDS LID OPENING DURATION)
  const startSequentialOpening = () => {
    if (isSequenceRunning) return;
    setIsSequenceRunning(true);

    // STAGE 1 -> STAGE 2: GOLD KEYHOLE UNLOCKS (0ms)
    setActiveStage(2);

    // STAGE 2 -> STAGE 3: CHEST LIFTS OPEN & GOLDEN LIGHT ERUPTS (350ms — KEYHOLE UNLOCK <= 0.4 SECONDS)
    setTimeout(() => {
      setActiveStage(3);
    }, 350);

    // STAGE 3 -> STAGE 4: MAGICAL BURST WITH BOOM SOUND & PARTICLE EXPLOSION (2150ms)
    setTimeout(() => {
      setActiveStage(4);
      playBoomSound();
      triggerParticleExplosion();
    }, 2150);

    // STAGE 4 -> STAGE 5: INVITATION CARD RISES FROM OPEN CHEST (3350ms)
    setTimeout(() => {
      setActiveStage(5);
    }, 3350);

    // STAGE 5 -> STAGE 6: CHEST UNLOCKED & OPENED (4250ms)
    setTimeout(() => {
      setActiveStage(6);
      setIsSequenceRunning(false);
    }, 4250);

    // Play ambient music
    if (audioRef.current && !isMuted) {
      audioRef.current.play()
        .then(() => setIsPlayingMusic(true))
        .catch((err) => console.log('Audio playback policy:', err));
    }

    if (onOpenComplete) {
      setTimeout(() => onOpenComplete(), 5000);
    }
  };

  const resetToClosedState = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // 1. Instant window scroll reset to absolute top (0,0) — NO slow scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // 2. Reset 3D Gift Box stage
    setActiveStage(1);
    setIsSequenceRunning(false);
    // 3. Trigger global UI reset callback
    if (onGlobalReset) {
      onGlobalReset();
    }
  };

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
      setIsMuted(true);
    } else {
      audioRef.current.play();
      setIsPlayingMusic(true);
      setIsMuted(false);
    }
  };

  const effectiveTitle = event?.title || eventTitle;
  const effectiveDate = eventDate;
  const effectiveVenue = event?.venue_name || eventVenue;

  return (
    <div className="relative min-h-[90vh] bg-gradient-to-b from-[#050914] via-[#0A1128] to-[#162447] text-white flex flex-col items-center justify-center p-4 pt-12 sm:pt-16 sm:p-8 overflow-x-hidden">
      
      {/* Background Audio */}
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="auto" />}

      {/* Floating Ambient Rose Petals Background Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-30">
        <div className="absolute top-10 left-10 text-3xl animate-bounce duration-1000">🌹</div>
        <div className="absolute top-20 right-20 text-2xl animate-pulse duration-700">✨</div>
        <div className="absolute bottom-20 left-1/4 text-3xl animate-bounce duration-700">🍷</div>
        <div className="absolute bottom-16 right-1/3 text-2xl animate-pulse duration-1000">💖</div>
      </div>

      {/* 🌟 FIXED ALWAYS-VISIBLE FLOATING CONTROLS BAR (PERSISTS AT TOP RIGHT DESPITE SCROLLING) 🌟 */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[999] flex items-center gap-2.5">
        <button
          type="button"
          onClick={(e) => resetToClosedState(e)}
          className="px-3 sm:px-4 py-2.5 rounded-full bg-[#0A1128]/90 border-2 border-amber-300/80 text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-xl hover:bg-slate-900 transition-all shadow-[0_10px_25px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95"
          title="Re-close Gift Box & Reset View to Top Initial Landing Screen"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Re-close Box</span>
          <span className="sm:hidden">Reset</span>
        </button>

        <button
          type="button"
          onClick={toggleAudio}
          className={`px-3.5 sm:px-4 py-2.5 rounded-full border-2 text-xs font-mono font-bold flex items-center gap-2 backdrop-blur-xl transition-all shadow-[0_10px_25px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 ${
            isPlayingMusic 
              ? 'bg-[#7E223B]/95 border-amber-300 text-amber-100 shadow-[0_0_20px_rgba(126,34,59,0.8)]' 
              : 'bg-[#0A1128]/90 border-slate-600 text-slate-300'
          }`}
          title={isPlayingMusic ? 'Mute Music' : 'Play Music'}
        >
          {isPlayingMusic ? (
            <>
              <Volume2 className="w-4 h-4 text-amber-300 animate-bounce" />
              <span className="drop-shadow-sm font-extrabold">MUSIC ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-400" />
              <span className="drop-shadow-sm">MUSIC OFF</span>
            </>
          )}
        </button>
      </div>

      {/* OVERLAY FOR STAGE 4: DYNAMIC EVENT-SPECIFIC PARTICLE BURST */}
      {(activeStage === 4 || activeStage === 5) && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden flex items-center justify-center">
          {/* Shockwave Radial Beam */}
          <div
            className="absolute w-[550px] h-[550px] rounded-full blur-3xl animate-ping duration-1000"
            style={{
              background: 'radial-gradient(circle, #FFD700 0%, #C41E3A 50%, transparent 75%)',
            }}
          />

          {/* Showering 3D Event-Specific Particle Emojis */}
          <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
            {themeProfile.particleSystem.emojis.map((emoji, idx) => (
              <span
                key={idx}
                className="text-6xl sm:text-8xl animate-bounce filter drop-shadow-2xl opacity-90"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MAIN DISPLAY CANVAS (STUDIO WHITE BACKDROP) */}
      <div className="relative w-full max-w-4xl min-h-[580px] flex flex-col items-center justify-center my-auto z-30 space-y-6">

        {/* 3D GIFT CHEST CONTAINER (Rendered on Stages 1 to 5 - Hidden on Stage 6 as requested) */}
        {activeStage !== 6 && (
          <div className="relative z-30 w-full max-w-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
            
            {/* THE ISOLATED 3D GIFT BOX CONTAINER WITH INTERACTIVE TILT */}
            <div
              onClick={startSequentialOpening}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={tiltStyle}
              className="relative mx-auto cursor-pointer group flex flex-col items-center justify-center transform-preserve-3d"
            >
              {/* FLOATING 3D SHADOW */}
              <div className="absolute -bottom-4 w-3/4 h-8 bg-black/15 blur-xl rounded-full transform group-hover:scale-110 transition-transform duration-500" />

              {/* REAL 3D OPENED LID STRUCTURE */}
              {activeStage >= 3 && (
                <>
                  {/* 3D Tilted-Back Chest Lid */}
                  <div
                    className="absolute -top-10 w-[78%] sm:w-[82%] h-28 rounded-t-3xl border-t-4 border-x-4 border-amber-300 shadow-2xl transition-all duration-700 z-40 bg-gradient-to-r from-[#A74960] via-[#893148] to-[#5E000F] opacity-95 flex flex-col items-center justify-center text-center p-3"
                    style={{
                      transform: 'perspective(1000px) rotateX(-45deg) translateZ(40px) translateY(-10px)',
                      transformOrigin: 'top center',
                      boxShadow: '0 -20px 40px rgba(0,0,0,0.4), inset 0 2px 15px rgba(255,215,0,0.5)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                      <span className="font-serif italic font-extrabold text-lg sm:text-xl text-amber-300 tracking-widest">
                        CHEST LID OPENED
                      </span>
                      <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                    </div>
                    <span className="text-[10px] font-mono text-amber-200 tracking-wider uppercase font-bold">
                      ✨ Glowing Interior Revealed ✨
                    </span>
                  </div>

                  {/* Erupting Golden Interior Light Beam */}
                  <div className="absolute top-2 inset-x-0 pointer-events-none flex flex-col items-center z-30">
                    <div
                      className="w-80 h-48 rounded-full blur-2xl animate-pulse"
                      style={{
                        background: 'radial-gradient(circle, #FFD700 0%, #FFF5C0 60%, transparent 100%)',
                      }}
                    />
                  </div>
                </>
              )}

              <img
                src="/velvet_invitation_chest.jpg"
                alt={`${themeProfile.displayName} 3D Gift Box with Roses, Wine Glass & Scroll`}
                className={`w-full max-w-[580px] h-auto object-contain rounded-2xl transition-all duration-700 ${
                  activeStage >= 2 ? 'scale-105 filter drop-shadow-[0_25px_60px_rgba(167,73,96,0.4)]' : 'drop-shadow-2xl'
                }`}
              />

              {/* STAGE 2: GOLD LOCK UNLOCK PULSE OVERLAY */}
              {activeStage === 2 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-amber-400/20 backdrop-blur-[1px] rounded-2xl animate-pulse">
                  <div className="bg-black/80 px-6 py-3 rounded-full border-2 border-amber-300 flex items-center gap-3 text-amber-300 font-serif text-lg font-bold shadow-2xl">
                    <Unlock className="w-6 h-6 animate-spin text-amber-300" />
                    <span>Unlocking Keyhole...</span>
                  </div>
                </div>
              )}

              {/* STAGE 5: CLOSED FRONT INVITATION CARD RISING VERTICALLY */}
              {activeStage === 5 && (
                <div className="absolute top-0 inset-x-0 pointer-events-none flex flex-col items-center justify-center z-40">
                  <div
                    className="w-72 sm:w-80 rounded-2xl p-6 border-4 border-amber-400 shadow-2xl text-center space-y-3 transform -translate-y-36 transition-all duration-700 animate-in zoom-in-95"
                    style={{
                      background: themeProfile.bookCard.bookBg,
                      color: themeProfile.bookCard.textColor,
                    }}
                  >
                    <span className="text-4xl">{themeProfile.bookCard.headerSymbol}</span>
                    <h3 className="font-serif text-2xl font-extrabold text-amber-200">{effectiveTitle}</h3>
                    <p className="text-xs font-mono font-bold text-amber-300 animate-pulse">Rising Invitation Card...</p>
                  </div>
                </div>
              )}
            </div>

            {/* STAGE 1 BUTTON: UNLOCK & OPEN GIFT CHEST */}
            {activeStage === 1 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={startSequentialOpening}
                  disabled={isSequenceRunning}
                  className="px-10 py-4 rounded-full font-extrabold text-base shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-amber-300 text-white bg-gradient-to-r from-[#A74960] via-[#893148] to-[#5E000F] inline-flex items-center gap-3"
                >
                  <Key className="w-5 h-5 text-amber-300 animate-bounce" />
                  <span className="tracking-wider uppercase">UNLOCK & OPEN GIFT CHEST</span>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STAGE 6: CHEST UNLOCKED & OPENED — UNVEILS THE ONE PRIMARY DIGITAL INVITATION HERO CARD */}
        {activeStage === 6 && (
          <div className="relative z-40 w-full max-w-xl animate-in zoom-in-95 duration-700 space-y-4 my-auto text-center">
            <div className="p-8 sm:p-10 rounded-[36px] border-2 border-amber-300/80 bg-slate-950/90 shadow-[0_30px_90px_rgba(0,0,0,0.9)] backdrop-blur-2xl space-y-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/30 via-rose-500/20 to-amber-300/30 border-2 border-amber-300 flex items-center justify-center mx-auto shadow-xl">
                <Sparkles className="w-10 h-10 text-amber-300 animate-spin" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 block">
                  ✦ CHEST UNLOCKED ✦
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md">
                  Welcome, {salutation || guestName || 'Gracious Guest'}
                </h2>
                <p className="text-xs font-serif italic text-amber-100/90 max-w-sm mx-auto leading-relaxed">
                  "Your royal digital invitation is ready. Explore your personalized celebration pass below."
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="#hero-invitation-section"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('hero-invitation-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-full font-serif font-extrabold text-xs tracking-wider uppercase text-amber-100 shadow-2xl inline-flex items-center justify-center gap-2 border-2 border-amber-300 transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #7E223B 0%, #63182C 50%, #3B0E1B 100%)',
                    boxShadow: '0 10px 30px rgba(126, 34, 59, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>VIEW DIGITAL INVITATION CARD ↓</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
