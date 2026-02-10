import React, { useState, useEffect } from "react";
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
import { teamService } from "../services/teamService";
import type { TeamDetail, Player } from "../types";

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "roster" | "matches" | "standings"
  >("roster");

  useEffect(() => {
    if (id) {
      fetchTeamDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const data = await teamService.getById(id!);
      setTeam(data);
    } catch (err) {
      console.error("Failed to fetch team details", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
              {team.name.charAt(0)}
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-2xl bg-blue-600 border-4 border-slate-950 flex items-center justify-center text-white shadow-2xl">
              <FiAward size={28} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                Elite Division
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
                <span>Arena Main HQ</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-blue-500" />
                <span>Batch {team.batch}</span>
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
                          {player.name.charAt(0)}
                          <div className="absolute inset-0 bg-blue-600/0 group-hover/player:bg-blue-600/10 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-white tracking-tight uppercase line-clamp-1">
                            {player.name}
                          </p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic font-display">
                            No. {player.jersey_number} • {player.position}
                          </p>
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
            {team.matches.map((match) => (
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
                        2026 Season
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-between w-full max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-3 text-center w-32">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-white ${match.team_a_id === team.id ? "ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-950" : ""}`}
                      >
                        {match.team_a_id === team.id
                          ? team.name.charAt(0)
                          : "E"}
                      </div>
                      <p className="text-xs font-black text-white uppercase tracking-tighter line-clamp-1">
                        {match.team_a_id === team.id ? team.name : "Opponent"}
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
                      {match.status === "finished" ? (
                        <span className="px-3 py-1 bg-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-700">
                          Finished
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-red-500/20 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />{" "}
                          Live
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-3 text-center w-32">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-white ${match.team_b_id === team.id ? "ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-950" : ""}`}
                      >
                        {match.team_b_id === team.id
                          ? team.name.charAt(0)
                          : "E"}
                      </div>
                      <p className="text-xs font-black text-white uppercase tracking-tighter line-clamp-1">
                        {match.team_b_id === team.id ? team.name : "Opponent"}
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
            ))}
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
            {team.standings.map((standing) => (
              <div
                key={standing.tournament_id}
                className="card p-5 bg-linear-to-br from-slate-900 to-slate-950 flex flex-col justify-between overflow-hidden relative"
              >
                <div className="flex items-start justify-between mb-10">
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">
                      Primary League
                    </p>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                      Winter Season 2026
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
                      Loses
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
            ))}
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
