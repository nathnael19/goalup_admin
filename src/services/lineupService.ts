import { apiClient } from "./api";
import type { Lineup, MatchLineupDto } from "../types";

export const lineupService = {
  setLineups: async (
    matchId: string,
    lineups: MatchLineupDto[],
    formations?: { formation_a?: string; formation_b?: string },
  ): Promise<Lineup[]> => {
    const params: Record<string, string> = {};
    if (formations?.formation_a) params.formation_a = formations.formation_a;
    if (formations?.formation_b) params.formation_b = formations.formation_b;

    const response = await apiClient.post(
      `/matches/${matchId}/lineups`,
      lineups,
      { params },
    );
    return response.data;
  },
};
