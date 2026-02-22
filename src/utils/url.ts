import { SERVER_URL } from "../services/api";

const SUPABASE_PROJECT_URL = "https://ztnvsdivoxjssozkgpbc.supabase.co";
const SUPABASE_BUCKET = "uploads";

/**
 * Get the full URL for an image.
 * If the image URL is already absolute (starts with http), it's returned as is.
 * If it's a relative path, it's either a Supabase storage path or a local static path.
 */
export const getFullImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  // If it's a Supabase path (doesn't start with /static or /)
  if (!url.startsWith("/static") && !url.startsWith("/")) {
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${url}`;
  }

  return `${SERVER_URL}${url.startsWith("/") ? url : `/${url}`}`;
};
