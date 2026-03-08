import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "../services/api";
import { queryKeys } from "./useData";

export const useSupabaseRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let stopped = false;
    let reconnectTimer: number | null = null;
    let attempt = 0;

    const buildWsUrl = () => {
      const base = SERVER_URL.replace(/^http/, "ws").replace(/\/$/, "");
      const token = localStorage.getItem("access_token") || "";
      const url = new URL(`${base}/ws`);
      if (token) url.searchParams.set("token", token);
      return url.toString();
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      const delay = Math.min(10_000, 500 * 2 ** Math.min(attempt, 6));
      reconnectTimer = window.setTimeout(() => {
        attempt += 1;
        connect();
      }, delay);
    };

    const connect = () => {
      if (stopped) return;
      try {
        ws = new WebSocket(buildWsUrl());
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        attempt = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as {
            type?: string;
            entity?: string;
            action?: string;
          };
          if (msg?.type === "entity_changed") {
            // Phase 1: invalidate broadly (correctness-first).
            // Phase 2: do a best-effort entity-scoped invalidation, then fall back.
            const entity = (msg.entity || "").toLowerCase();
            const map: Record<string, readonly unknown[]> = {
              auth: ["me"],
              users: queryKeys.referees,
              tournaments: queryKeys.tournaments,
              competitions: queryKeys.competitions,
              teams: queryKeys.teams,
              players: queryKeys.players,
              matches: queryKeys.matches,
              standings: ["standings"],
              news: queryKeys.news,
              notifications: ["notifications"],
              goals: ["goals"],
              cards: ["cards"],
              substitutions: ["substitutions"],
              "audit-logs": ["auditLogs"],
              uploads: ["uploads"],
            };

            const key = map[entity];
            if (key) {
              queryClient.invalidateQueries({ queryKey: key });
            } else {
              queryClient.invalidateQueries();
            }
          }
        } catch {
          // ignore non-JSON / malformed messages
        }
      };

      ws.onclose = () => scheduleReconnect();
      ws.onerror = () => scheduleReconnect();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") {
        // reconnect so the WS uses the new token
        try {
          ws?.close();
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", onStorage);
    connect();

    return () => {
      stopped = true;
      window.removeEventListener("storage", onStorage);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      try {
        ws?.close();
      } catch {
        // ignore
      }
      ws = null;
    };
  }, [queryClient]);
};
