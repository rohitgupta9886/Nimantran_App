import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white/70 border border-charcoal-200/70 rounded-3xl shadow-sm ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-subtle border border-gold/20 flex items-center justify-center text-wine mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h4 className="text-lg md:text-xl font-bold text-charcoal-900 font-serif mb-2">{title}</h4>
      <p className="text-sm text-charcoal-500 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} leftIcon={actionIcon} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
