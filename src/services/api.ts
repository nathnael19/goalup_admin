import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const FALLBACK_SERVER_URL = "http://localhost:8000";
export const SERVER_URL =
  import.meta.env.VITE_API_SERVER_URL || FALLBACK_SERVER_URL;
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `${SERVER_URL}/api/v1`;

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
