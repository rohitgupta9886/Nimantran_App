import React, { useState, useRef } from 'react';
import { Sparkles, Heart, Unlock, Volume2, VolumeX } from 'lucide-react';
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
  // Opening State Machine:
  // 'IDLE' -> 'TAP_PULSE' -> 'SEAL_UNLOCK' -> 'FLAP_OPEN' -> 'CARD_RISING' -> 'HERO_EXPAND' -> 'OPENED'
  const [openingStage, setOpeningStage] = useState<
    'IDLE' | 'TAP_PULSE' | 'SEAL_UNLOCK' | 'FLAP_OPEN' | 'CARD_RISING' | 'HERO_EXPAND' | 'OPENED'
  >('IDLE');

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const envelopeRef = useRef<HTMLDivElement | null>(null);

  const cfg = getCelebrationConfig(eventType, '', title);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (openingStage !== 'IDLE' || !envelopeRef.current) return;
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

  // Synthesize Sub-Bass Boom & Pentatonic Chime on Gesture
  const playOpeningAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Sub-Bass Boom
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
    } catch (e) {
      console.log('Audio note:', e);
    }
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
    if (openingStage !== 'IDLE') return;

    // 0.00s: Tap Pulse
    setOpeningStage('TAP_PULSE');
    playOpeningAudio();

    // 0.25s: Seal Unlocks
    setTimeout(() => {
      setOpeningStage('SEAL_UNLOCK');
    }, 250);

    // 0.60s: Flap Opens (3D fold)
    setTimeout(() => {
      setOpeningStage('FLAP_OPEN');
    }, 600);

    // 1.05s: Card Rises Vertically
    setTimeout(() => {
      setOpeningStage('CARD_RISING');
      triggerConfetti();
    }, 1050);

    // 1.75s: Hero Expands & Seamlessly Transitions
    setTimeout(() => {
      setOpeningStage('HERO_EXPAND');
    }, 1750);

    // 2.20s: Complete & Hand Over
    setTimeout(() => {
      setOpeningStage('OPENED');
      onOpenComplete();
    }, 2200);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerConfetti();
    setOpeningStage('OPENED');
    onOpenComplete();
  };

  const { colorPalette } = theme;

  return (
    <div
      className="relative w-full min-h-[90svh] flex flex-col items-center justify-center select-none py-6 px-3"
      style={{ perspective: '1200px' }}
    >
      {/* Top Header: Guest Greeting */}
      <div className="text-center space-y-1.5 mb-6 z-20 animate-in fade-in duration-500 max-w-md mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/60 border border-amber-300/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-[11px] sm:text-xs font-mono font-extrabold uppercase tracking-widest text-amber-200">
            {guestName ? `Exclusive Invitation for ${guestName}` : cfg.giftBoxTag}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        </div>

        {salutation && (
          <p className="text-xs sm:text-sm font-serif italic text-amber-100/90 drop-shadow-md">
            "{salutation}"
          </p>
        )}
      </div>

      {/* 3D Physical Layered Envelope Container */}
      <div
        ref={envelopeRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleOpenEnvelope}
        className="relative w-[320px] sm:w-[380px] h-[220px] sm:h-[260px] cursor-pointer group transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${
            openingStage === 'TAP_PULSE' ? 0.96 : openingStage === 'HERO_EXPAND' ? 1.08 : 1.0
          }, ${openingStage === 'TAP_PULSE' ? 0.96 : openingStage === 'HERO_EXPAND' ? 1.08 : 1.0}, 1)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Layer 1: Ambient Depth Shadow */}
        <div className="absolute -bottom-6 inset-x-8 h-10 bg-black/70 blur-xl rounded-full transform group-hover:scale-105 transition-transform pointer-events-none" />

        {/* Layer 2: Envelope Back Panel & Gold Lining */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-amber-300/80 shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4A1020 0%, #2A0612 100%)',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 0 30px rgba(245, 158, 11, 0.15)',
          }}
        >
          {/* Inner Foil Lining Pattern */}
          <div
            className="absolute inset-2 rounded-xl opacity-20 border border-dashed border-amber-300"
            style={{
              backgroundImage: 'radial-gradient(circle, #F59E0B 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
        </div>

        {/* Layer 3: Rising Inner Invitation Card */}
        <div
          className="absolute inset-x-4 h-[210px] sm:h-[250px] rounded-xl border-2 border-amber-300 shadow-2xl flex flex-col items-center justify-between p-4 text-center z-10 transition-all duration-700 ease-out"
          style={{
            background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5EB 100%)',
            bottom: openingStage === 'CARD_RISING' || openingStage === 'HERO_EXPAND' ? '80px' : '8px',
            transform:
              openingStage === 'CARD_RISING' || openingStage === 'HERO_EXPAND'
                ? 'scale(1.06) translateY(-40px)'
                : 'scale(0.96)',
            boxShadow: '0 20px 45px rgba(0,0,0,0.8), inset 0 0 0 1px #D97706',
          }}
        >
          {/* Card Vedic Header */}
          <span className="text-[10px] font-serif font-bold tracking-widest text-[#B45309] block truncate max-w-full">
            {hindiTitle || '|| श्री गणेशाय नमः ||'}
          </span>

          {/* Card Couple/Celebrant Title */}
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

        {/* Layer 4: Side & Bottom Envelope Folds */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-20 overflow-hidden">
          {/* Left Fold */}
          <div
            className="absolute inset-y-0 left-0 w-1/2 border-r border-amber-300/40"
            style={{
              clipPath: 'polygon(0 0, 0 100%, 100% 50%)',
              background: 'linear-gradient(135deg, #5C1528 0%, #3D0D19 100%)',
            }}
          />
          {/* Right Fold */}
          <div
            className="absolute inset-y-0 right-0 w-1/2 border-l border-amber-300/40"
            style={{
              clipPath: 'polygon(100% 0, 100% 100%, 0 50%)',
              background: 'linear-gradient(225deg, #5C1528 0%, #3D0D19 100%)',
            }}
          />
          {/* Bottom Fold */}
          <div
            className="absolute inset-x-0 bottom-0 h-3/5 border-t border-amber-300/50"
            style={{
              clipPath: 'polygon(0 100%, 100% 100%, 50% 0)',
              background: 'linear-gradient(180deg, #6E1B32 0%, #3D0D19 100%)',
              boxShadow: '0 -5px 20px rgba(0,0,0,0.5)',
            }}
          />
        </div>

        {/* Layer 5: 3D Top Flap with Wax Seal */}
        <div
          className="absolute inset-x-0 top-0 h-3/5 origin-top z-30 transition-transform duration-700 ease-in-out"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            background: 'linear-gradient(0deg, #7E1E38 0%, #4A1020 100%)',
            transform:
              openingStage === 'FLAP_OPEN' ||
              openingStage === 'CARD_RISING' ||
              openingStage === 'HERO_EXPAND'
                ? 'rotateX(-180deg)'
                : 'rotateX(0deg)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
          }}
        >
          {/* Flap Gold Filigree Border */}
          <div className="absolute inset-x-4 top-2 h-1 bg-amber-300/40 rounded-full" />
        </div>

        {/* Layer 6: Auspicious Wax Seal / Monogram */}
        {openingStage === 'IDLE' || openingStage === 'TAP_PULSE' || openingStage === 'SEAL_UNLOCK' ? (
          <div
            className={`absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-14 h-14 rounded-full border-2 border-amber-300 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] transition-all duration-300 ${
              openingStage === 'SEAL_UNLOCK'
                ? 'scale-125 opacity-0 rotate-45'
                : 'group-hover:scale-110'
            }`}
            style={{
              background: 'radial-gradient(circle, #D97706 0%, #92400E 70%, #451A03 100%)',
            }}
          >
            <span className="font-serif font-extrabold text-amber-200 text-lg drop-shadow-md">
              ॐ
            </span>
            <div className="absolute inset-0 rounded-full border border-dashed border-amber-200/50 animate-spin duration-3000" />
          </div>
        ) : null}
      </div>

      {/* Tap to Open CTA Button */}
      <div className="mt-8 z-20 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleOpenEnvelope}
          disabled={openingStage !== 'IDLE'}
          className="px-9 py-4 rounded-full font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase text-white shadow-[0_12px_35px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2.5 border-2 border-amber-300 transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #7E1E38 0%, #591628 50%, #3D0D19 100%)',
          }}
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <Heart className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
          <span className="drop-shadow-md text-amber-200 font-extrabold tracking-widest">
            {openingStage === 'IDLE' ? 'TAP TO OPEN INVITATION' : 'OPENING...'}
          </span>
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
        </button>

        {openingStage !== 'IDLE' && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-[11px] font-mono text-amber-300/80 hover:text-amber-200 underline pt-1"
          >
            Skip Intro →
          </button>
        )}
      </div>
    </div>
  );
};
