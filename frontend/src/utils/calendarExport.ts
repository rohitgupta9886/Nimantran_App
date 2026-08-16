/**
 * Generates and downloads an iCalendar (.ics) event invite file.
 */
export const downloadIcsCalendarFile = (event: {
  title: string;
  description?: string;
  venue_name?: string;
  venue_address?: string;
  start_date?: string;
  slug?: string;
}) => {
  const title = event.title || 'Celebration Event';
  const startDate = event.start_date ? new Date(event.start_date) : new Date();
  const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hour duration

  const formatDate = (date: Date) =>
    date.toISOString().replace(/-|:|\.\d+/g, '');

  const venue = [event.venue_name, event.venue_address].filter(Boolean).join(', ') || 'Venue to be Announced';
  const eventUrl = event.slug ? `${window.location.origin}/i/${event.slug}` : window.location.href;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nimantran AI Digital Invitations//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `LOCATION:${venue.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${(event.description || 'You are graciously invited to celebrate with us.').replace(/\n/g, '\\n')} \\n\\nView & RSVP: ${eventUrl}`,
    `URL:${eventUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
