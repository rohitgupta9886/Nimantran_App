import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Heart, MessageSquare, Quote } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WelcomeScreenPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeCheckin, setActiveCheckin] = useState<any>(null);

  useEffect(() => {
    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/events/${eventId || 'demo'}/welcome`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'guest_checked_in') {
          triggerWelcomeAnimation(payload);
        }
      } catch (err) {
        console.error('WS Parse Error', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [eventId]);

  const triggerWelcomeAnimation = (payload: any) => {
    setActiveCheckin(payload);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });

    // Auto dismiss back to idle after 7 seconds
    setTimeout(() => {
      setActiveCheckin(null);
    }, 7000);
  };

  const handleSimulateCheckin = () => {
    triggerWelcomeAnimation({
      guest_name: 'Uncle Ramesh & Family',
      relationship: "Groom's Elder Uncle",
      welcome_quote: "💬 'Wishing the couple a lifetime of infinite joy, smiles, and togetherness! Cannot wait to bless you in person.' — Uncle Ramesh",
    });
  };

  return (
    <div className="min-h-screen bg-[#0D0205] text-white flex flex-col justify-between p-8 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5">
            <div className="w-full h-full bg-[#1A0006] rounded-full flex items-center justify-center font-serif font-bold text-amber-400">
              N
            </div>
          </div>
          <div>
            <div className="font-serif font-bold text-xl gold-gradient-text">NIMANTRAN AI</div>
            <div className="text-[10px] font-mono text-amber-300/70 tracking-widest uppercase">REAL-TIME SMART RECEPTION TV SCREEN</div>
          </div>
        </div>

        <button
          onClick={handleSimulateCheckin}
          className="px-4 py-2 rounded-full glass-panel border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 z-20 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> Simulate Gate Scanner Check-in Trigger
        </button>
      </div>

      {/* Center Main Stage */}
      <div className="my-auto text-center z-10 max-w-4xl mx-auto space-y-8">
        {activeCheckin ? (
          <div className="glass-panel p-12 md:p-16 rounded-3xl gold-border shadow-2xl gold-glow space-y-6 animate-fade-in scale-105 transition-all relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-sm tracking-widest uppercase">
              <Sparkles className="w-4 h-4 text-amber-400" /> A WARM ROYAL WELCOME AT THE GATE
            </div>

            <h1 className="font-serif text-5xl md:text-7xl font-extrabold gold-gradient-text">
              {activeCheckin.guest_name}
            </h1>

            {activeCheckin.relationship && (
              <p className="text-xl text-amber-200/90 font-serif font-semibold">
                {activeCheckin.relationship}
              </p>
            )}

            {/* Display Invitee Message / Wishes */}
            <div className="bg-[#140005] p-6 rounded-2xl border border-amber-500/30 space-y-2 max-w-2xl mx-auto shadow-inner">
              <div className="text-[11px] font-mono text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> GUEST'S PERSONAL WISHES & MESSAGE WALL
              </div>
              <p className="text-lg md:text-xl text-slate-100 font-serif italic leading-relaxed">
                {activeCheckin.welcome_quote || '"Your gracious presence brings boundless warmth to our family!"'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-amber-400/80 font-hindi text-xl">|| श्री गणेशाय नमः ||</div>
            <h1 className="font-serif text-6xl md:text-8xl font-extrabold gold-gradient-text tracking-wider">
              WELCOME TO THE CELEBRATION
            </h1>
            <p className="text-amber-200/70 font-serif text-xl tracking-widest uppercase">
              ONE INVITATION • ONE LINK • ENTIRE CELEBRATION
            </p>
            <div className="pt-8 text-xs font-mono text-slate-500 tracking-widest uppercase animate-pulse">
              [ SMART RECEPTION TV SCREEN LISTENING • GATE QR SCANNER ACTIVE ]
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs font-mono text-slate-600 z-10">
        POWERED BY NIMANTRAN AI • REAL-TIME BIG SCREEN DISPLAY ENGINE
      </div>
    </div>
  );
};
