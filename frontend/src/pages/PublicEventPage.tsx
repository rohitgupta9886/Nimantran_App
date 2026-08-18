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

  useEffect(() => {
    const cleanSlug = (slug || '').split('#')[0].split('?')[0];
    const cleanToken = (token || '').split('#')[0].split('?')[0];

    if (cleanToken) {
      apiFetch<any>(`/public/invitations/t/${cleanToken}`)
        .then((res) => {
          if (res && res.data) {
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
            setData(null);
          }
        })
        .catch((err) => {
          console.error('Fetch public invitation error:', err);
          setData(null);
        })
        .finally(() => setLoading(false));
    } else if (cleanSlug) {
      apiFetch<any>(`/public/events/${cleanSlug}`)
        .then((res) => {
          if (res && res.data) {
            setData(res.data);
          } else {
            setData(null);
          }
        })
        .catch((err) => {
          console.error('Fetch public event error:', err);
          setData(null);
        })
        .finally(() => setLoading(false));
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
