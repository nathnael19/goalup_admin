import { apiClient } from "./api";
import type { Tournament, CreateTournamentDto } from "../types";

export const tournamentService = {
  async getAll(): Promise<Tournament[]> {
    const response = await apiClient.get<Tournament[]>("/tournaments/");
    return response.data;
  },

  async getById(id: string): Promise<Tournament> {
    const response = await apiClient.get<Tournament>(`/tournaments/${id}`);
    return response.data;
  },

  async create(data: CreateTournamentDto): Promise<Tournament> {
    const response = await apiClient.post<Tournament>("/tournaments/", data);
    return response.data;
  },

  async update(
    id: string,
    data: Partial<CreateTournamentDto>,
  ): Promise<Tournament> {
    const response = await apiClient.put<Tournament>(
      `/tournaments/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tournaments/${id}`);
  },

  async schedule(
    id: string,
    data: {
      start_date: string;
      matches_per_day: number;
      interval_days: number;
      total_time: number;
    },
  ): Promise<void> {
    await apiClient.post(`/tournaments/${id}/schedule`, data);
  },
};
