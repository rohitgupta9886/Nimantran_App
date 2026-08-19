import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Gift,
  Send,
  QrCode,
  Heart,
  Users,
  CheckCircle2,
  Shield,
  Smartphone,
  Calendar,
  Share2,
  MapPin,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { useAuth } from '../store/authStore';
import { AuthModal } from '../components/AuthModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

const DESIGN_SHOWCASE = [
  {
    id: 'wedding',
    category: '💍 Wedding & Vivah',
    title: 'Rohit ❤️ Priyanka',
    shloka: '|| श्री गणेशाय नमः ||',
    date: '18 December 2026',
    venue: 'The Taj Palace, New Delhi',
    bgGradient: 'linear-gradient(135deg, #4A1220 0%, #6B1D2F 50%, #2E0B14 100%)',
    borderStyle: 'border-2 border-gold-300 shadow-xl',
    badge: 'Royal Vivah',
    accentColor: '#C59B27',
  },
  {
    id: 'birthday',
    category: '🎂 Milestone Birthday',
    title: "Aarav's 1st Birthday 🎈",
    shloka: '✨ Join The Joyous Celebration ✨',
    date: '24 October 2026',
    venue: 'The Grand Pavilion, Sector 62',
    bgGradient: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
    borderStyle: 'border-2 border-indigo-300 shadow-xl',
    badge: 'Milestone Party',
    accentColor: '#818CF8',
  },
  {
    id: 'mundan',
    category: '👶 Sacred Mundan & Sanskar',
    title: "Aarav's Sacred Mundan 🌸",
    shloka: '|| शुभ आशीर्वाद ||',
    date: '10 May 2027',
    venue: 'Sacred Riverfront Pavilion',
    bgGradient: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%)',
    borderStyle: 'border-2 border-emerald-300 shadow-xl',
    badge: 'Sacred Sanskar',
    accentColor: '#34D399',
  },
  {
    id: 'griha',
    category: '🪔 Griha Pravesh & Puja',
    title: 'Gupta Family Residence',
    shloka: '|| ॐ नमो भगवते वासुदेवाय नमः ||',
    date: '14 November 2026',
    venue: 'Villa No. 12, Emerald Heights',
    bgGradient: 'linear-gradient(135deg, #451A03 0%, #78350F 50%, #92400E 100%)',
    borderStyle: 'border-2 border-amber-300 shadow-xl',
    badge: 'Housewarming',
    accentColor: '#FBBF24',
  },
  {
    id: 'anniversary',
    category: '🌹 Silver Jubilee (25 Yrs)',
    title: 'Rajesh & Sunita 💖',
    shloka: '✨ 25 Years of Eternal Love ✨',
    date: '28 January 2027',
    venue: 'Hyatt Regency Grand Ballroom',
    bgGradient: 'linear-gradient(135deg, #581C87 0%, #7E22CE 50%, #9333EA 100%)',
    borderStyle: 'border-2 border-purple-300 shadow-xl',
    badge: 'Silver Jubilee',
    accentColor: '#E879F9',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Choose Celebration & Style',
    desc: 'Select from Weddings, Birthdays, Mundans, Anniversaries, and 16+ curated luxury card themes.',
    icon: Sparkles,
  },
  {
    step: '02',
    title: 'Personalize with AI',
    desc: 'Describe your event and let AI craft personalized greetings, shlokas, itineraries, and map links.',
    icon: Heart,
  },
  {
    step: '03',
    title: 'Add Honored Guests',
    desc: 'Add from contacts or import Excel. Every guest receives a personalized VIP invitation link.',
    icon: Users,
  },
  {
    step: '04',
    title: 'Send via WhatsApp & SMS',
    desc: 'Send invitations with 1 tap directly to WhatsApp, SMS, or Email without technical hassle.',
    icon: Send,
  },
  {
    step: '05',
    title: 'Interactive 3D Unboxing',
    desc: 'Guests experience an interactive gift box opening with flower petals and festive music.',
    icon: Gift,
  },
  {
    step: '06',
    title: 'Live RSVPs & QR Passes',
    desc: 'Track confirmed attendance in real time and scan digital QR entry passes at the venue gate.',
    icon: QrCode,
  },
];

