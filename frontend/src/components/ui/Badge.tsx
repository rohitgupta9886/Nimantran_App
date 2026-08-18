import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'wine' | 'gold';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    error: 'bg-red-50 text-red-800 border-red-200/80',
    neutral: 'bg-charcoal-100 text-charcoal-800 border-charcoal-200',
    wine: 'bg-wine-50 text-wine border-wine-200',
    gold: 'bg-gold-50 text-gold-900 border-gold-200',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    neutral: 'bg-charcoal-500',
    wine: 'bg-wine',
    gold: 'bg-gold',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
