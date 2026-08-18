import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Users, Shield, LogOut, ChevronDown, Mail, Award, LayoutDashboard, Search, Bell, Lock, PlusCircle } from 'lucide-react';
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
    <header className="w-full z-40 bg-white/90 backdrop-blur-md border-b border-charcoal-200/70 px-4 sm:px-6 py-3 sticky top-0">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        
        {/* MOBILE BRAND LOGO (VISIBLE ON SMALL SCREENS WHERE SIDEBAR IS HIDDEN) */}
        <Link to="/dashboard" className="xl:hidden flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-wine via-wine-700 to-gold p-0.5 shadow-sm">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <span className="font-serif font-extrabold text-lg text-wine">N</span>
            </div>
          </div>
          <span className="font-serif font-bold text-lg text-charcoal-900 tracking-tight hidden sm:inline">
            Nimantran
          </span>
        </Link>

        {/* SEARCH BAR */}
        <div className="relative flex-grow max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search celebrations, guests, invitations..."
            className="w-full pl-10 pr-14 py-2 rounded-xl bg-canvas border border-charcoal-200 text-charcoal-900 text-xs placeholder:text-charcoal-400 focus:outline-none focus:border-wine focus:ring-2 focus:ring-wine/10 transition-all"
          />
          <kbd className="absolute right-3 top-2 px-1.5 py-0.5 rounded-md bg-white border border-charcoal-200 text-[10px] font-mono text-charcoal-400">
            ⌘K
          </kbd>
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-2.5 relative ml-auto" ref={menuRef}>
          
          {/* QUICK CREATE CELEBRATION CTA */}
          <Link
            to="/events/new"
            className="px-3.5 py-2 rounded-xl bg-wine hover:bg-wine-700 active:bg-wine-900 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px]"
          >
            <PlusCircle className="w-4 h-4 text-gold" />
            <span className="hidden sm:inline">Create Celebration</span>
            <span className="sm:hidden">Create</span>
          </Link>

          {/* AI CONCIERGE BUTTON */}
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold-50 border border-gold-200 text-gold-900 font-semibold text-xs hover:bg-gold-100 transition-all min-h-[38px]"
          >
            <Sparkles className="w-4 h-4 text-gold-600 animate-pulse" />
            <span>AI Concierge</span>
          </button>

          {/* NOTIFICATION BELL */}
          <button
            type="button"
            className="p-2 rounded-xl bg-canvas hover:bg-surface-subtle text-charcoal-700 border border-charcoal-200 transition-colors relative min-w-[38px] min-h-[38px] flex items-center justify-center"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-charcoal-600" />
            <span className="w-2 h-2 rounded-full bg-wine absolute top-2 right-2" />
          </button>

          {/* USER PROFILE DROPDOWN */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="User Account Menu"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-canvas hover:bg-surface-subtle border border-charcoal-200 transition-all group min-h-[38px]"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-wine to-gold text-white flex items-center justify-center font-bold text-xs">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'N'}
                </div>

                <div className="text-left text-xs hidden lg:block">
                  <span className="font-semibold text-charcoal-900 group-hover:text-wine transition-colors block truncate max-w-[120px]">
                    {user.full_name || 'Host'}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-charcoal-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl p-4 border border-charcoal-200 shadow-xl space-y-3 z-50 text-charcoal-900 animate-in fade-in duration-150">
                  <div className="pb-3 border-b border-charcoal-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-wine uppercase tracking-wider">
                        HOST ACCOUNT
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <div className="font-serif text-base font-bold text-charcoal-900 truncate">{user.full_name}</div>
                    <div className="text-xs text-charcoal-500 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-canvas border border-charcoal-200/60 flex items-center justify-between">
                      <span className="text-charcoal-600 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-gold" /> AI Credits
                      </span>
                      <span className="font-bold text-wine">2,450</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-charcoal-100 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onOpenVoiceModal) onOpenVoiceModal();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-canvas text-charcoal-800 flex items-center gap-2 transition-colors font-semibold"
                    >
                      <Sparkles className="w-4 h-4 text-wine" /> AI Concierge
                    </button>

                    <Link
                      to="/contacts"
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2 rounded-lg hover:bg-canvas text-charcoal-800 flex items-center gap-2 transition-colors"
                    >
                      <Users className="w-4 h-4 text-charcoal-500" /> Guest Contacts
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2 rounded-lg hover:bg-canvas text-charcoal-800 flex items-center gap-2 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-charcoal-500" /> My Celebrations
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-canvas text-charcoal-800 flex items-center gap-2 transition-colors"
                    >
                      <Lock className="w-4 h-4 text-charcoal-500" /> Change Password
                    </button>

                    {(user.is_superuser || user.role === 'ADMIN') && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-purple-700" /> Admin Console
                      </Link>
                    )}
                  </div>

                  <div className="pt-2 border-t border-charcoal-100">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
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
              className="px-4 py-2 rounded-xl bg-wine text-white font-semibold text-xs hover:bg-wine-700 transition-colors shadow-sm"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
