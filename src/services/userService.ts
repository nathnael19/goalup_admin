import { apiClient } from "./api";
import type { User, UserCreateDto, UserUpdateDto } from "../types";

export const userService = {
  async getAll(offset = 0, limit = 100): Promise<User[]> {
    const response = await apiClient.get<User[]>("/users/", {
      params: { offset, limit },
    });
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  async create(user: UserCreateDto): Promise<User> {
    const response = await apiClient.post<User>("/users/", user);
    return response.data;
  },

  async update(id: string, user: UserUpdateDto): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, user);
    return response.data;
  },

  async delete(id: string): Promise<{ ok: boolean }> {
    const response = await apiClient.delete<{ ok: boolean }>(`/users/${id}`);
    return response.data;
  },
};
