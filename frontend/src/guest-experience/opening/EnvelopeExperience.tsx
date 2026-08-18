import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, ChevronRight, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
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
  // 5-SCENE STORYBOARD SEQUENCE:
  // Scene 1: White Dove soaring forward in clouds
  // Scene 2: Dove releasing the colorful royal envelope
  // Scene 3: Envelope falling/drifting gracefully through clouds
  // Scene 4: Envelope stabilized in mid-air above clouds, ready for tap
  // Scene 5: Envelope opening & glowing folded card emerging upwards
  const [currentScene, setCurrentScene] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isOpeningCard, setIsOpeningCard] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const envelopeRef = useRef<HTMLDivElement | null>(null);

  const cfg = getCelebrationConfig(eventType, '', title);

  // Auto-advance scenes 1 -> 2 -> 3 -> 4
  useEffect(() => {
    if (currentScene === 1) {
      const t1 = setTimeout(() => setCurrentScene(2), 2200);
      return () => clearTimeout(t1);
    }
    if (currentScene === 2) {
      const t2 = setTimeout(() => setCurrentScene(3), 2200);
      return () => clearTimeout(t2);
    }
    if (currentScene === 3) {
      const t3 = setTimeout(() => setCurrentScene(4), 2200);
      return () => clearTimeout(t3);
    }
  }, [currentScene]);

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
    if (currentScene < 4 || !envelopeRef.current) return;
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

  // Trigger Scene 5 Opening Sequence
  const handleOpenEnvelope = () => {
    if (isOpeningCard) return;
    setCurrentScene(5);
    setIsOpeningCard(true);
    playOpeningAudio();

    // 0.8s: Confetti burst on card emergence
    setTimeout(() => {
      triggerConfetti();
    }, 800);

    // 2.0s: Transition seamlessly to unveiled hero
    setTimeout(() => {
      onOpenComplete();
    }, 2000);
  };

  const handleSkipToOpen = () => {
    setCurrentScene(4);
  };

  return (
    <div className="relative w-full min-h-[92svh] min-h-[92vh] flex flex-col items-center justify-between select-none py-6 px-3 overflow-hidden">
      
      {/* 🌟 1. STORY PROGRESS STEPPER BAR 🌟 */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between gap-1.5 px-3 z-30 pt-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                currentScene >= step
                  ? 'bg-gradient-to-r from-amber-400 to-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                  : 'bg-white/20'
              }`}
            />
            <span className="text-[9px] font-mono text-amber-200/70 uppercase">
              {step === 1 ? 'Dove' : step === 2 ? 'Release' : step === 3 ? 'Descent' : step === 4 ? 'Arrive' : 'Open'}
            </span>
          </div>
        ))}
      </div>

      {/* 🌟 2. SCENE 1: DOVE FLYING IN CLOUDS 🌟 */}
      {currentScene === 1 && (
        <div className="relative w-full max-w-2xl flex-1 flex flex-col items-center justify-center my-auto animate-in fade-in duration-700">
          <div className="relative w-full max-w-lg aspect-video rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-2 border-amber-300/70 group">
            <img
              src="/dove_scene1.jpg"
              alt="Scene 1: White Dove soaring through clouds"
              className="w-full h-full object-cover transform scale-105 animate-pulse duration-3000"
            />
            {/* Ambient Lighting & Title Badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-300/60 text-amber-200 text-xs font-mono font-extrabold uppercase tracking-widest backdrop-blur-md self-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Scene 1 • A Messenger from the Heavens</span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">
                  A Royal Celebration Awaits You
                </h3>
                <p className="text-xs font-serif italic text-amber-200">
                  {guestName ? `Carrying an exclusive invitation for ${guestName}...` : 'Carrying an auspicious invitation...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 3. SCENE 2: DOVE RELEASING ENVELOPE 🌟 */}
      {currentScene === 2 && (
        <div className="relative w-full max-w-2xl flex-1 flex flex-col items-center justify-center my-auto animate-in fade-in zoom-in-95 duration-700">
          <div className="relative w-full max-w-lg aspect-video rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-2 border-amber-300/70">
            <img
              src="/dove_scene2.jpg"
              alt="Scene 2: Dove releasing the colorful royal envelope"
              className="w-full h-full object-cover transform scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-300/60 text-amber-200 text-xs font-mono font-extrabold uppercase tracking-widest backdrop-blur-md self-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Scene 2 • The Royal Blessing Released</span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">
                  {title}
                </h3>
                <p className="text-xs font-serif italic text-amber-200">
                  Descending gracefully through the heavenly clouds...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 4. SCENE 3: ENVELOPE DRIFTING THROUGH CLOUDS 🌟 */}
      {currentScene === 3 && (
        <div className="relative w-full max-w-2xl flex-1 flex flex-col items-center justify-center my-auto animate-in fade-in duration-700">
          <div className="relative w-full max-w-lg aspect-video rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-2 border-amber-300/70">
            <img
              src="/dove_scene3.jpg"
              alt="Scene 3: Royal Envelope floating through sunlit sky"
              className="w-full h-full object-cover transform scale-110 animate-bounce duration-3000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-300/60 text-amber-200 text-xs font-mono font-extrabold uppercase tracking-widest backdrop-blur-md self-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Scene 3 • Drifting Toward You</span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">
                  {hindiTitle || '|| श्री गणेशाय नमः ||'}
                </h3>
                <p className="text-xs font-serif italic text-amber-200">
                  Ready to be received in your hands...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 5. SCENE 4 & 5: TACTILE ENVELOPE ARRIVAL & OPENING CARD EMERGENCE 🌟 */}
      {(currentScene === 4 || currentScene === 5) && (
        <div
          className="relative w-full max-w-lg flex-1 flex flex-col items-center justify-center my-auto animate-in fade-in zoom-in-95 duration-700"
          style={{ perspective: '1200px' }}
        >
          {/* Header Salutation */}
          <div className="text-center space-y-1 mb-5 z-20">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/60 border border-amber-300/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-[11px] sm:text-xs font-mono font-extrabold uppercase tracking-widest text-amber-200">
                {guestName ? `Invitation Delivered to ${guestName}` : 'Scene 4 • Auspicious Invitation Arrived'}
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
            className="relative w-[320px] sm:w-[380px] h-[220px] sm:h-[250px] cursor-pointer group transition-transform duration-200 ease-out"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${
                currentScene === 5 ? 1.06 : 1.0
              }, ${currentScene === 5 ? 1.06 : 1.0}, 1)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Depth Floor Shadow */}
            <div className="absolute -bottom-6 inset-x-8 h-10 bg-black/70 blur-xl rounded-full transform group-hover:scale-105 transition-transform pointer-events-none" />

            {/* Back Panel & Ornate Gold Pattern Foil */}
            <div
              className="absolute inset-0 rounded-2xl border-2 border-amber-300/80 shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #4A1020 0%, #2A0612 100%)',
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 0 30px rgba(245, 158, 11, 0.15)',
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

            {/* SCENE 5: Pristine White/Gold Folded Card Emerging Upwards */}
            <div
              className="absolute inset-x-4 h-[210px] sm:h-[240px] rounded-xl border-2 border-amber-300 shadow-2xl flex flex-col items-center justify-between p-4 text-center z-10 transition-all duration-700 ease-out"
              style={{
                background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5EB 100%)',
                bottom: currentScene === 5 ? '90px' : '8px',
                transform: currentScene === 5 ? 'scale(1.08) translateY(-50px)' : 'scale(0.96)',
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
                transform: currentScene === 5 ? 'rotateX(-180deg)' : 'rotateX(0deg)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
              }}
            >
              <div className="absolute inset-x-4 top-2 h-1 bg-amber-300/40 rounded-full" />
            </div>

            {/* Auspicious Wax Seal */}
            {currentScene === 4 && (
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
          <div className="mt-8 z-20 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleOpenEnvelope}
              disabled={currentScene === 5}
              className="px-9 py-4 rounded-full font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase text-white shadow-[0_12px_35px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2.5 border-2 border-amber-300 transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, #7E1E38 0%, #591628 50%, #3D0D19 100%)',
              }}
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <Heart className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
              <span className="drop-shadow-md text-amber-200 font-extrabold tracking-widest">
                {currentScene === 5 ? 'OPENING INVITATION...' : 'TAP TO OPEN INVITATION'}
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 6. BOTTOM CONTROLS & SKIP OPTION 🌟 */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between gap-2 px-3 z-30 pt-4">
        {currentScene < 4 ? (
          <button
            type="button"
            onClick={handleSkipToOpen}
            className="px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-xs font-mono font-bold flex items-center gap-1 backdrop-blur-md hover:bg-black/80 transition-all active:scale-95 ml-auto"
          >
            <span>Skip to Envelope →</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentScene(1)}
            className="px-3.5 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-[11px] font-mono font-bold flex items-center gap-1 backdrop-blur-md hover:bg-black/80 transition-all active:scale-95"
            title="Replay Story Sequence"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Replay Story ↺</span>
          </button>
        )}
      </div>
    </div>
  );
};
