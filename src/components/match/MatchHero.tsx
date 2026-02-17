import React from "react";
import { FiCalendar, FiClock, FiPlus, FiMinus } from "react-icons/fi";
import type { Match, Team } from "../../types";
import { getStatusBadge } from "../../utils/matchUtils";
import { getFullImageUrl } from "../../utils/url";

interface MatchHeroProps {
  match: Match;
  tick: number;
  isEditing: boolean;
  editedMatch: Partial<Match>;
  updateScore: (team: "a" | "b", delta: number) => void;
  otherLegMatch?: Match | null;
  teamA?: Team | null;
  teamB?: Team | null;
}

export const MatchHero: React.FC<MatchHeroProps> = ({
  match,
  tick,
  isEditing,
  editedMatch,
  updateScore,
  otherLegMatch,
  teamA,
  teamB,
}) => {
  const teamADisplay = teamA || match.team_a;
  const teamBDisplay = teamB || match.team_b;
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900/40 border border-white/5 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-700">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/20 to-slate-950/60" />
      </div>

      <div className="relative z-10 p-6 md:p-10">
        {/* Tournament & Status */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-blue-500/20">
                {match.tournament?.name || "Tournament Match"}
              </span>
              {match.stage && (
                <span className="px-3 py-1 bg-amber-600/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-amber-500/20">
                  {match.stage}
                </span>
              )}
              <span className="px-3 py-1 bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-white/10">
                Round {match.match_day}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-xs font-bold justify-center md:justify-start opacity-70">
              <span className="flex items-center gap-2.5">
                <FiCalendar className="text-blue-500" />
                {new Date(match.start_time).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <span className="flex items-center gap-2.5">
                <FiClock className="text-blue-500" />
                {new Date(match.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {teamADisplay?.stadium && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <span className="text-slate-400">{teamADisplay.stadium}</span>
                </>
              )}
            </div>
          </div>
          <div className="scale-110 drop-shadow-2xl">
            {getStatusBadge(match, tick)}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-8 group">
            <div className="relative">
              <div
                className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-slate-800/50 backdrop-blur-md p-1 border-4 border-white/5 shadow-2xl relative transition-transform duration-700 group-hover:scale-105"
                style={{
                  boxShadow: `0 0 50px ${teamADisplay?.color || "#3b82f6"}1a`,
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-3xl font-black text-white p-4">
                  {teamADisplay?.logo_url ? (
                    <img
                      src={getFullImageUrl(teamADisplay.logo_url)}
                      alt={teamADisplay.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span>{teamADisplay?.name?.charAt(0) || "A"}</span>
                  )}
                </div>
              </div>
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-xl z-20"
                style={{
                  backgroundColor: `${teamADisplay?.color || "#3b82f6"}`,
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                }}
              >
                HOME
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-black text-white font-display mb-2 drop-shadow-xl">
                {teamADisplay?.name || "Home Team"}
              </h1>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-4 bg-white/10 rounded-full overflow-hidden"
                  >
                    <div className="w-full h-1/2 bg-blue-500/40" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LIVE SCORE */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-8 md:gap-14 bg-slate-950/40 px-6 py-4 rounded-[2.5rem] border border-white/10 shadow-inner">
              {isEditing ? (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => updateScore("a", 1)}
                    className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all hover:scale-110 shadow-lg shadow-blue-500/20"
                  >
                    <FiPlus size={24} />
                  </button>
                  <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {editedMatch.score_a ?? 0}
                  </span>
                  <button
                    onClick={() => updateScore("a", -1)}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all hover:scale-110"
                  >
                    <FiMinus size={24} />
                  </button>
                </div>
              ) : (
                <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  {match.score_a}
                </span>
              )}

              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl md:text-4xl text-slate-800 font-black animate-pulse">
                  :
                </span>
                {otherLegMatch && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">
                      Agg:{" "}
                      {match.score_a +
                        (otherLegMatch.team_a_id === match.team_a_id
                          ? otherLegMatch.score_a
                          : otherLegMatch.score_b)}{" "}
                      -{" "}
                      {match.score_b +
                        (otherLegMatch.team_b_id === match.team_b_id
                          ? otherLegMatch.score_b
                          : otherLegMatch.score_a)}
                    </span>
                  </div>
                )}
                {(match.status === "live" || match.is_halftime) && (
                  <div className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-lg animate-pulse">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                      LIVE
                    </span>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => updateScore("b", 1)}
                    className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all hover:scale-110 shadow-lg shadow-blue-500/20"
                  >
                    <FiPlus size={24} />
                  </button>
                  <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {editedMatch.score_b ?? 0}
                  </span>
                  <button
                    onClick={() => updateScore("b", -1)}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all hover:scale-110"
                  >
                    <FiMinus size={24} />
                  </button>
                </div>
              ) : (
                <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  {match.score_b}
                </span>
              )}
            </div>

            {/* Halftime/FT info */}
            {!isEditing && match.status !== "scheduled" && (
              <div className="mt-6 flex flex-col items-center gap-1 opacity-50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  {match.status === "finished"
                    ? "Full Time"
                    : match.is_halftime
                      ? "Halftime"
                      : "Match in Progress"}
                </span>
                {((match.penalty_score_a ?? 0) > 0 ||
                  (match.penalty_score_b ?? 0) > 0) && (
                  <span className="text-xs font-black text-amber-500 uppercase tracking-widest mt-2">
                    ({match.penalty_score_a} - {match.penalty_score_b} Pens)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-8 group">
            <div className="relative">
              <div
                className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-slate-800/50 backdrop-blur-md p-1 border-4 border-white/5 shadow-2xl relative transition-transform duration-700 group-hover:scale-105"
                style={{
                  boxShadow: `0 0 50px ${teamBDisplay?.color || "#ef4444"}1a`,
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-3xl font-black text-white p-4">
                  {teamBDisplay?.logo_url ? (
                    <img
                      src={getFullImageUrl(teamBDisplay.logo_url)}
                      alt={teamBDisplay.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span>{teamBDisplay?.name?.charAt(0) || "B"}</span>
                  )}
                </div>
              </div>
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-xl z-20"
                style={{
                  backgroundColor: `${teamBDisplay?.color || "#ef4444"}`,
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                }}
              >
                AWAY
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-black text-white font-display mb-2 drop-shadow-xl">
                {teamBDisplay?.name || "Away Team"}
              </h1>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-4 bg-white/10 rounded-full overflow-hidden"
                  >
                    <div className="w-full h-1/2 bg-red-500/40" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
