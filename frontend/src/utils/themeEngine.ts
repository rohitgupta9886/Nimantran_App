/**
 * Nimantran AI — Master Theme Engine
 * Provides comprehensive theme tokens, color palettes, particles, and typography
 * across Romantic, Royal, Traditional, Modern, Floral, Corporate, Baby & Birthday occasions.
 */

export interface ThemeTokens {
  id: string;
  name: string;
  category: string;
  categoryTag: 'ROMANTIC' | 'ROYAL' | 'TRADITIONAL' | 'MODERN' | 'FLORAL' | 'CORPORATE' | 'BABY' | 'FESTIVE' | 'BIRTHDAY';
  canvasBg: string;
  surfaceBg: string;
  surfaceElevated: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  textHeading: string;
  textBody: string;
  textMuted: string;
  borderSoft: string;
  borderAccent: string;
  gradientHeader: string;
  badgeBg: string;
  badgeText: string;
  bgTextureClass?: string;
}

export interface EventThemeConfig {
  themeId: string;
  themeName: string;
  cardBgGradient: string;
  headerGoldGradient: string;
  goldBorderClass: string;
  accentBadgeClass: string;
  coverImageUrl?: string;
  cardBorder?: string;
  fontFamilyClass?: string;
  overlayGradient?: string;
  badgeText?: string;
  headingFontClass?: string;
  previewThumbnail?: string;
  bestForOccasions: string[];
}

export interface EventThemeProfile {
  typeKey: 'WEDDING' | 'MUNDAN' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CORPORATE' | 'GENERAL';
  themeId: string;
  displayName: string;
  paletteLabel: string;
  colorPalette: {
    canvasBg: string;
    surfaceBg: string;
    primary: string;
    primaryHover: string;
    accent: string;
    accentSoft: string;
    textHeading: string;
    textBody: string;
    borderSoft: string;
    borderAccent: string;
    badgeBg: string;
    badgeText: string;
  };
  giftBox: {
    boxBg: string;
    ribbonBg: string;
    borderColor: string;
    boxShadow: string;
    centerEmblemIcon: string;
    heartOrEmblemColor: string;
    lidBg: string;
  };
  particleSystem: {
    emojis: string[];
    confettiColors: string[];
    particleType: 'ROSE_PETALS_HEARTS' | 'MARIGOLD_PETALS_DIYAS' | 'CONFETTI_BALLOONS' | 'GOLD_SPARKLES_EMERALD' | 'GEOMETRIC_TECH_STREAKS';
    rainLabel: string;
  };
  bookCard: {
    bookBg: string;
    bookBorder: string;
    textColor: string;
    accentColor: string;
    headerSymbol: string;
    badgeBg: string;
    badgeText: string;
    spineColor: string;
    sacredHeader: string;
    headerTitle: string;
    defaultGreeting: string;
  };
  audio: {
    boomFrequency: number;
    soundLabel: string;
  };
}

