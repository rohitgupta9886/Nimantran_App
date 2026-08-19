import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExperienceTheme } from '../engine/ExperienceThemeEngine';
import { playUnboxingSound } from '../engine/AudioEngine';

interface OpeningSceneProps {
  title: string;
  hindiTitle?: string;
  salutation?: string;
  guestName?: string;
  theme: ExperienceTheme;
  onOpenComplete: () => void;
}

export const OpeningScene: React.FC<OpeningSceneProps> = ({
  title,
  hindiTitle,
  salutation,
  guestName,
  theme,
  onOpenComplete,
}) => {
  // CONTINUOUS CINEMATIC MOTION PHASES:
  // 'DOVE_FLIGHT' (0.0s - 2.0s): Heavenly Dove soaring forward through sunlit clouds
  // 'ENVELOPE_DESCENT' (2.0s - 4.2s): Royal envelope continuously tumbling down through clouds
  // 'DOCKED_READY' (4.2s+): Envelope centered in foreground, glowing wax seal, awaiting tap
  // 'CARD_EMERGING' (On Tap): Flap opens, glowing stationery card rises vertically upwards
  const [motionPhase, setMotionPhase] = useState<'DOVE_FLIGHT' | 'ENVELOPE_DESCENT' | 'DOCKED_READY' | 'CARD_EMERGING'>('DOVE_FLIGHT');
  
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const envelopeRef = useRef<HTMLDivElement | null>(null);

  // Auto-advance continuous flight timeline
  useEffect(() => {
    const t1 = setTimeout(() => {
      setMotionPhase('ENVELOPE_DESCENT');
    }, 2000);

    const t2 = setTimeout(() => {
      setMotionPhase('DOCKED_READY');
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (motionPhase !== 'DOCKED_READY' || !envelopeRef.current) return;
    const rect = envelopeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (-y / (rect.height / 2)) * 10,
      y: (x / (rect.width / 2)) * 10,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 240,
        spread: 150,
        origin: { y: 0.55 },
        colors: ['#FFD700', '#FFA500', '#F43F5E', '#FDA4AF', '#FFFFFF', '#D4AF37'],
        ticks: 380,
      });
    } catch (e) {}
  };

  const handleOpenEnvelope = () => {
    if (motionPhase === 'CARD_EMERGING') return;
    setMotionPhase('CARD_EMERGING');
    playUnboxingSound();

    // 0.8s: Confetti burst on card elevation
    setTimeout(() => {
      triggerConfetti();
    }, 800);

    // 2.0s: Transition seamlessly into unveiled hero
    setTimeout(() => {
      onOpenComplete();
    }, 2000);
  };

  const handleSkipIntro = () => {
    setMotionPhase('DOCKED_READY');
  };

  return (
    <div className="fixed inset-0 z-30 w-full h-full overflow-hidden select-none flex flex-col justify-between items-center font-sans">
      
      {/* 🌟 1. IMMERSIVE FULL-PAGE CONTINUOUS SKY & CLOUD BACKGROUND 🌟 */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <img
          src="/dove_scene3.jpg"
          alt="Sunlit Sky & Clouds"
          className="w-full h-full object-cover scale-105 filter brightness-105 contrast-105"
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 75% 20%, rgba(255, 240, 190, 0.5) 0%, rgba(245, 158, 11, 0.2) 40%, rgba(18, 2, 8, 0.65) 90%)',
          }}
        />

        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #FDE68A 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* 🌟 2. TOP GUEST PERSONALIZATION BADGE 🌟 */}
      <div className="w-full max-w-md mx-auto pt-6 px-4 z-30 text-center space-y-2 animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/60 border border-amber-300/80 shadow-[0_0_30px_rgba(245,158,11,0.45)] backdrop-blur-2xl text-amber-200 text-xs font-mono font-extrabold uppercase tracking-widest">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>
            {motionPhase === 'DOVE_FLIGHT'
              ? '🕊️ A Sacred Messenger From The Heavens...'
              : motionPhase === 'ENVELOPE_DESCENT'
              ? '✨ Delivering Your Auspicious Invitation...'
              : guestName
              ? `Exclusive Invitation for ${guestName}`
              : '✦ An Auspicious Celebration Awaits You ✦'}
          </span>
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
        </div>

        {salutation && motionPhase === 'DOCKED_READY' && (
          <p className="text-xs sm:text-sm font-serif italic text-amber-100/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] animate-in fade-in max-w-sm mx-auto">
            "{salutation}"
          </p>
        )}
      </div>

      {/* 🌟 3. CONTINUOUS WHITE DOVE IN FLIGHT (PHASE 0 TO 1) 🌟 */}
      <div
        className={`absolute pointer-events-none z-20 transition-all duration-1500 ease-out ${
          motionPhase === 'DOVE_FLIGHT'
            ? 'top-[16%] left-1/2 -translate-x-1/2 scale-100 opacity-100'
            : 'top-[-25%] left-[80%] scale-75 opacity-0'
        }`}
        style={{
          filter: 'drop-shadow(0 20px 35px rgba(0,0,0,0.45))',
        }}
      >
        <div className="relative w-72 sm:w-96 h-72 sm:h-96 animate-pulse duration-1000">
          <img
            src="/white_dove_soaring.png"
            alt="White Dove Flying in Sky"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* 🌟 4. CONTINUOUS PHYSICAL ENVELOPE (FALLING -> DOCKED -> CARD EMERGENCE) 🌟 */}
      <div
        className="relative my-auto z-30 flex flex-col items-center justify-center transition-all duration-1200 ease-out"
        style={{
          perspective: '1400px',
          transform:
            motionPhase === 'DOVE_FLIGHT'
              ? 'translateY(-200px) scale(0.15) opacity(0)'
              : motionPhase === 'ENVELOPE_DESCENT'
              ? 'translateY(-70px) scale(0.65) rotateZ(-14deg) rotateX(25deg)'
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
          className={`relative w-[320px] sm:w-[400px] h-[220px] sm:h-[265px] transition-transform duration-300 ease-out ${
            motionPhase === 'DOCKED_READY' ? 'cursor-pointer group hover:scale-105 active:scale-95' : ''
          }`}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${
              motionPhase === 'CARD_EMERGING' ? 1.08 : 1.0
            }, ${motionPhase === 'CARD_EMERGING' ? 1.08 : 1.0}, 1)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Depth Floor Shadow */}
          <div className="absolute -bottom-8 inset-x-6 h-12 bg-black/80 blur-2xl rounded-full transform group-hover:scale-105 transition-transform pointer-events-none" />

          {/* Envelope Back Panel & Royal Gold Foil Lining */}
          <div
            className="absolute inset-0 rounded-3xl border-2 border-amber-300/90 shadow-2xl overflow-hidden"
            style={{
              background: theme.palette.cardBg,
              boxShadow: `0 30px 70px -15px rgba(0,0,0,0.95), inset 0 0 40px ${theme.palette.shadowGlow}`,
            }}
          >
            <div
              className="absolute inset-2 rounded-2xl opacity-25 border border-dashed border-amber-300"
              style={{
                backgroundImage: 'radial-gradient(circle, #F59E0B 1.5px, transparent 1.5px)',
                backgroundSize: '18px 18px',
              }}
            />
          </div>

          {/* RISING PRISTINE STATIONERY CARD WITH GOLD BORDER */}
          <div
            className="absolute inset-x-4 h-[210px] sm:h-[250px] rounded-2xl border-2 border-amber-300 shadow-2xl flex flex-col items-center justify-between p-5 text-center z-10 transition-all duration-700 ease-out"
            style={{
              background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5EB 100%)',
              bottom: motionPhase === 'CARD_EMERGING' ? '100px' : '8px',
              transform: motionPhase === 'CARD_EMERGING' ? 'scale(1.12) translateY(-60px)' : 'scale(0.96)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.9), inset 0 0 0 1px #D97706',
            }}
          >
            <span className="text-[11px] font-serif font-bold tracking-widest text-[#B45309] block truncate max-w-full">
              {hindiTitle || theme.typography.vedicHeader}
            </span>

            <div className="space-y-1 my-auto">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#9E6F6D] block">
                ✦ ROYAL INVITATION ✦
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#302829] truncate max-w-[280px] sm:max-w-[340px]">
                {title}
              </h3>
            </div>

            <span className="text-[10px] font-mono font-bold text-[#D97706] tracking-widest uppercase">
              NIMANTRAN LUXE CELEBRATION
            </span>
          </div>

          {/* Side & Bottom Envelope Folds */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none z-20 overflow-hidden">
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
                boxShadow: '0 -5px 25px rgba(0,0,0,0.6)',
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
              boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
            }}
          >
            <div className="absolute inset-x-4 top-2 h-1 bg-amber-300/40 rounded-full" />
          </div>

          {/* Auspicious Metallic Wax Seal */}
          {motionPhase !== 'CARD_EMERGING' && (
            <div
              className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-16 h-16 rounded-full border-2 border-amber-300 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.8)] group-hover:scale-110 transition-transform duration-300"
              style={{
                background: 'radial-gradient(circle, #F59E0B 0%, #B45309 60%, #451A03 100%)',
              }}
            >
              <span className="font-serif font-extrabold text-amber-100 text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                {theme.sealEmblem}
              </span>
              <div className="absolute inset-0 rounded-full border border-dashed border-amber-200/60 animate-spin duration-4000" />
            </div>
          )}
        </div>

        {/* 🌟 5. TACTILE "TAP TO OPEN INVITATION" CTA 🌟 */}
        <div className="mt-8 z-30 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEnvelope}
            disabled={motionPhase === 'CARD_EMERGING'}
            className="px-10 py-4 rounded-full font-serif font-extrabold text-xs sm:text-sm tracking-widest uppercase text-white shadow-[0_15px_40px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 border-2 border-amber-300 transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, #7E1E38 0%, #591628 50%, #3D0D19 100%)',
            }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <Heart className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            <span className="drop-shadow-md text-amber-200 font-extrabold tracking-widest">
              {motionPhase === 'CARD_EMERGING' ? 'OPENING INVITATION...' : 'TAP TO OPEN INVITATION'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          </button>
        </div>
      </div>

      {/* 🌟 6. BOTTOM ACTION CONTROLS (SKIP & REPLAY) 🌟 */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between gap-2 px-4 pb-6 z-30">
        {motionPhase !== 'DOCKED_READY' && motionPhase !== 'CARD_EMERGING' ? (
          <button
            type="button"
            onClick={handleSkipIntro}
            className="px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold flex items-center gap-1 backdrop-blur-2xl hover:bg-black/80 transition-all active:scale-95 ml-auto shadow-md"
          >
            <span>Skip Intro →</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMotionPhase('DOVE_FLIGHT')}
            className="px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-2xl hover:bg-black/80 transition-all active:scale-95 ml-auto shadow-md"
            title="Replay Heavenly Flight"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Replay Dove ↺</span>
          </button>
        )}
      </div>
    </div>
  );
};
