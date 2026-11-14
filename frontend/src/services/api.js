import axios from 'axios';
import mockAdapter from './mock';

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
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e.response?.data?.message || 'Something went wrong. Check your connection and try again.';
export const fieldErrors = (e) => {
  const errs = e.response?.data?.errors || {};
  return Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, v[0]]));
};
export const imgUrl = (path) => (path ? `${baseURL.replace(/\/api\/?$/, '')}/storage/${path}` : null);
export const rows = (d) => (Array.isArray(d) ? d : d?.data || []);
export default api;