export const CELEBRATION_THEMES: Record<string, ThemeTokens> = {
  // ─── 1. ROMANTIC FAMILIES ──────────────────────────────────────────────────
  'romantic-blush': {
    id: 'romantic-blush',
    name: 'Romantic Blush Navy',
    category: 'Weddings & Anniversaries',
    categoryTag: 'ROMANTIC',
    canvasBg: '#0A1128',
    surfaceBg: 'rgba(15, 23, 42, 0.92)',
    surfaceElevated: 'rgba(26, 37, 66, 0.95)',
    primary: '#7E223B',
    primaryHover: '#63182C',
    primaryText: '#FFFFFF',
    accent: '#FFD700',
    accentSoft: 'rgba(255, 215, 0, 0.15)',
    textHeading: '#FFF8E7',
    textBody: '#E2E8F0',
    textMuted: '#94A3B8',
    borderSoft: 'rgba(255, 215, 0, 0.25)',
    borderAccent: 'rgba(255, 215, 0, 0.65)',
    gradientHeader: 'linear-gradient(135deg, #FFF8E7 0%, #FFD700 60%, #C9AA78 100%)',
    badgeBg: 'rgba(255, 215, 0, 0.15)',
    badgeText: '#FFD700',
  },
  'blush-love': {
    id: 'blush-love',
    name: 'Blush Rose & Champagne',
    category: 'Engagements & Proposals',
    categoryTag: 'ROMANTIC',
    canvasBg: '#0D0814',
    surfaceBg: 'rgba(28, 14, 26, 0.92)',
    surfaceElevated: 'rgba(48, 20, 44, 0.95)',
    primary: '#9D174D',
    primaryHover: '#831843',
    primaryText: '#FFFFFF',
    accent: '#F472B6',
    accentSoft: 'rgba(244, 114, 182, 0.15)',
    textHeading: '#FDF2F8',
    textBody: '#FCE7F3',
    textMuted: '#F472B6',
    borderSoft: 'rgba(244, 114, 182, 0.3)',
    borderAccent: '#F472B6',
    gradientHeader: 'linear-gradient(135deg, #FFF1F2 0%, #F472B6 60%, #BE185D 100%)',
    badgeBg: 'rgba(244, 114, 182, 0.2)',
    badgeText: '#FBCFE8',
  },
  'champagne-romance': {
    id: 'champagne-romance',
    name: 'Champagne & Ivory Romance',
    category: 'Receptions & Anniversaries',
    categoryTag: 'ROMANTIC',
    canvasBg: '#0C0A08',
    surfaceBg: 'rgba(26, 22, 18, 0.92)',
    surfaceElevated: 'rgba(45, 38, 30, 0.95)',
    primary: '#B45309',
    primaryHover: '#92400E',
    primaryText: '#FFFFFF',
    accent: '#FDE68A',
    accentSoft: 'rgba(253, 230, 138, 0.15)',
    textHeading: '#FFFBEB',
    textBody: '#FEF3C7',
    textMuted: '#D97706',
    borderSoft: 'rgba(253, 230, 138, 0.3)',
    borderAccent: '#FDE68A',
    gradientHeader: 'linear-gradient(135deg, #FFFFFF 0%, #FDE68A 50%, #D97706 100%)',
    badgeBg: 'rgba(253, 230, 138, 0.2)',
    badgeText: '#FDE68A',
  },
  'sunset-romance': {
    id: 'sunset-romance',
    name: 'Sunset Rose & Amber',
    category: 'Intimate Weddings & Dinners',
    categoryTag: 'ROMANTIC',
    canvasBg: '#0F0608',
    surfaceBg: 'rgba(30, 12, 16, 0.92)',
    surfaceElevated: 'rgba(55, 20, 28, 0.95)',
    primary: '#E11D48',
    primaryHover: '#BE123C',
    primaryText: '#FFFFFF',
    accent: '#FB923C',
    accentSoft: 'rgba(251, 146, 60, 0.15)',
    textHeading: '#FFF1F2',
    textBody: '#FFE4E6',
    textMuted: '#FDA4AF',
    borderSoft: 'rgba(251, 146, 60, 0.3)',
    borderAccent: '#FB923C',
    gradientHeader: 'linear-gradient(135deg, #FFF1F2 0%, #FB923C 50%, #E11D48 100%)',
    badgeBg: 'rgba(251, 146, 60, 0.2)',
    badgeText: '#FED7AA',
  },
  'burgundy-velvet': {
    id: 'burgundy-velvet',
    name: 'Burgundy Velvet Gold',
    category: 'Royal Vivah & Sangeet',
    categoryTag: 'ROMANTIC',
    canvasBg: '#0B0205',
    surfaceBg: 'rgba(28, 6, 14, 0.92)',
    surfaceElevated: 'rgba(56, 11, 27, 0.95)',
    primary: '#881337',
    primaryHover: '#700D2B',
    primaryText: '#FFFFFF',
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.15)',
    textHeading: '#FFF8E7',
    textBody: '#FCE7F3',
    textMuted: '#FDA4AF',
    borderSoft: 'rgba(245, 158, 11, 0.3)',
    borderAccent: '#F59E0B',
    gradientHeader: 'linear-gradient(135deg, #FFF8E7 0%, #F59E0B 60%, #881337 100%)',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#FBBF24',
  },

  // ─── 2. ROYAL FAMILIES ─────────────────────────────────────────────────────
  'royal-palace': {
    id: 'royal-palace',
    name: 'Royal Palace Gold',
    category: 'Royal Weddings & Receptions',
    categoryTag: 'ROYAL',
    canvasBg: '#0A1128',
    surfaceBg: 'rgba(15, 23, 42, 0.94)',
    surfaceElevated: 'rgba(26, 37, 66, 0.96)',
    primary: '#1E3A8A',
    primaryHover: '#172554',
    primaryText: '#FFFFFF',
    accent: '#FFD700',
    accentSoft: 'rgba(255, 215, 0, 0.2)',
    textHeading: '#FFF8E7',
    textBody: '#E2E8F0',
    textMuted: '#94A3B8',
    borderSoft: 'rgba(255, 215, 0, 0.35)',
    borderAccent: '#FFD700',
    gradientHeader: 'linear-gradient(135deg, #FFF8E7 0%, #FFD700 50%, #C9AA78 100%)',
    badgeBg: 'rgba(255, 215, 0, 0.2)',
    badgeText: '#FFD700',
  },
  'maharaja-gold': {
    id: 'maharaja-gold',
    name: 'Maharaja Heritage Gold',
    category: 'Grand Royal Galas & Vivah',
    categoryTag: 'ROYAL',
    canvasBg: '#0E0902',
    surfaceBg: 'rgba(28, 18, 5, 0.94)',
    surfaceElevated: 'rgba(54, 35, 10, 0.96)',
    primary: '#92400E',
    primaryHover: '#78350F',
    primaryText: '#FFFFFF',
    accent: '#FBBF24',
    accentSoft: 'rgba(251, 191, 36, 0.2)',
    textHeading: '#FEF3C7',
    textBody: '#FDE68A',
    textMuted: '#D97706',
    borderSoft: 'rgba(251, 191, 36, 0.35)',
    borderAccent: '#FBBF24',
    gradientHeader: 'linear-gradient(135deg, #FFFBEB 0%, #FBBF24 50%, #92400E 100%)',
    badgeBg: 'rgba(251, 191, 36, 0.25)',
    badgeText: '#FBBF24',
  },
  'peacock-emerald': {
    id: 'peacock-emerald',
    name: 'Royal Peacock Emerald',
    category: 'Grand Receptions & Jubilees',
    categoryTag: 'ROYAL',
    canvasBg: '#011A13',
    surfaceBg: 'rgba(3, 44, 32, 0.94)',
    surfaceElevated: 'rgba(6, 78, 59, 0.96)',
    primary: '#059669',
    primaryHover: '#047857',
    primaryText: '#FFFFFF',
    accent: '#FBBF24',
    accentSoft: 'rgba(251, 191, 36, 0.2)',
    textHeading: '#ECFDF5',
    textBody: '#A7F3D0',
    textMuted: '#6EE7B7',
    borderSoft: 'rgba(251, 191, 36, 0.3)',
    borderAccent: '#FBBF24',
    gradientHeader: 'linear-gradient(135deg, #ECFDF5 0%, #FBBF24 50%, #059669 100%)',
    badgeBg: 'rgba(251, 191, 36, 0.2)',
    badgeText: '#FBBF24',
  },

  // ─── 3. TRADITIONAL & RELIGIOUS FAMILIES ──────────────────────────────────
  'traditional-mandala': {
    id: 'traditional-mandala',
    name: 'Sacred Mandala & Vermilion',
    category: 'Pujas, Mundan & Katha',
    categoryTag: 'TRADITIONAL',
    canvasBg: '#0F0308',
    surfaceBg: 'rgba(26, 6, 14, 0.94)',
    surfaceElevated: 'rgba(56, 11, 27, 0.96)',
    primary: '#7E223B',
    primaryHover: '#63182C',
    primaryText: '#FFFFFF',
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.2)',
    textHeading: '#FFF8E7',
    textBody: '#EAD7BD',
    textMuted: '#C9AA78',
    borderSoft: 'rgba(245, 158, 11, 0.3)',
    borderAccent: '#F59E0B',
    gradientHeader: 'linear-gradient(135deg, #FFF8E7 0%, #F59E0B 50%, #7E223B 100%)',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#F59E0B',
  },
  'festive-gold': {
    id: 'festive-gold',
    name: 'Festive Diya Gold',
    category: 'Diwali, Griha Pravesh & Utsav',
    categoryTag: 'FESTIVE',
    canvasBg: '#0E0802',
    surfaceBg: 'rgba(30, 16, 4, 0.94)',
    surfaceElevated: 'rgba(58, 30, 8, 0.96)',
    primary: '#D97706',
    primaryHover: '#B45309',
    primaryText: '#FFFFFF',
    accent: '#FDE047',
    accentSoft: 'rgba(253, 224, 71, 0.2)',
    textHeading: '#FEF9C3',
    textBody: '#FEF08A',
    textMuted: '#CA8A04',
    borderSoft: 'rgba(253, 224, 71, 0.3)',
    borderAccent: '#FDE047',
    gradientHeader: 'linear-gradient(135deg, #FEF9C3 0%, #FDE047 50%, #D97706 100%)',
    badgeBg: 'rgba(253, 224, 71, 0.2)',
    badgeText: '#FEF08A',
  },
  'marigold-sunshine': {
    id: 'marigold-sunshine',
    name: 'Marigold Sunshine',
    category: 'Haldi, Mehndi & Sangeet',
    categoryTag: 'TRADITIONAL',
    canvasBg: '#0F0A02',
    surfaceBg: 'rgba(32, 20, 4, 0.94)',
    surfaceElevated: 'rgba(64, 38, 8, 0.96)',
    primary: '#B45309',
    primaryHover: '#92400E',
    primaryText: '#FFFFFF',
    accent: '#FACC15',
    accentSoft: 'rgba(250, 204, 21, 0.2)',
    textHeading: '#FEF9C3',
    textBody: '#FEF08A',
    textMuted: '#EAB308',
    borderSoft: 'rgba(250, 204, 21, 0.35)',
    borderAccent: '#FACC15',
    gradientHeader: 'linear-gradient(135deg, #FEF9C3 0%, #FACC15 50%, #B45309 100%)',
    badgeBg: 'rgba(250, 204, 21, 0.2)',
    badgeText: '#FDE047',
  },

  // ─── 4. MODERN & MINIMAL FAMILIES ──────────────────────────────────────────
  'minimal-luxury': {
    id: 'minimal-luxury',
    name: 'Minimal Luxury Platinum',
    category: 'Conferences, Anniversaries & Dinners',
    categoryTag: 'MODERN',
    canvasBg: '#090B10',
    surfaceBg: 'rgba(15, 20, 30, 0.94)',
    surfaceElevated: 'rgba(25, 33, 49, 0.96)',
    primary: '#334155',
    primaryHover: '#1E293B',
    primaryText: '#FFFFFF',
    accent: '#E2E8F0',
    accentSoft: 'rgba(226, 232, 240, 0.15)',
    textHeading: '#F8FAFC',
    textBody: '#CBD5E1',
    textMuted: '#94A3B8',
    borderSoft: 'rgba(226, 232, 240, 0.2)',
    borderAccent: '#CBD5E1',
    gradientHeader: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)',
    badgeBg: 'rgba(226, 232, 240, 0.15)',
    badgeText: '#F8FAFC',
  },
  'tech-modern': {
    id: 'tech-modern',
    name: 'Tech Modern Indigo',
    category: 'Product Launches & Summits',
    categoryTag: 'MODERN',
    canvasBg: '#050814',
    surfaceBg: 'rgba(10, 16, 36, 0.94)',
    surfaceElevated: 'rgba(18, 28, 64, 0.96)',
    primary: '#4338CA',
    primaryHover: '#3730A3',
    primaryText: '#FFFFFF',
    accent: '#38BDF8',
    accentSoft: 'rgba(56, 189, 248, 0.15)',
    textHeading: '#F0F9FF',
    textBody: '#BAE6FD',
    textMuted: '#7DD3FC',
    borderSoft: 'rgba(56, 189, 248, 0.25)',
    borderAccent: '#38BDF8',
    gradientHeader: 'linear-gradient(135deg, #FFFFFF 0%, #38BDF8 50%, #4338CA 100%)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeText: '#38BDF8',
  },
  'corporate-executive': {
    id: 'corporate-executive',
    name: 'Corporate Executive Gold',
    category: 'Business Galas & Convocations',
    categoryTag: 'CORPORATE',
    canvasBg: '#030712',
    surfaceBg: 'rgba(17, 24, 39, 0.94)',
    surfaceElevated: 'rgba(31, 41, 55, 0.96)',
    primary: '#1F2937',
    primaryHover: '#111827',
    primaryText: '#FFFFFF',
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.15)',
    textHeading: '#F9FAFB',
    textBody: '#E5E7EB',
    textMuted: '#9CA3AF',
    borderSoft: 'rgba(245, 158, 11, 0.25)',
    borderAccent: '#F59E0B',
    gradientHeader: 'linear-gradient(135deg, #FFFFFF 0%, #F59E0B 50%, #374151 100%)',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#FBBF24',
  },

  // ─── 5. FLORAL FAMILIES ────────────────────────────────────────────────────
  'floral-garden': {
    id: 'floral-garden',
    name: 'Rose & Jasmine Garden',
    category: 'Weddings & Garden Receptions',
    categoryTag: 'FLORAL',
    canvasBg: '#08120B',
    surfaceBg: 'rgba(14, 34, 22, 0.94)',
    surfaceElevated: 'rgba(25, 56, 36, 0.96)',
    primary: '#15803D',
    primaryHover: '#166534',
    primaryText: '#FFFFFF',
    accent: '#F472B6',
    accentSoft: 'rgba(244, 114, 182, 0.15)',
    textHeading: '#F0FDF4',
    textBody: '#DCFCE7',
    textMuted: '#86EFAC',
    borderSoft: 'rgba(244, 114, 182, 0.3)',
    borderAccent: '#F472B6',
    gradientHeader: 'linear-gradient(135deg, #F0FDF4 0%, #F472B6 50%, #15803D 100%)',
    badgeBg: 'rgba(244, 114, 182, 0.2)',
    badgeText: '#FBCFE8',
  },
  'garden-sage': {
    id: 'garden-sage',
    name: 'Garden Sage Botanical',
    category: 'Family Brunches & Baby Showers',
    categoryTag: 'FLORAL',
    canvasBg: '#05120B',
    surfaceBg: 'rgba(12, 32, 20, 0.94)',
    surfaceElevated: 'rgba(27, 48, 34, 0.96)',
    primary: '#3B6E4C',
    primaryHover: '#2A5237',
    primaryText: '#FFFFFF',
    accent: '#FFD700',
    accentSoft: 'rgba(163, 184, 167, 0.15)',
    textHeading: '#F0F7F2',
    textBody: '#C8DCD0',
    textMuted: '#8BA692',
    borderSoft: 'rgba(163, 184, 167, 0.25)',
    borderAccent: 'rgba(255, 215, 0, 0.65)',
    gradientHeader: 'linear-gradient(135deg, #F0F7F2 0%, #A3B8A7 60%, #5B7060 100%)',
    badgeBg: 'rgba(163, 184, 167, 0.15)',
    badgeText: '#A3B8A7',
  },

  // ─── 6. BABY & KIDS FAMILIES ───────────────────────────────────────────────
  'baby-pastel': {
    id: 'baby-pastel',
    name: 'Baby Clouds & Pastel Stars',
    category: 'Baby Showers, Mundan & 1st Birthdays',
    categoryTag: 'BABY',
    canvasBg: '#070E1A',
    surfaceBg: 'rgba(15, 28, 48, 0.94)',
    surfaceElevated: 'rgba(26, 46, 78, 0.96)',
    primary: '#0284C7',
    primaryHover: '#0369A1',
    primaryText: '#FFFFFF',
    accent: '#F472B6',
    accentSoft: 'rgba(244, 114, 182, 0.2)',
    textHeading: '#F0F9FF',
    textBody: '#E0F2FE',
    textMuted: '#7DD3FC',
    borderSoft: 'rgba(244, 114, 182, 0.3)',
    borderAccent: '#38BDF8',
    gradientHeader: 'linear-gradient(135deg, #F0F9FF 0%, #F472B6 50%, #38BDF8 100%)',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#BAE6FD',
  },

  // ─── 7. BIRTHDAY & PARTY FAMILIES ─────────────────────────────────────────
  'midnight-gold': {
    id: 'midnight-gold',
    name: 'Midnight Gold Starburst',
    category: 'Milestone Birthdays & Success Galas',
    categoryTag: 'BIRTHDAY',
    canvasBg: '#0A0612',
    surfaceBg: 'rgba(20, 12, 32, 0.94)',
    surfaceElevated: 'rgba(38, 24, 60, 0.96)',
    primary: '#6D28D9',
    primaryHover: '#5B21B6',
    primaryText: '#FFFFFF',
    accent: '#FBBF24',
    accentSoft: 'rgba(251, 191, 36, 0.2)',
    textHeading: '#FAF5FF',
    textBody: '#F3E8FF',
    textMuted: '#D8B4FE',
    borderSoft: 'rgba(251, 191, 36, 0.3)',
    borderAccent: '#FBBF24',
    gradientHeader: 'linear-gradient(135deg, #FAF5FF 0%, #FBBF24 50%, #6D28D9 100%)',
    badgeBg: 'rgba(251, 191, 36, 0.2)',
    badgeText: '#FDE047',
  },
  'neon-celebration': {
    id: 'neon-celebration',
    name: 'Neon Glam & Party Spark',
    category: 'Surprise Parties & Cocktail Nights',
    categoryTag: 'BIRTHDAY',
    canvasBg: '#0A0410',
    surfaceBg: 'rgba(24, 8, 36, 0.94)',
    surfaceElevated: 'rgba(46, 16, 68, 0.96)',
    primary: '#D946EF',
    primaryHover: '#C026D3',
    primaryText: '#FFFFFF',
    accent: '#06B6D4',
    accentSoft: 'rgba(6, 182, 212, 0.2)',
    textHeading: '#FDF4FF',
    textBody: '#FAE8FF',
    textMuted: '#F0ABFC',
    borderSoft: 'rgba(6, 182, 212, 0.3)',
    borderAccent: '#06B6D4',
    gradientHeader: 'linear-gradient(135deg, #FDF4FF 0%, #06B6D4 50%, #D946EF 100%)',
    badgeBg: 'rgba(6, 182, 212, 0.2)',
    badgeText: '#67E8F9',
  },
};

