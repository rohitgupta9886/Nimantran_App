export type CelebrationCategory =
  | 'WEDDING'
  | 'ROMANCE'
  | 'BIRTHDAY'
  | 'BABY_SACRED'
  | 'DEVOTIONAL'
  | 'CORPORATE'
  | 'OTHER';

export interface CelebrationConfig {
  category: CelebrationCategory;
  heroTag: string;
  salutationPrefix: string;
  giftBoxTag: string;
  giftBoxCta: string;
  giftBoxOpenedBadge: string;
  rsvpQuestion: string;
  rsvpYesCta: string;
  rsvpMaybeCta: string;
  rsvpNoCta: string;
  shagunButtonText: string;
  shagunModalTitle: string;
  closingSalutation: string;
  themeColors: {
    bgGradStart: string;
    bgGradMid: string;
    bgGradEnd: string;
    primary: string;
    accent: string;
    highlight: string;
  };
}

export function getCelebrationCategory(eventType: string = ''): CelebrationCategory {
  const type = (eventType || '').toUpperCase().trim();

  if (['WEDDING', 'RECEPTION', 'SAGAI', 'ENGAGEMENT', 'SANGEET', 'MEHNDI', 'HALDI'].includes(type)) {
    return 'WEDDING';
  }
  if (['ANNIVERSARY', 'VALENTINE'].includes(type)) {
    return 'ROMANCE';
  }
  if (['BIRTHDAY', 'FIRST_BIRTHDAY'].includes(type)) {
    return 'BIRTHDAY';
  }
  if (['MUNDAN', 'BABY_SHOWER', 'NAAMKARAN', 'ANNAPRASHAN'].includes(type)) {
    return 'BABY_SACRED';
  }
  if (['PUJA', 'HAVAN', 'KATHA', 'JAGRAN', 'GRIHA_PRAVESH', 'HOUSEWARMING', 'RELIGIOUS'].includes(type)) {
    return 'DEVOTIONAL';
  }
  if (['CORPORATE', 'CONFERENCE', 'CONVOCATION', 'GRADUATION', 'RETIREMENT'].includes(type)) {
    return 'CORPORATE';
  }
  return 'OTHER';
}

