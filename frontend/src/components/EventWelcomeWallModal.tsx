import React from 'react';
import { Sparkles, X, CheckCircle2, QrCode, Monitor } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeTokens } from '../utils/themeEngine';

interface EventWelcomeWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestName?: string;
  salutation?: string;
  eventTitle?: string;
  passCode?: string;
  theme: ThemeTokens;
}

export const EventWelcomeWallModal: React.FC<EventWelcomeWallModalProps> = ({
  isOpen,
  onClose,
  guestName = 'Valued Guest',
  salutation = 'Dear Valued Guest',
  eventTitle = 'Nimantran Tech Summit 2026',
  passCode = 'NIM-ENTRY-PASS',
  theme,
}) => {
  if (!isOpen) return null;

  const triggerWelcomeConfetti = () => {
    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#D4AF37', '#9E6F6D', '#F2E5E2', '#10B981', '#3B82F6'],
      });
    } catch (e) {
      console.log('Confetti trigger:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
      <div
        className="max-w-3xl w-full p-8 md:p-14 rounded-3xl text-center space-y-8 relative shadow-2xl border overflow-hidden"
        style={{
          backgroundColor: '#0D0104',
          borderColor: theme.borderAccent,
          boxShadow: `0 0 80px ${theme.primary}`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Ambient Big Screen Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30 bg-amber-400" />

        {/* Welcome Wall Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-extrabold uppercase tracking-widest border border-amber-500/40">
          <Monitor className="w-4 h-4" /> BIG LED SCREEN GUEST WELCOME DISPLAY
        </div>

        {/* Welcoming Header */}
        <div className="space-y-4">
          <span className="text-sm font-mono text-amber-400 font-extrabold uppercase tracking-[0.3em] block">
            VENUE ENTRANCE SCAN SUCCESSFUL
          </span>

          <h1 className="font-serif text-4xl sm:text-6xl font-extrabold text-white leading-tight">
            WELCOME, <br />
            <span style={{ color: theme.accent }}>{guestName.toUpperCase()}</span>
          </h1>

          <p className="font-serif text-lg text-slate-300 italic max-w-lg mx-auto">
            "{salutation}, we are deeply honored to have your gracious presence at {eventTitle}."
          </p>
        </div>

        {/* Gate Entry Check-in Details */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Entry Status: VERIFIED
            </span>
            <span>Pass Code: {passCode}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Check-in Timestamp: {new Date().toLocaleTimeString('en-IN')} • Main Entrance Scanner
          </p>
        </div>

        {/* Action triggers for projector test */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={triggerWelcomeConfetti}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Celebrate Welcome Blast 🎉
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors"
          >
            Close Display
          </button>
        </div>
      </div>
    </div>
  );
};
