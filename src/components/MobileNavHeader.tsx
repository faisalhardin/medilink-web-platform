import { useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { getJourneyBoardsCached } from "hooks/useJourneyBoards";
import { useEffect, useState } from "react";

interface MobileNavHeaderProps {
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
}

// Helper function to format route path to readable breadcrumb
const getBreadcrumbLabel = async (pathname: string, t: (key: string) => string): Promise<string> => {
  const routeMap: Record<string, string> = {
    '/': t('pages.home'),
    '/institution': t('navigation.institution'),
    '/patient': t('navigation.patient'),
    '/patient-detail': t('patient.patientDetail'),
    '/patient-registration': t('patient.registerPatient'),
    '/patient-visit': t('patient.visit'),
    '/journey-board': t('navigation.journeyBoard'),
    '/inventory': t('navigation.inventory'),
    '/product-replenishment': t('navigation.productReplenishment'),
    '/login': t('auth.login'),
    '/token-expired': t('auth.tokenExpired'),
  };

  // Check for exact matches first
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

  // Handle journey-board with specific board ID
  if (pathname.startsWith('/journey-board/')) {
    const journeyBoards = await getJourneyBoardsCached();
    const pathParts = pathname.split('/');
    const boardID = pathParts[pathParts.length - 1];
    const board = journeyBoards.find((b) => b.id.toString() === boardID);
    return board ? board.name : t('navigation.journeyBoard');
  }

  // Check for other dynamic routes (e.g., /patient-detail/:uuid)
  for (const [route, label] of Object.entries(routeMap)) {
    if (pathname.startsWith(route + '/') || pathname.startsWith(route)) {
      return label;
    }
  }

  // Fallback: capitalize first letter and replace hyphens with spaces
  return pathname
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
    .join(' / ') || t('pages.home');
};

export const MobileNavHeader = ({ isMobileNavOpen, setIsMobileNavOpen }: MobileNavHeaderProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [label, setLabel] = useState<string>('');
  
  useEffect(() => {
    getBreadcrumbLabel(location.pathname, t)
      .then(label => {
        setLabel(label);
      })
      .catch(() => {
        setLabel(t('common.error'));
      });
  }, [location.pathname, t]);

  // Only show when nav is closed
  if (isMobileNavOpen) {
    return null;
  }

  return (
    <div className="lg:hidden bg-white border-b border-gray-200 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 sticky top-0 z-30">
      {/* Hamburger button */}
      <button
        onClick={() => setIsMobileNavOpen(true)}
        className="text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label={t('navigation.openMenu')}
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Breadcrumb */}
      <div className="flex items-center text-xs sm:text-sm text-gray-700">
        <span className="font-medium">{label || t('common.loading')}</span>
      </div>
    </div>
  );
};

