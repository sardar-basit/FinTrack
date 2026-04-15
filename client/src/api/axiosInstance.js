import axios from 'axios';

// Map 5173 -> 5000 in development, or relative in production
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle global errors (e.g., auto-logout on 401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-logout for expected 401s like bad login
      if (!error.config.url.includes('/auth/login')) {
         localStorage.removeItem('token');
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
