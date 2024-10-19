import AppHeader from "@components/Header"
import LoginPage from "@components/Login";
import ColumnNav from "@components/NavColumn";


const DefaultLayout = () => {
  return (
    <main>
      <AppHeader/>
      <ColumnNav/>
      <LoginPage/>
    </main>
  );
};

export default DefaultLayout;
