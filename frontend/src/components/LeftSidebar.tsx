import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  Shield,
  CreditCard,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../store/authStore';

interface LeftSidebarProps {
  className?: string;
  onOpenVoiceModal?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ className = '', onOpenVoiceModal }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user && (user.role === 'ADMIN' || user.is_superuser);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Celebrations', path: '/events/new', icon: Calendar },
    { label: 'Guests & Contacts', path: '/contacts', icon: Users },
    { label: 'AI Concierge', path: '#ai-concierge', icon: Sparkles, isAction: true },
    { label: 'Credits & Billing', path: '/credits', icon: CreditCard },
    ...(isAdmin ? [{ label: 'Admin Console', path: '/admin', icon: Shield }] : []),
  ];

  return (
    <aside className={`w-64 bg-white border-r border-charcoal-200/70 min-h-screen flex flex-col justify-between p-5 shrink-0 ${className}`}>
      <div className="space-y-6">
        {/* BRAND IDENTITY LOGO */}
        <Link to="/" className="flex items-center gap-3 group px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-wine via-wine-700 to-gold p-0.5 shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <span className="font-serif font-extrabold text-xl text-wine">N</span>
            </div>
          </div>
          <div>
            <span className="font-serif font-bold text-lg tracking-tight text-charcoal-900 block leading-tight">
              Nimantran AI
            </span>
            <span className="text-[9px] tracking-wider text-wine uppercase block font-semibold">
              Celebration Studio
            </span>
          </div>
        </Link>

        {/* PRIMARY ACTION */}
        <Link
          to="/events/new"
          className="w-full py-3 px-4 rounded-xl bg-wine hover:bg-wine-700 active:bg-wine-900 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 group"
        >
          <PlusCircle className="w-4 h-4 text-gold group-hover:rotate-90 transition-transform duration-200" />
          <span>New Celebration</span>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={onOpenVoiceModal}
                  className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-charcoal-700 hover:bg-gold-50 hover:text-gold-900 transition-all"
                >
                  <Icon className="w-4 h-4 text-gold animate-pulse" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-wine-50 text-wine font-bold shadow-xs'
                    : 'text-charcoal-600 hover:bg-canvas hover:text-charcoal-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-wine' : 'text-charcoal-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER BADGE */}
      <div className="p-3.5 rounded-2xl bg-canvas border border-charcoal-200/60 text-xs">
        <div className="flex items-center gap-2 text-wine font-bold font-serif mb-1">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>AI Assistant Ready</span>
        </div>
        <p className="text-[11px] text-charcoal-500 leading-snug">
          Create invites, organize guest lists, and draft WhatsApp messages in seconds.
        </p>
      </div>
    </aside>
  );
};
