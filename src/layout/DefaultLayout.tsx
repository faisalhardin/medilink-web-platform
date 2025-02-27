import AppHeader from "@components/Header"

import ColumnNav from "@components/NavColumn";
import Home from "@pages/Home";
import Institution from "@pages/Institution";
import JourneyBoard from "@pages/JourneyBoard";
import PatientPage from "@pages/Patient";
import PatientDetail from "@pages/PatientDetail";
import PatientRegistrationPage from "@pages/PatientRegistration";
import { Routes, Route } from "react-router-dom";


const DefaultLayout = () => {
  return (
    <main >
            <div className="flex flex-1">
              <ColumnNav/>
              <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/institution" element={<Institution/>}/>
                <Route path="/patient" element={<PatientPage/>}/>
                <Route path="/patient-detail/:uuid" element={<PatientDetail/>}/>
                <Route path="/patient-registration" element={<PatientRegistrationPage/>} />
                <Route path="/journey-board" element={<JourneyBoard/>} />
              </Routes>
            </div>

    </main>
  );
};

export default DefaultLayout;
