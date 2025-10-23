import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const signup = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Query APIs
export const executeQuery = async (query) => {
  const response = await api.post('/query/execute', { query });
  return response.data;
};

export const getQueryHistory = async () => {
  const response = await api.get('/query/history');
  return response.data;
};

export const clearQueryHistory = async () => {
  const response = await api.delete('/query/history');
  return response.data;
};

// Table APIs
export const getTables = async () => {
  const response = await api.get('/tables');
  return response.data;
};

export const getTableInfo = async (tableName) => {
  const response = await api.get(`/tables/${tableName}`);
  return response.data;
};

export default api;