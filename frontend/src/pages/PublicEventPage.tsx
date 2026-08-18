import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { apiFetch } from '../services/api';
import { ExperienceLoader } from '../guest-experience/loader/ExperienceLoader';
import { GuestExperience } from '../guest-experience/GuestExperience';

export const PublicEventPage: React.FC = () => {
  const { slug, token } = useParams<{ slug?: string; token?: string }>();
  const [data, setData] = useState<any>(null);
  const [guestPersonalization, setGuestPersonalization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Generate dynamic celebration data if API is offline or slug is a custom preview link
  const createFallbackCelebration = (targetSlug?: string, targetToken?: string) => {
    const raw = (targetSlug || targetToken || 'rohit-priya-wedding-2026').toLowerCase();
    
    let eventType = 'WEDDING';
    let title = 'Rohit & Priyanka';
    let hindiTitle = '|| शुभ विवाह • श्री गणेशाय नमः ||';
    let hostName = 'गुप्ता एवं शर्मा परिवार';
    let venueName = 'The Royal Grand Palace';
    let venueAddress = 'Grand Ballroom, MG Road, New Delhi';

    if (raw.includes('mudit') || raw.includes('anukriti')) {
      title = 'Mudit & Anukriti';
      eventType = 'WEDDING';
      hindiTitle = '|| शुभ विवाह • ॐ श्री गणेशाय नमः ||';
      hostName = 'समस्त परिवार';
      venueName = 'The Heritage Palace';
      venueAddress = 'Main Pavilion, Palace Grounds, New Delhi';
    } else if (raw.includes('birthday') || raw.includes('aditya')) {
      eventType = 'BIRTHDAY';
      title = 'Aditya\'s 25th Birthday Gala';
      hindiTitle = '✦ जन्मदिन की हार्दिक शुभकामनाएँ ✦';
      hostName = 'The Verma Family';
      venueName = 'Skyline Rooftop Lounge';
      venueAddress = '100 Feet Road, Indiranagar, Bengaluru';
    } else if (raw.includes('sangeet') || raw.includes('ananya') || raw.includes('vikram')) {
      eventType = 'SANGEET';
      title = 'Ananya & Vikram Sangeet Night';
      hindiTitle = '|| संगीत संध्या • सुर और ताल ||';
      hostName = 'Singhania Family';
      venueName = 'The Imperial Ballroom';
      venueAddress = 'Janpath, Connaught Place, New Delhi';
    } else if (raw.includes('mundan') || raw.includes('aarav')) {
      eventType = 'MUNDAN';
      title = 'Aarav\'s Mundan Sanskar';
      hindiTitle = '|| मुंडन संस्कार • ॐ नमः शिवाय ||';
      hostName = 'The Mishra Family';
      venueName = 'Shri Krishna Dham Mandir Hall';
      venueAddress = 'Vrindavan Enclave, Lucknow';
    } else if (raw.includes('tech') || raw.includes('summit') || raw.includes('corporate')) {
      eventType = 'CORPORATE';
      title = 'Nimantran AI Tech Summit 2026';
      hindiTitle = '✦ ANNUAL LEADERSHIP SUMMIT ✦';
      hostName = 'Nimantran AI Executive Council';
      venueName = 'JW Marriott Convention Center';
      venueAddress = 'Aerocity, New Delhi';
    } else if (raw.includes('diwali')) {
      eventType = 'FESTIVAL';
      title = 'Diwali Grand Celebration 2026';
      hindiTitle = '|| शुभ दीपावली • ॐ महालक्ष्म्यै नमः ||';
      hostName = 'The Kapoor Family';
      venueName = 'The Taj Mahal Palace';
      venueAddress = 'Apollo Bunder, Mumbai';
    } else if (raw.includes('rahul') || raw.includes('neha')) {
      title = 'Rahul & Neha';
      eventType = 'WEDDING';
      hindiTitle = '|| शुभ विवाह • श्री गणेशाय नमः ||';
      hostName = 'शर्मा एवं वर्मा परिवार';
      venueName = 'The Taj Mahal Palace';
      venueAddress = 'Apollo Bunder, Colaba, Mumbai';
    }

    return {
      event: {
        id: 'evt-celebration-demo',
        title: title,
        hindi_title: hindiTitle,
        event_type: eventType,
        host_name: hostName,
        start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        venue_name: venueName,
        venue_address: venueAddress,
        invitation_message: `We warmly invite you and your family to join us in celebrating ${title}. Your presence and blessings will make our special day truly memorable.`,
        description: `Join us for the auspicious celebration of ${title}.`,
        accepts_digital_shagun: true,
        upi_id: 'celebration@upi',
        host_upi_mobile: '9876543210',
        slug: targetSlug || 'rohit-priya-wedding-2026',
        functions: [
          { name: 'Mehendi & Sangeet', date_time: 'Day 1 • 06:00 PM', venue_name: `${venueName} Courtyard` },
          { name: 'Main Auspicious Ceremony', date_time: 'Day 2 • 11:00 AM', venue_name: `${venueName} Main Pavilion` },
          { name: 'Royal Grand Reception', date_time: 'Day 2 • 07:30 PM', venue_name: `${venueName} Grand Ballroom` },
        ],
      },
      canonical_invitation: {
        title: title,
        greeting: 'Dear Valued Family & Friends ❤️',
        message: `With joyful hearts and the blessings of the Almighty, we cordially invite you to celebrate ${title}.`,
        blessing: `विनीतः: ${hostName}`,
      },
      wishes: [
        {
          id: 'w-1',
          sender_name: 'Uncle & Aunt Sharma',
          relationship: 'Family',
          message: 'Wishing you eternal joy, love, and togetherness! May God shower endless blessings on your celebration! ❤️',
        },
        {
          id: 'w-2',
          sender_name: 'Pooja & Sameer',
          relationship: 'Friends',
          message: 'Heartiest congratulations! We can\'t wait to dance and celebrate with everyone! ✨🥂',
        },
      ],
      memories: [],
      headline: "You're Graciously Invited",
      lifecycle_phase: 'BEFORE',
    };
  };

  useEffect(() => {
    const cleanSlug = (slug || '').split('#')[0].split('?')[0];
    const cleanToken = (token || '').split('#')[0].split('?')[0];

    if (cleanToken) {
      apiFetch<any>(`/public/invitations/t/${cleanToken}`)
        .then((res) => {
          if (res && res.data && res.data.event) {
            setData({
              event: res.data.event,
              canonical_invitation: res.data.canonical_invitation,
              wishes: res.data.wishes || [],
              memories: res.data.memories || [],
              headline: res.data.headline || `You're Graciously Invited`,
              lifecycle_phase: res.data.lifecycle_phase || 'BEFORE',
            });
            setGuestPersonalization({
              guest_name: res.data.guest_name,
              salutation: res.data.salutation,
              rsvp_status: res.data.rsvp_status,
              music_url: res.data.music_url,
              theme_id: res.data.theme_id,
              pass_code: res.data.pass_code,
            });
          } else {
            // Fallback graceful preview
            const fallback = createFallbackCelebration(undefined, cleanToken);
            setData(fallback);
            setGuestPersonalization({
              guest_name: 'Honored Guest',
              salutation: 'Dear Valued Guest ❤️',
              rsvp_status: null,
              pass_code: 'NIM-ENTRY-1001',
            });
          }
        })
        .catch((err) => {
          console.log('Using graceful fallback for token:', err);
          const fallback = createFallbackCelebration(undefined, cleanToken);
          setData(fallback);
          setGuestPersonalization({
            guest_name: 'Honored Guest',
            salutation: 'Dear Valued Guest ❤️',
            rsvp_status: null,
            pass_code: 'NIM-ENTRY-1001',
          });
        })
        .finally(() => setLoading(false));
    } else if (cleanSlug) {
      apiFetch<any>(`/public/events/${cleanSlug}`)
        .then((rawRes) => {
          const res = rawRes as any;
          if (res && res.data && (res.data.event || res.data.title)) {
            setData({
              event: res.data.event || res.data,
              canonical_invitation: res.data.canonical_invitation,
              wishes: res.data.wishes || [],
              memories: res.data.memories || [],
              headline: res.data.headline || `You're Graciously Invited`,
              lifecycle_phase: res.data.lifecycle_phase || 'BEFORE',
            });
          } else if (res && (res.event || res.title)) {
            setData({
              event: res.event || res,
              canonical_invitation: res.canonical_invitation,
              wishes: res.wishes || [],
              memories: res.memories || [],
              headline: res.headline || `You're Graciously Invited`,
              lifecycle_phase: res.lifecycle_phase || 'BEFORE',
            });
          } else {
            const fallback = createFallbackCelebration(cleanSlug);
            setData(fallback);
          }
        })
        .catch((err) => {
          console.log('Using graceful fallback for slug:', err);
          const fallback = createFallbackCelebration(cleanSlug);
          setData(fallback);
        })
        .finally(() => setLoading(false));
    } else {
      // Default celebration
      const fallback = createFallbackCelebration('rohit-priya-wedding-2026');
      setData(fallback);
      setLoading(false);
    }
  }, [slug, token]);

  // 1-Tap Quick RSVP Submission
  const handleQuickRsvp = async (status: string): Promise<boolean> => {
    if (!slug && !token) return false;
    try {
      const endpoint = token
        ? `/public/invitations/t/${token}/rsvp`
        : `/public/events/${slug}/rsvp`;

      await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          guest_name: guestPersonalization?.guest_name || 'Valued Guest',
          status: status === 'CONFIRMED' ? 'YES' : status,
          adults_attending: status === 'CONFIRMED' ? 2 : 1,
        }),
      });

      if (status === 'CONFIRMED') {
        try {
          confetti({
            particleCount: 110,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#F43F5E', '#FDA4AF', '#FFFFFF'],
          });
        } catch (e) {}
      }
      return true;
    } catch (err: any) {
      alert(err.message || 'Failed to submit RSVP');
      return false;
    }
  };

  // Handle Post Blessing Wish
  const handlePostWish = async (
    senderName: string,
    relationship: string,
    message: string
  ): Promise<boolean> => {
    if (!slug && !token) return false;
    try {
      const endpoint = token
        ? `/public/invitations/t/${token}/wishes`
        : `/public/events/${slug}/wishes`;

      const res = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          sender_name: senderName,
          relationship: relationship || 'Family & Friends',
          message: message,
        }),
      });

      if (res && res.data) {
        setData((prev: any) => ({
          ...prev,
          wishes: [res.data, ...(prev?.wishes || [])],
        }));
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#FFD700', '#F43F5E', '#FDA4AF'],
          });
        } catch (e) {}
        return true;
      }
      return false;
    } catch (err: any) {
      alert(err.message || 'Failed to post wish');
      return false;
    }
  };

  // 1. Loading state with fast branded monogram
  if (loading) {
    return <ExperienceLoader title="Nimantran AI" />;
  }

  // 2. Error or Not Found state
  if (!data || !data.event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0E0206] text-white text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl border border-amber-400/40 bg-black/60 backdrop-blur-xl space-y-4 shadow-2xl">
          <div className="text-4xl">💌</div>
          <h2 className="font-serif text-2xl font-extrabold text-amber-300">Invitation Not Found</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-serif italic">
            This invitation link may be private, expired, or temporarily unavailable. Please check with your host.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // 3. Cinematic Guest Experience Engine
  return (
    <GuestExperience
      data={data}
      guestPersonalization={guestPersonalization}
      slug={slug}
      token={token}
      onQuickRsvp={handleQuickRsvp}
      onPostWish={handlePostWish}
    />
  );
};
