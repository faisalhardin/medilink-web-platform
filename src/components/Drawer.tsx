import CloseIcon from 'assets/icons/CloseIcon';
import React, { useState, useEffect, useRef, ReactNode } from 'react';

// Base Drawer Props - only handles the drawer mechanics
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  position?: 'left' | 'right';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

// Base Drawer Component - handles only the drawer mechanics
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  position = 'right',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = ''
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const positionClasses = {
    left: {
      container: 'pr-10 sm:pr-16',
      panel: 'mr-auto',
      transform: isAnimating ? 'translate-x-0' : '-translate-x-full'
    },
    right: {
      container: 'pl-10 sm:pl-16',
      panel: 'ml-auto',
      transform: isAnimating ? 'translate-x-0' : 'translate-x-full'
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      setIsAnimating(true);
      
      if (closeOnEscape) {
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            onClose();
          }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        dialog.close();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, closeOnEscape]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`fixed inset-0 z-50 size-auto max-h-none max-w-none overflow-hidden bg-transparent backdrop:bg-transparent ${
        !isOpen ? 'hidden' : ''
      } ${className}`}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out ${
          !isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div 
        tabIndex={0} 
        className={`absolute inset-0 focus:outline-none ${positionClasses[position].container}`}
        onClick={handleBackdropClick}
      >
        <div
          className={`${positionClasses[position].panel} block size-full ${maxWidthClasses[maxWidth]} transform transition duration-500 ease-in-out sm:duration-700 ${positionClasses[position].transform}`}
          onClick={handleDialogClick}
        >
          <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between px-4 py-6 sm:px-6 border-b border-gray-200">
                {title && (
                  <h2 className="text-lg font-medium text-gray-900">{title}</h2>
                )}
                {showCloseButton && (
                  <div className={`${title ? 'ml-3' : ''} flex h-7 items-center`}>
                    <button
                      type="button"
                      onClick={onClose}
                      className="relative -m-2 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Close drawer"
                    >
                      <span className="absolute -inset-0.5" />
                      <span className="sr-only">Close panel</span>
                      <CloseIcon/>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};


export default Drawer;
