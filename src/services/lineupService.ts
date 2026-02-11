import { apiClient } from "./api";
import type { Lineup, MatchLineupDto } from "../types";

export const lineupService = {
  setLineups: async (
    matchId: string,
    lineups: MatchLineupDto[],
  ): Promise<Lineup[]> => {
    const response = await apiClient.post(
      `/matches/${matchId}/lineups`,
      lineups,
    );
    return response.data;
  },
};
