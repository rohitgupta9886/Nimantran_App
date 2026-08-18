import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated' | 'bordered';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-charcoal-200/80 shadow-sm',
    subtle: 'bg-surface-subtle border border-charcoal-200/60',
    elevated: 'bg-white border border-charcoal-200/50 shadow-md',
    bordered: 'bg-white border-2 border-wine/20 shadow-sm',
  };

  const hoverStyle = hoverable
    ? 'hover:border-rose hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-2xl p-5 md:p-6 text-charcoal-900 ${variantStyles[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
