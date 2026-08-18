import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, Eye } from 'lucide-react';
import { ThemeTokens } from '../utils/themeEngine';

interface ParallaxStoryEngineProps {
  memories: any[];
  theme: ThemeTokens;
  onSelectMemory?: (memory: any) => void;
}

// Single Alternating Scroll-Revealed Non-Rectangular Card Item
const AlternatingStoryCard: React.FC<{
  memory: any;
  index: number;
  total: number;
  theme: ThemeTokens;
  onSelectMemory?: (m: any) => void;
}> = ({ memory, index, total, theme, onSelectMemory }) => {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Alternating Left -> Right -> Left -> Right pattern
  const isLeft = index % 2 === 0;

  // Derive Hindi Title and English Title without "संस्मरण"
  const titleText = (memory.title || '').toLowerCase();
  let hindiTitle = memory.hindi_title;
  let englishTitle = memory.title || `Moment #${index + 1}`;

  if (!hindiTitle) {
    if (titleText.includes('first meeting') || titleText.includes('met')) {
      hindiTitle = 'पहली मुलाकात';
      englishTitle = memory.title || 'FIRST MEETING';
    } else if (titleText.includes('first love') || titleText.includes('love')) {
      hindiTitle = 'पहला प्यार';
      englishTitle = memory.title || 'FIRST LOVE';
    } else if (titleText.includes('first date') || titleText.includes('date')) {
      hindiTitle = 'पहली डेट';
      englishTitle = memory.title || 'FIRST DATE';
    } else if (titleText.includes('first kiss') || titleText.includes('kiss')) {
      hindiTitle = 'पहली किस';
      englishTitle = memory.title || 'FIRST KISS';
    } else if (titleText.includes('proposal') || titleText.includes('propose')) {
      hindiTitle = 'प्रस्ताव';
      englishTitle = memory.title || 'THE PROPOSAL';
    } else if (titleText.includes('roka') || titleText.includes('engagement')) {
      hindiTitle = 'सगाई & रोका';
      englishTitle = memory.title || 'OUR ENGAGEMENT';
    } else if (titleText.includes('mehendi') || titleText.includes('haldi')) {
      hindiTitle = 'मेहँदी & हल्दी';
      englishTitle = memory.title || 'MEHENDI & HALDI';
    } else if (titleText.includes('sangeet') || titleText.includes('dance')) {
      hindiTitle = 'संगीत उत्सव';
      englishTitle = memory.title || 'SANGEET NIGHT';
    } else if (titleText.includes('wedding') || titleText.includes('shaadi') || titleText.includes('phere')) {
      hindiTitle = 'शुभ विवाह';
      englishTitle = memory.title || 'OUR WEDDING';
    } else if (titleText.includes('reception') || titleText.includes('party')) {
      hindiTitle = 'पावन रिसेप्शन';
      englishTitle = memory.title || 'RECEPTION GALA';
    } else {
      hindiTitle = 'यादगार पल';
      englishTitle = memory.title || `CHERISHED MOMENT #${index + 1}`;
    }
  }

  // Ensure "संस्मरण" is NEVER rendered anywhere
  if (hindiTitle === 'संस्मरण') {
    hindiTitle = 'यादगार पल';
  }

  // 5 Non-Rectangular Artistic Card Shapes (Arch, Leaf, Scalloped Shield, Bell, Medallion)
  const shapeStyles = [
    'rounded-[150px_150px_36px_36px]', // 0: Royal Arch Dome
    'rounded-[140px_40px_140px_40px]', // 1: Organic Leaf Oval
    'rounded-[40px_140px_40px_140px]', // 2: Scalloped Floral Shield
    'rounded-[120px_120px_150px_150px]', // 3: Royal Bell Arch
    'rounded-[130px]',                  // 4: Circular Medallion
  ];
  const cardShape = shapeStyles[index % shapeStyles.length];

  // Floral Garland Overlay Decorations
  const floralGarlands = [
    '🌹 💖 🌹 💖', // Red Rose Garland
    '🌸 🌺 🌸 🌺', // Pink Blossom Garland
    '🌼 🍊 🌼 🍊', // Marigold Garland
    '🪷 💙 🪷 💙', // Blue Lotus Garland
    '💐 💫 💐 💫', // Golden Bloom Garland
  ];
  const garlandEmojis = floralGarlands[index % floralGarlands.length];

  // Image Artwork
  const bgImage = memory.image_url || '/velvet_invitation_chest.jpg';

  return (
    <div
      ref={itemRef}
      className={`relative w-full my-10 sm:my-16 flex flex-col items-center ${
        isLeft ? 'md:items-start' : 'md:items-end'
      } transition-transform transition-opacity duration-500 ease-out transform-gpu ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.97]'
      }`}
    >
      {/* GLOWING THREAD BEAD NODE ON THE PATH */}
      <div className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-30 ${isLeft ? 'right-[45%]' : 'left-[45%]'}`}>
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-amber-400/30 animate-ping absolute" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border-2 border-amber-200 shadow-[0_0_20px_#FFD700] z-10 flex items-center justify-center text-xs">
            ✨
          </div>
        </div>
      </div>

      {/* 🌟 3D ARTISTIC NON-RECTANGULAR CARD — TEXT DIRECTLY INTEGRATED ON IMAGE (NO TIME DISPLAYED) 🌟 */}
      <div
        onClick={() => onSelectMemory && onSelectMemory(memory)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectMemory && onSelectMemory(memory);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View story memory: ${englishTitle}`}
        className={`relative w-full max-w-[320px] xs:max-w-[340px] sm:max-w-[420px] h-[440px] xs:h-[460px] sm:h-[520px] ${cardShape} overflow-hidden shadow-2xl group cursor-pointer border-4 border-amber-300/85 transition-all duration-300 transform-gpu hover:scale-[1.02] hover:border-amber-300 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none`}
        style={{
          willChange: 'transform, opacity',
          contain: 'layout paint',
          boxShadow: isVisible 
            ? '0 30px 90px -10px rgba(0, 0, 0, 0.95), 0 0 45px rgba(255, 215, 0, 0.45)' 
            : '0 20px 50px -10px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* 1. BACKGROUND EVENT IMAGE */}
        <img
          src={bgImage}
          alt={englishTitle}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 transform-gpu group-hover:scale-105 filter brightness-[0.7] contrast-[1.15]"
        />

        {/* 2. SOFT VIGNETTE OVERLAY FOR INTEGRATED ARTWORK TEXT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/50 to-black/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/95 pointer-events-none" />

        {/* Floral Garland Border Overlay */}
        <div className="absolute top-3 inset-x-0 text-center text-sm tracking-[0.35em] opacity-90 select-none pointer-events-none drop-shadow-md">
          {garlandEmojis}
        </div>
        <div className="absolute bottom-3 inset-x-0 text-center text-sm tracking-[0.35em] opacity-90 select-none pointer-events-none drop-shadow-md">
          {garlandEmojis}
        </div>

        {/* 3. TEXT FLOATING DIRECTLY ON THE BACKGROUND IMAGE (PRIMARY EVENT FOCUS) */}
        <div className="relative z-20 h-full p-6 sm:p-8 flex flex-col justify-between text-center text-white select-none">
          
          {/* Top Decorative Sparkle Emblem */}
          <div className="pt-2">
            <span className="text-amber-300 text-sm tracking-widest font-serif drop-shadow-[0_2px_8px_rgba(255,215,0,0.6)]">
              ✦ ❈ ✦
            </span>
          </div>

          {/* Center Focal Typography — LARGE PROMINENT EVENT TYPE FOCUS */}
          <div className="space-y-2.5 my-auto px-2">
            {/* Hindi Event Title */}
            {hindiTitle && (
              <h4 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wider text-[#FFD700] drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)]">
                {hindiTitle}
              </h4>
            )}

            {/* 🌟 ENGLISH MAIN EVENT TITLE (PRIMARY VISUAL & TEXTUAL FOCUS — MUCH LARGER) 🌟 */}
            <h3 className="font-serif font-extrabold uppercase tracking-widest text-3xl sm:text-4xl text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.98)] leading-tight">
              {englishTitle}
            </h3>

            <div className="w-20 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto my-1" />

            {/* Emotional Story Description / Quote (If present in data) */}
            {memory.story && (
              <p className="font-serif italic text-xs sm:text-sm text-slate-100 leading-relaxed line-clamp-3 px-2 drop-shadow-md">
                "{memory.story}"
              </p>
            )}

            {/* Date Display (ONLY DATE — TIME IS 100% REMOVED) */}
            {memory.date && (
              <div className="pt-1.5">
                <span className="inline-block px-4 py-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-200 font-mono text-xs font-bold tracking-widest uppercase shadow-md backdrop-blur-md">
                  🗓️ {memory.date}
                </span>
              </div>
            )}

            {/* Venue Location (If present) */}
            {memory.venue_name && (
              <p className="font-serif italic text-xs text-slate-300 line-clamp-1 drop-shadow-md pt-0.5">
                📍 {memory.venue_name}
              </p>
            )}
          </div>

          {/* Bottom Tap Hint */}
          <div className="pb-2 text-[10px] font-mono text-amber-300/90 font-extrabold tracking-widest uppercase flex items-center justify-center gap-1.5 drop-shadow-md">
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            <span>Tap to View Story Moment</span>
          </div>

        </div>

        {/* Bottom Tassel Ornament for Every 5th Card */}
        {index % 5 === 4 && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-amber-400 text-xl pointer-events-none animate-bounce">
            🎐
          </div>
        )}
      </div>
    </div>
  );
};

export const ParallaxStoryEngine: React.FC<ParallaxStoryEngineProps> = ({
  memories,
  theme,
  onSelectMemory,
}) => {
  if (!memories || memories.length === 0) return null;

  return (
    <section id="storyline-section" className="relative z-10 my-16 py-10 overflow-x-hidden">
      
      {/* HEADER SECTION ON DEEP ROMANTIC BLUE BACKGROUND */}
      <div className="text-center space-y-3 mb-16 px-4 relative z-20">
        <div className="flex items-center justify-center gap-3">
          <span className="w-12 h-[1.5px] bg-gradient-to-r from-transparent to-amber-400" />
          <span className="text-amber-300 text-sm tracking-widest font-serif drop-shadow-md">✦ ❈ ✦</span>
          <span className="w-12 h-[1.5px] bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        {/* Hindi Main Section Title */}
        <h2 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-wide text-[#FFD700] drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
          हमारी प्रेम कहानी
        </h2>

        {/* English Section Subtitle */}
        <h3 className="font-serif italic text-2xl sm:text-3xl font-bold text-[#FFF8E7] drop-shadow-md">
          Our Beautiful Love Story
        </h3>

        <div className="flex items-center justify-center gap-2 pt-1 text-amber-300/90 text-xs">
          <span>🌹</span>
          <span className="font-serif italic text-slate-200">A magical journey weaving through our most cherished moments</span>
          <span>🌹</span>
        </div>
      </div>

      {/* MAIN CONTAINER WITH ALTERNATING WINDING GOLDEN THREAD */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-8">
        
        {/* 🌟 ELEGANT S-WINDING DECORATIVE ROTATING THREAD SVG PATH 🌟 */}
        <svg
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="goldThreadGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
              <stop offset="25%" stopColor="#FFF5C0" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FFD700" stopOpacity="1.0" />
              <stop offset="75%" stopColor="#C9AA78" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* S-Winding Curved Thread Line connecting Left and Right cards */}
          <path
            d="M 25,2 Q 75,18 75,34 T 25,66 T 75,98"
            fill="none"
            stroke="url(#goldThreadGlow)"
            strokeWidth="0.85"
            strokeDasharray="2 1"
          />
        </svg>

        {/* Mobile Vertical Golden Thread Path */}
        <div className="md:hidden absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-[2px] opacity-70 bg-gradient-to-b from-transparent via-amber-400 to-transparent pointer-events-none z-0" />

        {/* ALTERNATING LEFT -> RIGHT -> LEFT -> RIGHT CARDS (ONE-BY-ONE SCROLL REVEAL) */}
        <div className="space-y-8 sm:space-y-12 relative z-10">
          {memories.map((m: any, idx: number) => (
            <AlternatingStoryCard
              key={idx}
              memory={m}
              index={idx}
              total={memories.length}
              theme={theme}
              onSelectMemory={onSelectMemory}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
