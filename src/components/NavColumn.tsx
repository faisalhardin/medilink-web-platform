import { NavLink } from "react-router-dom";


function ColumnNav() {
  return (
    <div className="w-60 bg-gray-800 text-white sticky top-0 top-[4rem] h-[calc(100vh-4rem)]">
      <div className="p-4 text-lg font-bold text-center">
        Dashboard
      </div>
      <ul className="space-y-4 p-4">
        <NavLink to="/institution">
        <li>
          <button className="w-full text-left px-4 py-2  rounded hover:bg-gray-600">
            Institution
          </button>
        </li>
        </NavLink>
        <NavLink to="/patient">
        <li>
          <button className="w-full text-left px-4 py-2  rounded hover:bg-gray-600">
            Patient
          </button>
        </li>
        </NavLink>
      </ul>
    </div>
  );
}

export default ColumnNav;
