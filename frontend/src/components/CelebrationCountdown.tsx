import React, { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface CelebrationCountdownProps {
  targetDate?: string;
  celebrationType?: string;
}

export const CelebrationCountdown: React.FC<CelebrationCountdownProps> = ({
  targetDate,
  celebrationType = 'WEDDING',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    if (isNaN(target)) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate || isNaN(new Date(targetDate).getTime())) {
    return null;
  }

  const units = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ];

  return (
    <div className="w-full p-6 sm:p-7 rounded-3xl border-2 border-amber-300/70 shadow-2xl backdrop-blur-2xl text-center space-y-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(40, 10, 22, 0.95) 0%, rgba(20, 4, 10, 0.98) 100%)',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8), inset 0 0 30px rgba(245, 158, 11, 0.1)',
      }}
    >
      {/* Decorative Ornate Corners */}
      <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

      {/* Header */}
      <div className="space-y-1">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{timeLeft.isPast ? 'CELEBRATION IN PROGRESS' : 'COUNTING DOWN TO THE BIG DAY'}</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        </span>
        <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5DC] via-[#FFD700] to-[#E5C07B] drop-shadow-md">
          {timeLeft.isPast ? 'Happening Now!' : 'Every Moment Brings Us Closer'}
        </h3>
      </div>

      {/* 4 Glowing Timer Cards */}
      {!timeLeft.isPast ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto pt-1">
          {units.map((u, i) => (
            <div
              key={i}
              className="p-3 sm:p-4 rounded-2xl border border-amber-400/50 bg-black/60 shadow-lg flex flex-col items-center justify-center backdrop-blur-md transition-all hover:scale-105"
            >
              <span className="font-serif text-2xl sm:text-4xl font-extrabold text-amber-200 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                {String(u.value).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-extrabold tracking-widest text-amber-400 uppercase mt-1">
                {u.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-2 inline-flex items-center gap-2 px-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-serif font-bold text-sm shadow-md">
          <Heart className="w-4 h-4 fill-emerald-400" />
          <span>Wishing the couple / hosts a lifetime of joy and happiness!</span>
        </div>
      )}
    </div>
  );
};
