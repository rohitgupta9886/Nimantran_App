import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Mail,
  Sparkles,
  MessageSquare,
  History,
  QrCode,
  BarChart3,
  BookUser,
  Settings,
  Crown,
  Shield,
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
    ...(isAdmin ? [{ label: 'Admin Console', path: '/admin', icon: Shield }] : []),
    { label: 'My Celebrations', path: '/events/new', icon: Calendar },
    { label: 'Guests', path: '/contacts', icon: Users },
    { label: 'Invitations', path: '/dashboard', icon: Mail },
    { label: 'AI Concierge', path: '#ai-concierge', icon: Sparkles, isAction: true },
    { label: 'Contacts', path: '/contacts', icon: BookUser },
    { label: 'Settings', path: '/dashboard', icon: Settings },
  ];

  return (
    <aside className={`w-64 bg-[#FFF9F6] border-r border-[#E9D3D0]/60 min-h-screen flex flex-col justify-between p-5 shrink-0 ${className}`}>
      <div className="space-y-6">
        {/* BRAND IDENTITY LOGO */}
        <Link to="/" className="flex items-center gap-3 group px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9E6F6D] via-[#D8B5B0] to-[#C9AA78] p-0.5 shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#FFFDFC] rounded-2xl flex items-center justify-center">
              <span className="font-serif font-bold text-xl text-[#9E6F6D]">N</span>
            </div>
          </div>
          <div>
            <span className="font-serif font-bold text-lg tracking-wide text-[#302829] block leading-tight">
              NIMANTRAN AI
            </span>
            <span className="text-[8px] tracking-widest text-[#9E6F6D] uppercase block font-mono font-semibold">
              LUXURY CELEBRATION PLATFORM
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path && item.label === 'Dashboard';

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={onOpenVoiceModal}
                  className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#51484A] hover:bg-[#F2E5E2] hover:text-[#9E6F6D] transition-all"
                >
                  <Icon className="w-4 h-4 text-[#9E6F6D] animate-pulse" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#F2E5E2] text-[#9E6F6D] font-bold shadow-sm'
                    : 'text-[#51484A] hover:bg-[#F2E5E2]/50 hover:text-[#302829]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#9E6F6D]' : 'text-[#8C7E80]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* UPGRADE TO PREMIUM BOTTOM CARD */}
      <div className="p-4 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-3 shadow-sm text-center">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#302829]">Upgrade to Premium</span>
          <Crown className="w-4 h-4 text-[#C9AA78]" />
        </div>
        <p className="text-[11px] text-[#8C7E80] leading-snug">
          Unlock beautiful themes, advanced features and more.
        </p>
        <button
          type="button"
          className="w-full py-2 rounded-xl bg-gradient-to-r from-[#9E6F6D] to-[#875B59] text-white font-bold text-xs shadow-sm hover:scale-[1.02] transition-transform"
        >
          👑 Upgrade Now
        </button>
      </div>
    </aside>
  );
};
