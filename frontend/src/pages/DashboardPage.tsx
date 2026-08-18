import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Sparkles,
  Calendar,
  Users,
  QrCode,
  Eye,
  RefreshCw,
  Edit,
  Trash2,
  Send,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';
import { VoiceChatAssistantModal } from '../components/VoiceChatAssistantModal';
import { EditCelebrationModal } from '../components/EditCelebrationModal';
import { ShareInvitationModal } from '../components/ShareInvitationModal';
import { Button, Card, Badge, StatCard, EmptyState, Skeleton } from '../components/ui';

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
  }, [defaultOpenAiModal, onOpenVoiceModal]);

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORICAL'>('UPCOMING');

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

  const hostFirstName = user?.full_name ? user.full_name.split(' ')[0] : 'Host';

  return (
    <div className="w-full space-y-6 md:space-y-8 max-w-7xl mx-auto">
      
      {/* 1. HOST HERO BANNER */}
      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl border border-charcoal-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-900 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-gold-600 animate-pulse" />
              <span>Namaste, {hostFirstName} 🙏</span>
            </div>
            
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal-900 leading-tight tracking-tight">
              Your Celebrations
            </h1>
            
            <p className="text-charcoal-600 text-sm sm:text-base leading-relaxed">
              Create invitations, personalize details with AI, send to guests via WhatsApp, and track RSVPs.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/events/new">
                <Button size="md" variant="primary" leftIcon={<Plus className="w-4 h-4 text-gold" />}>
                  Create Invitation
                </Button>
              </Link>

              <Button
                type="button"
                onClick={onOpenVoiceModal || (() => setIsVoiceModalOpen(true))}
                size="md"
                variant="secondary"
                leftIcon={<Sparkles className="w-4 h-4 text-gold" />}
              >
                Ask AI Assistant
              </Button>
            </div>
          </div>

          {/* QUICK SUMMARY BADGE */}
          <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-2xl bg-canvas border border-charcoal-200/70 text-center w-64 shrink-0 shadow-xs">
            <span className="text-xs uppercase font-bold text-wine tracking-wider">Active Celebrations</span>
            <div className="font-serif text-4xl font-extrabold text-charcoal-900 my-1">
              {upcomingEvents.length}
            </div>
            <span className="text-xs text-charcoal-500">Ready to share with guests</span>
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <StatCard
          label="Upcoming"
          value={upcomingEvents.length}
          subtext="Active celebrations"
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Past Events"
          value={historicalEvents.length}
          subtext="Archived celebrations"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Guests Attending"
          value="312"
          subtext="Confirmed RSVPs"
          trend="+18%"
          trendPositive={true}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Gate Passes"
          value="Active"
          subtext="QR Scanner Ready"
          icon={<QrCode className="w-4 h-4" />}
        />
      </div>

      {/* 3. CELEBRATION GALLERY */}
      <div id="celebrations-gallery-section" className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
              Celebration Gallery
            </h2>
            <p className="text-xs text-charcoal-500">
              Manage your invitations, guest lists, and event details
            </p>
          </div>

          {/* TAB FILTER */}
          <div className="flex items-center rounded-xl bg-white p-1 border border-charcoal-200 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'UPCOMING'
                  ? 'bg-wine text-white font-bold shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <span>Upcoming</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono font-bold">
                {upcomingEvents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('HISTORICAL')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'HISTORICAL'
                  ? 'bg-wine text-white font-bold shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <span>Past Celebrations</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono font-bold">
                {historicalEvents.length}
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} variant="card" height={320} />
            ))}
          </div>
        ) : displayedEvents.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8 text-wine" />}
            title={activeTab === 'UPCOMING' ? 'No upcoming celebrations yet' : 'No past celebrations recorded'}
            description={
              activeTab === 'UPCOMING'
                ? 'Create your first celebration and let Nimantran craft your invitation and guest pass in minutes.'
                : 'Celebrations will automatically move here once the celebration date has passed.'
            }
            actionLabel={activeTab === 'UPCOMING' ? 'Create Celebration' : undefined}
            onAction={activeTab === 'UPCOMING' ? () => (window.location.href = '/events/new') : undefined}
            actionIcon={<Plus className="w-4 h-4 text-gold" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayedEvents.map((evt) => {
              const isPast = evt.start_date && new Date(evt.start_date).getTime() < nowTimestamp;
              const formattedDate = evt.start_date
                ? new Date(evt.start_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Date TBA';
              const formattedTime = evt.start_date
                ? new Date(evt.start_date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Evening';

              return (
                <Card
                  key={evt.id}
                  variant="default"
                  hoverable
                  className="flex flex-col justify-between overflow-hidden p-4 sm:p-5"
                >
                  <div className="space-y-3.5">
                    {/* Event Cover Image */}
                    <div className="relative h-40 rounded-xl overflow-hidden border border-charcoal-200/60 bg-charcoal-100">
                      <img
                        src={
                          evt.cover_image_url ||
                          'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop'
                        }
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/70 via-transparent to-transparent" />

                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                        <Badge variant="neutral" size="sm">
                          {evt.event_type || 'CELEBRATION'}
                        </Badge>

                        {isPast ? (
                          <Badge variant="neutral" size="sm">
                            Past
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot>
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Title & Quick Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-lg font-bold text-charcoal-900 line-clamp-1 flex-1">
                        {evt.title}
                      </h3>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditEvent(evt)}
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-wine hover:bg-canvas transition-colors"
                          title="Edit celebration details"
                          aria-label="Edit celebration"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt.id, evt.title)}
                          disabled={deletingId === evt.id}
                          className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete celebration"
                          aria-label="Delete celebration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center justify-between text-xs text-charcoal-600 py-1.5 px-3 rounded-lg bg-canvas border border-charcoal-200/60 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-wine" />
                        <span>{formattedDate}</span>
                      </span>
                      <span>•</span>
                      <span className="text-charcoal-500">{formattedTime}</span>
                    </div>

                    {/* Venue */}
                    <p className="text-xs text-charcoal-500 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                      <span>{evt.venue_name || 'Celebration Venue'}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3.5 mt-3.5 border-t border-charcoal-100 flex flex-col gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setSharingEvent(evt);
                        setIsShareModalOpen(true);
                      }}
                      variant="primary"
                      size="sm"
                      fullWidth
                      leftIcon={<Send className="w-3.5 h-3.5 text-gold" />}
                    >
                      Send to Guests
                    </Button>

                    <div className="flex items-center gap-2">
                      <Link to={`/events/${evt.id}`} className="flex-1">
                        <Button variant="secondary" size="sm" fullWidth>
                          Manage
                        </Button>
                      </Link>

                      <Link
                        to={`/i/${evt.slug || evt.id}`}
                        target="_blank"
                        className="shrink-0"
                      >
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          Preview
                        </Button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDuplicateEvent(evt.id)}
                        disabled={duplicatingId === evt.id}
                        className="p-2 rounded-xl text-charcoal-500 hover:text-charcoal-800 hover:bg-canvas border border-charcoal-200 transition-colors shrink-0"
                        title="Duplicate celebration"
                        aria-label="Duplicate celebration"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            duplicatingId === evt.id ? 'animate-spin text-wine' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </Card>
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

      {/* Edit Celebration Modal */}
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
