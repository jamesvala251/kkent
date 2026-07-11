import api from './api';
import type { User } from '../store/slices/authSlice';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<{ data: User } | User>('/auth/me');
    return 'data' in data ? data.data : data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', payload);
    return data;
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
    return data;
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const { data } = await api.put<{ data: User } | User>('/auth/profile', payload);
    return 'data' in data ? data.data : data;
  },

  changePassword: async (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/change-password', payload);
    return data;
  },
};
