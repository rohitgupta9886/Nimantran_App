import React from 'react';
import { Users, Send } from 'lucide-react';

interface QuickRsvpDashboardProps {
  guests: any[];
  onDispatchReminders?: () => void;
}

export const QuickRsvpDashboard: React.FC<QuickRsvpDashboardProps> = ({
  guests,
  onDispatchReminders,
}) => {
  const total = guests.length || 1;
  const coming = guests.filter((g) => g.rsvp_status === 'YES' || g.rsvp_status === 'CONFIRMED').length;
  const maybe = guests.filter((g) => g.rsvp_status === 'MAYBE').length;
  const pending = guests.filter((g) => !g.rsvp_status || g.rsvp_status === 'PENDING').length;
  const declined = guests.filter((g) => g.rsvp_status === 'NO' || g.rsvp_status === 'DECLINED').length;

  const comingPct = Math.round((coming / total) * 100);

  return (
    <div className="p-6 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-md space-y-5 text-[#302829]">
      <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3">
        <div>
          <h3 className="font-serif text-lg font-extrabold text-[#302829] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9E6F6D]" /> Live RSVP Attendance Dashboard
          </h3>
          <p className="text-xs text-[#7A6B6C]">Real-time guest response meter and attendance breakdown</p>
        </div>

        {onDispatchReminders && (
          <button
            type="button"
            onClick={onDispatchReminders}
            className="px-3.5 py-2 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] border border-[#E9D3D0] text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-[#9E6F6D]" /> Send Reminders
          </button>
        )}
      </div>

      {/* Visual RSVP Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-emerald-800 block font-extrabold">🟢 Attending</span>
          <div className="text-2xl font-serif font-extrabold text-emerald-950 mt-1">{coming}</div>
          <span className="text-[10px] text-emerald-700 font-mono font-semibold">{comingPct}% of guests</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-amber-800 block font-extrabold">🟡 Maybe</span>
          <div className="text-2xl font-serif font-extrabold text-amber-950 mt-1">{maybe}</div>
          <span className="text-[10px] text-amber-700 font-mono font-semibold">{Math.round((maybe / total) * 100)}% of guests</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E9D3D0] text-[#302829] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-[#7A6B6C] block font-extrabold">⚪ Pending</span>
          <div className="text-2xl font-serif font-extrabold text-[#302829] mt-1">{pending}</div>
          <span className="text-[10px] text-[#7A6B6C] font-mono font-semibold">{Math.round((pending / total) * 100)}% of guests</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-rose-800 block font-extrabold">🔴 Declined</span>
          <div className="text-2xl font-serif font-extrabold text-rose-950 mt-1">{declined}</div>
          <span className="text-[10px] text-rose-700 font-mono font-semibold">{Math.round((declined / total) * 100)}% of guests</span>
        </div>
      </div>
    </div>
  );
};
