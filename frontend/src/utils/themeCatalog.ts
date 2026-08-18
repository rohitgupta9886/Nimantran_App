/**
 * Nimantran AI — Master Celebration Theme Catalog
 * Data-driven, image-first & celebration-aware theme architecture.
 * Supports LOCAL, REMOTE, AI_GENERATED, and USER_UPLOADED artworks.
 */

export type ThemeImageSource = 'LOCAL' | 'REMOTE' | 'AI_GENERATED' | 'USER_UPLOADED';

export interface ThemeColorPalette {
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
}

export interface CelebrationTheme {
  id: string;
  celebrationType:
    | 'WEDDING'
    | 'ENGAGEMENT'
    | 'MUNDAN'
    | 'BIRTHDAY'
    | 'ANNIVERSARY'
    | 'BABY_SHOWER'
    | 'HOUSEWARMING'
    | 'GRADUATION'
    | 'CORPORATE'
    | 'FESTIVAL'
    | 'OTHER';
  name: string;
  tagline: string;
  description: string;
  previewImage: string;
  thumbnailImage: string;
  imageSource: ThemeImageSource;
  colorPalette: ThemeColorPalette;
  typography: 'font-serif' | 'font-sans';
  backgroundStyle: string;
  decorationStyle:
    | 'ROSE_PETALS_HEARTS'
    | 'MARIGOLD_PETALS_DIYAS'
    | 'CONFETTI_BALLOONS'
    | 'GOLD_SPARKLES_EMERALD'
    | 'GEOMETRIC_TECH_STREAKS'
    | 'LOTUS_BLOSSOMS'
    | 'FESTIVE_DIYAS';
  animationStyle: 'romantic' | 'festive' | 'traditional' | 'professional' | 'minimal' | 'playful';
  icon: string;
  badgeIcon: string;
  badgeLabel: string;
  tags: string[];
  recommendedOccasions: string[];
  isRecommendedDefault?: boolean;
}

export const THEME_FILTER_TAGS = [
  { id: 'ALL', label: 'All Designs', icon: '✨' },
  { id: 'RECOMMENDED', label: 'Recommended For You', icon: '⭐' },
  { id: 'ROYAL', label: 'Royal & Heritage', icon: '👑' },
  { id: 'ROMANTIC', label: 'Romantic & Love', icon: '❤️' },
  { id: 'TRADITIONAL', label: 'Traditional & Sacred', icon: '🪷' },
  { id: 'FESTIVE', label: 'Festive & Party', icon: '🎉' },
  { id: 'MODERN', label: 'Modern & Minimal', icon: '💎' },
  { id: 'FLORAL', label: 'Floral & Botanical', icon: '🌸' },
  { id: 'CORPORATE', label: 'Corporate & Summit', icon: '💼' },
  { id: 'BABY', label: 'Baby & Kids', icon: '👶' },
];

