import React, { useState } from 'react';
import { 
  X, Check, Copy, ExternalLink, Send, Sparkles, 
  MessageSquare, Mail, Smartphone, Users, CheckCircle2, ArrowRight
} from 'lucide-react';
import { copyInvitationLink, getPublicInvitationUrl } from '../services/invitationSharingService';

export interface PublishAndShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    slug?: string;
    title: string;
    host_name: string;
    venue_name: string;
    start_date: string;
    cover_image_url?: string;
    event_type?: string;
  };
  onOpenBroadcastWizard?: () => void;
}

export const PublishAndShareModal: React.FC<PublishAndShareModalProps> = ({
  isOpen,
  onClose,
  event,
  onOpenBroadcastWizard,
}) => {
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const publicUrl = getPublicInvitationUrl(event);

  const handleCopyLink = async () => {
    await copyInvitationLink({ event });
    setCopied(true);
    setStatusMsg('Public invitation link copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setStatusMsg(null);
    }, 3000);
  };

  const handleQuickWhatsAppShare = () => {
    const text = encodeURIComponent(
      `💌 *${event.host_name}* cordially invites you to *${event.title}*!\n\n` +
      `📅 *Date:* ${event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}\n` +
      `📍 *Venue:* ${event.venue_name}\n\n` +
      `✨ Tap to view your digital invitation card:\n${publicUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleQuickSMSShare = () => {
    const text = encodeURIComponent(
      `You are warmly invited to ${event.title} by ${event.host_name}. Open invitation: ${publicUrl}`
    );
    window.open(`sms:?&body=${text}`, '_blank');
  };

  const handleQuickEmailShare = () => {
    const subject = encodeURIComponent(`Invitation: ${event.title}`);
    const body = encodeURIComponent(
      `Dear Guest,\n\nYou are warmly invited to ${event.title}.\nHosted with love by ${event.host_name}.\n\nVenue: ${event.venue_name}\n\nView digital invitation:\n${publicUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-[#302829] space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#7A6B6C] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-[#9E6F6D] text-white shadow-lg mb-1">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#302829]">
            Invitation Published Successfully 🎉
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6B6C] font-medium max-w-md mx-auto">
            Your invitation is live and ready to share with family and friends.
          </p>
        </div>

        {/* Status Toast Notice */}
        {statusMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Preview Mini Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF7F5] to-[#F2E5E2] border border-[#E9D3D0] shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E9D3D0] pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#9E6F6D] text-white text-[10px] font-mono font-bold uppercase">
                {event.event_type || 'CELEBRATION'}
              </span>
              <h3 className="font-serif text-xl font-bold text-[#302829] mt-1">{event.title}</h3>
              <p className="text-xs text-[#7A6B6C]">Hosted by {event.host_name} • {event.venue_name}</p>
            </div>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F5] border border-[#D8B5B0] text-[#9E6F6D] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live</span>
            </a>
          </div>

          {/* Public Link Box */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E9D3D0]">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="w-full bg-transparent text-xs font-mono text-[#51484A] px-2 outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Primary Action — Broadcast to Guests */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-white shadow-xl space-y-3 border border-emerald-500/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                <Send className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-extrabold text-white">Broadcast to All Guests</h4>
                <p className="text-xs text-emerald-100/80">
                  Send personalized cards & passes automatically via WhatsApp, SMS, or Email.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              if (onOpenBroadcastWizard) onOpenBroadcastWizard();
            }}
            className="w-full py-3.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <span>START BROADCAST WIZARD</span>
            <ArrowRight className="w-4 h-4 text-emerald-800" />
          </button>
        </div>

        {/* Direct Quick Share Options */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-[#8C7E80] uppercase tracking-wider text-center">
            Or Share Instantly via Individual Channels
          </h4>

          <div className="grid grid-cols-3 gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleQuickWhatsAppShare}
              className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 shadow-xs"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {/* SMS */}
            <button
              onClick={handleQuickSMSShare}
              className="p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 shadow-xs"
            >
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span>SMS</span>
            </button>

            {/* Email */}
            <button
              onClick={handleQuickEmailShare}
              className="p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 shadow-xs"
            >
              <Mail className="w-5 h-5 text-rose-600" />
              <span>Email</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
