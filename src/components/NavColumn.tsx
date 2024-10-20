
function ColumnNav() {
  return (
    <div className="w-60 bg-gray-800 text-white sticky top-0 top-[4rem] h-[calc(100vh-4rem)]">
      <div className="p-4 text-lg font-bold text-center">
        Dashboard
      </div>
      <ul className="space-y-4 p-4">
        <li>
          <button className="w-full text-left px-4 py-2  rounded hover:bg-gray-600">
            Patients
          </button>
        </li>
        <li>
          <button className="w-full text-left px-4 py-2  rounded hover:bg-gray-600">
            Room
          </button>
        </li>
      </ul>
    </div>
  );
}

export default ColumnNav;
