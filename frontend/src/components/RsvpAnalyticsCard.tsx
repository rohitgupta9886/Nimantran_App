import React, { useEffect, useState } from 'react';
import { Users, Clock, ArrowUpRight, Sparkles, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { apiFetch } from '../services/api';

interface RsvpAnalyticsCardProps {
  eventId: string;
}

export const RsvpAnalyticsCard: React.FC<RsvpAnalyticsCardProps> = ({ eventId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    apiFetch<any>(`/events/${eventId}/rsvp-analytics`)
      .then((res) => {
        setData(res.data || null);
      })
      .catch((err) => {
        console.warn('Fetch RSVP analytics error:', err);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const totalInvited = data?.total_invited ?? data?.total_guests ?? 0;
  const confirmed = data?.confirmed_count ?? data?.attending_count ?? 0;
  const confirmedPct = data?.confirmed_pct ?? 0;
  const maybe = data?.maybe_count ?? 0;
  const maybePct = data?.maybe_pct ?? 0;
  const notAttending = data?.not_attending_count ?? data?.declined_count ?? 0;
  const notAttendingPct = data?.not_attending_pct ?? 0;
  const awaiting = data?.awaiting_count ?? data?.pending_count ?? 0;
  const awaitingPct = data?.awaiting_pct ?? 0;
  const totalExpectedGuests = data?.total_expected_guests ?? confirmed;

  const recentList = data?.recent_rsvps && data.recent_rsvps.length > 0 ? data.recent_rsvps : [];

  const getInitials = (name: string) => {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* CARD 1: RSVP STATUS & HEADCOUNT BREAKDOWN */}
      <div className="p-6 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-[#302829] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9E6F6D]" /> RSVP & Attendance Readiness
          </h3>
          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" /> Live Sync
          </span>
        </div>

        {/* Headcount Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF7F3] to-[#F2E5E2] border border-[#E9D3D0] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#8C7E80] uppercase tracking-wider font-bold block">
              TOTAL EXPECTED GUESTS (HEADCOUNT)
            </span>
            <span className="font-serif text-2xl font-extrabold text-[#302829]">
              {totalExpectedGuests} <span className="text-xs font-mono font-normal text-[#8C7E80]">people attending</span>
            </span>
          </div>
          <div className="text-right font-mono text-xs text-[#8C7E80]">
            <div>{totalInvited} Invited</div>
            <div className="font-bold text-emerald-700">{confirmed} Confirmed</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Progress Chart */}
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background Ring */}
              <path
                className="text-slate-100"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Confirmed Segment */}
              <path
                className="text-[#9E6F6D]"
                strokeDasharray={`${confirmedPct}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-serif text-xl font-extrabold text-[#302829]">{confirmedPct}%</span>
              <span className="text-[9px] font-mono text-[#8C7E80] font-bold">
                {confirmed} / {totalInvited}
              </span>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="flex-1 space-y-2 w-full text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0]">
              <span className="flex items-center gap-2 text-[#302829] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Attending
              </span>
              <span className="font-extrabold text-[#302829]">{confirmed} <span className="text-[#8C7E80] font-normal">({confirmedPct}%)</span></span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0]">
              <span className="flex items-center gap-2 text-[#302829] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Maybe
              </span>
              <span className="font-extrabold text-[#302829]">{maybe} <span className="text-[#8C7E80] font-normal">({maybePct}%)</span></span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0]">
              <span className="flex items-center gap-2 text-[#302829] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Declined
              </span>
              <span className="font-extrabold text-[#302829]">{notAttending} <span className="text-[#8C7E80] font-normal">({notAttendingPct}%)</span></span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0]">
              <span className="flex items-center gap-2 text-[#302829] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Pending
              </span>
              <span className="font-extrabold text-[#302829]">{awaiting} <span className="text-[#8C7E80] font-normal">({awaitingPct}%)</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: RECENT RSVPS LIVE FEED */}
      <div className="p-6 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3">
          <h3 className="font-serif text-base font-bold text-[#302829] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#9E6F6D]" /> Recent RSVPs
          </h3>
          <button
            type="button"
            className="text-xs font-bold text-[#9E6F6D] hover:underline flex items-center gap-1"
          >
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {recentList.map((item: any) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F2E5E2] text-[#9E6F6D] font-extrabold text-xs flex items-center justify-center border border-[#D8B5B0]">
                  {getInitials(item.guest_name)}
                </div>
                <div>
                  <span className="font-bold text-[#302829] block">{item.guest_name}</span>
                  <span className="text-[10px] text-[#8C7E80] block font-mono">
                    <span className={`font-bold ${item.status === 'CONFIRMED' ? 'text-emerald-700' : item.status === 'MAYBE' ? 'text-amber-700' : 'text-rose-700'}`}>
                      ● {item.status}
                    </span>
                    {item.status === 'CONFIRMED' && ` • ${item.adults_attending || 2} guests`}
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-[#8C7E80] font-mono shrink-0">
                {item.timestamp || 'Recent'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
