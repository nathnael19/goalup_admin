import React from "react";
import {
  FiClock,
  FiPlay,
  FiCheckCircle,
  FiRepeat,
  FiTrash2,
  FiArrowLeft,
} from "react-icons/fi";
import type {
  Match,
  Goal,
  CardEvent,
  Substitution,
  TeamDetail,
} from "../../types";
import { getFullImageUrl } from "../../utils/url";

interface MatchTimelineProps {
  match: Match;
  goals: Goal[];
  cards: CardEvent[];
  substitutions: Substitution[];
  isLocked?: boolean;
  onDeleteGoal: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onDeleteSub: (id: string) => void;
  teamA?: TeamDetail | null;
  teamB?: TeamDetail | null;
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({
  match,
  goals,
  cards,
  substitutions,
  isLocked,
  onDeleteGoal,
  onDeleteCard,
  onDeleteSub,
  teamA,
  teamB,
}) => {
  const teamADisplay = teamA || match.team_a;
  const teamBDisplay = teamB || match.team_b;

  const allEvents = [
    ...goals.map((g) => ({ ...g, event_type: "goal" as const })),
    ...cards.map((c) => ({ ...c, event_type: "card" as const })),
    ...substitutions.map((s) => ({
      ...s,
      event_type: "substitution" as const,
    })),
  ].sort((a, b) => a.minute - b.minute);

  return (
    <div className="card p-8 border-white/5 bg-slate-900/40 backdrop-blur-xl group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            Interactive Timeline
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Live Match Events
          </p>
        </div>
        {(match.status === "live" || match.status === "finished") && (
          <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-xl">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
              {match.status === "finished" ? "Final Log" : "Live Feed"}
            </span>
          </div>
        )}
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-4 bottom-4 w-px bg-linear-to-b from-blue-600/20 via-slate-700 to-blue-600/20" />

        <div className="space-y-8 relative z-10">
          {/* Start of Match Marker */}
          {match.status !== "scheduled" && (
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
                <FiPlay size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Match Kickoff
              </span>
            </div>
          )}

          {/* Event Log */}
          {allEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-6 group/event">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover/event:scale-110 ${
                  event.event_type === "goal"
                    ? "bg-blue-600 text-white shadow-blue-500/20"
                    : event.event_type === "card"
                      ? (event as CardEvent).type === "yellow"
                        ? "bg-amber-500 text-slate-950 shadow-amber-500/20"
                        : "bg-red-600 text-white shadow-red-500/20"
                      : "bg-emerald-600 text-white shadow-emerald-500/20"
                }`}
              >
                {event.event_type === "goal" ? (
                  <div className="font-black text-xs">{event.minute}'</div>
                ) : event.event_type === "card" ? (
                  <div className="w-3 h-4 bg-current rounded-xs" />
                ) : (
                  <FiRepeat size={18} />
                )}
              </div>

              <div className="flex-1 p-5 rounded-4xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group-hover/event:border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-5 h-5 rounded-md bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden p-0.5">
                        {event.team_id === match.team_a_id ? (
                          teamADisplay?.logo_url ? (
                            <img
                              src={getFullImageUrl(teamADisplay.logo_url)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )
                        ) : teamBDisplay?.logo_url ? (
                          <img
                            src={getFullImageUrl(teamBDisplay.logo_url)}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/event:text-slate-300 transition-colors">
                        {event.event_type === "goal"
                          ? "Goal Scored"
                          : event.event_type === "card"
                            ? `${(event as CardEvent).type.toUpperCase()} CARD`
                            : "Tactical Change"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-800" />
                      <span className="text-xs font-black text-blue-500">
                        {event.minute}'
                      </span>
                    </div>

                    {event.event_type === "goal" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white hover:text-blue-400 transition-colors cursor-pointer">
                          {(event as Goal).player?.name || "Unknown Player"}
                        </span>
                        {(event as Goal).is_own_goal && (
                          <span className="px-2 py-0.5 bg-red-600/20 text-red-500 text-[8px] font-black uppercase rounded-lg border border-red-500/20">
                            Own Goal
                          </span>
                        )}
                      </div>
                    ) : event.event_type === "card" ? (
                      <span className="text-lg font-black text-white">
                        {(event as CardEvent).player?.name}
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-emerald-400">
                          {(event as Substitution).player_in?.name}
                        </span>
                        <FiArrowLeft
                          size={14}
                          className="text-slate-700 rotate-180"
                        />
                        <span className="text-lg font-black text-red-400/50">
                          {(event as Substitution).player_out?.name}
                        </span>
                      </div>
                    )}

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {event.team_id === match.team_a_id
                        ? teamADisplay?.name
                        : teamBDisplay?.name}
                    </p>
                  </div>

                  {!isLocked && (
                    <button
                      onClick={() => {
                        if (event.event_type === "goal") onDeleteGoal(event.id);
                        else if (event.event_type === "card")
                          onDeleteCard(event.id);
                        else onDeleteSub(event.id);
                      }}
                      className="w-10 h-10 rounded-xl bg-red-600/5 text-red-500/30 hover:text-red-500 hover:bg-red-600/10 flex items-center justify-center transition-all opacity-0 group-hover/event:opacity-100"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* End of Match Marker */}
          {match.status === "finished" && (
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
                <FiCheckCircle size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Full Time whistle
              </span>
            </div>
          )}

          {/* Empty State */}
          {allEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-white/2 border border-white/5 flex items-center justify-center text-slate-700 mb-4 scale-110">
                <FiClock size={32} />
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                No Events Recorded Yet
              </p>
              <p className="text-xs text-slate-500 mt-2">
                The timeline will update as match events occur
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
