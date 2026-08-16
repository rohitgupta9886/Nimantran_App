import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  X,
  Smartphone,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { apiFetch } from '../services/api';

interface WhatsAppCampaignDashboardProps {
  eventId: string;
  eventTitle?: string;
  hostName?: string;
  onGuestUpdated?: () => void;
}

interface ConfigStatus {
  is_configured: boolean;
  provider_name: string;
  phone_number_id?: string;
  business_account_id?: string;
  webhook_configured?: boolean;
  missing_keys: string[];
  message: string;
  public_base_url?: string;
}

interface EligibilityData {
  total_guests: number;
  eligible_count: number;
  unsent_eligible_count: number;
  already_sent_count: number;
  invalid_count: number;
  opted_out_count: number;
  invalid_guests: Array<{ id: string; name: string; phone?: string; reason: string }>;
}

interface CampaignMessage {
  id: string;
  guest_id: string;
  guest_name: string;
  relationship?: string;
  phone: string;
  normalized_phone?: string;
  masked_phone: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'RETRYING' | 'INVALID_NUMBER';
  provider_message_id?: string;
  attempt_count: number;
  last_error?: string;
  error_code?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
}

interface CampaignDetail {
  id: string;
  title: string;
  status: 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  total_recipients: number;
  queued_count: number;
  sending_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  invalid_count: number;
  skipped_count: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export const WhatsAppCampaignDashboard: React.FC<WhatsAppCampaignDashboardProps> = ({
  eventId,
  eventTitle = 'Celebration',
  hostName = 'Host Family',
  onGuestUpdated,
}) => {
  // State
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<CampaignDetail | null>(null);
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessage[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<CampaignDetail[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [broadcastScope, setBroadcastScope] = useState<'UNSENT_ONLY' | 'ALL_ELIGIBLE'>('UNSENT_ONLY');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStageText, setBroadcastStageText] = useState('Preparing invitations...');
  const [showInvalidDetails, setShowInvalidDetails] = useState(false);

  // Preview in Modal
  const [previewGuestId, setPreviewGuestId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Retrying message ID tracking
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Data
  const loadDashboardData = useCallback(async () => {
    try {
      const [configRes, eligRes, campsRes] = await Promise.all([
        apiFetch<ConfigStatus>(`/events/${eventId}/whatsapp/config-status`).catch(() => ({
          data: {
            is_configured: false,
            provider_name: 'Meta WhatsApp Cloud API',
            missing_keys: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
            message: 'Unable to check WhatsApp provider configuration.',
          },
        })),
        apiFetch<EligibilityData>(`/events/${eventId}/whatsapp/eligibility`).catch(() => ({
          data: {
            total_guests: 0,
            eligible_count: 0,
            unsent_eligible_count: 0,
            already_sent_count: 0,
            invalid_count: 0,
            opted_out_count: 0,
            invalid_guests: [],
          },
        })),
        apiFetch<CampaignDetail[]>(`/events/${eventId}/whatsapp/campaigns`).catch(() => ({ data: [] })),
      ]);

      setConfig(configRes.data);
      setEligibility(eligRes.data);

      const camps = Array.isArray(campsRes.data) ? campsRes.data : [];
      setCampaignHistory(camps);

      // If there are campaigns, load details for the latest one
      if (camps.length > 0) {
        const latest = camps[0];
        setActiveCampaign(latest);
        const detailRes = await apiFetch<{ campaign: CampaignDetail; messages: CampaignMessage[] }>(
          `/events/${eventId}/whatsapp/campaigns/${latest.id}`
        ).catch(() => null);

        if (detailRes && detailRes.data) {
          setActiveCampaign(detailRes.data.campaign);
          setCampaignMessages(detailRes.data.messages);
        }
      }
    } catch (err) {
      console.error('Failed to load WhatsApp campaign dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Polling loop when campaign is QUEUED or PROCESSING
  useEffect(() => {
    if (!activeCampaign) return;
    if (activeCampaign.status !== 'QUEUED' && activeCampaign.status !== 'PROCESSING') return;

    const interval = setInterval(async () => {
      try {
        const detailRes = await apiFetch<{ campaign: CampaignDetail; messages: CampaignMessage[] }>(
          `/events/${eventId}/whatsapp/campaigns/${activeCampaign.id}`
        );
        if (detailRes && detailRes.data) {
          setActiveCampaign(detailRes.data.campaign);
          setCampaignMessages(detailRes.data.messages);
          if (onGuestUpdated && detailRes.data.campaign.status === 'COMPLETED') {
            onGuestUpdated();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeCampaign, eventId, onGuestUpdated]);

  // Load preview for selected guest
  const loadPreview = async (guestId?: string) => {
    setPreviewLoading(true);
    try {
      const url = guestId
        ? `/events/${eventId}/whatsapp/preview?guest_id=${guestId}`
        : `/events/${eventId}/whatsapp/preview`;
      const res = await apiFetch<any>(url);
      setPreviewData(res.data);
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    loadPreview();
  };

  // Launch Broadcast Campaign
  const handleLaunchBroadcast = async () => {
    setIsBroadcasting(true);
    setBroadcastStageText('Validating event & guest credentials...');

    try {
      setBroadcastStageText('Preparing personalized invitation cards...');
      await new Promise((r) => setTimeout(r, 400));

      setBroadcastStageText('Enqueuing messages to WhatsApp Dispatch Worker...');
      const res = await apiFetch<any>(`/events/${eventId}/whatsapp/broadcast`, {
        method: 'POST',
        body: JSON.stringify({
          target_scope: broadcastScope,
        }),
      });

      showToast(`✨ Successfully launched WhatsApp broadcast for ${res.data.total_recipients} guests!`);
      setIsModalOpen(false);
      await loadDashboardData();
      if (onGuestUpdated) onGuestUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to start WhatsApp broadcast campaign.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Retry Single Message
  const handleRetryMessage = async (messageId: string) => {
    setRetryingId(messageId);
    try {
      await apiFetch(`/events/${eventId}/whatsapp/messages/${messageId}/retry`, {
        method: 'POST',
      });
      showToast('Queued message for automatic retry attempt.');
      // Refresh campaign status
      if (activeCampaign) {
        const detailRes = await apiFetch<{ campaign: CampaignDetail; messages: CampaignMessage[] }>(
          `/events/${eventId}/whatsapp/campaigns/${activeCampaign.id}`
        );
        if (detailRes && detailRes.data) {
          setActiveCampaign(detailRes.data.campaign);
          setCampaignMessages(detailRes.data.messages);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to retry message.');
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-[#FFFDFC] rounded-3xl border border-[#E9D3D0] space-y-3">
        <RefreshCw className="w-6 h-6 text-[#9E6F6D] animate-spin mx-auto" />
        <p className="text-xs font-mono text-[#8C7E80]">Connecting to WhatsApp Campaign Engine...</p>
      </div>
    );
  }

  // Calculate live stats
  const totalGuests = eligibility?.total_guests || 0;
  const eligibleCount = eligibility?.eligible_count || 0;
  const invalidCount = eligibility?.invalid_count || 0;
  const unsentCount = eligibility?.unsent_eligible_count || 0;
  const alreadySent = eligibility?.already_sent_count || 0;

  // Active campaign statistics
  const currentTotal = activeCampaign?.total_recipients || 0;
  const currentSent = (activeCampaign?.sent_count || 0) + (activeCampaign?.delivered_count || 0) + (activeCampaign?.read_count || 0);
  const currentDelivered = activeCampaign?.delivered_count || 0;
  const currentRead = activeCampaign?.read_count || 0;
  const currentFailed = activeCampaign?.failed_count || 0;
  const currentQueued = (activeCampaign?.queued_count || 0) + (activeCampaign?.sending_count || 0);

  const progressPercent = currentTotal > 0 ? Math.min(100, Math.round(((currentSent + currentFailed) / currentTotal) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PROVIDER CONNECTION STATUS CARD */}
      <div
        className={`p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          config?.is_configured
            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
            : 'bg-amber-50/70 border-amber-300 text-amber-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              config?.is_configured ? 'bg-emerald-600 text-white shadow-md' : 'bg-amber-500 text-white shadow-md'
            }`}
          >
            {config?.is_configured ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-extrabold text-sm sm:text-base">
                {config?.is_configured
                  ? 'Official Meta WhatsApp Business Cloud API'
                  : 'WhatsApp Business API Connection'}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                  config?.is_configured
                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                    : 'bg-amber-200 text-amber-900 border border-amber-400'
                }`}
              >
                {config?.is_configured ? '● Connected' : 'Setup Required'}
              </span>
            </div>

            <p className="text-xs text-[#51484A]">
              {config?.message ||
                (config?.is_configured
                  ? 'Ready to broadcast personalized invitations with real delivery & read webhooks.'
                  : 'Connect your Meta WhatsApp Business API credentials to send live invitations.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            loadDashboardData();
          }}
          disabled={refreshing}
          className="px-3.5 py-2 rounded-xl bg-white border border-[#E9D3D0] text-xs font-bold text-[#51484A] hover:bg-[#FAF7F3] flex items-center gap-1.5 shrink-0 self-end md:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#9E6F6D] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E9D3D0] text-center shadow-sm">
          <div className="text-xl font-extrabold font-mono text-[#302829]">{totalGuests}</div>
          <div className="text-[10px] font-mono font-bold uppercase text-[#8C7E80] mt-0.5">Total Guests</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-center shadow-sm">
          <div className="text-xl font-extrabold font-mono text-emerald-700">{eligibleCount}</div>
          <div className="text-[10px] font-mono font-bold uppercase text-emerald-800 mt-0.5">Eligible WhatsApp</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-blue-200 text-center shadow-sm">
          <div className="text-xl font-extrabold font-mono text-blue-700">{currentSent}</div>
          <div className="text-[10px] font-mono font-bold uppercase text-blue-800 mt-0.5">Sent / In Flight</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-teal-200 text-center shadow-sm">
          <div className="text-xl font-extrabold font-mono text-teal-700">{currentDelivered}</div>
          <div className="text-[10px] font-mono font-bold uppercase text-teal-800 mt-0.5">✓ Delivered</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-200 text-center shadow-sm">
          <div className="text-xl font-extrabold font-mono text-purple-700">{currentRead}</div>
          <div className="text-[10px] font-mono font-bold uppercase text-purple-800 mt-0.5">👁 Read</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200 text-center shadow-sm">
          <div className="text-xl font-extrabold font-mono text-rose-700">{currentFailed + invalidCount}</div>
          <div className="text-[10px] font-mono font-bold uppercase text-rose-800 mt-0.5">Failed / Invalid</div>
        </div>
      </div>

      {/* 3. BROADCAST TRIGGER BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#5E3735] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-amber-300/40">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-amber-200 text-xs font-extrabold uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>P0 Production WhatsApp Broadcast Pipeline</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">Broadcast WhatsApp Invitations</h3>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            Dispatch personalized invitations with unique guest tokens, interactive links, and real-time delivery tracking to your guest list.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={!config?.is_configured || eligibleCount === 0 || isBroadcasting}
            className={`px-6 py-3.5 rounded-2xl font-extrabold text-xs shadow-2xl flex items-center gap-2 transition-all active:scale-95 border ${
              config?.is_configured && eligibleCount > 0
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 border-emerald-300 shadow-emerald-900/30'
                : 'bg-slate-700/60 text-slate-300 border-slate-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {unsentCount > 0
                ? `Broadcast WhatsApp Cards to ${unsentCount} Guests`
                : `Broadcast WhatsApp Cards to All ${eligibleCount} Guests`}
            </span>
          </button>
        </div>
      </div>

      {/* 4. ACTIVE CAMPAIGN PROGRESS STRIP */}
      {activeCampaign && (activeCampaign.status === 'QUEUED' || activeCampaign.status === 'PROCESSING') && (
        <div className="p-5 rounded-3xl bg-white border border-blue-200 shadow-md space-y-3 animate-pulse">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="font-bold text-blue-950 font-serif text-sm">
                Sending Invitations ({currentSent + currentFailed} of {currentTotal} processed)
              </span>
            </div>
            <span className="font-mono font-extrabold text-blue-800 text-sm">{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#51484A]">
            <span>✓ {currentDelivered} Delivered</span>
            <span>👁 {currentRead} Read</span>
            <span>◷ {currentQueued} In Flight</span>
            {currentFailed > 0 && <span className="text-rose-600 font-bold">✕ {currentFailed} Failed</span>}
          </div>
        </div>
      )}

      {/* 5. GUEST-LEVEL LIVE DELIVERY STREAM */}
      <div className="bg-white rounded-3xl border border-[#E9D3D0] shadow-sm overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-[#E9D3D0] flex items-center justify-between bg-[#FAF7F3]">
          <div>
            <h4 className="font-serif font-extrabold text-base text-[#302829]">
              Guest-Level WhatsApp Delivery Log
            </h4>
            <p className="text-xs text-[#8C7E80] font-mono">
              {campaignMessages.length > 0
                ? `Showing ${campaignMessages.length} recipients for active campaign`
                : 'No recent broadcast jobs recorded yet'}
            </p>
          </div>

          {invalidCount > 0 && (
            <button
              type="button"
              onClick={() => setShowInvalidDetails(!showInvalidDetails)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{invalidCount} Invalid Number{invalidCount !== 1 ? 's' : ''}</span>
              {showInvalidDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Invalid Numbers Dropdown Details */}
        {showInvalidDetails && eligibility?.invalid_guests && (
          <div className="p-4 bg-rose-50/60 border-b border-rose-200 space-y-2 text-xs">
            <h5 className="font-bold text-rose-950">Invalid WhatsApp Numbers Checklist:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {eligibility.invalid_guests.map((inv) => (
                <div key={inv.id} className="p-2.5 rounded-xl bg-white border border-rose-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-rose-900">{inv.name}</div>
                    <div className="font-mono text-[11px] text-slate-500">{inv.phone || 'No phone provided'}</div>
                  </div>
                  <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    {inv.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Table */}
        <div className="overflow-x-auto">
          {campaignMessages.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8C7E80] space-y-2">
              <Smartphone className="w-8 h-8 text-[#9E6F6D] opacity-40 mx-auto" />
              <p className="font-bold text-[#302829]">No invitations broadcast yet</p>
              <p>Click "Broadcast WhatsApp Cards" above to send personalized digital invitations to your guests.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F3] border-b border-[#E9D3D0] text-[#8C7E80] font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">WhatsApp Number</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Provider Message ID</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9D3D0]">
                {campaignMessages.map((msg) => {
                  return (
                    <tr key={msg.id} className="hover:bg-[#FAF7F3]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#302829]">{msg.guest_name}</div>
                        {msg.relationship && (
                          <span className="text-[10px] text-[#9E6F6D] bg-[#F2E5E2] px-1.5 py-0.2 rounded font-bold">
                            {msg.relationship}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[#51484A]">
                        {msg.normalized_phone || msg.phone}
                      </td>

                      <td className="py-3 px-4">
                        {msg.status === 'READ' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 font-bold text-[10px]">
                            👁 Read
                          </span>
                        )}
                        {msg.status === 'DELIVERED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 font-bold text-[10px]">
                            ✓ Delivered
                          </span>
                        )}
                        {msg.status === 'SENT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-bold text-[10px]">
                            📨 Sent to Meta
                          </span>
                        )}
                        {msg.status === 'SENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] animate-pulse">
                            🔄 Sending...
                          </span>
                        )}
                        {msg.status === 'QUEUED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-300 font-bold text-[10px]">
                            ⏳ Queued
                          </span>
                        )}
                        {msg.status === 'FAILED' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[10px]">
                              ✕ Failed
                            </span>
                            {msg.last_error && (
                              <div className="text-[10px] text-rose-700 max-w-xs truncate" title={msg.last_error}>
                                {msg.last_error}
                              </div>
                            )}
                          </div>
                        )}
                        {msg.status === 'INVALID_NUMBER' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300 font-bold text-[10px]">
                            ⚠ Invalid Number
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#8C7E80]">
                        {msg.provider_message_id ? (
                          <span className="truncate block max-w-[140px]" title={msg.provider_message_id}>
                            {msg.provider_message_id}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {(msg.status === 'FAILED' || msg.status === 'RETRYING') && (
                          <button
                            type="button"
                            onClick={() => handleRetryMessage(msg.id)}
                            disabled={retryingId === msg.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${retryingId === msg.id ? 'animate-spin' : ''}`} />
                            <span>{retryingId === msg.id ? 'Retrying...' : 'Retry'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 6. PRE-BROADCAST CONFIRMATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#FFFDFC] text-[#302829] rounded-3xl border border-[#E9D3D0] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-[#E9D3D0] flex items-center justify-between bg-[#FAF7F3]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-extrabold text-lg sm:text-xl text-[#302829]">
                    Confirm WhatsApp Invitation Broadcast
                  </h3>
                  <p className="text-xs text-[#8C7E80] font-mono">
                    {eventTitle} • Real WhatsApp Cloud API Dispatch
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isBroadcasting}
                className="p-2 rounded-full hover:bg-[#F2E5E2] text-[#8C7E80] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar text-xs">
              {/* Eligibility Summary Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-center">
                  <div className="font-mono text-lg font-extrabold text-[#302829]">{totalGuests}</div>
                  <div className="text-[10px] font-mono uppercase text-[#8C7E80]">Total Guests</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-center">
                  <div className="font-mono text-lg font-extrabold text-emerald-800">{eligibleCount}</div>
                  <div className="text-[10px] font-mono uppercase text-emerald-900">Valid WhatsApp</div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-300 text-center">
                  <div className="font-mono text-lg font-extrabold text-blue-800">{unsentCount}</div>
                  <div className="text-[10px] font-mono uppercase text-blue-900">Not Yet Sent</div>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="font-bold text-[#302829] uppercase tracking-wider block font-mono">
                  Select Broadcast Target Scope:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastScope('UNSENT_ONLY')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      broadcastScope === 'UNSENT_ONLY'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-white border-[#E9D3D0] opacity-70'
                    }`}
                  >
                    <div className="font-bold text-[#302829] flex items-center justify-between">
                      <span>Send to Unsent Guests Only</span>
                      <span className="font-mono font-extrabold text-emerald-700">{unsentCount} Guests</span>
                    </div>
                    <p className="text-[11px] text-[#7A6B6C] mt-0.5">
                      Prevents duplicate messages to guests who have already received their invitation.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastScope('ALL_ELIGIBLE')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      broadcastScope === 'ALL_ELIGIBLE'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-white border-[#E9D3D0] opacity-70'
                    }`}
                  >
                    <div className="font-bold text-[#302829] flex items-center justify-between">
                      <span>Send to All Eligible Guests</span>
                      <span className="font-mono font-extrabold text-emerald-700">{eligibleCount} Guests</span>
                    </div>
                    <p className="text-[11px] text-[#7A6B6C] mt-0.5">
                      Sends or re-sends personalized invitations to all guests with valid numbers.
                    </p>
                  </button>
                </div>
              </div>

              {/* Personalized Message Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#302829] uppercase tracking-wider font-mono">
                    Personalized WhatsApp Message Preview:
                  </label>
                  {previewLoading && <span className="text-slate-400 font-mono">Loading preview...</span>}
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E9D3D0] text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-56 overflow-y-auto">
                  {previewData?.rendered_message || (
                    <div className="text-slate-400 italic">Generating personalized greeting...</div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2 text-[11px]">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Each recipient receives their own personalized salutation, unique security token URL, and family details.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-[#FAF7F3] border-t border-[#E9D3D0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isBroadcasting}
                className="px-5 py-2.5 rounded-2xl border border-[#D8B5B0] text-xs font-bold text-[#51484A] hover:bg-[#F2E5E2]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLaunchBroadcast}
                disabled={isBroadcasting || (broadcastScope === 'UNSENT_ONLY' ? unsentCount === 0 : eligibleCount === 0)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{broadcastStageText}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>
                      {broadcastScope === 'UNSENT_ONLY'
                        ? `Send Invitations to ${unsentCount} Guests`
                        : `Send Invitations to All ${eligibleCount} Guests`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
