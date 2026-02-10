import { apiClient } from "./api";
import type { Competition, CreateCompetitionDto } from "../types";

export const competitionService = {
  async getAll(): Promise<Competition[]> {
    const response = await apiClient.get<Competition[]>("/competitions/");
    return response.data;
  },

  async getById(id: string): Promise<Competition> {
    const response = await apiClient.get<Competition>(`/competitions/${id}`);
    return response.data;
  },

  async create(data: CreateCompetitionDto): Promise<Competition> {
    const response = await apiClient.post<Competition>("/competitions/", data);
    return response.data;
  },

  async update(
    id: string,
    data: Partial<CreateCompetitionDto>,
  ): Promise<Competition> {
    const response = await apiClient.put<Competition>(
      `/competitions/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/competitions/${id}`);
  },
};
