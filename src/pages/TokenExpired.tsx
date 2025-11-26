import { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { getAuthStatus } from "@utils/authCleanup";

const TokenExpired = () => {
    const { t } = useTranslation();
    const [countdown, setCountdown] = useState(5);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const navigate = useNavigate();
    const hasNavigated = useRef(false);

    useEffect(() => {
        // Start countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setIsRedirecting(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Handle navigation when countdown reaches 0
    useEffect(() => {
        if (countdown === 0 && !hasNavigated.current) {
            hasNavigated.current = true;
            setIsRedirecting(true);
            navigate('/login', { replace: true });
        }
    }, [countdown, navigate]);

    const handleRedirectNow = () => {
        if (!hasNavigated.current) {
            hasNavigated.current = true;
            setIsRedirecting(true);
            navigate('/login', { replace: true });
        }
    };

    const handleRetry = () => {
        if (hasNavigated.current) return;
        
        // Check if there's still a valid token
        const authStatus = getAuthStatus();
        if (authStatus.isAuthenticated) {
            // Token might have been refreshed, go back to previous page
            hasNavigated.current = true;
            navigate(-1);
        } else {
            // Still no valid token, go to login
            hasNavigated.current = true;
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    {/* Warning Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                        {t('auth.sessionExpired')}
                    </h2>
                    <p className="text-sm text-gray-600 mb-8">
                        {t('auth.sessionExpiredMessage')}
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        {/* Countdown Timer */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 mb-2">
                                {isRedirecting ? t('auth.redirecting') : countdown}
                            </div>
                            <p className="text-sm text-gray-500">
                                {isRedirecting 
                                    ? t('auth.takingToLogin')
                                    : t('auth.redirectingToLogin')
                                }
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleRedirectNow}
                                disabled={isRedirecting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isRedirecting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('auth.redirecting')}
                                    </>
                                ) : (
                                    t('auth.goToLoginNow')
                                )}
                            </button>

                            <button
                                onClick={handleRetry}
                                disabled={isRedirecting}
                                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {t('auth.tryAgain')}
                            </button>
                        </div>

                        {/* Security Information */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        {t('auth.whyDidThisHappen')}
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>{t('auth.sessionExpiredSecurity')}</li>
                                            <li>{t('auth.inactiveTooLong')}</li>
                                            <li>{t('auth.tokenInvalid')}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                {t('auth.needHelp')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TokenExpired;
