import axios from 'axios';
import { authStore } from '../store/auth.store';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

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
