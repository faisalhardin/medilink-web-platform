import { isCurrentTokenExpired, handleTokenExpiration } from './tokenExpiration';

/**
 * Check if token is expired before making a request
 * If expired, redirects to token-expired page
 * Call this function at the beginning of each request function
 */
export const checkTokenBeforeRequest = (): void => {
    if (isCurrentTokenExpired()) {
        handleTokenExpiration();
        throw new Error("Token expired - redirecting to login");
    }
};
