import { NavLink } from "react-router-dom";
import Login from "./Login";
import { NavList, NavListItem } from "./NavList";
import { GetJourneyBoards } from "@requests/journey";
import { JourneyBoard } from "@models/journey";


function ColumnNav() {
  return (
    <div className="w-[200px] h-screen shadow-md relative">
      <div className="p-4 text-lg font-bold text-center">
        Dashboard
      </div>
      <div className="mb-6">
      </div>
      <ul className="p-4 mt-2">
        <NavLink to="/institution">
          <li className="w-full rounded button-style-1 text-left">
              Institution
          </li>
        </NavLink>
        <NavLink to="/patient">
          <li className="w-full rounded button-style-1 text-left">
              Patient
          </li>
        </NavLink>
        <NavList name="Journey Board" request={requestJourneyBoard} />
        <li>
          <Login />
        </li>
      </ul>
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