import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isOnCustomDomain, redirectToCustomDomain, logDomainInfo } from '../utils/domainUtils';

interface DomainRedirectProps {
  children: React.ReactNode;
  enableRedirect?: boolean;
}

/**
 * DomainRedirect component handles automatic redirection to custom domain
 * when the app is accessed via Firebase URL in production
 */
const DomainRedirect: React.FC<DomainRedirectProps> = ({ 
  children, 
  enableRedirect = true 
}) => {
  const location = useLocation();

  useEffect(() => {
    // Log domain information in development
    logDomainInfo();

    // Only redirect in production and if enabled
    if (enableRedirect && process.env.NODE_ENV === 'production') {
      // Check if we're not on the custom domain
      if (!isOnCustomDomain()) {
        // Add a small delay to prevent flash of content
        const timer = setTimeout(() => {
          redirectToCustomDomain(location.pathname + location.search);
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, location.search, enableRedirect]);

  return <>{children}</>;
};

export default DomainRedirect;
