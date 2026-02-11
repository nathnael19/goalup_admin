import React from "react";
import { FiZap } from "react-icons/fi";
import type { Match } from "../types";
import { useNavigate } from "react-router-dom";

interface KnockoutBracketProps {
  matches: Match[];
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  matches,
}) => {
  const navigate = useNavigate();

  // Stage priority for ordering
  const stagePriority: Record<string, number> = {
    Final: 100,
    "Semi-final": 90,
    "Quarter-final": 80,
    "Round of 16": 70,
    "Round of 32": 60,
    "Round of 64": 50,
  };

  // Group matches by stage
  const stages = matches.reduce(
    (acc, match) => {
      const stage = match.stage || "Matches";
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(match);
      return acc;
    },
    {} as Record<string, Match[]>,
  );

  // Sort stages by priority
  const sortedStages = Object.keys(stages)
    .sort((a, b) => {
      const pA =
        Object.entries(stagePriority).find(([k]) => a.includes(k))?.[1] || 0;
      const pB =
        Object.entries(stagePriority).find(([k]) => b.includes(k))?.[1] || 0;
      return pB - pA; // Higher priority (Final) last? Actually columns go from R16 -> Final.
    })
    .reverse(); // Reverse so Final is on the right

  if (matches.length === 0) return null;

  return (
    <div className="flex gap-16 overflow-x-auto pb-10 scrollbar-hide">
      {sortedStages.map((stageName) => (
        <div key={stageName} className="flex flex-col gap-8 min-w-[300px]">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center mb-4">
            {stageName}
          </h4>
          <div className="flex flex-col justify-around flex-1 gap-6">
            {stages[stageName].map((match) => (
              <div
                key={match.id}
                onClick={() => navigate(`/matches/${match.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative p-4 rounded-2xl bg-slate-900 border border-white/5 hover:border-blue-500/30 transition-all shadow-xl">
                  {/* Connectors (Simulated) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden p-1">
                          {match.team_a?.logo_url ? (
                            <img
                              src={match.team_a.logo_url}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-black ${match.status === "finished" && match.score_a > match.score_b ? "text-white" : "text-slate-400"}`}
                        >
                          {match.team_a?.name}
                        </span>
                      </div>
                      <span className="text-sm font-black text-white px-2 py-1 bg-white/5 rounded-md min-w-[24px] text-center">
                        {match.score_a}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden p-1">
                          {match.team_b?.logo_url ? (
                            <img
                              src={match.team_b.logo_url}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-black ${match.status === "finished" && match.score_b > match.score_a ? "text-white" : "text-slate-400"}`}
                        >
                          {match.team_b?.name}
                        </span>
                      </div>
                      <span className="text-sm font-black text-white px-2 py-1 bg-white/5 rounded-md min-w-[24px] text-center">
                        {match.score_b}
                      </span>
                    </div>
                  </div>

                  {/* Penalty indicator */}
                  {(match.penalty_score_a ?? 0) > 0 ||
                  (match.penalty_score_b ?? 0) > 0 ? (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                      <FiZap size={12} /> Pens: {match.penalty_score_a} -{" "}
                      {match.penalty_score_b}
                    </div>
                  ) : null}

                  {/* Status Badge overlay */}
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-2 py-1 rounded-lg bg-blue-600 text-[8px] font-black text-white uppercase tracking-widest shadow-lg">
                      View Match
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
