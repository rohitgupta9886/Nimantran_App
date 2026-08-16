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
  Lock,
  Calendar,
  Share2,
  Music,
  MapPin,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  KeyRound,
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
    bgGradient: 'linear-gradient(135deg, #3D0C14 0%, #7E223B 50%, #2A060C 100%)',
    borderStyle: 'border-2 border-amber-300 shadow-[0_0_30px_rgba(255,215,0,0.3)]',
    badge: '👑 Royal Vivah',
  },
  {
    id: 'birthday',
    category: '🎂 Birthday Gala',
    title: "Aarav's 1st Birthday 🎈",
    shloka: '✨ Join The Magical Joy ✨',
    date: '24 October 2026',
    venue: 'The Grand Pavilion, Sector 62',
    bgGradient: 'linear-gradient(135deg, #0A0612 0%, #3B0764 50%, #1E1B4B 100%)',
    borderStyle: 'border-2 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    badge: '🎉 Milestone Party',
  },
  {
    id: 'baby',
    category: '👶 Baby & Mundan',
    title: "Aarav's Sacred Mundan 🌸",
    shloka: '|| शुभ आशीर्वाद ||',
    date: '10 May 2027',
    venue: 'Sacred Riverfront Pavilion',
    bgGradient: 'linear-gradient(135deg, #022C22 0%, #065F46 50%, #064E3B 100%)',
    borderStyle: 'border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]',
    badge: '🪷 Sacred Sanskar',
  },
  {
    id: 'religious',
    category: '🪔 Griha Pravesh & Puja',
    title: 'Gupta Family Residence',
    shloka: '|| ॐ नमो भगवते वासुदेवाय नमः ||',
    date: '14 November 2026',
    venue: 'Villa No. 12, Emerald Heights',
    bgGradient: 'linear-gradient(135deg, #451A03 0%, #78350F 50%, #292524 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    badge: '🏡 Griha Pravesh',
  },
  {
    id: 'corporate',
    category: '💼 Corporate Gala',
    title: 'Annual Leadership Summit 2026',
    shloka: '✨ Innovate • Elevate • Excel ✨',
    date: '05 September 2026',
    venue: 'The Leela Convention Hall',
    bgGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #020617 100%)',
    borderStyle: 'border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    badge: '🏆 Executive Awards',
  },
  {
    id: 'anniversary',
    category: '🌹 Silver Jubilee (25 Yrs)',
    title: 'Rajesh & Sunita 💖',
    shloka: '✨ 25 Years of Eternal Love ✨',
    date: '28 January 2027',
    venue: 'Hyatt Regency Grand Ballroom',
    bgGradient: 'linear-gradient(135deg, #2E0854 0%, #581C87 50%, #1E1B4B 100%)',
    borderStyle: 'border-2 border-pink-400 shadow-[0_0_30px_rgba(244,114,182,0.3)]',
    badge: '💎 Silver Jubilee',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Choose Occasion & Style',
    desc: 'Pick from 30+ celebrations (Wedding, Birthday, Mundan, Corporate) and 16+ royal card palettes.',
    icon: Sparkles,
  },
  {
    step: '02',
    title: 'Personalize Details',
    desc: 'Add host names, sacred shlokas, venue maps, couple story moments, and UPI digital shagun.',
    icon: Heart,
  },
  {
    step: '03',
    title: 'Add Honored Guests',
    desc: 'Import from contacts or Excel. Every guest receives a unique VIP pass and personal greeting.',
    icon: Users,
  },
  {
    step: '04',
    title: '1-Click Sharing',
    desc: 'Send instantly via WhatsApp, SMS or Gmail with pre-formatted luxury invite messages.',
    icon: Send,
  },
  {
    step: '05',
    title: 'Cinematic 3D Unboxing',
    desc: 'Guests tap the royal gift box to experience starburst confetti, audio chime, and grand card reveal.',
    icon: Gift,
  },
  {
    step: '06',
    title: 'Live RSVPs & QR Passes',
    desc: 'Track attending headcount in real time, view blessing messages, and scan QR entry passes at the venue.',
    icon: QrCode,
  },
];

