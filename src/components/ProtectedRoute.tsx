import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleNotAuthenticated, handleTokenExpiration, isCurrentTokenExpired, setupTokenExpirationChecker } from "@utils/tokenExpiration";
import { getAuthStatus } from "@utils/authCleanup";

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthentication = async () => {
            const authStatus = getAuthStatus();
            if (!authStatus.isAuthenticated) {
                handleNotAuthenticated();
                return;
            }
            if (authStatus.isAuthenticated && isCurrentTokenExpired()) {
                await handleTokenExpiration();
            }
            

            setIsAuthenticated(true);
            setIsChecking(false);
        };

        // Initial check
        checkAuthentication();

    }, [navigate]);

    // Show loading state while checking
    if (isChecking) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // Show children if authenticated
    if (isAuthenticated) {
        return <>{children}</>;
    }

    // This should not be reached due to navigation, but just in case
    return null;
};

export default ProtectedRoute;
