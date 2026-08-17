import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, QrCode, Tv, Eye, Plus, Upload, Send, Sparkles, 
  CheckCircle, CheckCircle2, Smartphone, Edit2, Trash2, MessageSquare, PhoneCall, 
  Copy, FileText, Check, X, AlertCircle, Heart, Image as ImageIcon,
  Download, FileImage, ArrowLeft, Camera, Key, Bell, Clock, Star, Trophy, Gift
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

  // Add Guest Form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestRel, setGuestRel] = useState('');
  const [guestGroup, setGuestGroup] = useState('General');
  const [addingGuest, setAddingGuest] = useState(false);

  // Edit Guest Modal state
  const [editingGuest, setEditingGuest] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRel, setEditRel] = useState('');
  const [editGroup, setEditGroup] = useState('');

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
      // Clean up URL without page reload
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

  // Add Single Guest
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !id) return;
    setAddingGuest(true);
    try {
      const res = await apiFetch<any>(`/events/${id}/guests`, {
        method: 'POST',
        body: JSON.stringify({
          name: guestName,
          phone: guestPhone || undefined,
          relationship: guestRel || 'Guest',
          group_name: guestGroup || 'General',
          save_to_master_list: saveToMasterList,
        }),
      });
      setGuests([res.data, ...guests]);
      setGuestName('');
      setGuestPhone('');
      setGuestRel('');
      setSaveToMasterList(false);
      setStatusNotice(`Added ${res.data.name} to guest list!${saveToMasterList ? ' (Saved to Master List)' : ''}`);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to add guest');
    } finally {
      setAddingGuest(false);
    }
  };

  // One-Tap Mobile Contact Picker (Web Contacts API)
  const handleOneTapMobileContacts = async () => {
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      alert('Mobile address book API is available on Android/Chrome mobile browsers. Use VCF / File upload fallback below.');
      return;
    }

    try {
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      const selectedContacts: any = await (navigator as any).contacts.select(props, opts);
      if (selectedContacts && selectedContacts.length > 0) {
        const payload = selectedContacts.map((c: any) => ({
          name: (c.name && c.name[0]) || 'Mobile Contact',
          phone: (c.tel && c.tel[0]) || null,
          email: (c.email && c.email[0]) || null,
          relationship: 'Guest',
          group_name: 'Mobile Contacts',
        }));

        const res = await apiFetch<any>(`/events/${id}/guests/bulk`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await refreshGuests();
        setStatusNotice(res.message || `Imported ${payload.length} contacts directly from phonebook!`);
        setTimeout(() => setStatusNotice(null), 4000);
      }
    } catch (err: any) {
      console.error('Contacts picker error:', err);
    }
  };

  // VCF vCard File Upload Parser
  const handleVcfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const text = await file.text();
    parseAndImportVcf(text);
  };

  const parseAndImportVcf = async (rawVcf: string) => {
    const lines = rawVcf.split(/\r?\n/);
    const imported: any[] = [];
    let current: any = {};

    lines.forEach((line) => {
      if (line.startsWith('BEGIN:VCARD')) {
        current = {};
      } else if (line.startsWith('FN:') || line.startsWith('N:')) {
        current.name = line.split(':')[1].replace(/;/g, ' ').trim();
      } else if (line.includes('TEL')) {
        current.phone = line.split(':')[1].trim();
      } else if (line.includes('EMAIL')) {
        current.email = line.split(':')[1].trim();
      } else if (line.startsWith('END:VCARD')) {
        if (current.name) {
          imported.push({
            name: current.name,
            phone: current.phone || null,
            email: current.email || null,
            relationship: 'Guest',
            group_name: 'VCF Contacts',
          });
        }
      }
    });

    if (imported.length > 0) {
      const res = await apiFetch<any>(`/events/${id}/guests/bulk`, {
        method: 'POST',
        body: JSON.stringify(imported),
      });
      await refreshGuests();
      setStatusNotice(`Successfully imported ${imported.length} contacts from VCF file!`);
      setTimeout(() => setStatusNotice(null), 4000);
    } else {
      alert('No valid contacts found in VCF file.');
    }
  };

  // Edit Guest
  const handleSaveEdit = async () => {
    if (!editingGuest || !id) return;
    try {
      const res = await apiFetch<any>(`/events/${id}/guests/${editingGuest.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          relationship: editRel,
          group_name: editGroup,
        }),
      });
      setGuests(guests.map((g) => (g.id === editingGuest.id ? res.data : g)));
      setEditingGuest(null);
      setStatusNotice('Guest updated successfully!');
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update guest');
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

          {/* Quick Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-[#E9D3D0] shadow-md">
            <div>
              <h3 className="font-serif text-lg font-extrabold text-[#302829] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#9E6F6D]" /> Celebration Guest List
              </h3>
              <p className="text-xs text-[#7A6B6C]">Add guest details, import phone contacts, or choose from your saved contacts</p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setIsSelectMasterListOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#9E6F6D] to-[#C9AA78] text-white font-extrabold text-xs shadow-md hover:scale-105 transition-transform inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Users className="w-4 h-4 text-white" /> Choose Saved Guests
              </button>

              <div className="inline-flex items-center gap-2 flex-nowrap">
                <button
                  onClick={handleOneTapMobileContacts}
                  className="px-3.5 py-2.5 rounded-2xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] border border-[#E9D3D0] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-[#9E6F6D]" /> Import Phone Contacts
                </button>

                <label className="px-3.5 py-2.5 rounded-2xl bg-[#FAF6F0] hover:bg-[#F2E5E2] text-[#302829] border border-[#E9D3D0] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors">
                  <Upload className="w-4 h-4 text-[#9E6F6D]" /> Upload Contact File
 (Google / iPhone)
                  <input type="file" accept=".vcf,text/vcard" onChange={handleVcfUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Add Guest Form */}
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-[#E9D3D0] shadow-md space-y-4 text-[#302829]">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-sm font-extrabold text-[#302829] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#9E6F6D]" /> Add New Guest
              </h4>

              <label className="flex items-center gap-2 text-xs text-[#9E6F6D] font-extrabold cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToMasterList}
                  onChange={(e) => setSaveToMasterList(e.target.checked)}
                  className="rounded border-[#E9D3D0] bg-[#FFFDFB] text-[#9E6F6D] focus:ring-[#9E6F6D]"
                />
                Save contact for future celebrations
              </label>
            </div>

            <form onSubmit={handleAddGuest} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
              <select
                value={guestRel}
                onChange={(e) => setGuestRel(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#FFFDFB] border border-[#E9D3D0] text-[#302829] text-xs font-semibold focus:outline-none focus:border-[#9E6F6D]"
              >
                <option value="General">Guest Category: General</option>
                <option value="Special">Guest Category: Special</option>
                <option value="VIP">Guest Category: VIP</option>
                <option value="Family">Guest Category: Family</option>
                <option value="Relatives">Guest Category: Relatives</option>
                <option value="Friends">Guest Category: Friends</option>
                <option value="Colleagues">Guest Category: Colleagues</option>
              </select>

              <button
                type="submit"
                disabled={addingGuest}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white font-extrabold text-xs shadow-md hover:scale-105 transition-all flex items-center justify-center gap-1.5 border border-[#E9D3D0]"
              >
                <Plus className="w-4 h-4 text-white" /> {addingGuest ? 'Adding...' : 'Add Guest to List'}
              </button>

              <button
                type="button"
                onClick={() => setIsBulkWhatsAppOpen(true)}
                className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-1.5 border border-emerald-300"
              >
                <Send className="w-4 h-4 text-white" /> Invite All via WhatsApp
              </button>
            </form>
          </div>

          {/* Guest List Table */}
          <div className="bg-[#FFFDFC] rounded-2xl border border-[#E9D3D0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#302829] border-b border-[#E9D3D0] text-[#C9AA78] font-serif font-bold">
                  <tr>
                    <th className="p-4">Guest Name</th>
                    <th className="p-4">Group / Rel</th>
                    <th className="p-4">WhatsApp Phone</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4">RSVP Status</th>
                    <th className="p-4">Entry Pass</th>
                    <th className="p-4 text-center">AI Invitation & WhatsApp Link</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9D3D0] text-[#302829]">
                  {guests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#8C7E80]">
                        No guests added yet. Tap <strong>Import Phone Contacts</strong> or add guests above!
                      </td>
                    </tr>
                  ) : (
                    guests.map((g) => (
                      <tr key={g.id} className="hover:bg-[#FAF7F3] transition-colors">
                        <td className="p-4 font-bold text-[#302829]">
                          <div className="text-sm">{g.name}</div>
                          {g.notes && <div className="text-[10px] text-[#8C7E80] font-normal">{g.notes}</div>}
                        </td>
                        <td className="p-4 text-[#51484A]">
                          <span className="px-2 py-0.5 rounded-full bg-[#F2E5E2] text-[#9E6F6D] text-[10px] font-bold border border-[#D8B5B0]">
                            {g.group_name || 'General'}
                          </span>
                          <span className="ml-1.5 text-xs text-[#51484A] font-semibold">{g.relationship || 'Guest'}</span>
                        </td>
                        <td className="p-4 font-mono text-[#302829] font-bold text-xs">{g.phone || '—'}</td>
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
                                setEditRel(g.relationship || '');
                                setEditGroup(g.group_name || 'General');
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
                    ))
                  )}
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E9D3D0] shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#8C7E80]">TOTAL GUESTS</span>
              <div className="text-3xl font-extrabold text-[#302829] font-serif">{guests.length}</div>
              <span className="text-[11px] text-[#7A6B6C] font-mono">Invited to Event</span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">ATTENDED</span>
              <div className="text-3xl font-extrabold text-emerald-900 font-serif">
                {guests.filter((g) => g.checked_in).length}
              </div>
              <span className="text-[11px] text-emerald-700 font-mono">✓ Gate Checked-In</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-600">NOT ATTENDED</span>
              <div className="text-3xl font-extrabold text-slate-800 font-serif">
                {guests.filter((g) => !g.checked_in).length}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Pending Arrival</span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-800">ATTENDANCE RATE</span>
              <div className="text-3xl font-extrabold text-amber-900 font-serif">
                {guests.length > 0
                  ? `${((guests.filter((g) => g.checked_in).length / guests.length) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
              <span className="text-[11px] text-amber-700 font-mono">Real-time Check-In %</span>
            </div>
          </div>

          {/* PRIMARY CHECK-IN ACTION BAR */}
          <div className="p-6 rounded-3xl bg-white border border-[#E9D3D0] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-extrabold text-[#302829] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" /> 1-Tap Guest Gate Check-In
              </h3>
              <p className="text-xs text-[#7A6B6C] font-mono">
                Scan guest QR passes using your mobile camera or enter pass codes manually.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 border border-emerald-400/40"
              >
                <Camera className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>📷 SCAN GUEST QR (1-TAP)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="px-5 py-3.5 rounded-2xl bg-[#FAF7F5] border border-[#E9D3D0] hover:bg-[#F2E5E2] text-[#302829] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Key className="w-4 h-4 text-[#9E6F6D]" />
                <span>Enter Pass Code</span>
              </button>
            </div>
          </div>

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
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl gold-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-white">Edit Guest Details</h3>
              <button onClick={() => setEditingGuest(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0205] border border-amber-500/30 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0205] border border-amber-500/30 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Guest Type / Relationship</label>
                <select
                  value={editRel}
                  onChange={(e) => setEditRel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0205] border border-amber-500/30 text-white text-sm"
                >
                  <option value="General">General</option>
                  <option value="Special">Special</option>
                  <option value="VIP">VIP</option>
                  <option value="Family">Family</option>
                  <option value="Relatives">Relatives</option>
                  <option value="Friends">Friends</option>
                  <option value="Colleagues">Colleagues</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Group Name</label>
                <input
                  type="text"
                  value={editGroup}
                  onChange={(e) => setEditGroup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0205] border border-amber-500/30 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingGuest(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-md hover:bg-amber-400"
              >
                Save Changes
              </button>
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
