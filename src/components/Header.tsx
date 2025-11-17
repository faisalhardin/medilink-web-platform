import Login from "@components/Login";



const AppHeader = () => {

  return (
    <header className="w-full bg-blue-600 text-white py-4 px-6 sticky top-0 z-10">
        <h1 className="text-sm sm:text-base lg:text-lg font-bold">Dashboard Header</h1>
        <div>
          <Login/>
        </div>
    </header>
  );
};

export default AppHeader;
