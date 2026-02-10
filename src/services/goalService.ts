import { apiClient } from "./api";
import type { Goal, CreateGoalDto } from "../types";

export const goalService = {
  async getByMatchId(matchId: string): Promise<Goal[]> {
    const response = await apiClient.get<Goal[]>(`/goals/match/${matchId}`);
    return response.data;
  },

  async create(data: CreateGoalDto): Promise<Goal> {
    const response = await apiClient.post<Goal>("/goals/", data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },
};
