import React from 'react';
import { 
  Calendar, Palette, Users, Eye, Globe, Send, CheckCircle2, 
  QrCode, Sparkles, ChevronRight, AlertTriangle, ArrowRight, 
  Clock, ShieldCheck, Check, Heart, Bell
} from 'lucide-react';

export interface CelebrationWorkspaceJourneyProps {
  event: any;
  guests: any[];
  activeTab: string;
  onSelectTab: (tab: 'guests' | 'attendance' | 'memories' | 'import' | 'campaigns' | 'card' | 'reminders') => void;
  onOpenEditEvent: () => void;
  onOpenPublishModal: () => void;
  onOpenSendInvitations: () => void;
  onOpenScanner: () => void;
  onOpenStoryStudio?: () => void;
}

export const CelebrationWorkspaceJourney: React.FC<CelebrationWorkspaceJourneyProps> = ({
  event,
  guests,
  activeTab,
  onSelectTab,
  onOpenEditEvent,
  onOpenPublishModal,
  onOpenSendInvitations,
  onOpenScanner,
  onOpenStoryStudio,
}) => {
  if (!event) return null;

  // 1. Calculate completion states for each phase
  const totalGuests = guests.length;
  const isPublished = event.status === 'PUBLISHED' || event.status === 'ACTIVE';
  const hasGuests = totalGuests > 0;
  const hasEventDetails = Boolean(event.title && event.venue_name && event.start_date);
  const hasDesign = Boolean(event.theme_config?.theme_id || event.theme_config?.card_design_id);
  
  const sentGuests = guests.filter(
    (g) => g.invitation_sent || g.delivery_status === 'SENT' || g.delivery_status === 'DELIVERED' || g.delivery_status === 'READ'
  ).length;
  const hasSentInvites = sentGuests > 0;

  const rsvpYes = guests.filter((g) => g.rsvp_status === 'YES' || g.rsvp_status === 'CONFIRMED').length;
  const rsvpMaybe = guests.filter((g) => g.rsvp_status === 'MAYBE').length;
  const rsvpNo = guests.filter((g) => g.rsvp_status === 'NO').length;
  const totalRsvps = rsvpYes + rsvpMaybe + rsvpNo;
  const hasRsvps = totalRsvps > 0;

  const attended = guests.filter((g) => g.attendance_status === 'ATTENDED').length;
  const hasCheckins = attended > 0;

  const memoriesList = event.theme_config?.memories || [];
  const hasMemories = memoriesList.length > 0;

  // 2. Define the Complete User Journey Steps
  const journeySteps = [
    {
      id: 'details',
      label: 'Event Details',
      icon: Calendar,
      isCompleted: hasEventDetails,
      isRequired: true,
      currentCondition: activeTab === 'card' && !hasDesign,
      action: onOpenEditEvent,
      description: `${event.venue_name || 'Venue set'} • ${event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Date set'}`,
      badge: 'Step 1',
    },
    {
      id: 'design',
      label: 'Invitation Design',
      icon: Palette,
      isCompleted: true, // Always initialized with theme
      isRequired: true,
      currentCondition: activeTab === 'card',
      action: () => onSelectTab('card'),
      description: event.theme_config?.theme_id ? `Theme: ${event.theme_config.theme_id}` : 'Luxury Card & Theme',
      badge: 'Step 2',
    },
    {
      id: 'guests',
      label: 'Guest List',
      icon: Users,
      isCompleted: hasGuests,
      isRequired: true,
      currentCondition: activeTab === 'guests',
      action: () => onSelectTab('guests'),
      description: hasGuests ? `${totalGuests} guests added` : 'Add or import guests',
      badge: 'Step 3',
    },
    {
      id: 'preview',
      label: 'Preview & Test',
      icon: Eye,
      isCompleted: hasGuests, // Able to preview once draft exists
      isRequired: true,
      currentCondition: false,
      action: onOpenPublishModal,
      description: 'Check mobile & card preview',
      badge: 'Step 4',
    },
    {
      id: 'publish',
      label: 'Publish Event',
      icon: Globe,
      isCompleted: isPublished,
      isRequired: true,
      currentCondition: !isPublished,
      action: onOpenPublishModal,
      description: isPublished ? 'Live & accessible online' : 'Draft • Click to make live',
      badge: 'Step 5',
    },
    {
      id: 'send',
      label: 'Send Invitations',
      icon: Send,
      isCompleted: hasSentInvites,
      isRequired: true,
      currentCondition: activeTab === 'campaigns',
      action: onOpenSendInvitations,
      description: hasSentInvites ? `${sentGuests} sent • WhatsApp / SMS` : 'Share with loved ones',
      badge: 'Step 6',
    },
    {
      id: 'rsvp',
      label: 'RSVP Tracking',
      icon: CheckCircle2,
      isCompleted: hasRsvps,
      isRequired: false,
      currentCondition: activeTab === 'reminders',
      action: () => onSelectTab('reminders'),
      description: hasRsvps ? `${rsvpYes} confirmed attending` : 'Track guest responses',
      badge: 'Step 7',
    },
    {
      id: 'checkin',
      label: 'Event Check-in',
      icon: QrCode,
      isCompleted: hasCheckins,
      isRequired: false,
      currentCondition: activeTab === 'attendance',
      action: () => onSelectTab('attendance'),
      description: hasCheckins ? `${attended} guests checked in` : 'QR Pass reception scanner',
      badge: 'Step 8',
    },
    {
      id: 'memories',
      label: 'Story & Memories',
      icon: Heart,
      isCompleted: hasMemories,
      isRequired: false,
      isOptional: true,
      currentCondition: activeTab === 'memories',
      action: () => onSelectTab('memories'),
      description: hasMemories ? `${memoriesList.length} moments added` : 'Optional • Photo timeline',
      badge: 'Optional',
    },
  ];

  // 3. Compute Answers to the 5 Core User Questions
  // Q1: Where am I?
  let whereAmI = 'Managing Your Celebration';
  if (!isPublished) {
    whereAmI = 'Finalizing Celebration Setup (Draft Mode)';
  } else if (!hasSentInvites) {
    whereAmI = 'Ready to Send Invitations to Guests';
  } else if (hasCheckins) {
    whereAmI = 'Celebration Reception & Attendance';
  } else if (hasSentInvites) {
    whereAmI = 'Tracking Invitations & Guest RSVPs';
  }

  // Q2: What have I completed?
  const requiredSteps = journeySteps.filter((s) => s.isRequired);
  const completedRequired = requiredSteps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedRequired / requiredSteps.length) * 100);

  // Q3: What is the next step?
  let nextStepTitle = 'Send Invitations';
  let nextStepSub = 'Dispatch beautiful digital invitations to your guests via WhatsApp or SMS';
  let nextStepAction = onOpenSendInvitations;
  let nextStepIcon = Send;

  if (!hasGuests) {
    nextStepTitle = 'Add or Import Guests';
    nextStepSub = 'Add contacts or import your phonebook into the guest list';
    nextStepAction = () => onSelectTab('guests');
    nextStepIcon = Users;
  } else if (!isPublished) {
    nextStepTitle = 'Publish Celebration';
    nextStepSub = 'Make your celebration invitation live and generate shareable links';
    nextStepAction = onOpenPublishModal;
    nextStepIcon = Globe;
  } else if (!hasSentInvites) {
    nextStepTitle = 'Send Invitations';
    nextStepSub = 'Send invitations to all guests with personalized links';
    nextStepAction = onOpenSendInvitations;
    nextStepIcon = Send;
  } else if (totalGuests > sentGuests) {
    nextStepTitle = `Send Remaining (${totalGuests - sentGuests} pending)`;
    nextStepSub = 'Send invitations to guests who have not received their link yet';
    nextStepAction = onOpenSendInvitations;
    nextStepIcon = Send;
  } else if (totalRsvps < totalGuests) {
    nextStepTitle = 'Send RSVP Reminders';
    nextStepSub = 'Send gentle reminder messages to guests who have not responded';
    nextStepAction = () => onSelectTab('reminders');
    nextStepIcon = Bell;
  } else {
    nextStepTitle = 'Open Event Check-in Gate';
    nextStepSub = 'Scan QR passes or welcome guests at the reception';
    nextStepAction = () => onSelectTab('attendance');
    nextStepIcon = QrCode;
  }

  // Q4: What can I skip?
  const skippableNote = 'Story & Memories is optional and can be updated anytime before or after your event.';

  // Q5: What requires attention?
  const attentionItems: { type: 'alert' | 'warning' | 'info'; text: string; action?: () => void; btnText?: string }[] = [];
  
  if (!isPublished) {
    attentionItems.push({
      type: 'warning',
      text: 'Celebration is currently in DRAFT mode. Guests cannot access the invitation link until you publish.',
      action: onOpenPublishModal,
      btnText: 'Publish Now',
    });
  }

  if (totalGuests === 0) {
    attentionItems.push({
      type: 'alert',
      text: 'Your guest list is empty. Add your friends and family to send invitations.',
      action: () => onSelectTab('guests'),
      btnText: 'Add Guests',
    });
  } else if (sentGuests < totalGuests) {
    const uninvitedCount = totalGuests - sentGuests;
    attentionItems.push({
      type: 'info',
      text: `${uninvitedCount} guest${uninvitedCount > 1 ? 's have' : ' has'} not received invitations yet.`,
      action: onOpenSendInvitations,
      btnText: 'Send Invitations',
    });
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-[#E9D3D0] p-6 sm:p-8 shadow-xl space-y-6">
      
      {/* 🌟 1. CELEBRATION WORKSPACE HEADER & PROGRESS OVERVIEW 🌟 */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#E9D3D0]/70 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#F2E5E2] text-[#9E6F6D] font-mono text-[10px] font-extrabold tracking-widest uppercase border border-[#E9D3D0]">
              CELEBRATION WORKSPACE
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
              isPublished 
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {isPublished ? '🟢 Live & Published' : '🟡 Draft Mode'}
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#302829] mt-2">
            {whereAmI}
          </h2>
          <p className="text-xs text-[#7A6B6C] mt-1">
            Follow the guided celebration roadmap below to prepare, invite, and celebrate with your guests.
          </p>
        </div>

        {/* Progress Tracker Widget */}
        <div className="bg-[#FFF9F6] p-4 rounded-2xl border border-[#E9D3D0] min-w-[240px] w-full lg:w-auto text-right">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs font-bold text-[#7A6B6C]">Journey Progress</span>
            <span className="text-sm font-extrabold font-serif text-[#9E6F6D]">
              {completedRequired} of {requiredSteps.length} Steps ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#E9D3D0]/60 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#9E6F6D] via-[#C9AA78] to-emerald-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 🌟 2. INTERACTIVE HORIZONTAL MILESTONE ROADMAP 🌟 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E6F6D] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C9AA78]" /> Celebration Journey Steps (Click any step to open)
          </span>
          <span className="text-[11px] text-[#7A6B6C] hidden sm:inline">
            {skippableNote}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
          {journeySteps.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = step.currentCondition;

            return (
              <button
                key={step.id}
                onClick={step.action}
                className={`text-left p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative group hover:scale-[1.03] ${
                  step.isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-sm'
                    : isCurrent
                    ? 'bg-[#FFF9F6] border-[#9E6F6D] shadow-md ring-2 ring-[#9E6F6D]/30'
                    : 'bg-[#FAF7F3] border-[#E9D3D0] text-[#7A6B6C] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    step.isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-[#9E6F6D] text-white'
                      : 'bg-[#E9D3D0] text-[#7A6B6C]'
                  }`}>
                    {step.isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    step.isCompleted
                      ? 'bg-emerald-200 text-emerald-900'
                      : step.isOptional
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-[#E9D3D0] text-[#7A6B6C]'
                  }`}>
                    {step.isCompleted ? '✓ Done' : step.badge}
                  </span>
                </div>

                <div>
                  <h4 className={`text-xs font-extrabold truncate ${
                    step.isCompleted ? 'text-emerald-900' : 'text-[#302829]'
                  }`}>
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-[#7A6B6C] truncate mt-0.5 leading-tight">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 3. NEXT RECOMMENDED ACTION + ATTENTION BANNER 🌟 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Next Recommended Step Card */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-gradient-to-br from-[#9E6F6D] via-[#875B59] to-[#63182C] text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
              <ArrowRight className="w-3 h-3 text-[#C9AA78]" /> NEXT RECOMMENDED STEP
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-extrabold text-white">
              {nextStepTitle}
            </h3>
            <p className="text-xs text-rose-100 leading-snug">
              {nextStepSub}
            </p>
          </div>

          <button
            onClick={nextStepAction}
            className="px-6 py-3 rounded-full bg-white text-[#875B59] hover:bg-[#FAF7F3] font-extrabold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap self-stretch sm:self-center justify-center"
          >
            {React.createElement(nextStepIcon, { className: 'w-4 h-4 text-[#875B59]' })}
            <span>Proceed Now →</span>
          </button>
        </div>

        {/* Attention & Status Alerts */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2.5">
          {attentionItems.length > 0 ? (
            attentionItems.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  item.type === 'alert'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : item.type === 'warning'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-blue-50 border-blue-300 text-blue-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-current" />
                  <span className="font-medium text-[11px] leading-tight">{item.text}</span>
                </div>
                {item.action && (
                  <button
                    onClick={item.action}
                    className="px-3 py-1.5 rounded-xl bg-white text-[#302829] font-bold text-[10px] shadow-sm hover:scale-105 border shrink-0 transition-transform"
                  >
                    {item.btnText || 'Action'}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 text-xs h-full">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Everything is in order!</p>
                <p className="text-[11px] text-emerald-700">All required celebration details are configured and up to date.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
