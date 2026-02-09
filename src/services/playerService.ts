import { apiClient } from "./api";
import type { Player, CreatePlayerDto, UpdatePlayerStatsDto } from "../types";

export const playerService = {
  async getAll(): Promise<Player[]> {
    const response = await apiClient.get<Player[]>("/players/");
    return response.data;
  },

  async getById(id: string): Promise<Player> {
    const response = await apiClient.get<Player>(`/players/${id}`);
    return response.data;
  },

  async create(data: CreatePlayerDto): Promise<Player> {
    const response = await apiClient.post<Player>("/players/", data);
    return response.data;
  },

  async update(
    id: string,
    data: Partial<CreatePlayerDto> | UpdatePlayerStatsDto,
  ): Promise<Player> {
    const response = await apiClient.put<Player>(`/players/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/players/${id}`);
  },
};
