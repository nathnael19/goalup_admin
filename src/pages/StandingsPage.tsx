import React, { useState, useEffect } from "react";
import {
  FiAward,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import { standingService } from "../services/standingService";
import { tournamentService } from "../services/tournamentService";
import { competitionService } from "../services/competitionService";
import type { Tournament, Competition, GroupedStanding } from "../types";
import { UserRoles } from "../types";
import { useAuth } from "../context/AuthContext";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const StandingsPage: React.FC = () => {
  const { user } = useAuth();
  const [groupedStandings, setGroupedStandings] = useState<GroupedStanding[]>(
    [],
  );
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState<string | null>(null);

  // Drill-down selection
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [standingsData, tournamentsData, competitionsData] =
        await Promise.all([
          standingService.getAll(),
          tournamentService.getAll(),
          competitionService.getAll(),
        ]);
      setGroupedStandings(standingsData);
      setTournaments(tournamentsData);
      setCompetitions(competitionsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (tournamentId: string) => {
    try {
      setRecalculating(tournamentId);
      await standingService.recalculate(tournamentId);
      // Re-fetch only standings
      const standingsData = await standingService.getAll();
      setGroupedStandings(standingsData);
    } catch (err) {
      console.error("Failed to recalculate standings", err);
    } finally {
      setRecalculating(null);
    }
  };

  // Helper counts
  const getCompTournamentCount = (compId: string) => {
    return tournaments.filter((t) => t.competition_id === compId).length;
  };

  // ============ VIEW 1: COMPETITION CARDS ============
  if (!selectedCompetition) {
    const filteredComps = competitions.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight">
            League Standings
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            Select a competition to view its ranked leaderboards.
          </p>
        </div>

        {/* Search */}
        <div className="relative group max-w-lg">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Filter competitions..."
            className="input pl-12 h-14 bg-slate-800/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Competition Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredComps.length === 0 ? (
          <div className="card p-12 text-center">
            <FiAward className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 font-bold">
              No competitions with standings found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComps.map((comp, i) => {
              const tourCount = getCompTournamentCount(comp.id);
              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompetition(comp);
                    setSearchTerm("");
                  }}
                  className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${(i % 4) + 1} relative overflow-hidden cursor-pointer`}
                >
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/50 flex items-center justify-center text-blue-400 mb-6 border border-slate-700/50 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                      {comp.image_url ? (
                        <img
                          src={
                            comp.image_url.startsWith("http")
                              ? comp.image_url
                              : `http://localhost:8000${comp.image_url}`
                          }
                          alt={comp.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiAward size={28} />
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 font-display tracking-tight">
                      {comp.name}
                    </h3>
                    <div className="mt-4">
                      <span className="bg-blue-600/10 text-blue-400 px-2 py-1 rounded-md border border-blue-600/20 text-xs font-bold uppercase tracking-widest">
                        {tourCount} Seasons
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-blue-600/10 group-hover:bg-blue-600/40 transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============ VIEW 2: SEASON CARDS ============
  if (!selectedTournament) {
    const compSeasons = tournaments.filter(
      (t) => t.competition_id === selectedCompetition.id,
    );
    const filteredSeasons = compSeasons.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <button
          onClick={() => {
            setSelectedCompetition(null);
            setSearchTerm("");
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          ← Back to Competitions
        </button>

        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700 overflow-hidden">
            {selectedCompetition.image_url ? (
              <img
                src={
                  selectedCompetition.image_url.startsWith("http")
                    ? selectedCompetition.image_url
                    : `http://localhost:8000${selectedCompetition.image_url}`
                }
                alt={selectedCompetition.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiAward size={32} />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white font-display tracking-tight">
              {selectedCompetition.name}
            </h1>
            <p className="text-slate-400 font-medium font-body mt-1">
              Select a season to view its league table.
            </p>
          </div>
        </div>

        <div className="relative group max-w-lg">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Filter seasons..."
            className="input pl-12 h-12 bg-slate-800/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeasons.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
              <FiCalendar className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-500 font-medium">
                No seasons found for this competition.
              </p>
            </div>
          ) : (
            filteredSeasons.map((season, i) => (
              <div
                key={season.id}
                onClick={() => {
                  setSelectedTournament(season);
                  setSearchTerm("");
                }}
                className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${(i % 4) + 1} relative overflow-hidden cursor-pointer`}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-600/20 text-xs font-black uppercase tracking-widest">
                      {season.year}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white font-display tracking-tight">
                    {season.name}
                  </h3>
                </div>
                <div className="h-1 w-full bg-blue-600/10 group-hover:bg-blue-600/40 transition-colors" />
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ============ VIEW 3: STANDINGS TABLE ============
  const standingGroup = groupedStandings.find(
    (g) => g.tournament.id === selectedTournament.id,
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <button
        onClick={() => {
          setSelectedTournament(null);
          setSearchTerm("");
        }}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        ← Back to {selectedCompetition.name}
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl">
            <FiAward size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white font-display tracking-tight uppercase">
              {selectedTournament.name}
            </h1>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span>Season {selectedTournament.year}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-blue-500">
                {selectedTournament.type.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {(user?.role === UserRoles.SUPER_ADMIN ||
          user?.role === UserRoles.TOURNAMENT_ADMIN) && (
          <button
            onClick={() => handleRecalculate(selectedTournament.id)}
            disabled={recalculating === selectedTournament.id}
            className="btn btn-secondary h-11 border border-slate-700/50 hover:border-blue-500/30 transition-all disabled:opacity-50"
          >
            <FiRefreshCw
              className={
                recalculating === selectedTournament.id ? "animate-spin" : ""
              }
            />
            Sync Standings
          </button>
        )}
      </div>

      {!standingGroup || standingGroup.teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center group">
          <FiTrendingUp className="text-slate-600 mb-8" size={48} />
          <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight mb-2">
            No Standings Yet
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">
            Add teams and record match results to populate this table.
          </p>
        </div>
      ) : (
        <div className="card card-hover overflow-hidden border-white/10 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-20">
                    Rank
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Club
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-16">
                    MP
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center w-16 text-blue-400">
                    W
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-16">
                    D
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center w-16 text-red-400">
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
                {standingGroup.teams.map((standing, index) => (
                  <tr
                    key={standing.team_id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`text-sm font-black w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${index === 0 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-lg shadow-yellow-500/5" : "bg-slate-800 text-slate-500 border border-slate-700/50"}`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-400 uppercase tracking-tighter group-hover:scale-110 transition-transform">
                          {standing.team?.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight leading-none mb-1">
                          {standing.team?.name}
                        </span>
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
      )}
    </div>
  );
};
