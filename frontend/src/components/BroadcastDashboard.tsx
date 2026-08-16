import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, CheckCircle2, AlertCircle, Clock, Eye, RefreshCw, 
  RotateCcw, MessageSquare, Mail, Smartphone, Users, ChevronDown, 
  ChevronUp, ExternalLink, ShieldCheck, AlertTriangle, Sparkles, Filter, Search
} from 'lucide-react';
import { apiFetch } from '../services/api';

export interface BroadcastDashboardProps {
  eventId: string;
  eventTitle?: string;
  hostName?: string;
  onOpenBroadcastWizard?: () => void;
  onGuestUpdated?: () => void;
}

export const BroadcastDashboard: React.FC<BroadcastDashboardProps> = ({
  eventId,
  eventTitle = 'Celebration',
  hostName = 'Host Family',
  onOpenBroadcastWizard,
  onGuestUpdated,
}) => {
  // Campaign & Delivery State
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<any[]>([]);
  const [providersStatus, setProvidersStatus] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingAll, setRetryingAll] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);

  // Filters for Guest Delivery Status table
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch active campaign, history, and providers status
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);

    try {
      // 1. Fetch Providers Configuration Status
      const provRes: any = await apiFetch('/broadcast/providers-status').catch(() => null);
      if (provRes?.data) setProvidersStatus(provRes.data);

      // 2. Fetch Campaign History
      const histRes: any = await apiFetch(`/events/${eventId}/campaigns`).catch(() => null);
      const campaignsList: any[] = (histRes?.data as any[]) || [];
      setCampaignHistory(campaignsList);

      // 3. Set most recent active or completed campaign
      if (campaignsList.length > 0) {
        const latest = campaignsList[0];
        const detailRes: any = await apiFetch(`/campaigns/${latest.id}`).catch(() => null);
        if (detailRes?.data) {
          setActiveCampaign(detailRes.data);

          // 4. Fetch recipients
          const recRes: any = await apiFetch(`/campaigns/${latest.id}/recipients?limit=100`).catch(() => null);
          if (recRes?.data?.recipients) {
            setRecipients(recRes.data.recipients);
          }
        }
      } else {
        setActiveCampaign(null);
        setRecipients([]);
      }
    } catch (err) {
      console.error('Error loading broadcast dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadDashboardData();

    // Auto poll while campaign is actively QUEUED or PROCESSING
    const pollInterval = setInterval(() => {
      if (activeCampaign?.status === 'QUEUED' || activeCampaign?.status === 'PROCESSING') {
        loadDashboardData(true);
        if (onGuestUpdated) onGuestUpdated();
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [loadDashboardData, activeCampaign?.status, onGuestUpdated]);

  // Handle Retry All Failed
  const handleRetryAllFailed = async () => {
    if (!activeCampaign) return;
    setRetryingAll(true);
    try {
      const res = await apiFetch(`/campaigns/${activeCampaign.id}/retry-failed`, { method: 'POST' });
      showToast(res?.message || 'Retrying failed deliveries in background queue.');
      loadDashboardData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger retry.');
    } finally {
      setRetryingAll(false);
    }
  };

  // Handle Resend Single Message
  const handleResendSingle = async (messageId: string, guestName: string) => {
    setRetryingMessageId(messageId);
    try {
      await apiFetch(`/campaigns/resend-single/${messageId}`, { method: 'POST' });
      showToast(`Re-sent invitation to ${guestName}`);
      loadDashboardData(true);
    } catch (err: any) {
      showToast(err.message || 'Error re-sending message.');
    } finally {
      setRetryingMessageId(null);
    }
  };

  // Filtered recipients
  const filteredRecipients = recipients.filter((r) => {
    if (channelFilter !== 'ALL' && r.channel !== channelFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (r.guest_name && r.guest_name.toLowerCase().includes(q)) || (r.recipient && r.recipient.includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Calculate Progress Percentage
  const total = activeCampaign?.total_recipients || 0;
  const completed = (activeCampaign?.delivered_count || 0) + (activeCampaign?.read_count || 0) + (activeCampaign?.failed_count || 0) + (activeCampaign?.invalid_count || 0);
  const progressPct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div className="space-y-6 text-[#302829]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-900 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Development / Mock Mode Banner */}
      {providersStatus?.is_dev_mode && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-extrabold font-mono text-[10px] uppercase">
              Development / Mock Mode
            </span>
            <span className="text-[#51484A]">
              Simulator active for local testing. In production, connect live API keys in <code>.env</code>.
            </span>
          </div>
          <button
            onClick={() => loadDashboardData(true)}
            className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-900"
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Main Campaign Header & Controls */}
      <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#E9D3D0] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-mono font-bold uppercase border border-[#E9D3D0] mb-1.5">
            Multi-Channel Broadcast Hub
          </div>
          <h2 className="font-serif text-3xl font-extrabold text-[#302829]">
            {activeCampaign ? activeCampaign.title : 'Invitation Broadcasting'}
          </h2>
          <p className="text-xs text-[#7A6B6C] mt-0.5 font-medium">
            {activeCampaign
              ? `Initiated on ${new Date(activeCampaign.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : 'Broadcast personalized invitations to your guest list via WhatsApp, SMS, or Email'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => loadDashboardData(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F5] hover:bg-[#F2E5E2] border border-[#E9D3D0] text-[#51484A] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenBroadcastWizard}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 hover:scale-105"
          >
            <Send className="w-4 h-4 text-white" />
            <span>BROADCAST TO GUESTS</span>
          </button>
        </div>
      </div>

      {loading && !activeCampaign ? (
        <div className="p-12 text-center text-[#8C7E80] text-xs">
          Loading broadcasting dashboard...
        </div>
      ) : activeCampaign ? (
        <div className="space-y-6">

          {/* OVERALL PROGRESS & KPI STATS */}
          <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-[#E9D3D0] shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#7A6B6C] uppercase tracking-wider">Overall Dispatch Progress</span>
                <div className="font-serif text-2xl font-extrabold text-[#302829] mt-0.5">
                  {completed} / {total} Invitations Sent
                </div>
              </div>

              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase border ${
                  activeCampaign.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : activeCampaign.status === 'PROCESSING'
                    ? 'bg-blue-100 text-blue-900 border-blue-300 animate-pulse'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {activeCampaign.status}
                </span>
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full bg-[#FAF7F5] rounded-full h-3.5 border border-[#E9D3D0] overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[#9E6F6D] via-emerald-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>

            {/* 5 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {/* Delivered */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-emerald-700 text-xl font-serif font-extrabold">
                  {activeCampaign.delivered_count}
                </div>
                <div className="text-[10px] font-bold text-emerald-900 uppercase mt-0.5">🟢 Delivered</div>
              </div>

              {/* Read */}
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                <div className="text-purple-700 text-xl font-serif font-extrabold">
                  {activeCampaign.read_count}
                </div>
                <div className="text-[10px] font-bold text-purple-900 uppercase mt-0.5">👁 Viewed / Read</div>
              </div>

              {/* Sent (In Transit) */}
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                <div className="text-blue-700 text-xl font-serif font-extrabold">
                  {activeCampaign.sent_count}
                </div>
                <div className="text-[10px] font-bold text-blue-900 uppercase mt-0.5">🔵 Sent (Transit)</div>
              </div>

              {/* Waiting / Queued */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-amber-700 text-xl font-serif font-extrabold">
                  {activeCampaign.queued_count + activeCampaign.sending_count}
                </div>
                <div className="text-[10px] font-bold text-amber-900 uppercase mt-0.5">🟠 Waiting / Sending</div>
              </div>

              {/* Failed */}
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <div className="text-rose-700 text-xl font-serif font-extrabold">
                  {activeCampaign.failed_count + activeCampaign.invalid_count}
                </div>
                <div className="text-[10px] font-bold text-rose-900 uppercase mt-0.5">🔴 Failed</div>
              </div>
            </div>
          </div>

          {/* CHANNEL BREAKDOWN */}
          {activeCampaign.channel_stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* WhatsApp Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#302829]">
                    <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    {activeCampaign.channel_stats.WHATSAPP?.delivered || 0} / {activeCampaign.channel_stats.WHATSAPP?.total || 0}
                  </span>
                </div>
                <div className="text-xs text-[#7A6B6C] flex items-center justify-between">
                  <span>Delivered: <strong>{activeCampaign.channel_stats.WHATSAPP?.delivered || 0}</strong></span>
                  <span>Failed: <strong>{activeCampaign.channel_stats.WHATSAPP?.failed || 0}</strong></span>
                </div>
              </div>

              {/* SMS Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#302829]">
                    <Smartphone className="w-4 h-4 text-blue-600" /> SMS
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-700">
                    {activeCampaign.channel_stats.SMS?.delivered || 0} / {activeCampaign.channel_stats.SMS?.total || 0}
                  </span>
                </div>
                <div className="text-xs text-[#7A6B6C] flex items-center justify-between">
                  <span>Delivered: <strong>{activeCampaign.channel_stats.SMS?.delivered || 0}</strong></span>
                  <span>Failed: <strong>{activeCampaign.channel_stats.SMS?.failed || 0}</strong></span>
                </div>
              </div>

              {/* Email Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#302829]">
                    <Mail className="w-4 h-4 text-rose-600" /> Email
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-700">
                    {activeCampaign.channel_stats.EMAIL?.delivered || 0} / {activeCampaign.channel_stats.EMAIL?.total || 0}
                  </span>
                </div>
                <div className="text-xs text-[#7A6B6C] flex items-center justify-between">
                  <span>Delivered: <strong>{activeCampaign.channel_stats.EMAIL?.delivered || 0}</strong></span>
                  <span>Failed: <strong>{activeCampaign.channel_stats.EMAIL?.failed || 0}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* GUEST-LEVEL DELIVERY DETAILS TABLE */}
          <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-[#E9D3D0] shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302829]">Guest Delivery Details</h3>
                <p className="text-xs text-[#7A6B6C]">Track exact delivery timestamps and retry failed messages</p>
              </div>

              {/* Retry Failed button */}
              {(activeCampaign.failed_count > 0 || activeCampaign.invalid_count > 0) && (
                <button
                  onClick={handleRetryAllFailed}
                  disabled={retryingAll}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${retryingAll ? 'animate-spin' : ''}`} />
                  <span>Retry All Failed ({activeCampaign.failed_count + activeCampaign.invalid_count})</span>
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C7E80] absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest name or destination..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] text-xs"
                />
              </div>

              <div>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] text-xs font-medium"
                >
                  <option value="ALL">All Channels</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] text-xs font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="READ">Viewed / Read</option>
                  <option value="SENT">Sent (In Transit)</option>
                  <option value="QUEUED">Waiting / Queued</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="border border-[#E9D3D0] rounded-2xl overflow-hidden bg-white max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F5] border-b border-[#E9D3D0] text-[#7A6B6C] sticky top-0">
                  <tr>
                    <th className="p-3">Guest Name</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Delivered Time</th>
                    <th className="p-3">Failure Reason</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2E5E2]">
                  {filteredRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8C7E80]">
                        No delivery records found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecipients.map((r) => {
                      const isFailed = r.status === 'FAILED' || r.status === 'INVALID_NUMBER';
                      const isRead = r.status === 'READ';
                      const isDelivered = r.status === 'DELIVERED';
                      const isRetrying = retryingMessageId === r.id;

                      return (
                        <tr key={r.id} className="hover:bg-[#FAF7F5] transition-colors">
                          <td className="p-3 font-bold text-[#302829]">
                            {r.guest_name || 'Guest'}
                            {r.relationship && (
                              <span className="block text-[10px] text-[#8C7E80] font-normal font-mono">
                                {r.relationship}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 font-bold text-[11px]">
                              {r.channel === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                              {r.channel === 'SMS' && <Smartphone className="w-3.5 h-3.5 text-blue-600" />}
                              {r.channel === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-rose-600" />}
                              <span>{r.channel}</span>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#51484A]">
                            {r.recipient}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              isRead
                                ? 'bg-purple-100 text-purple-900 border-purple-300'
                                : isDelivered
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : isFailed
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : 'bg-blue-100 text-blue-900 border-blue-300'
                            }`}>
                              {r.status === 'READ' ? '👁 Viewed' : r.status === 'DELIVERED' ? '✓ Delivered' : r.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#7A6B6C]">
                            {r.delivered_at
                              ? new Date(r.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : r.sent_at
                              ? 'In Transit'
                              : '—'}
                          </td>
                          <td className="p-3 text-[11px] text-rose-700 max-w-xs truncate" title={r.last_error || ''}>
                            {r.last_error || '—'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleResendSingle(r.id, r.guest_name)}
                              disabled={isRetrying}
                              className="px-2.5 py-1 rounded-lg bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] font-bold text-[10px] transition-colors"
                              title="Resend invitation to this guest"
                            >
                              {isRetrying ? 'Sending...' : 'Resend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CAMPAIGN HISTORY TIMELINE */}
          {campaignHistory.length > 1 && (
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-[#E9D3D0] shadow-md space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#302829]">Previous Broadcast Campaigns</h3>
              <div className="divide-y divide-[#F2E5E2]">
                {campaignHistory.slice(1).map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#302829]">{c.title}</div>
                      <div className="text-[10px] text-[#7A6B6C]">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {c.channels?.join(' + ')}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-emerald-800">{c.delivered_count} delivered</span>
                      {c.failed_count > 0 && <span className="text-rose-700 ml-2">({c.failed_count} failed)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-white border border-[#E9D3D0] shadow-md text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#F2E5E2] text-[#9E6F6D] flex items-center justify-center mx-auto">
            <Send className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-extrabold text-[#302829]">No Campaigns Sent Yet</h3>
            <p className="text-xs text-[#7A6B6C] max-w-md mx-auto">
              Ready to invite your guests? Launch a multi-channel broadcast to deliver personalized invitation cards & QR passes directly via WhatsApp, SMS, or Email.
            </p>
          </div>
          <button
            onClick={onOpenBroadcastWizard}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md transition-all hover:scale-105 inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4 text-white" />
            <span>START FIRST BROADCAST</span>
          </button>
        </div>
      )}
    </div>
  );
};
