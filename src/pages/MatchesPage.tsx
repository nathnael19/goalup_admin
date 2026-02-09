import React, { useState, useEffect } from "react";
import { FiEdit2, FiClock, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { matchService } from "../services/matchService";
import { teamService } from "../services/teamService";
import { tournamentService } from "../services/tournamentService";
import type { Match, Team, Tournament, UpdateMatchScoreDto } from "../types";

export const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Partial<Match>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesData, teamsData, tournamentsData] = await Promise.all([
        matchService.getAll(),
        teamService.getAll(),
        tournamentService.getAll(),
      ]);
      setMatches(matchesData);
      setTeams(teamsData);
      setTournaments(tournamentsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentMatch.id) {
        const updateData: UpdateMatchScoreDto = {
          team_a_score: currentMatch.team_a_score,
          team_b_score: currentMatch.team_b_score,
          status: currentMatch.status,
        };
        await matchService.update(currentMatch.id.toString(), updateData);
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update match", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "finished":
        return (
          <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold uppercase">
            Finished
          </span>
        );
      case "live":
        return (
          <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-[10px] font-bold uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
            Live
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase">
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            Match Center
          </h1>
          <p className="text-slate-400">
            Update scores, manage schedules and track live matches.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="card group hover:border-blue-500/30 transition-all"
            >
              <div className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-48 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 truncate">
                    {tournaments.find((t) => t.id === match.tournament_id)
                      ?.name || "Tournament"}
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 text-sm">
                    <FiCalendar size={14} />
                    <span>
                      {new Date(match.match_time || "").toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 text-sm mt-1">
                    <FiClock size={14} />
                    <span>
                      {new Date(match.match_time || "").toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center gap-4 md:gap-12 w-full">
                  <div className="text-center w-24 md:w-32">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-700 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-white uppercase">
                      {teams
                        .find((t) => t.id === match.team_a_id)
                        ?.name.charAt(0)}
                    </div>
                    <p className="text-sm font-bold text-white truncate">
                      {teams.find((t) => t.id === match.team_a_id)?.name}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl md:text-5xl font-black text-white">
                        {match.team_a_score}
                      </span>
                      <span className="text-slate-600 font-bold">:</span>
                      <span className="text-3xl md:text-5xl font-black text-white">
                        {match.team_b_score}
                      </span>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>

                  <div className="text-center w-24 md:w-32">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-700 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-white uppercase">
                      {teams
                        .find((t) => t.id === match.team_b_id)
                        ?.name.charAt(0)}
                    </div>
                    <p className="text-sm font-bold text-white truncate">
                      {teams.find((t) => t.id === match.team_b_id)?.name}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto flex justify-center md:justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6">
                  <button
                    onClick={() => {
                      setCurrentMatch(match);
                      setShowModal(true);
                    }}
                    className="p-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button className="p-3 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-xl transition-all">
                    <FiCheckCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">
                Update Results
              </h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 truncate">
                      {teams.find((t) => t.id === currentMatch.team_a_id)?.name}
                    </p>
                    <input
                      type="number"
                      className="input text-center text-2xl font-black h-16"
                      value={currentMatch.team_a_score ?? 0}
                      onChange={(e) =>
                        setCurrentMatch({
                          ...currentMatch,
                          team_a_score: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="text-xl font-bold text-slate-600 mt-6">:</div>
                  <div className="text-center flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 truncate">
                      {teams.find((t) => t.id === currentMatch.team_b_id)?.name}
                    </p>
                    <input
                      type="number"
                      className="input text-center text-2xl font-black h-16"
                      value={currentMatch.team_b_score ?? 0}
                      onChange={(e) =>
                        setCurrentMatch({
                          ...currentMatch,
                          team_b_score: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Match Status</label>
                  <select
                    className="input"
                    value={currentMatch.status}
                    onChange={(e) =>
                      setCurrentMatch({
                        ...currentMatch,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live Now</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-bold"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors font-bold shadow-lg shadow-blue-500/20"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
