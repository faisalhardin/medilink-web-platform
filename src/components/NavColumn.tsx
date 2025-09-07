import { NavLink } from "react-router-dom";
import Login from "./Login";
import { NavList, NavListItem } from "./NavList";
import { GetJourneyBoards } from "@requests/journey";
import { JourneyBoard } from "@models/journey";


function ColumnNav() {
  return (
    <div className="bg-white border-r border-gray-200 flex-shrink-0 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink 
          to="/institution" 
          className={({ isActive }) => 
            `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
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
          className={({ isActive }) => 
            `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
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
        
        <NavList name="Journey Board" request={requestJourneyBoard} />
      </nav>
      
      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Login />
      </div>
    </div>
  );
}

export default ColumnNav;


const requestJourneyBoard = async (): Promise<NavListItem[]> => {
  try {
    const journeyBoardList = await GetJourneyBoards();
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