import { getCelebrationThemeById } from './themeCatalog';

export const getThemeTokens = (themeKey?: string): ThemeTokens => {
  if (themeKey && CELEBRATION_THEMES[themeKey]) {
    return CELEBRATION_THEMES[themeKey];
  }
  if (themeKey) {
    const catalogTheme = getCelebrationThemeById(themeKey);
    if (catalogTheme) {
      return {
        id: catalogTheme.id,
        name: catalogTheme.name,
        category: catalogTheme.tagline,
        categoryTag: catalogTheme.celebrationType as any,
        ...catalogTheme.colorPalette,
      };
    }
  }
  return CELEBRATION_THEMES['romantic-blush'];
};

export const getEventThemeProfile = (event?: any): EventThemeProfile => {
  const typeStr = (
    (event?.event_type || event?.type || '') +
    ' ' +
    (event?.title || '') +
    ' ' +
    (event?.category || '') +
    ' ' +
    (event?.theme_config?.theme || '')
  ).toUpperCase();

  if (
    typeStr.includes('MUNDAN') ||
    typeStr.includes('NAAMKARAN') ||
    typeStr.includes('PUJA') ||
    typeStr.includes('TRADITIONAL') ||
    typeStr.includes('GRIHA') ||
    typeStr.includes('KATHA') ||
    typeStr.includes('HAVAN') ||
    typeStr.includes('HERITAGE')
  ) {
    return {
      typeKey: 'MUNDAN',
      themeId: 'traditional-mandala',
      displayName: 'Auspicious Sacred & Heritage Blessing',
      paletteLabel: 'VERMILION, GOLD & SACRED IVORY',
      colorPalette: {
        canvasBg: '#0F0308',
        surfaceBg: '#1A060E',
        primary: '#9E2A4B',
        primaryHover: '#7E1D3A',
        accent: '#F59E0B',
        accentSoft: '#380B1B',
        textHeading: '#FFF8E7',
        textBody: '#EAD7BD',
        borderSoft: '#501224',
        borderAccent: '#F59E0B',
        badgeBg: '#500724',
        badgeText: '#F59E0B',
      },
      giftBox: {
        boxBg: 'linear-gradient(135deg, #701A75 0%, #4A044E 50%, #310234 100%)',
        ribbonBg: 'linear-gradient(90deg, #D97706 0%, #FBBF24 50%, #B45309 100%)',
        borderColor: '#F59E0B',
        boxShadow: '0 30px 90px rgba(112, 26, 117, 0.6), 0 0 45px rgba(245, 158, 11, 0.4)',
        centerEmblemIcon: '🕉️',
        heartOrEmblemColor: '#F59E0B',
        lidBg: 'linear-gradient(135deg, #831843 0%, #500724 100%)',
      },
      particleSystem: {
        emojis: ['🌺', '🔔', '✨', '🪔', '🌼'],
        confettiColors: ['#F59E0B', '#FBBF24', '#701A75', '#D97706', '#FFFFFF'],
        particleType: 'MARIGOLD_PETALS_DIYAS',
        rainLabel: 'Rain of Marigold Petals, Diyas & Sacred Sparkles',
      },
      bookCard: {
        bookBg: 'linear-gradient(135deg, #4A044E 0%, #581C87 40%, #701A75 100%)',
        bookBorder: '#F59E0B',
        textColor: '#FFFFFF',
        accentColor: '#FBBF24',
        headerSymbol: '🕉️',
        badgeBg: '#500724',
        badgeText: '#F59E0B',
        spineColor: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
        sacredHeader: '|| श्री गणेशाय नमः ||',
        headerTitle: 'SACRED HERITAGE THEME',
        defaultGreeting:
          'We cordially request the gracious presence of your family to shower blessings upon this auspicious occasion.',
      },
      audio: {
        boomFrequency: 160,
        soundLabel: 'Sacred Temple Chime & Celebration Boom',
      },
    };
  }

  if (
    typeStr.includes('BIRTHDAY') ||
    typeStr.includes('JANMDIN') ||
    typeStr.includes('PARTY') ||
    typeStr.includes('CELEBRATION')
  ) {
    return {
      typeKey: 'BIRTHDAY',
      themeId: 'midnight-gold',
      displayName: 'Birthday & Starburst Celebration',
      paletteLabel: 'MIDNIGHT PURPLE, GOLD & STARDUST',
      colorPalette: {
        canvasBg: '#0A0612',
        surfaceBg: '#140C20',
        primary: '#6D28D9',
        primaryHover: '#5B21B6',
        accent: '#FBBF24',
        accentSoft: '#26183C',
        textHeading: '#FAF5FF',
        textBody: '#F3E8FF',
        borderSoft: '#3B185F',
        borderAccent: '#FBBF24',
        badgeBg: '#3B185F',
        badgeText: '#FDE047',
      },
      giftBox: {
        boxBg: 'linear-gradient(135deg, #4C1D95 0%, #2E1065 50%, #1E0845 100%)',
        ribbonBg: 'linear-gradient(90deg, #F59E0B 0%, #FDE047 50%, #D97706 100%)',
        borderColor: '#FBBF24',
        boxShadow: '0 30px 90px rgba(76, 29, 149, 0.6), 0 0 45px rgba(251, 191, 36, 0.4)',
        centerEmblemIcon: '🎁',
        heartOrEmblemColor: '#FDE047',
        lidBg: 'linear-gradient(135deg, #5B21B6 0%, #2E1065 100%)',
      },
      particleSystem: {
        emojis: ['🎈', '🎉', '⭐', '✨', '🎂'],
        confettiColors: ['#FBBF24', '#6D28D9', '#D946EF', '#FFFFFF', '#38BDF8'],
        particleType: 'CONFETTI_BALLOONS',
        rainLabel: 'Rain of Confetti, Stars & Birthday Balloons',
      },
      bookCard: {
        bookBg: 'linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #1E0845 100%)',
        bookBorder: '#FBBF24',
        textColor: '#FFFFFF',
        accentColor: '#FDE047',
        headerSymbol: '✨',
        badgeBg: '#3B185F',
        badgeText: '#FDE047',
        spineColor: 'linear-gradient(180deg, #FBBF24 0%, #D97706 100%)',
        sacredHeader: "Let's Celebrate Together!",
        headerTitle: 'BIRTHDAY • MIDNIGHT STARBURST',
        defaultGreeting:
          'Join us for an unforgettable celebration filled with laughter, delicious dining, and wonderful memories!',
      },
      audio: {
        boomFrequency: 220,
        soundLabel: 'Joyful Party Chime & Boom',
      },
    };
  }

  if (
    typeStr.includes('CORPORATE') ||
    typeStr.includes('SUMMIT') ||
    typeStr.includes('TECH') ||
    typeStr.includes('CONFERENCE') ||
    typeStr.includes('BUSINESS') ||
    typeStr.includes('LAUNCH') ||
    typeStr.includes('GRADUATION')
  ) {
    return {
      typeKey: 'CORPORATE',
      themeId: 'corporate-executive',
      displayName: 'Corporate & Executive Summit',
      paletteLabel: 'EXECUTIVE CHARCOAL, GOLD & NAVY',
      colorPalette: {
        canvasBg: '#030712',
        surfaceBg: '#111827',
        primary: '#1F2937',
        primaryHover: '#111827',
        accent: '#F59E0B',
        accentSoft: '#1F2937',
        textHeading: '#F9FAFB',
        textBody: '#E5E7EB',
        borderSoft: '#374151',
        borderAccent: '#F59E0B',
        badgeBg: '#1F2937',
        badgeText: '#FBBF24',
      },
      giftBox: {
        boxBg: 'linear-gradient(135deg, #0A1128 0%, #0F1C3F 50%, #001F54 100%)',
        ribbonBg: 'linear-gradient(90deg, #B45309 0%, #FFD700 50%, #D97706 100%)',
        borderColor: '#FFD700',
        boxShadow: '0 30px 90px rgba(0, 31, 84, 0.7), 0 0 45px rgba(255, 215, 0, 0.4)',
        centerEmblemIcon: '🏛️',
        heartOrEmblemColor: '#FFD700',
        lidBg: 'linear-gradient(135deg, #182643 0%, #0A1128 100%)',
      },
      particleSystem: {
        emojis: ['🏛️', '✨', '⚡', '💎', '🌐'],
        confettiColors: ['#FFD700', '#1E3A8A', '#38BDF8', '#FFFFFF', '#60A5FA'],
        particleType: 'GEOMETRIC_TECH_STREAKS',
        rainLabel: 'Rain of Geometric Sparkles & Executive Light Rays',
      },
      bookCard: {
        bookBg: 'linear-gradient(135deg, #0A1128 0%, #0F1C3F 50%, #001F54 100%)',
        bookBorder: '#FFD700',
        textColor: '#FFFFFF',
        accentColor: '#FFD700',
        headerSymbol: '🏛️',
        badgeBg: '#182643',
        badgeText: '#FFD700',
        spineColor: 'linear-gradient(180deg, #FFD700 0%, #D97706 100%)',
        sacredHeader: 'You Are Cordially Invited',
        headerTitle: 'CORPORATE • EXECUTIVE EXCELLENCE',
        defaultGreeting:
          'Join key leaders, visionaries, and innovators for an extraordinary summit of insight and inspiration.',
      },
      audio: {
        boomFrequency: 150,
        soundLabel: 'Executive Resonance Boom',
      },
    };
  }

  // Default: Romantic Blush Royal Wedding & Love
  return {
    typeKey: 'WEDDING',
    themeId: 'romantic-blush',
    displayName: 'A Royal Celebration of Boundless Love',
    paletteLabel: 'ROYAL VELVET, GOLD & IVORY',
    colorPalette: {
      canvasBg: '#0A1128',
      surfaceBg: '#0F172A',
      primary: '#7E223B',
      primaryHover: '#63182C',
      accent: '#FFD700',
      accentSoft: '#1A2542',
      textHeading: '#FFF8E7',
      textBody: '#E2E8F0',
      borderSoft: '#1E293B',
      borderAccent: '#FFD700',
      badgeBg: '#2A101D',
      badgeText: '#FFD700',
    },
    giftBox: {
      boxBg: 'linear-gradient(135deg, #4A0E17 0%, #2D080E 50%, #1A0408 100%)',
      ribbonBg: 'linear-gradient(90deg, #C9AA78 0%, #FFD700 50%, #9E6F6D 100%)',
      borderColor: '#FFD700',
      boxShadow: '0 30px 90px rgba(74, 14, 23, 0.6), 0 0 45px rgba(255, 215, 0, 0.4)',
      centerEmblemIcon: '💖',
      heartOrEmblemColor: '#FFD700',
      lidBg: 'linear-gradient(135deg, #63182C 0%, #350A13 100%)',
    },
    particleSystem: {
      emojis: ['🌹', '💖', '✨', '💐', '🕊️'],
      confettiColors: ['#FFD700', '#E52B50', '#FFF8E7', '#C9AA78', '#FFFFFF'],
      particleType: 'ROSE_PETALS_HEARTS',
      rainLabel: 'Rain of Velvet Rose Petals, Golden Stars & Floating Hearts',
    },
    bookCard: {
      bookBg: 'linear-gradient(135deg, #3D0C14 0%, #4A0E17 50%, #2A060C 100%)',
      bookBorder: '#FFD700',
      textColor: '#FFFFFF',
      accentColor: '#FFD700',
      headerSymbol: '💖',
      badgeBg: '#4A0E17',
      badgeText: '#FFD700',
      spineColor: 'linear-gradient(180deg, #FFD700 0%, #C9AA78 100%)',
      sacredHeader: '|| ॐ श्री गणेशाय नमः ||',
      headerTitle: 'ROYAL VIVAH • LOVE CELEBRATION',
      defaultGreeting:
        'Together with our families, we cordially invite you to share our joy, celebrate our love, and bless our auspicious union.',
    },
    audio: {
      boomFrequency: 180,
      soundLabel: 'Romantic Royal Chime & Warm Bass Boom',
    },
  };
};

export default function getEventCardTheme(event?: any): EventThemeConfig {
  const profile = getEventThemeProfile(event);
  const themeId = event?.theme_config?.theme || profile.themeId;
  const tokens = getThemeTokens(themeId);
  return {
    themeId: tokens.id,
    themeName: tokens.name,
    cardBgGradient: tokens.gradientHeader,
    headerGoldGradient: 'linear-gradient(135deg, #FFF8E7 0%, #FFD700 60%, #C9AA78 100%)',
    goldBorderClass: 'border-2 border-amber-300/80 shadow-[0_0_25px_rgba(255,215,0,0.35)]',
    accentBadgeClass: 'bg-amber-950/80 text-amber-300 border border-amber-400/50',
    coverImageUrl: event?.cover_image_url || '/romantic_3d_invitation_hero.jpg',
    cardBorder: tokens.borderAccent,
    fontFamilyClass: 'font-serif',
    badgeText: tokens.badgeText,
    headingFontClass: 'font-serif',
    bestForOccasions: ['WEDDING', 'ENGAGEMENT', 'BIRTHDAY', 'MUNDAN', 'ANNIVERSARY', 'CORPORATE'],
  };
}
