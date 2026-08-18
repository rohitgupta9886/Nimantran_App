import React from 'react';
import { Sparkles, Mail, Users, Calendar, MessageSquare, UserPlus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RightSidebarProps {
  className?: string;
  onOpenVoiceModal?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ className = '', onOpenVoiceModal }) => {
  return (
    <aside className={`w-80 bg-canvas border-l border-charcoal-200/70 min-h-screen p-5 space-y-5 shrink-0 ${className}`}>
      
      {/* 1. AI CONCIERGE WIDGET */}
      <div className="p-5 rounded-2xl bg-white border border-charcoal-200/80 space-y-3 shadow-sm text-center">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-charcoal-900 flex items-center gap-1.5 font-serif text-sm">
            <Sparkles className="w-4 h-4 text-gold" /> AI Concierge
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Online
          </span>
        </div>
        <p className="text-xs text-charcoal-500">
          Ask questions, draft invitations, or plan itineraries with AI assistance.
        </p>

        <button
          type="button"
          onClick={onOpenVoiceModal}
          className="w-full py-2.5 rounded-xl bg-gold hover:bg-gold-400 active:bg-gold-600 text-charcoal-900 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Assistant</span>
        </button>
      </div>

      {/* 2. QUICK SHORTCUTS */}
      <div className="p-5 rounded-2xl bg-white border border-charcoal-200/80 space-y-3 shadow-sm">
        <span className="font-bold text-xs uppercase tracking-wider text-charcoal-500 block">
          Quick Actions
        </span>

        <div className="space-y-1.5 text-xs">
          <Link
            to="/events/new"
            className="w-full text-left p-2.5 rounded-xl bg-canvas hover:bg-surface-subtle text-charcoal-800 font-semibold flex items-center justify-between transition-colors border border-charcoal-200/50"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-wine" /> Create Celebration
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-400" />
          </Link>

          <Link
            to="/contacts"
            className="w-full text-left p-2.5 rounded-xl bg-canvas hover:bg-surface-subtle text-charcoal-800 font-semibold flex items-center justify-between transition-colors border border-charcoal-200/50"
          >
            <span className="flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-wine" /> Manage Contacts
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-400" />
          </Link>

          <Link
            to="/credits"
            className="w-full text-left p-2.5 rounded-xl bg-canvas hover:bg-surface-subtle text-charcoal-800 font-semibold flex items-center justify-between transition-colors border border-charcoal-200/50"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-gold" /> Check AI Credits
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-400" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
