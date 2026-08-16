import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  CheckCircle2,
  X,
  Users,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Volume2,
  VolumeX,
  ShieldCheck,
  Check,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  UserCheck,
  Building,
  MapPin,
  Clock,
  History,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { VisualCalendarPicker } from './VisualCalendarPicker';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface SavedHistoryItem {
  id: string;
  timestamp: string;
  title: string;
  messages: Message[];
  summary: string;
}

interface VoiceChatAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceChatAssistantModal: React.FC<VoiceChatAssistantModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSavedPicker, setShowSavedPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [savedHistory, setSavedHistory] = useState<SavedHistoryItem[]>([]);

  const threadIdRef = useRef<string>('thread_' + Date.now());

  const INITIAL_GREETING: Message[] = [
    {
      sender: 'ai',
      text: 'नमस्ते जी! 🙏 निमंत्रण AI में आपका हार्दिक स्वागत है। आपके घर में कौन सा शुभ उत्सव होने जा रहा है? मुझे सेलिब्रेंट का नाम, तारीख, समय और वेन्यू बताने की कृपा करें!',
    },
  ];

  const [messages, setMessages] = useState<Message[]>(INITIAL_GREETING);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [memory, setMemory] = useState<any>({});
  
  // Modal Workflow Phases: SLOT_FILLING -> AWAITING_APPROVAL -> EVENT_CREATED -> GUEST_VERIFICATION -> DISPATCHED
  const [phase, setPhase] = useState<'SLOT_FILLING' | 'AWAITING_APPROVAL' | 'EVENT_CREATED' | 'GUEST_VERIFICATION' | 'DISPATCHED'>('SLOT_FILLING');
  
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  const [masterContacts, setMasterContacts] = useState<any[]>([]);
  const [loadedGuests, setLoadedGuests] = useState<any[]>([]);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, phase, loadedGuests]);

  // CRITICAL REQUIREMENT: Reset chat screen completely whenever modal opens so it is empty & ready for a new conversation!
  useEffect(() => {
    if (isOpen) {
      resetChatSession();
      loadHistoryFromStorage();
      apiFetch<any[]>('/master-contacts')
        .then((res) => setMasterContacts(res.data || []))
        .catch(() => setMasterContacts([]));
    }
  }, [isOpen]);

  const loadHistoryFromStorage = () => {
    try {
      const stored = localStorage.getItem('nimantran_ai_chat_history');
      if (stored) {
        setSavedHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Error reading chat history:', err);
    }
  };

  const resetChatSession = () => {
    threadIdRef.current = 'thread_' + Date.now();
    setMessages([
      {
        sender: 'ai',
        text: 'नमस्ते जी! 🙏 निमंत्रण AI में आपका हार्दिक स्वागत है। आपके घर में कौन सा शुभ उत्सव होने जा रहा है? मुझे सेलिब्रेंट का नाम, तारीख, समय और वेन्यू बताने की कृपा करें!',
      },
    ]);
    setInputText('');
    setMemory({});
    setPhase('SLOT_FILLING');
    setCreatedEvent(null);
    setLoadedGuests([]);
    setEditingGuestId(null);
    setNewGuestName('');
    setNewGuestPhone('');
    setShowCalendar(false);
    setShowHistoryModal(false);
  };

  // CRITICAL REQUIREMENT: Save current conversation to history on close, then clear chatbot screen completely
  const handleCloseAndSaveHistory = () => {
    if (messages.length > 1) {
      try {
        const stored = JSON.parse(localStorage.getItem('nimantran_ai_chat_history') || '[]');
        const newItem: SavedHistoryItem = {
          id: threadIdRef.current,
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          title: memory?.title || 'Celebration Planning Session',
          messages: messages,
          summary: memory?.date ? `${memory.title || 'Event'} on ${memory.date} at ${memory.venue || 'Venue'}` : 'Consultation Session',
        };
        const updatedHistory = [newItem, ...stored.filter((h: any) => h.id !== newItem.id)].slice(0, 30);
        localStorage.setItem('nimantran_ai_chat_history', JSON.stringify(updatedHistory));
      } catch (err) {
        console.warn('Error saving chat history:', err);
      }
    }

    resetChatSession();
    onClose();
  };

  // Speech Recognition Setup - Configured for Hindi Devanagari (hi-IN) and English (en-IN)
  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInputText(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition init fallback:', err);
      }
    }
  }, [isOpen]);

  // Speech synthesis TTS helper - Strips emojis/smilies, prioritizes Indian Female/Lady voice, and sets gentle pace
  const speakAiResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    if (isMuted) return;
    
    // Strip ALL emojis, smilies, bullet points and symbols so they are NEVER spoken as words
    const cleanText = text
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[*#•🙏🌸🎉💍👑🤖🎙️💌💡✨📊⚡])/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const isDevanagari = /[\u0900-\u097F]/.test(text);
    const isPureEnglish = /^[A-Za-z0-9\s\,\.\?\!\:\-\(\)\'\"]+$/.test(text);

    const isFemaleVoice = (name: string) => {
      const lower = name.toLowerCase();
      return (
        lower.includes('female') ||
        lower.includes('lady') ||
        lower.includes('woman') ||
        lower.includes('swara') ||
        lower.includes('kalpana') ||
        lower.includes('komal') ||
        lower.includes('veena') ||
        lower.includes('zira') ||
        lower.includes('heera') ||
        lower.includes('geeta') ||
        lower.includes('neerja') ||
        lower.includes('aditi') ||
        lower.includes('हिन्दी')
      );
    };

    let targetVoice: SpeechSynthesisVoice | undefined;

    if (isDevanagari) {
      targetVoice =
        voices.find((v) => (v.lang.includes('hi-IN') || v.lang === 'hi') && isFemaleVoice(v.name)) ||
        voices.find((v) => v.lang.includes('hi-IN') || v.lang === 'hi' || v.name.includes('Hindi') || v.name.includes('हिन्दी'));
      utterance.lang = 'hi-IN';
    } else if (isPureEnglish) {
      targetVoice =
        voices.find((v) => v.lang.includes('en-IN') && isFemaleVoice(v.name)) ||
        voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India')) ||
        voices.find((v) => v.lang.startsWith('en') && isFemaleVoice(v.name));
      utterance.lang = 'en-IN';
    } else {
      targetVoice =
        voices.find((v) => (v.lang.includes('en-IN') || v.lang.includes('hi-IN')) && isFemaleVoice(v.name)) ||
        voices.find((v) => v.lang.includes('en-IN') || v.lang.includes('hi-IN') || v.name.includes('India'));
      utterance.lang = 'en-IN';
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    // Normal fluent Indian pace (rate = 0.95) with sweet, polite professional receptionist pitch (pitch = 1.15)
    utterance.rate = 0.95;
    utterance.pitch = 1.15;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      const sampleText = '२५ दिसंबर को मेरी बेटी प्रियंका की शादी रोहित से है ताज होटल में शाम ७ बजे';
      setInputText(sampleText);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      recognitionRef.current.lang = 'hi-IN';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = (customMessage || inputText).trim();
    if (!textToSend || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setInputText('');
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await apiFetch<any>('/events/ai-converse-langgraph', {
        method: 'POST',
        body: JSON.stringify({
          thread_id: threadIdRef.current,
          user_message: textToSend,
        }),
      });

      const data = res.data || {};
      const updatedMem = {
        event_type: data.event_type || memory.event_type,
        title: data.title || memory.title,
        date: data.date || memory.date,
        time: data.time || memory.time,
        venue: data.venue || memory.venue,
      };
      setMemory(updatedMem);

      const aiReply = data.ai_response_text || 'Samajh gaya! Kripya details dijiye.';
      setMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
      speakAiResponse(aiReply);

      if (data.is_complete && phase === 'SLOT_FILLING') {
        setPhase('AWAITING_APPROVAL');
        const approvalPrompt =
          data.detected_language === 'HINDI_DEVANAGARI'
            ? 'बहुत-बहुत बधाई हो जी! 🙏 आपके शुभ अवसर की सभी जानकारियाँ आदरपूर्वक दर्ज कर ली गई हैं। कृपया नीचे दी गई जानकारी का अवलोकन करके स्वीकृति प्रदान करें।'
            : 'Heartiest Congratulations! 🙏 All details for your celebration have been respectfully recorded. Please review the details below and grant your approval.';
        setMessages((prev) => [...prev, { sender: 'ai', text: approvalPrompt }]);
        speakAiResponse(approvalPrompt);
      }
    } catch (err: any) {
      console.error('LangGraph conversation error:', err);
      const isDevanagari = /[\u0900-\u097F]/.test(textToSend);
      const fallbackReply = isDevanagari
        ? 'धन्यवाद जी! 🙏 आपकी सेलिब्रेशन डिटेल्स आदरपूर्वक दर्ज कर ली गई हैं।'
        : 'Thank you Ji! 🙏 Your celebration details have been respectfully recorded.';
      setMessages((prev) => [...prev, { sender: 'ai', text: fallbackReply }]);
    } finally {
      setLoading(false);
    }
  };

  // User Approved Event Creation
  const handleApproveAndCreateEvent = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/events', {
        method: 'POST',
        body: JSON.stringify({
          title: memory.title || "Priyanka & Rohit's Wedding Celebration",
          event_type: memory.event_type || 'WEDDING',
          host_name: memory.suggested_host || 'Gupta & Sharma Families',
          start_date: memory.date ? new Date(memory.date).toISOString() : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          venue_name: memory.venue || 'The Taj Hotel & Convention Centre',
          venue_address: 'Main Ring Road, Lucknow',
          description: `Conversational AI Approved Event: ${memory.title}`,
        }),
      });

      const evt = res.data;
      setCreatedEvent(evt);
      setPhase('EVENT_CREATED');

      const successMsg = `🎉 Badhai ho! Event "${evt.title}" safalta purvak create ho gaya hai. Ab kripya Master Contacts se Guests select karke verify karein!`;
      setMessages((prev) => [...prev, { sender: 'ai', text: successMsg }]);
      speakAiResponse(successMsg);
    } catch (err: any) {
      console.error('Create event error:', err);
      alert(err.message || 'Failed to create celebration event');
    } finally {
      setLoading(false);
    }
  };

  // Load & Show Guest List Options for User Verification & Editing
  const handleLoadMasterGroupForVerification = (groupType: 'ALL' | 'FAMILY' | 'FRIENDS') => {
    const selected =
      groupType === 'FAMILY'
        ? masterContacts.filter((c) => c.relationship === 'Family' || c.relationship === 'VIP')
        : groupType === 'FRIENDS'
        ? masterContacts.filter((c) => c.relationship === 'Friends' || c.relationship === 'General')
        : masterContacts;

    const guestsToVerify = (selected.length > 0 ? selected : masterContacts).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      relationship: c.relationship || 'Guest',
      group_name: c.group_name || 'General',
      selected: true,
    }));

    setLoadedGuests(guestsToVerify);
    setPhase('GUEST_VERIFICATION');

    const verifyMsg = `📋 ${guestsToVerify.length} Guests load ho gaye hain! Kripya Guest List verify karein aur zaroorat padne par edit karein.`;
    setMessages((prev) => [...prev, { sender: 'ai', text: verifyMsg }]);
    speakAiResponse(verifyMsg);
  };

  const handleToggleGuestSelect = (id: string) => {
    setLoadedGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, selected: !g.selected } : g))
    );
  };

  const handleUpdateGuestDetail = (id: string, field: 'name' | 'phone', val: string) => {
    setLoadedGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: val } : g))
    );
  };

  const handleRemoveGuest = (id: string) => {
    setLoadedGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const handleAddNewGuestToVerificationList = () => {
    if (!newGuestName.trim()) return;
    const newGuestObj = {
      id: 'temp_' + Date.now(),
      name: newGuestName.trim(),
      phone: newGuestPhone.trim(),
      relationship: 'Guest',
      group_name: 'General',
      selected: true,
    };
    setLoadedGuests((prev) => [...prev, newGuestObj]);
    setNewGuestName('');
    setNewGuestPhone('');
  };

  const handleAddSavedContactToVerification = (contact: any) => {
    const exists = loadedGuests.some((g) => g.id === contact.id || g.name.toLowerCase() === contact.name.toLowerCase());
    if (exists) return;

    const newGuestObj = {
      id: contact.id || 'saved_' + Date.now(),
      name: contact.name,
      phone: contact.phone || '',
      relationship: contact.relationship || 'Guest',
      group_name: contact.group_name || 'General',
      selected: true,
    };
    setLoadedGuests((prev) => [...prev, newGuestObj]);
  };

  const handleAddAllUnaddedSavedContacts = () => {
    const unadded = masterContacts.filter(
      (c) => !loadedGuests.some((g) => g.id === c.id || g.name.toLowerCase() === c.name.toLowerCase())
    );
    const newGuests = unadded.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      relationship: c.relationship || 'Guest',
      group_name: c.group_name || 'General',
      selected: true,
    }));
    setLoadedGuests((prev) => [...prev, ...newGuests]);
    setShowSavedPicker(false);
  };

  // Confirm Verified Guests & Dispatch WhatsApp Invitations
  const handleConfirmAndDispatchWhatsapp = async () => {
    if (!createdEvent) return;
    const activeGuests = loadedGuests.filter((g) => g.selected);
    if (activeGuests.length === 0) {
      alert('Please select at least one guest to invite.');
      return;
    }

    setDispatching(true);
    try {
      for (const g of activeGuests) {
        await apiFetch(`/events/${createdEvent.id}/guests`, {
          method: 'POST',
          body: JSON.stringify({
            name: g.name,
            phone: g.phone,
            relationship: g.relationship,
            group_name: g.group_name,
          }),
        });
      }

      await apiFetch(`/events/${createdEvent.id}/dispatch-all-whatsapp`, { method: 'POST' });
      setPhase('DISPATCHED');

      const dispatchMsg = `🚀 Badhai ho! ${activeGuests.length} verified guests ko personalized WhatsApp invitation cards dispatch kar diye gaye hain!`;
      setMessages((prev) => [...prev, { sender: 'ai', text: dispatchMsg }]);
      speakAiResponse(dispatchMsg);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch WhatsApp cards');
    } finally {
      setDispatching(false);
    }
  };

  if (!isOpen) return null;

  const filledSlotCount = ['event_type', 'title', 'date', 'time', 'venue'].filter((k) => memory && memory[k]).length;
  const pct = Math.round((filledSlotCount / 5) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-4xl w-full max-h-[95vh] h-[88vh] flex flex-col justify-between p-5 sm:p-7 text-[#302829] shadow-2xl relative my-auto">
        
        {/* Header bar with Back, History, and Close buttons */}
        <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3">
          <button
            type="button"
            onClick={handleCloseAndSaveHistory}
            className="px-3.5 py-1.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#302829] border border-[#D8B5B0] font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <ArrowRight className="w-4 h-4 text-[#9E6F6D] rotate-180" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 text-center">
            <Sparkles className="w-4 h-4 text-[#C9AA78] animate-spin" />
            <h3 className="font-serif text-base font-bold gold-gradient-text">🎙️ NIMANTRAN AI Concierge</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isMuted) {
                  window.speechSynthesis.cancel();
                }
                setIsMuted(!isMuted);
              }}
              className={`p-1.5 rounded-xl border transition-colors flex items-center gap-1 text-xs font-bold px-2.5 ${
                isMuted
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-[#FAF7F3] text-[#9E6F6D] border-[#E9D3D0] hover:bg-[#F2E5E2]'
              }`}
              title={isMuted ? 'Voice Narration is Muted (Click to Unmute)' : 'Voice Narration is ON (Click to Mute)'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-600" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#9E6F6D]" />
                  <span className="hidden sm:inline">Voice ON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowHistoryModal(!showHistoryModal)}
              className="p-1.5 rounded-xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#9E6F6D] border border-[#E9D3D0] transition-colors flex items-center gap-1 text-xs font-bold px-2.5"
              title="View Chat History"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            <button
              type="button"
              onClick={handleCloseAndSaveHistory}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-[#8C7E80] hover:text-[#302829] transition-colors"
              title="Close Popup & Save History"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SAVED CHAT HISTORY MODAL OVERLAY */}
        {showHistoryModal && (
          <div className="p-4 rounded-2xl bg-[#FFFDFC] border border-[#C9AA78] space-y-3 my-2 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-2">
              <span className="text-xs font-serif font-bold text-[#302829] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#C9AA78]" /> Saved Consultation Sessions History
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-xs font-bold text-[#9E6F6D] hover:underline"
              >
                Close History
              </button>
            </div>

            {savedHistory.length === 0 ? (
              <p className="text-xs text-[#8C7E80] italic py-3 text-center">No past conversation history saved yet.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                {savedHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setMessages(item.messages);
                      setShowHistoryModal(false);
                    }}
                    className="p-3 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] hover:border-[#9E6F6D] cursor-pointer text-xs space-y-1 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#302829]">{item.title}</span>
                      <span className="text-[10px] font-mono text-[#8C7E80]">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#51484A] truncate">{item.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Memory Tracker Bar */}
        <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] space-y-2.5 my-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold flex items-center gap-1 text-[#9E6F6D]">🧠 Celebration Memory Tracker</span>
            <span className="font-bold text-[#302829]">{pct}% Complete ({filledSlotCount}/5 Slots)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] font-mono">
            <div className={`p-2 rounded-xl border text-center ${memory?.event_type ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-extrabold' : 'border-[#E9D3D0] bg-[#FFFDFC] text-[#8C7E80]'}`}>
              💍 {memory?.event_type || 'Category'}
            </div>
            <div className={`p-2 rounded-xl border text-center truncate ${memory?.title ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-extrabold' : 'border-[#E9D3D0] bg-[#FFFDFC] text-[#8C7E80]'}`}>
              ❤️ {memory?.title || 'Names'}
            </div>
            <div className={`p-2 rounded-xl border text-center ${memory?.date ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-extrabold' : 'border-[#E9D3D0] bg-[#FFFDFC] text-[#8C7E80]'}`}>
              📅 {memory?.date || 'Date'}
            </div>
            <div className={`p-2 rounded-xl border text-center ${memory?.time ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-extrabold' : 'border-[#E9D3D0] bg-[#FFFDFC] text-[#8C7E80]'}`}>
              ⏰ {memory?.time || 'Time'}
            </div>
            <div className={`p-2 rounded-xl border text-center truncate ${memory?.venue ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-extrabold' : 'border-[#E9D3D0] bg-[#FFFDFC] text-[#8C7E80]'}`}>
              📍 {memory?.venue || 'Venue'}
            </div>
          </div>
        </div>

        {/* Chat Messages Container - Expanded to comfortably fit 3-4 messages simultaneously */}
        <div className="flex-1 overflow-y-auto my-2 p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] space-y-4 min-h-[380px] max-h-[550px] h-full">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] p-4 rounded-2xl text-sm sm:text-base font-bold leading-relaxed space-y-1.5 shadow-md ${
                  m.sender === 'user'
                    ? 'bg-[#875B59] text-white rounded-br-none border border-[#6E4745]'
                    : 'bg-[#FAF2E8] border-2 border-[#D8B5B0] text-[#211B1C] rounded-bl-none font-serif'
                }`}
              >
                {m.sender === 'ai' ? (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#9E6F6D] font-extrabold uppercase mb-1.5 border-b border-[#E9D3D0]/60 pb-1">
                    <Sparkles className="w-4 h-4 text-[#C9AA78]" /> NIMANTRAN AI Concierge
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-rose-100 font-extrabold uppercase mb-1.5 border-b border-white/20 pb-1">
                    👤 You (Host)
                  </div>
                )}
                <p className="whitespace-pre-wrap font-bold text-sm sm:text-base">{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* EVENT DETAILS APPROVAL CARD */}
        {phase === 'AWAITING_APPROVAL' && (
          <div className="p-4 rounded-2xl bg-[#F2E5E2] border border-[#D8B5B0] space-y-3 my-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-[#302829] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#9E6F6D]" /> Celebration Summary Review & Approval
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#9E6F6D] text-white px-2 py-0.5 rounded-full">
                READY FOR APPROVAL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-[#FFFDFC] p-3 rounded-xl border border-[#E9D3D0]">
              <div>
                <span className="text-[10px] text-[#8C7E80] font-mono uppercase block">Celebration Title</span>
                <span className="font-bold text-[#302829]">{memory.title || 'Wedding Celebration'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C7E80] font-mono uppercase block">Occasion Type</span>
                <span className="font-bold text-[#9E6F6D]">{memory.event_type || 'WEDDING'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C7E80] font-mono uppercase block">Event Date</span>
                <span className="font-bold text-[#302829]">{memory.date || '25 December 2026'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C7E80] font-mono uppercase block">Event Time</span>
                <span className="font-bold text-[#302829]">{memory.time || '7:00 PM'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-[#8C7E80] font-mono uppercase block">Venue Location</span>
                <span className="font-bold text-[#302829]">{memory.venue || 'The Taj Hotel & Convention Centre'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPhase('SLOT_FILLING')}
                className="px-4 py-2 rounded-xl bg-[#FFFDFC] text-[#51484A] font-bold text-xs border border-[#E9D3D0] hover:bg-[#FAF7F3]"
              >
                ✏️ Edit Details
              </button>
              <button
                type="button"
                onClick={handleApproveAndCreateEvent}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-white" />
                {loading ? 'Creating Celebration...' : '✨ Approve & Create Celebration'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOAD MASTER GUEST LIST */}
        {phase === 'EVENT_CREATED' && (
          <div className="p-3.5 rounded-2xl bg-[#F2E5E2] border border-[#D8B5B0] space-y-2 text-center my-1">
            <span className="text-xs font-bold text-[#302829] block">👥 Step 2: Load Guests from Master Contacts for Verification</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleLoadMasterGroupForVerification('FAMILY')}
                className="py-2.5 px-2 rounded-xl bg-[#9E6F6D] text-white font-bold text-xs shadow-sm hover:bg-[#875B59]"
              >
                ⭐ Load Family ({masterContacts.filter((c) => c.relationship === 'Family').length || 6})
              </button>
              <button
                onClick={() => handleLoadMasterGroupForVerification('FRIENDS')}
                className="py-2.5 px-2 rounded-xl bg-[#9E6F6D] text-white font-bold text-xs shadow-sm hover:bg-[#875B59]"
              >
                ⭐ Load Friends ({masterContacts.filter((c) => c.relationship === 'Friends').length || 8})
              </button>
              <button
                onClick={() => handleLoadMasterGroupForVerification('ALL')}
                className="py-2.5 px-2 rounded-xl bg-[#302829] text-white font-bold text-xs shadow-sm hover:bg-black"
              >
                ⭐ Load All ({masterContacts.length || 14})
              </button>
            </div>
          </div>
        )}

        {/* GUEST LIST VERIFICATION & EDITING CARD */}
        {phase === 'GUEST_VERIFICATION' && (
          <div className="p-4 rounded-2xl bg-[#FFFDFC] border border-[#E9D3D0] space-y-3 my-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-2">
              <span className="text-xs font-serif font-bold text-[#302829] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#9E6F6D]" /> Guest List Reverification & Edit Panel
              </span>
              <span className="text-[10px] font-mono text-[#9E6F6D] font-bold">
                {loadedGuests.filter((g) => g.selected).length} / {loadedGuests.length} Guests Selected
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {loadedGuests.map((g) => (
                <div
                  key={g.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                    g.selected ? 'bg-[#FAF7F3] border-[#9E6F6D]/40' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-grow min-w-0">
                    <input
                      type="checkbox"
                      checked={g.selected}
                      onChange={() => handleToggleGuestSelect(g.id)}
                      className="w-4 h-4 rounded border-[#D8B5B0] accent-[#9E6F6D] cursor-pointer"
                    />

                    {editingGuestId === g.id ? (
                      <div className="flex items-center gap-1.5 flex-grow">
                        <input
                          type="text"
                          value={g.name}
                          onChange={(e) => handleUpdateGuestDetail(g.id, 'name', e.target.value)}
                          className="px-2 py-1 rounded bg-[#FFFDFC] border border-[#9E6F6D] text-xs w-1/2"
                        />
                        <input
                          type="text"
                          value={g.phone}
                          onChange={(e) => handleUpdateGuestDetail(g.id, 'phone', e.target.value)}
                          className="px-2 py-1 rounded bg-[#FFFDFC] border border-[#9E6F6D] text-xs w-1/2"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingGuestId(null)}
                          className="px-2 py-1 rounded bg-[#9E6F6D] text-white text-[10px] font-bold"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <div className="truncate flex-grow">
                        <span className="font-bold text-[#302829]">{g.name}</span>
                        <span className="text-[11px] text-[#8C7E80] ml-2 font-mono">{g.phone || 'No Phone'}</span>
                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-[#F2E5E2] text-[#9E6F6D] font-bold">
                          {g.relationship}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingGuestId(editingGuestId === g.id ? null : g.id)}
                      className="p-1 rounded text-[#9E6F6D] hover:bg-[#F2E5E2]"
                      title="Edit Guest"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveGuest(g.id)}
                      className="p-1 rounded text-rose-600 hover:bg-rose-50"
                      title="Remove Guest"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-[#E9D3D0] flex-wrap sm:flex-nowrap">
              <input
                type="text"
                placeholder="New Guest Name"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] text-xs flex-grow min-w-[110px]"
              />
              <input
                type="tel"
                placeholder="WhatsApp Phone"
                value={newGuestPhone}
                onChange={(e) => setNewGuestPhone(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F3] border border-[#E9D3D0] text-xs w-28 shrink-0"
              />
              <button
                type="button"
                onClick={handleAddNewGuestToVerificationList}
                className="px-3 py-1.5 rounded-xl bg-[#F2E5E2] text-[#9E6F6D] font-bold text-xs border border-[#D8B5B0] hover:bg-[#E9D3D0] shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>

              <button
                type="button"
                onClick={() => setShowSavedPicker(!showSavedPicker)}
                className="px-3 py-1.5 rounded-xl bg-[#9E6F6D] text-white font-extrabold text-xs shadow-sm hover:bg-[#875B59] shrink-0 flex items-center gap-1 border border-[#875B59]"
                title="Select additional contacts from your Saved Master Contacts List"
              >
                <Users className="w-3.5 h-3.5 text-white" /> + Add from Saved List
              </button>
            </div>

            {/* SAVED MASTER CONTACTS PICKER POPUP OVERLAY */}
            {showSavedPicker && (
              <div className="p-3 rounded-2xl bg-[#FAF7F3] border border-[#9E6F6D] space-y-2 text-xs shadow-md my-1">
                <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-1.5">
                  <span className="font-bold text-[#302829] flex items-center gap-1">
                    <Users className="w-4 h-4 text-[#9E6F6D]" /> Select Contacts from Saved List
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddAllUnaddedSavedContacts}
                      className="text-[10px] font-extrabold text-white bg-[#9E6F6D] px-2 py-0.5 rounded-lg hover:bg-[#875B59]"
                    >
                      + Add All Unadded
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSavedPicker(false)}
                      className="text-xs text-[#8C7E80] hover:text-[#302829]"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
                  {masterContacts.map((c) => {
                    const isAlreadyAdded = loadedGuests.some(
                      (g) => g.id === c.id || g.name.toLowerCase() === c.name.toLowerCase()
                    );
                    return (
                      <div
                        key={c.id}
                        className="p-1.5 rounded-xl bg-[#FFFDFC] border border-[#E9D3D0] flex items-center justify-between text-xs"
                      >
                        <div className="truncate">
                          <span className="font-bold text-[#302829]">{c.name}</span>
                          <span className="text-[10px] text-[#8C7E80] font-mono ml-1">{c.phone}</span>
                          <span className="ml-1 text-[9px] px-1 rounded bg-[#F2E5E2] text-[#9E6F6D] font-bold">
                            {c.relationship || 'Saved'}
                          </span>
                        </div>
                        {isAlreadyAdded ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddSavedContactToVerification(c)}
                            className="px-2 py-0.5 rounded-lg bg-[#9E6F6D] text-white text-[10px] font-bold hover:bg-[#875B59]"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmAndDispatchWhatsapp}
                disabled={dispatching || loadedGuests.filter((g) => g.selected).length === 0}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-white" />
                {dispatching ? 'Dispatching WhatsApp Cards...' : `🚀 Confirm & Dispatch WhatsApp Invitations (${loadedGuests.filter((g) => g.selected).length} Guests)`}
              </button>
            </div>
          </div>
        )}

        {phase === 'DISPATCHED' && (
          <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-center space-y-2 my-1">
            <span className="text-xs font-extrabold text-emerald-900 flex items-center justify-center gap-1">
              <Check className="w-4 h-4 text-emerald-700" /> WhatsApp Dispatches Sent to All Verified Guests!
            </span>
            <button
              onClick={() => {
                handleCloseAndSaveHistory();
                navigate(`/events/${createdEvent.id}`);
              }}
              className="px-5 py-2 rounded-xl bg-[#9E6F6D] text-white font-bold text-xs"
            >
              View Celebration Dashboard <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        )}

        {/* OPTIONAL VISUAL CALENDAR POPUP INSIDE CHAT */}
        {showCalendar && (
          <div className="my-2">
            <VisualCalendarPicker
              selectedDateTime=""
              onChange={(formattedVal) => {
                setShowCalendar(false);
                const humanStr = `Date & time selected: ${formattedVal}`;
                handleSendMessage(humanStr);
              }}
            />
          </div>
        )}

        {/* INPUT CONTROLS: HINDI DEVANAGARI (hi-IN) MIC & CHAT INPUT */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E9D3D0]">
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-3 py-3 rounded-2xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#302829] border border-[#D8B5B0] font-bold text-xs shrink-0 flex items-center gap-1"
            title="Open Visual Calendar Grid"
          >
            <Calendar className="w-4 h-4 text-[#9E6F6D]" />
            <span className="hidden sm:inline">Calendar</span>
          </button>

          <button
            type="button"
            onClick={toggleListening}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                : 'bg-[#9E6F6D] text-white hover:bg-[#875B59] shadow-sm'
            }`}
            title="Tap Microphone (Hindi Speech in Devanagari script / English)"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-white" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? '🔴 Speak in Hindi/English... Recording' : 'Type or speak in Hindi (Devanagari) / English...'}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF7F3] border-2 border-[#E9D3D0] text-[#211B1C] font-bold text-sm placeholder:text-[#8C7E80] placeholder:font-normal focus:border-[#9E6F6D] outline-none"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105 disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>

      </div>
    </div>
  );
};
