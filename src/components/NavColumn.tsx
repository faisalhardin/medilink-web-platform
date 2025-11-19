import { NavLink } from "react-router-dom";
import Login from "./Login";
import { NavList, NavListItem } from "./NavList";
import { JourneyBoard } from "@models/journey";
import { useAuthState } from "hooks/useAuthCallback";
import UserComponent from "./UserComponent";
import { useEffect } from "react";
import { getJourneyBoardsCached } from "hooks/useJourneyBoards";

interface ColumnNavProps {
  isMobileNavOpen?: boolean;
  setIsMobileNavOpen?: (open: boolean) => void;
}

function ColumnNav({ isMobileNavOpen = false, setIsMobileNavOpen }: ColumnNavProps) {
  const { isAuthenticated, isLoading } = useAuthState();

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileNavOpen]);

  const handleNavClick = () => {
    // Close mobile nav when a nav item is clicked (mobile only)
    if (setIsMobileNavOpen && window.innerWidth < 1024) {
      setIsMobileNavOpen(false);
    }
  };

  const handleBackdropClick = () => {
    if (setIsMobileNavOpen) {
      setIsMobileNavOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay - mobile only */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={handleBackdropClick}
        />
      )}
      
      {/* Navigation */}
      <div className={`
        bg-white border-r border-gray-200 flex-shrink-0 h-screen flex flex-col
        fixed lg:sticky top-0 left-0 z-50
        w-full lg:w-64
        transform transition-transform duration-300 ease-in-out
        ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Dashboard</h1>
          {/* Close button - mobile only */}
          {setIsMobileNavOpen && (
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink 
          to="/institution"
          onClick={handleNavClick}
          className={({ isActive }) => 
            `flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Institution
        </NavLink>
        
        <NavLink 
          to="/patient"
          onClick={handleNavClick}
          className={({ isActive }) => 
            `flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Patient
        </NavLink>
        
        <NavLink 
          to="/inventory"
          onClick={handleNavClick}
          className={({ isActive }) => 
            `flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Inventory
        </NavLink>
        
        <NavLink 
          to="/product-replenishment"
          onClick={handleNavClick}
          className={({ isActive }) => 
            `flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Product Replenishment
        </NavLink>
        
        <NavList name="Journey Board" request={requestJourneyBoard} onNavClick={handleNavClick} />
      </nav>
      
      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 flex-shrink-0">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : isAuthenticated ? (
          <div className="w-full">
            <UserComponent/>
          </div>
        ) : (
          <Login />
        )}
      </div>
    </div>
    </>
  );
}

export default ColumnNav;


const requestJourneyBoard = async (): Promise<NavListItem[]> => {
  try {
    const journeyBoardList = await getJourneyBoardsCached();
    return journeyBoardList.map((board: JourneyBoard): NavListItem => {
      return {
        id: board.id,
        name: board.name,
        pageURL: `/journey-board/${board.id}`
      }
    })
  } catch (error) {
    return [];
  }
};