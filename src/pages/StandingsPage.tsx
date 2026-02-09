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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            Standings
          </h1>
          <p className="text-slate-400">
            View tournament tables and update points automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="input pl-10 h-11 appearance-none w-48"
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
            >
              <option value="all">All Leagues</option>
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
        <div className="space-y-12">
          {filteredGroups.map((group) => (
            <div key={group.tournament.id} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <FiAward size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                      {group.tournament.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Season {group.tournament.year} • {group.tournament.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRecalculate(group.tournament.id)}
                  disabled={recalculating === group.tournament.id.toString()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  <FiRefreshCw
                    className={
                      recalculating === group.tournament.id.toString()
                        ? "animate-spin"
                        : ""
                    }
                  />
                  Recalculate
                </button>
              </div>

              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-12">
                          Pos
                        </th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Team
                        </th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-12">
                          P
                        </th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-12 text-blue-400">
                          W
                        </th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-12">
                          D
                        </th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-12 text-red-400">
                          L
                        </th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">
                          GD
                        </th>
                        <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16 bg-blue-600/10 text-white">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {group.teams.map((standing: any, index: number) => (
                        <tr
                          key={standing.team_id}
                          className="hover:bg-slate-700/20 transition-colors"
                        >
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`text-sm font-bold ${index < 3 ? "text-blue-400" : "text-slate-400"}`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                                {standing.team?.name.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-white">
                                {standing.team?.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {standing.played}
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-bold text-slate-200">
                            {standing.won}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {standing.drawn}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {standing.lost}
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-medium text-slate-200">
                            {standing.goals_for - standing.goals_against}
                          </td>
                          <td className="px-4 py-4 text-center bg-blue-600/5">
                            <span className="text-sm font-black text-white">
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
          ))}

          {filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 mb-4 mb-4">
                <FiTrendingUp size={40} />
              </div>
              <h3 className="text-lg font-bold text-white">
                No Standings Found
              </h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Select a tournament or update match results to generate league
                tables.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
