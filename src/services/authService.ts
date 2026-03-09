import { apiClient } from "./api";
import type { User } from "../types";

export const authService = {
  /**
   * Sign in with email/password via our backend proxy.
   */
  async login(email: string, password: string): Promise<User> {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const response = await apiClient.post<{ access_token: string; user: User }>(
      "/auth/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Store the token for the axios interceptor
    localStorage.setItem("access_token", response.data.access_token);
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
    }
  },

  /**
   * Send a password reset email via our backend proxy.
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  },
};
