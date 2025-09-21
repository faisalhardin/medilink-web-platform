import { jwtDecode } from "jwt-decode";
import { cleanAllAuthStorage } from "./authCleanup";
import { JWT_TOKEN_KEY } from "constants/constants";

interface JwtPayload {
    exp: number;
    iat: number;
    [key: string]: any;
}

/**
 * Check if a JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000; // Convert to seconds
        return decoded.exp < currentTime;
    } catch (error) {
        console.error("Error decoding token:", error);
        return true; // Consider invalid tokens as expired
    }
};

/**
 * Check if the current stored token is expired
 */
export const isCurrentTokenExpired = (): boolean => {
    const token = sessionStorage.getItem(JWT_TOKEN_KEY);
    
    if (!token) {
        return true;
    }
    
    return isTokenExpired(token);
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpirationTime = (token: string): number | null => {
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};

/**
 * Get time until token expires in milliseconds
 */
export const getTimeUntilExpiration = (token: string): number => {
    const expirationTime = getTokenExpirationTime(token);
    if (!expirationTime) return 0;
    
    const currentTime = Date.now();
    return Math.max(0, expirationTime - currentTime);
};

/**
 * Redirect to token expired page
 */
export const redirectToTokenExpired = (): void => {
    // Clean storage before redirect
    cleanAllAuthStorage();
    
    // Redirect to token expired page
    window.location.href = '/token-expired';
};

/**
 * Handle token expiration with proper cleanup and redirect
 */
export const handleTokenExpiration = (): void => {
    redirectToTokenExpired();
};

/**
 * Set up automatic token expiration checking
 * This should be called once when the app starts
 */
export const setupTokenExpirationChecker = (): (() => void) => {
    const checkInterval = setInterval(() => {
        if (isCurrentTokenExpired()) {
            handleTokenExpiration();
        }
    }, 60000); // Check every minute

    // Return cleanup function
    return () => clearInterval(checkInterval);
};

/**
 * Enhanced fetch function that handles token expiration
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Check if token is expired before making request
    if (isCurrentTokenExpired()) {
        handleTokenExpiration();
        throw new Error("Token expired");
    }

    const token = sessionStorage.getItem("jwtToken");
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    // Check if response indicates token expiration
    if (response.status === 401) {
        handleTokenExpiration();
        throw new Error("Token expired - redirected to login");
    }

    return response;
};

/**
 * Axios interceptor for handling token expiration
 */
export const setupAxiosTokenExpirationInterceptor = (axiosInstance: any): void => {
    // Request interceptor
    axiosInstance.interceptors.request.use(
        (config: any) => {
            if (isCurrentTokenExpired()) {
                handleTokenExpiration();
                return Promise.reject(new Error("Token expired"));
            }
            return config;
        },
        (error: any) => Promise.reject(error)
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
        (response: any) => response,
        (error: any) => {
            if (error.response?.status === 401) {
                handleTokenExpiration();
            }
            return Promise.reject(error);
        }
    );
};
