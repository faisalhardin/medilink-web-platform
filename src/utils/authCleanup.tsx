import { JWT_TOKEN_KEY, MEDILINK_USER } from "constants/constants";

/**
 * Comprehensive function to clean all authentication-related storage
 * This includes localStorage, sessionStorage, and any auth-related keys
 */
export const cleanAllAuthStorage = (): void => {
    try {
        // Clean sessionStorage
        sessionStorage.removeItem(JWT_TOKEN_KEY);
        sessionStorage.removeItem(MEDILINK_USER);
        
        // Clean localStorage
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        
        // Clean any other auth-related keys from localStorage
        const localStorageKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && isAuthRelatedKey(key)) {
                localStorageKeysToRemove.push(key);
            }
        }
        localStorageKeysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clean any other auth-related keys from sessionStorage
        const sessionStorageKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && isAuthRelatedKey(key)) {
                sessionStorageKeysToRemove.push(key);
            }
        }
        sessionStorageKeysToRemove.forEach(key => sessionStorage.removeItem(key));
        
    } catch (error) {
        console.error("Error cleaning authentication storage:", error);
        throw error;
    }
};

/**
 * Check if a storage key is authentication-related
 */
const isAuthRelatedKey = (key: string): boolean => {
    const authKeywords = [
        'auth', 'token', 'user', 'login', 'session', 'jwt', 
        'access', 'refresh', 'credential', 'oauth', 'google'
    ];
    
    return authKeywords.some(keyword => 
        key.toLowerCase().includes(keyword.toLowerCase())
    );
};

/**
 * Clean only specific authentication storage (more targeted)
 */
export const cleanSpecificAuthStorage = (): void => {
    try {
        // Remove only the main auth keys
        sessionStorage.removeItem(JWT_TOKEN_KEY);
        sessionStorage.removeItem(MEDILINK_USER);
        localStorage.removeItem("jwtToken");
        
        console.log("Specific authentication storage cleaned");
    } catch (error) {
        console.error("Error cleaning specific authentication storage:", error);
        throw error;
    }
};

/**
 * Check if user is currently authenticated
 */
export const isUserAuthenticated = (): boolean => {
    const token = sessionStorage.getItem(JWT_TOKEN_KEY);
    const user = sessionStorage.getItem(MEDILINK_USER);
    
    return !!(token && user);
};

/**
 * Get current authentication status
 */
export const getAuthStatus = () => {
    return {
        isAuthenticated: isUserAuthenticated(),
        hasToken: !!sessionStorage.getItem(JWT_TOKEN_KEY),
        hasUser: !!sessionStorage.getItem(MEDILINK_USER),
        token: sessionStorage.getItem(JWT_TOKEN_KEY),
        user: sessionStorage.getItem(MEDILINK_USER) ? 
            JSON.parse(sessionStorage.getItem(MEDILINK_USER)!) : null
    };
};
