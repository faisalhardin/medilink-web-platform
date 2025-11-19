import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleanAllAuthStorage } from '@utils/authCleanup';
import { getStorageUser } from '@utils/storage';
import { notifyAuthStateChanged } from 'hooks/useAuthCallback';
import { Logout } from '@requests/authentication';

const UserComponent = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userInfo, setUserInfo] = useState<Record<string, any> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const user = getStorageUser();
        setUserInfo(user);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        Logout();
        try {
            
            cleanAllAuthStorage();
            // Notify all components that authentication state has changed
            notifyAuthStateChanged();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error logging out:', error);
        }
       

    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    if (!userInfo) {
        return (
            <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* User Button */}
            <button
                onClick={toggleDropdown}
                className="w-full flex items-center justify-between space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {/* Avatar */}
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        {userInfo.image_url ? (
                            <img
                                src={userInfo.image_url}
                                alt={userInfo.name}
                                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                                {getInitials(userInfo.name)}
                            </div>
                        )}
                    </div>
                    {/* User Info */}
                    <div className="text-left">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-32">
                            {userInfo.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-32">
                            {userInfo.institution_name ?? 'No Institution'}
                        </p>
                    </div>
                </div>


                {/* Dropdown Arrow */}
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 lg:left-full lg:bottom-0 lg:ml-3 z-50 w-full lg:w-auto">
                    {/* Dialog bubble container */}
                    <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full lg:min-w-64 lg:w-80 p-4">
                        {/* Action buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors duration-200"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserComponent;