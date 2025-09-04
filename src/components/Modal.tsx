import React, { useEffect, useRef } from 'react';
import { useModal } from '../context/ModalContext';

export interface ModalProps {
    maxWidth?: 'xl' | '2xl';
}

export function Modal({ maxWidth = '2xl' }: ModalProps) {
    const { isOpen, modalContent, closeModal } = useModal();
    const overlayRef = useRef<HTMLDivElement>(null);

    const maxWidthClasses = {
        xl: 'max-w-4xl',
        '2xl': 'max-w-[90vw]',
      };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            closeModal();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto p-4 transition-opacity duration-300 ease-in-out opacity-100"
        >
            <div className={`bg-white rounded-lg shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ease-in-out scale-100`}>
                <div className="relative">
                    <button
                        onClick={closeModal}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        aria-label="Close modal"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                    <div className="p-6">{modalContent}</div>
                </div>
            </div>
        </div>
    );
}
