import React, { useState, useEffect } from "react";
import { FiAward, FiRefreshCw, FiFilter, FiTrendingUp } from "react-icons/fi";
import { standingService } from "../services/standingService";
import { tournamentService } from "../services/tournamentService";
import type { Tournament } from "../types";

export const StandingsPage: React.FC = () => {
  const [groupedStandings, setGroupedStandings] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [filterTournament, setFilterTournament] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [standingsData, tournamentsData] = await Promise.all([
        standingService.getAll(),
        tournamentService.getAll(),
      ]);
      setGroupedStandings(standingsData);
      setTournaments(tournamentsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (tournamentId: number) => {
    try {
      setRecalculating(tournamentId.toString());
      await standingService.recalculate(tournamentId.toString());
      await fetchData();
    } catch (err) {
      console.error("Failed to recalculate standings", err);
    } finally {
      setRecalculating(null);
    }
  };

  const filteredGroups = groupedStandings.filter(
    (group) =>
      filterTournament === "all" ||
      group.tournament.id.toString() === filterTournament,
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white font-display tracking-tight">
            League Tables
          </h1>
          <p className="text-slate-400 font-medium">
            Auto-generated rankings based on match outcomes and goal metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-blue-500 transition-colors" />
            <select
              className="input pl-12 h-12 appearance-none w-56 bg-slate-800/40 border-slate-800"
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
            >
              <option value="all">Global (All Leagues)</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id.toString()}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-16">
          {filteredGroups.map((group) => {
            const leagueWinner = group.teams[0];
            return (
              <div key={group.tournament.id} className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl">
                      <FiAward size={28} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white font-display tracking-tight uppercase">
                        {group.tournament.name}
                      </h2>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span>Season {group.tournament.year}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-blue-500">
                          {group.tournament.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {leagueWinner && (
                      <div className="hidden md:flex items-center gap-3 bg-slate-800/40 px-4 py-2.5 rounded-2xl border border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center border border-yellow-500/20">
                          <FiAward size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-500 tracking-widest leading-none mb-1 uppercase">
                            Top Ranked
                          </span>
                          <span className="text-xs font-black text-white leading-none">
                            {leagueWinner.team?.name}
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleRecalculate(group.tournament.id)}
                      disabled={
                        recalculating === group.tournament.id.toString()
                      }
                      className="btn btn-secondary h-11 border border-slate-700/50 hover:border-blue-500/30 transition-all disabled:opacity-50"
                    >
                      <FiRefreshCw
                        className={
                          recalculating === group.tournament.id.toString()
                            ? "animate-spin"
                            : ""
                        }
                      />
                      Sync Standings
                    </button>
                  </div>
                </div>

                <div className="card overflow-hidden border-slate-800/50 bg-slate-900/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800">
                          <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-20">
                            Rank
                          </th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Club
                          </th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-16">
                            MP
                          </th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-16 text-blue-400">
                            W
                          </th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-16">
                            D
                          </th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-16 text-red-400">
                            L
                          </th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-20">
                            Diff
                          </th>
                          <th className="px-6 py-5 text-[10px] font-black text-white uppercase tracking-[0.2em] text-center w-24 bg-blue-600/10">
                            Points
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {group.teams.map((standing: any, index: number) => (
                          <tr
                            key={standing.team_id}
                            className="hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="px-6 py-5 text-center">
                              <span
                                className={`text-sm font-black w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                                  index === 0
                                    ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-lg shadow-yellow-500/5"
                                    : index < 3
                                      ? "bg-blue-600/10 text-blue-400 border border-blue-600/10"
                                      : "bg-slate-800 text-slate-500 border border-slate-700/50"
                                }`}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-400 uppercase tracking-tighter group-hover:scale-110 transition-transform">
                                  {standing.team?.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="block text-sm font-bold text-white tracking-tight leading-none mb-1">
                                    {standing.team?.name}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {standing.batch}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center text-sm font-bold text-slate-400">
                              {standing.played}
                            </td>
                            <td className="px-6 py-5 text-center text-sm font-black text-blue-400/80">
                              {standing.won}
                            </td>
                            <td className="px-6 py-5 text-center text-sm font-bold text-slate-400">
                              {standing.drawn}
                            </td>
                            <td className="px-6 py-5 text-center text-sm font-bold text-slate-400">
                              {standing.lost}
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span
                                className={`text-sm font-black ${standing.goals_for - standing.goals_against >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {standing.goals_for - standing.goals_against > 0
                                  ? "+"
                                  : ""}
                                {standing.goals_for - standing.goals_against}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors">
                              <span className="text-lg font-black text-white font-display tabular-nums tracking-tighter">
                                {standing.points}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center group">
              <div className="w-24 h-24 rounded-[2rem] bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 mb-8 group-hover:scale-110 transition-transform duration-500">
                <FiTrendingUp size={48} />
              </div>
              <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight mb-2">
                Registry Silent
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto font-medium">
                No standings found for this filter. Launch a tournament or
                record match results to populate these tables.
              </p>
              <button
                onClick={() => setFilterTournament("all")}
                className="mt-8 text-blue-500 font-black uppercase text-xs tracking-[0.2em] border-b-2 border-blue-500/20 hover:border-blue-500 transition-all pb-1"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
