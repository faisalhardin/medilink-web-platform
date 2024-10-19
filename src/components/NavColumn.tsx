import React from 'react';

function ColumnNav() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-60 bg-gray-800 text-white h-full">
        <div className="p-4 text-lg font-bold text-center">
          Dashboard
        </div>
        <ul className="space-y-4 p-4">
          <li>
            <button className="w-full text-left px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
              Institution
            </button>
          </li>
          <li>
            <button className="w-full text-left px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
              Patients
            </button>
          </li>
          <li>
            <button className="w-full text-left px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
              Room
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-10">
        <h1 className="text-2xl font-bold">Main Content</h1>
        <p>Here is where the main content will go.</p>
      </div>
    </div>
  );
}

export default ColumnNav;
