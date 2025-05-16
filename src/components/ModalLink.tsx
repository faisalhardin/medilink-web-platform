// src/components/ModalLink.tsx
import React, { Suspense } from 'react';
import { useModal } from '../context/ModalContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { findComponentForPath, ModalComponentProps } from '../modalRegistry';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

interface ModalLinkProps {
    to: string;
    children: React.ReactNode;
    className?: string;
    state?: Record<string, any>;
}

export function ModalLink({ to, children, className = '', state }: ModalLinkProps) {
    const { openModal } = useModal();
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        
        // Find the component for this path
        const Component = findComponentForPath(to);
        
        if (!Component) {
            console.warn(`No modal component found for path: ${to}`);
            navigate(to);
            return;
        }
        
        // Store current location
        const currentLocation = location.pathname;
        
        // Ensure the path is absolute
        const absolutePath = to.startsWith('/') ? to : `/${to}`;
        const pathParts = absolutePath.split('/');
        const id = pathParts[pathParts.length - 1];
        
        // Update URL without navigation
        window.history.pushState({...state}, '', absolutePath);
        
        // Open modal with the wrapper component
        openModal(
            <Suspense fallback={<div>Loading...</div>}>
                 {React.createElement(Component as React.ComponentType<ModalComponentProps>, { 
                    id ,
                    state,
                    })}
            </Suspense>,
            () => {
                // Restore previous URL when modal closes
                window.history.pushState(null, '', currentLocation);
            }
        );
    };

    return (
        <a href={to} onClick={handleClick} className={`${className} cursor-pointer`}>
            {children}
        </a>
    );
}
