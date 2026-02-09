import { apiClient } from "./api";
import type { Team, CreateTeamDto, TeamDetail } from "../types";

export const teamService = {
  async getAll(): Promise<Team[]> {
    const response = await apiClient.get<Team[]>("/teams/");
    return response.data;
  },

  async getById(id: string): Promise<TeamDetail> {
    const response = await apiClient.get<TeamDetail>(`/teams/${id}`);
    return response.data;
  },

  async create(data: CreateTeamDto): Promise<Team> {
    const response = await apiClient.post<Team>("/teams/", data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateTeamDto>): Promise<Team> {
    const response = await apiClient.put<Team>(`/teams/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`);
  },
};
