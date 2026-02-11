import { apiClient } from "./api";
import type { Match, CreateMatchDto, UpdateMatchScoreDto } from "../types";

export const matchService = {
  async getAll(
    params: { offset?: number; limit?: number; tournament_id?: string } = {},
  ): Promise<Match[]> {
    const response = await apiClient.get<Match[]>("/matches/", {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<Match> {
    const response = await apiClient.get<Match>(`/matches/${id}`);
    return response.data;
  },

  async create(data: CreateMatchDto): Promise<Match> {
    const response = await apiClient.post<Match>("/matches/", data);
    return response.data;
  },

  async update(id: string, data: UpdateMatchScoreDto): Promise<Match> {
    const response = await apiClient.put<Match>(`/matches/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/matches/${id}`);
  },
};
