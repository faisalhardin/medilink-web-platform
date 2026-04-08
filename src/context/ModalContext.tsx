// src/context/ModalContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface OpenModalOptions {
    onClose?: () => void;
    maxWidth?: ModalMaxWidth;
}

interface ModalContextType {
    isOpen: boolean;
    modalContent: ReactNode | null;
    maxWidth: ModalMaxWidth;
    openModal: (content: ReactNode, onCloseOrOptions?: (() => void) | OpenModalOptions) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ReactNode | null>(null);
    const [maxWidth, setMaxWidth] = useState<ModalMaxWidth>('2xl');
    const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | undefined>(undefined);

    const openModal = (content: ReactNode, onCloseOrOptions?: (() => void) | OpenModalOptions) => {
        setModalContent(content);
        setIsOpen(true);

        // Accept either a bare onClose callback (backwards-compatible) or an options object
        if (typeof onCloseOrOptions === 'function') {
            setOnCloseCallback(() => onCloseOrOptions);
            setMaxWidth('2xl');
        } else if (onCloseOrOptions) {
            if (onCloseOrOptions.onClose) setOnCloseCallback(() => onCloseOrOptions.onClose!);
            setMaxWidth(onCloseOrOptions.maxWidth ?? '2xl');
        } else {
            setMaxWidth('2xl');
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        setModalContent(null);
        setMaxWidth('2xl');
        if (onCloseCallback) {
            onCloseCallback();
            setOnCloseCallback(undefined);
        }
    };

    return (
        <ModalContext.Provider value={{ isOpen, modalContent, maxWidth, openModal, closeModal }}>
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
