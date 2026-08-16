import React, { useState, useEffect } from 'react';
import { 
  X, Send, MessageSquare, Mail, Copy, Check, Sparkles, 
  Smartphone, User, ArrowRight, ExternalLink, RefreshCw, Eye
} from 'lucide-react';
import {
  ShareEventData,
  ShareGuestData,
  ShareChannel,
  generateInvitationShareMessage,
  shareViaWhatsApp,
  shareViaSMS,
  shareViaGmail,
  copyInvitationLink,
  getPublicInvitationUrl,
} from '../services/invitationSharingService';

export interface ShareInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ShareEventData;
  guest?: ShareGuestData | null;
  defaultChannel?: ShareChannel;
}

export const ShareInvitationModal: React.FC<ShareInvitationModalProps> = ({
  isOpen,
  onClose,
  event,
  guest,
  defaultChannel = 'whatsapp',
}) => {
  const [activeChannel, setActiveChannel] = useState<ShareChannel>(defaultChannel);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>(guest?.phone || '');
  const [recipientEmail, setRecipientEmail] = useState<string>(guest?.email || '');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sending, setSending] = useState(false);

  // Sync recipient details when guest changes
  useEffect(() => {
    setRecipientPhone(guest?.phone || '');
    setRecipientEmail(guest?.email || '');
  }, [guest]);

  // Sync default message when channel, event, or guest changes
  useEffect(() => {
    if (!isOpen) return;
    const generated = generateInvitationShareMessage({
      event,
      guest: guest ? { ...guest, phone: recipientPhone, email: recipientEmail } : null,
      channel: activeChannel,
    });

    setCustomMessage(generated.text);
    if (generated.subject) {
      setCustomSubject(generated.subject);
    }
  }, [isOpen, activeChannel, event, guest]);

  if (!isOpen) return null;

  const publicUrl = getPublicInvitationUrl(
    event,
    guest ? { ...guest, phone: recipientPhone, email: recipientEmail } : null
  );

  const handleResetMessage = () => {
    const generated = generateInvitationShareMessage({
      event,
      guest: guest ? { ...guest, phone: recipientPhone, email: recipientEmail } : null,
      channel: activeChannel,
    });
    setCustomMessage(generated.text);
    if (generated.subject) setCustomSubject(generated.subject);
    setStatusNotice('Message reset to default template.');
    setTimeout(() => setStatusNotice(null), 2500);
  };

  const handleSend = async () => {
    setSending(true);
    setStatusNotice(null);

    const activeGuest: ShareGuestData | null = guest
      ? { ...guest, phone: recipientPhone, email: recipientEmail }
      : recipientPhone || recipientEmail
      ? { name: 'Guest', phone: recipientPhone, email: recipientEmail }
      : null;

    try {
      if (activeChannel === 'whatsapp') {
        const res = await shareViaWhatsApp({
          event,
          guest: activeGuest,
          customMessage,
        });
        setStatusNotice(res.message);
      } else if (activeChannel === 'sms') {
        const res = await shareViaSMS({
          event,
          guest: activeGuest,
          customMessage,
        });
        setStatusNotice(res.message);
      } else if (activeChannel === 'gmail') {
        const res = await shareViaGmail({
          event,
          guest: activeGuest,
          customSubject,
          customMessage,
        });
        setStatusNotice(res.message);
      } else if (activeChannel === 'copy') {
        const res = await copyInvitationLink({
          event,
          guest: activeGuest,
        });
        setCopiedLink(true);
        setStatusNotice(res.message);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initiate share action.');
    } finally {
      setSending(false);
    }
  };

  const handleDirectCopy = async () => {
    const res = await copyInvitationLink({
      event,
      guest: guest ? { ...guest, phone: recipientPhone, email: recipientEmail } : null,
    });
    setCopiedLink(true);
    setStatusNotice(res.message);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-xl bg-[#FFFDFC] text-[#302829] rounded-t-3xl sm:rounded-3xl border border-[#E9D3D0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E9D3D0] flex items-center justify-between bg-[#FAF7F3]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#9E6F6D] text-white flex items-center justify-center shadow-md">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-extrabold text-base sm:text-lg text-[#302829] leading-tight">
                {guest ? `Invite ${guest.name}` : 'Share Invitation'}
              </h3>
              <p className="text-xs text-[#8C7E80] font-mono line-clamp-1">
                {event.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F2E5E2] text-[#8C7E80] hover:text-[#302829] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Details & Public Link Preview */}
        <div className="p-4 bg-[#FAF7F3]/70 border-b border-[#E9D3D0] space-y-2 text-xs">
          {guest ? (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#9E6F6D]" />
                <span className="font-bold text-[#302829]">{guest.name}</span>
                {guest.relationship && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-bold">
                    {guest.relationship}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-[#8C7E80]">
                {guest.phone && <span>📱 {guest.phone}</span>}
                {guest.email && <span>📧 {guest.email}</span>}
                {guest.pass_code && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    🎟️ {guest.pass_code}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm text-[#8C7E80]">
              <span className="flex items-center gap-1.5 font-bold text-[#302829]">
                <Sparkles className="w-4 h-4 text-[#C9AA78]" /> Public Invitation Link
              </span>
              <span className="text-[11px] font-mono text-[#9E6F6D] truncate max-w-[200px]">
                {publicUrl}
              </span>
            </div>
          )}

          {/* Direct Copy Button Bar */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#9E6F6D] hover:underline font-mono flex items-center gap-1 truncate"
            >
              <Eye className="w-3.5 h-3.5" /> View Guest Page ›
            </a>

            <button
              type="button"
              onClick={handleDirectCopy}
              className="px-3 py-1 rounded-xl bg-white hover:bg-[#F2E5E2] border border-[#D8B5B0] text-[#302829] font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#9E6F6D]" />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Channel Selection Tabs */}
        <div className="grid grid-cols-4 p-2 bg-[#F2E5E2]/40 gap-1 border-b border-[#E9D3D0]">
          <button
            type="button"
            onClick={() => setActiveChannel('whatsapp')}
            className={`py-2.5 px-2 rounded-2xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              activeChannel === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[#51484A] hover:bg-white/80'
            }`}
          >
            <span className="text-base sm:text-sm">📱</span>
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('sms')}
            className={`py-2.5 px-2 rounded-2xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              activeChannel === 'sms'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[#51484A] hover:bg-white/80'
            }`}
          >
            <span className="text-base sm:text-sm">💬</span>
            <span>SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('gmail')}
            className={`py-2.5 px-2 rounded-2xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              activeChannel === 'gmail'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-[#51484A] hover:bg-white/80'
            }`}
          >
            <span className="text-base sm:text-sm">📧</span>
            <span>Gmail</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('copy')}
            className={`py-2.5 px-2 rounded-2xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              activeChannel === 'copy'
                ? 'bg-[#9E6F6D] text-white shadow-md'
                : 'text-[#51484A] hover:bg-white/80'
            }`}
          >
            <span className="text-base sm:text-sm">🔗</span>
            <span>Copy Link</span>
          </button>
        </div>

        {/* Message Editor & Customizer */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {/* Missing contact fallbacks */}
          {activeChannel === 'whatsapp' && !recipientPhone && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
              <label className="text-xs font-bold text-amber-900 block">
                📱 Enter WhatsApp Number (Optional):
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210 (or leave blank to select chat in WhatsApp)"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {activeChannel === 'sms' && !recipientPhone && (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5">
              <label className="text-xs font-bold text-blue-900 block">
                💬 Enter Mobile Number for SMS:
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-blue-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {activeChannel === 'gmail' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                <label className="text-xs font-bold text-rose-900 block">
                  📧 Recipient Email Address:
                </label>
                <input
                  type="email"
                  placeholder="e.g. priyanka@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-rose-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#51484A] block">
                  Email Subject:
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E9D3D0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                />
              </div>
            </div>
          )}

          {/* Message Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#51484A]">
                {activeChannel === 'whatsapp' ? 'WhatsApp Message Preview:' : activeChannel === 'sms' ? 'SMS Text Message:' : 'Email Body:'}
              </span>

              <button
                type="button"
                onClick={handleResetMessage}
                className="text-[11px] text-[#9E6F6D] hover:underline flex items-center gap-1"
                title="Reset to default AI generated wording"
              >
                <RefreshCw className="w-3 h-3" /> Reset Template
              </button>
            </div>

            <textarea
              rows={activeChannel === 'sms' ? 4 : 7}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-white border border-[#E9D3D0] text-xs leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-[#9E6F6D] text-[#302829] shadow-inner"
            />

            <div className="flex items-center justify-between text-[10px] text-[#8C7E80] font-mono">
              <span>{customMessage.length} characters</span>
              <span>✓ Clickable Link Included</span>
            </div>
          </div>

          {/* Status / Feedback Notice */}
          {statusNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs text-center animate-in fade-in">
              {statusNotice}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF7F3] border-t border-[#E9D3D0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[#D8B5B0] text-[#51484A] font-bold text-xs hover:bg-[#F2E5E2] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${
              activeChannel === 'whatsapp'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600'
                : activeChannel === 'sms'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
                : activeChannel === 'gmail'
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600'
                : 'bg-gradient-to-r from-[#9E6F6D] to-[#875B59]'
            }`}
          >
            {activeChannel === 'whatsapp' && <span className="text-sm">📱</span>}
            {activeChannel === 'sms' && <span className="text-sm">💬</span>}
            {activeChannel === 'gmail' && <span className="text-sm">📧</span>}
            {activeChannel === 'copy' && <Copy className="w-4 h-4" />}

            <span>
              {sending
                ? 'Preparing...'
                : activeChannel === 'whatsapp'
                ? 'SEND VIA WHATSAPP →'
                : activeChannel === 'sms'
                ? 'SEND VIA SMS →'
                : activeChannel === 'gmail'
                ? 'SEND VIA GMAIL →'
                : 'COPY INVITATION LINK'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
