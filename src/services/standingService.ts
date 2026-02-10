import { apiClient } from "./api";
import type { GroupedStanding } from "../types";

export const standingService = {
  async getAll(year?: number): Promise<GroupedStanding[]> {
    const response = await apiClient.get<GroupedStanding[]>("/standings/", {
      params: { year },
    });
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
