import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { VoiceChatAssistantModal } from './components/VoiceChatAssistantModal';
import { MobileBottomNav } from './components/MobileBottomNav';

// Code-split route components for high performance on mobile
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EventWizardPage = lazy(() => import('./pages/EventWizardPage').then(m => ({ default: m.EventWizardPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const PublicEventPage = lazy(() => import('./pages/PublicEventPage').then(m => ({ default: m.PublicEventPage })));
const ScannerPage = lazy(() => import('./pages/ScannerPage').then(m => ({ default: m.ScannerPage })));
const WelcomeScreenPage = lazy(() => import('./pages/WelcomeScreenPage').then(m => ({ default: m.WelcomeScreenPage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const MasterContactsPage = lazy(() => import('./pages/MasterContactsPage').then(m => ({ default: m.MasterContactsPage })));

const RouteLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-9 h-9 border-3 border-[#D8B5B0] border-t-[#9E6F6D] rounded-full animate-spin" />
    <span className="text-xs font-serif font-bold text-[#8C7E80] tracking-wide">
      Nimantran AI • Loading...
    </span>
  </div>
);

const LayoutShell: React.FC = () => {
  const location = useLocation();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Automatically open AI Concierge modal if URL path is /ai or /ai-concierge
  useEffect(() => {
    if (location.pathname === '/ai' || location.pathname === '/ai-concierge' || location.hash === '#ai-concierge') {
      setIsVoiceModalOpen(true);
    }
  }, [location]);

  // Check if current route is a standalone full-screen page (Public Event, Scanner, Welcome TV, Auth)
  const isStandalonePage =
    location.pathname.startsWith('/i/') ||
    location.pathname.startsWith('/scan/') ||
    location.pathname.startsWith('/welcome/') ||
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/auth';

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] text-[#302829] flex flex-col justify-between selection:bg-[#E9D3D0] selection:text-[#302829]">
        <main className="flex-grow">
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/i/t/:token" element={<PublicEventPage />} />
              <Route path="/i/:slug" element={<PublicEventPage />} />
              <Route path="/i/:slug/pass" element={<PublicEventPage />} />
              <Route path="/scan/:eventId" element={<ScannerPage />} />
              <Route path="/welcome/:eventId" element={<WelcomeScreenPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        {!location.pathname.startsWith('/i/') && !location.pathname.startsWith('/scan/') && !location.pathname.startsWith('/welcome/') && (
          <Footer />
        )}
      </div>
    );
  }

  // 3-COLUMN FULL-WIDTH LAYOUT FOR HOST APP PAGES
  return (
    <div className="min-h-screen bg-[#FAF7F3] text-[#302829] flex w-full overflow-x-hidden selection:bg-[#E9D3D0] selection:text-[#302829]">
      {/* 1. LEFT NAVIGATION SIDEBAR */}
      <LeftSidebar className="hidden xl:flex" onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />

      {/* 2. CENTER MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FAF7F3]">
        <Navbar onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-24 xl:pb-8">
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />} />
              <Route path="/ai" element={<DashboardPage defaultOpenAiModal={true} onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />} />
              <Route path="/ai-concierge" element={<DashboardPage defaultOpenAiModal={true} onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />} />
              <Route path="/contacts" element={<MasterContactsPage />} />
              <Route path="/events/new" element={<EventWizardPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/credits" element={<BillingPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>

      {/* 3. RIGHT UTILITY WIDGET SIDEBAR */}
      <RightSidebar className="hidden xl:block" onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />

      {/* 4. MOBILE BOTTOM NAVIGATION BAR FOR ANDROID/IOS */}
      <MobileBottomNav onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />

      {/* AI Voice & Chat Assistant Modal */}
      <VoiceChatAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <LayoutShell />
    </Router>
  );
};

export default App;
