import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container / Mobile Bottom Sheet */}
      <div
        className={`relative w-full ${sizeClasses[size]} bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-charcoal-200/50 max-h-[92vh] flex flex-col z-10 transition-all duration-300 transform ${className}`}
      >
        {/* Mobile Pull Bar Indicator */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 bg-charcoal-200 rounded-full" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-charcoal-100">
            <div>
              {title && (
                <h3 className="text-lg md:text-xl font-bold text-charcoal-900 font-serif">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs md:text-sm text-charcoal-500 mt-0.5">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="touch-target-48 -mr-2 text-charcoal-400 hover:text-charcoal-700 rounded-full hover:bg-charcoal-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1">{children}</div>
      </div>
    </div>
  );
};
