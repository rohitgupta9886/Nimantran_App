/**
 * Nimantran AI — Master Occasion Catalogue
 * Comprehensive, well-organized occasion library covering Wedding, Baby, Religious,
 * Family, Corporate, Education, Social, and Custom Celebrations.
 */

export interface OccasionItem {
  id: string;
  label: string;
  category: string;
  categoryLabel: string;
  icon: string;
  defaultTitle: string;
  defaultVenue: string;
  defaultShloka?: string;
  defaultMessage?: string;
  recommendedThemeIds: string[];
  colorTag: string;
}

export interface OccasionCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const OCCASION_CATEGORIES: OccasionCategory[] = [
  { id: 'ALL', label: 'All Occasions', icon: '✨', description: 'Browse all celebration types' },
  { id: 'WEDDING_RELATIONSHIP', label: 'Wedding & Love', icon: '💍', description: 'Weddings, Engagements, Anniversaries & Romance' },
  { id: 'BABY_CHILDREN', label: 'Baby & Kids', icon: '👶', description: 'Baby Showers, Mundan, Birthdays & Naming' },
  { id: 'RELIGIOUS_CULTURAL', label: 'Religious & Puja', icon: '🪔', description: 'Griha Pravesh, Havan, Katha, Festivals & Ceremonies' },
  { id: 'FAMILY_PERSONAL', label: 'Family & Milestones', icon: '🏡', description: 'Housewarmings, Reunions, Retirements & Milestones' },
  { id: 'CORPORATE_PROFESSIONAL', label: 'Corporate & Business', icon: '💼', description: 'Conferences, Summits, Launches & Annual Galas' },
  { id: 'EDUCATION', label: 'College & School', icon: '🎓', description: 'Convocations, Alumni Meets, Freshers & Farewell' },
  { id: 'SOCIAL_COMMUNITY', label: 'Social & Charity', icon: '🤝', description: 'Fundraisers, Galas, Sports & Community Meets' },
  { id: 'CELEBRATIONS_OTHER', label: 'Parties & Dining', icon: '🎉', description: 'Cocktail Evenings, Dinners & Custom Gatherings' },
];

