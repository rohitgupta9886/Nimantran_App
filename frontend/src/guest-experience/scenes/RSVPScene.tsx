import React from 'react';
import { Sparkles, Heart, Clock, X, Check } from 'lucide-react';

interface RSVPSceneProps {
  isConfirmedState: boolean;
  quickRsvpSubmitting: boolean;
  onQuickRsvp: (status: 'CONFIRMED' | 'TENTATIVE' | 'DECLINED') => Promise<void>;
  onOpenRsvpModal: () => void;
}

export const RSVPScene: React.FC<RSVPSceneProps> = ({
  isConfirmedState,
  quickRsvpSubmitting,
  onQuickRsvp,
  onOpenRsvpModal,
}) => {
  return (
    <section id="rsvp-section" className="space-y-5 text-center font-sans">
      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>CONFIRM ATTENDANCE</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
          Will You Grace Us With Your Presence?
        </h2>
      </div>

      {isConfirmedState ? (
        <div className="p-6 rounded-3xl bg-emerald-950/80 border-2 border-emerald-400/80 shadow-2xl backdrop-blur-2xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-300 shadow-md">
            <Check className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-xl font-bold text-white">Attendance Confirmed!</h4>
          <p className="text-xs text-emerald-200">
            Thank you! Your presence has been recorded and the host family has been notified.
          </p>
          <button
            type="button"
            onClick={onOpenRsvpModal}
            className="px-5 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-mono font-bold border border-emerald-400/60 transition-all"
          >
            Update RSVP Preferences →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
          <button
            type="button"
            disabled={quickRsvpSubmitting}
            onClick={() => onQuickRsvp('CONFIRMED')}
            className="p-4 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800/80 border-2 border-emerald-400/80 text-white shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1 group"
          >
            <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-serif font-bold text-sm">Accept with Joy</span>
            <span className="text-[10px] font-mono text-emerald-200/80">I will attend</span>
          </button>

          <button
            type="button"
            disabled={quickRsvpSubmitting}
            onClick={() => onQuickRsvp('TENTATIVE')}
            className="p-4 rounded-2xl bg-amber-900/60 hover:bg-amber-800/80 border-2 border-amber-400/80 text-white shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1 group"
          >
            <Clock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-serif font-bold text-sm">Thinking / Maybe</span>
            <span className="text-[10px] font-mono text-amber-200/80">Tentative</span>
          </button>

          <button
            type="button"
            disabled={quickRsvpSubmitting}
            onClick={() => onQuickRsvp('DECLINED')}
            className="p-4 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 border-2 border-rose-400/60 text-white shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1 group"
          >
            <X className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="font-serif font-bold text-sm">Cannot Attend</span>
            <span className="text-[10px] font-mono text-rose-200/80">Sending blessings</span>
          </button>
        </div>
      )}
    </section>
  );
};
