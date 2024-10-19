const AppHeader = () => {

  return (
    <nav className="fixed  w-full z-10  py-3 px-20">
      <div className="relative w-full mx-auto flex justify-between items-center ">
        <div className="relative flex-1">
          <img
            className="h-16 w-auto mx-auto top-0 md:ml-0"
            src="/assets/ib_footer_logo.png"
            alt="Logo"
          />
        </div>
        <div className="hidden md:flex items-center space-x-4 inset-y-0 top-0 right-0">
          <a className="txt-clr-wt uppercase heading-text-1" href="#about">
            Keunggulan
          </a>
          <a className="txt-clr-wt uppercase heading-text-1" href="#howto">
            Cara Order
          </a>
          <a
            className="txt-clr-wt uppercase heading-text-1"
            href="https://bit.ly/3Cky2Yx"
            target="_blank"
            rel="noreferrer"
          >
            Login
          </a>
        </div>
      </div>
    </nav>
  );
};

export default AppHeader;
