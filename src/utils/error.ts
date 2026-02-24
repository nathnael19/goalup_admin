import { AxiosError } from "axios";

/**
 * Backend error response shape (GoalUp API).
 * We always return { detail: string } from the API.
 */
interface ApiErrorDetail {
  detail?: string | Array<{ msg?: string; loc?: unknown[] }>;
}

/**
 * Get a user-facing error message from an unknown error (e.g. API or network).
 * Prefers the backend "detail" message when present.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorDetail | undefined;
    if (data?.detail) {
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        const first = data.detail[0];
        const msg = first?.msg ?? (typeof first === "string" ? first : "");
        const loc = first?.loc;
        if (loc && Array.isArray(loc)) {
          const field = loc.filter((x) => x !== "body").join(".");
          return field ? `${field}: ${msg}` : msg;
        }
        return String(msg);
      }
    }
    if (error.response) {
      const status = error.response.status;
      if (status === 404) return "The requested resource was not found.";
      if (status >= 500) return "Server error. Please try again later.";
    }
    if (error.code === "ERR_NETWORK" || !error.response)
      return "Network error. Please check your connection.";
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