export const MASTER_OCCASION_CATALOGUE: OccasionItem[] = [
  // ─── 1. WEDDING & RELATIONSHIP ─────────────────────────────────────────────
  {
    id: 'WEDDING',
    label: 'Wedding / Vivah',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '💍',
    defaultTitle: 'A Royal Celebration of Love',
    defaultVenue: 'The Taj Palace & Convention Resort',
    defaultShloka: '|| ॐ श्री गणेशाय नमः ||\nमङ्गलं भगवान् विष्णुः मङ्गलं गरुडध्वजः।',
    defaultMessage: 'Together with our families, we cordially invite you to celebrate our wedding. Your presence and blessings will make our special day complete.',
    recommendedThemeIds: ['romantic-blush', 'royal-palace', 'maharaja-gold', 'burgundy-velvet', 'floral-garden'],
    colorTag: 'from-rose-500 to-amber-500',
  },
  {
    id: 'ENGAGEMENT',
    label: 'Engagement / Roka Ceremony',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '💑',
    defaultTitle: 'Ring Ceremony & Roka Celebration',
    defaultVenue: 'The Heritage Club Lawns',
    defaultShloka: '|| श्री गणेशाय नमः ||',
    defaultMessage: 'We request the honour of your presence at the Engagement Ceremony as we exchange rings and begin our journey together.',
    recommendedThemeIds: ['blush-love', 'champagne-romance', 'royal-palace', 'minimal-luxury'],
    colorTag: 'from-pink-500 to-rose-400',
  },
  {
    id: 'SAGAI',
    label: 'Sagai / Ring Ceremony',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '💎',
    defaultTitle: 'Auspicious Sagai Ceremony',
    defaultVenue: 'Grand Banquet Pavilion',
    recommendedThemeIds: ['maharaja-gold', 'royal-palace', 'blush-love'],
    colorTag: 'from-amber-400 to-pink-500',
  },
  {
    id: 'HALDI',
    label: 'Haldi Ceremony',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '🌼',
    defaultTitle: 'Golden Haldi & Ubtan Ceremony',
    defaultVenue: 'Courtyard Poolside Lawns',
    defaultShloka: '|| शुभ विवाह ||',
    defaultMessage: 'Join us for a morning filled with turmeric, music, flowers, and joy as we celebrate the auspicious Haldi ceremony.',
    recommendedThemeIds: ['festive-gold', 'garden-sage', 'floral-garden', 'marigold-sunshine'],
    colorTag: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'MEHNDI',
    label: 'Mehndi Celebrations',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '🌿',
    defaultTitle: 'Vibrant Mehndi & Sangeet Evening',
    defaultVenue: 'Lakeside Garden Pavilion',
    recommendedThemeIds: ['garden-sage', 'floral-garden', 'marigold-sunshine', 'peacock-emerald'],
    colorTag: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'SANGEET',
    label: 'Sangeet & Musical Night',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '🎶',
    defaultTitle: 'Grand Sangeet & Dance Extravaganza',
    defaultVenue: 'Grand Ballroom & Stage',
    recommendedThemeIds: ['royal-palace', 'burgundy-velvet', 'neon-celebration', 'midnight-gold'],
    colorTag: 'from-purple-500 to-pink-500',
  },
  {
    id: 'RECEPTION',
    label: 'Wedding Reception',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '🥂',
    defaultTitle: 'Grand Wedding Reception & Dinner',
    defaultVenue: 'ITC Maurya Grand Ballroom',
    recommendedThemeIds: ['champagne-romance', 'royal-palace', 'minimal-luxury', 'burgundy-velvet'],
    colorTag: 'from-amber-300 to-rose-500',
  },
  {
    id: 'WEDDING_ANNIVERSARY',
    label: 'Wedding Anniversary',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '🌹',
    defaultTitle: 'Wedding Anniversary Celebration',
    defaultVenue: 'Skyline Terrace Lounge',
    recommendedThemeIds: ['romantic-blush', 'blush-love', 'champagne-romance', 'minimal-luxury'],
    colorTag: 'from-rose-500 to-pink-600',
  },
  {
    id: 'SILVER_JUBILEE',
    label: 'Silver Jubilee Anniversary (25 Years)',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '✨',
    defaultTitle: '25th Silver Jubilee Anniversary Gala',
    defaultVenue: 'The Oberoi Grand Hall',
    recommendedThemeIds: ['minimal-luxury', 'champagne-romance', 'royal-palace', 'maharaja-gold'],
    colorTag: 'from-slate-300 to-amber-400',
  },
  {
    id: 'GOLDEN_JUBILEE',
    label: 'Golden Jubilee Anniversary (50 Years)',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '👑',
    defaultTitle: '50 Golden Years of Love & Togetherness',
    defaultVenue: 'Imperial Heritage Palace',
    recommendedThemeIds: ['maharaja-gold', 'royal-palace', 'champagne-romance'],
    colorTag: 'from-amber-400 to-yellow-500',
  },
  {
    id: 'PROPOSAL',
    label: 'Marriage Proposal & Love Celebration',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '💖',
    defaultTitle: 'She Said Yes! Couple Celebration',
    defaultVenue: 'Candlelight Rooftop Vista',
    recommendedThemeIds: ['romantic-blush', 'blush-love', 'sunset-romance'],
    colorTag: 'from-rose-400 to-pink-500',
  },
  {
    id: 'VALENTINE',
    label: 'Valentine & Couple Gathering',
    category: 'WEDDING_RELATIONSHIP',
    categoryLabel: 'Wedding & Love',
    icon: '💌',
    defaultTitle: 'A Night of Romance & Wine',
    defaultVenue: 'Private Cellar & Garden',
    recommendedThemeIds: ['romantic-blush', 'burgundy-velvet', 'sunset-romance'],
    colorTag: 'from-red-500 to-rose-600',
  },

  // ─── 2. BABY & CHILDREN ───────────────────────────────────────────────────
  {
    id: 'BABY_SHOWER',
    label: 'Baby Shower / Godh Bharai',
    category: 'BABY_CHILDREN',
    categoryLabel: 'Baby & Kids',
    icon: '🍼',
    defaultTitle: 'Godh Bharai & Baby Shower Celebration',
    defaultVenue: 'Sunlit Glasshouse Pavilion',
    defaultShloka: '|| ॐ श्री गणेशाय नमः ||',
    defaultMessage: 'A little miracle is on the way! Join us as we shower our mother-to-be with love, blessings, and joyful celebration.',
    recommendedThemeIds: ['baby-pastel', 'garden-sage', 'blush-love', 'floral-garden'],
    colorTag: 'from-pink-300 to-teal-300',
  },
  {
    id: 'MUNDAN',
    label: 'Mundan / Chudakarana Sanskar',
    category: 'BABY_CHILDREN',
    categoryLabel: 'Baby & Kids',
    icon: '👶',
    defaultTitle: "Auspicious Mundan Sanskar Ceremony",
    defaultVenue: 'Sacred Riverfront Pavilion',
    defaultShloka: '|| श्री गणेशाय नमः ||\nआयुष्मान् भव सौम्य!',
    defaultMessage: "We seek your gracious presence and blessings on the sacred occasion of our child's Mundan Sanskar ceremony.",
    recommendedThemeIds: ['traditional-mandala', 'festive-gold', 'baby-pastel', 'marigold-sunshine'],
    colorTag: 'from-amber-400 to-orange-400',
  },
  {
    id: 'NAAMKARAN',
    label: 'Naamkaran / Naming Ceremony',
    category: 'BABY_CHILDREN',
    categoryLabel: 'Baby & Kids',
    icon: '🌟',
    defaultTitle: 'Sacred Naamkaran Ceremony',
    defaultVenue: 'Family Courtyard & Temple Lawns',
    defaultShloka: '|| ॐ नमः शिवाय ||',
    defaultMessage: 'Please join us to bless our newborn baby as we announce and bestow their sacred name.',
    recommendedThemeIds: ['baby-pastel', 'traditional-mandala', 'garden-sage'],
    colorTag: 'from-sky-400 to-amber-300',
  },
  {
    id: 'ANNAPRASHAN',
    label: 'Annaprashan / First Rice Ceremony',
    category: 'BABY_CHILDREN',
    categoryLabel: 'Baby & Kids',
    icon: '🥣',
    defaultTitle: "Baby's First Grain & Annaprashan",
    defaultVenue: 'Heritage Dining Pavilion',
    recommendedThemeIds: ['baby-pastel', 'traditional-mandala', 'garden-sage'],
    colorTag: 'from-yellow-400 to-amber-400',
  },
  {
    id: 'FIRST_BIRTHDAY',
    label: '1st Birthday Celebration',
    category: 'BABY_CHILDREN',
    categoryLabel: 'Baby & Kids',
    icon: '🎂',
    defaultTitle: 'Turning One! 1st Birthday Bash',
    defaultVenue: 'Wonderland Party Lawns',
    recommendedThemeIds: ['baby-pastel', 'neon-celebration', 'midnight-gold'],
    colorTag: 'from-cyan-400 to-pink-400',
  },
  {
    id: 'BIRTHDAY',
    label: 'Birthday Party',
    category: 'BABY_CHILDREN',
    categoryLabel: 'Baby & Kids',
    icon: '🎈',
    defaultTitle: 'Birthday Party Celebration',
    defaultVenue: 'The Sky Garden Club',
    recommendedThemeIds: ['midnight-gold', 'neon-celebration', 'champagne-romance', 'minimal-luxury'],
    colorTag: 'from-purple-500 to-amber-400',
  },
  {
    id: 'MILESTONE_BIRTHDAY',
    label: 'Milestone Birthday (18th, 30th, 50th, 60th)',
    category: 'BABY_CHILDREN',
    categoryLabel: 'Baby & Kids',
    icon: '🎉',
    defaultTitle: 'Milestone Birthday Gala Celebration',
    defaultVenue: 'Grand Regency Ballroom',
    recommendedThemeIds: ['midnight-gold', 'royal-palace', 'minimal-luxury', 'champagne-romance'],
    colorTag: 'from-amber-400 to-rose-500',
  },

  // ─── 3. RELIGIOUS & CULTURAL ──────────────────────────────────────────────
  {
    id: 'GRIHA_PRAVESH',
    label: 'Griha Pravesh & Housewarming Puja',
    category: 'RELIGIOUS_CULTURAL',
    categoryLabel: 'Religious & Puja',
    icon: '🏠',
    defaultTitle: 'Griha Pravesh & Auspicious Vastu Puja',
    defaultVenue: 'Our New Residence',
    defaultShloka: '|| ॐ श्री गणेशाय नमः ||\nगृहप्रवेशे शुभम् अस्तु।',
    defaultMessage: 'By the grace of the Almighty, we are stepping into our new home. We invite you to join us for the Griha Pravesh Puja and blessing ceremony.',
    recommendedThemeIds: ['traditional-mandala', 'festive-gold', 'maharaja-gold', 'garden-sage'],
    colorTag: 'from-amber-500 to-orange-500',
  },
  {
    id: 'SATYANARAYAN_KATHA',
    label: 'Shri Satyanarayan Katha & Puja',
    category: 'RELIGIOUS_CULTURAL',
    categoryLabel: 'Religious & Puja',
    icon: '🪔',
    defaultTitle: 'Shri Satyanarayan Bhagwan Katha & Mahaprasad',
    defaultVenue: 'Residence Temple Courtyard',
    defaultShloka: '|| श्री सत्यनारायणाय नमः ||',
    defaultMessage: 'We cordially invite you with your family to attend the holy Shri Satyanarayan Katha and partake in the Mahaprasad.',
    recommendedThemeIds: ['traditional-mandala', 'festive-gold', 'maharaja-gold'],
    colorTag: 'from-yellow-500 to-amber-600',
  },
  {
    id: 'GANESH_PUJA',
    label: 'Ganesh Utsav & Puja',
    category: 'RELIGIOUS_CULTURAL',
    categoryLabel: 'Religious & Puja',
    icon: '🐘',
    defaultTitle: 'Ganesh Sthapana & Divine Aarti',
    defaultVenue: 'Community Mandapam',
    defaultShloka: '|| वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ||',
    recommendedThemeIds: ['traditional-mandala', 'festive-gold', 'royal-palace'],
    colorTag: 'from-orange-500 to-red-500',
  },
  {
    id: 'HAVAN_PUJA',
    label: 'Havan & Shanti Puja',
    category: 'RELIGIOUS_CULTURAL',
    categoryLabel: 'Religious & Puja',
    icon: '🔥',
    defaultTitle: 'Maha Yagya & Navagraha Shanti Havan',
    defaultVenue: 'Sacred Havan Mandap',
    defaultShloka: '|| ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं ||',
    recommendedThemeIds: ['traditional-mandala', 'festive-gold'],
    colorTag: 'from-amber-600 to-red-600',
  },
  {
    id: 'DIWALI',
    label: 'Diwali Celebration & Lakshmi Puja',
    category: 'RELIGIOUS_CULTURAL',
    categoryLabel: 'Religious & Puja',
    icon: '🪔',
    defaultTitle: 'Deepavali Light & Lakshmi Puja Evening',
    defaultVenue: 'Family Villa & Garden',
    recommendedThemeIds: ['festive-gold', 'maharaja-gold', 'traditional-mandala'],
    colorTag: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'JAGRAN_BHAJAN',
    label: 'Mata Ka Jagran / Bhajan Sandhya',
    category: 'RELIGIOUS_CULTURAL',
    categoryLabel: 'Religious & Puja',
    icon: '🌺',
    defaultTitle: 'Mata Ki Chowki & Divine Bhajan Sandhya',
    defaultVenue: 'Divine Spiritual Hall',
    defaultShloka: '|| जय माता दी ||',
    recommendedThemeIds: ['traditional-mandala', 'festive-gold', 'royal-palace'],
    colorTag: 'from-red-600 to-amber-500',
  },

  // ─── 4. FAMILY & PERSONAL ─────────────────────────────────────────────────
  {
    id: 'FAMILY_REUNION',
    label: 'Family Gathering & Reunion',
    category: 'FAMILY_PERSONAL',
    categoryLabel: 'Family & Milestones',
    icon: '🏡',
    defaultTitle: 'Annual Grand Family Reunion',
    defaultVenue: 'Heritage Country Club & Farmstay',
    defaultMessage: 'Reconnecting roots and making memories! Join us for a delightful weekend of laughter, food, and family nostalgia.',
    recommendedThemeIds: ['garden-sage', 'minimal-luxury', 'champagne-romance'],
    colorTag: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'RETIREMENT',
    label: 'Retirement Celebration',
    category: 'FAMILY_PERSONAL',
    categoryLabel: 'Family & Milestones',
    icon: '🏅',
    defaultTitle: 'Honouring an Exemplary Career & Retirement Gala',
    defaultVenue: 'The Grand Club Banquet',
    recommendedThemeIds: ['minimal-luxury', 'corporate-executive', 'champagne-romance'],
    colorTag: 'from-amber-600 to-slate-700',
  },
  {
    id: 'FAREWELL',
    label: 'Farewell / Bon Voyage Party',
    category: 'FAMILY_PERSONAL',
    categoryLabel: 'Family & Milestones',
    icon: '✈️',
    defaultTitle: 'Wishing You New Horizons — Farewell Gathering',
    defaultVenue: 'The Verandah Cafe & Lounge',
    recommendedThemeIds: ['sunset-romance', 'minimal-luxury', 'garden-sage'],
    colorTag: 'from-sky-500 to-indigo-600',
  },
  {
    id: 'ACHIEVEMENT_SUCCESS',
    label: 'Achievement & Success Celebration',
    category: 'FAMILY_PERSONAL',
    categoryLabel: 'Family & Milestones',
    icon: '🏆',
    defaultTitle: 'Celebration of Success & Achievement',
    defaultVenue: 'Skyline Terrace Lounge',
    recommendedThemeIds: ['midnight-gold', 'minimal-luxury', 'royal-palace'],
    colorTag: 'from-amber-400 to-emerald-500',
  },

  // ─── 5. CORPORATE & PROFESSIONAL ──────────────────────────────────────────
  {
    id: 'BUSINESS_CONFERENCE',
    label: 'Business / Corporate Conference',
    category: 'CORPORATE_PROFESSIONAL',
    categoryLabel: 'Corporate & Business',
    icon: '💼',
    defaultTitle: 'Annual Leadership & Innovation Conference',
    defaultVenue: 'Grand Hyatt Convention Centre',
    defaultMessage: 'Join global leaders, industry pioneers, and visionaries for an inspiring day of keynotes, panel debates, and executive networking.',
    recommendedThemeIds: ['corporate-executive', 'minimal-luxury', 'tech-modern'],
    colorTag: 'from-slate-700 to-blue-900',
  },
  {
    id: 'PRODUCT_LAUNCH',
    label: 'Product / Brand Launch',
    category: 'CORPORATE_PROFESSIONAL',
    categoryLabel: 'Corporate & Business',
    icon: '🚀',
    defaultTitle: 'Next-Gen Product Reveal & Launch Gala',
    defaultVenue: 'Innovation Hub Auditorium',
    recommendedThemeIds: ['tech-modern', 'corporate-executive', 'midnight-gold'],
    colorTag: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'ANNUAL_DAY_AWARDS',
    label: 'Annual Day & Excellence Awards',
    category: 'CORPORATE_PROFESSIONAL',
    categoryLabel: 'Corporate & Business',
    icon: '🎖️',
    defaultTitle: 'Annual Corporate Awards & Gala Dinner',
    defaultVenue: 'The Westin Grand Ballroom',
    recommendedThemeIds: ['corporate-executive', 'royal-palace', 'midnight-gold'],
    colorTag: 'from-amber-500 to-slate-900',
  },
  {
    id: 'NETWORKING_MEET',
    label: 'Business Meet & Leadership Summit',
    category: 'CORPORATE_PROFESSIONAL',
    categoryLabel: 'Corporate & Business',
    icon: '🤝',
    defaultTitle: 'Executive Leadership Roundtable & Dinner',
    defaultVenue: 'Private Members Club',
    recommendedThemeIds: ['minimal-luxury', 'corporate-executive'],
    colorTag: 'from-slate-600 to-blue-700',
  },

  // ─── 6. EDUCATION ─────────────────────────────────────────────────────────
  {
    id: 'GRADUATION_CONVOCATION',
    label: 'Graduation & Convocation Ceremony',
    category: 'EDUCATION',
    categoryLabel: 'College & School',
    icon: '🎓',
    defaultTitle: 'University Graduation & Convocation Gala',
    defaultVenue: 'University Grand Amphitheatre',
    defaultMessage: 'Celebrating dedication, perseverance, and triumph. We invite you to witness our class of graduates receive their honours.',
    recommendedThemeIds: ['minimal-luxury', 'corporate-executive', 'midnight-gold'],
    colorTag: 'from-blue-700 to-indigo-900',
  },
  {
    id: 'ALUMNI_MEET',
    label: 'Alumni Reunion & Homecoming',
    category: 'EDUCATION',
    categoryLabel: 'College & School',
    icon: '🏛️',
    defaultTitle: 'Grand Alumni Homecoming & Reunion Gala',
    defaultVenue: 'Campus Central Quadrangle',
    recommendedThemeIds: ['garden-sage', 'minimal-luxury', 'champagne-romance'],
    colorTag: 'from-amber-600 to-blue-700',
  },

  // ─── 7. SOCIAL & COMMUNITY ────────────────────────────────────────────────
  {
    id: 'CHARITY_GALA',
    label: 'Charity Gala & Fundraiser',
    category: 'SOCIAL_COMMUNITY',
    categoryLabel: 'Social & Charity',
    icon: '🎗️',
    defaultTitle: 'Annual Hope & Harmony Charity Gala',
    defaultVenue: 'Crystal Pavilion Ballroom',
    recommendedThemeIds: ['minimal-luxury', 'champagne-romance', 'royal-palace'],
    colorTag: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'COMMUNITY_MEET',
    label: 'Community & Cultural Gathering',
    category: 'SOCIAL_COMMUNITY',
    categoryLabel: 'Social & Charity',
    icon: '🤝',
    defaultTitle: 'Community Cultural Festival & Banquet',
    defaultVenue: 'Civic Centre Auditorium',
    recommendedThemeIds: ['festive-gold', 'traditional-mandala', 'garden-sage'],
    colorTag: 'from-orange-500 to-amber-600',
  },

  // ─── 8. CELEBRATIONS & OTHER ──────────────────────────────────────────────
  {
    id: 'DINNER_PARTY',
    label: 'Dinner Party & Cocktails',
    category: 'CELEBRATIONS_OTHER',
    categoryLabel: 'Parties & Dining',
    icon: '🍷',
    defaultTitle: 'An Evening of Fine Dining & Wine',
    defaultVenue: 'Private Dining Room & Terrace',
    recommendedThemeIds: ['champagne-romance', 'midnight-gold', 'burgundy-velvet'],
    colorTag: 'from-rose-800 to-purple-900',
  },
  {
    id: 'SURPRISE_PARTY',
    label: 'Surprise Party',
    category: 'CELEBRATIONS_OTHER',
    categoryLabel: 'Parties & Dining',
    icon: '🎊',
    defaultTitle: 'Top Secret! Surprise Celebration',
    defaultVenue: 'The Secret Garden Lounge',
    recommendedThemeIds: ['neon-celebration', 'midnight-gold', 'blush-love'],
    colorTag: 'from-purple-600 to-pink-500',
  },
  {
    id: 'CUSTOM_EVENT',
    label: 'Custom Occasion',
    category: 'CELEBRATIONS_OTHER',
    categoryLabel: 'Parties & Dining',
    icon: '➕',
    defaultTitle: 'A Special Celebration with Loved Ones',
    defaultVenue: 'Celebration Venue',
    recommendedThemeIds: ['romantic-blush', 'maharaja-gold', 'minimal-luxury', 'midnight-gold'],
    colorTag: 'from-slate-600 to-amber-500',
  },
];

/**
 * Fast search and filter function for occasions (Zero API latency)
 */
export const searchOccasions = (query: string = '', categoryId: string = 'ALL'): OccasionItem[] => {
  const cleanQuery = query.trim().toLowerCase();

  return MASTER_OCCASION_CATALOGUE.filter((item) => {
    // 1. Category Filter
    if (categoryId !== 'ALL' && item.category !== categoryId) {
      return false;
    }

    // 2. Text Search
    if (!cleanQuery) return true;

    return (
      item.label.toLowerCase().includes(cleanQuery) ||
      item.categoryLabel.toLowerCase().includes(cleanQuery) ||
      item.defaultTitle.toLowerCase().includes(cleanQuery)
    );
  });
};

/**
 * Get occasion item by ID with fallback
 */
export const getOccasionById = (id: string): OccasionItem => {
  const match = MASTER_OCCASION_CATALOGUE.find(
    (item) => item.id.toUpperCase() === (id || '').toUpperCase()
  );
  return match || MASTER_OCCASION_CATALOGUE[0];
};
