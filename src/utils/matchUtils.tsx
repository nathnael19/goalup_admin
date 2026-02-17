import type { Match } from "../types";

export const isMatchLocked = (m: Match) => {
  return m.status === "finished";
};

export const calculateMatchTimeDisplay = (m: Match, _tick?: number) => {
  if (m.status !== "live") return null;
  if (m.is_halftime) return "HT";

  // Second Half
  if (m.second_half_start) {
    const start = new Date(m.second_half_start).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - start) / 60000);
    return `${Math.min(90 + (m.additional_time_second_half || 0), 45 + diffInMinutes + 1)}'`;
  }

  // First Half
  if (m.first_half_start) {
    const start = new Date(m.first_half_start).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - start) / 60000);
    return `${Math.min(45 + (m.additional_time_first_half || 0), diffInMinutes + 1)}'`;
  }

  return "1'";
};

export const getStatusBadge = (m: Match, tick?: number) => {
  switch (m.status) {
    case "finished":
      return (
        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest border border-slate-700">
          FT
        </span>
      );
    case "live": {
      const timeDisplay = calculateMatchTimeDisplay(m, tick);
      return (
        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
          {timeDisplay || "Live"}
        </span>
      );
    }
    default:
      return (
        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-black uppercase tracking-widest border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          Scheduled
        </span>
      );
  }
};
