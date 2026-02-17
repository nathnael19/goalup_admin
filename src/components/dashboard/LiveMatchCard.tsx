import React from "react";
import type { Match } from "../../types";

interface LiveMatchCardProps {
  match: Match;
  onClick: () => void;
}

export const LiveMatchCard: React.FC<LiveMatchCardProps> = ({
  match,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="card p-5 bg-linear-to-br from-red-600/10 to-transparent border-red-500/20 group cursor-pointer hover:border-red-500/40 transition-all font-body"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Live
        </span>
        <span className="text-[10px] font-bold text-slate-500">
          {match.tournament?.name}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black">
            {match.team_a?.name.charAt(0)}
          </div>
          <span className="text-[10px] font-black text-white text-center line-clamp-1">
            {match.team_a?.name}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-xl font-black text-white font-mono tracking-tighter">
            {match.score_a} - {match.score_b}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black">
            {match.team_b?.name.charAt(0)}
          </div>
          <span className="text-[10px] font-black text-white text-center line-clamp-1">
            {match.team_b?.name}
          </span>
        </div>
      </div>
    </div>
  );
};
