import React, { useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  XCircle,
  Calendar,
  MapPin,
  Check,
  User,
  Users,
  Utensils,
  ArrowRight,
  Heart,
  Edit2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../services/api';

interface RsvpExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventSlug?: string;
  token?: string;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
  guestName?: string;
  onRsvpSuccess?: (data: any) => void;
}

export const RsvpExperienceModal: React.FC<RsvpExperienceModalProps> = ({
  isOpen,
  onClose,
  eventSlug,
  token,
  eventTitle = "Celebration Invitation",
  eventDate = "Date to be Announced",
  eventVenue = "Celebration Venue",
  guestName: defaultGuestName = "",
  onRsvpSuccess,
}) => {
  // Step state: 'CHOICE' | 'FORM' | 'THANK_YOU'
  const [step, setStep] = useState<'CHOICE' | 'FORM' | 'THANK_YOU'>('CHOICE');

  // Form Fields
  const [selectedStatus, setSelectedStatus] = useState<'CONFIRMED' | 'MAYBE' | 'NOT_ATTENDING'>('CONFIRMED');
  const [guestNameInput, setGuestNameInput] = useState(defaultGuestName);
  const [phoneInput, setPhoneInput] = useState('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [mealPreference, setMealPreference] = useState<'Veg (only)' | 'Non-Veg (only)' | 'Jain (only)' | 'Any'>('Veg (only)');
  const [specialNotes, setSpecialNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  if (!isOpen) return null;

  const handleSelectChoice = (status: 'CONFIRMED' | 'MAYBE' | 'NOT_ATTENDING') => {
    setSelectedStatus(status);
    if (status === 'CONFIRMED') {
      setStep('FORM');
    } else {
      // Single-click instant submission for Maybe or Not Attending
      handleDirectSubmit(status, 1, 'Any', '');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleDirectSubmit(selectedStatus, guestCount, mealPreference, specialNotes);
  };

  const handleDirectSubmit = async (
    statusVal: string,
    countVal: number,
    mealVal: string,
    notesVal: string
  ) => {
    setSubmitting(true);
    try {
      const endpoint = token
        ? `/public/invitations/t/${token}/rsvp`
        : `/public/events/${eventSlug}/rsvp`;

      const res = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          guest_name: guestNameInput || defaultGuestName || 'Valued Guest',
          phone: phoneInput || undefined,
          status: statusVal,
          adults_attending: countVal,
          meal_preference: mealVal,
          notes: notesVal,
        }),
      });

      const responseData = res.data || {
        guest_name: guestNameInput || defaultGuestName || 'Valued Guest',
        status: statusVal,
        adults_attending: countVal,
        meal_preference: mealVal,
      };

      setSubmittedData(responseData);
      setStep('THANK_YOU');
      if (onRsvpSuccess) onRsvpSuccess(responseData);
    } catch (err: any) {
      alert(err.message || 'Could not submit RSVP response.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'VG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-[#FFF8F5] border border-[#DAC0C2] rounded-3xl max-w-xl w-full p-6 sm:p-8 text-[#1F1B18] shadow-2xl relative my-auto space-y-6">
        
        {/* STEP 1: CHOICE SCREEN (Hero & 3 Big Choice Cards) */}
        {step === 'CHOICE' && (
          <div className="space-y-6 text-center">
            {/* Header Tagline */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B1D2F] font-extrabold block">
                PRIVATE INVITATION
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4E051A]">
                Will you grace us with your presence?
              </h2>
              <p className="text-xs text-[#544244] max-w-md mx-auto leading-relaxed">
                Your presence and blessings will make our celebration complete. Please confirm your attendance.
              </p>
            </div>

            {/* Date & Venue Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-full bg-[#F6ECE7] border border-[#DAC0C2] text-[#1F1B18] font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6B1D2F]" /> {eventDate}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#F6ECE7] border border-[#DAC0C2] text-[#1F1B18] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#6B1D2F]" /> {eventVenue}
              </span>
            </div>

            {/* 3D Invitation Card Illustration */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FFF8F5] to-[#F6ECE7] border border-[#DAC0C2] max-w-sm mx-auto shadow-inner relative overflow-hidden group">
              <div className="text-center space-y-1">
                <span className="font-serif text-lg font-bold text-[#4E051A] block">{eventTitle}</span>
                <span className="text-[10px] font-mono text-[#877274] uppercase block tracking-wider">Celebration Invitation</span>
              </div>
            </div>

            <p className="text-xs font-serif italic text-[#877274]">We eagerly await the pleasure of your company.</p>

            {/* 3 Primary RSVP CTA Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Yes */}
              <button
                type="button"
                onClick={() => handleSelectChoice('CONFIRMED')}
                className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-600/80 hover:border-emerald-700 text-emerald-950 flex flex-col items-center justify-center text-center space-y-1 shadow-sm hover:shadow-md hover:scale-102 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-sm block">Attending</span>
                <span className="text-[11px] text-emerald-800 font-semibold block">Accept with joy</span>
              </button>

              {/* Option 2: Maybe */}
              <button
                type="button"
                onClick={() => handleSelectChoice('MAYBE')}
                className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 hover:border-amber-500 text-amber-950 flex flex-col items-center justify-center text-center space-y-1 shadow-sm hover:shadow-md hover:scale-102 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-sm block">Thinking</span>
                <span className="text-[11px] text-amber-800 font-semibold block">Tentative</span>
              </button>

              {/* Option 3: No */}
              <button
                type="button"
                onClick={() => handleSelectChoice('NOT_ATTENDING')}
                className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 hover:border-rose-400 text-rose-950 flex flex-col items-center justify-center text-center space-y-1 shadow-sm hover:shadow-md hover:scale-102 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-9 h-9 rounded-full bg-rose-700 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
                  <XCircle className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-sm block">Declining</span>
                <span className="text-[11px] text-rose-800 font-semibold block">Sending blessings</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-[#877274] hover:text-[#1F1B18] hover:underline"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DETAILED FORM SCREEN (for Yes / Confirmed) */}
        {step === 'FORM' && (
          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Header & Back bar */}
            <div className="flex items-center justify-between border-b border-[#DAC0C2] pb-3">
              <button
                type="button"
                onClick={() => setStep('CHOICE')}
                className="text-xs font-bold text-[#6B1D2F] hover:underline flex items-center gap-1"
              >
                ← Back
              </button>
              <span className="text-[10px] font-mono text-[#877274] flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> Secure & Private
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl font-extrabold text-[#4E051A]">RSVP Details</h3>
              <p className="text-xs text-[#544244]">Tell us a little more so we can make your celebration experience unforgettable.</p>
            </div>

            {/* Personalized Guest Pill */}
            <div className="p-3 rounded-2xl bg-[#F6ECE7] border border-[#DAC0C2] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6B1D2F] text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {getInitials(guestNameInput)}
                </div>
                <div>
                  <input
                    type="text"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    placeholder="Your Name"
                    className="font-bold text-sm text-[#1F1B18] bg-transparent border-b border-[#877274] focus:border-[#4E051A] outline-none"
                  />
                  <span className="text-[10px] text-[#877274] block font-mono">Invited Guest</span>
                </div>
              </div>

              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="WhatsApp Phone (Optional)"
                className="px-3 py-1.5 rounded-xl bg-white border border-[#DAC0C2] text-xs text-[#1F1B18] w-36 outline-none"
              />
            </div>

            {/* Number of Guests Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1F1B18] block uppercase tracking-wider font-mono">
                Number of Guests
              </label>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { num: 1, label: '1', sub: 'Just me' },
                  { num: 2, label: '2', sub: 'Me + 1' },
                  { num: 3, label: '3', sub: 'Me + 2' },
                  { num: 4, label: '4+', sub: 'Family' },
                ].map((opt) => (
                  <button
                    key={opt.num}
                    type="button"
                    onClick={() => setGuestCount(opt.num)}
                    className={`p-2.5 rounded-xl border font-bold text-xs transition-all ${
                      guestCount === opt.num
                        ? 'bg-[#6B1D2F] text-white border-[#4E051A] shadow-md scale-102'
                        : 'bg-white border-[#DAC0C2] text-[#1F1B18] hover:bg-[#F6ECE7]'
                    }`}
                  >
                    <span className="font-extrabold text-sm block">{opt.label}</span>
                    <span className="text-[9px] block opacity-80">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Preference Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1F1B18] block uppercase tracking-wider font-mono">
                Dietary Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[
                  { id: 'Veg (only)', label: '🌱 Pure Veg', sub: 'Vegetarian' },
                  { id: 'Jain (only)', label: '🙏 Jain', sub: 'No onion/garlic' },
                  { id: 'Non-Veg (only)', label: '🍗 Non-Veg', sub: 'Halal/Non-Veg' },
                  { id: 'Any', label: '🍲 Any', sub: "No preference" },
                ].map((meal) => (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => setMealPreference(meal.id as any)}
                    className={`p-2.5 rounded-xl border font-bold text-xs transition-all ${
                      mealPreference === meal.id
                        ? 'bg-[#6B1D2F] text-white border-[#4E051A] shadow-md scale-102'
                        : 'bg-white border-[#DAC0C2] text-[#1F1B18] hover:bg-[#F6ECE7]'
                    }`}
                  >
                    <span className="font-bold text-xs block">{meal.label}</span>
                    <span className="text-[9px] block opacity-80">{meal.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Any Special Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F1B18] block font-mono">
                Note for the Hosts (Optional)
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Leave a wish or let us know any dietary / accessibility requirements..."
                rows={2}
                className="w-full p-3 rounded-2xl bg-white border border-[#DAC0C2] text-xs text-[#1F1B18] placeholder:text-[#877274] outline-none focus:border-[#4E051A]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-full bg-[#6B1D2F] hover:bg-[#83243A] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{submitting ? 'Confirming RSVP...' : 'Confirm RSVP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 3: THANK YOU / CONFIRMATION SCREEN */}
        {step === 'THANK_YOU' && (
          <div className="space-y-5 text-center py-2">
            {/* Circle Checkmark Icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-600/80 text-emerald-700 flex items-center justify-center mx-auto shadow-md animate-bounce">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-extrabold block">
                {submittedData?.status_label || (submittedData?.status === 'NO' ? 'RESPONSE RECORDED' : 'ATTENDANCE CONFIRMED')}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4E051A]">Thank You!</h2>
              <p className="text-xs text-[#544244]">
                {submittedData?.status === 'NO' 
                  ? 'We will miss you at the celebration!' 
                  : "Your RSVP response has been recorded. We can't wait to celebrate with you!"}
              </p>
            </div>

            {/* Structured Review Card */}
            <div className="p-4 rounded-2xl bg-[#F6ECE7] border border-[#DAC0C2] max-w-sm mx-auto space-y-3 text-xs shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-[#DAC0C2] pb-2">
                <span className="text-[10px] font-mono text-[#877274] uppercase tracking-wider font-bold">GUEST IDENTITY</span>
                <span className="font-bold text-[#1F1B18]">{submittedData?.guest_name || guestNameInput || 'Valued Guest'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-[#DAC0C2] pb-2">
                <span className="text-[10px] font-mono text-[#877274] uppercase tracking-wider font-bold">GUESTS ATTENDING</span>
                <span className="font-extrabold text-emerald-800">
                  {submittedData?.status === 'NO' ? '0 (Not Attending)' : `${submittedData?.adults_attending || guestCount} guest(s)`}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#DAC0C2] pb-2">
                <span className="text-[10px] font-mono text-[#877274] uppercase tracking-wider font-bold">DIETARY PREFERENCE</span>
                <span className="font-bold text-[#1F1B18]">{submittedData?.meal_preference || mealPreference}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#877274] uppercase tracking-wider font-bold">CELEBRATION</span>
                <span className="font-serif font-bold text-[#1F1B18] truncate max-w-[160px]">{eventTitle}</span>
              </div>
            </div>

            {/* Quick Actions: Calendar + Change RSVP + Close */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&location=${encodeURIComponent(eventVenue)}`;
                  window.open(gcalUrl, '_blank', 'noopener,noreferrer');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Add to Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('CHOICE')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-[#F6ECE7] text-[#6B1D2F] border border-[#DAC0C2] font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Change RSVP</span>
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-sm py-3 rounded-full bg-[#6B1D2F] hover:bg-[#83243A] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Back to Celebration
              </button>
            </div>

            <p className="text-[10px] font-serif italic text-[#877274] block pt-1">
              Together, we make celebrations memorable ♡
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
