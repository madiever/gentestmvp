import axios from 'axios';
import { authStore } from '../store/auth.store';

// В production на Vercel используем относительный путь (тот же домен)
// В development используем полный URL или переменную окружения
const baseURL = import.meta.env.VITE_API_URL 
  || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5111/api/v1');

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      authStore.logout();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);
