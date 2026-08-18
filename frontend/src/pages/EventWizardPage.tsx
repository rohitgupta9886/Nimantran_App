import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Calendar, MapPin, User, ArrowRight, Check, AlertCircle, Clock, 
  Home, Building2, Sun, Moon, Radio, Heart, Image as ImageIcon, Plus, Trash2, 
  Send, QrCode, Smartphone, Eye, CheckCircle2, ChevronRight, ChevronLeft, Save, Copy,
  Users, CheckSquare, Square, Search, X
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { VoiceChatAssistantModal } from '../components/VoiceChatAssistantModal';
import { VisualCalendarPicker } from '../components/VisualCalendarPicker';
import { getThemeTokens } from '../utils/themeEngine';
import { ShareInvitationModal } from '../components/ShareInvitationModal';
import { PublishAndShareModal } from '../components/PublishAndShareModal';
import { BroadcastWizardModal } from '../components/BroadcastWizardModal';
import { copyInvitationLink } from '../services/invitationSharingService';
import { 
  MASTER_OCCASION_CATALOGUE, 
  OCCASION_CATEGORIES, 
  searchOccasions, 
  getOccasionById, 
  OccasionItem 
} from '../utils/occasionCatalog';
import { 
  MASTER_THEME_CATALOG,
  THEME_FILTER_TAGS,
  getFilteredCelebrationThemes,
  getCelebrationThemeById,
  getRecommendedThemeForOccasion,
  CelebrationTheme
} from '../utils/themeCatalog';
import { ThemeArtworkCanvas } from '../components/ThemeArtworkCanvas';
import { LiveInvitationPreviewModal } from '../components/LiveInvitationPreviewModal';

// WIZARD STEP METADATA FOR NON-TECHNICAL GUIDANCE
const WIZARD_STEPS = [
  { num: 1, title: 'Occasion', sub: 'What are you celebrating?' },
  { num: 2, title: 'Event Details', sub: 'Date, time & venue' },
  { num: 3, title: 'Design', sub: 'Choose invitation style' },
  { num: 4, title: 'Personalize', sub: 'Message & story' },
  { num: 5, title: 'Guests', sub: 'Who to invite' },
  { num: 6, title: 'Preview & Test', sub: 'Check your invitation' },
  { num: 7, title: 'Publish & Send', sub: 'Share with loved ones' },
];