const CORE_USPS = [
  {
    title: '🎁 3D Gift Box Opening',
    desc: 'Unboxing is an emotion. Guests experience an interactive 3D gift box with petal rain and festive music.',
    tag: 'SIGNATURE EXPERIENCE',
  },
  {
    title: '📱 WhatsApp & SMS 1-Click Send',
    desc: 'Send personalized invitations directly to your guests without copying and pasting links manually.',
    tag: 'ZERO EFFORT',
  },
  {
    title: '🎫 Digital QR Entry Pass',
    desc: 'Each guest receives a unique digital pass for effortless check-in and attendance verification.',
    tag: 'VIP ACCESS',
  },
  {
    title: '💰 Digital Shagun (0% Fee)',
    desc: 'Guests can send monetary blessings directly to your bank account via UPI without platform deductions.',
    tag: 'DIRECT UPI',
  },
  {
    title: '❤️ Live RSVP Headcount',
    desc: 'Know exactly who is attending, guest counts, and dietary preferences before catering is finalized.',
    tag: 'GUEST MGMT',
  },
  {
    title: '📖 Love & Family Story',
    desc: 'Share timeline milestones, heartfelt blessings, and celebration galleries in high definition.',
    tag: 'MEMORIES',
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);

  const openAuth = (mode: 'LOGIN' | 'REGISTER') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleCreateCelebration = () => {
    if (user) {
      navigate('/events/new');
    } else {
      openAuth('REGISTER');
    }
  };

  const activeCard = DESIGN_SHOWCASE[activeShowcaseIdx];

  return (
    <div className="min-h-screen bg-canvas text-charcoal-900 selection:bg-rose selection:text-white overflow-x-hidden">
      
      {/* 🌟 1. LUXURY HEADER NAVIGATION 🌟 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-charcoal-200/70 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-wine via-wine-700 to-gold p-0.5 shadow-sm group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <span className="font-serif font-extrabold text-xl text-wine">N</span>
              </div>
            </div>
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-charcoal-900 block leading-tight">
                Nimantran AI
              </span>
              <span className="text-[9px] tracking-wider text-wine uppercase block font-semibold">
                Celebration Studio
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-charcoal-600">
            <a href="#designs" className="hover:text-wine transition-colors">
              Explore Designs
            </a>
            <a href="#how-it-works" className="hover:text-wine transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-wine transition-colors">
              Features
            </a>
            <a href="#trust" className="hover:text-wine transition-colors">
              Security & Trust
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-xl bg-wine hover:bg-wine-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 min-h-[38px]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>My Dashboard</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuth('LOGIN')}
                  className="px-4 py-2 rounded-xl text-charcoal-700 hover:text-charcoal-900 font-semibold text-xs hover:bg-surface-subtle transition-colors min-h-[38px]"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('REGISTER')}
                  className="px-4 py-2 rounded-xl bg-wine hover:bg-wine-700 text-white font-semibold text-xs shadow-sm transition-all min-h-[38px]"
                >
                  Get Started Free
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🌟 2. HERO SECTION 🌟 */}
      <section className="relative px-4 sm:px-8 pt-12 sm:pt-20 pb-16 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FECE57]/20 border border-[#775A00]/30 text-[#4E051A] text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#775A00] animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[11px]">AI-Powered Celebration Platform & Luxury Digital Cards</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#1F1B18] font-serif tracking-tight leading-[1.1]">
            One Invitation. One Link. <br />
            <span className="text-[#4E051A]">Entire Celebration.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#544244] max-w-2xl mx-auto leading-relaxed font-sans">
            Craft bespoke luxury digital invitations in seconds with conversational AI, dispatch instantly via WhatsApp & SMS, and manage guest check-ins with 4K venue welcome screens.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handleCreateCelebration}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#4E051A] hover:bg-[#6B1D2F] active:bg-[#400013] text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 min-h-[52px] group active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-[#FECE57] group-hover:scale-110 transition-transform" />
              <span>Create Your Royal Event</span>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#designs"
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-white hover:bg-[#F6ECE7] border border-[#DAC0C2] text-[#1F1B18] font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[52px] shadow-sm active:scale-95"
            >
              <Eye className="w-4 h-4 text-[#6B1D2F]" />
              <span>Explore Themes</span>
            </a>
          </div>

          {/* Social Proof & Trust Bar */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 pt-6 text-xs text-[#544244] font-medium flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">500,000+ Invitations Dispatched</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">99.8% Delivery Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">4.9/5 Star Host Rating</span>
            </div>
          </div>
        </div>

        {/* 🌟 3. INTERACTIVE LIVE INVITATION CARD SHOWCASE 🌟 */}
        <div id="designs" className="mt-14 sm:mt-20 pt-6">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-wine">
              Curated Celebration Themes
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal-900 font-serif mt-1">
              Select a Style for Your Special Day
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
            {DESIGN_SHOWCASE.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveShowcaseIdx(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeShowcaseIdx === idx
                    ? 'bg-wine text-white shadow-sm'
                    : 'bg-white border border-charcoal-200 text-charcoal-700 hover:bg-surface-subtle'
                }`}
              >
                {item.category}
              </button>
            ))}
          </div>

          {/* Interactive Card Preview */}
          <div className="max-w-md mx-auto">
            <div
              className={`rounded-3xl p-7 text-white text-center relative overflow-hidden transition-all duration-300 ${activeCard.borderStyle}`}
              style={{ background: activeCard.bgGradient }}
            >
              {/* Badge */}
              <div className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider mb-4 border border-white/20">
                {activeCard.badge}
              </div>

              {/* Shloka */}
              <div className="text-xs font-serif italic text-gold-200 mb-2">
                {activeCard.shloka}
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-bold font-serif mb-3 tracking-tight">
                {activeCard.title}
              </h3>

              {/* Date & Venue */}
              <div className="space-y-1.5 text-xs text-white/80 max-w-xs mx-auto mb-6">
                <div className="flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold-300 shrink-0" />
                  <span>{activeCard.date}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold-300 shrink-0" />
                  <span>{activeCard.venue}</span>
                </div>
              </div>

              {/* Sample Actions */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="px-4 py-2 rounded-xl bg-white text-charcoal-900 text-xs font-bold shadow-sm">
                  ❤️ RSVP Attending
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                  🎫 View Pass
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 4. HOW IT WORKS (STORYTELLING) 🌟 */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-surface-subtle border-y border-charcoal-200/60 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-wine">
              Effortless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal-900 font-serif mt-1">
              From Thought to Invitation in 6 Simple Steps
            </h2>
            <p className="text-sm text-charcoal-500 mt-2">
              No design skills required. Nimantran takes care of everything from typography to guest check-in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="bg-white border border-charcoal-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-wine bg-wine-50 px-2.5 py-1 rounded-lg">
                      {step.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-wine">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-charcoal-900 font-serif mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🌟 5. CORE FEATURES (USPS) 🌟 */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-wine">
            Why Nimantran
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal-900 font-serif mt-1">
            Built for Joyful, Stress-Free Hosting
          </h2>
          <p className="text-sm text-charcoal-500 mt-2">
            Every feature is designed to make your guests feel valued and your hosting effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_USPS.map((usp, idx) => (
            <div
              key={idx}
              className="bg-white border border-charcoal-200/80 rounded-2xl p-6 shadow-sm hover:border-wine/30 hover:shadow-md transition-all"
            >
              <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-wine bg-wine-50 px-2 py-0.5 rounded-md mb-3">
                {usp.tag}
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 font-serif mb-2">
                {usp.title}
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                {usp.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 🌟 6. CALL TO ACTION BANNER 🌟 */}
      <section className="px-4 sm:px-8 pb-16 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-tr from-wine via-wine-800 to-wine-900 text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight">
              Begin Your Celebration Journey Today
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              Create unforgettable digital invitations with interactive 3D gift boxes, seamless WhatsApp sending, and live RSVP management.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleCreateCelebration}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gold hover:bg-gold-400 active:bg-gold-600 text-charcoal-900 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Invitation Now</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};
