import { api, setCsrfToken } from './api';
import { ApiResponse, AuthUser } from '../types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  course: string;
  yearOfStudy: string;
  profileImage?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async ensureCsrf() {
    const res = await api.get<ApiResponse<{ csrfToken: string }>>('/auth/csrf');
    setCsrfToken(res.data.data.csrfToken);
    return res.data.data.csrfToken;
  },

  async register(payload: RegisterPayload) {
    const res = await api.post<ApiResponse<{ user: AuthUser; csrfToken: string }>>(
      '/auth/register',
      payload
    );
    setCsrfToken(res.data.data.csrfToken);
    return res.data.data.user;
  },

  async login(payload: LoginPayload) {
    const res = await api.post<ApiResponse<{ user: AuthUser; csrfToken: string }>>(
      '/auth/login',
      payload
    );
    setCsrfToken(res.data.data.csrfToken);
    return res.data.data.user;
  },

  async logout() {
    await api.post('/auth/logout');
    setCsrfToken('');
  },

  async getMe() {
    const res = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
    return res.data.data.user;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    const res = await api.patch<ApiResponse<null>>('/auth/change-password', payload);
    return res.data;
  },
};
