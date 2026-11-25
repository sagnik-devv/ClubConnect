import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

let csrfMemoryToken = '';

export function setCsrfToken(token?: string) {
  if (token) csrfMemoryToken = token;
}

function readCsrfFromCookie(): string {
  const match = document.cookie.match(/(?:^|;\s*)clubconnect_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : csrfMemoryToken;
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'get').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = readCsrfFromCookie();
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshWaiters: Array<(ok: boolean) => void> = [];

function notifyWaiters(ok: boolean) {
  refreshWaiters.forEach((cb) => cb(ok));
  refreshWaiters = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshWaiters.push((ok) => {
            if (ok) resolve(api(originalRequest));
            else reject(error);
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post<ApiResponse<{ csrfToken?: string }>>('/auth/refresh');
        setCsrfToken(res.data.data?.csrfToken);
        notifyWaiters(true);
        return api(originalRequest);
      } catch (refreshErr) {
        notifyWaiters(false);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(err)) {
    const data = err.response?.data;
    if (data?.errors && data.errors.length > 0) {
      return data.errors[0].message || data.message || fallback;
    }
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