export const EventWizardPage: React.FC = () => {
  const navigate = useNavigate();

  // DRAFT STEP & EVENT FORM STATE
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState('WEDDING');
  const [title, setTitle] = useState('Rohit & Priya\'s Wedding Celebration');
  const [hostName, setHostName] = useState('Gupta & Sharma Families');
  // Default celebration date 30 days from now at 7:00 PM
  const defaultInitialDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T19:00:00.000Z`;
  })();
  const [startDate, setStartDate] = useState(defaultInitialDate);
  const [timePreset, setTimePreset] = useState('19:00');
  const [venueName, setVenueName] = useState('The Taj Hotel & Convention Centre');
  const [venueAddress, setVenueAddress] = useState('Vipul Khand, Gomti Nagar, Lucknow');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // DESIGN & PERSONALIZATION STATE
  const [selectedThemeId, setSelectedThemeId] = useState('wedding-royal-marigold');
  const [themeFilterTag, setThemeFilterTag] = useState<string>('ALL');
  const [previewThemeModalItem, setPreviewThemeModalItem] = useState<CelebrationTheme | null>(null);
  const [hindiTitle, setHindiTitle] = useState('|| श्री गणेशाय नमः ||');
  const [invitationMessage, setInvitationMessage] = useState('Together with our families, we cordially invite you to celebrate our special day with us. Your presence and blessings will make our celebration complete.');

  // OCCASION SEARCH & FILTER STATE
  const [occasionSearchQuery, setOccasionSearchQuery] = useState('');
  const [occasionCategoryFilter, setOccasionCategoryFilter] = useState('ALL');
  const [isCustomOccasionModalOpen, setIsCustomOccasionModalOpen] = useState(false);
  const [customOccasionInput, setCustomOccasionInput] = useState('');
  const [cardCategoryFilter, setCardCategoryFilter] = useState('ALL');

  const handleOccasionSelect = (item: OccasionItem) => {
    setEventType(item.id);
    if (!title || title.includes('Wedding') || title.includes('Celebration') || title.includes('Rohit')) {
      setTitle(item.defaultTitle);
    }
    if (!venueName || venueName.includes('Taj')) {
      setVenueName(item.defaultVenue);
    }
    if (item.defaultShloka) {
      setHindiTitle(item.defaultShloka);
    }
    if (item.defaultMessage) {
      setInvitationMessage(item.defaultMessage);
    }
    const recTheme = getRecommendedThemeForOccasion(item.id);
    if (recTheme) {
      setSelectedThemeId(recTheme.id);
    }
    setStep(2);
  };

  const handleOccasionDropdownChange = (occId: string) => {
    setEventType(occId);
    const recTheme = getRecommendedThemeForOccasion(occId);
    if (recTheme) {
      setSelectedThemeId(recTheme.id);
    }
  };

  const handleCreateCustomOccasion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customOccasionInput.trim()) return;
    const name = customOccasionInput.trim();
    setEventType(name.toUpperCase().replace(/\s+/g, '_'));
    setTitle(`${name} Celebration`);
    setIsCustomOccasionModalOpen(false);
    setCustomOccasionInput('');
    setStep(2);
  };

  // STORY MOMENTS LIST
  const [storyMoments, setStoryMoments] = useState<any[]>([
    { title: 'First Meeting', date: '12 March 2020', story: 'Where our beautiful journey began together...', image_url: '/velvet_invitation_chest.jpg' }
  ]);
  const [momentTitle, setMomentTitle] = useState('');
  const [momentDate, setMomentDate] = useState('');
  const [momentStory, setMomentStory] = useState('');

  // DIGITAL SHAGUN STATE
  const [acceptsDigitalShagun, setAcceptsDigitalShagun] = useState(true);
  const [upiId, setUpiId] = useState('priyankarohit@upi');
  const [hostUpiMobile, setHostUpiMobile] = useState('9876543210');

  // GUESTS LIST IN WIZARD
  const [guestList, setGuestList] = useState<any[]>([
    { name: 'Amit Sharma & Family', phone: '9876543210', group: 'Family' },
    { name: 'Rohan Verma', phone: '9812345678', group: 'Friends' }
  ]);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestGroup, setNewGuestGroup] = useState('Family');

  // PREVIEW / TEST / LOADING STATE
  const [previewDevice, setPreviewDevice] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');
  const [testMobileNum, setTestMobileNum] = useState('');
  const [testSentNotice, setTestSentNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatingAiWording, setGeneratingAiWording] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [autoSavedNotice, setAutoSavedNotice] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBroadcastWizardOpen, setIsBroadcastWizardOpen] = useState(false);
  const [shareDefaultChannel, setShareDefaultChannel] = useState<'whatsapp' | 'sms' | 'gmail' | 'copy'>('whatsapp');
  const [copiedStep8Link, setCopiedStep8Link] = useState(false);

  // MASTER CONTACTS LIST SELECTION STATE
  const [isMasterListOpen, setIsMasterListOpen] = useState(false);
  const [masterContacts, setMasterContacts] = useState<any[]>([]);
  const [selectedMasterIds, setSelectedMasterIds] = useState<Set<string>>(new Set());
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [masterSearch, setMasterSearch] = useState('');

  const fetchAndOpenMasterList = async () => {
    setIsMasterListOpen(true);
    setLoadingMaster(true);
    try {
      const res = await apiFetch<any[]>('/master-contacts');
      const list = res.data || [];
      setMasterContacts(list);
      setSelectedMasterIds(new Set(list.map((c: any) => c.id)));
    } catch (err) {
      console.error('Failed to fetch master contacts:', err);
    } finally {
      setLoadingMaster(false);
    }
  };

  const handleAddSelectedMasterContactsToWizard = () => {
    const selected = masterContacts.filter((c) => selectedMasterIds.has(c.id));
    if (selected.length === 0) {
      alert('Please select at least one contact from your saved Master List.');
      return;
    }
    const newGuests = selected.map((c) => ({
      name: c.name,
      phone: c.phone || '',
      group: c.group_name || c.relationship || 'Family',
    }));

    const existingNames = new Set(guestList.map((g) => g.name.toLowerCase()));
    const filteredNew = newGuests.filter((g) => !existingNames.has(g.name.toLowerCase()));

    setGuestList([...guestList, ...filteredNew]);
    setIsMasterListOpen(false);
  };

  const filteredMasterContacts = masterContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(masterSearch.toLowerCase()) ||
      (c.phone || '').includes(masterSearch) ||
      (c.group_name || '').toLowerCase().includes(masterSearch.toLowerCase())
  );

  // AUTO-SAVE DRAFT TO LOCAL STORAGE ON STEP CHANGE
  useEffect(() => {
    const draftData = {
      step, eventType, title, hostName, startDate, timePreset, venueName, venueAddress,
      selectedThemeId, hindiTitle, invitationMessage, storyMoments, acceptsDigitalShagun,
      upiId, hostUpiMobile, guestList
    };
    localStorage.setItem('nimantran_invitation_draft', JSON.stringify(draftData));
    setAutoSavedNotice(true);
    const t = setTimeout(() => setAutoSavedNotice(false), 2000);
    return () => clearTimeout(t);
  }, [step, eventType, title, hostName, startDate, venueName, selectedThemeId, storyMoments, guestList]);

  // LOAD EXISTING DRAFT IF PRESENT
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nimantran_invitation_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.eventType) setEventType(parsed.eventType);
        if (parsed.startDate) setStartDate(parsed.startDate);
        if (parsed.venueName) setVenueName(parsed.venueName);
      }
    } catch (e) {
      // ignore draft parse error
    }
  }, []);

  // ADD STORY MOMENT HANDLER
  const handleAddStoryMoment = () => {
    if (!momentTitle) return;
    setStoryMoments([
      ...storyMoments,
      { title: momentTitle, date: momentDate || 'Special Day', story: momentStory, image_url: '/velvet_invitation_chest.jpg' }
    ]);
    setMomentTitle('');
    setMomentDate('');
    setMomentStory('');
  };

  // ADD GUEST HANDLER
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName) return;
    setGuestList([...guestList, { name: newGuestName, phone: newGuestPhone, group: newGuestGroup }]);
    setNewGuestName('');
    setNewGuestPhone('');
  };

  // AI INVITATION WORDING GENERATOR
  const handleGenerateAiWording = async (tone: string = 'ROYAL') => {
    setGeneratingAiWording(true);
    try {
      const res = await apiFetch<any>('/ai/generate-wording', {
        method: 'POST',
        body: JSON.stringify({
          event_type: eventType,
          title: title || 'Grand Celebration',
          host_name: hostName || 'The Family',
          venue_name: venueName || 'Celebration Venue',
          language: 'BOTH',
          tone,
        }),
      });
      if (res.data?.wording) {
        setInvitationMessage(res.data.wording);
      }
    } catch (err) {
      setInvitationMessage(
        `Together with our families, we cordially invite you to celebrate the joyous occasion of ${title}. Your presence and blessings will make our celebration complete.`
      );
    } finally {
      setGeneratingAiWording(false);
    }
  };

  // TEST INVITATION HANDLER
  const handleSendTestInvitation = () => {
    setTestSentNotice(`Test invitation link generated for ${testMobileNum || 'your phone'}! Opening preview mode...`);
    setTimeout(() => setTestSentNotice(null), 4000);
  };

  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);

  // FINAL PUBLISH INVITATION HANDLER
  const handlePublishInvitation = async () => {
    if (!title || !startDate) {
      setErrorMsg('Please ensure date and venue are filled before publishing.');
      setStep(2);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch<any>('/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          event_type: eventType,
          host_name: hostName,
          start_date: new Date(startDate).toISOString(),
          venue_name: venueName,
          venue_address: venueAddress,
          google_maps_url: googleMapsUrl,
          upi_id: acceptsDigitalShagun ? upiId : undefined,
          host_upi_mobile: acceptsDigitalShagun ? hostUpiMobile : undefined,
          accepts_digital_shagun: acceptsDigitalShagun,
          theme_config: {
            theme: selectedThemeId,
            hindi_title: hindiTitle,
            custom_message: invitationMessage,
            memories: storyMoments,
          },
        }),
      });

      // Support both res.data.id and res.data.slug as the event identifier
      const eventId = res.data?.id || res.data?.slug || (res as any)?.id || null;

      if (eventId) {
        // Clear temporary draft
        localStorage.removeItem('nimantran_invitation_draft');
        setPublishedEventId(eventId);
        setStep(8);
      } else {
        // API succeeded but returned no usable event identifier
        console.error('Publish response missing event id:', res);
        setErrorMsg('Invitation was created but we could not retrieve its ID. Please check your Dashboard to manage it.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'We could not publish your invitation. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedThemeObj = getCelebrationThemeById(selectedThemeId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 text-[#302829] selection:bg-[#E9D3D0]">
      
      {/* 🌟 1. NON-TECHNICAL WELCOME HEADER WITH VOICE ASSISTANT 🌟 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F2E5E2] border border-[#D8B5B0] text-[#9E6F6D] text-xs font-mono font-extrabold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#C9AA78]" /> {step > 7 ? '🎉 Invitation Live' : `Step ${step} of 7 • Easy Invitation Wizard`}
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#302829]">
            {step === 1 && "What are you celebrating?"}
            {step === 2 && "Tell us about your special day"}
            {step === 3 && "Choose a design you love"}
            {step === 4 && "Make your invitation personal"}
            {step === 5 && "Who would you like to invite?"}
            {step === 6 && "See how your invitation will look"}
            {step === 7 && "Your invitation is ready! 🎉"}
            {step === 8 && "Your Invitation is Live! 🎉"}
          </h1>
          <p className="text-xs sm:text-sm text-[#8C7E80] font-serif italic">
            "{WIZARD_STEPS[Math.min(Math.max(0, step - 1), WIZARD_STEPS.length - 1)]?.sub || 'Share with your loved ones'}"
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {autoSavedNotice && (
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3" /> Progress Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4 text-white animate-pulse" />
            <span>🎙️ Talk to AI Assistant</span>
          </button>
        </div>
      </div>

      {/* 🌟 2. VISIBLE 7-STEP PROGRESS INDICATOR ("WHERE AM I?") 🌟 */}
      <div className="p-3.5 rounded-2xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {WIZARD_STEPS.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                onClick={() => s.num < step && setStep(s.num)}
                className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-[#9E6F6D] text-white border-[#9E6F6D] font-bold shadow-md'
                    : isCompleted
                    ? 'bg-[#F2E5E2] text-[#9E6F6D] border-[#D8B5B0] cursor-pointer hover:bg-[#E9D3D0]'
                    : 'bg-[#FAF7F3] text-[#8C7E80] border-transparent opacity-70'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold flex items-center justify-center gap-1">
                  {isCompleted ? <Check className="w-3 h-3 text-[#9E6F6D]" /> : `Step ${s.num}`}
                </div>
                <div className="text-xs font-bold truncate">{s.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ERROR NOTICE DISPLAY */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs underline font-bold">Dismiss</button>
        </div>
      )}

      {/* 🌟 STEP 1: WHAT ARE YOU CELEBRATING? (COMPREHENSIVE OCCASION CATALOGUE) 🌟 */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & Occasion Search Bar */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#302829]">
                  What are you celebrating?
                </h2>
                <p className="text-xs text-[#8C7E80] mt-1">
                  Choose from our comprehensive celebration catalogue or search your occasion below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomOccasionModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#F2E5E2] border border-[#D8B5B0] text-[#9E6F6D] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4 text-[#9E6F6D]" />
                <span>+ Custom Occasion</span>
              </button>
            </div>

            {/* Instant Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-[#8C7E80] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={occasionSearchQuery}
                onChange={(e) => setOccasionSearchQuery(e.target.value)}
                placeholder="🔍 Search occasion (e.g. Mundan, Conference, Haldi, Katha, 50th Anniversary, Sangeet)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-[#E9D3D0] text-sm focus:outline-none focus:border-[#9E6F6D] bg-white shadow-inner"
              />
              {occasionSearchQuery && (
                <button
                  type="button"
                  onClick={() => setOccasionSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C7E80] hover:text-[#302829]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {OCCASION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setOccasionCategoryFilter(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    occasionCategoryFilter === cat.id
                      ? 'bg-[#9E6F6D] text-white shadow-md'
                      : 'bg-[#FAF7F3] text-[#8C7E80] hover:bg-[#F2E5E2] hover:text-[#302829] border border-[#E9D3D0]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Occasions Grid */}
          {(() => {
            const matches = searchOccasions(occasionSearchQuery, occasionCategoryFilter);
            if (matches.length === 0) {
              return (
                <div className="p-12 text-center rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-4">
                  <span className="text-4xl">✨</span>
                  <h3 className="font-serif text-lg font-bold text-[#302829]">
                    No standard occasion found for "{occasionSearchQuery}"
                  </h3>
                  <p className="text-xs text-[#8C7E80] max-w-md mx-auto">
                    You can create a custom celebration with this exact name in 1 tap!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEventType(occasionSearchQuery.toUpperCase().replace(/\s+/g, '_'));
                      setTitle(`${occasionSearchQuery} Celebration`);
                      setStep(2);
                    }}
                    className="px-6 py-3 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <span>Create "{occasionSearchQuery}" Celebration →</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {matches.map((item) => {
                  const isSelected = eventType === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOccasionSelect(item)}
                      className={`p-5 rounded-3xl border-2 text-center cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:scale-[1.03] hover:shadow-xl ${
                        isSelected
                          ? 'bg-[#FFFDFC] border-[#9E6F6D] shadow-lg ring-4 ring-[#9E6F6D]/20'
                          : 'bg-[#FFFDFC] border-[#E9D3D0] hover:border-[#9E6F6D]/60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="text-4xl mb-2">{item.icon}</div>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F3] border border-[#E9D3D0] text-[9px] font-mono font-bold uppercase text-[#8C7E80] inline-block">
                          {item.categoryLabel}
                        </span>
                        <h3 className="font-serif text-sm font-bold text-[#302829] leading-snug">
                          {item.label}
                        </h3>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#E9D3D0]/60">
                        <span className="text-[10px] font-bold text-[#9E6F6D] block">
                          {isSelected ? '✓ Selected' : 'Tap to Choose →'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Create Custom Occasion Card */}
                <div
                  onClick={() => setIsCustomOccasionModalOpen(true)}
                  className="p-5 rounded-3xl border-2 border-dashed border-[#D8B5B0] bg-[#FAF7F3]/60 hover:bg-[#F2E5E2]/80 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 hover:scale-[1.03]"
                >
                  <div className="w-12 h-12 rounded-full bg-[#F2E5E2] flex items-center justify-center text-xl text-[#9E6F6D] font-bold">
                    ➕
                  </div>
                  <h3 className="font-serif text-sm font-bold text-[#302829]">Create Custom</h3>
                  <p className="text-[10px] text-[#8C7E80]">Enter any unique celebration name</p>
                </div>
              </div>
            );
          })()}

          {/* Custom Occasion Modal */}
          {isCustomOccasionModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-md w-full p-6 text-[#302829] space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3">
                  <h3 className="font-serif text-lg font-bold">Create Custom Occasion</h3>
                  <button
                    type="button"
                    onClick={() => setIsCustomOccasionModalOpen(false)}
                    className="p-1 rounded-full hover:bg-[#F2E5E2] text-[#8C7E80]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCustomOccasion} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#302829]">
                      Occasion Name
                    </label>
                    <input
                      type="text"
                      value={customOccasionInput}
                      onChange={(e) => setCustomOccasionInput(e.target.value)}
                      placeholder="e.g. 50th Golden Milestone Jubilee Gala"
                      required
                      autoFocus
                      className="w-full p-3.5 rounded-2xl border border-[#E9D3D0] text-sm focus:outline-none focus:border-[#9E6F6D]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomOccasionModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E9D3D0] text-xs font-bold text-[#8C7E80] hover:bg-[#F2E5E2]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md"
                    >
                      Continue →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🌟 STEP 2: TELL US ABOUT YOUR EVENT 🌟 */}
      {step === 2 && (
        <div className="p-6 sm:p-10 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-6 shadow-sm">
          <div className="space-y-1 border-b border-[#E9D3D0] pb-4">
            <h2 className="font-serif text-2xl font-bold text-[#302829]">Event Details</h2>
            <p className="text-xs text-[#8C7E80]">Enter date, time, and venue information once. We automatically use it everywhere.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#302829] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#9E6F6D]" /> Who is celebrating? (Couple / Host Name)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rohit & Priya's Wedding"
                className="w-full p-3.5 rounded-2xl border border-[#E9D3D0] text-sm focus:outline-none focus:border-[#9E6F6D]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#302829] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#9E6F6D]" /> Host Family Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Gupta & Sharma Families"
                className="w-full p-3.5 rounded-2xl border border-[#E9D3D0] text-sm focus:outline-none focus:border-[#9E6F6D]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#302829] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#9E6F6D]" /> Select Date & Time
              </label>
              <VisualCalendarPicker
                selectedDateTime={startDate}
                onSelectDateTime={(val) => { setStartDate(val); setErrorMsg(null); }}
                onChange={(val) => { setStartDate(val); setErrorMsg(null); }}
                onDateSelect={(val) => { setStartDate(val); setErrorMsg(null); }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#302829] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#9E6F6D]" /> Celebration Venue Name
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. The Taj Hotel & Convention Centre"
                className="w-full p-3.5 rounded-2xl border border-[#E9D3D0] text-sm focus:outline-none focus:border-[#9E6F6D]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#302829]">
                Venue Address & Location
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="e.g. Vipul Khand, Gomti Nagar, Lucknow, Uttar Pradesh"
                className="w-full p-3.5 rounded-2xl border border-[#E9D3D0] text-sm focus:outline-none focus:border-[#9E6F6D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E9D3D0]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-2xl border border-[#E9D3D0] text-xs font-bold text-[#8C7E80] hover:bg-[#F2E5E2]"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                const activeDate = startDate || defaultInitialDate;
                setStartDate(activeDate);
                setErrorMsg(null);
                setStep(3);
              }}
              className="px-8 py-3.5 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <span>Continue to Choose Design</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 STEP 3: CHOOSE YOUR CELEBRATION DESIGN (IMAGE-FIRST & CELEBRATION-AWARE) 🌟 */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Bar with OCCASION SELECTOR DIRECTLY BESIDE PALETTE */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2E5E2] border border-[#D8B5B0] text-[#9E6F6D] text-[11px] font-mono font-extrabold uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9AA78]" /> Step 3 of 7 • Celebration Identity
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#302829]">
                  Choose Your Celebration Design
                </h2>
                <p className="text-xs text-[#8C7E80] mt-1 max-w-xl">
                  Pick a design that captures the feeling of your celebration. You can customize every detail later.
                </p>
              </div>

              {/* Direct Occasion Dropdown Selector beside Palette */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#FAF7F3] border border-[#D8B5B0]/70 shrink-0 shadow-inner">
                <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#9E6F6D] pl-2">
                  Occasion:
                </span>
                <select
                  value={eventType}
                  onChange={(e) => handleOccasionDropdownChange(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#D8B5B0] font-serif font-bold text-xs sm:text-sm text-[#302829] shadow-sm focus:outline-none focus:border-[#9E6F6D] cursor-pointer"
                >
                  {MASTER_OCCASION_CATALOGUE.map((occ) => (
                    <option key={occ.id} value={occ.id}>
                      {occ.icon} {occ.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Tags */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
              {THEME_FILTER_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setThemeFilterTag(tag.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    themeFilterTag === tag.id
                      ? 'bg-[#9E6F6D] text-white shadow-md'
                      : 'bg-[#FAF7F3] text-[#8C7E80] hover:bg-[#F2E5E2] hover:text-[#302829] border border-[#E9D3D0]'
                  }`}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image-First Celebration Design Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {getFilteredCelebrationThemes(themeFilterTag, eventType).map((themeItem) => {
              const isSelected = selectedThemeId === themeItem.id;
              const isOccasionMatch =
                themeItem.recommendedOccasions.includes((eventType || '').toUpperCase()) ||
                themeItem.celebrationType === (eventType || '').toUpperCase();

              return (
                <div
                  key={themeItem.id}
                  onClick={() => setSelectedThemeId(themeItem.id)}
                  className={`group rounded-3xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between p-5 space-y-4 hover:scale-[1.02] hover:shadow-2xl ${
                    isSelected
                      ? 'border-[#FFD700] ring-4 ring-[#9E6F6D]/30 shadow-2xl bg-slate-900 text-white'
                      : 'border-[#E9D3D0] bg-[#FFFDFC] text-[#302829] hover:border-[#9E6F6D]'
                  }`}
                >
                  {/* Top Metadata Header: Badge & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest flex items-center gap-1 border"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,215,0,0.15)' : themeItem.colorPalette.badgeBg,
                        color: isSelected ? '#FFD700' : themeItem.colorPalette.badgeText,
                        borderColor: isSelected ? 'rgba(255,215,0,0.4)' : themeItem.colorPalette.borderSoft,
                      }}
                    >
                      <span>{themeItem.badgeIcon}</span>
                      <span>{themeItem.badgeLabel}</span>
                    </span>

                    {isSelected ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md animate-in zoom-in-90">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    ) : isOccasionMatch ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" /> Best Match
                      </span>
                    ) : null}
                  </div>

                  {/* 1. Large 65-75% Visual Card Artwork Preview */}
                  <div className="h-56 sm:h-64 w-full rounded-2xl overflow-hidden shadow-inner relative group-hover:brightness-105 transition-all">
                    <ThemeArtworkCanvas
                      theme={themeItem}
                      title={title || 'Rohit & Priya'}
                      hindiTitle={hindiTitle}
                      dateStr={
                        startDate
                          ? new Date(startDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '18 Dec 2026'
                      }
                      venueName={venueName || 'The Taj Palace'}
                      className="h-full"
                    />

                    {/* Quick Preview Hover Overlay Action */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewThemeModalItem(themeItem);
                        }}
                        className="px-5 py-2.5 rounded-full bg-white/95 text-slate-900 font-serif font-extrabold text-xs flex items-center gap-1.5 shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <Eye className="w-4 h-4 text-[#9E6F6D]" />
                        <span>Live Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Design Name & Concise Description */}
                  <div className="space-y-1 text-left">
                    <h3 className="font-serif text-lg font-bold truncate">
                      {themeItem.name}
                    </h3>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-[#8C7E80]'}`}>
                      {themeItem.description}
                    </p>
                  </div>

                  {/* 3. Theme Tags / Metadata */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {themeItem.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                          isSelected
                            ? 'bg-black/50 text-amber-300 border-amber-400/30'
                            : 'bg-[#FAF7F3] text-slate-600 border-[#E9D3D0]'
                        }`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* 4. Action Buttons (Select + Preview) */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewThemeModalItem(themeItem);
                      }}
                      className={`py-2.5 px-2 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-black/60 text-amber-200 border-amber-400/40 hover:bg-black'
                          : 'bg-[#FAF7F3] text-slate-700 border-[#E9D3D0] hover:bg-[#F2E5E2]'
                      }`}
                      title="Inspect full live invitation"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedThemeId(themeItem.id);
                        setStep(4);
                      }}
                      className={`col-span-2 py-2.5 px-4 rounded-2xl font-serif font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#FFD700] text-black shadow-xl ring-2 ring-amber-400'
                          : 'bg-[#9E6F6D] text-white hover:bg-[#875B59]'
                      }`}
                    >
                      {isSelected ? '✓ SELECTED' : 'USE THIS DESIGN →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between p-6 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-2xl border border-[#E9D3D0] text-xs font-bold text-[#8C7E80] hover:bg-[#F2E5E2] transition-colors"
            >
              ← Back to Details
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-8 py-3.5 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105"
            >
              <span>Continue to Personalize</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 LIVE INVITATION PREVIEW MODAL IN STEP 3 🌟 */}
      {previewThemeModalItem && (
        <LiveInvitationPreviewModal
          isOpen={Boolean(previewThemeModalItem)}
          onClose={() => setPreviewThemeModalItem(null)}
          theme={previewThemeModalItem}
          title={title || 'Priyanka & Rohit'}
          hindiTitle={hindiTitle}
          invitationMessage={invitationMessage}
          startDate={startDate}
          venueName={venueName}
          venueAddress={venueAddress}
          hostName={hostName}
          onSelectTheme={(tId) => {
            setSelectedThemeId(tId);
            setStep(4);
          }}
          isSelected={selectedThemeId === previewThemeModalItem.id}
        />
      )}

      {/* 🌟 STEP 4: PERSONALIZE YOUR INVITATION 🌟 */}
      {step === 4 && (
        <div className="p-6 sm:p-10 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-8 shadow-sm">
          <div className="space-y-1 border-b border-[#E9D3D0] pb-4">
            <h2 className="font-serif text-2xl font-bold text-[#302829]">Make It Yours</h2>
            <p className="text-xs text-[#8C7E80]">Customize wording, sacred shlokas, story moments, and digital shagun options.</p>
          </div>

          {/* 1. Sacred Header Shloka */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#302829]">
              Sacred Hindi Header / Shloka
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['|| श्री गणेशाय नमः ||', '|| श्री राधेश्यामाभ्यां नमः ||', '|| ॐ नमः शिवाय ||'].map((shloka) => (
                <button
                  key={shloka}
                  type="button"
                  onClick={() => setHindiTitle(shloka)}
                  className={`p-3 rounded-2xl text-xs font-serif font-bold border transition-all ${
                    hindiTitle === shloka
                      ? 'bg-[#9E6F6D] text-white border-[#9E6F6D] shadow-sm'
                      : 'bg-[#FAF7F3] text-[#302829] border-[#E9D3D0] hover:border-[#9E6F6D]'
                  }`}
                >
                  {shloka}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Invitation Message & AI Generator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#302829]">
                Invitation Message
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={generatingAiWording}
                  onClick={() => handleGenerateAiWording('EMOTIONAL')}
                  className="px-3 py-1.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] text-xs font-bold border border-[#D8B5B0] flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Generate Message
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
              className="w-full p-4 rounded-2xl border border-[#E9D3D0] text-xs font-serif leading-relaxed focus:outline-none focus:border-[#9E6F6D]"
            />
          </div>

          {/* 3. Story Moments Studio */}
          <div className="space-y-4 pt-4 border-t border-[#E9D3D0]">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#302829]">Our Story Moments</h3>
              <p className="text-xs text-[#8C7E80]">Add special memories from your journey to display in the Storyline section.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={momentTitle}
                onChange={(e) => setMomentTitle(e.target.value)}
                placeholder="Moment Title (e.g. First Meeting)"
                className="p-3 rounded-2xl border border-[#E9D3D0] text-xs focus:outline-none focus:border-[#9E6F6D]"
              />
              <input
                type="text"
                value={momentDate}
                onChange={(e) => setMomentDate(e.target.value)}
                placeholder="Date (e.g. 12 March 2020)"
                className="p-3 rounded-2xl border border-[#E9D3D0] text-xs focus:outline-none focus:border-[#9E6F6D]"
              />
              <button
                type="button"
                onClick={handleAddStoryMoment}
                className="p-3 rounded-2xl bg-[#9E6F6D] text-white font-bold text-xs hover:bg-[#875B59] flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Story Moment
              </button>
            </div>

            {/* List of Added Moments */}
            <div className="space-y-2">
              {storyMoments.map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#302829]">{m.title}</span> • <span className="text-[#8C7E80] font-mono">{m.date}</span>
                  </div>
                  <button
                    onClick={() => setStoryMoments(storyMoments.filter((_, i) => i !== idx))}
                    className="text-rose-600 hover:text-rose-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Digital Shagun Settings */}
          <div className="space-y-4 pt-4 border-t border-[#E9D3D0]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302829]">Digital Shagun & Blessings</h3>
                <p className="text-xs text-[#8C7E80]">Would you like guests to send monetary blessings digitally via UPI or mobile?</p>
              </div>
              <button
                type="button"
                onClick={() => setAcceptsDigitalShagun(!acceptsDigitalShagun)}
                className={`px-4 py-2 rounded-2xl font-bold text-xs border transition-all ${
                  acceptsDigitalShagun
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {acceptsDigitalShagun ? '✓ YES, ENABLED' : 'NO, DISABLED'}
              </button>
            </div>

            {acceptsDigitalShagun && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0]">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#302829] uppercase">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. rohitpriya@upi"
                    className="w-full p-3 rounded-xl border border-[#E9D3D0] text-xs focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#302829] uppercase">UPI Mobile Number</label>
                  <input
                    type="text"
                    value={hostUpiMobile}
                    onChange={(e) => setHostUpiMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full p-3 rounded-xl border border-[#E9D3D0] text-xs focus:outline-none focus:border-[#9E6F6D]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E9D3D0]">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-3 rounded-2xl border border-[#E9D3D0] text-xs font-bold text-[#8C7E80] hover:bg-[#F2E5E2]"
            >
              ← Back to Design
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-8 py-3.5 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <span>Continue to Add Guests</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 STEP 5: ADD YOUR GUESTS 🌟 */}
      {step === 5 && (
        <div className="p-6 sm:p-10 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-6 shadow-sm">
          <div className="space-y-1 border-b border-[#E9D3D0] pb-4">
            <h2 className="font-serif text-2xl font-bold text-[#302829]">Who Would You Like to Invite?</h2>
            <p className="text-xs text-[#8C7E80]">Choose from your saved Master List, import phone contacts, or enter guest details manually.</p>
          </div>

          {/* 🌟 1. MASTER LIST & PHONE CONTACT IMPORT QUICK BAR 🌟 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFFDFC] via-[#FAF7F3] to-[#F2E5E2] border border-[#E9D3D0] shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-extrabold text-[#302829] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#9E6F6D]" /> Import From Saved Master List
                </h3>
                <p className="text-xs text-[#8C7E80]">1-tap select guests from your saved contacts directory or phone book</p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                <button
                  type="button"
                  onClick={fetchAndOpenMasterList}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#9E6F6D] text-white font-extrabold text-xs shadow-md hover:scale-105 transition-all flex items-center justify-center gap-2 border border-amber-300"
                >
                  <Users className="w-4 h-4 text-amber-300" />
                  <span>👥 CHOOSE FROM SAVED MASTER LIST</span>
                </button>
              </div>
            </div>
          </div>

          {/* Add Guest Form */}
          <form onSubmit={handleAddGuest} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0]">
            <input
              type="text"
              required
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              placeholder="Guest Name (e.g. Amit Sharma)"
              className="p-3 rounded-xl border border-[#E9D3D0] text-xs focus:outline-none focus:border-[#9E6F6D]"
            />
            <input
              type="text"
              value={newGuestPhone}
              onChange={(e) => setNewGuestPhone(e.target.value)}
              placeholder="Mobile Number (e.g. 9876543210)"
              className="p-3 rounded-xl border border-[#E9D3D0] text-xs focus:outline-none focus:border-[#9E6F6D]"
            />
            <select
              value={newGuestGroup}
              onChange={(e) => setNewGuestGroup(e.target.value)}
              className="p-3 rounded-xl border border-[#E9D3D0] text-xs bg-white focus:outline-none focus:border-[#9E6F6D]"
            >
              <option value="Family">Family</option>
              <option value="Friends">Friends</option>
              <option value="VIP">VIP</option>
              <option value="General">General</option>
            </select>
            <button
              type="submit"
              className="p-3 rounded-xl bg-[#9E6F6D] text-white font-bold text-xs hover:bg-[#875B59] flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Guest
            </button>
          </form>

          {/* Guest List Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#9E6F6D]">
              Guest List ({guestList.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guestList.map((g, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#FFFDFC] border border-[#E9D3D0] shadow-sm flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#302829] text-sm">{g.name}</div>
                    <div className="text-[#8C7E80] font-mono">📱 {g.phone || 'No Phone'} • <span className="text-[#9E6F6D]">{g.group}</span></div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px]">⚪ Ready to Send</span>
                  </div>
                  <button
                    onClick={() => setGuestList(guestList.filter((_, i) => i !== idx))}
                    className="text-rose-600 hover:text-rose-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E9D3D0]">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-3 rounded-2xl border border-[#E9D3D0] text-xs font-bold text-[#8C7E80] hover:bg-[#F2E5E2]"
            >
              ← Back to Personalize
            </button>
            <button
              type="button"
              onClick={() => setStep(6)}
              className="px-8 py-3.5 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <span>Continue to Preview & Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 STEP 6: PREVIEW & TEST INVITATION 🌟 */}
      {step === 6 && (
        <div className="p-6 sm:p-10 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E9D3D0] pb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#302829]">See How Your Invitation Will Look</h2>
              <p className="text-xs text-[#8C7E80]">Preview your 3D digital invitation exactly as your guests will see it on their phones.</p>
            </div>

            {/* Mobile / Desktop Toggle */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#F2E5E2] border border-[#D8B5B0]">
              <button
                type="button"
                onClick={() => setPreviewDevice('MOBILE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewDevice === 'MOBILE' ? 'bg-[#9E6F6D] text-white shadow-sm' : 'text-[#8C7E80]'
                }`}
              >
                <Smartphone className="w-4 h-4" /> Mobile View
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('DESKTOP')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewDevice === 'DESKTOP' ? 'bg-[#9E6F6D] text-white shadow-sm' : 'text-[#8C7E80]'
                }`}
              >
                <Eye className="w-4 h-4" /> Desktop View
              </button>
            </div>
          </div>

          {/* Test Invitation Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-serif font-semibold text-amber-900">Want to test on your phone first before sending to guests?</span>
            </div>
            <button
              type="button"
              onClick={handleSendTestInvitation}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap shadow-sm"
            >
              📱 Send Test Link to Myself
            </button>
          </div>

          {testSentNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center">
              {testSentNotice}
            </div>
          )}

          {/* 3D Invitation Preview Stage Box */}
          <div
            style={{
              backgroundColor: selectedThemeObj.colorPalette.canvasBg,
              borderColor: selectedThemeObj.colorPalette.borderAccent,
              boxShadow: `0 25px 60px -15px ${selectedThemeObj.colorPalette.primary}80`,
            }}
            className={`mx-auto p-6 sm:p-10 rounded-[36px] border-2 text-white text-center space-y-4 shadow-2xl transition-all ${
              previewDevice === 'MOBILE' ? 'max-w-sm' : 'max-w-3xl'
            }`}
          >
            <span className="text-amber-300 text-xs font-serif tracking-widest block">{hindiTitle}</span>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-300/40 inline-block">
              {eventType} INVITATION
            </span>
            <h2 className="font-serif text-3xl font-bold drop-shadow-md">{title}</h2>
            <p className="text-xs font-serif italic text-amber-100 opacity-90">"{invitationMessage}"</p>
            <div className="py-2 text-xs font-mono text-amber-200">
              🗓️ {startDate ? new Date(startDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '18 December 2026'}
            </div>
            <div className="text-xs font-mono text-slate-300">📍 {venueName} • {venueAddress}</div>
            
            <div className="pt-2 flex items-center justify-center gap-2 text-xs">
              <span className="px-4 py-2 rounded-2xl bg-[#7E223B] border border-amber-300 text-white font-bold shadow-md">
                ❤️ RSVP NOW
              </span>
              <span className="px-4 py-2 rounded-2xl bg-purple-900 border border-amber-300 text-amber-200 font-bold shadow-md">
                🎁 DIGITAL SHAGUN
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E9D3D0]">
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-6 py-3 rounded-2xl border border-[#E9D3D0] text-xs font-bold text-[#8C7E80] hover:bg-[#F2E5E2]"
            >
              ← Edit Personal Details
            </button>
            <button
              type="button"
              onClick={() => setStep(7)}
              className="px-8 py-3.5 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <span>Looks Great — Continue to Publish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 STEP 7: PUBLISH & SHARE WITH GUESTS 🌟 */}
      {step === 7 && (
        <div className="p-6 sm:p-10 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-8 shadow-sm">
          <div className="text-center space-y-2 border-b border-[#E9D3D0] pb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-700 flex items-center justify-center mx-auto text-2xl shadow-lg">
              🎉
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#302829]">Your Invitation is Ready!</h2>
            <p className="text-xs text-[#8C7E80]">Review your summary and publish to share your personalized invitation link with guests.</p>
          </div>

          {/* Checklist Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#302829] block">Event Details Complete</span>
                <span className="text-[#8C7E80]">{title} • {venueName}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#302829] block">3D Design Selected</span>
                <span className="text-[#8C7E80]">{selectedThemeObj.name}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#302829] block">Story & Personal Message</span>
                <span className="text-[#8C7E80]">{storyMoments.length} Story Moments added</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#302829] block">Guest List Prepared</span>
                <span className="text-[#8C7E80]">{guestList.length} Guests ready to receive invites</span>
              </div>
            </div>
          </div>

          {/* Big Publish CTA */}
          <div className="pt-4 text-center space-y-4">
            <button
              type="button"
              disabled={loading}
              onClick={handlePublishInvitation}
              className="w-full sm:w-auto px-12 py-5 rounded-full bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#63182C] text-white font-extrabold text-base shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto border-2 border-amber-300"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <span>🚀 PUBLISH & SHARE INVITATION</span>
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            </button>
            <p className="text-[11px] font-mono text-[#8C7E80]">
              Publishing makes your invitation link live and opens instant WhatsApp share controls.
            </p>
          </div>
        </div>
      )}

      {/* 🌟 STEP 8: 🎉 YOUR INVITATION IS LIVE! (POST-PUBLISH CONFIRMATION SCREEN) 🌟 */}
      {step === 8 && (
        <div className="p-6 sm:p-12 rounded-3xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-8 shadow-2xl text-center">
          <div className="space-y-3 border-b border-[#E9D3D0] pb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-300 text-white flex items-center justify-center mx-auto text-3xl shadow-xl animate-bounce">
              🎉
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#302829]">
              YOUR INVITATION IS LIVE!
            </h2>
            <p className="text-xs sm:text-sm text-[#8C7E80] font-serif italic max-w-md mx-auto">
              "Your invitation is ready to be shared with your guests."
            </p>
          </div>

          {/* Confirmation Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">Invitation Published ✓</span>
                <span className="text-emerald-700">Live on public web</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">Unique Link Created ✓</span>
                <span className="text-emerald-700">Ready for WhatsApp</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">Guest Experience Active ✓</span>
                <span className="text-emerald-700">3D Card & RSVP ready</span>
              </div>
            </div>
          </div>

          {/* 🌟 1-TAP INVITATION SHARING CONTROLS 🌟 */}
          <div className="space-y-5 pt-2">
            {/* Primary Multi-Channel Broadcast Action Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-white shadow-xl max-w-2xl mx-auto border border-emerald-500/40 text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-200">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-extrabold text-white">
                Broadcast Invitations to All Guests
              </h3>
              <p className="text-xs text-emerald-100/80 max-w-md mx-auto">
                Automatically dispatch personalized invitations, RSVP links, and QR passes across WhatsApp, SMS, and Email.
              </p>
              <button
                type="button"
                onClick={() => setIsBroadcastWizardOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs shadow-lg transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
              >
                <span>OPEN BROADCAST WIZARD</span>
                <ArrowRight className="w-4 h-4 text-emerald-800" />
              </button>
            </div>

            <div className="text-xs font-mono uppercase font-bold tracking-widest text-[#9E6F6D] text-center pt-2">
              ✦ Or Share Instantly via Individual Channels ✦
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={() => {
                  setShareDefaultChannel('whatsapp');
                  setIsShareModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <span className="text-xl">📱</span>
                <span>WhatsApp</span>
              </button>

              {/* SMS Button */}
              <button
                type="button"
                onClick={() => {
                  setShareDefaultChannel('sms');
                  setIsShareModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <span className="text-xl">💬</span>
                <span>SMS / Text</span>
              </button>

              {/* Gmail Button */}
              <button
                type="button"
                onClick={() => {
                  setShareDefaultChannel('gmail');
                  setIsShareModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <span className="text-xl">📧</span>
                <span>Gmail</span>
              </button>

              {/* Copy Link Button */}
              <button
                type="button"
                onClick={async () => {
                  if (publishedEventId) {
                    await copyInvitationLink({
                      event: { id: publishedEventId, title: title },
                    });
                    setCopiedStep8Link(true);
                    setTimeout(() => setCopiedStep8Link(false), 3000);
                  }
                }}
                className="p-3.5 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                {copiedStep8Link ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                <span>{copiedStep8Link ? 'Copied ✓' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Secondary Navigation Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#E9D3D0]">
              {publishedEventId && (
                <Link
                  to={`/i/${publishedEventId}`}
                  target="_blank"
                  className="px-6 py-3 rounded-2xl bg-[#FFFDFC] hover:bg-[#F2E5E2] text-[#9E6F6D] border border-[#D8B5B0] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4 text-[#9E6F6D]" /> View Live Invitation
                </Link>
              )}

              <Link
                to={publishedEventId ? `/events/${publishedEventId}` : '/dashboard'}
                className="px-6 py-3 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" /> Manage Guests & RSVPs
              </Link>

              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-2xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#8C7E80] border border-[#E9D3D0] font-bold text-xs transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Universal Share Invitation Modal */}
      {publishedEventId && (
        <ShareInvitationModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          event={{
            id: publishedEventId,
            title: title,
            host_name: hostName,
            start_date: startDate,
            venue_name: venueName,
          }}
          defaultChannel={shareDefaultChannel}
        />
      )}

      {/* Multi-Channel Broadcast Wizard Modal */}
      {publishedEventId && (
        <BroadcastWizardModal
          isOpen={isBroadcastWizardOpen}
          onClose={() => setIsBroadcastWizardOpen(false)}
          eventId={publishedEventId}
          eventTitle={title}
          hostName={hostName}
          guests={guestList}
          onCampaignCreated={(campaignId) => {
            navigate(`/events/${publishedEventId}?tab=campaigns`);
          }}
        />
      )}

      {/* AI Voice Concierge Modal */}
      <VoiceChatAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* 🌟 SAVED MASTER CONTACTS PICKER MODAL IN WIZARD 🌟 */}
      {isMasterListOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-xl w-full p-6 text-[#302829] space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col justify-between">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#F2E5E2] text-[#9E6F6D] border border-[#D8B5B0]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-extrabold text-[#302829]">Choose Saved Guests</h3>
                  <p className="text-xs text-[#8C7E80]">Select contacts from your saved Master Directory</p>
                </div>
              </div>
              <button onClick={() => setIsMasterListOpen(false)} className="p-1.5 rounded-full hover:bg-[#F2E5E2] text-[#8C7E80] hover:text-[#302829]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C7E80] absolute left-3.5 top-3" />
              <input
                type="text"
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                placeholder="Search by contact name, group, or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E9D3D0] text-xs focus:outline-none focus:border-[#9E6F6D] bg-[#FAF7F3]"
              />
            </div>

            {/* Select All Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-xs">
              <button
                type="button"
                onClick={() => {
                  if (selectedMasterIds.size === filteredMasterContacts.length) {
                    setSelectedMasterIds(new Set());
                  } else {
                    setSelectedMasterIds(new Set(filteredMasterContacts.map((c) => c.id)));
                  }
                }}
                className="flex items-center gap-2 font-bold text-[#9E6F6D]"
              >
                {selectedMasterIds.size === filteredMasterContacts.length && filteredMasterContacts.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-[#9E6F6D]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8C7E80]" />
                )}
                Select All ({filteredMasterContacts.length})
              </button>
              <span className="text-[#8C7E80] font-mono text-[11px]">
                {selectedMasterIds.size} Selected
              </span>
            </div>

            {/* Contacts List */}
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-60 custom-scrollbar">
              {loadingMaster ? (
                <div className="p-8 text-center text-[#8C7E80] text-xs">Loading Saved Master Directory...</div>
              ) : filteredMasterContacts.length === 0 ? (
                <div className="p-8 text-center text-[#8C7E80] text-xs">
                  No contacts found in Master List. Add contacts in <strong>My Saved Contacts</strong> tab!
                </div>
              ) : (
                filteredMasterContacts.map((c) => {
                  const isSelected = selectedMasterIds.has(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        const next = new Set(selectedMasterIds);
                        if (next.has(c.id)) next.delete(c.id);
                        else next.add(c.id);
                        setSelectedMasterIds(next);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#F2E5E2] border-[#9E6F6D] text-[#302829] font-bold shadow-sm'
                          : 'bg-[#FFFDFC] border-[#E9D3D0] text-[#51484A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-[#D8B5B0] accent-[#9E6F6D]"
                        />
                        <div>
                          <div className="font-bold text-xs flex items-center gap-2 text-[#302829]">
                            {c.name}
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF7F3] text-[#9E6F6D] border border-[#E9D3D0] text-[9px] font-mono">
                              {c.group_name || 'General'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8C7E80] font-mono mt-0.5">
                            📱 {c.phone || 'No Phone'} {c.relationship ? `• ${c.relationship}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E9D3D0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMasterListOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#302829] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSelectedMasterContactsToWizard}
                disabled={selectedMasterIds.size === 0}
                className="px-6 py-2.5 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Add {selectedMasterIds.size} Selected Guests</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
