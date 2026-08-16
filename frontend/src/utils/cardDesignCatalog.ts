/**
 * Nimantran AI — Master Card Design Catalogue
 * Expansive, highly distinct invitation card designs with genuine visual diversity:
 * Romantic, Royal, Traditional, Modern, Floral, Corporate, Baby & Birthday.
 */

export interface CardDesignItem {
  id: string;
  name: string;
  subtitle?: string;
  category: 'ROMANTIC' | 'ROYAL' | 'TRADITIONAL' | 'MODERN' | 'FLORAL' | 'CORPORATE' | 'BABY' | 'BIRTHDAY' | 'FESTIVE';
  categoryLabel: string;
  themeId: string;
  badgeIcon: string;
  bgGradient: string;
  borderStyle: string;
  headerBadge: string;
  accentColor: string;
  fontFamily: string;
  ornamentStyle: 'FLOWERS' | 'MANDALA' | 'ROYAL_CREST' | 'MINIMAL_LINES' | 'GEOMETRIC_TECH' | 'BABY_STARS' | 'PARTY_SPARKLES' | 'GOLD_FRAME';
  recommendedOccasions: string[];
  description: string;
}

export interface CardCategoryFilter {
  id: string;
  label: string;
  icon: string;
}

export const CARD_CATEGORY_FILTERS: CardCategoryFilter[] = [
  { id: 'ALL', label: 'All Designs', icon: '✨' },
  { id: 'ROMANTIC', label: 'Romantic', icon: '❤️' },
  { id: 'ROYAL', label: 'Royal', icon: '👑' },
  { id: 'TRADITIONAL', label: 'Traditional', icon: '🪷' },
  { id: 'FLORAL', label: 'Floral', icon: '🌸' },
  { id: 'MODERN', label: 'Modern & Minimal', icon: '💎' },
  { id: 'CORPORATE', label: 'Corporate', icon: '💼' },
  { id: 'BABY', label: 'Baby & Kids', icon: '👶' },
  { id: 'BIRTHDAY', label: 'Birthday & Party', icon: '🎉' },
  { id: 'FESTIVE', label: 'Festive & Utsav', icon: '🪔' },
];

