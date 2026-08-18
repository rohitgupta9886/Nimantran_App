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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-xl w-full p-6 text-[#302829] shadow-2xl relative my-auto space-y-6">
        
        {/* STEP 1: CHOICE SCREEN (Hero & 3 Big Choice Cards) */}
        {step === 'CHOICE' && (
          <div className="space-y-6 text-center">
            {/* Header Tagline */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9E6F6D] font-extrabold block">
                YOU'RE INVITED
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold gold-gradient-text">
                A special celebration awaits you
              </h2>
              <p className="text-xs text-[#51484A] max-w-md mx-auto leading-relaxed">
                Your presence will make our celebration even more special. Please confirm your attendance.
              </p>
            </div>

            {/* Date & Venue Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-full bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#9E6F6D]" /> {eventDate}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#9E6F6D]" /> {eventVenue}
              </span>
            </div>

            {/* 3D Invitation Card Illustration */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF7F3] to-[#F2E5E2] border border-[#D8B5B0] max-w-sm mx-auto shadow-inner relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-rose-300 opacity-20 group-hover:scale-110 transition-transform">
                🌸
              </div>
              <div className="text-center space-y-1">
                <span className="font-serif text-lg font-bold gold-gradient-text block">{eventTitle}</span>
                <span className="text-[10px] font-mono text-[#8C7E80] uppercase block tracking-wider">Celebration Invitation</span>
              </div>
            </div>

            <p className="text-xs font-serif italic text-[#8C7E80]">We would love to celebrate with you!</p>

            {/* 3 Primary RSVP CTA Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Yes */}
              <button
                type="button"
                onClick={() => handleSelectChoice('CONFIRMED')}
                className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/80 hover:border-emerald-600 text-emerald-950 flex flex-col items-center justify-center text-center space-y-1 shadow-sm hover:shadow-md hover:scale-102 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-sm block">I'll Be There</span>
                <span className="text-[11px] text-emerald-800 font-semibold block">Yes, I'll attend</span>
              </button>

              {/* Option 2: Maybe */}
              <button
                type="button"
                onClick={() => handleSelectChoice('MAYBE')}
                className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 hover:border-amber-500 text-amber-950 flex flex-col items-center justify-center text-center space-y-1 shadow-sm hover:shadow-md hover:scale-102 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-sm block">Maybe</span>
                <span className="text-[11px] text-amber-800 font-semibold block">Not sure yet</span>
              </button>

              {/* Option 3: No */}
              <button
                type="button"
                onClick={() => handleSelectChoice('NOT_ATTENDING')}
                className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 hover:border-rose-400 text-rose-950 flex flex-col items-center justify-center text-center space-y-1 shadow-sm hover:shadow-md hover:scale-102 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
                  <XCircle className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-sm block">I Can't Make It</span>
                <span className="text-[11px] text-rose-800 font-semibold block">Unfortunately</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-[#8C7E80] hover:text-[#302829] hover:underline"
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
            <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3">
              <button
                type="button"
                onClick={() => setStep('CHOICE')}
                className="text-xs font-bold text-[#9E6F6D] hover:underline flex items-center gap-1"
              >
                ← Back
              </button>
              <span className="text-[10px] font-mono text-[#8C7E80] flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> Secure & Private
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl font-extrabold text-[#302829]">RSVP Details</h3>
              <p className="text-xs text-[#8C7E80]">Tell us a little more so we can make your experience even better.</p>
            </div>

            {/* Personalized Guest Pill */}
            <div className="p-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#9E6F6D] text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {getInitials(guestNameInput)}
                </div>
                <div>
                  <input
                    type="text"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    placeholder="Your Name"
                    className="font-bold text-sm text-[#302829] bg-transparent border-b border-[#D8B5B0] focus:border-[#9E6F6D] outline-none"
                  />
                  <span className="text-[10px] text-[#8C7E80] block font-mono">Invited Guest</span>
                </div>
              </div>

              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="WhatsApp Phone (Optional)"
                className="px-3 py-1.5 rounded-xl bg-[#FFFDFC] border border-[#E9D3D0] text-xs text-[#302829] w-36 outline-none"
              />
            </div>

            {/* Number of Guests Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#302829] block uppercase tracking-wider font-mono">
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
                        ? 'bg-[#9E6F6D] text-white border-[#875B59] shadow-md scale-102'
                        : 'bg-[#FFFDFC] border-[#E9D3D0] text-[#302829] hover:bg-[#FAF7F3]'
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
              <label className="text-xs font-bold text-[#302829] block uppercase tracking-wider font-mono">
                Meal Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[
                  { id: 'Veg (only)', label: '🌱 Veg', sub: '(pure veg)' },
                  { id: 'Jain (only)', label: '🙏 Jain', sub: '(no onion/garlic)' },
                  { id: 'Non-Veg (only)', label: '🍗 Non-Veg', sub: '(halal/non-veg)' },
                  { id: 'Any', label: '🍲 Any', sub: "(no preference)" },
                ].map((meal) => (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => setMealPreference(meal.id as any)}
                    className={`p-2.5 rounded-xl border font-bold text-xs transition-all ${
                      mealPreference === meal.id
                        ? 'bg-[#9E6F6D] text-white border-[#875B59] shadow-md scale-102'
                        : 'bg-[#FFFDFC] border-[#E9D3D0] text-[#302829] hover:bg-[#FAF7F3]'
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
              <label className="text-xs font-bold text-[#302829] block font-mono">
                Any special message? (Optional)
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Allergies, accessibility needs, special requests..."
                rows={2}
                className="w-full p-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-xs text-[#302829] placeholder:text-[#8C7E80] outline-none focus:border-[#9E6F6D]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Confirming RSVP...' : 'Confirm My RSVP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 3: THANK YOU / CONFIRMATION SCREEN */}
        {step === 'THANK_YOU' && (
          <div className="space-y-5 text-center py-2">
            {/* Circle Checkmark Icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500/80 text-emerald-700 flex items-center justify-center mx-auto shadow-md animate-bounce">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-extrabold block">
                {submittedData?.status_label || (submittedData?.status === 'NO' ? 'RESPONSE RECORDED' : 'ATTENDANCE CONFIRMED')}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold gold-gradient-text">Thank You!</h2>
              <p className="text-xs text-[#51484A]">
                {submittedData?.status === 'NO' 
                  ? 'We will miss you at the celebration!' 
                  : "Your RSVP response has been confirmed. We can't wait to celebrate with you!"}
              </p>
            </div>

            {/* Structured Review Card */}
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] max-w-sm mx-auto space-y-3 text-xs shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-2">
                <span className="text-[10px] font-mono text-[#8C7E80] uppercase tracking-wider font-bold">GUEST IDENTITY</span>
                <span className="font-bold text-[#302829]">{submittedData?.guest_name || guestNameInput || 'Valued Guest'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-2">
                <span className="text-[10px] font-mono text-[#8C7E80] uppercase tracking-wider font-bold">GUESTS ATTENDING</span>
                <span className="font-extrabold text-emerald-800">
                  {submittedData?.status === 'NO' ? '0 (Not Attending)' : `${submittedData?.adults_attending || guestCount} guest(s)`}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-2">
                <span className="text-[10px] font-mono text-[#8C7E80] uppercase tracking-wider font-bold">MEAL PREFERENCE</span>
                <span className="font-bold text-[#302829]">{submittedData?.meal_preference || mealPreference}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8C7E80] uppercase tracking-wider font-bold">CELEBRATION</span>
                <span className="font-serif font-bold text-[#302829] truncate max-w-[160px]">{eventTitle}</span>
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
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#FAF7F3] hover:bg-[#F2E5E2] text-[#9E6F6D] border border-[#D8B5B0] font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Change RSVP</span>
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-sm py-3 rounded-2xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Back to Celebration
              </button>
            </div>

            <p className="text-[10px] font-serif italic text-[#8C7E80] block pt-1">
              Together, we make celebrations beautiful ♡
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
