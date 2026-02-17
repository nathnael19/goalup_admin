import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiUsers,
  FiCalendar,
  FiAward,
  FiActivity,
  FiClock,
  FiMapPin,
} from "react-icons/fi";
import {
  useTeamDetail,
  useTournaments,
  useCompetitions,
  useTeams,
} from "../hooks/useData";
import { getStatusBadge } from "../utils/matchUtils";
import { getPositionBadge } from "../utils/playerUtils";
import { getFullImageUrl } from "../utils/url";
import { CardSkeleton } from "../components/LoadingSkeleton";
import type { Player, Match } from "../types";

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: team, isLoading: loadingDetail } = useTeamDetail(id!);
  const { data: tournaments = [], isLoading: loadingTournaments } =
    useTournaments();
  const { data: competitions = [], isLoading: loadingCompetitions } =
    useCompetitions();
  const { data: teams = [], isLoading: loadingTeams } = useTeams();

  const [activeTab, setActiveTab] = useState<
    "roster" | "matches" | "standings"
  >("roster");

  const loading =
    loadingDetail || loadingTournaments || loadingCompetitions || loadingTeams;

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-3xl bg-slate-800/50 animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-32 bg-slate-800/50 rounded animate-pulse" />
            <div className="h-8 w-64 bg-slate-800/50 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">
          Team Not Found
        </h2>
        <button onClick={() => navigate("/teams")} className="btn btn-primary">
          Back to Registry
        </button>
      </div>
    );
  }

  const currentTournament = tournaments.find(
    (t) => t.id === team.tournament_id,
  );
  const currentCompetition = competitions.find(
    (c) => c.id === currentTournament?.competition_id,
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header / Hero */}
      <div className="relative group">
        <button
          onClick={() => navigate("/teams")}
          className="flex items-center gap-2 text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest mb-8 transition-colors"
        >
          <FiChevronLeft /> Back to Clubs
        </button>

        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
          <div className="relative">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
              {team.logo_url ? (
                <img
                  src={getFullImageUrl(team.logo_url)}
                  alt={team.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                team.name.charAt(0)
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-2xl bg-blue-600 border-4 border-slate-950 flex items-center justify-center text-white shadow-2xl">
              <FiAward size={28} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                {currentCompetition?.name}
              </span>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                ID: {team.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight leading-none uppercase italic">
              {team.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold">
              <div className="flex items-center gap-2">
                <FiMapPin className="text-blue-500" />
                <span>{team.stadium}</span>
              </div>

              <div className="flex items-center gap-2 text-white">
                <FiUsers className="text-blue-500" />
                <span>
                  {Object.values(team.roster).flat().length} Registered Athletes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-800/20 rounded-2xl border border-slate-800/50 w-fit">
        {(["roster", "matches", "standings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === "roster" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {Object.entries(team.roster).map(([role, players]) => (
              <div key={role} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                    {role}
                  </h3>
                  <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700">
                    {players.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {players.map((player: Player) => (
                    <div
                      key={player.id}
                      className="card group/player p-4 hover:border-slate-600 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 font-black relative overflow-hidden">
                          {player.image_url ? (
                            <img
                              src={getFullImageUrl(player.image_url)}
                              alt={player.name}
                              className="w-full h-full object-cover relative z-10"
                            />
                          ) : (
                            <span className="relative z-10">
                              {player.name.charAt(0)}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-blue-600/0 group-hover/player:bg-blue-600/10 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-white tracking-tight uppercase line-clamp-1">
                            {player.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getPositionBadge(player.position)}`}
                            >
                              {player.position}
                            </span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              #{player.jersey_number}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white leading-none">
                            {player.goals}
                          </p>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                            Goals
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {players.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        No Selection
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "matches" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {team.matches.map((match) => {
              const teamA = teams.find((t) => t.id === match.team_a_id);
              const teamB = teams.find((t) => t.id === match.team_b_id);
              const matchTournament = tournaments.find(
                (t) => t.id === match.tournament_id,
              );

              return (
                <div
                  key={match.id}
                  className="card p-8 group hover:border-slate-700 transition-all overflow-hidden relative"
                >
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                    <div className="flex items-center gap-4 w-full lg:w-48 border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
                        <FiCalendar size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">
                          {new Date(match.start_time).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </p>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          {matchTournament?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-between w-full max-w-2xl mx-auto">
                      {/* Team A */}
                      <div className="flex flex-col items-center gap-3 text-center w-32">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-white overflow-hidden ${match.team_a_id === team.id ? "ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-950" : ""}`}
                        >
                          {teamA?.logo_url ? (
                            <img
                              src={getFullImageUrl(teamA.logo_url)}
                              alt={teamA.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (teamA?.name || "?").charAt(0)
                          )}
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-tighter line-clamp-1">
                          {teamA?.name || "Unknown"}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-6">
                          <span className="text-4xl font-black text-white font-display">
                            {match.score_a}
                          </span>
                          <span className="text-slate-700 font-black text-xl">
                            :
                          </span>
                          <span className="text-4xl font-black text-white font-display">
                            {match.score_b}
                          </span>
                        </div>
                        {getStatusBadge(match as Match)}
                      </div>

                      {/* Team B */}
                      <div className="flex flex-col items-center gap-3 text-center w-32">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-white overflow-hidden ${match.team_b_id === team.id ? "ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-950" : ""}`}
                        >
                          {teamB?.logo_url ? (
                            <img
                              src={getFullImageUrl(teamB.logo_url)}
                              alt={teamB.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (teamB?.name || "?").charAt(0)
                          )}
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-tighter line-clamp-1">
                          {teamB?.name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="hidden lg:block w-32 text-right">
                      <button className="text-blue-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/0 group-hover:bg-blue-600 transition-all" />
                </div>
              );
            })}
            {team.matches.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-4xl">
                <FiClock className="mx-auto text-slate-800 mb-4" size={48} />
                <h3 className="text-xl font-black text-slate-700 uppercase tracking-tighter">
                  No Recorded Fixtures
                </h3>
              </div>
            )}
          </div>
        )}

        {activeTab === "standings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {team.standings.map((standing) => {
              const standingTournament = tournaments.find(
                (t) => t.id === standing.tournament_id,
              );
              const standingComp = competitions.find(
                (c) => c.id === standingTournament?.competition_id,
              );

              return (
                <div
                  key={standing.tournament_id}
                  className="card p-5 bg-linear-to-br from-slate-900 to-slate-950 flex flex-col justify-between overflow-hidden relative"
                >
                  <div className="flex items-start justify-between mb-10">
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">
                        {standingComp?.name}
                      </p>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                        {standingTournament?.name}
                      </h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-600/20 shadow-xl shadow-blue-600/5">
                      <FiAward size={28} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
                        Points
                      </p>
                      <p className="text-xl font-black text-white font-display tabular-nums">
                        {standing.points}
                      </p>
                    </div>
                    <div className="text-center pt-2">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
                        Wins
                      </p>
                      <p className="text-2xl font-black text-blue-500 tabular-nums">
                        {standing.won}
                      </p>
                    </div>
                    <div className="text-center pt-2">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
                        Draws
                      </p>
                      <p className="text-2xl font-black text-slate-400 tabular-nums">
                        {standing.drawn}
                      </p>
                    </div>
                    <div className="text-center pt-2">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
                        Losses
                      </p>
                      <p className="text-2xl font-black text-red-500 tabular-nums">
                        {standing.lost}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 pt-10 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-black">
                        {standing.goals_for}
                      </div>
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        GF
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center text-xs font-black">
                        {standing.goals_against}
                      </div>
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        GA
                      </span>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors ml-auto">
                      Full Table <FiActivity size={12} />
                    </button>
                  </div>

                  {/* Background Decor */}
                  <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/5 blur-3xl -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>
              );
            })}
            {team.standings.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-4xl bg-slate-900/40">
                <FiAward className="mx-auto text-slate-800 mb-4" size={48} />
                <h3 className="text-xl font-black text-slate-700 uppercase tracking-tighter">
                  No Active Tournaments
                </h3>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
