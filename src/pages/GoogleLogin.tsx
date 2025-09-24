import { useGoogleLogin } from "@react-oauth/google";
import { storeAuthentication, storeRefreshToken } from "@utils/storage";
import { cleanSpecificAuthStorage } from "@utils/authCleanup";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const medilinkAPIURL = import.meta.env.VITE_MEDILINK_API_BASE_URL;

const GoogleLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const googleLogin = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            setIsLoading(true);
            setError(null);
            
            try {
                
                const tokenResponse = await axios.get(
                    `${medilinkAPIURL}/v1/auth/google/callback?code=${codeResponse.code}`
                );
                
                if (tokenResponse.data.data.access_token) {
                    cleanSpecificAuthStorage();
                    storeAuthentication(tokenResponse.data.data.access_token);
                    storeRefreshToken(tokenResponse.data.data.refresh_token);
                    
                    // Redirect to home page after successful login
                    navigate('/');
                } else {
                    setError("Token not received in response.");
                }
            } catch (error) {
                console.error("Error during token retrieval:", error);
                setError("Login failed. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
        onError: (error) => {
            console.error("Login failed:", error);
            setError("Google login failed. Please try again.");
            setIsLoading(false);
        },
        flow: "auth-code",
    });

    const handleLogin = () => {
        googleLogin();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Use your Google account to continue
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Google Login Button */}
                        <div>
                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Continue with Google
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info Section */}
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Security Notice</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 text-xs text-gray-500 text-center">
                                <p>This will clear any existing login session and start fresh.</p>
                                <p className="mt-1">Your data is secure and encrypted.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleLogin;