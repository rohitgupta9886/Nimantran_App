import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none select-none';

  const sizeClasses = {
    sm: 'text-xs font-semibold px-3 py-2 min-h-[38px] gap-1.5',
    md: 'text-sm font-semibold px-5 py-3 min-h-[46px] gap-2',
    lg: 'text-base font-semibold px-7 py-3.5 min-h-[52px] gap-2.5 shadow-md',
  };

  const variantClasses = {
    primary:
      'bg-wine text-white hover:bg-wine-700 active:bg-wine-900 shadow-sm focus-visible:ring-wine',
    secondary:
      'bg-canvas text-charcoal-900 border border-charcoal-200 hover:bg-surface-subtle active:bg-charcoal-100 focus-visible:ring-charcoal-400',
    outline:
      'bg-transparent border-2 border-wine text-wine hover:bg-wine-50 active:bg-wine-100 focus-visible:ring-wine',
    ghost:
      'bg-transparent text-charcoal-700 hover:bg-surface-subtle hover:text-charcoal-900 focus-visible:ring-charcoal-300',
    destructive:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-red-500',
    gold:
      'bg-gold text-charcoal-900 hover:bg-gold-400 active:bg-gold-600 shadow-md font-bold focus-visible:ring-gold',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
