import { useLocation } from "react-router-dom";
import { getJourneyBoardsCached } from "hooks/useJourneyBoards";
import { useEffect, useState } from "react";

interface MobileNavHeaderProps {
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
}

// Helper function to format route path to readable breadcrumb
const getBreadcrumbLabel = async (pathname: string): Promise<string> => {
  const routeMap: Record<string, string> = {
    '/': 'Home',
    '/institution': 'Institution',
    '/patient': 'Patient',
    '/patient-detail': 'Patient Detail',
    '/patient-registration': 'Patient Registration',
    '/patient-visit': 'Patient Visit',
    '/journey-board': 'Journey Board',
    '/inventory': 'Inventory',
    '/product-replenishment': 'Product Replenishment',
    '/login': 'Login',
    '/token-expired': 'Token Expired',
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
    return board ? board.name : 'Journey Board';
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
    .join(' / ') || 'Home';
};

export const MobileNavHeader = ({ isMobileNavOpen, setIsMobileNavOpen }: MobileNavHeaderProps) => {
  const location = useLocation();
  const [label, setLabel] = useState<string>('');
  
  useEffect(() => {
    getBreadcrumbLabel(location.pathname)
      .then(label => {
        setLabel(label);
      })
      .catch(() => {
        setLabel('Error');
      });
  }, [location.pathname]);

  // Only show when nav is closed
  if (isMobileNavOpen) {
    return null;
  }

  return (
    <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
      {/* Hamburger button */}
      <button
        onClick={() => setIsMobileNavOpen(true)}
        className="text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-700">
        <span className="font-medium">{label || 'Loading...'}</span>
      </div>
    </div>
  );
};

