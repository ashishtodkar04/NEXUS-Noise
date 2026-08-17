import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    // Use police token if present (takes priority for police portal), else use citizen token
    const policeToken = localStorage.getItem('policeToken');
    const token = localStorage.getItem('token');
    const activeToken = policeToken || token;
    if (activeToken) {
      config.headers.Authorization = `Bearer ${activeToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401, clear tokens and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and let the app handle redirect
      localStorage.removeItem('token');
      localStorage.removeItem('policeToken');
      localStorage.removeItem('role');
    }
    return Promise.reject(error);
  }
);

export default api;
