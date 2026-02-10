import { apiClient } from "./api";
import type { GroupedStanding } from "../types";

export const standingService = {
  async getAll(): Promise<GroupedStanding[]> {
    const response = await apiClient.get<GroupedStanding[]>("/standings/");
    return response.data;
  },

  async getByTournament(tournamentId: string): Promise<GroupedStanding> {
    const response = await apiClient.get<GroupedStanding>(
      `/standings/${tournamentId}`,
    );
    return response.data;
  },

  async recalculate(tournamentId: string): Promise<void> {
    await apiClient.post(`/standings/${tournamentId}/recalculate`);
  },
};
