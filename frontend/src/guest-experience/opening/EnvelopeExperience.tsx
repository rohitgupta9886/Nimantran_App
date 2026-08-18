import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, RotateCcw, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CelebrationTheme } from '../../utils/themeCatalog';
import { getCelebrationConfig } from '../../utils/celebrationEngine';

interface EnvelopeExperienceProps {
  title: string;
  hindiTitle?: string;
  salutation?: string;
  guestName?: string;
  eventType?: string;
  theme: CelebrationTheme;
  musicUrl?: string;
  onOpenComplete: () => void;
  onToggleMusic?: () => void;
  isPlayingMusic?: boolean;
}

export const EnvelopeExperience: React.FC<EnvelopeExperienceProps> = ({
  title,
  hindiTitle,
  salutation,
  guestName,
  eventType = 'WEDDING',
  theme,
  musicUrl,
  onOpenComplete,
  onToggleMusic,
  isPlayingMusic,
}) => {
  // CONTINUOUS CINEMATIC MOTION PHASES:
  // 'DOVE_FLIGHT' (0.0s-2.0s): Dove flying forward through clouds
  // 'ENVELOPE_DESCENT' (2.0s-4.0s): Envelope tumbling down continuously through clouds
  // 'DOCKED_READY' (4.0s+): Envelope centered in foreground, wax seal glowing, awaiting tap
  // 'CARD_EMERGING' (On Tap): Flap opens, glowing card rises upwards out of envelope
  const [motionPhase, setMotionPhase] = useState<'DOVE_FLIGHT' | 'ENVELOPE_DESCENT' | 'DOCKED_READY' | 'CARD_EMERGING'>('DOVE_FLIGHT');
  
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const envelopeRef = useRef<HTMLDivElement | null>(null);
  const cfg = getCelebrationConfig(eventType, '', title);

  // Auto-advance continuous timeline
  useEffect(() => {
    // 0.0s -> 2.0s: Dove flight -> Envelope drop & descent
    const t1 = setTimeout(() => {
      setMotionPhase('ENVELOPE_DESCENT');
    }, 2000);

    // 2.0s -> 4.2s: Envelope continuous descent -> Docked in center foreground
    const t2 = setTimeout(() => {
      setMotionPhase('DOCKED_READY');
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Determine Auspicious Seal Emblem
  const getSealEmblem = () => {
    switch (eventType.toUpperCase()) {
      case 'WEDDING':
      case 'ENGAGEMENT':
      case 'MUNDAN':
        return 'ॐ';
      case 'BIRTHDAY':
        return '🎂';
      case 'ANNIVERSARY':
        return '❤️';
      case 'FESTIVAL':
        return '🪔';
      case 'CORPORATE':
        return '✦';
      default:
        return '✨';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (motionPhase !== 'DOCKED_READY' || !envelopeRef.current) return;
    const rect = envelopeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (-y / (rect.height / 2)) * 8,
      y: (x / (rect.width / 2)) * 8,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Synthesize Sub-Bass Boom & Pentatonic Chime
  const playOpeningAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Sub-Bass Boom (120Hz -> 20Hz)
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = 'triangle';
      boom.frequency.setValueAtTime(120, ctx.currentTime);
      boom.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.8);
      boomGain.gain.setValueAtTime(0.8, ctx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      boom.connect(boomGain);
      boomGain.connect(ctx.destination);
      boom.start();
      boom.stop(ctx.currentTime + 1.8);

      // Pentatonic Chime Sweep
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        chimeGain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 1.2);
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start(ctx.currentTime + i * 0.08);
        chime.stop(ctx.currentTime + i * 0.08 + 1.2);
      });
    } catch (e) {}
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 220,
        spread: 140,
        origin: { y: 0.55 },
        colors: ['#FFD700', '#FFA500', '#F43F5E', '#FDA4AF', '#FFFFFF'],
        ticks: 350,
      });
    } catch (e) {}
  };

  const handleOpenEnvelope = () => {
    if (motionPhase === 'CARD_EMERGING') return;
    setMotionPhase('CARD_EMERGING');
    playOpeningAudio();

    // 0.8s: Confetti burst on card elevation
    setTimeout(() => {
      triggerConfetti();
    }, 800);

    // 2.0s: Transition seamlessly to unveiled hero
    setTimeout(() => {
      onOpenComplete();
    }, 2000);
  };

  const handleSkipIntro = () => {
    setMotionPhase('DOCKED_READY');
  };

  return (
    <div className="fixed inset-0 z-30 w-full h-full overflow-hidden select-none flex flex-col justify-between items-center">
      
      {/* 🌟 1. FULL-PAGE CONTINUOUS SKY & CLOUD BACKGROUND LAYER 🌟 */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        {/* Sky Base Image / Texture */}
        <img
          src="/dove_scene3.jpg"
          alt="Sunlit Sky and Fluffy Clouds Background"
          className="w-full h-full object-cover scale-105 filter brightness-105 contrast-105"
        />

        {/* Ambient Sunburst Rays Gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 75% 20%, rgba(255, 235, 175, 0.45) 0%, rgba(245, 158, 11, 0.15) 45%, rgba(15, 2, 8, 0.6) 90%)',
          }}
        />

        {/* Drifting Clouds & Shimmer Overlay */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #FFF 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* 🌟 2. TOP HEADER NARRATIVE BADGE 🌟 */}
      <div className="w-full max-w-md mx-auto pt-6 px-4 z-30 text-center space-y-1.5 animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-300/60 shadow-[0_0_25px_rgba(245,158,11,0.35)] backdrop-blur-xl text-amber-200 text-xs font-mono font-extrabold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>
            {motionPhase === 'DOVE_FLIGHT'
              ? '🕊️ A Special Messenger From The Heavens...'
              : motionPhase === 'ENVELOPE_DESCENT'
              ? '✨ Delivering Your Auspicious Invitation...'
              : guestName
              ? `Exclusive Invitation for ${guestName}`
              : cfg.giftBoxTag}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        </div>

        {salutation && motionPhase === 'DOCKED_READY' && (
          <p className="text-xs sm:text-sm font-serif italic text-amber-100/90 drop-shadow-md animate-in fade-in">
            "{salutation}"
          </p>
        )}
      </div>

      {/* 🌟 3. CONTINUOUS WHITE DOVE IN FLIGHT (PHASE 0 TO 1) 🌟 */}
      <div
        className={`absolute pointer-events-none z-20 transition-all duration-1500 ease-out ${
          motionPhase === 'DOVE_FLIGHT'
            ? 'top-[18%] left-1/2 -translate-x-1/2 scale-100 opacity-100'
            : 'top-[-20%] left-[75%] scale-75 opacity-0'
        }`}
        style={{
          filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.4))',
        }}
      >
        <div className="relative w-64 sm:w-80 h-64 sm:h-80 animate-pulse duration-1000">
          <img
            src="/white_dove_soaring.png"
            alt="White Dove Flying in Sky"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* 🌟 4. CONTINUOUS ENVELOPE (FALLING -> DOCKING -> EMERGING CARD) 🌟 */}
      <div
        className="relative my-auto z-30 flex flex-col items-center justify-center transition-all duration-1200 ease-out"
        style={{
          perspective: '1200px',
          transform:
            motionPhase === 'DOVE_FLIGHT'
              ? 'translateY(-180px) scale(0.2) opacity(0)'
              : motionPhase === 'ENVELOPE_DESCENT'
              ? 'translateY(-60px) scale(0.65) rotateZ(-12deg) rotateX(25deg)'
              : 'translateY(0px) scale(1.0) rotateZ(0deg) rotateX(0deg)',
          opacity: motionPhase === 'DOVE_FLIGHT' ? 0 : 1,
        }}
      >
        {/* 3D Physical Layered Envelope Container */}
        <div
          ref={envelopeRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleOpenEnvelope}
          className={`relative w-[320px] sm:w-[380px] h-[220px] sm:h-[250px] transition-transform duration-300 ease-out ${
            motionPhase === 'DOCKED_READY' ? 'cursor-pointer group hover:scale-105' : ''
          }`}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${
              motionPhase === 'CARD_EMERGING' ? 1.08 : 1.0
            }, ${motionPhase === 'CARD_EMERGING' ? 1.08 : 1.0}, 1)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Depth Floor Shadow */}
          <div className="absolute -bottom-6 inset-x-8 h-10 bg-black/75 blur-xl rounded-full transform group-hover:scale-105 transition-transform pointer-events-none" />

          {/* Envelope Back Panel & Royal Gold Foil Lining */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-amber-300/90 shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #4A1020 0%, #2A0612 100%)',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 0 35px rgba(245, 158, 11, 0.2)',
            }}
          >
            <div
              className="absolute inset-2 rounded-xl opacity-25 border border-dashed border-amber-300"
              style={{
                backgroundImage: 'radial-gradient(circle, #F59E0B 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
          </div>

          {/* RISING PRISTINE WHITE/GOLD INVITATION CARD */}
          <div
            className="absolute inset-x-4 h-[210px] sm:h-[240px] rounded-xl border-2 border-amber-300 shadow-2xl flex flex-col items-center justify-between p-4 text-center z-10 transition-all duration-700 ease-out"
            style={{
              background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5EB 100%)',
              bottom: motionPhase === 'CARD_EMERGING' ? '95px' : '8px',
              transform: motionPhase === 'CARD_EMERGING' ? 'scale(1.1) translateY(-55px)' : 'scale(0.96)',
              boxShadow: '0 20px 45px rgba(0,0,0,0.85), inset 0 0 0 1px #D97706',
            }}
          >
            <span className="text-[10px] font-serif font-bold tracking-widest text-[#B45309] block truncate max-w-full">
              {hindiTitle || '|| श्री गणेशाय नमः ||'}
            </span>

            <div className="space-y-1 my-auto">
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-[#9E6F6D] block">
                ✦ INVITATION ✦
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-extrabold text-[#302829] truncate max-w-[280px]">
                {title}
              </h3>
            </div>

            <span className="text-[9px] font-mono font-bold text-[#D97706] tracking-wider uppercase">
              NIMANTRAN DIGITAL
            </span>
          </div>

          {/* Side & Bottom Envelope Folds */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none z-20 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 w-1/2 border-r border-amber-300/40"
              style={{
                clipPath: 'polygon(0 0, 0 100%, 100% 50%)',
                background: 'linear-gradient(135deg, #5C1528 0%, #3D0D19 100%)',
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-1/2 border-l border-amber-300/40"
              style={{
                clipPath: 'polygon(100% 0, 100% 100%, 0 50%)',
                background: 'linear-gradient(225deg, #5C1528 0%, #3D0D19 100%)',
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-3/5 border-t border-amber-300/50"
              style={{
                clipPath: 'polygon(0 100%, 100% 100%, 50% 0)',
                background: 'linear-gradient(180deg, #6E1B32 0%, #3D0D19 100%)',
                boxShadow: '0 -5px 20px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* 3D Top Flap with Wax Seal */}
          <div
            className="absolute inset-x-0 top-0 h-3/5 origin-top z-30 transition-transform duration-700 ease-in-out"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              background: 'linear-gradient(0deg, #7E1E38 0%, #4A1020 100%)',
              transform: motionPhase === 'CARD_EMERGING' ? 'rotateX(-180deg)' : 'rotateX(0deg)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
            }}
          >
            <div className="absolute inset-x-4 top-2 h-1 bg-amber-300/40 rounded-full" />
          </div>

          {/* Auspicious Wax Seal */}
          {motionPhase !== 'CARD_EMERGING' && (
            <div
              className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-14 h-14 rounded-full border-2 border-amber-300 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] group-hover:scale-110 transition-transform duration-300"
              style={{
                background: 'radial-gradient(circle, #D97706 0%, #92400E 70%, #451A03 100%)',
              }}
            >
              <span className="font-serif font-extrabold text-amber-200 text-lg drop-shadow-md">
                {getSealEmblem()}
              </span>
              <div className="absolute inset-0 rounded-full border border-dashed border-amber-200/50 animate-spin duration-3000" />
            </div>
          )}
        </div>

        {/* TAP TO OPEN CTA BUTTON */}
        <div className="mt-8 z-30 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEnvelope}
            disabled={motionPhase === 'CARD_EMERGING'}
            className="px-9 py-4 rounded-full font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase text-white shadow-[0_12px_35px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2.5 border-2 border-amber-300 transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, #7E1E38 0%, #591628 50%, #3D0D19 100%)',
            }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <Heart className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            <span className="drop-shadow-md text-amber-200 font-extrabold tracking-widest">
              {motionPhase === 'CARD_EMERGING' ? 'OPENING INVITATION...' : 'TAP TO OPEN INVITATION'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          </button>
        </div>
      </div>

      {/* 🌟 5. BOTTOM CONTROLS (SKIP / REPLAY ANIMATION) 🌟 */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between gap-2 px-4 pb-6 z-30">
        {motionPhase !== 'DOCKED_READY' && motionPhase !== 'CARD_EMERGING' ? (
          <button
            type="button"
            onClick={handleSkipIntro}
            className="px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-xs font-mono font-bold flex items-center gap-1 backdrop-blur-md hover:bg-black/80 transition-all active:scale-95 ml-auto"
          >
            <span>Skip Intro →</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMotionPhase('DOVE_FLIGHT')}
            className="px-3.5 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-[11px] font-mono font-bold flex items-center gap-1 backdrop-blur-md hover:bg-black/80 transition-all active:scale-95 ml-auto"
            title="Replay Sky Dove Flight"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Replay Dove ↺</span>
          </button>
        )}
      </div>
    </div>
  );
};
