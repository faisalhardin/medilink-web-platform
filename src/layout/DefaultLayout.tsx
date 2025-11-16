import ColumnNav from "@components/NavColumn";
import { MobileNavHeader } from "@components/MobileNavHeader";
import Home from "@pages/Home";
import Institution from "@pages/Institution";
import InventoryPage from "@pages/Inventory";
import ProductReplenishmentPage from "@pages/ProductReplenishment";
import JourneyBoard from "@pages/JourneyBoard";
import PatientPage from "@pages/Patient";
import PatientDetail from "@pages/PatientDetail";
import PatientRegistrationPage from "@pages/PatientRegistration";
import PatientVisitDetailPage from "@pages/PatientVisitDetail";
import GoogleLogin from "@pages/GoogleLogin";
import TokenExpired from "@pages/TokenExpired";
import ProtectedRoute from "@components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
// import PatieVisitReg

const DefaultLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close mobile nav when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <main className="flex w-full min-h-screen bg-gray-50">
      <ColumnNav isMobileNavOpen={isMobileNavOpen} setIsMobileNavOpen={setIsMobileNavOpen} />
      <div className="flex-1 overflow-x-hidden">
        <MobileNavHeader isMobileNavOpen={isMobileNavOpen} setIsMobileNavOpen={setIsMobileNavOpen} />
        
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
          <Route path="/product-replenishment" element={
            <ProtectedRoute>
              <ProductReplenishmentPage/>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </main>
  );
};

export default DefaultLayout;