import { apiClient } from "./api";
import type { CardEvent, CreateCardDto } from "../types";

export const cardService = {
  async getByMatchId(matchId: string): Promise<CardEvent[]> {
    const response = await apiClient.get<CardEvent[]>(
      `/cards/match/${matchId}`,
    );
    return response.data;
  },

  async create(data: CreateCardDto): Promise<CardEvent> {
    const response = await apiClient.post<CardEvent>("/cards/", data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/cards/${id}`);
  },
};
