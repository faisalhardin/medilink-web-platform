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
import TokenExpired from "@pages/TokenExpired";
import ProtectedRoute from "@components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";
// import PatieVisitReg


const DefaultLayout = () => {
  return (
    <main className="flex w-full min-h-screen bg-gray-50">
      <ColumnNav/>
      <div className="flex-1 overflow-x-hidden">
        <Routes>
          {/* Public routes - no authentication required */}
          <Route path="/login" element={<GoogleLogin/>}/>
          <Route path="/token-expired" element={<TokenExpired/>}/>
          
          {/* Protected routes - authentication required */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home/>
            </ProtectedRoute>
          }/>
          <Route path="/institution" element={
            <ProtectedRoute>
              <Institution/>
            </ProtectedRoute>
          }/>
          <Route path="/patient" element={
            <ProtectedRoute>
              <PatientPage/>
            </ProtectedRoute>
          }/>
          <Route path="/patient-detail/:uuid" element={
            <ProtectedRoute>
              <PatientDetail/>
            </ProtectedRoute>
          }/>
          <Route path="/patient-registration" element={
            <ProtectedRoute>
              <PatientRegistrationPage/>
            </ProtectedRoute>
          } />
          <Route path="/patient-visit/:id" element={
            <ProtectedRoute>
              <PatientVisitDetailPage/>
            </ProtectedRoute>
          } />
          <Route path="/journey-board/:boardID" element={
            <ProtectedRoute>
              <JourneyBoard/>
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute>
              <InventoryPage/>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </main>
  );
};

export default DefaultLayout;