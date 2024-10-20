import Content from "@components/Content";
import AppHeader from "@components/Header"

import ColumnNav from "@components/NavColumn";


const DefaultLayout = () => {
  return (
    <main className="flex flex-col min-h-screen">
            <AppHeader/>
            <div className="flex flex-1">
              <ColumnNav/>
              <Content/>
            </div>
        {/* <div className="flex flex-col min-h-screen"> */}
        {/* </div> */}
    </main>
  );
};

export default DefaultLayout;
