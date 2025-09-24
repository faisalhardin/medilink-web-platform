import { jwtDecode } from "jwt-decode";
import { cleanSpecificAuthStorage } from "./authCleanup";
import { JWT_TOKEN_KEY, REFRESH_TOKEN } from "constants/constants";
import { RefreshToken } from "@requests/login";
import { notifyAuthStateChanged } from "hooks/useAuthCallback";

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
    cleanSpecificAuthStorage();
    
    // Redirect to token expired page
    window.location.href = '/token-expired';
};

/**
 * Attempt to refresh the JWT token using the refresh token.
 * Returns true if refresh was successful, false otherwise.
 */
export const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN);

    if (!refreshToken) {
        return false;
    }

    try {
       const response = await RefreshToken(refreshToken);
        const data = response;
        if (data && data.access_token) {
            // Store new token and (optionally) new refresh token
            sessionStorage.setItem(JWT_TOKEN_KEY, data.access_token);
            if (data.refresh_token) {
                sessionStorage.setItem(REFRESH_TOKEN, data.refresh_token);
            }
            
            // Notify all components that authentication state has changed
            notifyAuthStateChanged();
            
            return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        return false;
    }
};

export const handleNotAuthenticated = (): void => {
    redirectToTokenExpired();
};


/**
 * Handle token expiration with proper cleanup and redirect
 */
export const handleTokenExpiration = async (): Promise<void> => {
    await refreshAccessToken();
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
