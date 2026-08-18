import React from 'react';
import { CelebrationTheme } from '../utils/themeCatalog';

interface ThemeArtworkCanvasProps {
  theme: CelebrationTheme;
  title?: string;
  hindiTitle?: string;
  dateStr?: string;
  venueName?: string;
  className?: string;
  interactive?: boolean;
}

export const ThemeArtworkCanvas: React.FC<ThemeArtworkCanvasProps> = ({
  theme,
  title = 'Rohit & Priya',
  hindiTitle,
  dateStr = '18 Dec 2026',
  venueName = 'The Taj Palace',
  className = '',
}) => {
  const { colorPalette, id, typography } = theme;

  // Celebration-specific vector art elements based on theme ID
  const renderCelebrationArtwork = () => {
    switch (id) {
      // ─── 1. WEDDING: ROYAL MARIGOLD MANDAP ───────────────────────────────
      case 'wedding-royal-marigold':
        return (
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="marigoldBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3D0C14" />
                <stop offset="60%" stopColor="#1A0408" />
                <stop offset="100%" stopColor="#0A0205" />
              </linearGradient>
              <linearGradient id="goldArch" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFE8A3" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(245,158,11,0.5)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill="url(#marigoldBg)" />
            <circle cx="200" cy="150" r="140" fill="url(#sunGlow)" />
            {/* Traditional Mandap Pillars & Royal Arch */}
            <path
              d="M 50 280 L 50 90 Q 200 20 350 90 L 350 280"
              fill="none"
              stroke="url(#goldArch)"
              strokeWidth="4"
              opacity="0.85"
            />
            <path
              d="M 70 280 L 70 100 Q 200 40 330 100 L 330 280"
              fill="none"
              stroke="url(#goldArch)"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            {/* Hanging Marigold Garlands */}
            {[80, 120, 160, 200, 240, 280, 320].map((x, i) => (
              <g key={i}>
                <line x1={x} y1="70" x2={x} y2={100 + (i % 3) * 15} stroke="#F59E0B" strokeWidth="2" strokeDasharray="3,3" />
                <circle cx={x} cy={100 + (i % 3) * 15} r="6" fill="#F59E0B" />
                <circle cx={x} cy={100 + (i % 3) * 15} r="3" fill="#FDE047" />
              </g>
            ))}
            {/* Sacred Kalash in Center */}
            <g transform="translate(200, 190)">
              <circle cx="0" cy="10" r="28" fill="#F59E0B" opacity="0.9" />
              <ellipse cx="0" cy="-12" rx="16" ry="6" fill="#FDE047" />
              {/* Mango leaves */}
              <path d="M 0 -12 Q -15 -35 -25 -25 Q -10 -15 0 -12" fill="#10B981" />
              <path d="M 0 -12 Q 15 -35 25 -25 Q 10 -15 0 -12" fill="#10B981" />
              <path d="M 0 -12 Q 0 -40 0 -45 Q 5 -25 0 -12" fill="#059669" />
              <circle cx="0" cy="-28" r="10" fill="#78350F" />
            </g>
          </svg>
        );

      // ─── 2. WEDDING: BLUSH ROMANCE ─────────────────────────────────────────
      case 'wedding-blush-romance':
      case 'engagement-rings-roses':
        return (
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="blushBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2E0818" />
                <stop offset="50%" stopColor="#4A1228" />
                <stop offset="100%" stopColor="#12030A" />
              </linearGradient>
              <radialGradient id="roseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(244,114,182,0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill="url(#blushBg)" />
            <circle cx="200" cy="140" r="120" fill="url(#roseGlow)" />
            {/* Interlocking Diamond Rings */}
            <g transform="translate(200, 130)">
              {/* Left Ring */}
              <ellipse cx="-20" cy="0" rx="36" ry="36" fill="none" stroke="#FDE68A" strokeWidth="4.5" />
              {/* Right Ring */}
              <ellipse cx="20" cy="0" rx="36" ry="36" fill="none" stroke="#F472B6" strokeWidth="4.5" />
              {/* Sparkling Diamond */}
              <polygon points="20,-42 28,-34 20,-26 12,-34" fill="#FFFFFF" />
              <circle cx="20" cy="-34" r="14" fill="rgba(255,255,255,0.4)" />
              <circle cx="-25" cy="-25" r="3" fill="#FDE68A" />
              <circle cx="45" cy="25" r="2.5" fill="#F472B6" />
            </g>
            {/* Floral Rose Garland Arc */}
            <path d="M 60 220 Q 200 270 340 220" fill="none" stroke="#F472B6" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
          </svg>
        );

      // ─── 3. WEDDING: EMERALD PALACE ───────────────────────────────────────
      case 'wedding-emerald-palace':
        return (
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="emeraldBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#042F24" />
                <stop offset="50%" stopColor="#021E17" />
                <stop offset="100%" stopColor="#010D0A" />
              </linearGradient>
              <radialGradient id="emeraldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(52,211,153,0.35)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill="url(#emeraldBg)" />
            <circle cx="200" cy="140" r="130" fill="url(#emeraldGlow)" />
            {/* Mughal Jharokha Arch */}
            <path
              d="M 80 270 L 80 120 C 80 70, 150 40, 200 20 C 250 40, 320 70, 320 120 L 320 270"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="3.5"
            />
            {/* Peacock Feather Emblem */}
            <g transform="translate(200, 145)">
              <ellipse cx="0" cy="0" rx="30" ry="45" fill="#047857" stroke="#FBBF24" strokeWidth="2" />
              <ellipse cx="0" cy="5" rx="18" ry="28" fill="#065F46" />
              <ellipse cx="0" cy="10" rx="10" ry="16" fill="#1D4ED8" />
              <circle cx="0" cy="12" r="5" fill="#FBBF24" />
            </g>
          </svg>
        );

      // ─── 4. MUNDAN: SACRED BEGINNINGS ─────────────────────────────────────
      case 'mundan-sacred-beginnings':
      case 'housewarming-griha-pravesh':
      case 'festival-diwali-splendor':
        return (
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="sacredBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3A0815" />
                <stop offset="60%" stopColor="#20040B" />
                <stop offset="100%" stopColor="#0D0104" />
              </linearGradient>
              <radialGradient id="diyaGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(245,158,11,0.6)" />
                <stop offset="50%" stopColor="rgba(217,119,6,0.2)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill="url(#sacredBg)" />
            <circle cx="200" cy="150" r="140" fill="url(#diyaGlow)" />
            {/* Sacred Lotus Blossom */}
            <g transform="translate(200, 165)">
              {/* Lotus Petals */}
              <path d="M 0 0 C -40 -30, -60 10, 0 30 C 60 10, 40 -30, 0 0" fill="#F59E0B" opacity="0.8" />
              <path d="M 0 0 C -30 -40, -10 -60, 0 -30 C 10 -60, 30 -40, 0 0" fill="#FBBF24" opacity="0.9" />
              <path d="M 0 5 C -20 -15, -45 -10, -35 15 C -20 25, 0 15, 0 5" fill="#D97706" />
              <path d="M 0 5 C 20 -15, 45 -10, 35 15 C 20 25, 0 15, 0 5" fill="#D97706" />
              {/* Golden Brass Diya Base */}
              <path d="M -30 25 Q 0 45 30 25 Q 20 15 0 18 Q -20 15 -30 25" fill="#FDE047" stroke="#B45309" strokeWidth="1.5" />
              {/* Glowing Diya Flame */}
              <path d="M 0 18 Q -10 -5 0 -22 Q 10 -5 0 18" fill="#FFF7CC" filter="drop-shadow(0 0 10px #F59E0B)" />
            </g>
          </svg>
        );

      // ─── 5. BIRTHDAY: CELEBRATION BURST ───────────────────────────────────
      case 'birthday-celebration-burst':
      case 'birthday-kids-wonderland':
        return (
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="partyBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#250B48" />
                <stop offset="50%" stopColor="#3B1273" />
                <stop offset="100%" stopColor="#100322" />
              </linearGradient>
              <radialGradient id="partyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(251,191,36,0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill="url(#partyBg)" />
            <circle cx="200" cy="140" r="130" fill="url(#partyGlow)" />
            {/* 3-Tier Birthday Cake with Candles */}
            <g transform="translate(200, 185)">
              {/* Bottom Tier */}
              <rect x="-60" y="-10" width="120" height="36" rx="6" fill="#6D28D9" stroke="#FDE047" strokeWidth="2" />
              {/* Mid Tier */}
              <rect x="-42" y="-40" width="84" height="30" rx="5" fill="#8B5CF6" stroke="#FDE047" strokeWidth="2" />
              {/* Top Tier */}
              <rect x="-26" y="-64" width="52" height="24" rx="4" fill="#D946EF" stroke="#FDE047" strokeWidth="2" />
              {/* 3 Candles */}
              {[-16, 0, 16].map((cx, idx) => (
                <g key={idx}>
                  <rect x={cx - 2} y="-80" width="4" height="16" fill="#FDE047" />
                  <path d={`M ${cx} -80 Q ${cx - 4} -90 ${cx} -96 Q ${cx + 4} -90 ${cx} -80`} fill="#FFF7CC" />
                </g>
              ))}
            </g>
            {/* Balloons & Confetti Sparkles */}
            <g transform="translate(90, 80)">
              <ellipse cx="0" cy="0" rx="20" ry="26" fill="#EC4899" />
              <path d="M 0 26 Q -4 45 6 65" fill="none" stroke="#F472B6" strokeWidth="1.5" />
            </g>
            <g transform="translate(310, 75)">
              <ellipse cx="0" cy="0" rx="22" ry="28" fill="#3B82F6" />
              <path d="M 0 28 Q 6 48 -4 68" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
            </g>
            {/* Floating Stars */}
            <polygon points="120,40 123,48 131,48 125,54 127,62 120,57 113,62 115,54 109,48 117,48" fill="#FBBF24" />
            <polygon points="280,45 282,51 288,51 283,55 285,61 280,57 275,61 277,55 272,51 278,51" fill="#F472B6" />
          </svg>
        );

      // ─── 6. CORPORATE: MODERN PROFESSIONAL SUMMIT ─────────────────────────
      case 'corporate-modern-professional':
      case 'corporate-achievement-platinum':
        return (
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="corpBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B132B" />
                <stop offset="60%" stopColor="#070B19" />
                <stop offset="100%" stopColor="#03050C" />
              </linearGradient>
              <radialGradient id="corpGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.3)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill="url(#corpBg)" />
            <circle cx="200" cy="140" r="140" fill="url(#corpGlow)" />
            {/* Modern Architectural Stage Beams */}
            <path d="M 40 280 L 170 80 L 230 80 L 360 280" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.4" />
            <path d="M 80 280 L 180 120 L 220 120 L 320 280" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.6" />
            {/* Geometric Summit Prism Emblem */}
            <g transform="translate(200, 140)">
              <polygon points="0,-45 40,-15 40,35 0,60 -40,35 -40,-15" fill="none" stroke="#F59E0B" strokeWidth="3" />
              <polygon points="0,-30 26,-10 26,24 0,40 -26,24 -26,-10" fill="rgba(30,58,138,0.7)" stroke="#60A5FA" strokeWidth="1.5" />
              <circle cx="0" cy="5" r="8" fill="#FDE047" />
            </g>
          </svg>
        );

      // ─── DEFAULT / UNIVERSAL CELEBRATION ─────────────────────────────────
      default:
        return (
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="univBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1E0E2C" />
                <stop offset="50%" stopColor="#34144B" />
                <stop offset="100%" stopColor="#0B0311" />
              </linearGradient>
              <radialGradient id="univGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,215,0,0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill="url(#univBg)" />
            <circle cx="200" cy="140" r="130" fill="url(#univGlow)" />
            {/* Universal Golden Laurel & Celebration Crest */}
            <g transform="translate(200, 140)">
              <circle cx="0" cy="0" rx="42" ry="42" fill="none" stroke="#FFD700" strokeWidth="3" />
              <circle cx="0" cy="0" rx="34" ry="34" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="4,4" />
              <polygon points="0,-18 5,-5 18,-5 8,4 12,17 0,9 -12,17 -8,4 -18,-5 -5,-5" fill="#FFE58F" />
            </g>
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl flex flex-col justify-between p-4 sm:p-5 select-none transition-all duration-500 ${className}`}
      style={{
        backgroundColor: colorPalette.canvasBg,
        boxShadow: `0 12px 35px -5px ${colorPalette.primary}66, inset 0 1px 0 rgba(255,255,255,0.2)`,
        border: `1.5px solid ${colorPalette.borderAccent}`,
      }}
    >
      {/* 1. Underlying Vector Artwork Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-90 transition-transform duration-700 group-hover:scale-105">
        {renderCelebrationArtwork()}
      </div>

      {/* 2. Gradient Overlay for Perfect Typography Readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.4) 45%, ${colorPalette.canvasBg}F0 100%)`,
        }}
      />

      {/* 3. Top Header: Sacred Shloka or Theme Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest backdrop-blur-md border shadow-sm flex items-center gap-1"
          style={{
            backgroundColor: colorPalette.badgeBg,
            color: colorPalette.badgeText,
            borderColor: colorPalette.borderSoft,
          }}
        >
          <span>{theme.badgeIcon}</span>
          <span>{theme.badgeLabel}</span>
        </span>

        {hindiTitle && (
          <span
            className="text-[11px] font-serif font-bold tracking-wider drop-shadow"
            style={{ color: colorPalette.accent }}
          >
            {hindiTitle}
          </span>
        )}
      </div>

      {/* 4. Center Typography: Actual Celebrant / Couple Title */}
      <div className="relative z-10 text-center my-auto py-4 space-y-1">
        <h4
          className={`text-xl sm:text-2xl font-extrabold tracking-wide drop-shadow-md truncate ${typography}`}
          style={{
            color: colorPalette.textHeading,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          {title}
        </h4>
        <p
          className="text-xs font-serif italic line-clamp-1 drop-shadow"
          style={{ color: colorPalette.textBody }}
        >
          {theme.tagline}
        </p>
      </div>

      {/* 5. Bottom Metadata Pill: Date & Venue */}
      <div className="relative z-10 flex items-center justify-between gap-2 text-[10px] font-mono backdrop-blur-md py-1.5 px-3 rounded-xl border border-white/10 bg-black/40 text-slate-200">
        <span className="truncate">🗓️ {dateStr}</span>
        <span>•</span>
        <span className="truncate max-w-[120px]">📍 {venueName}</span>
      </div>
    </div>
  );
};
