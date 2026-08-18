import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Gift, RotateCcw, Unlock, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveGiftBoxProps {
  eventTitle?: string;
  coupleNames?: string;
  hindiTitle?: string;
  salutation?: string;
  guestName?: string;
  eventType?: string;
  themeConfig?: any;
  musicUrl?: string;
  isOpened?: boolean;
  onOpenComplete?: () => void;
  onReset?: () => void;
}

export const InteractiveGiftBox: React.FC<InteractiveGiftBoxProps> = ({
  eventTitle = 'Grand Celebration',
  coupleNames,
  hindiTitle = '|| श्री गणेशाय नमः ||',
  salutation,
  guestName,
  eventType = 'WEDDING',
  themeConfig,
  musicUrl,
  isOpened = false,
  onOpenComplete,
  onReset,
}) => {
  // 🎬 CINEMATIC STAGE SEQUENCE:
  // 0 = REST (Closed chest, breathing golden aura, gentle float, anticipation)
  // 1 = TAP_FEEDBACK (Scale bounce, haptic pulse, audio chime)
  // 2 = SPOTLIGHT (Dim background, intense center glow)
  // 3 = RIBBON_UNLOCK (Golden ribbon loosens & unlocks)
  // 4 = 3D_LID_OPEN (Lid physically swings open, golden interior beam erupts)
  // 5 = MAGICAL_BLAST ("WOW" moment: sub-bass boom + chime, golden confetti + petals burst)
  // 6 = CARD_EMERGENCE (Royal personalized card emerges vertically from inside chest)
  // 7 = REVEAL_SETTLE (Card settles with golden shimmer flash)
  // 8 = FULLY_OPENED (Completed state, celebration mode)
  const [stage, setStage] = useState<number>(isOpened ? 8 : 0);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Floating petals and glowing sparkles particle state
  const [floatingPetals, setFloatingPetals] = useState<Array<{ id: number; left: number; delay: number; size: number; duration: number }>>([]);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; left: number; delay: number; size: number; duration: number }>>([]);

  useEffect(() => {
    if (isOpened) {
      setStage(8);
    } else {
      setStage(0);
      setIsOpening(false);
    }
  }, [isOpened]);

  useEffect(() => {
    const petals = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: Math.random() * 90 + 5,
      delay: Math.random() * 1.5,
      size: Math.random() * 10 + 16,
      duration: Math.random() * 1.5 + 2.5,
    }));
    const hearts = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: Math.random() * 80 + 10,
      delay: Math.random() * 1.2 + 0.2,
      size: Math.random() * 8 + 14,
      duration: Math.random() * 1.5 + 2.0,
    }));
    setFloatingPetals(petals);
    setFloatingHearts(hearts);
  }, []);

  // Web Audio Chime & Sub-Bass Impact Boom (Zero external asset latency)
  const playCinematicAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // 1. Initial crisp chime tone + Haptic feedback on tap
      const tapOsc = ctx.createOscillator();
      const tapGain = ctx.createGain();
      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([35, 30, 35]);
        }
      } catch (e) {}

      tapOsc.type = 'sine';
      tapOsc.frequency.setValueAtTime(880, ctx.currentTime);
      tapGain.gain.setValueAtTime(0.15, ctx.currentTime);
      tapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      tapOsc.connect(tapGain);
      tapGain.connect(ctx.destination);
      tapOsc.start();
      tapOsc.stop(ctx.currentTime + 0.15);

      // 2. Sub-bass resonant impact boom for the "BLAST" moment + Haptic Pulse
      setTimeout(() => {
        try {
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([60, 40, 80, 50, 100]);
          }
        } catch (e) {}

        try {
          const oscBoom = ctx.createOscillator();
          const gainBoom = ctx.createGain();
          oscBoom.type = 'triangle';
          oscBoom.frequency.setValueAtTime(95, ctx.currentTime);
          oscBoom.frequency.exponentialRampToValueAtTime(22, ctx.currentTime + 1.8);
          gainBoom.gain.setValueAtTime(0.75, ctx.currentTime);
          gainBoom.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
          oscBoom.connect(gainBoom);
          gainBoom.connect(ctx.destination);
          oscBoom.start();
          oscBoom.stop(ctx.currentTime + 1.8);

          // 3. Pentatonic Shimmering Chime Sweep
          const chimeFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
          chimeFreqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
            gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 1.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.07);
            osc.stop(ctx.currentTime + idx * 0.07 + 1.4);
          });
        } catch (e) {}
      }, 700);
    } catch (err) {
      console.log('Audio note:', err);
    }
  };

  // High-performance luxury canvas confetti celebration
  const triggerLuxuryBurst = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.55 },
        colors: ['#D4AF37', '#C89B5A', '#E8CFA7', '#6E2035', '#FFFFFF', '#FF69B4'],
        shapes: ['circle', 'star'],
        scalar: 1.2,
        ticks: 260,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0.05, y: 0.65 },
          colors: ['#D4AF37', '#C89B5A', '#FFFFFF'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 0.95, y: 0.65 },
          colors: ['#D4AF37', '#C89B5A', '#FFFFFF'],
        });
      }, 200);
    } catch (e) {
      console.log('Confetti note:', e);
    }
  };

  const handleOpenGift = () => {
    if (stage > 0 || isOpening) return;
    setIsOpening(true);
    playCinematicAudio();

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      triggerLuxuryBurst();
      setStage(8);
      setIsOpening(false);
      if (onOpenComplete) onOpenComplete();
      return;
    }

    // 0.0s: Stage 1 - Tap feedback scale bounce
    setStage(1);

    // 0.25s: Stage 2 - Dim background, intensify spotlight & anticipation
    setTimeout(() => {
      setStage(2);
    }, 250);

    // 0.55s: Stage 3 - Ribbon unlocks & loosens
    setTimeout(() => {
      setStage(3);
    }, 550);

    // 0.85s: Stage 4 - 3D Lid swings back, golden interior beam erupts
    setTimeout(() => {
      setStage(4);
    }, 850);

    // 1.25s: Stage 5 - MAGICAL "WOW" BURST
    setTimeout(() => {
      setStage(5);
      triggerLuxuryBurst();
    }, 1250);

    // 1.85s: Stage 6 - Royal Invitation Card emerges vertically from open chest
    setTimeout(() => {
      setStage(6);
    }, 1850);

    // 2.45s: Stage 7 - Settle card with golden flash bloom
    setTimeout(() => {
      setStage(7);
    }, 2450);

    // 2.85s: Stage 8 - Fully opened, seamlessly transfer to celebration view
    setTimeout(() => {
      setStage(8);
      setIsOpening(false);
      if (onOpenComplete) onOpenComplete();
    }, 2850);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLuxuryBurst();
    setStage(8);
    setIsOpening(false);
    if (onOpenComplete) onOpenComplete();
  };

  const handleReclose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStage(0);
    setIsOpening(false);
    if (onReset) onReset();
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center my-2 sm:my-4 z-20 select-none">
      
      {/* 🌟 1. CINEMATIC FULLSCREEN DIMMING & SPOTLIGHT (STAGES 2 TO 6) 🌟 */}
      {stage >= 2 && stage < 8 && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-[2px] pointer-events-none z-30 transition-opacity duration-700 animate-in fade-in" />
      )}

      {/* 🌟 2. FLOATING ROSE PETALS & GLASS HEARTS LAYER (STAGES 5 TO 7) 🌟 */}
      {stage >= 5 && stage < 8 && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {floatingPetals.map((p) => (
            <div
              key={`petal-${p.id}`}
              className="absolute animate-in fade-in"
              style={{
                left: `${p.left}%`,
                top: '-5%',
                width: `${p.size * 1.5}px`,
                height: `${p.size * 1.8}px`,
                animation: `floatPetal ${p.duration}s linear forwards`,
                animationDelay: `${p.delay}s`,
              }}
            >
              <svg viewBox="0 0 40 50" className="w-full h-full drop-shadow-[0_4px_12px_rgba(201,92,120,0.6)]">
                <path
                  d="M20 5 C5 15, 2 35, 20 48 C38 35, 35 15, 20 5 Z"
                  fill="url(#boxPetalGrad)"
                />
                <defs>
                  <linearGradient id="boxPetalGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#C95C78" />
                    <stop offset="60%" stopColor="#7A1F3D" />
                    <stop offset="100%" stopColor="#350D1D" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ))}

          {floatingHearts.map((h) => (
            <div
              key={`heart-${h.id}`}
              className="absolute"
              style={{
                left: `${h.left}%`,
                bottom: '15%',
                width: `${h.size * 2.8}px`,
                height: `${h.size * 2.8}px`,
                animation: `floatHeartUp ${h.duration}s ease-out forwards`,
                animationDelay: `${h.delay}s`,
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(214,170,97,0.85)]">
                <path
                  d="M50 25 C35 5, 5 15, 15 45 C25 65, 50 85, 50 90 C50 85, 75 65, 85 45 C95 15, 65 5, 50 25 Z"
                  fill="url(#boxHeartGrad)"
                  stroke="#F0D7A4"
                  strokeWidth="2"
                />
                <circle cx="35" cy="35" r="6" fill="rgba(255,255,255,0.6)" />
                <defs>
                  <linearGradient id="boxHeartGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(214, 170, 97, 0.65)" />
                    <stop offset="50%" stopColor="rgba(201, 92, 120, 0.75)" />
                    <stop offset="100%" stopColor="rgba(53, 13, 29, 0.9)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* 🌟 3. UNOPENED OR IN-PROGRESS GIFT BOX STATE (STAGES 0 to 7) 🌟 */}
      {stage < 8 && (
        <div 
          className={`w-full max-w-sm sm:max-w-md mx-auto text-center space-y-3 sm:space-y-4 px-2 relative z-40 transition-transform duration-500 ${
            stage >= 2 ? 'scale-[1.03]' : ''
          }`}
        >
          
          {/* Header Curiosity / Personalized Salutation */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-300/60 shadow-[0_0_20px_rgba(200,155,90,0.3)] backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-[11px] sm:text-xs font-serif font-extrabold uppercase tracking-widest text-amber-200">
                {guestName ? `A Special Gift For ${guestName}` : 'A Special Invitation Awaits You'}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            </div>
            
            {salutation && (
              <p className="text-xs font-serif italic text-amber-100/90 pt-0.5 drop-shadow-sm">
                "{salutation}"
              </p>
            )}
          </div>

          {/* THE INTERACTIVE 3D GIFT BOX CONTAINER */}
          <div
            onClick={handleOpenGift}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative mx-auto cursor-pointer group flex flex-col items-center justify-center transition-all duration-300 ${
              stage === 1 ? 'scale-95' : stage === 0 ? 'hover:scale-[1.03] active:scale-95' : ''
            }`}
            style={{
              width: 'min(90vw, 340px)',
              maxWidth: '340px',
            }}
          >
            {/* Cinematic Golden Radial Bloom */}
            <div 
              className="absolute inset-0 rounded-full blur-2xl pointer-events-none transition-all duration-700 -z-10"
              style={{
                background: stage >= 4 
                  ? 'radial-gradient(circle, rgba(212, 175, 55, 0.7) 0%, rgba(110, 32, 53, 0.5) 45%, transparent 75%)'
                  : 'radial-gradient(circle, rgba(200, 155, 90, 0.45) 0%, rgba(110, 32, 53, 0.35) 50%, transparent 75%)',
                opacity: stage >= 2 ? 1.0 : isHovered ? 0.85 : 0.6,
                transform: stage >= 4 ? 'scale(1.4)' : stage >= 2 ? 'scale(1.2)' : 'scale(1.0)',
              }}
            />

            {/* Depth Floor Shadow */}
            <div className="absolute -bottom-3 w-4/5 h-6 bg-black/50 blur-lg rounded-full transform group-hover:scale-105 transition-transform" />

            {/* 3D OPENING LID STRUCTURE (STAGE >= 4) */}
            {stage >= 4 && (
              <div 
                className="absolute -top-9 sm:-top-11 w-[84%] h-22 sm:h-26 rounded-t-3xl border-t-2 border-x-2 border-amber-300 shadow-[0_-20px_40px_rgba(212,175,55,0.6)] z-40 bg-gradient-to-r from-[#8B263E] via-[#6E2035] to-[#3A1420] flex flex-col items-center justify-center p-2 transition-all duration-700 animate-in fade-in"
                style={{
                  transform: 'perspective(700px) rotateX(-60deg) translateY(-12px)',
                  transformOrigin: 'top center',
                  boxShadow: '0 -15px 35px rgba(212,175,55,0.5), inset 0 2px 15px rgba(255,255,255,0.4)',
                }}
              >
                <div className="flex items-center gap-1.5 text-amber-300 font-serif text-xs font-bold tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>INVITATION UNLOCKED</span>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
              </div>
            )}

            {/* RADIANT GOLDEN INTERIOR LIGHT BEAM & SUNBURST (STAGE >= 4) */}
            {stage >= 4 && (
              <div className="absolute top-0 inset-x-0 pointer-events-none flex flex-col items-center z-30">
                <div
                  className="w-64 sm:w-72 h-44 rounded-full blur-2xl animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, #FFF7CC 0%, #D4AF37 45%, rgba(110,32,53,0.4) 75%, transparent 100%)',
                  }}
                />
              </div>
            )}

            {/* MAIN 3D VELVET GIFT CHEST CONTAINER */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] group-hover:border-amber-300 transition-all duration-500">
              <img
                src="/velvet_invitation_chest.jpg"
                alt="Personalized Velvet Invitation Gift Chest"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/romantic_3d_invitation_hero.jpg';
                }}
                className={`w-full h-auto object-cover rounded-2xl transition-all duration-700 ${
                  stage >= 4 
                    ? 'scale-105 filter brightness-115 contrast-105' 
                    : stage >= 2 
                    ? 'scale-[1.02] filter brightness-105'
                    : 'group-hover:scale-105'
                }`}
                loading="eager"
              />

              {/* STAGE 3: GOLDEN RIBBON UNLOCK PULSE */}
              {stage === 3 && (
                <div className="absolute inset-0 bg-amber-400/35 backdrop-blur-[1px] flex items-center justify-center animate-pulse z-30">
                  <div className="px-5 py-2.5 rounded-full bg-black/90 border-2 border-amber-300 text-amber-300 text-xs font-serif font-extrabold flex items-center gap-2.5 shadow-2xl animate-in zoom-in-90 duration-300">
                    <Unlock className="w-4 h-4 animate-spin text-amber-300" />
                    <span className="tracking-wider uppercase">Unlocking Gold Ribbon...</span>
                  </div>
                </div>
              )}

              {/* STAGES 6 & 7: VERTICALLY RISING ROYAL INVITATION CARD */}
              {stage >= 6 && (
                <div className="absolute inset-x-3 sm:inset-x-4 top-2 z-40 animate-in slide-in-from-bottom-12 fade-in duration-700">
                  <div 
                    className="p-4 sm:p-5 rounded-2xl border-2 border-amber-300 text-center shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-1.5 backdrop-blur-xl"
                    style={{
                      background: 'linear-gradient(135deg, #3A1420 0%, #1A080E 100%)',
                      boxShadow: '0 15px 40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(212,175,55,0.5)',
                    }}
                  >
                    <div className="text-2xl animate-bounce">👑</div>
                    <h4 className="font-serif italic font-extrabold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#FFE58F] to-[#E5C07B] truncate">
                      {coupleNames || eventTitle}
                    </h4>
                    <p className="text-[11px] font-mono font-bold text-amber-300 tracking-wider uppercase animate-pulse">
                      ✨ Unveiling Royal Invitation ✨
                    </p>
                  </div>
                </div>
              )}

              {/* STAGE 7: "WOW" GOLDEN SHIMMER FLASH BLOOM */}
              {stage === 7 && (
                <div className="absolute inset-0 bg-amber-200/40 pointer-events-none z-50 animate-in fade-in duration-200" />
              )}
            </div>

            {/* Floating Ambient Emojis around box */}
            <div className="absolute -top-3 -left-3 text-2xl animate-bounce duration-1000">✨</div>
            <div className="absolute -bottom-3 -right-3 text-2xl animate-pulse duration-700">🌹</div>
            <div className="absolute top-1/2 -right-4 text-xl animate-pulse duration-1000 opacity-80">💖</div>
          </div>

          {/* TAP TO OPEN CALL-TO-ACTION BUTTON */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleOpenGift}
              disabled={isOpening}
              className="w-full sm:w-auto px-9 py-4 rounded-full font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase text-white shadow-[0_12px_35px_rgba(200,155,90,0.4)] flex items-center justify-center gap-2.5 mx-auto border-2 border-amber-300 transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, #6E2035 0%, #521626 50%, #3A1420 100%)',
              }}
            >
              {/* Shimmer sweep animation */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              
              <Gift className="w-4 h-4 text-amber-300 animate-bounce" />
              <span className="drop-shadow-md text-amber-200 font-extrabold tracking-widest">
                {isOpening ? 'OPENING INVITATION GIFT...' : 'TAP TO OPEN YOUR INVITATION'}
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </button>
          </div>

          {/* Non-intrusive Skip Option during opening animation */}
          {isOpening && (
            <div className="pt-0.5 animate-in fade-in duration-300">
              <button
                type="button"
                onClick={handleSkip}
                className="text-[11px] font-mono text-slate-400 hover:text-amber-300 underline underline-offset-2 transition-colors py-1 px-3"
              >
                Skip Animation ›
              </button>
            </div>
          )}

        </div>
      )}

      {/* 🌟 4. REVEALED CELEBRATION BADGE & RE-CLOSE / RE-OPEN OPTION (STAGE 8) 🌟 */}
      {stage === 8 && (
        <div className="w-full max-w-xl mx-auto text-center space-y-2 animate-in zoom-in-95 fade-in duration-700 px-2">
          <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-black/50 border border-amber-400/40 backdrop-blur-md text-xs font-mono text-amber-300 shadow-lg">
            <span className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>GIFT UNWRAPPED ✓</span>
            </span>

            <button
              type="button"
              onClick={handleReclose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/60 text-amber-200 font-serif font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-md"
              title="Close gift box to open again"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Close & Re-open Box ↺</span>
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes floatPetal {
          0% {
            transform: translateY(0) rotate(0deg) scale(0.8);
            opacity: 0;
          }
          15% {
            opacity: 0.9;
          }
          85% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(105vh) rotate(360deg) scale(1.1);
            opacity: 0;
          }
        }
        @keyframes floatHeartUp {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 0.95;
            transform: translateY(-20px) scale(1.1);
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-160px) scale(1.3);
            opacity: 0;
          }
        }
      `}</style>

    </div>
  );
};
