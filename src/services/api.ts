import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const SERVER_URL =
  import.meta.env.VITE_API_SERVER_URL || "http://localhost:8000";
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

// Track if we're currently refreshing to avoid loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  failedQueue = [];
};

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401) {
      const requestUrl = originalRequest?.url ?? "";
      const isLoginRequest = requestUrl.includes("/auth/login");
      const isRefreshRequest = requestUrl.includes("/auth/refresh");

      if (isLoginRequest) {
        return Promise.reject(error);
      }

      if (isRefreshRequest || originalRequest?._retry) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        processQueue(error);
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      let refreshed = false;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );
          localStorage.setItem("access_token", response.data.access_token);
          if (response.data.refresh_token) {
            localStorage.setItem("refresh_token", response.data.refresh_token);
          }
          refreshed = true;
        } catch {
          localStorage.removeItem("refresh_token");
        }
      }
      isRefreshing = false;

      if (refreshed) {
        processQueue(null);
        originalRequest._retry = true;
        return apiClient(originalRequest);
      }

      processQueue(error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
