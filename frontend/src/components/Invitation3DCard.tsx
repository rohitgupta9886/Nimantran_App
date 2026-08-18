import React, { useState, useRef } from 'react';
import { CelebrationTheme } from '../utils/themeCatalog';

interface Invitation3DCardProps {
  theme: CelebrationTheme;
  title: string;
  hindiTitle?: string;
  dateStr?: string;
  venueName?: string;
  venueAddress?: string;
  hostName?: string;
  className?: string;
  interactiveTilt?: boolean;
}

export const Invitation3DCard: React.FC<Invitation3DCardProps> = ({
  theme,
  title,
  hindiTitle,
  dateStr,
  venueName,
  venueAddress,
  hostName,
  className = '',
  interactiveTilt = true,
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -10; // Max 10 deg
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const { colorPalette, mode, typography } = theme;
  const isLight = mode === 'light' || mode === 'pastel';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full rounded-2xl transition-transform duration-200 ease-out select-none ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 3D Physical Paper Card Shell */}
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between p-4 sm:p-5"
        style={{
          backgroundColor: colorPalette.canvasBg,
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          boxShadow: isHovered
            ? isLight
              ? '0 25px 50px -12px rgba(139, 92, 246, 0.25), 0 0 25px rgba(245, 158, 11, 0.3), inset 0 0 0 1px rgba(255,255,255,0.8)'
              : `0 30px 60px -15px ${colorPalette.primary}90, 0 0 35px ${colorPalette.borderAccent}50, inset 0 0 0 1px rgba(255,255,255,0.15)`
            : isLight
            ? '0 10px 25px -5px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.05)'
            : '0 15px 35px -8px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* Layer 1: Metallic Foil Outer & Inner Border */}
        <div
          className="absolute inset-2 sm:inset-2.5 rounded-xl pointer-events-none border"
          style={{
            borderColor: colorPalette.borderAccent,
            boxShadow: `inset 0 0 0 1px ${colorPalette.borderSoft}`,
            opacity: 0.85,
          }}
        />

        {/* Ornate Corner Accents */}
        <div
          className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 pointer-events-none"
          style={{ borderColor: colorPalette.borderAccent }}
        />
        <div
          className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 pointer-events-none"
          style={{ borderColor: colorPalette.borderAccent }}
        />
        <div
          className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 pointer-events-none"
          style={{ borderColor: colorPalette.borderAccent }}
        />
        <div
          className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 pointer-events-none"
          style={{ borderColor: colorPalette.borderAccent }}
        />

        {/* Layer 2: Interactive Specular Lighting Sheen */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, transparent 65%)`,
          }}
        />

        {/* Layer 3: Event-Specific Vector Artwork Motifs */}
        <div className="relative z-10 w-full flex items-center justify-between px-1">
          {/* Shloka / Vedic Blessing Header */}
          <span
            className="text-[11px] sm:text-xs font-serif font-bold tracking-widest block truncate max-w-[200px]"
            style={{ color: colorPalette.accent }}
          >
            {hindiTitle || (theme.celebrationType === 'WEDDING' || theme.celebrationType === 'MUNDAN' ? '|| श्री गणेशाय नमः ||' : '✦ INVITATION ✦')}
          </span>

          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider border"
            style={{
              backgroundColor: colorPalette.badgeBg,
              color: colorPalette.badgeText,
              borderColor: colorPalette.borderSoft,
            }}
          >
            {theme.badgeLabel}
          </span>
        </div>

        {/* Center Artwork Stage: Dynamic Motifs tailored to event */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center space-y-2 px-3 py-1">
          {/* Custom SVG Center Motif by Celebration Type */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative">
            {theme.celebrationType === 'WEDDING' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Royal Mandap Pillars & Kalash */}
                <path d="M50 12 L30 35 L70 35 Z" fill={colorPalette.borderAccent} />
                <circle cx="50" cy="10" r="4" fill="#F59E0B" />
                <rect x="32" y="35" width="6" height="42" rx="2" fill={colorPalette.borderAccent} />
                <rect x="62" y="35" width="6" height="42" rx="2" fill={colorPalette.borderAccent} />
                <path d="M30 45 Q50 60 70 45" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
                <path d="M42 62 Q50 52 58 62" fill="none" stroke="#F43F5E" strokeWidth="2" />
                <circle cx="50" cy="68" r="5" fill="#F59E0B" />
              </svg>
            )}

            {theme.celebrationType === 'ENGAGEMENT' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Interlocking Diamond Rings */}
                <circle cx="40" cy="52" r="22" fill="none" stroke={colorPalette.borderAccent} strokeWidth="4" />
                <circle cx="60" cy="52" r="22" fill="none" stroke="#F59E0B" strokeWidth="4" />
                <polygon points="40,24 45,30 40,36 35,30" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1.5" />
                <polygon points="60,24 65,30 60,36 55,30" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.5" />
              </svg>
            )}

            {theme.celebrationType === 'HALDI' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Marigold Flower & Turmeric Urli */}
                <circle cx="50" cy="50" r="14" fill="#D97706" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <circle
                    key={i}
                    cx={50 + 22 * Math.cos((angle * Math.PI) / 180)}
                    cy={50 + 22 * Math.sin((angle * Math.PI) / 180)}
                    r="9"
                    fill={i % 2 === 0 ? '#F59E0B' : '#FBBF24'}
                  />
                ))}
                <circle cx="50" cy="50" r="7" fill="#FEF3C7" />
              </svg>
            )}

            {theme.celebrationType === 'MEHNDI' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Henna Peacock Motif */}
                <path d="M50 20 C35 35 35 65 50 80 C65 65 65 35 50 20 Z" fill="none" stroke={colorPalette.borderAccent} strokeWidth="3" />
                <circle cx="50" cy="50" r="10" fill={colorPalette.primary} />
                <circle cx="50" cy="50" r="4" fill="#F59E0B" />
                <path d="M50 32 Q58 42 50 50 Q42 58 50 68" fill="none" stroke="#F59E0B" strokeWidth="2" />
              </svg>
            )}

            {theme.celebrationType === 'SANGEET' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Spotlight & Musical Soundwaves */}
                <path d="M30 75 L45 25 L55 25 L70 75 Z" fill="url(#sangeetSpotlight)" opacity="0.6" />
                <circle cx="50" cy="25" r="8" fill="#F59E0B" />
                <path d="M35 55 Q50 40 65 55" fill="none" stroke="#C084FC" strokeWidth="3" />
                <path d="M30 65 Q50 50 70 65" fill="none" stroke="#F59E0B" strokeWidth="3" />
                <defs>
                  <linearGradient id="sangeetSpotlight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
            )}

            {(theme.celebrationType === 'MUNDAN' || theme.celebrationType === 'HOUSEWARMING' || theme.celebrationType === 'FESTIVAL') && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Holy Diya & Lotus Petals */}
                <path d="M50 15 Q58 35 50 45 Q42 35 50 15 Z" fill="#F59E0B" />
                <circle cx="50" cy="30" r="3" fill="#FEF3C7" />
                <path d="M25 55 Q50 75 75 55 Q70 70 50 70 Q30 70 25 55 Z" fill={colorPalette.borderAccent} />
                <path d="M20 70 Q50 85 80 70" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
              </svg>
            )}

            {theme.celebrationType === 'BABY_SHOWER' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Crescent Moon & Nursery Stars */}
                <path d="M55 20 A30 30 0 1 0 75 70 A25 25 0 1 1 55 20 Z" fill="#FBBF24" />
                <polygon points="70,30 73,38 81,38 75,43 77,51 70,46 63,51 65,43 59,38 67,38" fill="#EC4899" />
                <circle cx="35" cy="40" r="3" fill="#FFFFFF" />
              </svg>
            )}

            {theme.celebrationType === 'BIRTHDAY' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* 3-Tier Birthday Cake & Candles */}
                <rect x="25" y="58" width="50" height="20" rx="3" fill={colorPalette.primary} stroke={colorPalette.borderAccent} strokeWidth="1.5" />
                <rect x="35" y="42" width="30" height="16" rx="2" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
                <rect x="44" y="30" width="12" height="12" rx="1" fill="#EC4899" />
                <rect x="48" y="20" width="4" height="10" fill="#FBBF24" />
                <path d="M50 12 Q54 16 50 20 Q46 16 50 12 Z" fill="#EF4444" />
              </svg>
            )}

            {theme.celebrationType === 'CORPORATE' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Modern Geometric Prisms & Tech Skyline */}
                <polygon points="50,15 80,75 20,75" fill="none" stroke={colorPalette.borderAccent} strokeWidth="3" />
                <polygon points="50,30 70,70 30,70" fill={colorPalette.primary} opacity="0.7" />
                <circle cx="50" cy="50" r="5" fill="#38BDF8" />
              </svg>
            )}

            {theme.celebrationType === 'GRADUATION' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Mortarboard Cap & Ribbon Scroll */}
                <polygon points="50,25 85,42 50,55 15,42" fill={colorPalette.borderAccent} />
                <rect x="35" y="52" width="30" height="15" rx="2" fill="#1E3A8A" />
                <path d="M85 42 L85 65" stroke="#F59E0B" strokeWidth="3" />
                <circle cx="85" cy="68" r="4" fill="#F59E0B" />
              </svg>
            )}

            {theme.celebrationType === 'OTHER' && (
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Radiant Starburst */}
                <circle cx="50" cy="50" r="10" fill={colorPalette.primary} />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                  <line
                    key={i}
                    x1={50 + 16 * Math.cos((angle * Math.PI) / 180)}
                    y1={50 + 16 * Math.sin((angle * Math.PI) / 180)}
                    x2={50 + 26 * Math.cos((angle * Math.PI) / 180)}
                    y2={50 + 26 * Math.sin((angle * Math.PI) / 180)}
                    stroke={i % 2 === 0 ? colorPalette.borderAccent : '#F59E0B'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                ))}
              </svg>
            )}
          </div>

          {/* Dynamic Event / Couple Title */}
          <h4
            className={`text-lg sm:text-xl font-bold tracking-wide drop-shadow-md truncate max-w-full px-2 ${typography}`}
            style={{ color: colorPalette.textHeading }}
          >
            {title || 'Priyanka & Rohit'}
          </h4>

          {/* Date & Time Pill */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border backdrop-blur-sm shadow-sm"
            style={{
              backgroundColor: colorPalette.surfaceElevated,
              borderColor: colorPalette.borderSoft,
              color: colorPalette.textBody,
            }}
          >
            <span>🗓️</span>
            <span>{dateStr || '18 Dec 2026'}</span>
          </div>

          {/* Venue */}
          <p
            className="text-[10px] font-mono truncate max-w-[240px] opacity-80"
            style={{ color: colorPalette.textMuted }}
          >
            📍 {venueName || 'The Taj Palace'}
          </p>
        </div>

        {/* Bottom Decorative Footer Foil */}
        <div className="relative z-10 flex items-center justify-between pt-1 border-t border-dashed" style={{ borderColor: colorPalette.borderSoft }}>
          <span className="text-[10px] font-serif italic" style={{ color: colorPalette.textMuted }}>
            {theme.style} • {theme.mode.toUpperCase()}
          </span>
          <span className="text-[10px] font-mono font-bold" style={{ color: colorPalette.borderAccent }}>
            NIMANTRAN 3D
          </span>
        </div>
      </div>
    </div>
  );
};
