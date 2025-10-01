import { DOMAIN_CONFIG } from '../config/domain';

/**
 * Domain utility functions for medianne.id
 */

/**
 * Get the appropriate URL based on current environment
 */
export const getAppUrl = (): string => {
  if (typeof window === 'undefined') {
    return DOMAIN_CONFIG.PRIMARY_URL;
  }
  
  const hostname = window.location.hostname;
  
  // If already on custom domain, return current origin
  if (hostname === DOMAIN_CONFIG.CUSTOM_DOMAIN || hostname === DOMAIN_CONFIG.WWW_DOMAIN) {
    return window.location.origin;
  }
  
  // In development, return localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:${window.location.port || '5173'}`;
  }
  
  // Fallback to primary domain
  return DOMAIN_CONFIG.PRIMARY_URL;
};

/**
 * Check if the app is running on the custom domain
 */
export const isOnCustomDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname === DOMAIN_CONFIG.CUSTOM_DOMAIN || hostname === DOMAIN_CONFIG.WWW_DOMAIN;
};

/**
 * Get the canonical URL for the current page
 */
export const getCanonicalUrl = (path: string = ''): string => {
  const baseUrl = getAppUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Redirect to custom domain if not already there
 */
export const redirectToCustomDomain = (path: string = ''): void => {
  if (typeof window === 'undefined') return;
  
  if (!isOnCustomDomain()) {
    const targetUrl = getCanonicalUrl(path);
    window.location.href = targetUrl;
  }
};

/**
 * Get domain information for debugging
 */
export const getDomainInfo = () => {
  if (typeof window === 'undefined') {
    return {
      hostname: 'server',
      isCustomDomain: false,
      isLocalhost: false,
      isFirebase: false,
      currentUrl: DOMAIN_CONFIG.PRIMARY_URL
    };
  }
  
  const hostname = window.location.hostname;
  
  return {
    hostname,
    isCustomDomain: isOnCustomDomain(),
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1',
    isFirebase: hostname.includes('web.app'),
    currentUrl: window.location.href,
    primaryDomain: DOMAIN_CONFIG.CUSTOM_DOMAIN,
    wwwDomain: DOMAIN_CONFIG.WWW_DOMAIN,
    firebaseUrl: DOMAIN_CONFIG.FIREBASE_URL
  };
};

/**
 * Log domain information for debugging
 */
export const logDomainInfo = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 Domain Information:', getDomainInfo());
  }
};
