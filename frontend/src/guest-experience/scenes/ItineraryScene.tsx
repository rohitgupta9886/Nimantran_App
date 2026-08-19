import React from 'react';
import { Sparkles, Clock } from 'lucide-react';

interface ItinerarySceneProps {
  functionsList: any[];
}

export const ItineraryScene: React.FC<ItinerarySceneProps> = ({ functionsList }) => {
  if (!functionsList || functionsList.length === 0) return null;

  return (
    <section className="space-y-6 font-sans">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>THE FESTIVITIES</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
          Ceremonies & Itinerary
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {functionsList.map((fn: any, idx: number) => (
          <div
            key={fn.id || idx}
            className="p-6 rounded-2xl border border-amber-300/40 bg-black/65 backdrop-blur-2xl shadow-xl space-y-3 relative overflow-hidden group hover:border-amber-300 transition-all"
          >
            {/* Stitch Accent Corner */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

            <div className="flex items-center justify-between relative z-10">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-mono font-extrabold uppercase tracking-wider border border-amber-300/30">
                {fn.function_type || fn.name || `Ceremony ${idx + 1}`}
              </span>
              {(fn.start_time || fn.date_time) && (
                <span className="text-[11px] font-mono text-amber-200/90 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {fn.start_time || fn.date_time}
                </span>
              )}
            </div>

            <h4 className="font-serif text-xl font-bold text-white relative z-10">{fn.title || fn.name}</h4>
            
            {fn.description && (
              <p className="text-xs text-amber-100/80 leading-relaxed relative z-10">{fn.description}</p>
            )}

            {fn.venue_name || fn.venue ? (
              <p className="text-xs text-amber-200/90 flex items-center gap-1.5 relative z-10">
                <span className="text-amber-400">📍</span>
                <span>{fn.venue_name || fn.venue}</span>
              </p>
            ) : null}

            {fn.dress_code && (
              <p className="text-[11px] text-amber-300 font-mono relative z-10">
                ✨ Dress code: <span className="font-bold">{fn.dress_code}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
