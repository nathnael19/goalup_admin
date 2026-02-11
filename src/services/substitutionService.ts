import axios from "axios";
import type { Substitution, CreateSubstitutionDto } from "../types";

const API_URL = "http://localhost:8000/api/v1";

export const substitutionService = {
  getByMatchId: async (matchId: string): Promise<Substitution[]> => {
    const response = await axios.get(
      `${API_URL}/substitutions/match/${matchId}`,
    );
    return response.data;
  },

  create: async (data: CreateSubstitutionDto): Promise<Substitution> => {
    const response = await axios.post(`${API_URL}/substitutions/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/substitutions/${id}`);
  },
};
