import { useState, useEffect, useCallback } from 'react';
import { getAuthStatus } from '@utils/authCleanup';
import { JWT_TOKEN_KEY, MEDILINK_USER, REFRESH_TOKEN } from 'constants/constants';

// Global callback registry for authentication state changes
type AuthCallback = () => void;
const authCallbacks = new Set<AuthCallback>();

/**
 * Register a callback to be called when authentication state changes
 */
export const registerAuthCallback = (callback: AuthCallback): (() => void) => {
    authCallbacks.add(callback);
    
    // Return cleanup function
    return () => {
        authCallbacks.delete(callback);
    };
};

/**
 * Notify all registered callbacks that authentication state has changed
 */
export const notifyAuthStateChanged = () => {
    authCallbacks.forEach(callback => {
        try {
            callback();
        } catch (error) {
            console.error('Error in auth callback:', error);
        }
    });
};

/**
 * Hook to get current authentication state and automatically re-render on changes
 */
export const useAuthState = () => {
    const [authState, setAuthState] = useState(() => getAuthStatus());
    const [isLoading, setIsLoading] = useState(true);

    const updateAuthState = useCallback(() => {
        const newAuthState = getAuthStatus();
        setAuthState(newAuthState);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Initial check
        updateAuthState();

        // Register callback for auth state changes
        const cleanup = registerAuthCallback(updateAuthState);

        // Listen for storage changes (cross-tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === JWT_TOKEN_KEY || e.key === MEDILINK_USER || e.key === REFRESH_TOKEN) {
                updateAuthState();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            cleanup();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [updateAuthState]);

    return {
        isAuthenticated: authState.isAuthenticated,
        isLoading,
        authStatus: authState
    };
};
