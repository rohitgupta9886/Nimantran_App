import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Users, Shield, LogOut, ChevronDown, Mail, Award, LayoutDashboard, Search, Bell, Radio, Lock } from 'lucide-react';
import { useAuth } from '../store/authStore';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavbarProps {
  onOpenVoiceModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenVoiceModal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full z-40 bg-[#FFFDFC]/90 backdrop-blur-md border-b border-[#E9D3D0]/60 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        
        {/* CENTER TOP SEARCH BAR WITH CTRL+K */}
        <div className="relative flex-grow max-w-lg">
          <Search className="w-4 h-4 text-[#8C7E80] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search celebrations, guests, invitations..."
            className="w-full pl-10 pr-14 py-2 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] text-xs placeholder:text-[#8C7E80] focus:outline-none focus:border-[#9E6F6D] transition-all shadow-inner"
          />
          <kbd className="absolute right-3 top-2 px-1.5 py-0.5 rounded-md bg-[#FFFDFC] border border-[#E9D3D0] text-[9px] font-mono font-bold text-[#8C7E80] hidden sm:inline">
            Ctrl + K
          </kbd>
        </div>

        {/* RIGHT CONTROLS: GO TO DASHBOARD & ACCOUNT MENU */}
        <div className="flex items-center gap-2.5 relative" ref={menuRef}>
          
          {/* PROMINENT GLOBAL "GO TO DASHBOARD" BUTTON */}
          <Link
            to="/dashboard"
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white font-extrabold text-xs shadow-sm hover:scale-105 transition-all flex items-center gap-1.5 border border-[#D8B5B0] whitespace-nowrap"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-white" />
            <span>Go To Dashboard</span>
          </Link>

          {/* NOTIFICATION BELL */}
          <button
            type="button"
            className="p-2 rounded-2xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#302829] border border-[#E9D3D0] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#51484A]" />
            <span className="w-2 h-2 rounded-full bg-[#9E6F6D] absolute top-1.5 right-1.5" />
          </button>

          {/* WELCOME USER BUTTON */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#302829] border border-[#D8B5B0]/60 transition-all shadow-sm group"
              >
                <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-[#9E6F6D] to-[#C9AA78] text-white flex items-center justify-center font-bold text-[11px]">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'R'}
                </div>

                <div className="text-left text-xs hidden md:block">
                  <span className="text-[8px] font-mono text-[#9E6F6D] font-bold uppercase tracking-wider block -mb-0.5">
                    👋 WELCOME
                  </span>
                  <span className="font-bold text-[#302829] group-hover:text-[#9E6F6D] transition-colors text-[11px]">
                    {user.full_name || 'Rohit & Neha Gupta'}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-[#9E6F6D] transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* ACCOUNT DROPDOWN MENU */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-72 bg-[#FFFDFC] rounded-3xl p-5 border border-[#D8B5B0] shadow-2xl space-y-4 z-50 text-[#302829] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="pb-3 border-b border-[#E9D3D0] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#9E6F6D] font-bold uppercase tracking-widest">
                        👑 HOST ACCOUNT
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold border border-emerald-300">
                        ACTIVE
                      </span>
                    </div>
                    <div className="font-serif text-base font-bold text-[#302829] truncate">{user.full_name}</div>
                    <div className="text-xs text-[#8C7E80] flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#9E6F6D] shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center justify-between">
                      <span className="text-[#51484A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C9AA78]" /> AI Credits
                      </span>
                      <span className="font-bold text-[#9E6F6D] font-mono">2,450</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center justify-between">
                      <span className="text-[#51484A] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#C9AA78]" /> Account Type
                      </span>
                      <span className="font-bold text-[#9E6F6D] text-[11px] font-mono">
                        {user.is_superuser ? 'Super Admin' : 'Host Account'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-[#E9D3D0] text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onOpenVoiceModal) onOpenVoiceModal();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#F2E5E2] text-[#302829] flex items-center gap-2 transition-colors font-bold"
                    >
                      <Sparkles className="w-4 h-4 text-[#9E6F6D]" /> ✨ AI Celebration Concierge
                    </button>

                    <Link
                      to="/contacts"
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2.5 rounded-xl hover:bg-[#F2E5E2] text-[#302829] flex items-center gap-2 transition-colors"
                    >
                      <Users className="w-4 h-4 text-[#9E6F6D]" /> My Saved Contacts
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2.5 rounded-xl hover:bg-[#F2E5E2] text-[#302829] flex items-center gap-2 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-[#9E6F6D]" /> My Celebrations
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#F2E5E2] text-[#302829] flex items-center gap-2 transition-colors"
                    >
                      <Lock className="w-4 h-4 text-[#9E6F6D]" /> Change Password & Security
                    </button>

                    {(user.is_superuser || user.role === 'ADMIN') && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold flex items-center gap-2 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-purple-700" /> Admin Console
                      </Link>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E9D3D0]">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Log Out Account
                    </button>
                  </div>
                </div>
              )}

              <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
              />
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-2xl bg-[#F2E5E2] text-[#302829] font-bold text-xs hover:bg-[#E9D3D0] transition-colors border border-[#D8B5B0]/50"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
