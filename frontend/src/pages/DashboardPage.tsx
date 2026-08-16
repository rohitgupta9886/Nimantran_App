import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles, Calendar, Users, QrCode, Eye, RefreshCw, Radio, Edit, Trash2, History, CheckCircle2, Send } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';
import { VoiceChatAssistantModal } from '../components/VoiceChatAssistantModal';
import { EditCelebrationModal } from '../components/EditCelebrationModal';
import { ShareInvitationModal } from '../components/ShareInvitationModal';

interface DashboardPageProps {
  defaultOpenAiModal?: boolean;
  onOpenVoiceModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ defaultOpenAiModal, onOpenVoiceModal }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(!!defaultOpenAiModal);

  useEffect(() => {
    if (defaultOpenAiModal) {
      if (onOpenVoiceModal) {
        onOpenVoiceModal();
      } else {
        setIsVoiceModalOpen(true);
      }
    }
  }, [defaultOpenAiModal]);

  // Tab State: 'UPCOMING' or 'HISTORICAL'
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORICAL'>('UPCOMING');

  // 3D Romantic Artwork Carousel Auto-Shuffle Loop
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Universal Share Modal State
  const [sharingEvent, setSharingEvent] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchEvents = async (updatedDate?: string) => {
    try {
      const res = await apiFetch<any>('/events');
      const eventList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setEvents(eventList);

      if (updatedDate) {
        const nowTimestamp = new Date().setHours(0, 0, 0, 0);
        const isPast = new Date(updatedDate).getTime() < nowTimestamp;
        setActiveTab(isPast ? 'HISTORICAL' : 'UPCOMING');
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDuplicateEvent = async (eventId: string) => {
    setDuplicatingId(eventId);
    try {
      await apiFetch(`/events/${eventId}/duplicate`, { method: 'POST' });
      await fetchEvents();
    } catch (err) {
      console.error('Failed to duplicate event:', err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(eventId);
    try {
      await apiFetch(`/events/${eventId}`, { method: 'DELETE' });
      await fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditEvent = (evt: any) => {
    setEditingEvent(evt);
    setIsEditModalOpen(true);
  };

  const handleSaveEditSuccess = (updatedEvt: any) => {
    setIsEditModalOpen(false);
    setEditingEvent(null);
    fetchEvents(updatedEvt.start_date);
  };

  const nowTimestamp = new Date().setHours(0, 0, 0, 0);

  const safeEvents = Array.isArray(events) ? events : [];
  const upcomingEvents = safeEvents.filter(
    (e) => e && (!e.start_date || new Date(e.start_date).getTime() >= nowTimestamp)
  );
  const historicalEvents = safeEvents.filter(
    (e) => e && e.start_date && new Date(e.start_date).getTime() < nowTimestamp
  );

  const displayedEvents = activeTab === 'UPCOMING' ? upcomingEvents : historicalEvents;

  return (
    <div className="w-full space-y-8">
      
      {/* 1. HERO BANNER WITH 3D INVITATION ENVELOPE CENTERPIECE */}
      <div className="bg-[#FFFDFC] p-8 sm:p-10 rounded-3xl space-y-6 relative overflow-hidden border border-[#E9D3D0] shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F2E5E2] border border-[#D8B5B0] text-[#9E6F6D] text-[11px] font-mono font-extrabold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#C9AA78]" /> WELCOME 👋 • YOUR DIGITAL INVITATION HUB
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#302829] leading-tight">
              Create your Invitation
            </h1>
            
            <p className="text-[#51484A] text-sm font-serif italic leading-relaxed">
              "Let's create something beautiful for your special day."
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/events/new"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#9E6F6D] via-[#875B59] to-[#63182C] text-white font-extrabold text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 border border-amber-300"
              >
                <Plus className="w-5 h-5 text-amber-300" />
                <span>+ CREATE NEW INVITATION</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  const target = document.getElementById('celebrations-gallery-section');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-6 py-4 rounded-2xl bg-[#FFFDFC] hover:bg-[#F2E5E2] text-[#302829] font-bold text-xs shadow-sm border border-[#D8B5B0]/60 transition-transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#9E6F6D]" />
                <span>View My Invitations</span>
              </button>
            </div>
          </div>

          {/* CONTINUOUS MOVING 3D ROMANTIC CARD SHUFFLE DECK */}
          <div className="relative shrink-0 w-full lg:w-[420px] h-72 sm:h-80 flex items-center justify-center group perspective-[1200px]">
            {/* Ambient Multi-Color Back Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#9E6F6D]/40 via-[#C9AA78]/30 to-[#E52B50]/40 rounded-3xl blur-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-700" />

            {[
              { id: 0, src: '/romantic_3d_invitation_hero.jpg', title: '3D Gift Box & Heart' },
              { id: 1, src: '/romantic_3d_wedding_stage.jpg', title: 'Royal Floral Stage' },
              { id: 2, src: '/romantic_3d_envelope_rings.jpg', title: 'Wax Sealed Envelope' },
            ].map((card, index) => {
              const pos = (index - activeCardIndex + 3) % 3;

              // Dynamic 3D stack position styling based on cyclic pos (0 = front, 1 = right middle, 2 = left back)
              let posStyles = '';
              if (pos === 0) {
                posStyles = 'z-30 scale-100 rotate-0 translate-x-0 translate-y-0 opacity-100 border-2 border-[#FFD700] shadow-[0_30px_70px_-15px_rgba(229,43,80,0.5)]';
              } else if (pos === 1) {
                posStyles = 'z-20 scale-90 rotate-6 translate-x-8 -translate-y-2 opacity-85 border-2 border-[#C9AA78] shadow-2xl';
              } else {
                posStyles = 'z-10 scale-80 -rotate-8 -translate-x-8 translate-y-2 opacity-75 border-2 border-[#E9D3D0] shadow-xl';
              }

              return (
                <div
                  key={card.id}
                  onClick={() => setActiveCardIndex(index)}
                  className={`absolute w-[88%] h-[88%] rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out transform ${posStyles} hover:scale-105`}
                >
                  <img
                    src={card.src}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* 2. 4 OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Upcoming Celebrations */}
        <div className="bg-[#FFFDFC] p-5 rounded-3xl border border-[#E9D3D0] space-y-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="text-[#9E6F6D] text-xs font-semibold uppercase tracking-wider">
            Upcoming Celebrations
          </div>
          <div className="text-4xl font-bold font-serif text-[#302829]">
            {upcomingEvents.length > 0 ? upcomingEvents.length : 17}
          </div>
          <div className="text-[11px] text-[#8C7E80]">Active upcoming celebrations</div>
          <div className="absolute right-4 bottom-4 text-2xl opacity-40">📅</div>
        </div>

        {/* Card 2: Past Celebrations */}
        <div className="bg-[#FFFDFC] p-5 rounded-3xl border border-[#E9D3D0] space-y-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="text-[#9E6F6D] text-xs font-semibold uppercase tracking-wider">
            Past Celebrations
          </div>
          <div className="text-4xl font-bold font-serif text-[#704E4D]">
            {historicalEvents.length > 0 ? historicalEvents.length : 2}
          </div>
          <div className="text-[11px] text-[#8C7E80]">Memories of past celebrations</div>
          <div className="absolute right-4 bottom-4 text-2xl opacity-40">📸</div>
        </div>

        {/* Card 3: Confirmed RSVPs */}
        <div className="bg-[#FFFDFC] p-5 rounded-3xl border border-[#E9D3D0] space-y-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9E6F6D] text-xs font-semibold uppercase tracking-wider">
            <span>Confirmed RSVPs</span>
            <div className="w-8 h-8 rounded-full border-2 border-[#C9AA78] flex items-center justify-center text-[9px] font-mono font-bold text-[#9E6F6D]">
              22%
            </div>
          </div>
          <div className="text-4xl font-bold font-serif text-[#9E6F6D]">312</div>
          <div className="text-[11px] text-[#8C7E80]">62.4% guest confirmation rate</div>
        </div>

        {/* Card 4: Guest Entry Scanner */}
        <div className="bg-[#FFFDFC] p-5 rounded-3xl border border-[#E9D3D0] space-y-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="text-[#9E6F6D] text-xs font-semibold uppercase tracking-wider">
            Guest Entry Scanner
          </div>
          <div className="text-4xl font-bold font-serif text-emerald-700 tracking-wide">
            READY
          </div>
          <div className="text-[11px] text-[#8C7E80]">Reception camera check-in active</div>
          <div className="absolute right-4 bottom-4 text-2xl opacity-40">📷</div>
        </div>
      </div>

      {/* 3. CELEBRATIONS GALLERY WITH UPCOMING VS PAST TABS */}
      <div id="celebrations-gallery-section" className="space-y-6 scroll-mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif text-3xl font-bold text-[#302829]">Celebrations Gallery</h2>
            <p className="text-xs text-[#8C7E80]">Manage, customize, and review your celebration events</p>
          </div>

          {/* TAB FILTER SELECTOR */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#FFFDFC] border border-[#E9D3D0] text-xs font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'UPCOMING'
                  ? 'bg-[#9E6F6D] text-white font-bold shadow-md'
                  : 'text-[#8C7E80] hover:text-[#302829]'
              }`}
            >
              <span>🎉 Upcoming</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold">
                {upcomingEvents.length > 0 ? upcomingEvents.length : 17}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('HISTORICAL')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'HISTORICAL'
                  ? 'bg-[#875B59] text-white font-bold shadow-md'
                  : 'text-[#8C7E80] hover:text-[#302829]'
              }`}
            >
              <span>📜 Past Celebrations</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold">
                {historicalEvents.length > 0 ? historicalEvents.length : 2}
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-[#9E6F6D] font-serif">
            <Sparkles className="w-7 h-7 animate-spin mx-auto mb-2 text-[#C9AA78]" /> Preparing Your Celebrations...
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="bg-[#FFFDFC] p-14 rounded-3xl text-center space-y-4 border border-[#E9D3D0] shadow-sm">
            <Calendar className="w-14 h-14 text-[#D8B5B0] mx-auto opacity-80" />
            <h3 className="font-serif text-2xl font-bold text-[#302829]">
              {activeTab === 'UPCOMING' ? 'Your celebration story starts here' : 'No past celebrations recorded yet'}
            </h3>
            <p className="text-xs text-[#8C7E80] max-w-sm mx-auto">
              {activeTab === 'UPCOMING'
                ? 'Create your next celebration and let NIMANTRAN AI craft your invitation instantly.'
                : 'Celebrations automatically archive here after your event date passes.'}
            </p>
            {activeTab === 'UPCOMING' && (
              <Link
                to="/events/new"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#9E6F6D] text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4" /> Start Celebration
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.map((evt) => {
              const isPast = evt.start_date && new Date(evt.start_date).getTime() < nowTimestamp;
              const formattedDate = evt.start_date
                ? new Date(evt.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Date TBA';
              const formattedTime = evt.start_date
                ? new Date(evt.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '7:00 PM ONWARDS';

              return (
                <div
                  key={evt.id}
                  className="bg-[#FFFDFC] rounded-3xl overflow-hidden flex flex-col justify-between p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative border border-[#E9D3D0]"
                >
                  <div className="space-y-4">
                    {/* Event Cover Image / Theme Header */}
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-[#E9D3D0] shadow-sm">
                      <img
                        src={evt.cover_image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop'}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#302829]/80 via-transparent to-transparent" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#9E6F6D] text-[10px] font-mono font-bold uppercase border border-[#D8B5B0]">
                          {evt.event_type || 'WEDDING'}
                        </span>
                        
                        {isPast ? (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100/90 backdrop-blur-md text-slate-700 text-[10px] font-mono font-bold border border-slate-300">
                            📜 PAST
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100/90 backdrop-blur-md text-emerald-800 text-[10px] font-mono font-bold border border-emerald-300">
                            ● ACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-xl font-bold text-[#302829] group-hover:text-[#9E6F6D] transition-colors line-clamp-1 flex-1">
                        {evt.title}
                      </h3>

                      {/* EDIT & DELETE QUICK ACTION ICON BUTTONS */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditEvent(evt)}
                          className="p-1.5 rounded-lg bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] border border-[#D8B5B0]/50 transition-colors"
                          title="Edit Celebration Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt.id, evt.title)}
                          disabled={deletingId === evt.id}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50"
                          title="Delete Celebration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* EVENT DATE & TIME BADGE */}
                    <div className="flex items-center justify-between gap-2 text-xs font-mono font-bold text-[#9E6F6D] py-2 px-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C9AA78]" />
                        <span>{formattedDate}</span>
                      </span>
                      <span className="text-[#C9AA78]">•</span>
                      <span className="flex items-center gap-1.5 text-[#704E4D]">
                        <span>⏰ {formattedTime}</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#51484A] line-clamp-2 leading-relaxed">
                      📍 {evt.venue_name || 'Celebration Venue'}
                    </p>

                    {/* Visual RSVP Progress Meter */}
                    <div className="p-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#51484A] font-mono">
                        <span>Attending Status</span>
                        <span className="font-bold text-emerald-700">31 Confirmed</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#EDE4DC] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 via-[#C9AA78] to-[#9E6F6D] w-3/4 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-4 border-t border-[#E9D3D0] flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSharingEvent(evt);
                        setIsShareModalOpen(true);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all border border-emerald-400"
                    >
                      <Send className="w-4 h-4 text-white" /> ✈ SEND INVITATION
                    </button>

                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/events/${evt.id}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                      >
                        <span>Manage Event</span>
                      </Link>

                      <Link
                        to={`/i/${evt.slug || evt.id}`}
                        target="_blank"
                        className="py-2 px-3 rounded-xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#9E6F6D] border border-[#D8B5B0] text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                        title="View Live Public Invitation"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#9E6F6D]" />
                        <span>View</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleEditEvent(evt)}
                        className="py-2 px-2.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] border border-[#D8B5B0]/50 text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
                        title="Edit Celebration Details"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#9E6F6D]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateEvent(evt.id)}
                        disabled={duplicatingId === evt.id}
                        className="py-2 px-2.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#9E6F6D] border border-[#D8B5B0]/50 text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
                        title="Repeat past event with 1 tap"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#9E6F6D] ${duplicatingId === evt.id ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Assistant Modal */}
      <VoiceChatAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Edit Celebration Details Modal */}
      <EditCelebrationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEvent(null);
        }}
        eventData={editingEvent}
        onSuccess={handleSaveEditSuccess}
      />

      {/* Universal Share Invitation Modal */}
      {sharingEvent && (
        <ShareInvitationModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSharingEvent(null);
          }}
          event={sharingEvent}
          defaultChannel="whatsapp"
        />
      )}
    </div>
  );
};
