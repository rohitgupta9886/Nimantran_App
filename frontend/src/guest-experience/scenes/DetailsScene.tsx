import React, { useState } from 'react';
import { Calendar, MapPin, Download, Navigation, Copy, Check, Sparkles } from 'lucide-react';
import { downloadIcsCalendarFile } from '../../utils/calendarExport';

interface DetailsSceneProps {
  title: string;
  startDate?: string;
  formattedDate: string;
  formattedTime: string;
  venueName?: string;
  venueAddress?: string;
  fullVenue: string;
  mapsUrl: string;
}

export const DetailsScene: React.FC<DetailsSceneProps> = ({
  title,
  startDate,
  formattedDate,
  formattedTime,
  venueName,
  venueAddress,
  fullVenue,
  mapsUrl,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = () => {
    try {
      navigator.clipboard.writeText(fullVenue || 'Grand Heritage Palace');
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    } catch (e) {}
  };

  return (
    <section id="venue-details-chapter" className="space-y-5 font-sans">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>WHEN & WHERE WE CELEBRATE</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
          Event Schedule & Location
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date Card */}
        <div
          className="p-6 rounded-3xl border-2 border-amber-300/80 shadow-2xl backdrop-blur-2xl space-y-4 text-center flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(45, 10, 22, 0.95) 0%, rgba(20, 4, 10, 0.98) 100%)',
          }}
        >
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/50 flex items-center justify-center mx-auto text-amber-300 shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Date & Time</h3>
            <p className="text-amber-200 font-serif text-base font-semibold">{formattedDate}</p>
            <p className="text-amber-100/80 text-xs font-mono">Starts at {formattedTime}</p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                title || 'Celebration'
              )}&dates=${
                startDate
                  ? new Date(startDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
                  : ''
              }&details=${encodeURIComponent(
                `You are warmly invited to ${title || 'Celebration'}. Venue: ${fullVenue}`
              )}&location=${encodeURIComponent(fullVenue)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/60 text-amber-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Add to Google Calendar</span>
            </a>

            <button
              type="button"
              onClick={() =>
                downloadIcsCalendarFile({
                  title: title || 'Celebration',
                  start_date: startDate,
                  venue_name: venueName,
                  venue_address: venueAddress,
                  description: `You are cordially invited to ${title || 'Celebration'}!`,
                })
              }
              className="w-full py-2 rounded-full bg-white/5 hover:bg-white/10 text-amber-200/80 text-[11px] font-mono flex items-center justify-center gap-1 transition-all"
            >
              <Download className="w-3 h-3" />
              <span>Download Apple .ICS Calendar</span>
            </button>
          </div>
        </div>

        {/* Venue Card */}
        <div
          className="p-6 rounded-3xl border-2 border-amber-300/80 shadow-2xl backdrop-blur-2xl space-y-4 text-center flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(45, 10, 22, 0.95) 0%, rgba(20, 4, 10, 0.98) 100%)',
          }}
        >
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/50 flex items-center justify-center mx-auto text-amber-300 shadow-md">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Venue Location</h3>
            <p className="text-amber-200 font-serif text-base font-semibold">
              {venueName || 'Grand Heritage Palace'}
            </p>
            <p className="text-amber-100/80 text-xs line-clamp-2">
              {venueAddress || 'City Celebrations Hub'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/60 text-amber-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>

            <button
              type="button"
              onClick={handleCopyAddress}
              className="w-full py-2 rounded-full bg-white/5 hover:bg-white/10 text-amber-200/80 text-[11px] font-mono flex items-center justify-center gap-1 transition-all"
            >
              {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAddress ? 'Address Copied!' : 'Copy Venue Address'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
