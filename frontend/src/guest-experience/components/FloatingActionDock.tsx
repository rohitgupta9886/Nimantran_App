import React from 'react';
import { Heart, MapPin, Gift, MessageCircle, RotateCcw } from 'lucide-react';

interface FloatingActionDockProps {
  hasShagun: boolean;
  onOpenRsvp: () => void;
  onOpenShagun: () => void;
  onReplay: () => void;
}

export const FloatingActionDock: React.FC<FloatingActionDockProps> = ({
  hasShagun,
  onOpenRsvp,
  onOpenShagun,
  onReplay,
}) => {
  return (
    <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom duration-500 font-sans">
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-black/70 border border-amber-300/80 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <button
          type="button"
          onClick={onOpenRsvp}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-serif font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Heart className="w-3.5 h-3.5 fill-black" />
          <span>RSVP</span>
        </button>

        <button
          type="button"
          onClick={() => document.getElementById('venue-details-chapter')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-2 sm:px-3 sm:py-2 rounded-full hover:bg-white/10 text-amber-200 text-xs font-mono font-bold flex items-center gap-1 transition-all"
          title="Venue & Map"
        >
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Venue</span>
        </button>

        {hasShagun && (
          <button
            type="button"
            onClick={onOpenShagun}
            className="p-2 sm:px-3 sm:py-2 rounded-full hover:bg-white/10 text-amber-200 text-xs font-mono font-bold flex items-center gap-1 transition-all"
            title="Digital Shagun"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Shagun</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => document.getElementById('wishes-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-2 sm:px-3 sm:py-2 rounded-full hover:bg-white/10 text-amber-200 text-xs font-mono font-bold flex items-center gap-1 transition-all"
          title="Wishes"
        >
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Wishes</span>
        </button>

        <button
          type="button"
          onClick={onReplay}
          className="p-2 rounded-full hover:bg-white/10 text-amber-200 transition-all"
          title="Replay Invitation"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
