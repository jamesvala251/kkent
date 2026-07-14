import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

function isAuthFormRequest(url?: string): boolean {
  if (!url) {
    return false;
  }

  return /\/auth\/(login|forgot-password|reset-password)/.test(url);
}

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && body.success === true && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const requestUrl = error.config?.url;

    if (status === 401) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    if (isAuthFormRequest(requestUrl)) {
      return Promise.reject(error);
    }

    if (status === 422 && error.response?.data?.errors) {
      const errors = error.response.data.errors;
      const firstError = Object.values(errors)[0]?.[0];
      toast.error(firstError || message);
    } else if (status !== 404) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default api;
