import { apiClient as api } from "./api";

export interface AuditLog {
  id: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "ADD_GOAL"
    | "DELETE_GOAL"
    | "ADD_CARD"
    | "DELETE_CARD"
    | "ADD_SUBSTITUTION"
    | "DELETE_SUBSTITUTION"
    | "LINEUP_SET";
  entity_type: string;
  entity_id: string;
  description: string;
  timestamp: string;
}

export const auditLogService = {
  getLogs: async (
    limit: number = 20,
    offset: number = 0,
  ): Promise<AuditLog[]> => {
    const response = await api.get(
      `/audit-logs/?limit=${limit}&offset=${offset}`,
    );
    return response.data;
  },
};
