import React from 'react';
import { Sparkles, RotateCcw, Volume2, VolumeX, Heart, ChevronDown } from 'lucide-react';
import { Invitation3DCard } from '../../components/Invitation3DCard';
import { CelebrationTheme } from '../../utils/themeCatalog';

interface HeroSceneProps {
  title: string;
  hindiTitle?: string;
  formattedDate: string;
  venueName?: string;
  venueAddress?: string;
  hostName?: string;
  heroTag: string;
  activeTheme: CelebrationTheme;
  musicUrl?: string;
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
  onReplay: () => void;
  onOpenRsvp: () => void;
}

export const HeroScene: React.FC<HeroSceneProps> = ({
  title,
  hindiTitle,
  formattedDate,
  venueName,
  venueAddress,
  hostName,
  heroTag,
  activeTheme,
  musicUrl,
  isPlayingMusic,
  onToggleMusic,
  onReplay,
  onOpenRsvp,
}) => {
  return (
    <section
      id="hero-section"
      className="relative w-full min-h-[92svh] flex flex-col justify-between items-center text-center px-4 sm:px-6 pt-5 pb-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700 font-sans"
    >
      {/* Top Floating Controls: Tag Badge + Replay + Audio Equalizer */}
      <div className="w-full flex items-center justify-between z-30 pt-1">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-300/70 text-amber-200 text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-widest backdrop-blur-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{heroTag}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="px-3.5 py-1.5 rounded-full bg-black/60 border border-amber-300/70 text-amber-200 text-[11px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-2xl hover:bg-black/80 transition-all shadow-md active:scale-95"
            title="Replay Envelope Opening"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Replay ↺</span>
          </button>

          {musicUrl && (
            <button
              type="button"
              onClick={onToggleMusic}
              className={`p-2.5 rounded-full border border-amber-300/80 shadow-lg backdrop-blur-2xl transition-all ${
                isPlayingMusic
                  ? 'bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.7)]'
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
      <div className="w-full h-80 sm:h-96 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] rounded-3xl overflow-hidden my-auto border-2 border-amber-300/70">
        <Invitation3DCard
          theme={activeTheme}
          title={title}
          hindiTitle={hindiTitle}
          dateStr={formattedDate}
          venueName={venueName}
          venueAddress={venueAddress}
          hostName={hostName}
          interactiveTilt={true}
          className="w-full h-full"
        />
      </div>

      {/* RSVP Call-to-Action & Explore Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
        <button
          type="button"
          onClick={onOpenRsvp}
          className="w-full sm:w-auto px-9 py-4 rounded-full font-serif font-extrabold text-xs sm:text-sm text-white shadow-[0_12px_40px_rgba(245,158,11,0.45)] flex items-center justify-center gap-2.5 border-2 border-amber-300 active:scale-95 transition-all hover:scale-105"
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
          className="w-full sm:w-auto px-6 py-4 rounded-full bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-400/50 font-serif font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all backdrop-blur-2xl"
        >
          <span>Explore Details</span>
          <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
        </button>
      </div>
    </section>
  );
};
