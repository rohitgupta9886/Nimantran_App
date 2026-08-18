import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Check,
  Sparkles,
  Calendar,
  MapPin,
  Heart,
  Gift,
  QrCode,
  Volume2,
} from 'lucide-react';
import { CelebrationTheme } from '../utils/themeCatalog';
import { ThemeArtworkCanvas } from './ThemeArtworkCanvas';

interface LiveInvitationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: CelebrationTheme;
  title: string;
  hindiTitle?: string;
  invitationMessage?: string;
  startDate?: string;
  venueName?: string;
  venueAddress?: string;
  hostName?: string;
  guestName?: string;
  onSelectTheme?: (themeId: string) => void;
  isSelected?: boolean;
}

export const LiveInvitationPreviewModal: React.FC<LiveInvitationPreviewModalProps> = ({
  isOpen,
  onClose,
  theme,
  title,
  hindiTitle,
  invitationMessage,
  startDate,
  venueName,
  venueAddress,
  hostName,
  guestName = 'Valued Guest',
  onSelectTheme,
  isSelected = false,
}) => {
  const [previewDevice, setPreviewDevice] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');

  if (!isOpen || !theme) return null;

  const { colorPalette, typography } = theme;

  const formattedDate = startDate
    ? new Date(startDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Saturday, 18 December 2026';

  const formattedTime = startDate
    ? new Date(startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '07:00 PM';

  const fullVenue = venueName ? `${venueName}${venueAddress ? ', ' + venueAddress : ''}` : 'The Taj Palace, New Delhi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[850px] bg-[#140005] border-2 border-amber-400/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-amber-400/30 bg-black/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">{theme.icon}</span>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-amber-200 truncate">
                {theme.name}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Live Guest Invitation Experience Preview
              </p>
            </div>
          </div>

          {/* Device Viewport Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/70 p-1 rounded-2xl border border-amber-400/30">
              <button
                type="button"
                onClick={() => setPreviewDevice('MOBILE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewDevice === 'MOBILE'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile (Guest Phone)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('DESKTOP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewDevice === 'DESKTOP'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Stage: Interactive Phone Frame / Desktop Frame */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-radial from-amber-950/20 via-black to-black">
          <div
            className={`transition-all duration-500 mx-auto rounded-3xl overflow-hidden border-4 shadow-2xl flex flex-col justify-between ${
              previewDevice === 'MOBILE'
                ? 'w-[360px] max-w-full min-h-[640px] border-amber-400/80 ring-8 ring-black/80'
                : 'w-full max-w-2xl min-h-[600px] border-amber-400/60'
            }`}
            style={{
              backgroundColor: colorPalette.canvasBg,
            }}
          >
            {/* Top Phone Sensor Notch */}
            {previewDevice === 'MOBILE' && (
              <div className="w-full bg-black py-1.5 flex justify-center shrink-0">
                <div className="w-20 h-3 bg-zinc-800 rounded-full" />
              </div>
            )}

            {/* Inner Live Invitation Experience Content */}
            <div className="p-5 sm:p-6 space-y-6 text-center flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              {/* Top Control Bar */}
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest border"
                  style={{
                    backgroundColor: colorPalette.badgeBg,
                    color: colorPalette.badgeText,
                    borderColor: colorPalette.borderSoft,
                  }}
                >
                  {theme.badgeLabel}
                </span>

                <div className="p-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-300">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Large Theme Artwork Banner */}
              <div className="h-44 sm:h-52 w-full">
                <ThemeArtworkCanvas
                  theme={theme}
                  title={title || 'Priyanka & Rohit'}
                  hindiTitle={hindiTitle}
                  dateStr={formattedDate}
                  venueName={venueName || 'The Taj Palace'}
                  className="h-full"
                />
              </div>

              {/* Invitation Copy & Blessing */}
              <div className="space-y-3 px-2">
                <p
                  className="text-xs sm:text-sm font-serif italic leading-relaxed"
                  style={{ color: colorPalette.textBody }}
                >
                  "{invitationMessage ||
                    `Together with our families, we cordially invite you to celebrate this joyous occasion with us.`}"
                </p>
                <div className="w-16 h-px mx-auto bg-amber-400/40" />
                <p className="text-[11px] font-mono text-amber-300">
                  With Best Compliments: {hostName || 'The Family'}
                </p>
              </div>

              {/* Date & Venue Box */}
              <div
                className="p-4 rounded-2xl border backdrop-blur-md space-y-2 text-center"
                style={{
                  backgroundColor: colorPalette.surfaceBg,
                  borderColor: colorPalette.borderSoft,
                }}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-200">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[200px]">{fullVenue}</span>
                </div>
              </div>

              {/* Interactive RSVP & Shagun Action Previews */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  className="py-2.5 px-3 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md"
                  style={{
                    backgroundColor: colorPalette.primary,
                  }}
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>RSVP ATTEND</span>
                </button>

                <button
                  type="button"
                  className="py-2.5 px-3 rounded-xl bg-black/60 border text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                  style={{
                    borderColor: colorPalette.borderSoft,
                  }}
                >
                  <Gift className="w-3.5 h-3.5 text-amber-300" />
                  <span>SHAGUN (UPI)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-amber-400/30 bg-black/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif text-slate-300 hidden sm:inline">
              Selected Theme: <strong className="text-amber-300">{theme.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all"
            >
              Close Preview
            </button>

            {onSelectTheme && (
              <button
                type="button"
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`px-7 py-2.5 rounded-2xl font-serif font-extrabold text-xs flex items-center gap-2 shadow-xl transition-all hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Selected For This Event</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black animate-spin" />
                    <span>Use This Design</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
