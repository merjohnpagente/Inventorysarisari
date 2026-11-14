import axios, { AxiosError } from 'axios';
import mockAdapter from './mock';
import type { FormErrors } from '../types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL, headers: { Accept: 'application/json' } });

if (import.meta.env.VITE_MOCK) api.defaults.adapter = mockAdapter;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // auth token only; all data lives in MySQL
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

interface ApiErrorBody { message?: string; errors?: Record<string, string[]> }
const body = (e: unknown) => (e as AxiosError<ApiErrorBody>).response?.data;

export const errMsg = (e: unknown): string => body(e)?.message || 'Something went wrong. Check your connection and try again.';
export const fieldErrors = (e: unknown): FormErrors => {
  const errs = body(e)?.errors || {};
  return Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, v[0]]));
};
export const imgUrl = (path?: string | null) => (path ? `${baseURL.replace(/\/api\/?$/, '')}/storage/${path}` : null);
export const rows = <T = any>(d: unknown): T[] => (Array.isArray(d) ? d : (d as { data?: T[] } | null)?.data || []);
export default api;
