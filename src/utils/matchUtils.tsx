import type { Match } from "../types";

export const isMatchLocked = (m: Match) => {
  return m.status === "finished";
};

/**
 * Total match length in minutes (e.g. 90). First half = total/2, second half = total/2.
 * Timer runs from 0' to halfTime' in first half, then (halfTime+1)' to totalTime' in second half.
 */
const getTotalTime = (m: Match) => m.total_time ?? 90;

export const calculateMatchTimeDisplay = (m: Match) => {
  if (m.status !== "live") return null;
  if (m.is_halftime) return "HT";

  const totalTime = getTotalTime(m);
  const halfTime = Math.floor(totalTime / 2); // e.g. 45 for 90 min
  const now = Date.now();

  // Second half: elapsed since second_half_start, display (halfTime)' to (totalTime-1)' then totalTime+N'
  if (m.second_half_start) {
    const start = new Date(m.second_half_start).getTime();
    const elapsedMins = Math.floor((now - start) / 60000);
    const minsIntoSecondHalf = Math.min(elapsedMins, halfTime);
    const displayMin = halfTime + minsIntoSecondHalf;
    const addSecond = m.additional_time_second_half ?? 0;
    if (displayMin > totalTime) {
      const added = Math.min(displayMin - totalTime, addSecond);
      return added > 0 ? `${totalTime}+${added}'` : `${totalTime}'`;
    }
    return `${displayMin}'`;
  }

  // First half: elapsed since first_half_start, display 0' to halfTime' then halfTime+N'
  if (m.first_half_start) {
    const start = new Date(m.first_half_start).getTime();
    const elapsedMins = Math.floor((now - start) / 60000);
    const displayMin = Math.min(elapsedMins, halfTime);
    const addFirst = m.additional_time_first_half ?? 0;
    if (elapsedMins > halfTime) {
      const added = Math.min(elapsedMins - halfTime, addFirst);
      return added > 0 ? `${halfTime}+${added}'` : `${halfTime}'`;
    }
    return `${displayMin}'`;
  }

  return "0'";
};

export const getStatusBadge = (m: Match) => {
  switch (m.status) {
    case "finished":
      return (
        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest border border-slate-700">
          FT
        </span>
      );
    case "live": {
      const timeDisplay = calculateMatchTimeDisplay(m);
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
