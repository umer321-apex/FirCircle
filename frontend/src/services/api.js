import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'fitcircle_auth_token';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attaches the JWT to every outgoing request automatically, so individual
// service files never need to worry about auth headers themselves.
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error(`[api] Failed to attach auth token: ${error.message}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const message = error.response?.data?.message || error.message;

    console.error(`[api] Request failed: ${status || 'NETWORK'} ${url} — ${message}`);

    return Promise.reject(error);
  }
);

export default api;