export function getCelebrationConfig(
  eventType: string = '',
  hostName: string = '',
  celebrantOrCouple: string = ''
): CelebrationConfig {
  const category = getCelebrationCategory(eventType);

  switch (category) {
    case 'WEDDING':
      return {
        category,
        heroTag: 'ROYAL WEDDING CELEBRATION',
        salutationPrefix: 'Together With Their Families',
        giftBoxTag: 'A Royal Wedding Invitation',
        giftBoxCta: 'TAP TO OPEN INVITATION',
        giftBoxOpenedBadge: 'INVITATION UNLOCKED ✓',
        rsvpQuestion: 'Will You Celebrate With Us?',
        rsvpYesCta: "❤️ YES, I'LL BE THERE",
        rsvpMaybeCta: '🤍 MAYBE',
        rsvpNoCta: "SORRY, CAN'T MAKE IT",
        shagunButtonText: '🎁 BLESSINGS & DIGITAL SHAGUN (UPI)',
        shagunModalTitle: 'Send Blessings & Shagun',
        closingSalutation: celebrantOrCouple ? `With Love, ${celebrantOrCouple}` : `With Warm Regards, ${hostName || 'The Family'}`,
        themeColors: {
          bgGradStart: '#4A1022',
          bgGradMid: '#2A0815',
          bgGradEnd: '#0D0206',
          primary: '#7A1F3D',
          accent: '#D6AA61',
          highlight: '#F0D7A4',
        },
      };

    case 'ROMANCE':
      return {
        category,
        heroTag: 'ANNIVERSARY CELEBRATION',
        salutationPrefix: 'Celebrating Together In Love',
        giftBoxTag: 'A Special Milestone Celebration',
        giftBoxCta: 'TAP TO OPEN INVITATION',
        giftBoxOpenedBadge: 'INVITATION UNLOCKED ✓',
        rsvpQuestion: 'Will You Join Our Celebration?',
        rsvpYesCta: "🥂 YES, WE'LL BE THERE",
        rsvpMaybeCta: '🤍 MAYBE',
        rsvpNoCta: "SORRY, CAN'T MAKE IT",
        shagunButtonText: '🎁 BLESSINGS & SHAGUN (UPI)',
        shagunModalTitle: 'Send Warm Wishes & Shagun',
        closingSalutation: celebrantOrCouple ? `With Warm Love, ${celebrantOrCouple}` : `With Love, ${hostName || 'The Family'}`,
        themeColors: {
          bgGradStart: '#4A1022',
          bgGradMid: '#2A0815',
          bgGradEnd: '#0D0206',
          primary: '#7A1F3D',
          accent: '#D6AA61',
          highlight: '#F0D7A4',
        },
      };

    case 'BIRTHDAY':
      return {
        category,
        heroTag: 'BIRTHDAY BASH CELEBRATION',
        salutationPrefix: 'You Are Warmly Invited To Celebrate',
        giftBoxTag: 'A Special Birthday Invitation',
        giftBoxCta: 'TAP TO UNWRAP INVITATION',
        giftBoxOpenedBadge: 'PARTY INVITATION OPENED 🎉',
        rsvpQuestion: 'Will You Join The Party?',
        rsvpYesCta: "🎉 YES, COUNT ME IN!",
        rsvpMaybeCta: '🤔 MAYBE',
        rsvpNoCta: "SORRY, CAN'T ATTEND",
        shagunButtonText: '🎁 BIRTHDAY BLESSINGS & SHAGUN (UPI)',
        shagunModalTitle: 'Send Birthday Blessings & Gift',
        closingSalutation: `With Excitement & Love, ${hostName || celebrantOrCouple || 'The Family'}`,
        themeColors: {
          bgGradStart: '#2F124D',
          bgGradMid: '#1A082E',
          bgGradEnd: '#0B0217',
          primary: '#6D28D9',
          accent: '#F59E0B',
          highlight: '#FDE68A',
        },
      };

    case 'BABY_SACRED':
      return {
        category,
        heroTag: 'AUSPICIOUS SANSKAR CELEBRATION',
        salutationPrefix: 'With Divine Blessings',
        giftBoxTag: 'A Sacred Celebration Invitation',
        giftBoxCta: 'TAP TO OPEN AUSPICIOUS CARD',
        giftBoxOpenedBadge: 'BLESSING INVITATION OPENED 🙏',
        rsvpQuestion: 'Will You Grace Us With Your Presence?',
        rsvpYesCta: "🙏 YES, WILL ATTEND",
        rsvpMaybeCta: '🤍 MAYBE',
        rsvpNoCta: "SORRY, UNABLE TO JOIN",
        shagunButtonText: '🙏 BLESSINGS FOR THE CHILD & SHAGUN (UPI)',
        shagunModalTitle: 'Blessings for the Child',
        closingSalutation: `विनीतः एवं दर्शनाभिलाषी: ${hostName || 'समस्त परिवार'}`,
        themeColors: {
          bgGradStart: '#421E06',
          bgGradMid: '#240F02',
          bgGradEnd: '#0D0500',
          primary: '#B45309',
          accent: '#FBBF24',
          highlight: '#FEF3C7',
        },
      };

    case 'DEVOTIONAL':
      return {
        category,
        heroTag: 'DEVOTIONAL GATHERING & PUJA',
        salutationPrefix: '|| ॐ श्री गणेशाय नमः ||',
        giftBoxTag: 'पावन निमंत्रण पत्र',
        giftBoxCta: 'शुभ निमंत्रण खोलें',
        giftBoxOpenedBadge: 'शुभ निमंत्रण स्वीकृत 🙏',
        rsvpQuestion: 'क्या आप इस पावन अवसर पर पधारेंगे?',
        rsvpYesCta: "🙏 जी हाँ, अवश्य पधारेंगे",
        rsvpMaybeCta: '🤍 यथासंभव प्रयास',
        rsvpNoCta: "असमर्थ हैं",
        shagunButtonText: '🙏 पावन भेंट एवं सेवा (UPI)',
        shagunModalTitle: 'पावन भेंट एवं समर्पण',
        closingSalutation: `विनीतः: ${hostName || 'समस्त परिवार'}`,
        themeColors: {
          bgGradStart: '#451000',
          bgGradMid: '#260800',
          bgGradEnd: '#0F0300',
          primary: '#C2410C',
          accent: '#F59E0B',
          highlight: '#FDE68A',
        },
      };

    case 'CORPORATE':
      return {
        category,
        heroTag: 'OFFICIAL INVITATION',
        salutationPrefix: 'Cordially Invites You',
        giftBoxTag: 'Exclusive Event Invitation',
        giftBoxCta: 'TAP TO VIEW INVITATION',
        giftBoxOpenedBadge: 'INVITATION VERIFIED ✓',
        rsvpQuestion: 'Will You Be Attending?',
        rsvpYesCta: "✓ YES, I WILL ATTEND",
        rsvpMaybeCta: 'TENTATIVE',
        rsvpNoCta: 'UNABLE TO ATTEND',
        shagunButtonText: '💼 SPONSORSHIPS & CONTRIBUTIONS (UPI)',
        shagunModalTitle: 'Event Contributions',
        closingSalutation: `With Warm Regards, ${hostName || 'Organizing Committee'}`,
        themeColors: {
          bgGradStart: '#0F172A',
          bgGradMid: '#090D1A',
          bgGradEnd: '#020617',
          primary: '#1E293B',
          accent: '#38BDF8',
          highlight: '#BAE6FD',
        },
      };

    default:
      return {
        category: 'OTHER',
        heroTag: 'SPECIAL CELEBRATION',
        salutationPrefix: 'Cordially Invites You',
        giftBoxTag: 'A Special Celebration Invitation',
        giftBoxCta: 'TAP TO OPEN INVITATION',
        giftBoxOpenedBadge: 'INVITATION OPENED ✓',
        rsvpQuestion: 'Will You Join Our Celebration?',
        rsvpYesCta: "✨ YES, I'LL BE THERE",
        rsvpMaybeCta: '🤍 MAYBE',
        rsvpNoCta: "SORRY, CAN'T MAKE IT",
        shagunButtonText: '🎁 BLESSINGS & SHAGUN (UPI)',
        shagunModalTitle: 'Send Blessings & Shagun',
        closingSalutation: `With Warm Regards, ${hostName || 'The Host Family'}`,
        themeColors: {
          bgGradStart: '#350D1D',
          bgGradMid: '#1E060F',
          bgGradEnd: '#080104',
          primary: '#7A1F3D',
          accent: '#D6AA61',
          highlight: '#F0D7A4',
        },
      };
  }
}
