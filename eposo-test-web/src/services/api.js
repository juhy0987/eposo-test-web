import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  withCredentials: true, // Send cookies with requests
});

// Add access token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const signUp = async (credentials) => {
  const { email, password, passwordConfirmation } = credentials;
  // Vite proxy will forward this request to the backend
  const response = await api.post('/api/auth/signup', {
    email,
    password,
    passwordConfirmation,
  });
  return response.data;
};

export const login = async (credentials) => {
  const { email, password } = credentials;
  const response = await api.post('/api/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

// Helper function to store access token
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

// Helper function to get access token
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

// Helper function to clear all auth data
export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('autoLogin');
  localStorage.removeItem('user');
};

export default api;
