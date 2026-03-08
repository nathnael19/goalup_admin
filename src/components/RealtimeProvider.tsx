import React from "react";
import { useSupabaseRealtime } from "../hooks/useSupabaseRealtime";

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSupabaseRealtime();
  
  return <>{children}</>;
};
