// src/context/ModalContext.tsx
import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface OpenModalOptions {
    onClose?: () => void;
    maxWidth?: ModalMaxWidth;
}

export interface ModalEntry {
    id: number;
    content: ReactNode;
    maxWidth: ModalMaxWidth;
    onClose?: () => void;
}

interface ModalContextType {
    isOpen: boolean;
    modalContent: ReactNode | null;
    maxWidth: ModalMaxWidth;
    modals: ModalEntry[];
    openModal: (content: ReactNode, onCloseOrOptions?: (() => void) | OpenModalOptions) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

let nextModalId = 1;

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modals, setModals] = useState<ModalEntry[]>([]);

    const openModal = useCallback((content: ReactNode, onCloseOrOptions?: (() => void) | OpenModalOptions) => {
        let onClose: (() => void) | undefined;
        let maxWidth: ModalMaxWidth = '2xl';

        if (typeof onCloseOrOptions === 'function') {
            onClose = onCloseOrOptions;
        } else if (onCloseOrOptions) {
            onClose = onCloseOrOptions.onClose;
            maxWidth = onCloseOrOptions.maxWidth ?? '2xl';
        }

        setModals((prev) => [
            ...prev,
            {
                id: nextModalId++,
                content,
                maxWidth,
                onClose,
            },
        ]);
    }, []);

    const closeModal = useCallback(() => {
        setModals((prev) => {
            if (prev.length === 0) return prev;
            const top = prev[prev.length - 1];
            // Defer onClose so state update isn't nested inside another update from the callback
            if (top.onClose) {
                queueMicrotask(() => top.onClose?.());
            }
            return prev.slice(0, -1);
        });
    }, []);

    const top = modals[modals.length - 1];

    const value = useMemo<ModalContextType>(() => ({
        isOpen: modals.length > 0,
        modalContent: top?.content ?? null,
        maxWidth: top?.maxWidth ?? '2xl',
        modals,
        openModal,
        closeModal,
    }), [modals, top, openModal, closeModal]);

    return (
        <ModalContext.Provider value={value}>
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
