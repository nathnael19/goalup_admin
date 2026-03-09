import { apiClient } from "./api";
import type { User } from "../types";

export const authService = {
  /**
   * Sign in with email/password via our backend proxy.
   */
  async login(email: string, password: string): Promise<User> {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    const response = await apiClient.post<{
      access_token: string;
      refresh_token?: string;
      user: User;
    }>(
      "/auth/login",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Store tokens for the axios interceptor
    localStorage.setItem("access_token", response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }
    return response.data.user;
  },

  /**
   * Get the current user's profile from the backend.
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  /**
   * Update the current user's profile.
   */
  async updateProfile(userData: Partial<User> & { password?: string }): Promise<User> {
    const response = await apiClient.patch<User>("/auth/me", userData);
    return response.data;
  },

  /**
   * Sign out via our backend proxy.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  },

  /**
   * Refresh the access token using the refresh token. Used when 401 occurs.
   */
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    try {
      const response = await apiClient.post<{
        access_token: string;
        refresh_token?: string;
        user: User;
      }>("/auth/refresh", { refresh_token: refreshToken });
      localStorage.setItem("access_token", response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem("refresh_token", response.data.refresh_token);
      }
      return true;
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return false;
    }
  },

  /**
   * Send a password reset email via our backend proxy.
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  },
};
