import { SERVER_URL } from "../services/api";

/**
 * Get the full URL for an image.
 * If the image URL is already absolute (starts with http), it's returned as is.
 * If it's a relative path, it's prefixed with the backend server URL.
 */
export const getFullImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
};
