import React, { useEffect } from 'react';
import { ModalEntry, ModalMaxWidth, useModal } from '../context/ModalContext';

const maxWidthClasses: Record<ModalMaxWidth, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
    '2xl': 'max-w-[90vw]',
};

function ModalLayer({
    entry,
    index,
    isTop,
    onClose,
}: {
    entry: ModalEntry;
    index: number;
    isTop: boolean;
    onClose: () => void;
}) {
    const overlayRef = React.useRef<HTMLDivElement>(null);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (!isTop) return;
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto p-4 transition-opacity duration-300 ease-in-out opacity-100"
            style={{ zIndex: 50 + index * 10 }}
            aria-hidden={!isTop}
        >
            <div
                className={`bg-white rounded-lg shadow-xl w-full ${maxWidthClasses[entry.maxWidth]} max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ease-in-out scale-100`}
            >
                <div className="relative">
                    {isTop && (
                        <button
                            onClick={onClose}
                            className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 z-10"
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
                    )}
                    <div className="p-6">{entry.content}</div>
                </div>
            </div>
        </div>
    );
}

export function Modal() {
    const { modals, closeModal } = useModal();

    useEffect(() => {
        if (modals.length > 0) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [modals.length]);

    if (modals.length === 0) return null;

    return (
        <>
            {modals.map((entry, index) => (
                <ModalLayer
                    key={entry.id}
                    entry={entry}
                    index={index}
                    isTop={index === modals.length - 1}
                    onClose={closeModal}
                />
            ))}
        </>
    );
}
