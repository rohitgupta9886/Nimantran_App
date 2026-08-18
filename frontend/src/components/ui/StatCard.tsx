import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendPositive,
  subtext,
  className = '',
}) => {
  return (
    <div
      className={`bg-white border border-charcoal-200/70 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col justify-between transition-all duration-200 hover:border-gold/30 hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">{label}</span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-charcoal-200/50 flex items-center justify-center text-wine shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-extrabold text-charcoal-900 tracking-tight font-serif">
          {value}
        </div>
        {(trend || subtext) && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            {trend && (
              <span
                className={`font-semibold ${
                  trendPositive ? 'text-emerald-700' : 'text-charcoal-600'
                }`}
              >
                {trend}
              </span>
            )}
            {subtext && <span className="text-charcoal-400">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
