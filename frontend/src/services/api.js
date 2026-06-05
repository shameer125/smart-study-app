import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ss_token');
      localStorage.removeItem('ss_user');
      if (!location.pathname.startsWith('/login') && !location.pathname.startsWith('/register')) {
        location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const filesBaseURL = baseURL.replace(/\/api\/?$/, '');
