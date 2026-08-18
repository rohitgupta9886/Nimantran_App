import React from 'react';
import { Sparkles } from 'lucide-react';

interface ExperienceLoaderProps {
  title?: string;
}

export const ExperienceLoader: React.FC<ExperienceLoaderProps> = ({ title = 'Nimantran AI' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0205] text-amber-100 select-none">
      {/* Background Ambient Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Monogram Crest */}
      <div className="relative z-10 flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-3xl border-2 border-amber-300/80 bg-gradient-to-br from-[#2D0A14] to-[#140308] flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.35)] relative">
          <span className="font-serif font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5DC] via-[#FFD700] to-[#E5C07B]">
            N
          </span>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="font-serif font-extrabold text-lg tracking-widest text-amber-200 uppercase">
            {title}
          </h2>
          <p className="text-[10px] font-mono tracking-[0.25em] text-amber-400/80 uppercase animate-pulse">
            ✦ Preparing Invitation ✦
          </p>
        </div>
      </div>
    </div>
  );
};
