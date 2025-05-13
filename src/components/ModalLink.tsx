// src/components/ModalLink.tsx
import React, { Suspense } from 'react';
import { useModal } from '../context/ModalContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { findComponentForPath } from '../modalRegistry';

interface ModalLinkProps {
    to: string;
    children: React.ReactNode;
    className?: string;
}

export function ModalLink({ to, children, className = '' }: ModalLinkProps) {
    const { openModal } = useModal();
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        
        // Find the component for this path
        const Component = findComponentForPath(to);
        
        if (!Component) {
            console.warn(`No modal component found for path: ${to}`);
            // Fall back to regular navigation
            navigate(to);
            return;
        }
        
        // Store current location
        const currentLocation = location.pathname;
        
        // Update URL without navigation
        window.history.pushState(null, '', to);
        
        // Open modal with the component
        openModal(
            <Suspense fallback={<div>Loading...</div>}>
                <Component />
            </Suspense>,
            () => {
                // Restore previous URL when modal closes
                window.history.pushState(null, '', currentLocation);
            }
        );
    };

    return (
        <a href={to} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}
