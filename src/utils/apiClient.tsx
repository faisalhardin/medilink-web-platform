import axios from 'axios';
import { setupAxiosTokenExpirationInterceptor } from './tokenExpiration';
import { JWT_TOKEN_KEY } from "constants/constants";
import { showApiErrorReport } from './apiErrorReport';

// Create axios instance
export const authedClient = axios.create({
    baseURL: import.meta.env.VITE_MEDILINK_API_BASE_URL,
    timeout: 10000,
});

// Set up token expiration interceptor
setupAxiosTokenExpirationInterceptor(authedClient);

// Request interceptor to add token
authedClient.interceptors.request.use(
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
authedClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (!error.response) {
            console.error('Network error:', error.message);
        }
        
        const status = error.response?.status;

        // Handle specific error codes
        switch (status) {
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

        // Show backend messages for client errors (except 401 — auth refresh handles it)
        if (status && status >= 400 && status < 500 && status !== 401) {
            showApiErrorReport(error);
        }
        
        return Promise.reject(error);
    }
);

export default authedClient;