const CORE_USPS = [
  {
    title: '🎁 3D Gift Box Experience',
    desc: 'Unboxing is an emotion. Guests experience an interactive 3D gift box with flower petal rain and chime sounds.',
    tag: 'SIGNATURE USP',
  },
  {
    title: '📱 WhatsApp & SMS Sharing',
    desc: 'One-tap dispatch to WhatsApp, Text Messages, and Gmail without typing links manually.',
    tag: 'ZERO FRICTION',
  },
  {
    title: '🎫 Digital QR Guest Pass',
    desc: 'Each guest gets a personalized digital entry pass with a unique QR code for seamless event check-in.',
    tag: 'VIP ACCESS',
  },
  {
    title: '💰 Digital Shagun (0% Fee)',
    desc: 'Guests can send monetary blessings directly to your bank account via UPI without any platform cuts.',
    tag: 'DIRECT UPI',
  },
  {
    title: '❤️ Live RSVP Headcount',
    desc: 'Know exactly who is attending, plus-ones count, and dietary preferences before finalizing catering.',
    tag: 'GUEST MGMT',
  },
  {
    title: '📖 Love Story Timeline',
    desc: 'Share how your love began, proposal moments, and photo gallery with smooth parallax scroll.',
    tag: 'EMOTIONAL',
  },
];

