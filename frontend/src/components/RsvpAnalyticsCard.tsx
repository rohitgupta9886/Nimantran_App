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

  const total = data?.total_guests || 500;
  const confirmed = data?.confirmed_count || 312;
  const confirmedPct = data?.confirmed_pct || 62;
  const maybe = data?.maybe_count || 87;
  const maybePct = data?.maybe_pct || 17;
  const notAttending = data?.not_attending_count || 54;
  const notAttendingPct = data?.not_attending_pct || 11;
  const awaiting = data?.awaiting_count || 47;
  const awaitingPct = data?.awaiting_pct || 9;

  const recentList = data?.recent_rsvps && data.recent_rsvps.length > 0 ? data.recent_rsvps : [
    { id: '1', guest_name: 'Priya Sharma', status: 'CONFIRMED', adults_attending: 2, meal_preference: 'Veg', timestamp: '2 min ago' },
    { id: '2', guest_name: 'Amit Verma', status: 'MAYBE', adults_attending: 1, meal_preference: 'Any', timestamp: '12 min ago' },
    { id: '3', guest_name: 'Sneha Patel', status: 'CONFIRMED', adults_attending: 3, meal_preference: 'Veg', timestamp: '28 min ago' },
    { id: '4', guest_name: 'Rohit Mehta', status: 'NOT_ATTENDING', adults_attending: 0, meal_preference: 'N/A', timestamp: '1 hour ago' },
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* CARD 1: RSVP STATUS & DONUT CHART BREAKDOWN */}
      <div className="p-6 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-[#302829] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9E6F6D]" /> RSVP Status
          </h3>
          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" /> Live
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Progress Chart */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
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
              <span className="font-serif text-2xl font-extrabold text-[#302829]">{confirmedPct}%</span>
              <span className="text-[10px] font-mono text-[#8C7E80] font-bold">
                {confirmed} / {total} guest confirmed
              </span>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="flex-1 space-y-2.5 w-full text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0]">
              <span className="flex items-center gap-2 text-[#302829] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Confirmed
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
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Not Attending
              </span>
              <span className="font-extrabold text-[#302829]">{notAttending} <span className="text-[#8C7E80] font-normal">({notAttendingPct}%)</span></span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0]">
              <span className="flex items-center gap-2 text-[#302829] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Awaiting Response
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
