import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Users, CreditCard, Sparkles } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenVoiceModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenVoiceModal }) => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Create',
      path: '/events/new',
      icon: PlusCircle,
      isPrimary: true,
    },
    {
      label: 'Guests',
      path: '/contacts',
      icon: Users,
    },
    {
      label: 'Billing',
      path: '/credits',
      icon: CreditCard,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E9D3D0] px-3 pt-2 pb-safe xl:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5 group focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                    isActive
                      ? 'bg-[#9E6F6D] text-white ring-4 ring-[#9E6F6D]/20'
                      : 'bg-gradient-to-tr from-[#9E6F6D] via-[#875B59] to-[#5E3735] text-white'
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-[#9E6F6D] mt-1 tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 focus:outline-none ${
                isActive
                  ? 'text-[#9E6F6D] font-bold'
                  : 'text-[#8C7E80] hover:text-[#302829]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#9E6F6D]' : 'text-[#8C7E80]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
