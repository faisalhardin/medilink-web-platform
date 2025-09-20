import axios from 'axios';
import { setupAxiosTokenExpirationInterceptor } from './tokenExpiration';
import { JWT_TOKEN_KEY } from "constants/constants";

// Create axios instance
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_MEDILINK_API_BASE_URL,
    timeout: 10000,
});

// Set up token expiration interceptor
setupAxiosTokenExpirationInterceptor(apiClient);

// Request interceptor to add token
apiClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem(JWT_TOKEN_KEY);
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (!error.response) {
            console.error('Network error:', error.message);
        }
        
        // Handle specific error codes
        switch (error.response?.status) {
            case 401:
                console.log('Unauthorized - token may be expired');
                break;
            case 403:
                console.log('Forbidden - insufficient permissions');
                break;
            case 500:
                console.log('Server error');
                break;
            default:
                console.error('API Error:', error.response?.data || error.message);
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;
