import ColumnNav from "@components/NavColumn";
import Home from "@pages/Home";
import Institution from "@pages/Institution";
import InventoryPage from "@pages/Inventory";
import JourneyBoard from "@pages/JourneyBoard";
import PatientPage from "@pages/Patient";
import PatientDetail from "@pages/PatientDetail";
import PatientRegistrationPage from "@pages/PatientRegistration";
import PatientVisitDetailPage from "@pages/PatientVisitDetail";
import GoogleLogin from "@pages/GoogleLogin";
import { Routes, Route } from "react-router-dom";
// import PatieVisitReg


const DefaultLayout = () => {
  return (
    <main className="flex w-full min-h-screen bg-gray-50">
      <ColumnNav/>
      <div className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/login" element={<GoogleLogin/>}/>
          <Route path="/institution" element={<Institution/>}/>
          <Route path="/patient" element={<PatientPage/>}/>
          <Route path="/patient-detail/:uuid" element={<PatientDetail/>}/>
          <Route path="/patient-registration" element={<PatientRegistrationPage/>} />
          <Route path="/patient-visit/:id" element={<PatientVisitDetailPage/>} />
          <Route path="/journey-board/:boardID" element={<JourneyBoard/>} />
          <Route path="/inventory" element={<InventoryPage/>} />
        </Routes>
      </div>
    </main>
  );
};

export default DefaultLayout;