export const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);

  const openAuth = (mode: 'LOGIN' | 'REGISTER') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const isAdmin = user && (user.role === 'ADMIN' || user.is_superuser);

  return (
    <div className="min-h-screen bg-[#0A1128] text-white selection:bg-amber-400 selection:text-black overflow-x-hidden">
      
      {/* 🌟 1. ROYAL HEADER NAVIGATION 🌟 */}
      <header className="sticky top-0 z-40 bg-[#0A1128]/90 backdrop-blur-xl border-b border-amber-300/20 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-rose-400 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0A1128] rounded-2xl flex items-center justify-center">
                <span className="font-serif font-extrabold text-xl gold-gradient-text">N</span>
              </div>
            </div>
            <div>
              <span className="font-serif font-extrabold text-lg sm:text-xl tracking-wider text-white block leading-tight">
                NIMANTRAN AI
              </span>
              <span className="text-[9px] tracking-widest text-amber-300/90 uppercase block font-mono font-bold">
                LUXURY DIGITAL INVITATION STUDIO
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-slate-300">
            <a href="#designs" className="hover:text-amber-300 transition-colors">
              Explore Designs
            </a>
            <a href="#how-it-works" className="hover:text-amber-300 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-amber-300 transition-colors">
              Features
            </a>
            <a href="#trust" className="hover:text-amber-300 transition-colors">
              Security & Trust
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Admin Quick Link if Admin */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3.5 py-2 rounded-2xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-400/50 text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-300" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                {/* Dashboard Button */}
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-extrabold text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">My Dashboard</span>
                </Link>

                {/* Change Password Link */}
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-amber-300/30 transition-colors"
                  title="Change Password & Security"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-2xl bg-slate-900/80 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => openAuth('LOGIN')}
                  className="px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-amber-300/30 text-xs font-bold transition-all"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('REGISTER')}
                  className="px-4 sm:px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-extrabold text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Free</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🌟 2. SPECTACULAR ROYAL HERO SECTION 🌟 */}
      <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-32 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-rose-600/15 via-amber-500/20 to-purple-600/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Authenticated Welcome Back Pill */}
              {user ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-300/40 text-amber-300 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Welcome back, {user.full_name} 👋
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-300/40 text-amber-300 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> LUXURY DIGITAL INVITATION PLATFORM
                </div>
              )}

              {/* Main Royal Headline */}
              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.1] text-white">
                Create Invitations <br />
                <span className="gold-gradient-text">They Will Never Forget.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-sm sm:text-base md:text-lg font-serif italic max-w-2xl leading-relaxed mx-auto lg:mx-0">
                "Design breathtaking digital invitations with interactive 3D gift unboxing, customize for every honored guest, share in 1-click via WhatsApp, and manage RSVPs effortlessly."
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/events/new"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-extrabold text-sm sm:text-base shadow-[0_0_30px_rgba(255,215,0,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-300"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>{user ? '🚀 Create New Invitation' : '✨ Create Your Invitation'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#designs"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-amber-300/40 transition-all flex items-center justify-center gap-2 hover:border-amber-300"
                >
                  <span>🎨 Explore 16+ Designs</span>
                </a>
              </div>

              {/* Trust Badges Bar */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Mobile Ready
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> WhatsApp Sharing
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> 3D Gift Opening
                </span>
              </div>
            </div>

            {/* Right Hero Visual Centerpiece (3D Royal Card + Gift Box Floating Mockup) */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="w-full max-w-sm sm:max-w-md relative group">
                
                {/* Floating Gift Box Badge */}
                <div className="absolute -top-6 -right-4 z-20 p-3.5 rounded-3xl bg-slate-900/95 border-2 border-amber-400 shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-bounce">
                  <div className="p-2 rounded-2xl bg-amber-400/20 text-amber-300">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-amber-300 font-bold block uppercase tracking-wider">
                      Interactive Unboxing
                    </span>
                    <span className="text-xs font-serif font-bold text-white">
                      🎁 3D Tap to Open
                    </span>
                  </div>
                </div>

                {/* Main 3D Royal Invitation Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #3D0C14 0%, #63182C 50%, #2A060C 100%)',
                  }}
                  className="rounded-[36px] border-2 border-amber-300 p-8 text-center space-y-5 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(255,215,0,0.25)] relative overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500"
                >
                  {/* Sacred Header */}
                  <span className="text-amber-300 text-xs font-serif block tracking-widest drop-shadow">
                    || श्री गणेशाय नमः ||
                  </span>

                  {/* Category Pill */}
                  <div className="inline-block px-3 py-1 rounded-full bg-black/40 border border-amber-300/40 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-200">
                    ROYAL WEDDING INVITATION
                  </div>

                  {/* Couple Title */}
                  <h3 className="font-serif text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md">
                    Rohit & Priya
                  </h3>

                  {/* Quote */}
                  <p className="text-xs font-serif italic text-amber-100/90 leading-relaxed px-2">
                    "Together with our families, we joyfully invite you to celebrate our union."
                  </p>

                  {/* Date & Location */}
                  <div className="space-y-1.5 pt-2 border-t border-amber-300/30">
                    <div className="inline-block py-1 px-4 rounded-full bg-black/40 border border-amber-300/30 text-xs font-mono text-amber-200">
                      🗓️ Friday, 18 December 2026
                    </div>
                    <p className="text-[11px] font-mono text-slate-300">
                      📍 The Taj Palace, Diplomatic Enclave, New Delhi
                    </p>
                  </div>

                  {/* Interactive Button Preview */}
                  <div className="pt-2 flex items-center justify-center gap-2 text-xs">
                    <span className="px-4 py-2 rounded-2xl bg-amber-500 text-black font-extrabold shadow-md flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 fill-black" /> RSVP Attending
                    </span>
                    <span className="px-4 py-2 rounded-2xl bg-purple-900/80 border border-purple-400 text-purple-200 font-bold">
                      🎁 Send Shagun
                    </span>
                  </div>
                </div>

                {/* Floating Guest Pass Badge */}
                <div className="absolute -bottom-6 -left-4 z-20 p-3 rounded-2xl bg-slate-900/95 border border-emerald-400 shadow-xl backdrop-blur-md flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    VIP QR Pass Included
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 3. 6-STEP SIMPLE VISUAL WORKFLOW 🌟 */}
      <section id="how-it-works" className="py-20 bg-slate-950/60 border-y border-amber-300/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold uppercase tracking-wider">
              HOW IT WORKS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Create & Share in 6 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-serif italic">
              Designed so effortlessly that anyone can publish a luxury digital invitation in under 3 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map((wf) => {
              const Icon = wf.icon;
              return (
                <div
                  key={wf.step}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-amber-300/20 space-y-4 hover:border-amber-400/60 transition-all hover:scale-[1.02] shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-amber-400/15 text-amber-300 border border-amber-300/30">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-2xl font-extrabold text-amber-400/40">
                      {wf.step}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {wf.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {wf.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🌟 4. DESIGN SHOWCASE (EXPLORE OUR DESIGNS) 🌟 */}
      <section id="designs" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-amber-300/20 pb-6">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold uppercase tracking-wider">
              DESIGN GALLERY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Explore Royal Invitation Designs
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-serif italic">
              Each design is handcrafted with distinct typography, borders, shlokas, and color palettes.
            </p>
          </div>
          
          <Link
            to="/events/new"
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <span>Create with Any Template</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DESIGN_SHOWCASE.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate('/events/new')}
              className="p-6 rounded-3xl bg-slate-900/90 border border-amber-300/20 hover:border-amber-400 transition-all duration-300 cursor-pointer space-y-4 hover:scale-[1.02] shadow-xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300">
                  {card.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-extrabold">
                  {card.badge}
                </span>
              </div>

              {/* Artwork Box */}
              <div
                style={{ background: card.bgGradient }}
                className={`p-6 rounded-2xl ${card.borderStyle} text-center space-y-2.5 shadow-inner`}
              >
                <span className="text-amber-300 text-xs font-serif block">
                  {card.shloka}
                </span>
                <h4 className="font-serif text-xl font-extrabold text-white drop-shadow-md">
                  {card.title}
                </h4>
                <p className="text-[11px] font-mono text-amber-200">
                  🗓️ {card.date}
                </p>
                <p className="text-[10px] font-mono text-slate-300 truncate">
                  📍 {card.venue}
                </p>
              </div>

              <button
                type="button"
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-amber-500 hover:text-black text-amber-300 font-bold text-xs border border-amber-300/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Use This Design</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 🌟 5. SIGNATURE USPS & FEATURE MATRIX 🌟 */}
      <section id="features" className="py-20 bg-slate-950/60 border-y border-amber-300/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold uppercase tracking-wider">
              FEATURE MATRIX
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Everything Your Celebration Needs
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-serif italic">
              From the initial invitation dispatch to venue QR check-ins and digital blessings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_USPS.map((usp, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/80 border border-amber-300/20 space-y-3 hover:border-amber-400/50 transition-all shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-white">
                    {usp.title}
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {usp.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {usp.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🌟 6. TRUST & SECURITY SECTION 🌟 */}
      <section id="trust" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="p-8 sm:p-12 rounded-[36px] bg-gradient-to-br from-slate-900 via-[#0A1128] to-slate-900 border border-amber-300/30 space-y-8 shadow-2xl">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
              PRIVACY & PLATFORM INTEGRITY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Built for Real Celebrations & Total Trust
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-serif italic">
              We respect your family and guests. Your memories and guest lists are private, encrypted, and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-300">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">256-Bit SSL Encryption</h4>
              <p>All invitations, guest details, and tokens are protected with industry-standard cryptographic encryption.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-2">
              <Smartphone className="w-6 h-6 text-amber-400" />
              <h4 className="font-bold text-white text-sm">No App Download Needed</h4>
              <p>Guests tap the link and instantly experience the 3D unboxing on Android Chrome, iOS Safari, or WhatsApp browser.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-2">
              <KeyRound className="w-6 h-6 text-purple-400" />
              <h4 className="font-bold text-white text-sm">Role-Based Security</h4>
              <p>Strict access controls prevent unauthorized access. Only invited guests and hosts access event administration.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              <h4 className="font-bold text-white text-sm">0% Commission Shagun</h4>
              <p>Direct host UPI links ensure 100% of guest gifts go straight to your account without third-party deductions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 7. FINAL INSPIRATIONAL CTA 🌟 */}
      <section className="py-20 text-center relative overflow-hidden bg-gradient-to-t from-slate-950 via-[#0A1128] to-[#0A1128] border-t border-amber-300/20">
        <div className="max-w-4xl mx-auto px-4 space-y-6 relative z-10">
          <span className="text-amber-400 font-mono text-xs uppercase tracking-widest block font-bold">
            START YOUR CELEBRATION
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            "Your Celebration Deserves More <br />
            <span className="gold-gradient-text">Than An Ordinary Invitation."</span>
          </h2>
          <p className="text-sm sm:text-base font-serif italic text-slate-300 max-w-xl mx-auto">
            Create your personalized digital invitation now and give your loved ones an unforgettable experience.
          </p>
          <div className="pt-4">
            <Link
              to="/events/new"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-extrabold text-sm sm:text-base shadow-[0_0_35px_rgba(255,215,0,0.4)] hover:scale-105 active:scale-95 transition-all border border-amber-300"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{user ? '🚀 Create Your Invitation' : '✨ Start Creating Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 🌟 8. MODALS 🌟 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};
