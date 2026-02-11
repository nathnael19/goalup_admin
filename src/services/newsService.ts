import { apiClient } from "./api";
import type {
  News,
  CreateNewsDto,
  UpdateNewsDto,
  NewsCategory,
} from "../types";

export const newsService = {
  getAll: async (category?: NewsCategory): Promise<News[]> => {
    const params = category ? { category } : {};
    const response = await apiClient.get("/news/", { params });
    return response.data;
  },

  getById: async (id: string): Promise<News> => {
    const response = await apiClient.get(`/news/${id}`);
    return response.data;
  },

  create: async (data: CreateNewsDto): Promise<News> => {
    const response = await apiClient.post("/news/", data);
    return response.data;
  },

  update: async (id: string, data: UpdateNewsDto): Promise<News> => {
    const response = await apiClient.put(`/news/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/news/${id}`);
  },
};
