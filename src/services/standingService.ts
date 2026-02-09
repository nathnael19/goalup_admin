import { apiClient } from "./api";
import type { Standing } from "../types";

export const standingService = {
  async getAll(): Promise<any[]> {
    const response = await apiClient.get<any[]>("/standings/");
    return response.data;
  },

  async getByTournament(tournamentId: string): Promise<any> {
    const response = await apiClient.get<any>(`/standings/${tournamentId}`);
    return response.data;
  },

  async recalculate(tournamentId: string): Promise<void> {
    await apiClient.post(`/standings/${tournamentId}/recalculate`);
  },
};
