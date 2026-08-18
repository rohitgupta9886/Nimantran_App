import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, QrCode, Tv, Eye, Plus, Upload, Send, Sparkles, 
  CheckCircle, CheckCircle2, Smartphone, Edit2, Trash2, MessageSquare, PhoneCall, 
  Copy, FileText, Check, X, AlertCircle, Heart, Image as ImageIcon,
  Download, FileImage, ArrowLeft, Camera, Key, Bell, Clock, Star, Trophy, Gift, Search
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { InvitationCard } from '../components/InvitationCard';
import { downloadCardAsJpeg, downloadCardAsPng, downloadCardAsPdf } from '../utils/cardExport';
import { shareAiCardToWhatsApp } from '../utils/whatsappShare';
import { SelectFromMasterListModal } from '../components/SelectFromMasterListModal';
import { BulkWhatsAppDispatchModal } from '../components/BulkWhatsAppDispatchModal';
import { WhatsAppCampaignDashboard } from '../components/WhatsAppCampaignDashboard';
import { BroadcastDashboard } from '../components/BroadcastDashboard';
import { BroadcastWizardModal } from '../components/BroadcastWizardModal';
import { PublishAndShareModal } from '../components/PublishAndShareModal';
import { EventStoryStudio } from '../components/StoryEngine/EventStoryStudio';
import { RsvpAnalyticsCard } from '../components/RsvpAnalyticsCard';
import { QrScannerModal } from '../components/QrScannerModal';
import { ShareInvitationModal } from '../components/ShareInvitationModal';
import { CelebrationWorkspaceJourney } from '../components/CelebrationWorkspaceJourney';
import { EditCelebrationModal } from '../components/EditCelebrationModal';
import { copyInvitationLink } from '../services/invitationSharingService';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
  const [isBroadcastWizardOpen, setIsBroadcastWizardOpen] = useState(false);
  const [isPublishShareModalOpen, setIsPublishShareModalOpen] = useState(false);
  const [isEditCelebrationOpen, setIsEditCelebrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'guests' | 'attendance' | 'memories' | 'import' | 'campaigns' | 'card' | 'reminders'>('guests');
  const cardModalRef = useRef<HTMLDivElement>(null);

  // Guest Attendance & QR Scanner state
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [welcomeGuestResult, setWelcomeGuestResult] = useState<any | null>(null);
  const [selectedAttendanceGuest, setSelectedAttendanceGuest] = useState<any | null>(null);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'ATTENDED' | 'NOT_ATTENDED'>('ALL');

  // Guest Search & Filtering
  const [guestSearch, setGuestSearch] = useState('');
  const [guestGroupFilter, setGuestGroupFilter] = useState('ALL');
  const [guestRsvpFilter, setGuestRsvpFilter] = useState('ALL');
  const [guestDeliveryFilter, setGuestDeliveryFilter] = useState('ALL');

  // Duplicate Check Modal State
  const [duplicateCandidate, setDuplicateCandidate] = useState<any | null>(null);
  const [duplicateMatchInfo, setDuplicateMatchInfo] = useState<any | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // 2-Stage Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any | null>(null);
  const [importDuplicatePolicy, setImportDuplicatePolicy] = useState<'SKIP' | 'MERGE' | 'KEEP_SEPARATE'>('SKIP');
  const [importSaveToMaster, setImportSaveToMaster] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // Add Guest Form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestRel, setGuestRel] = useState('Guest');
  const [guestGroup, setGuestGroup] = useState('General');
  const [guestLanguage, setGuestLanguage] = useState('AUTO');
  const [addingGuest, setAddingGuest] = useState(false);

  // Edit Guest Modal state
  const [editingGuest, setEditingGuest] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRel, setEditRel] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editLanguage, setEditLanguage] = useState('AUTO');
  const [editAdults, setEditAdults] = useState(1);
  const [editChildren, setEditChildren] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  // AI Invitation & WhatsApp Card Modal state
  const [cardModalGuest, setCardModalGuest] = useState<any | null>(null);
  const [aiWordingLoading, setAiWordingLoading] = useState(false);
  const [personalizedText, setPersonalizedText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Universal Share Invitation Modal state
  const [shareModalGuest, setShareModalGuest] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareDefaultChannel, setShareDefaultChannel] = useState<'whatsapp' | 'sms' | 'gmail' | 'copy'>('whatsapp');

  // Memories Management state
  const [memoriesList, setMemoriesList] = useState<any[]>([]);
  const [generatingAiMemories, setGeneratingAiMemories] = useState(false);

  useEffect(() => {
    if (!id) return;
    const cleanId = id.split('#')[0];
    setLoading(true);
    Promise.all([
      apiFetch<any>(`/events/${cleanId}`).catch(() => ({ data: null })),
      apiFetch<any[]>(`/events/${cleanId}/guests`).catch(() => ({ data: [] })),
    ])
      .then(([evtRes, guestRes]) => {
        setEvent(evtRes?.data || null);
        setGuests(Array.isArray(guestRes?.data) ? guestRes.data : []);
        if (evtRes?.data?.theme_config?.memories && Array.isArray(evtRes.data.theme_config.memories)) {
          setMemoriesList(evtRes.data.theme_config.memories);
        }
      })
      .catch((err) => {
        console.error('Error loading event detail:', err);
        setEvent(null);
        setGuests([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-open share modal if redirected from Step 8 publish
  useEffect(() => {
    if (searchParams.get('openShare') === 'true') {
      setIsBulkWhatsAppOpen(true);
      navigate(`/events/${id}`, { replace: true });
    }
  }, [searchParams, id, navigate]);

  // Master Contact List state
  const [isSelectMasterListOpen, setIsSelectMasterListOpen] = useState(false);
  const [saveToMasterList, setSaveToMasterList] = useState(false);

  // Refresh guest list
  const refreshGuests = async () => {
    if (!id) return;
    const res = await apiFetch<any[]>(`/events/${id}/guests`);
    setGuests(res.data);
  };

  // Periodic polling for live check-in sync on Attendance tab
  useEffect(() => {
    if (activeTab !== 'attendance' || !id) return;
    const interval = setInterval(() => {
      refreshGuests().catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, id]);

  // Perform Gate Pass Check-in Verification
  const handleVerifyCheckin = async (codeToVerify: string, method: 'QR_SCAN' | 'MANUAL_PASSCODE' = 'QR_SCAN') => {
    setScannerError(null);
    setScannerLoading(true);
    try {
      const res = await apiFetch<any>('/scanner/verify', {
        method: 'POST',
        body: JSON.stringify({
          pass_code: codeToVerify,
          location_name: 'Host Dashboard Reception Gate',
          check_in_method: method,
          event_id: id,
        }),
      });
      setIsScannerModalOpen(false);
      setWelcomeGuestResult(res.data);
      await refreshGuests();
    } catch (err: any) {
      setScannerError(err.message || 'QR Code or Pass Code verification failed');
    } finally {
      setScannerLoading(false);
    }
  };

  // Add Single Guest with Safe Duplicate Protection
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !id) return;
    setAddingGuest(true);
    try {
      // 1. Pre-flight duplicate check
      const dupCheck = await apiFetch<any>(`/events/${id}/guests/check-duplicate`, {
        method: 'POST',
        body: JSON.stringify({
          name: guestName,
          phone: guestPhone || undefined,
          email: guestEmail || undefined,
        }),
      });

      if (dupCheck.data?.has_duplicate && dupCheck.data?.matched_guest) {
        setDuplicateCandidate({
          name: guestName,
          phone: guestPhone || undefined,
          email: guestEmail || undefined,
          relationship: guestRel || 'Guest',
          group_name: guestGroup || 'General',
          language: guestLanguage || 'AUTO',
          save_to_master_list: saveToMasterList,
        });
        setDuplicateMatchInfo(dupCheck.data);
        setIsDuplicateModalOpen(true);
        setAddingGuest(false);
        return;
      }

      // 2. No duplicate -> create guest
      const res = await apiFetch<any>(`/events/${id}/guests`, {
        method: 'POST',
        body: JSON.stringify({
          name: guestName,
          phone: guestPhone || undefined,
          email: guestEmail || undefined,
          relationship: guestRel || 'Guest',
          group_name: guestGroup || 'General',
          language: guestLanguage || 'AUTO',
          save_to_master_list: saveToMasterList,
          allow_duplicate: true,
        }),
      });
      setGuests([res.data, ...guests]);
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setGuestRel('Guest');
      setSaveToMasterList(false);
      setStatusNotice(`Added ${res.data.name} to guest list!${saveToMasterList ? ' (Saved to Master List)' : ''}`);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to add guest');
    } finally {
      setAddingGuest(false);
    }
  };

  // Duplicate Resolution: Merge into Existing Guest
  const handleConfirmMerge = async () => {
    if (!duplicateMatchInfo?.matched_guest?.id || !duplicateCandidate || !id) return;
    try {
      const res = await apiFetch<any>(`/events/${id}/guests/merge/${duplicateMatchInfo.matched_guest.id}`, {
        method: 'POST',
        body: JSON.stringify({
          phone: duplicateCandidate.phone,
          email: duplicateCandidate.email,
          relationship: duplicateCandidate.relationship,
          group_name: duplicateCandidate.group_name,
          language: duplicateCandidate.language,
        }),
      });
      await refreshGuests();
      setIsDuplicateModalOpen(false);
      setDuplicateCandidate(null);
      setDuplicateMatchInfo(null);
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setStatusNotice(`Updated and merged contact details for ${res.data.name}!`);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to merge guest');
    }
  };

  // Duplicate Resolution: Keep Separate
  const handleConfirmKeepSeparate = async () => {
    if (!duplicateCandidate || !id) return;
    try {
      const res = await apiFetch<any>(`/events/${id}/guests`, {
        method: 'POST',
        body: JSON.stringify({
          ...duplicateCandidate,
          allow_duplicate: true,
        }),
      });
      setGuests([res.data, ...guests]);
      setIsDuplicateModalOpen(false);
      setDuplicateCandidate(null);
      setDuplicateMatchInfo(null);
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setStatusNotice(`Created separate guest record for ${res.data.name}!`);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to add guest');
    }
  };

  // 2-Stage Bulk Import File Upload & Preview Handler
  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch<any>(`/events/${id}/guests/import-preview`, {
        method: 'POST',
        body: formData,
      });

      setImportPreviewData(res.data);
      setIsImportModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to analyze import file. Ensure valid CSV/Excel format.');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  // Execute Stage 2 Bulk Import Confirmation
  const handleExecuteImport = async () => {
    if (!importPreviewData || !id) return;
    setImportLoading(true);
    try {
      const itemsToImport = [
        ...importPreviewData.valid_items.map((v: any) => v.raw),
        ...(importDuplicatePolicy !== 'SKIP' ? importPreviewData.duplicate_items.map((d: any) => d.raw) : []),
      ];

      const res = await apiFetch<any>(`/events/${id}/guests/import-confirm`, {
        method: 'POST',
        body: JSON.stringify({
          items: itemsToImport,
          on_duplicate: importDuplicatePolicy,
          save_to_master_list: importSaveToMaster,
        }),
      });

      await refreshGuests();
      setIsImportModalOpen(false);
      setImportPreviewData(null);
      setStatusNotice(res.message || 'Contacts imported successfully into your celebration!');
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to complete import');
    } finally {
      setImportLoading(false);
    }
  };

  // Save Edited Guest Details
  const handleSaveEdit = async () => {
    if (!editingGuest || !id) return;
    try {
      const res = await apiFetch<any>(`/events/${id}/guests/${editingGuest.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          phone: editPhone || undefined,
          email: editEmail || undefined,
          relationship: editRel,
          group_name: editGroup,
          adults_count: editAdults,
          children_count: editChildren,
          language: editLanguage,
          notes: editNotes,
        }),
      });
      setGuests(guests.map((g) => (g.id === editingGuest.id ? res.data : g)));
      setEditingGuest(null);
      setStatusNotice(`Updated details for ${res.data.name}!`);
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update guest details');
    }
  };

  // Delete Guest
  const handleDeleteGuest = async (guestId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove '${name}' from celebration guest list?`)) return;
    try {
      await apiFetch<any>(`/events/${id}/guests/${guestId}`, { method: 'DELETE' });
      setGuests(guests.filter((g) => g.id !== guestId));
      setStatusNotice(`Removed ${name}`);
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete guest');
    }
  };

  // Generate Google Gemini AI Memory Stories
  const handleGenerateAiMemories = async () => {
    if (!id) return;
    setGeneratingAiMemories(true);
    try {
      const res = await apiFetch<any>(`/events/${id}/memories/ai-generate`, {
        method: 'POST',
        body: JSON.stringify({ milestones: memoriesList }),
      });
      setMemoriesList(res.data.memories);
      setStatusNotice('Generated memory story captions using Google Gemini AI!');
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI memory stories');
    } finally {
      setGeneratingAiMemories(false);
    }
  };

  // Save Memories Timeline
  const handleSaveMemories = async () => {
    if (!id) return;
    try {
      await apiFetch<any>(`/events/${id}/memories`, {
        method: 'POST',
        body: JSON.stringify({ memories: memoriesList }),
      });
      setStatusNotice('Memories & story timeline saved successfully!');
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save memories');
    }
  };

  // Open Personalized AI Wording & WhatsApp Card Modal
  const handleOpenAiCardModal = async (guest: any) => {
    if (!guest) return;
    setCardModalGuest(guest);
    setAiWordingLoading(true);
    setPersonalizedText('');

    const token = guest.invitation_token || guest.id;
    const pubUrl = `${window.location.origin}/i/t/${token}`;
    const dateFormatted = event?.start_date
      ? new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Date TBA';
    const host = event?.host_name || 'Family';
    const evtTitle = event?.title || 'Celebration';
    const venue = event?.venue_name || 'Venue';

    try {
      const res = await apiFetch<any>(`/events/${id}/guests/${guest.id}/bilingual-card`, {
        method: 'POST',
      });
      setPersonalizedText(
        res.data?.full_bilingual ||
          `*|| श्री गणेशाय नमः ||*\n*सपरिवार सादर निमंत्रण*\n\nप्रिय ${guest.name} जी,\n${host} की ओर से आपको\nहमारे '${evtTitle}'\nके पावन अवसर पर सादर आमंत्रित करते हैं।\n\n📅 दिनांक: ${dateFormatted}\n📍 स्थान: ${venue}\n\nआपकी उपस्थिति हमारे लिए सम्मान एवं सौभाग्य की बात होगी।\nकृपया पधारकर हमें अनुग्रहित करें और इस दिन को यादगार बनाएं। 🙏\n\n🎁 Click here To open Invitation 👉\n${pubUrl}`
      );
    } catch (err: any) {
      setPersonalizedText(
        `*|| श्री गणेशाय नमः ||*\n*सपरिवार सादर निमंत्रण*\n\nप्रिय ${guest.name} जी,\n${host} की ओर से आपको\nहमारे '${evtTitle}'\nके पावन अवसर पर सादर आमंत्रित करते हैं।\n\n📅 दिनांक: ${dateFormatted}\n📍 स्थान: ${venue}\n\nआपकी उपस्थिति हमारे लिए सम्मान एवं सौभाग्य की बात होगी।\nकृपया पधारकर हमें अनुग्रहित करें और इस दिन को यादगार बनाएं। 🙏\n\n🎁 Click here To open Invitation 👉\n${pubUrl}`
      );
    } finally {
      setAiWordingLoading(false);
    }
  };

  // Dispatch Meta WhatsApp Cloud API AI Card Media Message (JPEG Image or PDF Document)
  const handleSendWhatsAppAPI = async (format: 'JPEG' | 'PDF' = 'JPEG') => {
    if (!cardModalGuest || !id) return;
    setSendingMsg(true);
    try {
      const res = await apiFetch<any>(`/events/${id}/guests/${cardModalGuest.id}/send-whatsapp`, {
        method: 'POST',
        body: JSON.stringify({ card_format: format, personalized_caption: personalizedText }),
      });
      setStatusNotice(res.message || `WhatsApp AI ${format} Card sent to ${cardModalGuest.name}!`);
      setTimeout(() => setStatusNotice(null), 4000);
      setCardModalGuest(null);
    } catch (err: any) {
      alert(err.message || 'WhatsApp API dispatch failed');
    } finally {
      setSendingMsg(false);
    }
  };

  // Dispatch SMS
  const handleSendSMS = async () => {
    if (!cardModalGuest || !id) return;
    setSendingMsg(true);
    try {
      const res = await apiFetch<any>(`/events/${id}/guests/${cardModalGuest.id}/send-sms`, {
        method: 'POST',
      });
      setStatusNotice(res.message || `SMS invitation sent to ${cardModalGuest.name}!`);
      setTimeout(() => setStatusNotice(null), 4000);
      setCardModalGuest(null);
    } catch (err: any) {
      alert(err.message || 'SMS dispatch failed');
    } finally {
      setSendingMsg(false);
    }
  };

  // Share AI Generated JPEG / PDF Card directly to WhatsApp App / Web
  const handleShareNativeWhatsApp = async (format: 'JPEG' | 'PDF') => {
    if (!cardModalRef.current || !cardModalGuest) return;
    try {
      const res = await shareAiCardToWhatsApp({
        element: cardModalRef.current,
        format,
        recipientPhone: cardModalGuest.phone || '',
        guestName: cardModalGuest.name,
        eventTitle: event.title,
        captionText: personalizedText,
      });
      setStatusNotice(res.message);
      setTimeout(() => setStatusNotice(null), 5000);
    } catch (err: any) {
      alert(`Failed to share ${format} card via WhatsApp.`);
    }
  };

  if (loading) return <div className="text-center py-20 text-[#8C7E80] font-serif text-base">Loading Celebration Details...</div>;
  if (!event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-xl text-center space-y-4 text-[#302829]">
        <div className="w-16 h-16 rounded-full bg-[#F2E5E2] border border-[#D8B5B0] text-[#9E6F6D] flex items-center justify-center mx-auto shadow-sm">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-extrabold gold-gradient-text">Celebration Not Found</h2>
        <p className="text-xs text-[#8C7E80]">
          This celebration ID may have been moved, deleted, or belongs to another account session.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#9E6F6D] text-white font-extrabold text-xs shadow-md hover:bg-[#875B59] transition-all"
          >
            Go to My Celebrations
          </Link>
          <Link
            to="/events/new"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] font-extrabold text-xs hover:bg-[#F2E5E2] transition-colors"
          >
            Create New Event
          </Link>
        </div>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/i/${event.slug}`;

  // ─── SMART STAGE DETECTION ───────────────────────────────────────────────
  const eventDateObj = event?.start_date ? new Date(event.start_date) : null;
  const today = new Date();
  const diffDays = eventDateObj ? Math.ceil((eventDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 9999;

  const totalGuests = guests.length;
  const sentGuests = guests.filter((g) => g.invitation_sent || g.delivery_status === 'SENT' || g.delivery_status === 'READ').length;
  const viewedGuests = guests.filter((g) => g.open_count > 0 || g.delivery_status === 'READ').length;
  const rsvpYes = guests.filter((g) => g.rsvp_status === 'YES' || g.rsvp_status === 'CONFIRMED').length;
  const rsvpMaybe = guests.filter((g) => g.rsvp_status === 'MAYBE').length;
  const rsvpNo = guests.filter((g) => g.rsvp_status === 'NO').length;
  const rsvpPending = totalGuests - rsvpYes - rsvpMaybe - rsvpNo;
  const notSent = totalGuests - sentGuests;
  const attended = guests.filter((g) => g.attendance_status === 'ATTENDED').length;

  type Stage = 'PRE_SHARE' | 'SHARING' | 'NEAR_EVENT' | 'EVENT_DAY' | 'POST_EVENT';
  let stage: Stage = 'PRE_SHARE';
  if (diffDays < -1) stage = 'POST_EVENT';
  else if (diffDays === 0) stage = 'EVENT_DAY';
  else if (diffDays <= 7) stage = 'NEAR_EVENT';
  else if (sentGuests > 0) stage = 'SHARING';
  else stage = 'PRE_SHARE';

  const stageBanners: Record<Stage, { bg: string; icon: string; msg: string; sub: string; btnLabel: string; btnAction: () => void; btnClass: string }> = {
    PRE_SHARE: {
      bg: 'from-amber-50 to-orange-50 border-amber-200',
      icon: '✈',
      msg: notSent > 0 ? `You have ${notSent} guest${notSent > 1 ? 's' : ''} not yet invited.` : 'Add guests and send your invitations!',
      sub: 'Start sharing your invitation via WhatsApp now.',
      btnLabel: '✈ INVITE YOUR GUESTS',
      btnAction: () => setIsBulkWhatsAppOpen(true),
      btnClass: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-400',
    },
    SHARING: {
      bg: 'from-blue-50 to-indigo-50 border-blue-200',
      icon: '👁',
      msg: rsvpPending > 0 ? `${rsvpPending} guest${rsvpPending > 1 ? 's' : ''} haven't responded yet.` : 'All guests have responded!',
      sub: `${rsvpYes} confirmed • ${rsvpMaybe} maybe • ${rsvpPending} pending`,
      btnLabel: '📬 SEND REMINDERS',
      btnAction: () => setActiveTab('reminders'),
      btnClass: 'bg-gradient-to-r from-[#9E6F6D] to-[#875B59] text-white border-[#C9AA78]',
    },
    NEAR_EVENT: {
      bg: 'from-purple-50 to-pink-50 border-purple-200',
      icon: '⏳',
      msg: `Your event is in ${diffDays} day${diffDays > 1 ? 's' : ''}!`,
      sub: `${rsvpYes} confirmed • ${rsvpPending} pending response`,
      btnLabel: '📬 REMIND PENDING GUESTS',
      btnAction: () => setActiveTab('reminders'),
      btnClass: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-400',
    },
    EVENT_DAY: {
      bg: 'from-emerald-50 to-teal-50 border-emerald-300',
      icon: '🎉',
      msg: 'Your event is TODAY! Welcome your guests.',
      sub: `${rsvpYes} guests confirmed • ${attended} checked in so far`,
      btnLabel: '📷 CHECK GUEST ATTENDANCE',
      btnAction: () => setActiveTab('attendance'),
      btnClass: 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white border-emerald-300',
    },
    POST_EVENT: {
      bg: 'from-rose-50 to-amber-50 border-rose-200',
      icon: '❤',
      msg: 'Your celebration is complete!',
      sub: `${attended} attended • ${rsvpYes} had confirmed • Thank them for their presence`,
      btnLabel: '📋 VIEW EVENT SUMMARY',
      btnAction: () => setActiveTab('attendance'),
      btnClass: 'bg-gradient-to-r from-[#9E6F6D] to-[#875B59] text-white border-[#C9AA78]',
    },
  };

  const banner = stageBanners[stage];

  // Guest lifecycle status label helper
  const getGuestStatusBadge = (g: any) => {
    if (g.attendance_status === 'ATTENDED') return { label: '✓ Attended', cls: 'bg-emerald-700 text-white border-emerald-500' };
    if (g.rsvp_status === 'YES' || g.rsvp_status === 'CONFIRMED') return { label: '🟢 Attending', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    if (g.rsvp_status === 'MAYBE') return { label: '🟠 Maybe', cls: 'bg-orange-100 text-orange-900 border-orange-300' };
    if (g.rsvp_status === 'NO') return { label: '🔴 Not Attending', cls: 'bg-rose-100 text-rose-900 border-rose-300' };
    if (g.open_count > 0 || g.delivery_status === 'READ') return { label: '👁 Viewed', cls: 'bg-purple-100 text-purple-900 border-purple-300' };
    if (g.invitation_sent || g.delivery_status === 'SENT' || g.delivery_status === 'READ') return { label: '📨 Sent', cls: 'bg-blue-100 text-blue-900 border-blue-300' };
    return { label: '⚪ Not Invited', cls: 'bg-gray-100 text-gray-700 border-gray-300' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-[#302829]">
      {/* Top Notification Toast */}
      {statusNotice && (
        <div className="fixed top-24 right-6 z-50 px-6 py-3 rounded-2xl bg-emerald-100 text-emerald-900 font-bold text-sm shadow-2xl flex items-center gap-2 border border-emerald-300 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-600" /> {statusNotice}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#E9D3D0] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-xs font-extrabold uppercase tracking-wider border border-[#E9D3D0]">
                {event.event_type}
              </span>
              <button
                onClick={() => setIsEditCelebrationOpen(true)}
                className="px-3 py-1 rounded-full bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#9E6F6D] text-xs font-bold border border-[#E9D3D0] flex items-center gap-1 transition-all"
              >
                <Edit2 className="w-3 h-3 text-[#9E6F6D]" /> Edit Event Details
              </button>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-[#302829] mt-2">{event.title}</h1>
            <p className="text-[#7A6B6C] text-xs mt-1 font-medium">Host: {event.host_name} • Venue: {event.venue_name}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsBroadcastWizardOpen(true)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-xl hover:scale-105 border border-emerald-400"
            >
              <Send className="w-4 h-4 text-white" /> ✈ SEND INVITATIONS
            </button>

            <button
              onClick={() => setIsPublishShareModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] text-xs font-bold border border-[#E9D3D0] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Eye className="w-4 h-4 text-[#9E6F6D]" /> Preview & Share
            </button>

            <Link
              to={`/scan/${event.id}`}
              className="px-4 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <QrCode className="w-4 h-4 text-emerald-700" /> Guest Check-in Gate
            </Link>

            <Link
              to={`/welcome/${event.id}`}
              className="px-4 py-2.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-300 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Tv className="w-4 h-4 text-purple-700" /> Welcome TV Display
            </Link>
          </div>
        </div>
      </div>

      {/* 🌟 UNIFIED CELEBRATION WORKSPACE JOURNEY & ROADMAP 🌟 */}
      <CelebrationWorkspaceJourney
        event={event}
        guests={guests}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenEditEvent={() => setIsEditCelebrationOpen(true)}
        onOpenPublishModal={() => setIsPublishShareModalOpen(true)}
        onOpenSendInvitations={() => setIsBroadcastWizardOpen(true)}
        onOpenScanner={() => setIsScannerModalOpen(true)}
      />

      {/* 🌟 KPI STATS DASHBOARD 🌟 */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'GUESTS', value: totalGuests, icon: '👥', cls: 'text-[#302829]' },
          { label: 'INVITED', value: sentGuests, icon: '📨', cls: 'text-blue-700' },
          { label: 'VIEWED', value: viewedGuests, icon: '👁', cls: 'text-purple-700' },
          { label: 'RSVP YES', value: rsvpYes, icon: '🟢', cls: 'text-emerald-700' },
          { label: 'MAYBE', value: rsvpMaybe, icon: '🟠', cls: 'text-orange-700' },
          { label: 'ATTENDED', value: attended, icon: '✓', cls: 'text-emerald-900 font-extrabold' },
        ].map((stat) => (
          <div key={stat.label} className="p-3 sm:p-4 rounded-2xl bg-white/90 border border-[#E9D3D0] shadow-sm text-center">
            <div className="text-xl">{stat.icon}</div>
            <div className={`text-2xl font-extrabold font-serif ${stat.cls}`}>{stat.value}</div>
            <div className="text-[10px] font-mono font-bold text-[#8C7E80] uppercase tracking-wide mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* LUXURY TAB BAR NAVIGATION */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 border-b border-[#E9D3D0] pb-4">
        {/* Tab 1: Guests */}
        <button
          onClick={() => setActiveTab('guests')}
          className={`w-full px-3 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 shadow-md border ${
            activeTab === 'guests'
              ? 'bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white border-transparent shadow-lg scale-105'
              : 'bg-[#FFFDFB] text-[#51484A] border-[#E9D3D0] hover:bg-[#FAF6F0] hover:text-[#9E6F6D]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Guests ({guests.length})</span>
        </button>

        {/* Tab 2: Guest Attendance (QR Check-In) */}
        <button
          onClick={() => setActiveTab('attendance')}
          className={`w-full px-3 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 shadow-md border ${
            activeTab === 'attendance'
              ? 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 text-white border-transparent shadow-lg scale-105'
              : 'bg-emerald-50/70 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Attendance</span>
        </button>

        {/* Tab 3: Reminders */}
        <button
          onClick={() => setActiveTab('reminders')}
          className={`w-full px-3 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 shadow-md border relative ${
            activeTab === 'reminders'
              ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white border-transparent shadow-lg scale-105'
              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Reminders</span>
          {rsvpPending > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">{rsvpPending > 9 ? '9+' : rsvpPending}</span>
          )}
        </button>

        {/* Tab 4: Event Story */}
        <button
          onClick={() => setActiveTab('memories')}
          className={`w-full px-3 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 shadow-md border ${
            activeTab === 'memories'
              ? 'bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white border-transparent shadow-lg scale-105'
              : 'bg-[#FFFDFB] text-[#51484A] border-[#E9D3D0] hover:bg-[#FAF6F0] hover:text-[#9E6F6D]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#C9AA78]" />
          <span>Story</span>
        </button>

        {/* Tab 5: Invite via WhatsApp */}
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`w-full px-3 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 shadow-md border ${
            activeTab === 'campaigns'
              ? 'bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white border-transparent shadow-lg scale-105'
              : 'bg-[#FFFDFB] text-[#51484A] border-[#E9D3D0] hover:bg-[#FAF6F0] hover:text-[#9E6F6D]'
          }`}
        >
          <Send className="w-4 h-4 text-current" />
          <span>Send Invites</span>
        </button>

        {/* Tab 6: Download Invitation Card */}
        <button
          onClick={() => setActiveTab('card')}
          className={`w-full px-3 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 shadow-md border ${
            activeTab === 'card'
              ? 'bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white border-transparent shadow-lg scale-105'
              : 'bg-[#FFFDFB] text-[#51484A] border-[#E9D3D0] hover:bg-[#FAF6F0] hover:text-[#9E6F6D]'
          }`}
        >
          <Download className="w-4 h-4 text-current" />
          <span>Card</span>
        </button>
      </div>

      {/* GUESTS TAB */}
      {activeTab === 'guests' && (
        <div className="space-y-6">
          {/* REAL-TIME LIVE RSVP DONUT ANALYTICS & RECENT RSVPS STREAM */}
          <RsvpAnalyticsCard eventId={event.id} />

          {/* Quick Action & Import Header Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-[#E9D3D0] shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#9E6F6D]" />
                <h3 className="font-serif text-lg font-extrabold text-[#302829]">Celebration Guest Directory</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-xs font-bold font-mono">
                  👥 {guests.length} Guests
                </span>
              </div>
              <p className="text-xs text-[#7A6B6C] mt-0.5">Manage guests, categorize groups, track RSVPs, and protect against duplicates</p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setIsSelectMasterListOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#9E6F6D] to-[#C9AA78] text-white font-extrabold text-xs shadow-md hover:scale-105 transition-transform inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Users className="w-4 h-4 text-white" /> Choose Saved Guests
              </button>

              <label className="px-4 py-2.5 rounded-2xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] border border-[#E9D3D0] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors shadow-sm">
                <Upload className="w-4 h-4 text-[#9E6F6D]" />
                <span>{importLoading ? 'Analyzing...' : 'Import Contacts (CSV/Excel/vCard)'}</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.vcf,text/vcard"
                  onChange={handleImportFileSelect}
                  disabled={importLoading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Add Guest Form with Safe Duplicate Check */}
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-[#E9D3D0] shadow-md space-y-4 text-[#302829]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-serif text-sm font-extrabold text-[#302829] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#9E6F6D]" /> Add New Guest to Celebration
              </h4>

              <label className="flex items-center gap-2 text-xs text-[#9E6F6D] font-extrabold cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToMasterList}
                  onChange={(e) => setSaveToMasterList(e.target.checked)}
                  className="rounded border-[#E9D3D0] bg-[#FFFDFB] text-[#9E6F6D] focus:ring-[#9E6F6D]"
                />
                Save to Master Address Book
              </label>
            </div>

            <form onSubmit={handleAddGuest} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <input
                type="text"
                required
                placeholder="Guest Full Name *"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
              />
              <input
                type="tel"
                placeholder="WhatsApp Phone Number"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
              />
              <input
                type="email"
                placeholder="Email Address (Optional)"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
              />
              <select
                value={guestGroup}
                onChange={(e) => setGuestGroup(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
              >
                <option value="General">Group: General</option>
                <option value="Family">Group: Family</option>
                <option value="Relatives">Group: Relatives</option>
                <option value="Friends">Group: Friends</option>
                <option value="Bride Side">Group: Bride Side</option>
                <option value="Groom Side">Group: Groom Side</option>
                <option value="VIP">Group: VIP</option>
                <option value="Colleagues">Group: Colleagues / Office</option>
                <option value="Other">Group: Other</option>
              </select>

              <select
                value={guestLanguage}
                onChange={(e) => setGuestLanguage(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                title="Preferred invitation language for AI personalizations"
              >
                <option value="AUTO">Language: Auto</option>
                <option value="HI">Language: Hindi</option>
                <option value="EN">Language: English</option>
                <option value="HINGLISH">Language: Hinglish</option>
              </select>

              <button
                type="submit"
                disabled={addingGuest}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white font-extrabold text-xs shadow-md hover:scale-105 transition-all flex items-center justify-center gap-1.5 border border-[#E9D3D0]"
              >
                <Plus className="w-4 h-4 text-white" /> {addingGuest ? 'Checking...' : 'Add Guest'}
              </button>
            </form>
          </div>

          {/* SEARCH & MULTI-DIMENSIONAL FILTERS */}
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-[#E9D3D0] shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C7E80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest by name, phone, email, pass code, or notes..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] text-xs font-semibold text-[#302829] focus:outline-none focus:border-[#9E6F6D]"
                />
                {guestSearch && (
                  <button
                    onClick={() => setGuestSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7E80] hover:text-[#302829]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Broadcast Quick Action */}
              <button
                type="button"
                onClick={() => setIsBulkWhatsAppOpen(true)}
                className="py-2 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-1.5 border border-emerald-300 whitespace-nowrap"
              >
                <Send className="w-4 h-4 text-white" /> Send WhatsApp Broadcast
              </button>
            </div>

            {/* Filter Chips Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#8C7E80] mr-1">GROUPS:</span>
              {[
                { id: 'ALL', label: 'All Groups' },
                { id: 'Family', label: 'Family' },
                { id: 'Friends', label: 'Friends' },
                { id: 'Relatives', label: 'Relatives' },
                { id: 'Bride Side', label: 'Bride Side' },
                { id: 'Groom Side', label: 'Groom Side' },
                { id: 'VIP', label: 'VIP' },
                { id: 'Colleagues', label: 'Colleagues' },
              ].map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => setGuestGroupFilter(grp.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    guestGroupFilter === grp.id
                      ? 'bg-[#9E6F6D] text-white shadow-sm scale-105'
                      : 'bg-[#FAF7F3] text-[#51484A] border border-[#E9D3D0] hover:bg-[#F2E5E2]'
                  }`}
                >
                  {grp.label}
                </button>
              ))}

              <div className="h-4 w-px bg-[#E9D3D0] mx-1" />

              <span className="text-[10px] font-mono uppercase font-bold text-[#8C7E80] mr-1">RSVP:</span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'YES', label: '🟢 Attending' },
                { id: 'PENDING', label: '⚪ Pending' },
                { id: 'MAYBE', label: '🟠 Maybe' },
                { id: 'NO', label: '🔴 Declined' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setGuestRsvpFilter(r.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    guestRsvpFilter === r.id
                      ? 'bg-[#302829] text-[#C9AA78] shadow-sm'
                      : 'bg-[#FAF7F3] text-[#51484A] border border-[#E9D3D0] hover:bg-[#F2E5E2]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Guest List Table */}
          <div className="bg-[#FFFDFC] rounded-2xl border border-[#E9D3D0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#302829] border-b border-[#E9D3D0] text-[#C9AA78] font-serif font-bold">
                  <tr>
                    <th className="p-4">Guest Name & Info</th>
                    <th className="p-4">Group / Rel</th>
                    <th className="p-4">WhatsApp Phone</th>
                    <th className="p-4">Language</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4">RSVP Status</th>
                    <th className="p-4">Entry Pass</th>
                    <th className="p-4 text-center">AI Invitation & Share</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9D3D0] text-[#302829]">
                  {(() => {
                    const filtered = guests.filter((g) => {
                      if (guestGroupFilter !== 'ALL') {
                        const gGroup = (g.group_name || 'General').toLowerCase();
                        const filterLower = guestGroupFilter.toLowerCase();
                        if (filterLower === 'other' || filterLower === 'general') {
                          if (gGroup !== 'general' && gGroup !== 'other') return false;
                        } else if (!gGroup.includes(filterLower)) {
                          return false;
                        }
                      }
                      if (guestRsvpFilter !== 'ALL') {
                        if (g.rsvp_status !== guestRsvpFilter) return false;
                      }
                      if (guestSearch.trim()) {
                        const q = guestSearch.toLowerCase();
                        const code = g.pass_code || g.invitation_token || '';
                        return (
                          g.name.toLowerCase().includes(q) ||
                          (g.phone && g.phone.includes(q)) ||
                          (g.email && g.email.toLowerCase().includes(q)) ||
                          (g.notes && g.notes.toLowerCase().includes(q)) ||
                          code.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-[#8C7E80]">
                            {guests.length === 0
                              ? 'No guests added yet. Tap "Import Contacts" or add guests above!'
                              : `No guests matching search / filter criteria (${guests.length} total in event).`}
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((g) => (
                      <tr key={g.id} className="hover:bg-[#FAF7F3] transition-colors">
                        <td className="p-4 font-bold text-[#302829]">
                          <div className="text-sm">{g.name}</div>
                          {g.email && <div className="text-[10px] text-[#7A6B6C] font-mono">{g.email}</div>}
                          {g.notes && <div className="text-[10px] text-[#8C7E80] font-normal italic">{g.notes}</div>}
                        </td>
                        <td className="p-4 text-[#51484A]">
                          <span className="px-2 py-0.5 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-bold border border-[#D8B5B0]">
                            {g.group_name || 'General'}
                          </span>
                          <span className="ml-1.5 text-xs text-[#51484A] font-semibold">{g.relationship || 'Guest'}</span>
                        </td>
                        <td className="p-4 font-mono text-[#302829] font-bold text-xs">{g.phone || '—'}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-bold border border-slate-200">
                            {g.language || 'AUTO'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            g.delivery_status === 'READ' || g.open_count > 0
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : (g.invitation_sent || g.delivery_status === 'SENT')
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}>
                            {g.delivery_status === 'READ' || g.open_count > 0
                              ? `👁 Viewed (${g.open_count || 1}x)`
                              : (g.invitation_sent || g.delivery_status === 'SENT')
                                ? '📨 Sent'
                                : '⚪ Not Sent'}
                          </span>
                        </td>
                        <td className="p-4">
                          {(() => { const { label, cls } = getGuestStatusBadge(g); return (
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${cls}`}>{label}</span>
                          ); })()}
                        </td>
                        <td className="p-4 font-mono text-[#9E6F6D] font-extrabold text-xs">{g.pass_code || 'NIM-ENTRY'}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Primary 1-Tap Universal Share Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setShareModalGuest(g);
                                setShareDefaultChannel('whatsapp');
                                setIsShareModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                              title={`Share invitation with ${g.name}`}
                            >
                              <Send className="w-3.5 h-3.5 text-white" />
                              <span>Share</span>
                            </button>

                            {/* 1-Tap Copy Link Button */}
                            <button
                              type="button"
                              onClick={async () => {
                                await copyInvitationLink({ event, guest: g });
                                setStatusNotice(`Copied personalized link for ${g.name}!`);
                                setTimeout(() => setStatusNotice(null), 3000);
                              }}
                              className="p-1.5 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] hover:bg-[#F2E5E2] text-[#302829] text-xs font-bold transition-colors"
                              title="Copy Personalized Guest Link"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#9E6F6D]" />
                            </button>

                            {/* Advanced AI Card Modal */}
                            <button
                              type="button"
                              onClick={() => handleOpenAiCardModal(g)}
                              className="p-1.5 rounded-xl bg-[#F2E5E2] border border-[#D8B5B0] hover:bg-[#E9D3D0] text-[#9E6F6D] text-xs font-bold transition-colors"
                              title="Export AI Invitation Card (JPEG/PDF)"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#9E6F6D]" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingGuest(g);
                                setEditName(g.name);
                                setEditPhone(g.phone || '');
                                setEditEmail(g.email || '');
                                setEditRel(g.relationship || 'Guest');
                                setEditGroup(g.group_name || 'General');
                                setEditLanguage(g.language || 'AUTO');
                                setEditAdults(g.adults_count || 1);
                                setEditChildren(g.children_count || 0);
                                setEditNotes(g.notes || '');
                              }}
                              className="p-1.5 rounded-lg bg-[#F2E5E2] text-[#9E6F6D] hover:bg-[#E9D3D0] border border-[#D8B5B0]/50"
                              title="Edit Guest"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(g.id, g.name)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                              title="Remove Guest"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB (QR CHECK-IN & HOST ATTENDANCE DASHBOARD) */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* EVENT-SPECIFIC DASHBOARD HEADER */}
          <div className="p-6 rounded-3xl bg-white border border-[#E9D3D0] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-xs font-mono font-bold uppercase border border-[#E9D3D0] mb-1">
                Event Guest Attendance Dashboard
              </div>
              <h2 className="font-serif text-3xl font-extrabold text-[#302829]">{event.title}</h2>
              <p className="text-xs text-[#7A6B6C] font-mono mt-0.5 font-medium">
                📅 {new Date(event.start_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} • 📍 Venue: {event.venue_name}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">ATTENDANCE SCOPE</span>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-mono font-extrabold border border-emerald-300 inline-block">
                ✓ Event Specific ({event.title})
              </span>
            </div>
          </div>

          {/* ATTENDANCE SUMMARY STATS CARDS */}
          {(() => {
            const attendedCount = guests.filter((g) => g.checked_in).length;
            const notAttendedCount = guests.filter((g) => !g.checked_in).length;
            const attendingRsvpHeadcount = guests
              .filter((g) => ['YES', 'CONFIRMED', 'ATTENDING'].includes(g.rsvp_status))
              .reduce((acc, g) => acc + (g.adults_count || 1) + (g.children_count || 0), 0);
            const totalExpected = attendingRsvpHeadcount || guests.reduce((acc, g) => acc + (g.adults_count || 1) + (g.children_count || 0), 0);
            const attendancePct = guests.length > 0 ? ((attendedCount / guests.length) * 100).toFixed(1) : '0';

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#8C7E80]">TOTAL EXPECTED</span>
                  <div className="text-3xl font-extrabold text-[#302829] font-serif">{totalExpected}</div>
                  <span className="text-[11px] text-[#7A6B6C] font-mono">{guests.length} Invited Invitations</span>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">CHECKED IN</span>
                  <div className="text-3xl font-extrabold text-emerald-900 font-serif">
                    {attendedCount}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-mono">✓ Gate Verified</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-600">REMAINING</span>
                  <div className="text-3xl font-extrabold text-slate-800 font-serif">
                    {notAttendedCount}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Pending Arrival</span>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-800">ATTENDANCE RATE</span>
                  <div className="text-3xl font-extrabold text-amber-900 font-serif">
                    {attendancePct}%
                  </div>
                  <span className="text-[11px] text-amber-700 font-mono">Real-time Check-In %</span>
                </div>
              </div>
            );
          })()}

          {/* PRIMARY CHECK-IN ACTION BAR */}
          <div className="p-6 rounded-3xl bg-white border border-[#E9D3D0] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-extrabold text-[#302829] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" /> 1-Tap Guest Gate Check-In
              </h3>
              <p className="text-xs text-[#7A6B6C] font-mono">
                Scan guest QR passes using your mobile camera, enter pass codes manually, or launch the Live TV Welcome Screen.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 border border-emerald-400/40"
              >
                <Camera className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>📷 SCAN GUEST QR</span>
              </button>

              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="px-5 py-3.5 rounded-2xl bg-[#FAF7F5] border border-[#E9D3D0] hover:bg-[#F2E5E2] text-[#302829] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Key className="w-4 h-4 text-[#9E6F6D]" />
                <span>Pass Code</span>
              </button>

              <Link
                to={`/welcome/${id}`}
                target="_blank"
                className="px-5 py-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Tv className="w-4 h-4 text-purple-700" />
                <span>Launch TV Screen</span>
              </Link>
            </div>
          </div>

          {/* RECENT ARRIVALS LIVE STREAM WIDGET */}
          {(() => {
            const checkedInGuests = guests
              .filter((g) => g.checked_in)
              .sort((a, b) => {
                const timeA = a.checked_in_at ? new Date(a.checked_in_at).getTime() : 0;
                const timeB = b.checked_in_at ? new Date(b.checked_in_at).getTime() : 0;
                return timeB - timeA;
              });

            if (checkedInGuests.length === 0) return null;

            return (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    LIVE RECENT ARRIVALS ({checkedInGuests.length})
                  </span>
                  <span className="text-emerald-700 text-[11px]">
                    Auto-syncing every 10s
                  </span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {checkedInGuests.slice(0, 8).map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setSelectedAttendanceGuest(g)}
                      className="px-3.5 py-2 rounded-2xl bg-white border border-emerald-200 shadow-xs shrink-0 cursor-pointer hover:border-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="text-left">
                        <span className="font-serif font-extrabold text-xs text-[#302829] block">
                          {g.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#8C7E80] block">
                          {g.checked_in_at
                            ? new Date(g.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Checked in'}
                          {' • '}{(g.adults_count || 1) + (g.children_count || 0)} Guests
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* DESKTOP TWO-PANE ATTENDANCE DASHBOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT PANE: GUEST LIST (5 COLS) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E9D3D0] shadow-md p-5 space-y-4 flex flex-col h-[650px]">
              
              {/* Search & Filter Header */}
              <div className="space-y-3 shrink-0">
                <input
                  type="text"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  placeholder="Search guest name, code, or phone..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E9D3D0] text-xs font-mono font-bold focus:outline-none focus:border-[#9E6F6D]"
                />

                <div className="flex border-b border-[#E9D3D0] pb-2 gap-1 text-xs font-mono font-bold">
                  {(['ALL', 'ATTENDED', 'NOT_ATTENDED'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setAttendanceFilter(filterKey)}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        attendanceFilter === filterKey
                          ? 'bg-[#9E6F6D] text-white shadow-sm'
                          : 'text-[#8C7E80] hover:bg-[#FAF7F5]'
                      }`}
                    >
                      {filterKey === 'ALL' ? 'All Guests' : filterKey === 'ATTENDED' ? 'Attended' : 'Not Attended'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {guests
                  .filter((g) => {
                    if (attendanceFilter === 'ATTENDED') return g.checked_in;
                    if (attendanceFilter === 'NOT_ATTENDED') return !g.checked_in;
                    return true;
                  })
                  .filter((g) => {
                    if (!attendanceSearch.trim()) return true;
                    const q = attendanceSearch.toLowerCase();
                    const code = g.entry_pass?.pass_code || g.invitation_token || '';
                    return (
                      g.name.toLowerCase().includes(q) ||
                      (g.phone && g.phone.includes(q)) ||
                      code.toLowerCase().includes(q)
                    );
                  })
                  .map((g) => {
                    const passCode = g.entry_pass?.pass_code || (g.invitation_token ? `TOKEN-${g.invitation_token.slice(0, 6)}` : `NIM-${g.id.slice(0, 6).toUpperCase()}`);
                    const isSelected = selectedAttendanceGuest?.id === g.id;

                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedAttendanceGuest(g)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#9E6F6D] bg-[#F2E5E2]/60 shadow-md scale-[1.01]'
                            : 'border-[#E9D3D0] bg-white hover:bg-[#FAF7F5]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="font-serif font-extrabold text-sm text-[#302829]">{g.name}</h4>
                            <p className="text-[11px] font-mono text-[#8C7E80] font-bold">
                              Code: <span className="text-[#9E6F6D] font-extrabold">{passCode}</span> • {g.relationship || 'Guest'}
                            </p>
                          </div>

                          <div className="text-right space-y-1">
                            {g.checked_in ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold uppercase border border-emerald-300 inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" /> Attended
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold uppercase border border-slate-200">
                                Not Attended
                              </span>
                            )}

                            {g.checked_in_at && (
                              <span className="block text-[10px] font-mono text-emerald-700">
                                {new Date(g.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* RIGHT PANE: SELECTED GUEST DETAILS & ACTION (7 COLS) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E9D3D0] shadow-md p-6 flex flex-col justify-between h-[650px] overflow-y-auto">
              {selectedAttendanceGuest ? (
                <div className="space-y-6">
                  {/* Selected Guest Header Card */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F5] border border-[#E9D3D0] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-mono font-extrabold uppercase border border-[#E9D3D0]">
                        {selectedAttendanceGuest.category || 'GUEST'}
                      </span>

                      {selectedAttendanceGuest.checked_in ? (
                        <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-mono font-extrabold uppercase border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> CHECKED IN
                        </span>
                      ) : (
                        <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-bold uppercase border border-amber-300">
                          NOT YET CHECKED IN
                        </span>
                      )}
                    </div>

                    <h2 className="font-serif text-3xl font-extrabold text-[#302829]">
                      {selectedAttendanceGuest.name}
                    </h2>
                    <p className="text-xs font-mono text-[#8C7E80] font-bold">
                      Relationship: {selectedAttendanceGuest.relationship || 'Honored Guest'} • Mobile: {selectedAttendanceGuest.phone || 'N/A'}
                    </p>
                  </div>

                  {/* Pass Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm space-y-1">
                      <span className="text-[#8C7E80] block text-[10px] font-bold">GUEST PASS CODE</span>
                      <span className="text-lg font-extrabold text-[#9E6F6D]">
                        {selectedAttendanceGuest.entry_pass?.pass_code || selectedAttendanceGuest.invitation_token || `NIM-${selectedAttendanceGuest.id.slice(0, 6).toUpperCase()}`}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm space-y-1">
                      <span className="text-[#8C7E80] block text-[10px] font-bold">PARTY SIZE</span>
                      <span className="text-lg font-extrabold text-[#302829]">
                        {selectedAttendanceGuest.adults_count || 1} Adults, {selectedAttendanceGuest.children_count || 0} Children
                      </span>
                    </div>
                  </div>

                  {/* Attendance Check-in Info */}
                  {selectedAttendanceGuest.checked_in ? (
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
                      <div className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Verified Gate Check-In
                      </div>
                      <p className="text-xs font-mono text-emerald-800">
                        Check-in Time:{' '}
                        <span className="font-extrabold">
                          {selectedAttendanceGuest.checked_in_at
                            ? new Date(selectedAttendanceGuest.checked_in_at).toLocaleString()
                            : 'Confirmed'}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
                      <div className="font-bold text-amber-900 text-sm">Guest Has Not Checked In Yet</div>
                      <p className="text-xs text-amber-800">
                        Tap below to manually verify and mark attendance if QR scanning is not available.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleVerifyCheckin(
                            selectedAttendanceGuest.entry_pass?.pass_code || selectedAttendanceGuest.invitation_token || selectedAttendanceGuest.id,
                            'MANUAL_PASSCODE'
                          )
                        }
                        disabled={scannerLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#5E3735] text-white font-extrabold text-xs shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 border border-amber-300/40"
                      >
                        <CheckCircle className="w-4 h-4 text-amber-300" />
                        <span>VERIFY & MARK ATTENDED NOW</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="my-auto text-center space-y-3 p-8 text-[#8C7E80]">
                  <QrCode className="w-12 h-12 text-[#9E6F6D] mx-auto opacity-50" />
                  <h3 className="font-serif text-xl font-extrabold text-[#302829]">Select a Guest</h3>
                  <p className="text-xs font-mono max-w-xs mx-auto">
                    Click any guest card from the left panel to inspect full attendance status and gate pass details.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 🌟 REMINDERS TAB — SMART FOLLOW-UP ENGINE 🌟 */}
      {activeTab === 'reminders' && (
        <div className="space-y-5">
          {/* RSVP Summary */}
          <div className="p-5 rounded-2xl bg-white/90 border border-[#E9D3D0] shadow-md space-y-4">
            <h3 className="font-serif text-xl font-extrabold text-[#302829] flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" /> RSVP Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '❤️', label: 'Attending', val: rsvpYes, cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
                { icon: '🤔', label: 'Maybe', val: rsvpMaybe, cls: 'border-orange-200 bg-orange-50 text-orange-800' },
                { icon: '😔', label: 'Not Attending', val: rsvpNo, cls: 'border-rose-200 bg-rose-50 text-rose-800' },
                { icon: '⏳', label: 'No Response', val: rsvpPending, cls: 'border-gray-200 bg-gray-50 text-gray-700' },
              ].map((s) => (
                <div key={s.label} className={`p-4 rounded-2xl border text-center ${s.cls}`}>
                  <div className="text-2xl">{s.icon}</div>
                  <div className="text-2xl font-extrabold font-serif">{s.val}</div>
                  <div className="text-[10px] font-mono font-bold uppercase mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Reminder Categories */}
          <div className="space-y-4">
            <h3 className="font-serif text-base font-extrabold text-[#302829]">Smart Reminder Categories</h3>

            {/* Category 1: Haven't opened */}
            {(() => {
              const notOpened = guests.filter((g) => !g.open_count && (g.invitation_sent || g.delivery_status === 'SENT'));
              return (
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-serif font-extrabold text-blue-900">📨 Guests who haven't opened their invitation</h4>
                      <p className="text-xs text-blue-700 mt-0.5">{notOpened.length} guest{notOpened.length !== 1 ? 's' : ''} need a nudge</p>
                    </div>
                    <button
                      onClick={() => { setIsBulkWhatsAppOpen(true); }}
                      disabled={notOpened.length === 0}
                      className="px-5 py-2.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md disabled:opacity-40"
                    >
                      📬 REMIND ({notOpened.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notOpened.slice(0, 8).map((g) => (
                      <span key={g.id} className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200">{g.name}</span>
                    ))}
                    {notOpened.length > 8 && <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200">+{notOpened.length - 8} more</span>}
                    {notOpened.length === 0 && <span className="text-xs text-blue-700 italic">All sent guests have opened their invitation ✓</span>}
                  </div>
                </div>
              );
            })()}

            {/* Category 2: Haven't responded */}
            {(() => {
              const noResponse = guests.filter((g) => (g.open_count > 0 || g.delivery_status === 'READ') && !g.rsvp_status || g.rsvp_status === 'PENDING');
              return (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-serif font-extrabold text-amber-900">👁 Guests who viewed but haven't responded</h4>
                      <p className="text-xs text-amber-700 mt-0.5">{noResponse.length} guest{noResponse.length !== 1 ? 's' : ''} seen the invitation but not RSVP'd</p>
                    </div>
                    <button
                      onClick={() => { setIsBulkWhatsAppOpen(true); }}
                      disabled={noResponse.length === 0}
                      className="px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md disabled:opacity-40"
                    >
                      📬 REMIND ({noResponse.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {noResponse.slice(0, 8).map((g) => (
                      <span key={g.id} className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200">{g.name}</span>
                    ))}
                    {noResponse.length > 8 && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200">+{noResponse.length - 8} more</span>}
                    {noResponse.length === 0 && <span className="text-xs text-amber-700 italic">No pending RSVP responses ✓</span>}
                  </div>
                </div>
              );
            })()}

            {/* Category 3: Said Maybe */}
            {(() => {
              const maybes = guests.filter((g) => g.rsvp_status === 'MAYBE');
              return (
                <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-serif font-extrabold text-orange-900">🤔 Guests who said Maybe</h4>
                      <p className="text-xs text-orange-700 mt-0.5">{maybes.length} guest{maybes.length !== 1 ? 's' : ''} are still undecided</p>
                    </div>
                    <button
                      onClick={() => { setIsBulkWhatsAppOpen(true); }}
                      disabled={maybes.length === 0}
                      className="px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md disabled:opacity-40"
                    >
                      📬 REMIND ({maybes.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {maybes.map((g) => (
                      <span key={g.id} className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-[11px] font-bold border border-orange-200">{g.name}</span>
                    ))}
                    {maybes.length === 0 && <span className="text-xs text-orange-700 italic">No guests with Maybe status</span>}
                  </div>
                </div>
              );
            })()}

            {/* Bulk Action */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white space-y-3 border border-amber-300">
              <h4 className="font-serif font-extrabold text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-300" /> Bulk Reminder
              </h4>
              <p className="text-xs text-amber-100">Send a gentle reminder to all guests who have not yet responded.</p>
              <button
                onClick={() => setIsBulkWhatsAppOpen(true)}
                className="px-6 py-3 rounded-full bg-white text-[#875B59] font-extrabold text-xs shadow-lg hover:scale-105 transition-all"
              >
                📬 REMIND ALL PENDING GUESTS ({rsvpPending})
              </button>
            </div>

            {/* Post-Event: Send Thank You */}
            {stage === 'POST_EVENT' && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <h4 className="font-serif font-extrabold text-rose-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" /> Post-Event Thank You
                </h4>
                <p className="text-xs text-rose-700">
                  "Thank you for being a part of our special day. ❤️ Your presence and blessings made our celebration even more beautiful."
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsBulkWhatsAppOpen(true)}
                    className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md"
                  >
                    💌 SEND THANK YOU TO ALL
                  </button>
                  <button
                    onClick={() => setIsBulkWhatsAppOpen(true)}
                    className="px-5 py-2.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-900 font-extrabold text-xs border border-rose-200"
                  >
                    ✓ Attended Guests Only
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI 3D MEMORIES & STORY TIMELINE TAB */}
      {activeTab === 'memories' && (
        <EventStoryStudio
          eventId={id!}
          eventType={event.event_type}
          hostName={event.host_name}
          eventTitle={event.title}
          initialMemories={memoriesList}
          initialThenNowPairs={event.theme_config?.then_now_pairs || []}
          onStoryUpdated={(updatedMems, details) => {
            setMemoriesList(updatedMems);
            setEvent({
              ...event,
              theme_config: {
                ...(event.theme_config || {}),
                memories: updatedMems,
                ...(details?.strategy ? { story_details: details } : {}),
              },
            });
          }}
        />
      )}

      {/* CAMPAIGNS TAB */}
      {activeTab === 'campaigns' && (
        <BroadcastDashboard
          eventId={id!}
          eventTitle={event.title}
          hostName={event.host_name}
          onOpenBroadcastWizard={() => setIsBroadcastWizardOpen(true)}
          onGuestUpdated={refreshGuests}
        />
      )}

      {/* CARD EXPORT TAB */}
      {activeTab === 'card' && (
        <div className="glass-panel p-8 rounded-3xl gold-border space-y-6">
          <div>
            <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <Download className="w-6 h-6 text-amber-400" /> Event Digital Invitation Card Export
            </h3>
            <p className="text-xs text-slate-400">
              Download high-resolution invitation cards in <strong>JPEG (.jpg)</strong>, <strong>PNG (.png)</strong>, or printable <strong>PDF (.pdf)</strong> formats.
            </p>
          </div>

          <InvitationCard event={event} publicUrl={publicUrl} />
        </div>
      )}

      {/* EDIT GUEST MODAL */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white p-6 rounded-3xl border border-[#E9D3D0] shadow-2xl space-y-4 text-[#302829]">
            <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#9E6F6D]" />
                <h3 className="font-serif text-lg font-bold text-[#302829]">Edit Guest Details</h3>
              </div>
              <button onClick={() => setEditingGuest(null)} className="text-[#8C7E80] hover:text-[#302829]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[#7A6B6C] font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div>
                <label className="block text-[#7A6B6C] font-semibold mb-1">WhatsApp Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div>
                <label className="block text-[#7A6B6C] font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div>
                <label className="block text-[#7A6B6C] font-semibold mb-1">Guest Group</label>
                <input
                  type="text"
                  value={editGroup}
                  onChange={(e) => setEditGroup(e.target.value)}
                  placeholder="e.g. Family, VIP, Bride Side"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div>
                <label className="block text-[#7A6B6C] font-semibold mb-1">Relationship</label>
                <input
                  type="text"
                  value={editRel}
                  onChange={(e) => setEditRel(e.target.value)}
                  placeholder="e.g. Cousin, Colleague, Friend"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>

              <div>
                <label className="block text-[#7A6B6C] font-semibold mb-1">Language Preference</label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                >
                  <option value="AUTO">Auto (Event Default)</option>
                  <option value="HI">Hindi</option>
                  <option value="EN">English</option>
                  <option value="HINGLISH">Hinglish</option>
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[#7A6B6C] font-semibold mb-1">Adults</label>
                  <input
                    type="number"
                    min="1"
                    value={editAdults}
                    onChange={(e) => setEditAdults(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[#7A6B6C] font-semibold mb-1">Children</label>
                  <input
                    type="number"
                    min="0"
                    value={editChildren}
                    onChange={(e) => setEditChildren(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#7A6B6C] font-semibold mb-1">Special Notes / Seating / Dietary</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. VIP front row seating, strictly Jain meal"
                  className="w-full px-4 py-2 rounded-xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9D3D0]">
              <button
                onClick={() => setEditingGuest(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#8C7E80] hover:text-[#302829]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white font-extrabold text-xs shadow-md hover:scale-105 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE GUEST WARNING & RESOLUTION MODAL */}
      {isDuplicateModalOpen && duplicateMatchInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white p-6 rounded-3xl border border-amber-300 shadow-2xl space-y-4 text-[#302829] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-extrabold text-[#302829]">Possible Duplicate Guest Found</h3>
                <p className="text-xs text-[#7A6B6C] mt-1">
                  {duplicateMatchInfo.warning_message || 'A guest with similar details is already in this celebration list.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsDuplicateModalOpen(false);
                  setDuplicateCandidate(null);
                  setDuplicateMatchInfo(null);
                }}
                className="text-[#8C7E80] hover:text-[#302829]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateMatchInfo.matched_guest && (
              <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] space-y-2 text-xs">
                <div className="font-mono text-[10px] uppercase font-bold text-[#8C7E80]">Existing Guest Record</div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#302829]">{duplicateMatchInfo.matched_guest.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F2E5E2] text-[#9E6F6D] font-bold text-[10px]">
                    {duplicateMatchInfo.matched_guest.group_name}
                  </span>
                </div>
                <div className="text-[#7A6B6C] space-y-0.5">
                  <div>📞 Phone: <strong>{duplicateMatchInfo.matched_guest.phone || 'None'}</strong></div>
                  <div>✉️ Email: <strong>{duplicateMatchInfo.matched_guest.email || 'None'}</strong></div>
                  <div>🎫 Pass Code: <strong className="font-mono text-[#9E6F6D]">{duplicateMatchInfo.matched_guest.pass_code}</strong></div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-[#51484A]">What would you like to do?</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleConfirmMerge}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md transition-all flex flex-col items-start gap-0.5"
                >
                  <span className="font-extrabold">✓ Merge / Update Details</span>
                  <span className="text-[10px] text-emerald-100 font-normal">Update existing contact without creating duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmKeepSeparate}
                  className="px-4 py-3 rounded-2xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#9E6F6D] border border-[#E9D3D0] font-extrabold text-xs shadow-sm transition-all flex flex-col items-start gap-0.5"
                >
                  <span className="font-extrabold">+ Keep Separate Person</span>
                  <span className="text-[10px] text-[#7A6B6C] font-normal">Create a new guest record with distinct pass</span>
                </button>
              </div>
            </div>

            <div className="text-right pt-2 border-t border-[#E9D3D0]">
              <button
                type="button"
                onClick={() => {
                  setIsDuplicateModalOpen(false);
                  setDuplicateCandidate(null);
                  setDuplicateMatchInfo(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#8C7E80] hover:text-[#302829]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-STAGE BULK IMPORT PREVIEW & CONFIRMATION MODAL */}
      {isImportModalOpen && importPreviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white p-6 rounded-3xl border border-[#E9D3D0] shadow-2xl space-y-5 text-[#302829] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#9E6F6D]" />
                <div>
                  <h3 className="font-serif text-lg font-extrabold text-[#302829]">Import Contacts Preview & Validation</h3>
                  <p className="text-xs text-[#7A6B6C]">Review contacts before adding them to your celebration</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-[#8C7E80] hover:text-[#302829]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation KPI Breakdown */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-2xl font-extrabold text-emerald-800 font-serif">{importPreviewData.valid_count}</div>
                <div className="text-[10px] font-mono font-bold uppercase text-emerald-700">Valid Contacts</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-2xl font-extrabold text-amber-800 font-serif">{importPreviewData.duplicates_count}</div>
                <div className="text-[10px] font-mono font-bold uppercase text-amber-700">Duplicates Detected</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <div className="text-2xl font-extrabold text-rose-800 font-serif">{importPreviewData.invalid_count}</div>
                <div className="text-[10px] font-mono font-bold uppercase text-rose-700">Invalid Rows</div>
              </div>
            </div>

            {/* Duplicate Policy Selection */}
            {importPreviewData.duplicates_count > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs shrink-0">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>How should we handle the {importPreviewData.duplicates_count} duplicate contact{importPreviewData.duplicates_count !== 1 ? 's' : ''}?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'SKIP', title: 'Skip Duplicates', desc: 'Do not import duplicates' },
                    { id: 'MERGE', title: 'Merge / Update', desc: 'Update existing records' },
                    { id: 'KEEP_SEPARATE', title: 'Keep Separate', desc: 'Create new guests' },
                  ].map((pol) => (
                    <label
                      key={pol.id}
                      onClick={() => setImportDuplicatePolicy(pol.id as any)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col ${
                        importDuplicatePolicy === pol.id
                          ? 'bg-amber-100/90 border-amber-400 font-bold text-amber-950 shadow-sm'
                          : 'bg-white/80 border-amber-200 text-[#51484A] hover:bg-white'
                      }`}
                    >
                      <span className="text-xs">{pol.title}</span>
                      <span className="text-[10px] font-normal text-[#7A6B6C]">{pol.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable Preview List */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-[#E9D3D0] rounded-2xl p-3 bg-[#FAF7F3]">
              <div className="text-[11px] font-mono uppercase font-bold text-[#8C7E80] mb-1">
                Preview Rows ({importPreviewData.total_parsed} total)
              </div>
              {importPreviewData.valid_items.slice(0, 15).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E9D3D0] text-xs">
                  <div>
                    <span className="font-bold text-[#302829]">{item.raw.name}</span>
                    <span className="ml-2 text-[10px] text-[#7A6B6C] font-mono">{item.normalized_phone || item.raw.phone || 'No phone'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                    ✓ {item.raw.group_name || 'General'}
                  </span>
                </div>
              ))}
              {importPreviewData.duplicate_items.map((item: any, idx: number) => (
                <div key={`dup-${idx}`} className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <div>
                    <span className="font-bold text-amber-900">{item.raw.name}</span>
                    <span className="ml-2 text-[10px] text-amber-700 font-mono">
                      (Matches existing: {item.matched_existing_name || item.duplicate_type})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                    Duplicate ({importDuplicatePolicy})
                  </span>
                </div>
              ))}
              {importPreviewData.invalid_items.map((item: any, idx: number) => (
                <div key={`inv-${idx}`} className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs opacity-75">
                  <span className="font-semibold text-rose-900">{item.raw.name || 'Unnamed'}</span>
                  <span className="text-[10px] text-rose-700 italic">{item.error_reason || 'Invalid data'}</span>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E9D3D0] shrink-0">
              <label className="flex items-center gap-2 text-xs text-[#9E6F6D] font-extrabold cursor-pointer">
                <input
                  type="checkbox"
                  checked={importSaveToMaster}
                  onChange={(e) => setImportSaveToMaster(e.target.checked)}
                  className="rounded border-[#E9D3D0] bg-[#FFFDFB] text-[#9E6F6D] focus:ring-[#9E6F6D]"
                />
                Also save to Master Address Book
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8C7E80] hover:text-[#302829]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importLoading || importPreviewData.valid_count === 0}
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {importLoading ? 'Importing...' : `Import ${importPreviewData.valid_count + (importDuplicatePolicy !== 'SKIP' ? importPreviewData.duplicates_count : 0)} Contacts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PERSONALIZED BILINGUAL AI INVITATION & WHATSAPP MULTIMEDIA CARD MODAL */}
      {cardModalGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl gold-border shadow-2xl space-y-5 my-8">
            {/* Header bar with Back and Close buttons */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <button
                type="button"
                onClick={() => setCardModalGuest(null)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>← Back</span>
              </button>

              <div className="flex items-center gap-1.5 text-center">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif text-sm font-bold text-white">Bilingual Invitation Card</h3>
              </div>

              <button
                type="button"
                onClick={() => setCardModalGuest(null)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition-all"
                title="Close Popup"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>


            {/* Recipient info */}
            <div className="text-xs bg-[#140005] p-3 rounded-xl border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-slate-400">Recipient Guest:</span>{' '}
                <strong className="text-white">{cardModalGuest.name}</strong>
              </div>
              <div className="font-mono text-amber-300">{cardModalGuest.phone || 'No phone'}</div>
            </div>

            {/* Event-Specific Gracious Background Image Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-amber-300 uppercase tracking-wider">
                🖼️ Event-Specific Gracious Background Image
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Royal Mandap', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop' },
                  { label: 'Mundan Baby', url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop' },
                  { label: 'Golden Gold', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop' },
                  { label: 'Floral Elegance', url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop' },
                ].map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEvent({ ...event, cover_image_url: b.url })}
                    className={`h-14 rounded-xl overflow-hidden border relative transition-all ${ (event.cover_image_url || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop') === b.url ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-700 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={b.url} alt={b.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-amber-300 font-bold text-center py-0.5 truncate">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* BILINGUAL IMAGE CARD VISUAL PREVIEW (Hindi Top Half + English Bottom Half) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider block">
                  📱 WhatsApp Bilingual Image Card (Hindi + English)
                </span>

                <div className="flex items-center gap-1.5 no-export">
                  <button
                    type="button"
                    onClick={() => cardModalRef.current && downloadCardAsJpeg(cardModalRef.current, `${event.title}-${cardModalGuest.name}.jpg`)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1"
                    title="Download JPEG Image"
                  >
                    <FileImage className="w-3 h-3 text-amber-400" /> JPEG
                  </button>
                  <button
                    type="button"
                    onClick={() => cardModalRef.current && downloadCardAsPng(cardModalRef.current, `${event.title}-${cardModalGuest.name}.png`)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1"
                    title="Download PNG Image"
                  >
                    <FileImage className="w-3 h-3 text-emerald-400" /> PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => cardModalRef.current && downloadCardAsPdf(cardModalRef.current, `${event.title}-${cardModalGuest.name}.pdf`)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-semibold flex items-center gap-1"
                    title="Download PDF Document"
                  >
                    <FileText className="w-3 h-3 text-rose-400" /> PDF
                  </button>
                </div>
              </div>

              <div ref={cardModalRef} className="rounded-3xl border-2 border-amber-500/50 shadow-2xl overflow-hidden relative font-sans text-white bg-[#0D0205]">
                {/* Event Specific High-Res Gracious Background Image */}
                <img
                  src={event?.cover_image_url || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop'}
                  alt="Gracious Card Background"
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/95" />

                {/* Card Container Content */}
                <div className="relative z-10 p-5 space-y-5 text-center">
                  
                  {/* TOP HALF: HINDI INVITATION SECTION */}
                  <div className="space-y-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 backdrop-blur-md">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold tracking-widest uppercase border border-amber-500/30">
                      प्रथमाध: हिंदी निमंत्रण (HINDI SECTION)
                    </span>
                    <div className="text-amber-400 font-hindi font-bold text-base">|| श्री गणेशाय नमः ||</div>
                    <h4 className="font-serif text-xl font-bold gold-gradient-text">{event?.title || 'Celebration'}</h4>
                    <p className="text-xs text-amber-100 font-hindi leading-relaxed whitespace-pre-line">
                      सपरिवार सादर निमंत्रण{'\n'}
                      मान्यवर, {event?.host_name || 'Family'} परिवार की ओर से आपकी गरिमामयी उपस्थिति अत्यंत प्रार्थनीय है।
                    </p>
                    
                    {/* Hindi Event Details Link */}
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-xs shadow-md hover:scale-105 transition-transform"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Tap here for Event Details →
                    </a>
                  </div>

                  {/* ELEGANT SEPARATOR */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px bg-amber-500/40 flex-grow" />
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-500/30 bg-black/60">
                      NIMANTRAN AI • BILINGUAL
                    </span>
                    <div className="h-px bg-amber-500/40 flex-grow" />
                  </div>

                  {/* BOTTOM HALF: ENGLISH INVITATION SECTION */}
                  <div className="space-y-3 p-4 rounded-2xl bg-rose-950/30 border border-amber-500/30 backdrop-blur-md">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold tracking-widest uppercase border border-rose-500/30">
                      SECOND HALF: ENGLISH INVITATION
                    </span>
                    <h4 className="font-serif text-lg font-bold text-white">{event?.title || 'Celebration'}</h4>
                    <p className="text-xs text-slate-200 leading-relaxed font-serif italic">
                      Together with our families, {event?.host_name || 'Family'} cordially requests your gracious presence to celebrate this auspicious occasion.
                    </p>

                    {/* English Event Details Link */}
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-xs shadow-md hover:scale-105 transition-transform"
                    >
                      <Eye className="w-3.5 h-3.5" /> Tap here for Event Details →
                    </a>
                  </div>

                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleSendWhatsAppAPI('JPEG')}
                  disabled={sendingMsg || aiWordingLoading}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Send AI-generated JPEG image card attachment directly on WhatsApp"
                >
                  <Send className="w-4 h-4" /> Send AI JPEG Card via WhatsApp API
                </button>

                <button
                  onClick={() => handleSendWhatsAppAPI('PDF')}
                  disabled={sendingMsg || aiWordingLoading}
                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Send AI-generated PDF document card attachment directly on WhatsApp"
                >
                  <FileText className="w-4 h-4 text-white" /> Send AI PDF Document via WhatsApp API
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleShareNativeWhatsApp('JPEG')}
                  disabled={aiWordingLoading}
                  className="py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2"
                  title="Copies AI JPEG Card image to clipboard for instant Ctrl+V pasting in WhatsApp Web"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" /> Share/Paste AI JPEG Image to WhatsApp
                </button>

                <button
                  onClick={() => handleShareNativeWhatsApp('PDF')}
                  disabled={aiWordingLoading}
                  className="py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2"
                  title="Downloads AI PDF Card document file for attachment in WhatsApp Web"
                >
                  <FileText className="w-4 h-4 text-rose-400" /> Share/Attach AI PDF Card to WhatsApp
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleSendSMS}
                  disabled={sendingMsg || aiWordingLoading}
                  className="py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border-amber-500/30 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-amber-400" /> Dispatch SMS Invitation
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(personalizedText);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border-amber-500/30 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  {copiedLink ? 'Copied to Clipboard!' : 'Copy Text & Link'}
                </button>
              </div>

              {/* Explicit Bottom Close / Back Button */}
              <button
                type="button"
                onClick={() => setCardModalGuest(null)}
                className="w-full py-3.5 rounded-2xl bg-black/60 hover:bg-black/80 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>← Back to Celebration Details & Close Popup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select From Master List Modal */}
      <SelectFromMasterListModal
        isOpen={isSelectMasterListOpen}
        onClose={() => setIsSelectMasterListOpen(false)}
        eventId={id!}
        onSuccess={(addedCount) => {
          refreshGuests();
          setStatusNotice(`Added ${addedCount} guest(s) from Master Contact List!`);
          setTimeout(() => setStatusNotice(null), 4000);
        }}
      />

      {/* Bulk WhatsApp Dispatch Modal with Reverification */}
      <BulkWhatsAppDispatchModal
        isOpen={isBulkWhatsAppOpen}
        onClose={() => setIsBulkWhatsAppOpen(false)}
        eventId={id!}
        eventTitle={event?.title || 'Celebration'}
        hostName={event?.host_name || 'Gupta & Sharma Families'}
        startDate={event?.start_date}
        venueName={event?.venue_name}
        publicUrl={publicUrl}
        guests={guests}
        onDispatchComplete={() => {
          refreshGuests();
          setStatusNotice('Bulk WhatsApp Invitation dispatch complete!');
          setTimeout(() => setStatusNotice(null), 4000);
        }}
      />

      {/* LARGE WELCOME GUEST SCREEN MODAL (POPS UP ON SUCCESSFUL GATE PASS CHECK-IN) */}
      {welcomeGuestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 select-none">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#FFFDFC] via-[#FAF6F0] to-[#F2E5E2] rounded-3xl shadow-2xl border-4 border-amber-400/80 p-8 text-center space-y-6 overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-xl border-4 border-white animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <span className="px-4 py-1 rounded-full bg-emerald-100 text-emerald-900 font-mono font-extrabold text-xs uppercase tracking-widest border border-emerald-300 inline-block">
                ✓ ATTENDANCE CONFIRMED
              </span>
              <h1 className="font-serif text-4xl font-extrabold text-[#302829]">
                Welcome, {welcomeGuestResult.guest_name}!
              </h1>
              <p className="font-serif font-extrabold text-lg text-[#893148]">
                {welcomeGuestResult.event_title || event?.title}
              </p>
              <p className="text-xs font-serif italic text-[#7A6B6C]">
                We are delighted to have you with us.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/90 border border-amber-300/60 shadow-sm text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[#8C7E80] block text-[10px] font-bold uppercase">CHECK-IN TIME</span>
                <span className="text-sm font-extrabold text-[#302829]">
                  {welcomeGuestResult.checked_in_at
                    ? new Date(welcomeGuestResult.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just Now'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[#8C7E80] block text-[10px] font-bold uppercase">PARTY SIZE</span>
                <span className="text-sm font-extrabold text-[#302829]">
                  {welcomeGuestResult.adults_count || 1} Adults, {welcomeGuestResult.children_count || 0} Children
                </span>
              </div>
            </div>

            {welcomeGuestResult.welcome_quote && (
              <p className="text-xs text-[#302829] italic font-serif leading-relaxed px-4">
                "{welcomeGuestResult.welcome_quote}"
              </p>
            )}

            <button
              type="button"
              onClick={() => setWelcomeGuestResult(null)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#5E3735] text-white font-extrabold text-sm shadow-xl hover:scale-[1.02] transition-transform border border-amber-300"
            >
              CONTINUE TO ATTENDANCE DASHBOARD →
            </button>
          </div>
        </div>
      )}

      {/* Universal Share Invitation Modal */}
      {event && (
        <ShareInvitationModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareModalGuest(null);
          }}
          event={event}
          guest={shareModalGuest}
          defaultChannel={shareDefaultChannel}
        />
      )}

      {/* Publish & Share Celebration Modal */}
      {event && (
        <PublishAndShareModal
          isOpen={isPublishShareModalOpen}
          onClose={() => setIsPublishShareModalOpen(false)}
          event={{
            id: event.id,
            slug: event.slug,
            title: event.title,
            host_name: event.host_name,
            venue_name: event.venue_name,
            start_date: event.start_date,
            event_type: event.event_type,
          }}
          onOpenBroadcastWizard={() => {
            setIsPublishShareModalOpen(false);
            setIsBroadcastWizardOpen(true);
          }}
        />
      )}

      {/* Multi-Channel Broadcast Wizard Modal */}
      {event && (
        <BroadcastWizardModal
          isOpen={isBroadcastWizardOpen}
          onClose={() => setIsBroadcastWizardOpen(false)}
          eventId={event.id}
          eventTitle={event.title}
          hostName={event.host_name}
          guests={guests}
          onCampaignCreated={(campaignId) => {
            setActiveTab('campaigns');
            setStatusNotice('Broadcast Campaign initiated! Messages are delivering in the background.');
            setTimeout(() => setStatusNotice(null), 4000);
          }}
        />
      )}

      {/* QR SCANNER MODAL */}
      <QrScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onVerifyPass={handleVerifyCheckin}
        loading={scannerLoading}
        error={scannerError}
      />

      {/* EDIT CELEBRATION DETAILS MODAL */}
      {event && (
        <EditCelebrationModal
          isOpen={isEditCelebrationOpen}
          onClose={() => setIsEditCelebrationOpen(false)}
          eventData={event}
          onSuccess={(updatedEvt) => {
            setEvent(updatedEvt);
            setIsEditCelebrationOpen(false);
            setStatusNotice('Event details updated successfully!');
            setTimeout(() => setStatusNotice(null), 3000);
          }}
        />
      )}

    </div>
  );
};