export const MASTER_THEME_CATALOG: CelebrationTheme[] = [
  // ─── 1. WEDDING DESIGNS ───────────────────────────────────────────────────
  {
    id: 'wedding-royal-marigold',
    celebrationType: 'WEDDING',
    name: 'Royal Marigold Mandap',
    tagline: 'Traditional Indian Wedding Luxury',
    description: 'Auspicious saffron, fresh marigold garlands, sacred Sanskrit typography and royal golden leaf flourishes.',
    previewImage: '/romantic_3d_wedding_stage.jpg',
    thumbnailImage: '/romantic_3d_wedding_stage.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
      badgeBg: 'rgba(245, 158, 11, 0.25)',
      badgeText: '#F59E0B',
    },
    typography: 'font-serif',
    backgroundStyle: 'sacred-marigold-radial',
    decorationStyle: 'MARIGOLD_PETALS_DIYAS',
    animationStyle: 'traditional',
    icon: '🌼',
    badgeIcon: '👑',
    badgeLabel: 'WEDDING • ROYAL',
    tags: ['ROYAL', 'TRADITIONAL', 'RECOMMENDED'],
    recommendedOccasions: ['WEDDING', 'VIVAH', 'HALDI', 'MEHNDI', 'SANGEET'],
    isRecommendedDefault: true,
  },
  {
    id: 'wedding-blush-romance',
    celebrationType: 'WEDDING',
    name: 'Blush Romance & Champagne',
    tagline: 'Ivory, Blush Florals & Cinematic Warmth',
    description: 'An ethereal ivory and blush rose design with champagne illumination and delicate gold filigree.',
    previewImage: '/romantic_3d_invitation_hero.jpg',
    thumbnailImage: '/romantic_3d_invitation_hero.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
      borderAccent: '#FFD700',
      gradientHeader: 'linear-gradient(135deg, #FFF8E7 0%, #FFD700 60%, #C9AA78 100%)',
      badgeBg: 'rgba(255, 215, 0, 0.15)',
      badgeText: '#FFD700',
    },
    typography: 'font-serif',
    backgroundStyle: 'romantic-wine-radial',
    decorationStyle: 'ROSE_PETALS_HEARTS',
    animationStyle: 'romantic',
    icon: '🌹',
    badgeIcon: '❤️',
    badgeLabel: 'WEDDING • ROMANTIC',
    tags: ['ROMANTIC', 'FLORAL', 'ROYAL'],
    recommendedOccasions: ['WEDDING', 'RECEPTION', 'SAGAI', 'ENGAGEMENT'],
  },
  {
    id: 'wedding-emerald-palace',
    celebrationType: 'WEDDING',
    name: 'Emerald Palace Grandeur',
    tagline: 'Imperial Palace Arches & Royal Jewels',
    description: 'Rich royal emerald velvet blended with Rajasthani jharokha arches, gold foil embossing and majestic elegance.',
    previewImage: '/velvet_invitation_chest.jpg',
    thumbnailImage: '/velvet_invitation_chest.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
    typography: 'font-serif',
    backgroundStyle: 'emerald-palace-radial',
    decorationStyle: 'GOLD_SPARKLES_EMERALD',
    animationStyle: 'traditional',
    icon: '🦚',
    badgeIcon: '👑',
    badgeLabel: 'WEDDING • PALACE',
    tags: ['ROYAL', 'TRADITIONAL'],
    recommendedOccasions: ['WEDDING', 'RECEPTION', 'SANGEET', 'MEHNDI'],
  },
  {
    id: 'wedding-midnight-luxury',
    celebrationType: 'WEDDING',
    name: 'Midnight Velvet & Candles',
    tagline: 'Dark Modern Luxury & Gold Illumination',
    description: 'Sophisticated midnight navy background with sparkling starlight, candle halos, and champagne highlights.',
    previewImage: '/romantic_3d_envelope_rings.jpg',
    thumbnailImage: '/romantic_3d_envelope_rings.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
    typography: 'font-serif',
    backgroundStyle: 'midnight-gold-radial',
    decorationStyle: 'ROSE_PETALS_HEARTS',
    animationStyle: 'romantic',
    icon: '✨',
    badgeIcon: '💎',
    badgeLabel: 'WEDDING • LUXURY',
    tags: ['ROYAL', 'ROMANTIC', 'MODERN'],
    recommendedOccasions: ['WEDDING', 'RECEPTION', 'COCKTAIL_PARTY'],
  },

  // ─── 2. ENGAGEMENT & SAGAI DESIGNS ────────────────────────────────────────
  {
    id: 'engagement-rings-roses',
    celebrationType: 'ENGAGEMENT',
    name: 'Ring & Roses Romance',
    tagline: 'Sparkling Solitaire & Rose Petals',
    description: 'Luminous dual ring emblems, blossoming English roses, and sparkling champagne bubbles celebrating your commitment.',
    previewImage: '/romantic_3d_envelope_rings.jpg',
    thumbnailImage: '/romantic_3d_envelope_rings.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
    typography: 'font-serif',
    backgroundStyle: 'romantic-wine-radial',
    decorationStyle: 'ROSE_PETALS_HEARTS',
    animationStyle: 'romantic',
    icon: '💍',
    badgeIcon: '💖',
    badgeLabel: 'ENGAGEMENT • RINGS',
    tags: ['ROMANTIC', 'FLORAL', 'RECOMMENDED'],
    recommendedOccasions: ['ENGAGEMENT', 'SAGAI', 'ROKA', 'PROPOSAL'],
    isRecommendedDefault: true,
  },
  {
    id: 'engagement-champagne-glow',
    celebrationType: 'ENGAGEMENT',
    name: 'Champagne Glow & Toast',
    tagline: 'Modern Toast, Candlelight & Gold',
    description: 'Golden champagne flutes, sparkling light bokeh, and warm amber candlelight for an unforgettable evening.',
    previewImage: '/romantic_3d_invitation_hero.jpg',
    thumbnailImage: '/romantic_3d_invitation_hero.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
    typography: 'font-serif',
    backgroundStyle: 'champagne-glow-radial',
    decorationStyle: 'ROSE_PETALS_HEARTS',
    animationStyle: 'romantic',
    icon: '🥂',
    badgeIcon: '✨',
    badgeLabel: 'ENGAGEMENT • GLOW',
    tags: ['ROMANTIC', 'MODERN'],
    recommendedOccasions: ['ENGAGEMENT', 'SAGAI', 'COCKTAIL_PARTY', 'RECEPTION'],
  },

  // ─── 3. MUNDAN SANSKAR & BABY SACRED DESIGNS ──────────────────────────────
  {
    id: 'mundan-sacred-beginnings',
    celebrationType: 'MUNDAN',
    name: 'Sacred Beginnings & Blessings',
    tagline: 'Holy Diyas, Lotus & Sanskrit Invocations',
    description: 'Devotional saffron and sandalwood palette, glowing brass diyas, sacred lotus petals, and divine family blessings for the child.',
    previewImage: '/velvet_invitation_chest.jpg',
    thumbnailImage: '/velvet_invitation_chest.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
      canvasBg: '#0F0308',
      surfaceBg: 'rgba(26, 6, 14, 0.94)',
      surfaceElevated: 'rgba(56, 11, 27, 0.96)',
      primary: '#9E2A4B',
      primaryHover: '#7E1D3A',
      primaryText: '#FFFFFF',
      accent: '#F59E0B',
      accentSoft: 'rgba(245, 158, 11, 0.2)',
      textHeading: '#FFF8E7',
      textBody: '#EAD7BD',
      textMuted: '#C9AA78',
      borderSoft: 'rgba(245, 158, 11, 0.3)',
      borderAccent: '#F59E0B',
      gradientHeader: 'linear-gradient(135deg, #FFF8E7 0%, #F59E0B 50%, #9E2A4B 100%)',
      badgeBg: 'rgba(245, 158, 11, 0.2)',
      badgeText: '#F59E0B',
    },
    typography: 'font-serif',
    backgroundStyle: 'sacred-marigold-radial',
    decorationStyle: 'LOTUS_BLOSSOMS',
    animationStyle: 'traditional',
    icon: '🪷',
    badgeIcon: '🕉️',
    badgeLabel: 'MUNDAN • SACRED',
    tags: ['TRADITIONAL', 'BABY', 'RECOMMENDED'],
    recommendedOccasions: ['MUNDAN', 'NAAMKARAN', 'ANNAPRASHAN', 'UPANAYANA'],
    isRecommendedDefault: true,
  },
  {
    id: 'mundan-little-prince',
    celebrationType: 'MUNDAN',
    name: 'Little Prince & Royal Heritage',
    tagline: 'Pastel Blue, Gold Crest & Soft Lighting',
    description: 'Soft baby blue and royal gold trim with traditional Indian peacock motifs and heartfelt blessings for the little one.',
    previewImage: '/velvet_invitation_chest.jpg',
    thumbnailImage: '/velvet_invitation_chest.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
      canvasBg: '#081024',
      surfaceBg: 'rgba(14, 26, 56, 0.94)',
      surfaceElevated: 'rgba(22, 40, 84, 0.96)',
      primary: '#1D4ED8',
      primaryHover: '#1E40AF',
      primaryText: '#FFFFFF',
      accent: '#FBBF24',
      accentSoft: 'rgba(251, 191, 36, 0.2)',
      textHeading: '#EFF6FF',
      textBody: '#DBEAFE',
      textMuted: '#93C5FD',
      borderSoft: 'rgba(251, 191, 36, 0.3)',
      borderAccent: '#FBBF24',
      gradientHeader: 'linear-gradient(135deg, #EFF6FF 0%, #FBBF24 50%, #1D4ED8 100%)',
      badgeBg: 'rgba(251, 191, 36, 0.2)',
      badgeText: '#FDE047',
    },
    typography: 'font-serif',
    backgroundStyle: 'baby-pastel-radial',
    decorationStyle: 'LOTUS_BLOSSOMS',
    animationStyle: 'traditional',
    icon: '👑',
    badgeIcon: '👶',
    badgeLabel: 'MUNDAN • PRINCE',
    tags: ['BABY', 'ROYAL', 'TRADITIONAL'],
    recommendedOccasions: ['MUNDAN', 'FIRST_BIRTHDAY', 'NAAMKARAN'],
  },
  {
    id: 'mundan-little-celebration',
    celebrationType: 'MUNDAN',
    name: 'Little Joy & Auspicious Stars',
    tagline: 'Playful Flowers, Soft Sparkles & Joy',
    description: 'Sweet pastel clouds, golden marigold flowers, and tender auspicious wishes celebrating a joyful baby milestone.',
    previewImage: '/romantic_3d_invitation_hero.jpg',
    thumbnailImage: '/romantic_3d_invitation_hero.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
      canvasBg: '#0F0615',
      surfaceBg: 'rgba(28, 14, 38, 0.94)',
      surfaceElevated: 'rgba(48, 24, 66, 0.96)',
      primary: '#9333EA',
      primaryHover: '#7E22CE',
      primaryText: '#FFFFFF',
      accent: '#FBBF24',
      accentSoft: 'rgba(251, 191, 36, 0.2)',
      textHeading: '#FAF5FF',
      textBody: '#F3E8FF',
      textMuted: '#D8B4FE',
      borderSoft: 'rgba(251, 191, 36, 0.3)',
      borderAccent: '#FBBF24',
      gradientHeader: 'linear-gradient(135deg, #FAF5FF 0%, #FBBF24 50%, #9333EA 100%)',
      badgeBg: 'rgba(251, 191, 36, 0.2)',
      badgeText: '#FDE047',
    },
    typography: 'font-serif',
    backgroundStyle: 'baby-pastel-radial',
    decorationStyle: 'LOTUS_BLOSSOMS',
    animationStyle: 'playful',
    icon: '👶',
    badgeIcon: '✨',
    badgeLabel: 'MUNDAN • JOY',
    tags: ['BABY', 'TRADITIONAL'],
    recommendedOccasions: ['MUNDAN', 'ANNAPRASHAN', 'NAAMKARAN'],
  },

  // ─── 4. BIRTHDAY DESIGNS ──────────────────────────────────────────────────
  {
    id: 'birthday-celebration-burst',
    celebrationType: 'BIRTHDAY',
    name: 'Celebration Burst & Confetti',
    tagline: 'Festive Cake, Balloons & Sparkling Confetti',
    description: 'High-energy party atmosphere with vibrant floating balloons, exploding golden confetti, and birthday starbursts.',
    previewImage: '/romantic_3d_invitation_hero.jpg',
    thumbnailImage: '/romantic_3d_invitation_hero.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
    typography: 'font-sans',
    backgroundStyle: 'party-stardust-radial',
    decorationStyle: 'CONFETTI_BALLOONS',
    animationStyle: 'festive',
    icon: '🎂',
    badgeIcon: '🎉',
    badgeLabel: 'BIRTHDAY • BURST',
    tags: ['FESTIVE', 'RECOMMENDED'],
    recommendedOccasions: ['BIRTHDAY', 'FIRST_BIRTHDAY', 'MILESTONE_BIRTHDAY', 'SURPRISE_PARTY'],
    isRecommendedDefault: true,
  },
  {
    id: 'birthday-elegant-soirée',
    celebrationType: 'BIRTHDAY',
    name: 'Elegant Birthday Soirée',
    tagline: 'Midnight Velvet, Champagne & Dining',
    description: 'Chic black-tie dining design with warm candle glows, metallic gold accents, and an intimate celebration mood.',
    previewImage: '/romantic_3d_envelope_rings.jpg',
    thumbnailImage: '/romantic_3d_envelope_rings.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
      canvasBg: '#0C0A08',
      surfaceBg: 'rgba(26, 22, 18, 0.94)',
      surfaceElevated: 'rgba(45, 38, 30, 0.96)',
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
    typography: 'font-serif',
    backgroundStyle: 'champagne-glow-radial',
    decorationStyle: 'CONFETTI_BALLOONS',
    animationStyle: 'romantic',
    icon: '🥂',
    badgeIcon: '✨',
    badgeLabel: 'BIRTHDAY • SOIRÉE',
    tags: ['MODERN', 'ROYAL', 'FESTIVE'],
    recommendedOccasions: ['BIRTHDAY', 'MILESTONE_BIRTHDAY', 'DINNER_PARTY'],
  },
  {
    id: 'birthday-kids-wonderland',
    celebrationType: 'BIRTHDAY',
    name: 'Kids Party Wonderland',
    tagline: 'Balloons, Rainbow Colors & Fun',
    description: 'Bright multi-colored balloons, playful stars, and cheerful celebration vibes for kids and 1st birthday parties.',
    previewImage: '/romantic_3d_invitation_hero.jpg',
    thumbnailImage: '/romantic_3d_invitation_hero.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
      canvasBg: '#091224',
      surfaceBg: 'rgba(16, 32, 64, 0.94)',
      surfaceElevated: 'rgba(26, 52, 100, 0.96)',
      primary: '#0284C7',
      primaryHover: '#0369A1',
      primaryText: '#FFFFFF',
      accent: '#38BDF8',
      accentSoft: 'rgba(56, 189, 248, 0.2)',
      textHeading: '#F0F9FF',
      textBody: '#E0F2FE',
      textMuted: '#7DD3FC',
      borderSoft: 'rgba(56, 189, 248, 0.3)',
      borderAccent: '#38BDF8',
      gradientHeader: 'linear-gradient(135deg, #F0F9FF 0%, #38BDF8 50%, #0284C7 100%)',
      badgeBg: 'rgba(56, 189, 248, 0.2)',
      badgeText: '#38BDF8',
    },
    typography: 'font-sans',
    backgroundStyle: 'baby-pastel-radial',
    decorationStyle: 'CONFETTI_BALLOONS',
    animationStyle: 'playful',
    icon: '🎈',
    badgeIcon: '🎉',
    badgeLabel: 'BIRTHDAY • KIDS',
    tags: ['BABY', 'FESTIVE'],
    recommendedOccasions: ['FIRST_BIRTHDAY', 'BIRTHDAY'],
  },

  // ─── 5. ANNIVERSARY DESIGNS ───────────────────────────────────────────────
  {
    id: 'anniversary-forever-us',
    celebrationType: 'ANNIVERSARY',
    name: 'Forever Us & Rose Garden',
    tagline: 'Romantic Couple Silhouette & Warm Candles',
    description: 'Emotional rose wine palette with delicate gold accents, celebrating cherished memories and years of loving companionship.',
    previewImage: '/romantic_3d_invitation_hero.jpg',
    thumbnailImage: '/romantic_3d_invitation_hero.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
      canvasBg: '#0F0608',
      surfaceBg: 'rgba(30, 12, 16, 0.94)',
      surfaceElevated: 'rgba(55, 20, 28, 0.96)',
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
    typography: 'font-serif',
    backgroundStyle: 'romantic-wine-radial',
    decorationStyle: 'ROSE_PETALS_HEARTS',
    animationStyle: 'romantic',
    icon: '💖',
    badgeIcon: '🌹',
    badgeLabel: 'ANNIVERSARY • LOVE',
    tags: ['ROMANTIC', 'FLORAL', 'RECOMMENDED'],
    recommendedOccasions: ['ANNIVERSARY', 'WEDDING_ANNIVERSARY', 'VALENTINE'],
    isRecommendedDefault: true,
  },
  {
    id: 'anniversary-golden-memories',
    celebrationType: 'ANNIVERSARY',
    name: 'Golden Jubilee Memories',
    tagline: 'Vintage Gold & Silver Jubilee Milestone',
    description: 'Regal 25th / 50th jubilee theme with radiant golden laurels, warm champagne lighting, and timeless royal honor.',
    previewImage: '/velvet_invitation_chest.jpg',
    thumbnailImage: '/velvet_invitation_chest.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
    typography: 'font-serif',
    backgroundStyle: 'champagne-glow-radial',
    decorationStyle: 'ROSE_PETALS_HEARTS',
    animationStyle: 'romantic',
    icon: '✨',
    badgeIcon: '👑',
    badgeLabel: 'ANNIVERSARY • JUBILEE',
    tags: ['ROYAL', 'ROMANTIC'],
    recommendedOccasions: ['ANNIVERSARY', 'SILVER_JUBILEE', 'GOLDEN_JUBILEE'],
  },

  // ─── 6. BABY SHOWER & GODH BHARAI DESIGNS ─────────────────────────────────
  {
    id: 'babyshower-little-wonder',
    celebrationType: 'BABY_SHOWER',
    name: 'Little Wonder & Lavender Clouds',
    tagline: 'Pastel Lavender, Cream & Tender Florals',
    description: 'Gentle pastel skies, floating crescent moons, tender floral wreaths, and joyous blessings welcoming new life.',
    previewImage: '/romantic_3d_invitation_hero.jpg',
    thumbnailImage: '/romantic_3d_invitation_hero.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
    typography: 'font-serif',
    backgroundStyle: 'baby-pastel-radial',
    decorationStyle: 'LOTUS_BLOSSOMS',
    animationStyle: 'playful',
    icon: '🌸',
    badgeIcon: '👶',
    badgeLabel: 'BABY SHOWER • WONDER',
    tags: ['BABY', 'FLORAL', 'RECOMMENDED'],
    recommendedOccasions: ['BABY_SHOWER', 'GODH_BHARAI', 'NAAMKARAN'],
    isRecommendedDefault: true,
  },

  // ─── 7. HOUSEWARMING & GRIHA PRAVESH DESIGNS ──────────────────────────────
  {
    id: 'housewarming-griha-pravesh',
    celebrationType: 'HOUSEWARMING',
    name: 'Griha Pravesh & Shubh Rangoli',
    tagline: 'Traditional Toran, Diyas & New Home Blessings',
    description: 'Auspicious mango leaf toran, glowing brass diyas, and sacred Kalash motifs welcoming friends and family to your new abode.',
    previewImage: '/velvet_invitation_chest.jpg',
    thumbnailImage: '/velvet_invitation_chest.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
      badgeBg: 'rgba(245, 158, 11, 0.25)',
      badgeText: '#F59E0B',
    },
    typography: 'font-serif',
    backgroundStyle: 'sacred-marigold-radial',
    decorationStyle: 'FESTIVE_DIYAS',
    animationStyle: 'traditional',
    icon: '🏡',
    badgeIcon: '🪔',
    badgeLabel: 'GRIHA PRAVESH',
    tags: ['TRADITIONAL', 'RECOMMENDED'],
    recommendedOccasions: ['GRIHA_PRAVESH', 'HOUSEWARMING', 'PUJA', 'SATYANARAYAN_KATHA'],
    isRecommendedDefault: true,
  },

  // ─── 8. CORPORATE & CONFERENCES DESIGNS ───────────────────────────────────
  {
    id: 'corporate-modern-professional',
    celebrationType: 'CORPORATE',
    name: 'Modern Professional Summit',
    tagline: 'Platinum, Executive Navy & Clean Geometry',
    description: 'Minimalist architectural lines, crisp modern typography, and clean platinum reflections tailored for summits and galas.',
    previewImage: '/velvet_invitation_chest.jpg',
    thumbnailImage: '/velvet_invitation_chest.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
      borderSoft: 'rgba(55, 65, 81, 0.6)',
      borderAccent: '#F59E0B',
      gradientHeader: 'linear-gradient(135deg, #F9FAFB 0%, #F59E0B 60%, #1F2937 100%)',
      badgeBg: 'rgba(31, 41, 55, 0.8)',
      badgeText: '#FBBF24',
    },
    typography: 'font-sans',
    backgroundStyle: 'corporate-navy-radial',
    decorationStyle: 'GEOMETRIC_TECH_STREAKS',
    animationStyle: 'professional',
    icon: '💼',
    badgeIcon: '🏛️',
    badgeLabel: 'CORPORATE • SUMMIT',
    tags: ['CORPORATE', 'MODERN', 'RECOMMENDED'],
    recommendedOccasions: ['CORPORATE', 'CONFERENCE', 'BUSINESS_CONFERENCE', 'ANNUAL_DAY_AWARDS', 'NETWORKING_MEET'],
    isRecommendedDefault: true,
  },
  {
    id: 'corporate-achievement-platinum',
    celebrationType: 'GRADUATION',
    name: 'Achievement & Convocation',
    tagline: 'Academic Honors & Platinum Excellence',
    description: 'Deep navy and platinum silver laurels honoring academic success, convocation milestones, and executive transitions.',
    previewImage: '/velvet_invitation_chest.jpg',
    thumbnailImage: '/velvet_invitation_chest.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
      canvasBg: '#0F1420',
      surfaceBg: 'rgba(26, 34, 52, 0.94)',
      surfaceElevated: 'rgba(40, 52, 78, 0.96)',
      primary: '#3B82F6',
      primaryHover: '#2563EB',
      primaryText: '#FFFFFF',
      accent: '#E2E8F0',
      accentSoft: 'rgba(226, 232, 240, 0.15)',
      textHeading: '#F8FAFC',
      textBody: '#E2E8F0',
      textMuted: '#94A3B8',
      borderSoft: 'rgba(226, 232, 240, 0.3)',
      borderAccent: '#E2E8F0',
      gradientHeader: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #3B82F6 100%)',
      badgeBg: 'rgba(30, 41, 59, 0.8)',
      badgeText: '#F8FAFC',
    },
    typography: 'font-sans',
    backgroundStyle: 'corporate-navy-radial',
    decorationStyle: 'GEOMETRIC_TECH_STREAKS',
    animationStyle: 'professional',
    icon: '🎓',
    badgeIcon: '💎',
    badgeLabel: 'GRADUATION • HONORS',
    tags: ['CORPORATE', 'MODERN'],
    recommendedOccasions: ['GRADUATION', 'CONVOCATION', 'RETIREMENT', 'ACHIEVEMENT_SUCCESS'],
  },

  // ─── 9. FESTIVAL & UTSAV DESIGNS ──────────────────────────────────────────
  {
    id: 'festival-diwali-splendor',
    celebrationType: 'FESTIVAL',
    name: 'Diwali Splendor & Diyas',
    tagline: 'Radiant Brass Diyas, Gold & Fireworks',
    description: 'Luminous glowing lamps, deep vermilion warmth, and sparkling festive fireworks for auspicious Deepavali celebrations.',
    previewImage: '/velvet_invitation_chest.jpg',
    thumbnailImage: '/velvet_invitation_chest.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
      badgeBg: 'rgba(245, 158, 11, 0.25)',
      badgeText: '#F59E0B',
    },
    typography: 'font-serif',
    backgroundStyle: 'sacred-marigold-radial',
    decorationStyle: 'FESTIVE_DIYAS',
    animationStyle: 'festive',
    icon: '🪔',
    badgeIcon: '✨',
    badgeLabel: 'FESTIVAL • DIWALI',
    tags: ['FESTIVE', 'TRADITIONAL'],
    recommendedOccasions: ['DIWALI', 'PUJA', 'COMMUNITY_MEET'],
  },

  // ─── 10. UNIVERSAL / OTHER CELEBRATIONS ───────────────────────────────────
  {
    id: 'celebration-universal-modern',
    celebrationType: 'OTHER',
    name: 'Modern Universal Celebration',
    tagline: 'Abstract Radiant Bokeh & Golden Ambient Lights',
    description: 'An elegant, versatile design with glowing ambient bokeh, modern serif typography, and balanced celebratory aesthetics.',
    previewImage: '/romantic_3d_invitation_hero.jpg',
    thumbnailImage: '/romantic_3d_invitation_hero.jpg',
    imageSource: 'LOCAL',
    colorPalette: {
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
      borderAccent: '#FFD700',
      gradientHeader: 'linear-gradient(135deg, #FFF8E7 0%, #FFD700 60%, #C9AA78 100%)',
      badgeBg: 'rgba(255, 215, 0, 0.15)',
      badgeText: '#FFD700',
    },
    typography: 'font-serif',
    backgroundStyle: 'romantic-wine-radial',
    decorationStyle: 'GOLD_SPARKLES_EMERALD',
    animationStyle: 'romantic',
    icon: '🌟',
    badgeIcon: '✨',
    badgeLabel: 'CELEBRATION',
    tags: ['MODERN', 'ROYAL', 'RECOMMENDED'],
    recommendedOccasions: ['OTHER', 'REUNION', 'FAMILY_REUNION', 'DINNER_PARTY'],
    isRecommendedDefault: true,
  },
];

