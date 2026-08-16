import React, { useState } from 'react';
import { 
  Send, CheckCircle2, Users, Sparkles, X, Phone, Search, Copy, 
  MessageSquare, Check, Eye, Mail, ArrowRight, RefreshCw, AlertCircle
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
  formatPhoneNumber,
} from '../services/invitationSharingService';

interface BulkWhatsAppDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  guests: any[];
  publicUrl?: string;
  eventTitle?: string;
  hostName?: string;
  startDate?: string;
  venueName?: string;
  onDispatchComplete?: () => void;
}

export const BulkWhatsAppDispatchModal: React.FC<BulkWhatsAppDispatchModalProps> = ({
  isOpen,
  onClose,
  eventId,
  guests,
  publicUrl,
  eventTitle = 'Our Celebration',
  hostName = 'Gupta & Sharma Families',
  startDate,
  venueName,
  onDispatchComplete,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(guests.map((g) => g.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState<ShareChannel>('whatsapp');
  const [activeView, setActiveView] = useState<'GUESTS' | 'PREVIEW'>('GUESTS');
  const [dispatchingIndex, setDispatchingIndex] = useState<number | null>(null);
  const [sentGuestIds, setSentGuestIds] = useState<string[]>([]);
  const [failedGuestIds, setFailedGuestIds] = useState<string[]>([]);
  const [copiedLinkNotice, setCopiedLinkNotice] = useState(false);

  if (!isOpen) return null;

  const eventData: ShareEventData = {
    id: eventId,
    title: eventTitle,
    host_name: hostName,
    start_date: startDate,
    venue_name: venueName,
  };

  // Filtered Guests based on Search Query
  const filteredGuests = guests.filter((g) =>
    (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.phone || '').includes(searchQuery) ||
    (g.group_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalCount = guests.length;
  const selectedCount = selectedIds.length;
  const sentCount = sentGuestIds.length + guests.filter((g) => g.delivery_status === 'SENT' || g.delivery_status === 'READ' || g.open_count > 0).length;
  const notSentCount = Math.max(0, totalCount - sentCount);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredGuests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGuests.map((g) => g.id));
    }
  };

  const selectOnlyNotSent = () => {
    const notSentIds = guests
      .filter((g) => !sentGuestIds.includes(g.id) && (!g.delivery_status || g.delivery_status === 'NOT_SENT' || g.delivery_status === 'PENDING'))
      .map((g) => g.id);
    setSelectedIds(notSentIds);
  };

  // Sample guest preview message
  const sampleGuest = guests[0] || { name: 'Priyanka Sharma', phone: '9876543210', pass_code: 'NIM-1001' };
  const sampleMessage = generateInvitationShareMessage({
    event: eventData,
    guest: sampleGuest,
    channel: activeChannel,
    customBaseUrl: publicUrl,
  });

  // Single Guest Dispatch Trigger (Host-guided workflow)
  const handleDispatchGuest = async (guest: any, index: number) => {
    setDispatchingIndex(index);
    try {
      if (activeChannel === 'whatsapp') {
        await shareViaWhatsApp({
          event: eventData,
          guest,
          customBaseUrl: publicUrl,
        });
      } else if (activeChannel === 'sms') {
        await shareViaSMS({
          event: eventData,
          guest,
          customBaseUrl: publicUrl,
        });
      } else if (activeChannel === 'gmail') {
        await shareViaGmail({
          event: eventData,
          guest,
          customBaseUrl: publicUrl,
        });
      } else if (activeChannel === 'copy') {
        await copyInvitationLink({
          event: eventData,
          guest,
          customBaseUrl: publicUrl,
        });
      }

      if (!sentGuestIds.includes(guest.id)) {
        setSentGuestIds((prev) => [...prev, guest.id]);
      }
    } catch {
      if (!failedGuestIds.includes(guest.id)) {
        setFailedGuestIds((prev) => [...prev, guest.id]);
      }
    } finally {
      setDispatchingIndex(null);
    }
  };

  const handleCopyGeneralLink = async () => {
    await copyInvitationLink({
      event: eventData,
      customBaseUrl: publicUrl,
    });
    setCopiedLinkNotice(true);
    setTimeout(() => setCopiedLinkNotice(false), 3000);
  };

  const selectedGuestsList = guests.filter((g) => selectedIds.includes(g.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#FFFDFC] text-[#302829] rounded-3xl border border-[#E9D3D0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E9D3D0] flex items-center justify-between bg-[#FAF7F3]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-center shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-extrabold text-lg sm:text-xl text-[#302829]">
                Share Invitations with Guests
              </h3>
              <p className="text-xs text-[#8C7E80] font-mono">
                {eventTitle} • {totalCount} Total Guests
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

        {/* Stats Strip */}
        <div className="grid grid-cols-4 p-3 bg-[#FAF7F3] border-b border-[#E9D3D0] text-center gap-1">
          <div className="p-2 rounded-xl bg-white border border-[#E9D3D0]">
            <div className="text-base sm:text-lg font-extrabold font-mono text-[#302829]">{totalCount}</div>
            <div className="text-[10px] font-mono uppercase text-[#8C7E80]">Total</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-emerald-200">
            <div className="text-base sm:text-lg font-extrabold font-mono text-emerald-700">{selectedCount}</div>
            <div className="text-[10px] font-mono uppercase text-emerald-800">Selected</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-blue-200">
            <div className="text-base sm:text-lg font-extrabold font-mono text-blue-700">{sentCount}</div>
            <div className="text-[10px] font-mono uppercase text-blue-800">Sent</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-amber-200">
            <div className="text-base sm:text-lg font-extrabold font-mono text-amber-700">{notSentCount}</div>
            <div className="text-[10px] font-mono uppercase text-amber-800">Pending</div>
          </div>
        </div>

        {/* Channel & View Switcher */}
        <div className="p-3 bg-[#F2E5E2]/40 border-b border-[#E9D3D0] flex flex-wrap items-center justify-between gap-2">
          {/* Channel Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveChannel('whatsapp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeChannel === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-[#51484A] border border-[#E9D3D0]'
              }`}
            >
              <span>📱 WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel('sms')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeChannel === 'sms'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-[#51484A] border border-[#E9D3D0]'
              }`}
            >
              <span>💬 SMS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel('gmail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeChannel === 'gmail'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-[#51484A] border border-[#E9D3D0]'
              }`}
            >
              <span>📧 Gmail</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveView('GUESTS')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                activeView === 'GUESTS' ? 'bg-[#9E6F6D] text-white' : 'text-[#8C7E80] hover:bg-white'
              }`}
            >
              Guests List
            </button>
            <button
              type="button"
              onClick={() => setActiveView('PREVIEW')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                activeView === 'PREVIEW' ? 'bg-[#9E6F6D] text-white' : 'text-[#8C7E80] hover:bg-white'
              }`}
            >
              Message Preview
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeView === 'GUESTS' ? (
          <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
            {/* Search & Quick Filters */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#8C7E80] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest by name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#E9D3D0] text-xs focus:outline-none focus:ring-2 focus:ring-[#9E6F6D]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F3] border border-[#D8B5B0] text-[#302829] font-bold text-[11px]"
                >
                  {selectedIds.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  type="button"
                  onClick={selectOnlyNotSent}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[11px]"
                >
                  Pending Only
                </button>
              </div>
            </div>

            {/* Guest Dispatch Queue */}
            <div className="space-y-2">
              {filteredGuests.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8C7E80]">
                  No matching guests found.
                </div>
              ) : (
                filteredGuests.map((g, idx) => {
                  const isSelected = selectedIds.includes(g.id);
                  const isSent = sentGuestIds.includes(g.id) || g.delivery_status === 'SENT' || g.delivery_status === 'READ';
                  const isDispatching = dispatchingIndex === idx;

                  return (
                    <div
                      key={g.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-white border-[#E9D3D0] shadow-sm' : 'bg-[#FAF7F3]/60 border-transparent opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(g.id)}
                          className="w-4 h-4 rounded text-[#9E6F6D] focus:ring-[#9E6F6D] border-gray-300"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#302829] truncate">{g.name}</span>
                            {g.relationship && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[9px] font-bold">
                                {g.relationship}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-[#8C7E80] flex items-center gap-2">
                            <span>{g.phone || 'No phone'}</span>
                            {g.pass_code && <span>🎟️ {g.pass_code}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSent && (
                          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            ✓ Sent
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDispatchGuest(g, idx)}
                          disabled={isDispatching}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 text-white ${
                            activeChannel === 'whatsapp'
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                              : activeChannel === 'sms'
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                              : 'bg-rose-600 hover:bg-rose-700 shadow-sm'
                          }`}
                        >
                          <span>{isDispatching ? 'Sending...' : 'Send'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Preview View */
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#51484A] block uppercase font-mono">
                {activeChannel.toUpperCase()} Template Preview:
              </span>
              {sampleMessage.subject && (
                <div className="p-2.5 rounded-xl bg-white border border-[#E9D3D0] text-xs font-bold text-[#302829]">
                  Subject: {sampleMessage.subject}
                </div>
              )}
              <div className="p-4 rounded-2xl bg-white border border-[#E9D3D0] text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                {sampleMessage.text}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Personalization tags are automatically substituted for each guest:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                <li>Recipient Name & Salutation</li>
                <li>Personalized VIP Access Token Link</li>
                <li>Individual Gate Passcode</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-[#FAF7F3] border-t border-[#E9D3D0] flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyGeneralLink}
            className="px-4 py-2 rounded-xl bg-white border border-[#D8B5B0] text-[#302829] font-bold text-xs flex items-center gap-1.5 hover:bg-[#F2E5E2] transition-colors"
          >
            {copiedLinkNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#9E6F6D]" />}
            <span>{copiedLinkNotice ? 'Copied Public Link!' : 'Copy Public Link'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D8B5B0] text-[#51484A] font-bold text-xs hover:bg-[#F2E5E2] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
