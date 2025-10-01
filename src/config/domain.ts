// Domain configuration for medianne.id
export const DOMAIN_CONFIG = {
  // Primary domain
  CUSTOM_DOMAIN: 'medianne.id',
  WWW_DOMAIN: 'www.medianne.id',
  
  // Firebase hosting URL (fallback)
  FIREBASE_URL: 'medianne-web.web.app',
  
  // Full URLs
  PRIMARY_URL: 'https://medianne.id',
  WWW_URL: 'https://www.medianne.id',
  FIREBASE_FULL_URL: 'https://medianne-web.web.app',
  
  // Environment detection
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Get current domain
  getCurrentDomain: () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    return 'medianne.id'; // Default fallback
  },
  
  // Check if running on custom domain
  isCustomDomain: () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'medianne.id' || 
             window.location.hostname === 'www.medianne.id';
    }
    return false;
  },
  
  // Get the appropriate base URL
  getBaseUrl: () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://medianne.id';
  }
};

// Export individual values for convenience
export const {
  CUSTOM_DOMAIN,
  WWW_DOMAIN,
  FIREBASE_URL,
  PRIMARY_URL,
  WWW_URL,
  FIREBASE_FULL_URL,
  isProduction,
  isDevelopment,
  getCurrentDomain,
  isCustomDomain,
  getBaseUrl
} = DOMAIN_CONFIG;
