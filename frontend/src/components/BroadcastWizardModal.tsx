import React, { useState, useEffect } from 'react';
import { 
  X, Check, Send, Sparkles, MessageSquare, Mail, Smartphone, 
  Users, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  Filter, Search, CheckSquare, Square, RefreshCw, Eye, ShieldAlert
} from 'lucide-react';
import { apiFetch } from '../services/api';

export interface BroadcastWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  hostName: string;
  guests: any[];
  onCampaignCreated: (campaignId: string) => void;
}

export const BroadcastWizardModal: React.FC<BroadcastWizardModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  hostName,
  guests,
  onCampaignCreated,
}) => {
  // Wizard Step (1: Channels, 2: Guests, 3: Personalize, 4: Confirm)
  const [step, setStep] = useState<number>(1);

  // Channels Selection
  const [selectedChannels, setSelectedChannels] = useState<{
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  }>({
    whatsapp: true,
    sms: false,
    email: false,
  });

  // Effective guests list (loaded from API or passed as props)
  const [effectiveGuests, setEffectiveGuests] = useState<any[]>(guests || []);

  // Guest Selection
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [guestSearch, setGuestSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [rsvpFilter, setRsvpFilter] = useState('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState('ALL');

  // Message Personalization
  const [channelTab, setChannelTab] = useState<'WHATSAPP' | 'SMS' | 'EMAIL'>('WHATSAPP');
  const [customWhatsApp, setCustomWhatsApp] = useState('');
  const [customSMS, setCustomSMS] = useState('');
  const [customEmailSubject, setCustomEmailSubject] = useState('');
  const [customEmailBody, setCustomEmailBody] = useState('');

  // AI Personalization
  const [enableAiPersonalization, setEnableAiPersonalization] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCopies, setAiCopies] = useState<{ [guestId: string]: string }>({});

  // Preview
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewGuestId, setPreviewGuestId] = useState<string>('');
  const [previewText, setPreviewText] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState(`${eventTitle} Broadcast`);
  const [confirmedLargeSend, setConfirmedLargeSend] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize selected guests and default templates on open
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setCampaignTitle(`${eventTitle} Broadcast`);
    setErrorMessage(null);

    // 1. Fetch real guests from database for this event
    apiFetch(`/events/${eventId}/guests`)
      .then((res: any) => {
        const fetched = res?.data || [];
        if (fetched.length > 0) {
          setEffectiveGuests(fetched);
          const validIds = fetched
            .map((g: any) => g.id)
            .filter((id: any) => typeof id === 'string' && id && id !== 'undefined');
          setSelectedGuestIds(new Set(validIds));
          if (validIds.length > 0) setPreviewGuestId(validIds[0]);
        } else if (guests && guests.length > 0) {
          setEffectiveGuests(guests);
          const validIds = guests
            .map((g: any) => g.id)
            .filter((id: any) => typeof id === 'string' && id && id !== 'undefined');
          setSelectedGuestIds(new Set(validIds));
          if (validIds.length > 0) setPreviewGuestId(validIds[0]);
        }
      })
      .catch(() => {
        if (guests && guests.length > 0) {
          setEffectiveGuests(guests);
          const validIds = guests
            .map((g: any) => g.id)
            .filter((id: any) => typeof id === 'string' && id && id !== 'undefined');
          setSelectedGuestIds(new Set(validIds));
          if (validIds.length > 0) setPreviewGuestId(validIds[0]);
        }
      });

    // 2. Fetch eligibility and default templates
    apiFetch(`/events/${eventId}/broadcast/eligibility`)
      .then((res: any) => {
        if (res?.data?.default_templates) {
          setCustomWhatsApp(res.data.default_templates.whatsapp || '');
          setCustomSMS(res.data.default_templates.sms || '');
          setCustomEmailSubject(res.data.default_templates.email_subject || '');
          setCustomEmailBody(res.data.default_templates.email_body || '');
        }
      })
      .catch(() => {});
  }, [isOpen, eventId, eventTitle, guests]);

  // Fetch preview when switching channel tab, template changes, or preview guest changes in Step 3
  useEffect(() => {
    if (!isOpen || step !== 3) return;
    setPreviewLoading(true);

    const selectedList = Array.from(selectedGuestIds);
    const targetGuestId = previewGuestId || selectedList[0] || (effectiveGuests[0]?.id);
    const bodyPayload: any = {
      event_id: eventId,
      channel: channelTab,
      guest_id: targetGuestId,
    };

    if (channelTab === 'WHATSAPP') bodyPayload.custom_template = customWhatsApp;
    else if (channelTab === 'SMS') bodyPayload.custom_template = customSMS;
    else if (channelTab === 'EMAIL') {
      bodyPayload.custom_template = customEmailBody;
      bodyPayload.custom_subject = customEmailSubject;
    }

    apiFetch(`/events/${eventId}/broadcast/preview`, {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
    })
      .then((res: any) => {
        if (res?.data) {
          setPreviewText(res.data.rendered_text || '');
          setPreviewHtml(res.data.rendered_html || '');
        }
      })
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
  }, [isOpen, step, channelTab, customWhatsApp, customSMS, customEmailSubject, customEmailBody, eventId, effectiveGuests, selectedGuestIds, previewGuestId]);

  if (!isOpen) return null;

  // Filtered Guests list
  const filteredGuests = effectiveGuests.filter((g) => {
    if (groupFilter !== 'ALL' && (g.group_name || 'General') !== groupFilter) return false;
    if (rsvpFilter !== 'ALL' && (g.rsvp_status || 'PENDING') !== rsvpFilter) return false;
    if (deliveryFilter === 'UNSENT' && g.delivery_status && g.delivery_status !== 'NOT_SENT') return false;
    if (deliveryFilter === 'DELIVERED' && g.delivery_status !== 'DELIVERED' && g.delivery_status !== 'READ') return false;
    if (deliveryFilter === 'FAILED' && g.delivery_status !== 'FAILED') return false;
    if (guestSearch.trim()) {
      const q = guestSearch.toLowerCase();
      const match = g.name.toLowerCase().includes(q) || (g.phone && g.phone.includes(q)) || (g.email && g.email.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const uniqueGroups = Array.from(new Set(effectiveGuests.map((g) => g.group_name || 'General')));

  // Selected Channels Array
  const activeChannelsList = Object.entries(selectedChannels)
    .filter(([_, active]) => active)
    .map(([ch]) => ch.toUpperCase());

  // Calculate estimated message count for selected guests across active channels
  const eligibleSelectedGuests = effectiveGuests.filter((g) => selectedGuestIds.has(g.id));
  
  let waEstimated = 0;
  let smsEstimated = 0;
  let emailEstimated = 0;

  eligibleSelectedGuests.forEach((g) => {
    const hasPhone = g.phone && String(g.phone).replace(/\D/g, '').length >= 8;
    const hasEmail = g.email && String(g.email).includes('@');
    if (selectedChannels.whatsapp && hasPhone) waEstimated++;
    if (selectedChannels.sms && hasPhone) smsEstimated++;
    if (selectedChannels.email && hasEmail) emailEstimated++;
  });

  const totalEstimatedMessages = waEstimated + smsEstimated + emailEstimated;

  // AI Generation trigger
  const handleGenerateAiCopies = async () => {
    setAiGenerating(true);
    setErrorMessage(null);
    try {
      const selectedArr = Array.from(selectedGuestIds).filter((id) => typeof id === 'string' && id && id !== 'undefined');
      const res: any = await apiFetch(`/events/${eventId}/broadcast/ai-personalize`, {
        method: 'POST',
        body: JSON.stringify({
          event_id: eventId,
          guest_ids: selectedArr.slice(0, 50), // Batch up to 50
          tone: 'warm_royal',
        }),
      });
      if (res?.data?.copies) {
        setAiCopies(res.data.copies);
      }
    } catch (err: any) {
      setErrorMessage('AI generation had a temporary timeout. Standard templates will be used for delivery.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Submit Campaign
  const handleStartBroadcast = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const idempotencyKey = `bcast_${eventId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const cleanGuestIds = Array.from(selectedGuestIds).filter(
      (id: any) => typeof id === 'string' && id && id !== 'undefined' && id !== 'null'
    );

    try {
      const res: any = await apiFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          event_id: eventId,
          title: campaignTitle,
          channels: activeChannelsList,
          guest_ids: cleanGuestIds.length > 0 ? cleanGuestIds : null,
          custom_whatsapp_message: customWhatsApp,
          custom_sms_message: customSMS,
          custom_email_subject: customEmailSubject,
          custom_email_message: customEmailBody,
          ai_personalized_copies: enableAiPersonalization ? aiCopies : null,
          idempotency_key: idempotencyKey,
        }),
      });

      if (res?.data?.campaign_id) {
        onCampaignCreated(res.data.campaign_id);
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to initialize broadcast campaign');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error launching broadcast campaign.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-3xl w-full p-6 sm:p-8 text-[#302829] shadow-2xl relative max-h-[92vh] flex flex-col justify-between">
        
        {/* Wizard Header */}
        <div className="border-b border-[#E9D3D0] pb-4 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-mono font-bold uppercase border border-[#E9D3D0] mb-1">
              SEND CELEBRATION INVITATIONS
            </div>
            <h2 className="font-serif text-2xl font-extrabold text-[#302829]">
              Send Invitations to Loved Ones
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#7A6B6C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 gap-2 my-4">
          {[
            { num: 1, title: '1. Channels' },
            { num: 2, title: '2. Guests' },
            { num: 3, title: '3. Personalize' },
            { num: 4, title: '4. Confirm & Send' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2 rounded-xl text-center border transition-all ${
                step === s.num
                  ? 'bg-[#9E6F6D] text-white border-transparent font-bold shadow-sm'
                  : step > s.num
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                  : 'bg-[#FAF7F5] text-[#8C7E80] border-[#E9D3D0]'
              }`}
            >
              <span className="text-xs">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP CONTENT BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 my-2 max-h-[55vh] custom-scrollbar">

          {/* ================= STEP 1: SELECT CHANNELS ================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302829]">Choose Delivery Channels</h3>
                <p className="text-xs text-[#7A6B6C]">
                  Select one or more channels to reach your guests. You can broadcast simultaneously across WhatsApp, SMS, and Email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* WhatsApp Card */}
                <div
                  onClick={() => setSelectedChannels({ ...selectedChannels, whatsapp: !selectedChannels.whatsapp })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    selectedChannels.whatsapp
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-md scale-[1.02]'
                      : 'border-[#E9D3D0] bg-white hover:bg-[#FAF7F5]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedChannels.whatsapp}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-emerald-400 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#302829]">WhatsApp</h4>
                    <p className="text-xs text-[#7A6B6C] mt-1">
                      Send personalized cards & passes directly to guests on WhatsApp.
                    </p>
                  </div>
                </div>

                {/* SMS Card */}
                <div
                  onClick={() => setSelectedChannels({ ...selectedChannels, sms: !selectedChannels.sms })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    selectedChannels.sms
                      ? 'border-blue-600 bg-blue-50/70 shadow-md scale-[1.02]'
                      : 'border-[#E9D3D0] bg-white hover:bg-[#FAF7F5]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedChannels.sms}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-blue-400 accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#302829]">SMS / Text</h4>
                    <p className="text-xs text-[#7A6B6C] mt-1">
                      Send instant invitation link through domestic text message.
                    </p>
                  </div>
                </div>

                {/* Email Card */}
                <div
                  onClick={() => setSelectedChannels({ ...selectedChannels, email: !selectedChannels.email })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    selectedChannels.email
                      ? 'border-rose-600 bg-rose-50/70 shadow-md scale-[1.02]'
                      : 'border-[#E9D3D0] bg-white hover:bg-[#FAF7F5]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                      <Mail className="w-6 h-6" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedChannels.email}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-rose-400 accent-rose-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#302829]">Email</h4>
                    <p className="text-xs text-[#7A6B6C] mt-1">
                      Send luxury royal HTML invitation card with calendar invite.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: SELECT GUESTS ================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-[#8C7E80] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    placeholder="Search by name, phone or email..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E9D3D0] text-xs"
                  />
                </div>

                <div>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white border border-[#E9D3D0] text-xs font-medium"
                  >
                    <option value="ALL">All Groups</option>
                    {uniqueGroups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={rsvpFilter}
                    onChange={(e) => setRsvpFilter(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white border border-[#E9D3D0] text-xs font-medium"
                  >
                    <option value="ALL">All RSVPs</option>
                    <option value="YES">Attending (YES)</option>
                    <option value="PENDING">Pending RSVP</option>
                    <option value="MAYBE">Maybe</option>
                    <option value="NO">Not Attending</option>
                  </select>
                </div>
              </div>

              {/* Select All Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedGuestIds.size === filteredGuests.length) {
                      setSelectedGuestIds(new Set());
                    } else {
                      setSelectedGuestIds(new Set(filteredGuests.map((g) => g.id)));
                    }
                  }}
                  className="flex items-center gap-2 font-bold text-[#9E6F6D]"
                >
                  {selectedGuestIds.size === filteredGuests.length && filteredGuests.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-[#9E6F6D]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#8C7E80]" />
                  )}
                  Select All ({filteredGuests.length})
                </button>
                <span className="font-bold text-[#302829]">
                  {selectedGuestIds.size} Guests Selected
                </span>
              </div>

              {/* Guest Table */}
              <div className="border border-[#E9D3D0] rounded-2xl overflow-hidden bg-white max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F5] border-b border-[#E9D3D0] text-[#7A6B6C] sticky top-0">
                    <tr>
                      <th className="p-3 w-8"></th>
                      <th className="p-3">Guest Name</th>
                      <th className="p-3">Phone / WhatsApp</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Channels</th>
                      <th className="p-3">RSVP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2E5E2]">
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-[#8C7E80]">
                          No guests match current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((g) => {
                        const isSelected = selectedGuestIds.has(g.id);
                        const hasPhone = g.phone && String(g.phone).replace(/\D/g, '').length >= 8;
                        const hasEmail = g.email && String(g.email).includes('@');

                        return (
                          <tr
                            key={g.id}
                            onClick={() => {
                              const next = new Set(selectedGuestIds);
                              if (next.has(g.id)) next.delete(g.id);
                              else next.add(g.id);
                              setSelectedGuestIds(next);
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#F2E5E2]/50' : 'hover:bg-[#FAF7F5]'
                            }`}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded border-[#D8B5B0] accent-[#9E6F6D]"
                              />
                            </td>
                            <td className="p-3 font-bold text-[#302829]">{g.name}</td>
                            <td className="p-3 font-mono text-[11px] text-[#51484A]">
                              {g.phone || <span className="text-slate-400 italic">No phone</span>}
                            </td>
                            <td className="p-3 text-[11px] text-[#51484A]">
                              {g.email || <span className="text-slate-400 italic">No email</span>}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasPhone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                                  WA
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasPhone ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'}`}>
                                  SMS
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasEmail ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-400'}`}>
                                  Email
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                g.rsvp_status === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {g.rsvp_status || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PERSONALIZE MESSAGE ================= */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Channel Tabs */}
              <div className="flex items-center gap-2 border-b border-[#E9D3D0] pb-2">
                {selectedChannels.whatsapp && (
                  <button
                    type="button"
                    onClick={() => setChannelTab('WHATSAPP')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      channelTab === 'WHATSAPP' ? 'bg-emerald-700 text-white' : 'bg-[#FAF7F5] text-[#51484A]'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp Template
                  </button>
                )}
                {selectedChannels.sms && (
                  <button
                    type="button"
                    onClick={() => setChannelTab('SMS')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      channelTab === 'SMS' ? 'bg-blue-700 text-white' : 'bg-[#FAF7F5] text-[#51484A]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> SMS Template
                  </button>
                )}
                {selectedChannels.email && (
                  <button
                    type="button"
                    onClick={() => setChannelTab('EMAIL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      channelTab === 'EMAIL' ? 'bg-rose-700 text-white' : 'bg-[#FAF7F5] text-[#51484A]'
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Email Template
                  </button>
                )}
              </div>

              {/* Template Editor Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Editor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#51484A]">
                      Template Message (supports dynamic variables)
                    </label>
                    <div className="text-[10px] text-[#8C7E80] font-mono">
                      Variables: <code>{'{{guest_name}}'}</code>, <code>{'{{event_name}}'}</code>
                    </div>
                  </div>

                  {channelTab === 'WHATSAPP' && (
                    <textarea
                      rows={8}
                      value={customWhatsApp}
                      onChange={(e) => setCustomWhatsApp(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-[#E9D3D0] text-xs font-mono bg-white focus:outline-none focus:border-[#9E6F6D]"
                    />
                  )}

                  {channelTab === 'SMS' && (
                    <textarea
                      rows={5}
                      value={customSMS}
                      onChange={(e) => setCustomSMS(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-[#E9D3D0] text-xs font-mono bg-white focus:outline-none focus:border-[#9E6F6D]"
                    />
                  )}

                  {channelTab === 'EMAIL' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customEmailSubject}
                        onChange={(e) => setCustomEmailSubject(e.target.value)}
                        placeholder="Email Subject Line"
                        className="w-full p-2.5 rounded-xl border border-[#E9D3D0] text-xs font-bold bg-white"
                      />
                      <textarea
                        rows={6}
                        value={customEmailBody}
                        onChange={(e) => setCustomEmailBody(e.target.value)}
                        placeholder="Personal note inside email..."
                        className="w-full p-3 rounded-2xl border border-[#E9D3D0] text-xs bg-white"
                      />
                    </div>
                  )}

                  {/* AI Personalization Option */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-700" />
                        <span className="text-xs font-bold text-purple-950">AI Personalized Copies (Optional)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableAiPersonalization}
                        onChange={(e) => setEnableAiPersonalization(e.target.checked)}
                        className="w-4 h-4 rounded border-purple-300 accent-purple-700"
                      />
                    </div>
                    <p className="text-[11px] text-purple-800">
                      Uses AI to tailor wording individually based on guest relationship.
                    </p>
                    {enableAiPersonalization && (
                      <button
                        type="button"
                        onClick={handleGenerateAiCopies}
                        disabled={aiGenerating}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] flex items-center gap-1.5"
                      >
                        {aiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{aiGenerating ? 'Generating AI Copies...' : `Generate for ${selectedGuestIds.size} Guests`}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#51484A] flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#9E6F6D]" /> Live Resolved Message Preview
                    </label>
                    {eligibleSelectedGuests.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] text-[#7A6B6C]">Preview Guest:</span>
                        <select
                          value={previewGuestId}
                          onChange={(e) => setPreviewGuestId(e.target.value)}
                          className="py-1 px-2 rounded-lg bg-white border border-[#E9D3D0] text-[11px] font-bold text-[#302829]"
                        >
                          {eligibleSelectedGuests.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.phone || g.email || 'No contact'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F5] border border-[#E9D3D0] h-64 overflow-y-auto text-xs whitespace-pre-wrap text-[#302829] shadow-inner font-sans leading-relaxed">
                    {previewLoading ? (
                      <div className="h-full flex items-center justify-center text-[#8C7E80] text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#9E6F6D]" />
                        Rendering exact guest preview...
                      </div>
                    ) : (
                      previewText || 'No preview available'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: REVIEW & CONFIRM ================= */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302829]">Review & Send Invitations</h3>
                <p className="text-xs text-[#7A6B6C]">
                  Please verify your message and recipients before sending.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7A6B6C]">Invitation Batch Name</label>
                  <input
                    type="text"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E9D3D0] text-sm font-bold bg-[#FAF7F5]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xl font-bold text-emerald-800 font-serif">{waEstimated}</div>
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">WhatsApp Guests</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-xl font-bold text-blue-800 font-serif">{smsEstimated}</div>
                    <div className="text-[10px] font-bold text-blue-700 uppercase">SMS Guests</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="text-xl font-bold text-rose-800 font-serif">{emailEstimated}</div>
                    <div className="text-[10px] font-bold text-rose-700 uppercase">Email Guests</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] flex items-center justify-between text-xs font-bold">
                  <span>Total Estimated Invitations:</span>
                  <span className="text-lg font-serif font-extrabold text-[#9E6F6D]">{totalEstimatedMessages}</span>
                </div>
              </div>

              {/* Large Send Warning */}
              {totalEstimatedMessages > 100 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Large Guest List Confirmation ({totalEstimatedMessages} invitations)</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    You are about to send invitations to {selectedGuestIds.size} guests across {activeChannelsList.join(', ')}.
                  </p>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={confirmedLargeSend}
                      onChange={(e) => setConfirmedLargeSend(e.target.checked)}
                      className="w-4 h-4 rounded border-amber-400 accent-amber-700"
                    />
                    <span>I confirm and want to send these invitations now</span>
                  </label>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="border-t border-[#E9D3D0] pt-4 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F5] hover:bg-[#F2E5E2] text-[#51484A] font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && activeChannelsList.length === 0) {
                  setErrorMessage('Please select at least one delivery channel.');
                  return;
                }
                if (step === 2 && selectedGuestIds.size === 0) {
                  setErrorMessage('Please select at least one guest.');
                  return;
                }
                setErrorMessage(null);
                setStep(step + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartBroadcast}
              disabled={isSubmitting || (totalEstimatedMessages > 100 && !confirmedLargeSend)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm shadow-xl flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sending Invitations...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>SEND INVITATIONS NOW</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
