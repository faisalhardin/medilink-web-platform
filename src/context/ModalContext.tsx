// src/context/ModalContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
    isOpen: boolean;
    modalContent: ReactNode | null;
    openModal: (content: ReactNode, onClose?: () => void) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ReactNode | null>(null);
    const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | undefined>(undefined);

    const openModal = (content: ReactNode, onClose?: () => void) => {
        setModalContent(content);
        setIsOpen(true);
        if (onClose) {
            setOnCloseCallback(() => onClose);
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        setModalContent(null);
        if (onCloseCallback) {
            onCloseCallback();
            setOnCloseCallback(undefined);
        }
    };

    return (
        <ModalContext.Provider value={{ isOpen, modalContent, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
