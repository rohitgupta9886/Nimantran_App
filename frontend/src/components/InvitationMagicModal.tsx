import React, { useState } from 'react';
import { Sparkles, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface InvitationMagicModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  onSelectTheme: (themeData: any) => void;
}

const MAGIC_THEMES = [
  {
    id: 'ROYAL_ELEGANT',
    name: '👑 Royal Gold & Burgundy',
    tagline: 'High-Gravity Regal Aesthetic',
    coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
    gradient: 'from-[#1A0006] via-[#0D0205] to-[#1A0006]',
    borderColor: 'border-amber-400',
    shloka: '|| श्री गणेशाय नमः ||',
    styleName: 'Royal Elegant',
  },
  {
    id: 'CELEBRATORY_PASTEL',
    name: '🎉 Celebratory Pastel',
    tagline: 'Joyful & Energetic Vibe',
    coverUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop',
    gradient: 'from-[#1E1B4B] via-[#0F0E2A] to-[#1E1B4B]',
    borderColor: 'border-purple-400',
    shloka: '|| ॐ श्री गुरुभ्यो नमः ||',
    styleName: 'Celebratory Amethyst',
  },
  {
    id: 'TRADITIONAL_FESTIVE',
    name: '🪔 Traditional Heritage',
    tagline: 'Cultural Marigold & Crimson',
    coverUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop',
    gradient: 'from-[#3A0F03] via-[#1B0701] to-[#3A0F03]',
    borderColor: 'border-orange-400',
    shloka: '|| ॐ सर्वमंगल मांगल्ये ||',
    styleName: 'Traditional Heritage',
  },
  {
    id: 'LUXURY_MINIMAL',
    name: '🥂 Luxury Platinum Gala',
    tagline: 'Modern & Sophisticated Minimal',
    coverUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop',
    gradient: 'from-[#022C22] via-[#011712] to-[#022C22]',
    borderColor: 'border-emerald-400',
    shloka: '|| ॐ नमः शिवाय ||',
    styleName: 'Luxury Platinum Gala',
  },
];

export const InvitationMagicModal: React.FC<InvitationMagicModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  onSelectTheme,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!isOpen) return null;

  const currentTheme = MAGIC_THEMES[activeIdx];

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % MAGIC_THEMES.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + MAGIC_THEMES.length) % MAGIC_THEMES.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#140005] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl relative gold-glow">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-lg font-bold gold-gradient-text">✨ INVITATION MAGIC CAROUSEL</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 text-center">
          Swipe or tap arrows to preview instant visual theme variations synthesized by AI!
        </p>

        {/* CAROUSEL SWIPE PREVIEW CONTAINER */}
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* VISUAL THEME PREVIEW CARD */}
          <div className={`w-full rounded-2xl border-2 ${currentTheme.borderColor} overflow-hidden relative p-6 text-center space-y-4 shadow-2xl transition-all duration-500 bg-[#0D0205]`}>
            <img
              src={currentTheme.coverUrl}
              alt={currentTheme.name}
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${currentTheme.gradient} opacity-90`} />

            <div className="relative z-10 space-y-3">
              <span className="px-3 py-1 rounded-full bg-black/60 text-amber-300 text-[10px] font-mono uppercase border border-amber-500/40">
                {currentTheme.name}
              </span>
              <div className="text-amber-400 font-hindi font-bold text-sm">{currentTheme.shloka}</div>
              <h2 className="font-serif text-2xl font-bold gold-gradient-text">{eventTitle || 'Celebration Invitation'}</h2>
              <p className="text-xs text-slate-300 italic font-serif">"{currentTheme.tagline}"</p>

              <div className="py-2 border-y border-amber-500/20 text-[11px] font-mono text-amber-300">
                ✨ Live Dynamic Palette & Typography Applied
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {MAGIC_THEMES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveIdx(i)}
              className={`h-2 rounded-full transition-all ${activeIdx === i ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700'}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            onSelectTheme(currentTheme);
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform"
        >
          <Check className="w-4 h-4" /> Apply "{currentTheme.styleName}" Theme with 1-Tap
        </button>

      </div>
    </div>
  );
};
