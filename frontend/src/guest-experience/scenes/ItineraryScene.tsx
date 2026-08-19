import React from 'react';
import { Sparkles, Clock } from 'lucide-react';

interface ItinerarySceneProps {
  functionsList: any[];
}

export const ItineraryScene: React.FC<ItinerarySceneProps> = ({ functionsList }) => {
  if (!functionsList || functionsList.length === 0) return null;

  return (
    <section className="space-y-5 font-sans">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>PROGRAM ITINERARY</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
          Ceremonies & Celebrations
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {functionsList.map((fn: any, idx: number) => (
          <div
            key={fn.id || idx}
            className="p-5 rounded-2xl border border-amber-300/50 bg-black/60 backdrop-blur-xl shadow-lg space-y-2 relative overflow-hidden group hover:border-amber-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-mono font-bold uppercase">
                {fn.function_type || `Ceremony ${idx + 1}`}
              </span>
              {fn.start_time && (
                <span className="text-[11px] font-mono text-amber-200/80 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {fn.start_time}
                </span>
              )}
            </div>

            <h4 className="font-serif text-lg font-bold text-white">{fn.title || fn.name}</h4>
            {fn.venue && <p className="text-xs text-amber-100/70">{fn.venue}</p>}
            {fn.dress_code && (
              <p className="text-[11px] text-amber-300 font-mono">Dress code: {fn.dress_code}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
