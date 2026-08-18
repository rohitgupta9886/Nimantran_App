import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Heart, MessageSquare, Tv, ArrowLeft, Wifi, WifiOff, Users, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiFetch } from '../services/api';

interface RecentArrival {
  id: string;
  guest_name: string;
  relationship?: string;
  welcome_quote?: string;
  photo_url?: string;
  is_vip?: boolean;
  checked_in_at?: string;
}

interface EventBranding {
  id: string;
  title: string;
  host_name?: string;
  venue_name?: string;
  event_type?: string;
  theme_name?: string;
  start_date?: string;
}

export const WelcomeScreenPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventBranding, setEventBranding] = useState<EventBranding | null>(null);
  const [activeCheckin, setActiveCheckin] = useState<RecentArrival | null>(null);
  const [recentArrivals, setRecentArrivals] = useState<RecentArrival[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastCheckinId, setLastCheckinId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger celebration presentation for a newly checked-in guest
  const triggerWelcomePresentation = useCallback((payload: RecentArrival) => {
    setActiveCheckin(payload);
    setRecentArrivals((prev) => {
      const filtered = prev.filter((p) => p.id !== payload.id);
      return [payload, ...filtered].slice(0, 15);
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#E5A93C', '#893148', '#FFFFFF'],
        disableForReducedMotion: true,
      });
    } catch {
      // Confetti fallback
    }

    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    // Return to ambient event screen after 9 seconds
    autoDismissTimerRef.current = setTimeout(() => {
      setActiveCheckin(null);
    }, 9000);
  }, []);

  // Fetch initial welcome feed via REST
  const fetchFeed = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await apiFetch<any>(`/events/${eventId}/welcome-feed`);
      if (res?.data) {
        if (res.data.event) {
          setEventBranding(res.data.event);
        }
        if (res.data.recent_arrivals) {
          setRecentArrivals(res.data.recent_arrivals);
          const latest = res.data.recent_arrivals[0];
          if (latest && latest.id !== lastCheckinId && !activeCheckin) {
            setLastCheckinId(latest.id);
          }
        }
      }
    } catch (err) {
      console.warn('REST welcome-feed sync notice:', err);
    }
  }, [eventId, lastCheckinId, activeCheckin]);

  // WebSocket Connection with Auto-reconnect & Fallback Polling
  useEffect(() => {
    if (!eventId) return;

    fetchFeed();

    const connectWebSocket = () => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/events/${eventId}/welcome`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data);
            if (payload.type === 'guest_checked_in' || payload.guest_name) {
              const arrival: RecentArrival = {
                id: payload.id || String(Date.now()),
                guest_name: payload.guest_name,
                relationship: payload.relationship || 'Honored Guest',
                welcome_quote: payload.welcome_quote || '"Welcome to the celebration ❤️"',
                is_vip: payload.is_vip || false,
                checked_in_at: payload.checked_in_at || new Date().toISOString(),
              };
              setLastCheckinId(arrival.id);
              triggerWelcomePresentation(arrival);
            }
          } catch (err) {
            console.error('WS Parse Error', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Auto reconnect after 4 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };

        wsRef.current = ws;
      } catch {
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // Fallback polling interval every 6 seconds to ensure zero missed check-ins even if WebSocket disconnects
    const pollInterval = setInterval(() => {
      fetchFeed();
    }, 6000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      clearInterval(pollInterval);
    };
  }, [eventId, fetchFeed, triggerWelcomePresentation]);

  // Demo simulation for testing
  const handleSimulateCheckin = () => {
    triggerWelcomePresentation({
      id: `sim_${Date.now()}`,
      guest_name: 'Rahul & Priya Sharma',
      relationship: "Groom's Close Friends",
      welcome_quote: "Wishing you a lifetime filled with love, laughter, and endless happiness! ❤️",
      is_vip: true,
      checked_in_at: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-[#0E0306] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none font-sans">
      {/* Background Ambient Aura */}
      <div className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-rose-700/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding & Controls */}
      <header className="flex items-center justify-between z-10 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#C9AA78] to-[#F1E0C6] p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#1A0309] rounded-2xl flex items-center justify-center font-serif font-extrabold text-[#C9AA78] text-lg sm:text-xl">
              N
            </div>
          </div>
          <div>
            <div className="font-serif font-extrabold text-base sm:text-xl tracking-wide gold-gradient-text">
              {eventBranding?.title || 'NIMANTRAN CELEBRATION'}
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-amber-200/70 tracking-widest uppercase">
              {eventBranding?.host_name ? `Hosted by ${eventBranding.host_name}` : 'LIVE SMART RECEPTION SCREEN'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Badge */}
          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border ${
            isConnected
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />}
            <span>{isConnected ? 'LIVE SYNC' : 'POLLING SYNC'}</span>
          </span>

          <button
            onClick={handleSimulateCheckin}
            className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors hidden sm:flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Check-In</span>
          </button>

          {eventId && (
            <Link
              to={`/events/${eventId}`}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              title="Back to Event Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      {/* Center Stage: Active Arrival or Ambient Royal Welcome */}
      <main className="my-auto text-center z-10 max-w-5xl mx-auto w-full px-2 sm:px-4 py-6">
        {activeCheckin ? (
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#1C050C]/90 via-[#140005]/95 to-[#0E0306]/95 border-2 border-[#C9AA78]/50 shadow-2xl shadow-amber-900/40 space-y-6 sm:space-y-8 animate-fade-in transition-all relative overflow-hidden">
            {/* VIP or Royal Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#C9AA78]/20 border border-[#C9AA78]/40 text-[#F1E0C6] font-mono text-xs sm:text-sm tracking-widest uppercase">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>{activeCheckin.is_vip ? '★ ROYAL VIP GUEST AT GATE ★' : 'A WARM ROYAL WELCOME'}</span>
            </div>

            {/* Guest Name */}
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold gold-gradient-text tracking-wide leading-tight">
              {activeCheckin.guest_name}
            </h1>

            {/* Relationship / Personal Greeting */}
            {activeCheckin.relationship && (
              <p className="text-lg sm:text-2xl text-amber-200/90 font-serif font-bold tracking-wide">
                {activeCheckin.relationship}
              </p>
            )}

            {/* Personal Blessing / Welcome Quote */}
            <div className="bg-[#0A0103]/80 p-5 sm:p-7 rounded-2xl border border-amber-500/30 max-w-2xl mx-auto shadow-inner space-y-2">
              <div className="text-[10px] sm:text-xs font-mono text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>PERSONAL BLESSINGS & CELEBRATION WISHES</span>
              </div>
              <p className="text-base sm:text-xl text-amber-100/95 font-serif italic leading-relaxed">
                {activeCheckin.welcome_quote || '"Welcome to the celebration ❤️"'}
              </p>
            </div>

            <div className="text-xs sm:text-sm font-serif font-extrabold text-[#C9AA78] tracking-widest uppercase flex items-center justify-center gap-2 pt-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Welcome to the celebration ❤️</span>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-[#C9AA78] font-serif text-base sm:text-xl tracking-widest uppercase">
              || शुभ स्वागतम् ||
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl md:text-8xl font-extrabold gold-gradient-text tracking-wide">
              {eventBranding?.title || 'WELCOME TO THE CELEBRATION'}
            </h1>

            <p className="text-amber-200/80 font-serif text-base sm:text-2xl tracking-widest max-w-3xl mx-auto leading-relaxed">
              {eventBranding?.venue_name ? `${eventBranding.venue_name} • ` : ''}
              Welcome to the celebration ❤️
            </p>

            <div className="pt-4 sm:pt-6 inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-amber-300/80 uppercase tracking-widest animate-pulse">
              <Tv className="w-4 h-4 text-amber-400" />
              <span>RECEPTION DISPLAY ACTIVE • LISTENING FOR GATE ARRIVALS</span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Stage: Recent Arrivals Stream */}
      <footer className="z-10 space-y-3 max-w-6xl mx-auto w-full pt-2">
        {recentArrivals.length > 0 && (
          <div className="bg-[#140005]/80 border border-[#C9AA78]/30 p-3 sm:p-4 rounded-2xl backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-[#C9AA78] uppercase tracking-widest px-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Users className="w-3.5 h-3.5" /> RECENT ARRIVALS
              </span>
              <span className="text-slate-400">
                {recentArrivals.length} Guest{recentArrivals.length !== 1 ? 's' : ''} Checked In
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {recentArrivals.slice(0, 10).map((arrival) => (
                <div
                  key={arrival.id}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-amber-500/20 text-xs shrink-0 flex items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <span className="font-serif font-extrabold text-amber-100">{arrival.guest_name}</span>
                  {arrival.checked_in_at && (
                    <span className="text-[10px] font-mono text-amber-300/60 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(arrival.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-[10px] font-mono text-slate-600 tracking-wider">
          POWERED BY NIMANTRAN AI • EVENT-DAY LIVE EXPERIENCE ENGINE
        </div>
      </footer>
    </div>
  );
};
