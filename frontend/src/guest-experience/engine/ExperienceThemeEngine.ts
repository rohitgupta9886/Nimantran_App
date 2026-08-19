export interface ExperienceTheme {
  id: string;
  name: string;
  occasion: string;
  palette: {
    primaryBg: string;
    cardBg: string;
    cardBorder: string;
    accentGold: string;
    accentSecondary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    shadowGlow: string;
    badgeBg: string;
    badgeBorder: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    vedicHeader: string;
  };
  openingStyle: 'ROYAL_ENVELOPE_DOVE' | 'GIFT_BOX_CONFETTI' | 'SACRED_LOTUS' | 'GLASS_GEOMETRIC';
  sealEmblem: string;
  particleType: 'PETALS_STARDUST' | 'CONFETTI_BALLOONS' | 'LOTUS_SPARKLES' | 'GEOMETRIC_LIGHT';
}

export const getExperienceTheme = (eventType?: string, customThemeId?: string): ExperienceTheme => {
  const normType = (eventType || 'WEDDING').toUpperCase();

  switch (normType) {
    case 'BIRTHDAY':
      return {
        id: 'birthday-celebration-luxe',
        name: 'Festive Birthday Stardust',
        occasion: 'BIRTHDAY',
        palette: {
          primaryBg: 'linear-gradient(135deg, #090D16 0%, #151C2E 50%, #080B12 100%)',
          cardBg: 'linear-gradient(135deg, rgba(20, 27, 45, 0.95) 0%, rgba(10, 14, 25, 0.98) 100%)',
          cardBorder: '#F59E0B',
          accentGold: '#F59E0B',
          accentSecondary: '#EC4899',
          textPrimary: '#FFFFFF',
          textSecondary: '#FDE68A',
          textMuted: '#94A3B8',
          shadowGlow: 'rgba(245, 158, 11, 0.35)',
          badgeBg: 'rgba(15, 23, 42, 0.75)',
          badgeBorder: 'rgba(245, 158, 11, 0.6)',
        },
        typography: {
          headingFont: 'font-serif',
          bodyFont: 'font-sans',
          vedicHeader: '✦ A SPECIAL CELEBRATION ✦',
        },
        openingStyle: 'GIFT_BOX_CONFETTI',
        sealEmblem: '🎂',
        particleType: 'CONFETTI_BALLOONS',
      };

    case 'MUNDAN':
    case 'BABY_SHOWER':
    case 'NAMING_CEREMONY':
      return {
        id: 'mundan-sacred-gold',
        name: 'Sacred Sanskar & Blessings',
        occasion: 'MUNDAN',
        palette: {
          primaryBg: 'linear-gradient(135deg, #1C0A00 0%, #2E1200 50%, #120600 100%)',
          cardBg: 'linear-gradient(135deg, rgba(50, 20, 5, 0.95) 0%, rgba(25, 10, 2, 0.98) 100%)',
          cardBorder: '#F59E0B',
          accentGold: '#F59E0B',
          accentSecondary: '#FB923C',
          textPrimary: '#FFFDF9',
          textSecondary: '#FED7AA',
          textMuted: '#D97706',
          shadowGlow: 'rgba(245, 158, 11, 0.4)',
          badgeBg: 'rgba(28, 10, 0, 0.75)',
          badgeBorder: 'rgba(245, 158, 11, 0.6)',
        },
        typography: {
          headingFont: 'font-serif',
          bodyFont: 'font-sans',
          vedicHeader: '|| ॐ श्री गणेशाय नमः ||',
        },
        openingStyle: 'SACRED_LOTUS',
        sealEmblem: 'ॐ',
        particleType: 'LOTUS_SPARKLES',
      };

    case 'ANNIVERSARY':
      return {
        id: 'anniversary-rose-gold',
        name: 'Romantic Crimson & Rose Gold',
        occasion: 'ANNIVERSARY',
        palette: {
          primaryBg: 'linear-gradient(135deg, #24050D 0%, #3D0A18 50%, #170308 100%)',
          cardBg: 'linear-gradient(135deg, rgba(55, 12, 25, 0.95) 0%, rgba(28, 6, 12, 0.98) 100%)',
          cardBorder: '#F43F5E',
          accentGold: '#FDE68A',
          accentSecondary: '#FB7185',
          textPrimary: '#FFFDF9',
          textSecondary: '#FECDD3',
          textMuted: '#FDA4AF',
          shadowGlow: 'rgba(244, 63, 94, 0.35)',
          badgeBg: 'rgba(36, 5, 13, 0.75)',
          badgeBorder: 'rgba(251, 113, 133, 0.6)',
        },
        typography: {
          headingFont: 'font-serif',
          bodyFont: 'font-sans',
          vedicHeader: '✦ CELEBRATING LOVE & TOGETHERNESS ✦',
        },
        openingStyle: 'ROYAL_ENVELOPE_DOVE',
        sealEmblem: '❤️',
        particleType: 'PETALS_STARDUST',
      };

    case 'CORPORATE':
    case 'CONFERENCE':
      return {
        id: 'corporate-titanium-luxe',
        name: 'Executive Titanium & Gold',
        occasion: 'CORPORATE',
        palette: {
          primaryBg: 'linear-gradient(135deg, #0B0F19 0%, #111827 50%, #070A10 100%)',
          cardBg: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(9, 13, 20, 0.98) 100%)',
          cardBorder: '#38BDF8',
          accentGold: '#38BDF8',
          accentSecondary: '#818CF8',
          textPrimary: '#F8FAFC',
          textSecondary: '#BAE6FD',
          textMuted: '#64748B',
          shadowGlow: 'rgba(56, 189, 248, 0.3)',
          badgeBg: 'rgba(15, 23, 42, 0.75)',
          badgeBorder: 'rgba(56, 189, 248, 0.5)',
        },
        typography: {
          headingFont: 'font-sans',
          bodyFont: 'font-sans',
          vedicHeader: '✦ EXECUTIVE SUMMIT & GALA ✦',
        },
        openingStyle: 'GLASS_GEOMETRIC',
        sealEmblem: '✦',
        particleType: 'GEOMETRIC_LIGHT',
      };

    case 'WEDDING':
    case 'ENGAGEMENT':
    default:
      return {
        id: 'wedding-royal-heritage',
        name: 'Royal Heritage Velvet & Gold',
        occasion: 'WEDDING',
        palette: {
          primaryBg: 'linear-gradient(135deg, #1C0309 0%, #300611 50%, #100205 100%)',
          cardBg: 'linear-gradient(135deg, rgba(50, 10, 22, 0.95) 0%, rgba(25, 4, 10, 0.98) 100%)',
          cardBorder: '#F59E0B',
          accentGold: '#F59E0B',
          accentSecondary: '#F43F5E',
          textPrimary: '#FFFDF9',
          textSecondary: '#FDE68A',
          textMuted: '#D97706',
          shadowGlow: 'rgba(245, 158, 11, 0.4)',
          badgeBg: 'rgba(28, 3, 9, 0.75)',
          badgeBorder: 'rgba(245, 158, 11, 0.6)',
        },
        typography: {
          headingFont: 'font-serif',
          bodyFont: 'font-sans',
          vedicHeader: '|| ॐ श्री गणेशाय नमः ||',
        },
        openingStyle: 'ROYAL_ENVELOPE_DOVE',
        sealEmblem: 'ॐ',
        particleType: 'PETALS_STARDUST',
      };
  }
};
