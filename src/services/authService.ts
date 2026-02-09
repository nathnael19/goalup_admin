import { apiClient } from "./api";
import type { LoginCredentials, AuthTokens, User } from "../types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const formData = new FormData();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);

    const response = await apiClient.post<AuthTokens>("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  logout() {
    localStorage.removeItem("access_token");
  },
};
