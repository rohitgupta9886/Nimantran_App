import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Users, Sparkles, CreditCard } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenVoiceModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenVoiceModal }) => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Guests',
      path: '/contacts',
      icon: Users,
    },
    {
      label: 'Create',
      path: '/events/new',
      icon: PlusCircle,
      isPrimary: true,
    },
    {
      label: 'AI Concierge',
      path: '#ai',
      icon: Sparkles,
      isAction: true,
    },
    {
      label: 'Credits',
      path: '/credits',
      icon: CreditCard,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-charcoal-200/80 px-2 pt-1.5 pb-safe xl:hidden shadow-[0_-4px_24px_rgba(31,27,24,0.06)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label="Create celebration"
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center -mt-6 group min-w-[48px] min-h-[48px] focus-visible:ring-2 focus-visible:ring-wine focus-visible:outline-none rounded-full"
              >
                <div
                  className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                    isActive
                      ? 'bg-wine text-white ring-4 ring-wine/20'
                      : 'bg-gradient-to-tr from-wine via-wine-700 to-rose text-white'
                  }`}
                  style={{ width: '50px', height: '50px' }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-wine mt-1 tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          if (item.isAction) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={onOpenVoiceModal}
                aria-label="Open AI Assistant"
                className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 px-2.5 rounded-xl transition-all active:scale-95 text-charcoal-600 hover:text-wine focus-visible:ring-2 focus-visible:ring-wine focus-visible:outline-none"
              >
                <div className="relative">
                  <Icon className="w-5 h-5 text-gold animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gold absolute -top-0.5 -right-0.5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 px-2.5 rounded-xl transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-wine focus-visible:outline-none ${
                isActive ? 'text-wine font-bold' : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-wine' : 'text-charcoal-400'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
