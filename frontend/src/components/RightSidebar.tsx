import React from 'react';
import { Sparkles, Mail, Users, Calendar, MessageSquare, UserPlus, Download, Crown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RightSidebarProps {
  className?: string;
  onOpenVoiceModal?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ className = '', onOpenVoiceModal }) => {
  return (
    <aside className={`w-80 bg-[#FFF7F2] border-l border-[#E9D3D0]/60 min-h-screen p-5 space-y-6 shrink-0 ${className}`}>
      
      {/* 1. AI CONCIERGE WIDGET */}
      <div className="p-5 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-3 shadow-sm text-center">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#302829] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C9AA78]" /> AI Concierge
          </span>
          <span className="text-[10px] font-mono text-[#9E6F6D] font-bold">ONLINE</span>
        </div>
        <p className="text-xs text-[#8C7E80]">Ask me anything about your celebrations.</p>
        
        {/* Cute Mascot Visual */}
        <div className="w-16 h-16 rounded-full bg-[#F2E5E2] border border-[#D8B5B0] mx-auto flex items-center justify-center text-2xl shadow-inner">
          🤖
        </div>

        <button
          type="button"
          onClick={onOpenVoiceModal}
          className="w-full py-2.5 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-sm transition-transform hover:scale-[1.02]"
        >
          Chat with AI
        </button>
      </div>

      {/* 2. TODAY'S AGENDA */}
      <div className="p-5 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#302829]">Today's Agenda</span>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0]/60 text-[#51484A]">
            <span className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#9E6F6D]" /> Invitations to send
            </span>
            <span className="font-bold font-mono text-[#302829]">12</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0]/60 text-[#51484A]">
            <span className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#9E6F6D]" /> RSVPs pending
            </span>
            <span className="font-bold font-mono text-[#302829]">48</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0]/60 text-[#51484A]">
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#9E6F6D]" /> 1 Event today
            </span>
            <span className="font-bold font-mono text-[#9E6F6D]">LIVE</span>
          </div>
        </div>

        <button className="text-[11px] font-bold text-[#9E6F6D] hover:underline block pt-1">
          View All →
        </button>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="p-5 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-3 shadow-sm">
        <span className="font-bold text-xs text-[#302829] block">Quick Actions</span>

        <div className="space-y-2 text-xs">
          <button className="w-full text-left p-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#302829] font-semibold flex items-center justify-between transition-colors border border-[#E9D3D0]/60">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#9E6F6D]" /> Send WhatsApp Invite
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C7E80]" />
          </button>

          <Link to="/events/new" className="w-full text-left p-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#302829] font-semibold flex items-center justify-between transition-colors border border-[#E9D3D0]/60">
            <span className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#9E6F6D]" /> Create Invitation
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C7E80]" />
          </Link>

          <Link to="/contacts" className="w-full text-left p-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#302829] font-semibold flex items-center justify-between transition-colors border border-[#E9D3D0]/60">
            <span className="flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-[#9E6F6D]" /> Add Guest
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C7E80]" />
          </Link>

          <button className="w-full text-left p-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#302829] font-semibold flex items-center justify-between transition-colors border border-[#E9D3D0]/60">
            <span className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-[#9E6F6D]" /> Export Guest List
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C7E80]" />
          </button>
        </div>
      </div>

      {/* 4. YOUR PLAN */}
      <div className="p-5 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#302829]">Your Plan</span>
          <Crown className="w-4 h-4 text-[#C9AA78]" />
        </div>

        <div>
          <div className="font-bold text-xs text-[#302829]">Premium Plan</div>
          <div className="text-[11px] text-[#8C7E80]">Valid till 12 Aug 2026</div>
        </div>

        <button className="w-full py-2 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] font-bold text-xs border border-[#D8B5B0]/60 transition-colors">
          Manage Plan
        </button>
      </div>

    </aside>
  );
};