/**
 * Filter celebration themes by selected tag and occasion intelligence
 */
export const getFilteredCelebrationThemes = (
  filterTag: string = 'ALL',
  currentOccasionId: string = 'WEDDING'
): CelebrationTheme[] => {
  const normalizedOccasion = (currentOccasionId || '').toUpperCase();

  // 1. If explicit filter selected
  if (filterTag === 'RECOMMENDED') {
    return MASTER_THEME_CATALOG.filter(
      (theme) =>
        theme.recommendedOccasions.includes(normalizedOccasion) ||
        theme.celebrationType === normalizedOccasion
    );
  }

  if (filterTag !== 'ALL') {
    return MASTER_THEME_CATALOG.filter((theme) => theme.tags.includes(filterTag));
  }

  // 2. Default: Sort intelligently by matching current occasion first
  const sorted = [...MASTER_THEME_CATALOG].sort((a, b) => {
    const aMatch =
      a.recommendedOccasions.includes(normalizedOccasion) || a.celebrationType === normalizedOccasion;
    const bMatch =
      b.recommendedOccasions.includes(normalizedOccasion) || b.celebrationType === normalizedOccasion;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return sorted;
};

/**
 * Retrieve theme item by ID with safe fallback
 */
export const getCelebrationThemeById = (id?: string): CelebrationTheme => {
  if (!id) return MASTER_THEME_CATALOG[0];
  const match = MASTER_THEME_CATALOG.find((t) => t.id === id);
  if (match) return match;

  // Fallback for legacy IDs
  if (id.includes('marigold') || id.includes('traditional')) {
    return MASTER_THEME_CATALOG.find((t) => t.id === 'wedding-royal-marigold') || MASTER_THEME_CATALOG[0];
  }
  if (id.includes('mundan') || id.includes('baby')) {
    return MASTER_THEME_CATALOG.find((t) => t.id === 'mundan-sacred-beginnings') || MASTER_THEME_CATALOG[0];
  }
  if (id.includes('birthday')) {
    return MASTER_THEME_CATALOG.find((t) => t.id === 'birthday-celebration-burst') || MASTER_THEME_CATALOG[0];
  }
  if (id.includes('corporate')) {
    return MASTER_THEME_CATALOG.find((t) => t.id === 'corporate-modern-professional') || MASTER_THEME_CATALOG[0];
  }

  return MASTER_THEME_CATALOG[0];
};

/**
 * Get the single best recommended theme for an occasion
 */
export const getRecommendedThemeForOccasion = (eventType: string = 'WEDDING'): CelebrationTheme => {
  const normalized = (eventType || '').toUpperCase();
  const match = MASTER_THEME_CATALOG.find(
    (t) => t.isRecommendedDefault && (t.celebrationType === normalized || t.recommendedOccasions.includes(normalized))
  );
  if (match) return match;

  const fallbackMatch = MASTER_THEME_CATALOG.find((t) => t.recommendedOccasions.includes(normalized));
  return fallbackMatch || MASTER_THEME_CATALOG[0];
};