export const MASTER_CARD_DESIGNS: CardDesignItem[] = [
  // ─── 1. ROMANTIC FAMILIES ──────────────────────────────────────────────────
  {
    id: 'rose-romance',
    name: 'Rose Romance',
    subtitle: 'Romantic Navy & Rose Gold',
    category: 'ROMANTIC',
    categoryLabel: 'Romantic & Love',
    themeId: 'romantic-blush',
    badgeIcon: '🌹',
    bgGradient: 'linear-gradient(145deg, #1A0408 0%, #3D0C14 50%, #0A1128 100%)',
    borderStyle: 'border-2 border-amber-300/80 shadow-[0_0_25px_rgba(255,215,0,0.3)]',
    headerBadge: 'bg-rose-950/80 text-amber-300 border border-amber-400/50',
    accentColor: '#FFD700',
    fontFamily: 'font-serif',
    ornamentStyle: 'FLOWERS',
    recommendedOccasions: ['WEDDING', 'ENGAGEMENT', 'SAGAI', 'RECEPTION', 'WEDDING_ANNIVERSARY', 'PROPOSAL', 'VALENTINE'],
    description: 'Deep velvet crimson with gold leaf flourishes and rose petal accents.',
  },
  {
    id: 'blush-love',
    name: 'Blush Love & Champagne',
    subtitle: 'Soft Pink, Blush & Gold',
    category: 'ROMANTIC',
    categoryLabel: 'Romantic & Love',
    themeId: 'blush-love',
    badgeIcon: '💖',
    bgGradient: 'linear-gradient(145deg, #2D0B1E 0%, #4D1234 50%, #170510 100%)',
    borderStyle: 'border-2 border-pink-400/70 shadow-[0_0_25px_rgba(244,114,182,0.35)]',
    headerBadge: 'bg-pink-950/80 text-pink-200 border border-pink-400/50',
    accentColor: '#F472B6',
    fontFamily: 'font-serif',
    ornamentStyle: 'FLOWERS',
    recommendedOccasions: ['ENGAGEMENT', 'WEDDING', 'SAGAI', 'PROPOSAL', 'VALENTINE', 'BABY_SHOWER'],
    description: 'Tender blush petals and sparkling champagne accents for modern romance.',
  },
  {
    id: 'champagne-romance',
    name: 'Champagne & Ivory Romance',
    subtitle: 'Golden Champagne & Warm Amber',
    category: 'ROMANTIC',
    categoryLabel: 'Romantic & Love',
    themeId: 'champagne-romance',
    badgeIcon: '🥂',
    bgGradient: 'linear-gradient(145deg, #2A1A0C 0%, #452B14 50%, #150E06 100%)',
    borderStyle: 'border-2 border-amber-300/90 shadow-[0_0_30px_rgba(253,230,138,0.4)]',
    headerBadge: 'bg-amber-950/80 text-amber-200 border border-amber-300/60',
    accentColor: '#FDE68A',
    fontFamily: 'font-serif',
    ornamentStyle: 'GOLD_FRAME',
    recommendedOccasions: ['RECEPTION', 'WEDDING_ANNIVERSARY', 'SILVER_JUBILEE', 'GOLDEN_JUBILEE', 'DINNER_PARTY'],
    description: 'Sophisticated vintage champagne luxury with radiant warm candlelight tones.',
  },
  {
    id: 'sunset-romance',
    name: 'Sunset Rose & Terracotta',
    subtitle: 'Warm Coral, Rose & Amber',
    category: 'ROMANTIC',
    categoryLabel: 'Romantic & Love',
    themeId: 'sunset-romance',
    badgeIcon: '🌅',
    bgGradient: 'linear-gradient(145deg, #3B1015 0%, #541920 50%, #1A070A 100%)',
    borderStyle: 'border-2 border-orange-400/80 shadow-[0_0_25px_rgba(251,146,60,0.35)]',
    headerBadge: 'bg-rose-950/80 text-orange-200 border border-orange-400/50',
    accentColor: '#FB923C',
    fontFamily: 'font-serif',
    ornamentStyle: 'FLOWERS',
    recommendedOccasions: ['WEDDING', 'ENGAGEMENT', 'FAREWELL', 'DINNER_PARTY', 'VALENTINE'],
    description: 'Golden hour sunset radiance blended with terracotta warmth and rose petals.',
  },
  {
    id: 'burgundy-velvet',
    name: 'Burgundy Velvet Gold',
    subtitle: 'Royal Burgundy & Gold Filigree',
    category: 'ROMANTIC',
    categoryLabel: 'Romantic & Love',
    themeId: 'burgundy-velvet',
    badgeIcon: '🍷',
    bgGradient: 'linear-gradient(145deg, #2D0510 0%, #4D0A1C 50%, #130207 100%)',
    borderStyle: 'border-2 border-amber-400/85 shadow-[0_0_30px_rgba(245,158,11,0.4)]',
    headerBadge: 'bg-rose-950/90 text-amber-300 border border-amber-400/60',
    accentColor: '#F59E0B',
    fontFamily: 'font-serif',
    ornamentStyle: 'ROYAL_CREST',
    recommendedOccasions: ['WEDDING', 'SANGEET', 'RECEPTION', 'WEDDING_ANNIVERSARY', 'DINNER_PARTY'],
    description: 'Sumptuous deep burgundy velvet with ornate golden border embroidery.',
  },

  // ─── 2. ROYAL FAMILIES ─────────────────────────────────────────────────────
  {
    id: 'royal-palace',
    name: 'Royal Palace Gold',
    category: 'ROYAL',
    categoryLabel: 'Royal & Heritage',
    themeId: 'royal-palace',
    badgeIcon: '👑',
    bgGradient: 'linear-gradient(145deg, #0A1128 0%, #162447 50%, #050B1A 100%)',
    borderStyle: 'border-2 border-amber-300 shadow-[0_0_35px_rgba(255,215,0,0.45)]',
    headerBadge: 'bg-blue-950/90 text-amber-300 border border-amber-300/70',
    accentColor: '#FFD700',
    fontFamily: 'font-serif',
    ornamentStyle: 'ROYAL_CREST',
    recommendedOccasions: ['WEDDING', 'RECEPTION', 'GOLDEN_JUBILEE', 'SILVER_JUBILEE', 'ANNUAL_DAY_AWARDS'],
    description: 'Palatial blue canvas with imperial gold insignia and aristocratic symmetry.',
  },
  {
    id: 'maharaja-gold',
    name: 'Maharaja Heritage',
    category: 'ROYAL',
    categoryLabel: 'Royal & Heritage',
    themeId: 'maharaja-gold',
    badgeIcon: '🏛️',
    bgGradient: 'linear-gradient(145deg, #241604 0%, #3D2608 50%, #0F0A02 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5)]',
    headerBadge: 'bg-amber-950/90 text-amber-200 border border-amber-400/70',
    accentColor: '#FBBF24',
    fontFamily: 'font-serif',
    ornamentStyle: 'ROYAL_CREST',
    recommendedOccasions: ['WEDDING', 'SAGAI', 'GRIHA_PRAVESH', 'GOLDEN_JUBILEE', 'DIWALI'],
    description: 'Regal Rajasthan palace gold leaf motifs with grand vintage arches.',
  },
  {
    id: 'peacock-emerald',
    name: 'Royal Peacock Emerald',
    category: 'ROYAL',
    categoryLabel: 'Royal & Heritage',
    themeId: 'peacock-emerald',
    badgeIcon: '🦚',
    bgGradient: 'linear-gradient(145deg, #022018 0%, #04382A 50%, #01120D 100%)',
    borderStyle: 'border-2 border-emerald-400/90 shadow-[0_0_30px_rgba(52,211,153,0.4)]',
    headerBadge: 'bg-emerald-950/90 text-amber-300 border border-emerald-400/60',
    accentColor: '#34D399',
    fontFamily: 'font-serif',
    ornamentStyle: 'ROYAL_CREST',
    recommendedOccasions: ['RECEPTION', 'MEHNDI', 'SANGEET', 'SILVER_JUBILEE', 'WEDDING'],
    description: 'Emerald green radiance inspired by royal peacock feathers and jewels.',
  },

  // ─── 3. TRADITIONAL & RELIGIOUS FAMILIES ──────────────────────────────────
  {
    id: 'traditional-mandala',
    name: 'Sacred Mandala & Vermilion',
    category: 'TRADITIONAL',
    categoryLabel: 'Traditional & Sacred',
    themeId: 'traditional-mandala',
    badgeIcon: '🕉️',
    bgGradient: 'linear-gradient(145deg, #2D0510 0%, #4D0A1C 50%, #150207 100%)',
    borderStyle: 'border-2 border-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.45)]',
    headerBadge: 'bg-red-950/90 text-amber-300 border border-amber-400/60',
    accentColor: '#F59E0B',
    fontFamily: 'font-serif',
    ornamentStyle: 'MANDALA',
    recommendedOccasions: ['MUNDAN', 'GRIHA_PRAVESH', 'SATYANARAYAN_KATHA', 'NAAMKARAN', 'GANESH_PUJA', 'HAVAN_PUJA', 'JAGRAN_BHAJAN'],
    description: 'Sacred Sanskrit typography, holy vermilion red, and intricate divine mandalas.',
  },
  {
    id: 'marigold-sunshine',
    name: 'Marigold Sunshine',
    category: 'TRADITIONAL',
    categoryLabel: 'Traditional & Sacred',
    themeId: 'marigold-sunshine',
    badgeIcon: '🌼',
    bgGradient: 'linear-gradient(145deg, #2D1C03 0%, #4D3106 50%, #150D01 100%)',
    borderStyle: 'border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.4)]',
    headerBadge: 'bg-amber-950/90 text-yellow-300 border border-yellow-400/60',
    accentColor: '#FACC15',
    fontFamily: 'font-serif',
    ornamentStyle: 'FLOWERS',
    recommendedOccasions: ['HALDI', 'MEHNDI', 'ANNAPRASHAN', 'COMMUNITY_MEET', 'MUNDAN'],
    description: 'Bright festive yellow marigold garlands and joyful auspicious blessings.',
  },
  {
    id: 'festive-gold',
    name: 'Festive Diya Gold',
    category: 'FESTIVE',
    categoryLabel: 'Festive & Utsav',
    themeId: 'festive-gold',
    badgeIcon: '🪔',
    bgGradient: 'linear-gradient(145deg, #2D1A04 0%, #4D2D08 50%, #170D02 100%)',
    borderStyle: 'border-2 border-amber-300 shadow-[0_0_30px_rgba(253,224,71,0.45)]',
    headerBadge: 'bg-amber-950/90 text-amber-200 border border-amber-300/60',
    accentColor: '#FDE047',
    fontFamily: 'font-serif',
    ornamentStyle: 'MANDALA',
    recommendedOccasions: ['DIWALI', 'GRIHA_PRAVESH', 'SATYANARAYAN_KATHA', 'HALDI', 'COMMUNITY_MEET'],
    description: 'Luminous glowing diyas, radiant festive warmth, and auspicious gold trim.',
  },

  // ─── 4. MODERN & MINIMAL FAMILIES ──────────────────────────────────────────
  {
    id: 'minimal-luxury',
    name: 'Minimal Luxury Platinum',
    category: 'MODERN',
    categoryLabel: 'Modern & Minimal',
    themeId: 'minimal-luxury',
    badgeIcon: '💎',
    bgGradient: 'linear-gradient(145deg, #0F1420 0%, #1A2234 50%, #080B12 100%)',
    borderStyle: 'border-2 border-slate-300/60 shadow-[0_0_20px_rgba(226,232,240,0.25)]',
    headerBadge: 'bg-slate-900/90 text-slate-100 border border-slate-400/40',
    accentColor: '#E2E8F0',
    fontFamily: 'font-sans',
    ornamentStyle: 'MINIMAL_LINES',
    recommendedOccasions: ['BUSINESS_CONFERENCE', 'GRADUATION_CONVOCATION', 'RETIREMENT', 'FAMILY_REUNION', 'CHARITY_GALA', 'RECEPTION'],
    description: 'Clean architectural lines, sleek typography, and understated editorial refinement.',
  },
  {
    id: 'tech-modern',
    name: 'Tech Modern Indigo',
    category: 'MODERN',
    categoryLabel: 'Modern & Minimal',
    themeId: 'tech-modern',
    badgeIcon: '⚡',
    bgGradient: 'linear-gradient(145deg, #091026 0%, #101E45 50%, #040814 100%)',
    borderStyle: 'border-2 border-sky-400/80 shadow-[0_0_30px_rgba(56,189,248,0.4)]',
    headerBadge: 'bg-blue-950/90 text-sky-200 border border-sky-400/50',
    accentColor: '#38BDF8',
    fontFamily: 'font-sans',
    ornamentStyle: 'GEOMETRIC_TECH',
    recommendedOccasions: ['PRODUCT_LAUNCH', 'BUSINESS_CONFERENCE', 'NETWORKING_MEET'],
    description: 'Electric cyber indigo with futuristic neon accents and crisp geometry.',
  },
  {
    id: 'corporate-executive',
    name: 'Corporate Executive Gold',
    category: 'CORPORATE',
    categoryLabel: 'Corporate & Business',
    themeId: 'corporate-executive',
    badgeIcon: '💼',
    bgGradient: 'linear-gradient(145deg, #0E131F 0%, #161F32 50%, #07090F 100%)',
    borderStyle: 'border-2 border-amber-400/70 shadow-[0_0_25px_rgba(245,158,11,0.3)]',
    headerBadge: 'bg-gray-900/90 text-amber-300 border border-amber-400/50',
    accentColor: '#F59E0B',
    fontFamily: 'font-sans',
    ornamentStyle: 'MINIMAL_LINES',
    recommendedOccasions: ['BUSINESS_CONFERENCE', 'ANNUAL_DAY_AWARDS', 'NETWORKING_MEET', 'RETIREMENT'],
    description: 'Executive dark slate with polished champagne gold accents for summits and galas.',
  },

  // ─── 5. FLORAL FAMILIES ────────────────────────────────────────────────────
  {
    id: 'floral-garden',
    name: 'Rose & Jasmine Garden',
    category: 'FLORAL',
    categoryLabel: 'Floral & Botanical',
    themeId: 'floral-garden',
    badgeIcon: '🌸',
    bgGradient: 'linear-gradient(145deg, #092012 0%, #123820 50%, #05120A 100%)',
    borderStyle: 'border-2 border-emerald-400/70 shadow-[0_0_25px_rgba(244,114,182,0.3)]',
    headerBadge: 'bg-emerald-950/90 text-pink-200 border border-pink-400/50',
    accentColor: '#F472B6',
    fontFamily: 'font-serif',
    ornamentStyle: 'FLOWERS',
    recommendedOccasions: ['WEDDING', 'MEHNDI', 'BABY_SHOWER', 'ENGAGEMENT', 'FAMILY_REUNION'],
    description: 'Lush blooming botanical garden frame with fragrant jasmine and soft pink roses.',
  },
  {
    id: 'garden-sage',
    name: 'Garden Sage Botanical',
    category: 'FLORAL',
    categoryLabel: 'Floral & Botanical',
    themeId: 'garden-sage',
    badgeIcon: '🌿',
    bgGradient: 'linear-gradient(145deg, #0C2014 0%, #153320 50%, #06130B 100%)',
    borderStyle: 'border-2 border-amber-300/70 shadow-[0_0_25px_rgba(163,184,167,0.35)]',
    headerBadge: 'bg-emerald-950/90 text-emerald-100 border border-amber-300/50',
    accentColor: '#A3B8A7',
    fontFamily: 'font-serif',
    ornamentStyle: 'FLOWERS',
    recommendedOccasions: ['BABY_SHOWER', 'FAMILY_REUNION', 'ALUMNI_MEET', 'HALDI', 'FAREWELL'],
    description: 'Earthy sage green watercolor textures with golden eucalyptus leaf sprays.',
  },

  // ─── 6. BABY & KIDS FAMILIES ───────────────────────────────────────────────
  {
    id: 'baby-pastel',
    name: 'Baby Clouds & Pastel Stars',
    category: 'BABY',
    categoryLabel: 'Baby & Kids',
    themeId: 'baby-pastel',
    badgeIcon: '👶',
    bgGradient: 'linear-gradient(145deg, #0C1A2E 0%, #162B4A 50%, #070E1A 100%)',
    borderStyle: 'border-2 border-sky-300 shadow-[0_0_25px_rgba(56,189,248,0.4)]',
    headerBadge: 'bg-blue-950/90 text-sky-200 border border-sky-300/60',
    accentColor: '#38BDF8',
    fontFamily: 'font-sans',
    ornamentStyle: 'BABY_STARS',
    recommendedOccasions: ['BABY_SHOWER', 'MUNDAN', 'NAAMKARAN', 'FIRST_BIRTHDAY', 'ANNAPRASHAN'],
    description: 'Gentle pastel skies, floating crescent moons, and sparkling golden stardust.',
  },

  // ─── 7. BIRTHDAY & PARTY FAMILIES ─────────────────────────────────────────
  {
    id: 'midnight-gold',
    name: 'Midnight Gold Starburst',
    category: 'BIRTHDAY',
    categoryLabel: 'Birthday & Party',
    themeId: 'midnight-gold',
    badgeIcon: '🎉',
    bgGradient: 'linear-gradient(145deg, #180D2B 0%, #291748 50%, #0B0514 100%)',
    borderStyle: 'border-2 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.45)]',
    headerBadge: 'bg-purple-950/90 text-amber-200 border border-amber-300/60',
    accentColor: '#FBBF24',
    fontFamily: 'font-sans',
    ornamentStyle: 'PARTY_SPARKLES',
    recommendedOccasions: ['BIRTHDAY', 'MILESTONE_BIRTHDAY', 'ACHIEVEMENT_SUCCESS', 'SURPRISE_PARTY', 'FIRST_BIRTHDAY'],
    description: 'Electric purple midnight velvet with golden confetti explosions and starbursts.',
  },
  {
    id: 'neon-celebration',
    name: 'Neon Glam & Party Spark',
    category: 'BIRTHDAY',
    categoryLabel: 'Birthday & Party',
    themeId: 'neon-celebration',
    badgeIcon: '🎊',
    bgGradient: 'linear-gradient(145deg, #1F072D 0%, #350D4D 50%, #0E0214 100%)',
    borderStyle: 'border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.45)]',
    headerBadge: 'bg-fuchsia-950/90 text-cyan-200 border border-cyan-400/60',
    accentColor: '#06B6D4',
    fontFamily: 'font-sans',
    ornamentStyle: 'PARTY_SPARKLES',
    recommendedOccasions: ['SURPRISE_PARTY', 'BIRTHDAY', 'DINNER_PARTY', 'FIRST_BIRTHDAY'],
    description: 'Neon magenta and cyan cyber glow for high-energy modern celebration nights.',
  },
];

/**
 * Filter card designs by category and smart occasion recommendation
 */
export const getFilteredCardDesigns = (
  categoryFilter: string = 'ALL',
  currentOccasionId: string = 'WEDDING'
): CardDesignItem[] => {
  // 1. If explicit category filter is selected (e.g. ROMANTIC, ROYAL)
  if (categoryFilter !== 'ALL') {
    return MASTER_CARD_DESIGNS.filter((card) => card.category === categoryFilter);
  }

  // 2. Otherwise sort smartly by prioritizing cards matching current occasion
  const normalizedOccasion = (currentOccasionId || '').toUpperCase();
  const prioritized = [...MASTER_CARD_DESIGNS].sort((a, b) => {
    const aMatch = a.recommendedOccasions.includes(normalizedOccasion);
    const bMatch = b.recommendedOccasions.includes(normalizedOccasion);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return prioritized;
};

/**
 * Get card design item by ID
 */
export const getCardDesignById = (id: string): CardDesignItem => {
  const match = MASTER_CARD_DESIGNS.find((item) => item.id === id || item.themeId === id);
  return match || MASTER_CARD_DESIGNS[0];
};
