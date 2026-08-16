import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react';

interface VisualCalendarPickerProps {
  selectedDateTime?: string;
  selectedDate?: string;
  onChange?: (formattedDateTimeStr: string) => void;
  onDateSelect?: (formattedDateTimeStr: string) => void;
  onSelectDateTime?: (formattedDateTimeStr: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TIME_SLOTS = [
  { label: '🌅 10:00 AM', time: '10:00', labelFull: 'Morning 10:00 AM' },
  { label: '☀️ 1:00 PM', time: '13:00', labelFull: 'Afternoon 1:00 PM' },
  { label: '🌇 6:00 PM', time: '18:00', labelFull: 'Evening 6:00 PM' },
  { label: '🌙 7:00 PM', time: '19:00', labelFull: 'Evening 7:00 PM' },
  { label: '🌃 9:00 PM', time: '21:00', labelFull: 'Night 9:00 PM' },
];

export const VisualCalendarPicker: React.FC<VisualCalendarPickerProps> = ({
  selectedDateTime,
  selectedDate,
  onChange,
  onDateSelect,
  onSelectDateTime,
}) => {
  const activeDateVal = selectedDateTime || selectedDate || '';
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[3]); // Default 7:00 PM

  // Sync calendar grid with activeDateVal when passed or updated, or emit default
  useEffect(() => {
    if (activeDateVal) {
      const parsed = new Date(activeDateVal);
      if (!isNaN(parsed.getTime())) {
        setCurrentYear(parsed.getFullYear());
        setCurrentMonth(parsed.getMonth());
        setSelectedDay(parsed.getDate());

        const hours = parsed.getHours();
        const matchedSlot = TIME_SLOTS.find(s => parseInt(s.time.split(':')[0]) === hours) || TIME_SLOTS[3];
        setSelectedTimeSlot(matchedSlot);
      }
    } else {
      // Emit default initial date (today + 30 days at 7:00 PM) if no date provided
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      const defaultStr = `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}T19:00:00.000Z`;
      if (onSelectDateTime) onSelectDateTime(defaultStr);
      if (onChange) onChange(defaultStr);
      if (onDateSelect) onDateSelect(defaultStr);
    }
  }, [activeDateVal]);

  // Calculate days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    emitChange(day, currentMonth, currentYear, selectedTimeSlot);
  };

  const handleSelectTime = (slot: typeof TIME_SLOTS[0]) => {
    setSelectedTimeSlot(slot);
    if (selectedDay) {
      emitChange(selectedDay, currentMonth, currentYear, slot);
    }
  };

  const emitChange = (day: number, monthIdx: number, year: number, slot: typeof TIME_SLOTS[0]) => {
    const formattedStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${slot.time}:00.000Z`;
    if (onSelectDateTime) onSelectDateTime(formattedStr);
    if (onChange) onChange(formattedStr);
    if (onDateSelect) onDateSelect(formattedStr);
  };

  // Generate blank leading days
  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  // Generate days array
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-yellow-400/40 space-y-3 text-white max-w-md mx-auto">
      
      {/* CALENDAR MONTH HEADER */}
      <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-yellow-400" />
          <span className="font-serif text-sm font-bold gold-gradient-text">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7-COLUMN DAYS OF WEEK */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-yellow-400 font-bold uppercase">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      {/* INTERACTIVE DAY GRID */}
      <div className="grid grid-cols-7 gap-1 text-[11px]">
        {leadingBlanks.map((b) => (
          <div key={`blank-${b}`} className="p-1.5" />
        ))}

        {dayNumbers.map((d) => {
          const isSelected = selectedDay === d;
          return (
            <button
              key={`day-${d}`}
              type="button"
              onClick={() => handleSelectDay(d)}
              className={`p-1.5 rounded-lg font-bold transition-all text-center ${
                isSelected
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 text-black shadow-md scale-105 border border-yellow-300'
                  : 'bg-black/40 text-slate-200 hover:bg-yellow-500/20 hover:text-yellow-300 border border-yellow-500/20'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* 1-TAP TIME SELECTION SLOTS */}
      <div className="pt-2 border-t border-yellow-500/20 space-y-1.5">
        <label className="block text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3 h-3 text-yellow-400" /> Celebration Time
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[10px]">
          {TIME_SLOTS.map((slot) => {
            const isTimeSelected = selectedTimeSlot.time === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => handleSelectTime(slot)}
                className={`py-1 px-1.5 rounded-lg font-bold text-center transition-all ${
                  isTimeSelected
                    ? 'bg-amber-500 text-black border border-yellow-300 shadow-sm'
                    : 'bg-black/50 text-slate-300 border border-yellow-500/20 hover:border-yellow-500/40'
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DATE SUMMARY BADGE */}
      {selectedDay && (
        <div className="p-2 rounded-xl bg-black/60 border border-emerald-500/40 text-center text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Selected: {selectedDay} {MONTH_NAMES[currentMonth]} {currentYear} at {selectedTimeSlot.labelFull}
          </span>
        </div>
      )}

    </div>
  );
};
