import AppHeader from "@components/Header"

import ColumnNav from "@components/NavColumn";
import Home from "@pages/Home";
import Institution from "@pages/Institution";
import PatientPage from "@pages/Patient";
import PatientDetail from "@pages/PatientDetail";
import { Routes, Route } from "react-router-dom";


const DefaultLayout = () => {
  return (
    <main className="flex flex-col min-h-screen">
            <AppHeader/>
            <div className="flex flex-1">
              <ColumnNav/>
              <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/institution" element={<Institution/>}/>
                <Route path="/patient" element={<PatientPage/>}/>
                <Route path="/patient-detail/:uuid" element={<PatientDetail/>}/>
              </Routes>
            </div>

    </main>
  );
};

export default DefaultLayout;
