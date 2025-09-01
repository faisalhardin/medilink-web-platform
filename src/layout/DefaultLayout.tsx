import ColumnNav from "@components/NavColumn";
import Home from "@pages/Home";
import Institution from "@pages/Institution";
import InventoryPage from "@pages/Inventory";
import JourneyBoard from "@pages/JourneyBoard";
import PatientPage from "@pages/Patient";
import PatientDetail from "@pages/PatientDetail";
import PatientRegistrationPage from "@pages/PatientRegistration";
import PatientVisitDetailPage from "@pages/PatientVisitDetail";
import { Routes, Route } from "react-router-dom";
// import PatieVisitReg


const DefaultLayout = () => {
  return (
    <main className="grid grid-cols-[200px_1fr] h-screen w-full overflow-x-hidden bg-gray-50">
      <ColumnNav/>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/institution" element={<Institution/>}/>
          <Route path="/patient" element={<PatientPage/>}/>
          <Route path="/patient-detail/:uuid" element={<PatientDetail/>}/>
          <Route path="/patient-registration" element={<PatientRegistrationPage/>} />
          <Route path="/patient-visit/:id" element={<PatientVisitDetailPage/>} />
          <Route path="/journey-board/:boardID" element={<JourneyBoard/>} />
          <Route path="/inventory" element={<InventoryPage/>} />
        </Routes>
    </main>
  );
};

export default DefaultLayout;
