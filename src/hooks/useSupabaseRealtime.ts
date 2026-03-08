import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useSupabaseRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Supabase realtime is disabled. If you need realtime again, implement it via
    // your own websocket/SSE layer backed by Neon.
    return () => {
      // no-op
    };
  }, [queryClient]);
};
