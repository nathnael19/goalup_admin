import React from "react";
import {
  FiPlay,
  FiClock,
  FiPlus,
  FiCheckCircle,
  FiZap,
  FiRepeat,
  FiEdit2,
} from "react-icons/fi";
import type { Match, UserRole, CardType, TeamDetail } from "../../types";
import { UserRoles } from "../../types";
import { calculateMatchTimeDisplay } from "../../utils/matchUtils";
import { getFullImageUrl } from "../../utils/url";

interface MatchCommandPanelProps {
  match: Match;
  tick: number;
  userRole?: UserRole;
  isLocked?: boolean;
  onStartMatch: () => void;
  onFinishMatch: () => void;
  onStartSecondHalf: () => void;
  onToggleHalftime: () => void;
  onOpenGoalModal: (teamId: string) => void;
  onOpenCardModal: (teamId: string, type: CardType) => void;
  onOpenSubModal: (teamId: string) => void;
  onEditMatch: () => void;
  editedMatch: Partial<Match>;
  setEditedMatch: (m: Partial<Match>) => void;
  isEditing: boolean;
  teamA?: TeamDetail | null;
  teamB?: TeamDetail | null;
}

export const MatchCommandPanel: React.FC<MatchCommandPanelProps> = ({
  match,
  tick,
  userRole,
  isLocked,
  onStartMatch,
  onFinishMatch,
  onStartSecondHalf,
  onToggleHalftime,
  onOpenGoalModal,
  onOpenCardModal,
  onOpenSubModal,
  onEditMatch,
  editedMatch,
  setEditedMatch,
  isEditing,
  teamA,
  teamB,
}) => {
  if (userRole === UserRoles.COACH) return null;

  const teamADisplay = teamA || match.team_a;
  const teamBDisplay = teamB || match.team_b;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Live Controls Panel */}
      <div className="lg:col-span-2 card p-8 border-blue-500/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <FiPlay size={120} className="rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                Match Command
              </h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                Surgical Live Operations
              </p>
            </div>
            {match.status === "live" && (
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                <FiClock className="text-blue-500 animate-spin-slow" />
                <span className="text-xl font-black text-white tabular-nums">
                  {calculateMatchTimeDisplay(match, tick)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {match.status === "scheduled" && (
              <button
                onClick={onStartMatch}
                disabled={isLocked}
                className="w-full h-14 rounded-4xl bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <FiPlay size={24} /> Start Official Match
              </button>
            )}

            {match.status === "live" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Goal Buttons */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-3xl border border-white/5">
                  <button
                    onClick={() => onOpenGoalModal(match.team_a_id)}
                    disabled={isLocked}
                    className="h-20 rounded-2xl bg-slate-800 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 flex flex-col items-center justify-center gap-2 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center overflow-hidden border border-white/10 group-hover/btn:border-blue-500/50 transition-colors p-1.5">
                      {teamADisplay?.logo_url ? (
                        <img
                          src={getFullImageUrl(teamADisplay.logo_url)}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FiPlus
                          size={20}
                          className="text-blue-400 group-hover/btn:text-white"
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Goal {teamADisplay?.name?.split(" ")[0]}
                    </span>
                  </button>
                  <button
                    onClick={() => onOpenGoalModal(match.team_b_id)}
                    disabled={isLocked}
                    className="h-20 rounded-2xl bg-slate-800 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 flex flex-col items-center justify-center gap-2 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center overflow-hidden border border-white/10 group-hover/btn:border-blue-500/50 transition-colors p-1.5">
                      {teamBDisplay?.logo_url ? (
                        <img
                          src={getFullImageUrl(teamBDisplay.logo_url)}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FiPlus
                          size={20}
                          className="text-blue-400 group-hover/btn:text-white"
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Goal {teamBDisplay?.name?.split(" ")[0]}
                    </span>
                  </button>
                </div>

                {/* Status & Secondary Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={
                      match.is_halftime ? onStartSecondHalf : onToggleHalftime
                    }
                    disabled={isLocked}
                    className={`h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${match.is_halftime ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"}`}
                  >
                    <FiClock size={18} />{" "}
                    {match.is_halftime ? "Start 2nd Half" : "Set Halftime (HT)"}
                  </button>
                  <button
                    onClick={onFinishMatch}
                    disabled={isLocked}
                    className="h-14 rounded-2xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiCheckCircle size={18} /> Finish Match (FT)
                  </button>
                </div>
              </div>
            )}

            {/* Penalty Shootout Controls (Knockout only) */}
            {(match.status === "finished" || match.status === "live") &&
              match.stage && (
                <div className="p-6 bg-amber-600/5 rounded-3xl border border-amber-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest">
                      <FiZap /> Penalty Shootout
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="w-12 h-8 bg-slate-900 border border-white/10 rounded-lg text-center text-xs font-black"
                          value={editedMatch.penalty_score_a || 0}
                          onChange={(e) =>
                            setEditedMatch({
                              ...editedMatch,
                              penalty_score_a: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="text-slate-500">-</span>
                        <input
                          type="number"
                          className="w-12 h-8 bg-slate-900 border border-white/10 rounded-lg text-center text-xs font-black"
                          value={editedMatch.penalty_score_b || 0}
                          onChange={(e) =>
                            setEditedMatch({
                              ...editedMatch,
                              penalty_score_b: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="text-center text-lg font-black text-white">
                      {match.penalty_score_a || 0} -{" "}
                      {match.penalty_score_b || 0}
                    </div>
                  )}
                </div>
              )}

            {/* Cards & Subs Row */}
            {match.status === "live" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                {[
                  {
                    teamId: match.team_a_id,
                    teamName: match.team_a?.name,
                    type: "yellow" as CardType,
                    color: "amber",
                  },
                  {
                    teamId: match.team_b_id,
                    teamName: match.team_b?.name,
                    type: "yellow" as CardType,
                    color: "amber",
                  },
                  {
                    teamId: match.team_a_id,
                    teamName: match.team_a?.name,
                    type: "red" as CardType,
                    color: "red",
                  },
                  {
                    teamId: match.team_b_id,
                    teamName: match.team_b?.name,
                    type: "red" as CardType,
                    color: "red",
                  },
                ].map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => onOpenCardModal(card.teamId, card.type)}
                    disabled={isLocked}
                    className={`h-12 rounded-xl flex items-center justify-center gap-2 border transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed ${card.color === "amber" ? "bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white" : "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"}`}
                  >
                    <div
                      className={`w-2 h-3 rounded-xs ${card.color === "amber" ? "bg-amber-500" : "bg-red-600"} group-hover:bg-white`}
                    />
                    {card.teamName?.split(" ")[0]}
                  </button>
                ))}
                <button
                  onClick={() => onOpenSubModal(match.team_a_id)}
                  disabled={isLocked}
                  className="col-span-1 md:col-span-2 h-12 rounded-xl bg-blue-600/5 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRepeat size={14} /> Sub {teamADisplay?.name?.split(" ")[0]}
                </button>
                <button
                  onClick={() => onOpenSubModal(match.team_b_id)}
                  disabled={isLocked}
                  className="col-span-1 md:col-span-2 h-12 rounded-xl bg-blue-600/5 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRepeat size={14} /> Sub {teamBDisplay?.name?.split(" ")[0]}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panels */}
      <div className="space-y-6">
        <div className="card p-6 border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">
              Regulations
            </h3>
            {!isLocked && (
              <FiEdit2
                size={14}
                className="text-slate-500 cursor-pointer hover:text-white transition-colors"
                onClick={onEditMatch}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Game Time
              </span>
              <span className="text-sm font-black text-white">
                {match.total_time || 90} Min
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Added (1H)
              </span>
              <span className="text-sm font-black text-emerald-500">
                +{match.additional_time_first_half || 0}m
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Added (2H)
              </span>
              <span className="text-sm font-black text-emerald-500">
                +{match.additional_time_second_half || 0}m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
