import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, MapPin, User, Save, Sparkles, Building, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../services/api';
import { VisualCalendarPicker } from './VisualCalendarPicker';

interface EditCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: any;
  onSuccess: (updatedEvt: any) => void;
}

export const EditCelebrationModal: React.FC<EditCelebrationModalProps> = ({
  isOpen,
  onClose,
  eventData,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [hostName, setHostName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventData) {
      setTitle(eventData.title || '');
      setHostName(eventData.host_name || '');
      setVenueName(eventData.venue_name || '');
      setVenueAddress(eventData.venue_address || '');
      setStartDate(eventData.start_date || '');
      setUpiId(eventData.upi_id || '');
    }
  }, [eventData]);

  if (!isOpen || !eventData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const updatedIsoDate = startDate ? new Date(startDate).toISOString() : eventData.start_date;

    try {
      const res = await apiFetch<any>(`/events/${eventData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          host_name: hostName.trim(),
          venue_name: venueName.trim(),
          venue_address: venueAddress.trim(),
          start_date: updatedIsoDate,
          upi_id: upiId.trim(),
        }),
      });

      onSuccess(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to update celebration details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFDFC] border border-[#E9D3D0] rounded-3xl max-w-lg w-full p-6 sm:p-8 text-[#302829] shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* HEADER BAR WITH BACK AND CLOSE BUTTONS */}
        <div className="flex items-center justify-between border-b border-[#E9D3D0] pb-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#302829] border border-[#D8B5B0] font-bold text-xs flex items-center gap-1 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#9E6F6D]" />
            <span>← Back</span>
          </button>

          <div className="flex items-center gap-1 text-center">
            <Sparkles className="w-3.5 h-3.5 text-[#C9AA78]" />
            <h3 className="font-serif text-sm font-bold gold-gradient-text">Modify Celebration</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all"
            title="Close Popup"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#9E6F6D] mb-1">Celebration Title</label>
            <div className="relative">
              <Sparkles className="w-4 h-4 text-[#C9AA78] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Priyanka & Rohit's Wedding"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:border-[#9E6F6D] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#9E6F6D] mb-1">Host Name(s)</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#C9AA78] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Gupta & Sharma Families"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:border-[#9E6F6D] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#9E6F6D] mb-1">Venue Name</label>
            <div className="relative">
              <Building className="w-4 h-4 text-[#C9AA78] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="The Taj Hotel & Convention Centre"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:border-[#9E6F6D] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#9E6F6D] mb-1">Venue Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#C9AA78] absolute left-3.5 top-3.5" />
              <textarea
                rows={2}
                required
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Vipul Khand, Gomti Nagar, Lucknow"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E9D3D0] text-[#302829] focus:border-[#9E6F6D] outline-none resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#9E6F6D] mb-1">Event Date & Time</label>
            <VisualCalendarPicker
              selectedDateTime={startDate}
              onChange={(val) => setStartDate(val)}
            />
          </div>

          <div className="pt-3 border-t border-[#E9D3D0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#F2E5E2] hover:bg-[#E9D3D0] text-[#302829] font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#9E6F6D] hover:bg-[#875B59] text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              {loading ? 'Saving Changes...' : 'Save Celebration Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
