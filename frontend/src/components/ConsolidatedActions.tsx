import React, { useState } from 'react';
import { Calendar, MapPin, Download, ExternalLink, ChevronDown } from 'lucide-react';
import { downloadIcsCalendarFile } from '../utils/calendarExport';

interface ConsolidatedActionsProps {
  eventTitle: string;
  startDate?: string;
  venueName?: string;
  venueAddress?: string;
  googleMapsUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  borderColor?: string;
  badgeBg?: string;
  textColor?: string;
}

export const ConsolidatedActions: React.FC<ConsolidatedActionsProps> = ({
  eventTitle,
  startDate,
  venueName,
  venueAddress,
  googleMapsUrl,
  primaryColor = '#9E6F6D',
  accentColor = '#C9AA78',
  borderColor = '#E9D3D0',
  badgeBg = '#F2E5E2',
  textColor = '#302829',
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const fullVenue = venueName ? `${venueName}, ${venueAddress || ''}` : 'Celebration Venue';
  const mapsUrl = googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(fullVenue)}`;

  const handleGoogleCalendar = () => {
    if (!startDate) return;
    const start = new Date(startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(new Date(startDate).getTime() + 3 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${start}/${end}&location=${encodeURIComponent(fullVenue)}`;
    window.open(gcalUrl, '_blank');
  };

  const handleDownloadIcs = () => {
    downloadIcsCalendarFile({
      title: eventTitle,
      description: `Join us for ${eventTitle}!`,
      venue_name: fullVenue,
      start_date: startDate || new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-4 relative z-20">
      {/* CONSOLIDATED CALENDAR TRIGGER */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="px-5 py-3 rounded-full text-xs font-mono font-extrabold flex items-center gap-2 border shadow-sm transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: badgeBg, borderColor: borderColor, color: textColor }}
        >
          <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
          <span>Add to Calendar</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
        </button>

        {isCalendarOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 p-2 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 z-50 space-y-1 text-left">
            <button
              onClick={() => { handleGoogleCalendar(); setIsCalendarOpen(false); }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
            >
              <span>Google Calendar</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => { handleDownloadIcs(); setIsCalendarOpen(false); }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
            >
              <span>Apple / Outlook (.ics)</span>
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* CONSOLIDATED GET DIRECTIONS ACTION */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-3 rounded-full text-xs font-mono font-extrabold flex items-center gap-2 border shadow-sm transition-all hover:scale-105 active:scale-95"
        style={{ backgroundColor: badgeBg, borderColor: borderColor, color: textColor }}
      >
        <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
        <span>Get Directions</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
      </a>
    </div>
  );
}
