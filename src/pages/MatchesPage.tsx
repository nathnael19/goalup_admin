import React, { useState, useEffect } from "react";
import { FiEdit2, FiClock, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { matchService } from "../services/matchService";
import { teamService } from "../services/teamService";
import { tournamentService } from "../services/tournamentService";
import type {
  Match,
  Team,
  Tournament,
  UpdateMatchScoreDto,
  MatchStatus,
} from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Partial<Match>>({});
  const [filter, setFilter] = useState<"all" | "live">("all");

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
          score_a: currentMatch.score_a,
          score_b: currentMatch.score_b,
          status: currentMatch.status,
        };
        await matchService.update(currentMatch.id, updateData);
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
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-700">
            Finished
          </span>
        );
      case "live":
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
            Live
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight">
            Match Center
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            Coordinate schedules, update live scores and manage event statuses.
          </p>
        </div>
        <div className="flex items-center gap-3 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner">
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all duration-300 ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter("live")}
            className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all duration-300 ${
              filter === "live"
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Live Now
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="card p-6 h-32 flex items-center gap-6 animate-stagger-1"
            >
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {(filter === "all"
            ? matches
            : matches.filter((m) => m.status === "live")
          ).map((match, i) => (
            <div
              key={match.id}
              className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                (i % 4) + 1
              } relative overflow-hidden`}
            >
              <div className="p-4 md:p-6 flex flex-col lg:flex-row items-center gap-8 text-white relative z-10">
                {/* Meta Info */}
                <div className="w-full lg:w-56 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-4 border-b lg:border-b-0 lg:border-r border-slate-800/50 pb-6 lg:pb-0 lg:pr-10">
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">
                      {tournaments.find((t) => t.id === match.tournament_id)
                        ?.name || "League Match"}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-slate-300 font-bold text-sm">
                        <FiCalendar className="text-slate-500" size={14} />
                        <span>
                          {new Date(match.start_time || "").toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-300 font-bold text-sm">
                        <FiClock className="text-slate-500" size={14} />
                        <span>
                          {new Date(match.start_time || "").toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    {getStatusBadge(match.status)}
                  </div>
                </div>

                {/* Scoreboard */}
                <div className="flex-1 flex items-center justify-between w-full max-w-2xl mx-auto">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-4 text-center w-32 md:w-44">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-4xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-2xl group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                      <span className="relative z-10">
                        {teams
                          .find((t) => t.id === match.team_a_id)
                          ?.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white font-display tracking-tight leading-none mb-1 line-clamp-1">
                        {teams.find((t) => t.id === match.team_a_id)?.name}
                      </h4>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Home
                      </span>
                    </div>
                  </div>

                  {/* VS / Score */}
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-6 md:gap-10">
                      <span className="text-3xl md:text-5xl font-black text-white font-display tracking-tighter tabular-nums">
                        {match.score_a}
                      </span>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-6 h-0.5 bg-slate-800 rounded-full" />
                        <span className="text-slate-700 font-black text-lg">
                          :
                        </span>
                        <div className="w-6 h-0.5 bg-slate-800 rounded-full" />
                      </div>
                      <span className="text-3xl md:text-5xl font-black text-white font-display tracking-tighter tabular-nums">
                        {match.score_b}
                      </span>
                    </div>
                    <div className="lg:hidden">
                      {getStatusBadge(match.status)}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-4 text-center w-32 md:w-44">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-4xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-2xl group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                      <span className="relative z-10">
                        {teams
                          .find((t) => t.id === match.team_b_id)
                          ?.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white font-display tracking-tight leading-none mb-1 line-clamp-1">
                        {teams.find((t) => t.id === match.team_b_id)?.name}
                      </h4>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Away
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vertical Actions */}
                <div className="w-full lg:w-auto flex lg:flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-800/50 pt-6 lg:pt-0 lg:pl-10">
                  <button
                    onClick={() => {
                      setCurrentMatch(match);
                      setShowModal(true);
                    }}
                    className="p-4 bg-blue-600 text-white hover:bg-blue-500 rounded-2xl shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center gap-2 font-bold"
                  >
                    <FiEdit2 size={18} />
                    <span className="lg:hidden">Update Results</span>
                  </button>
                  <button className="p-4 bg-slate-800/80 text-slate-300 hover:bg-slate-700 rounded-2xl border border-slate-700/50 transition-all">
                    <FiCheckCircle size={18} />
                  </button>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600/0 group-hover:bg-blue-600 transition-all duration-300" />
            </div>
          ))}
        </div>
      )}

      {/* Score Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden max-h-[95vh] flex flex-col">
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <div className="p-6 md:p-8 shrink-0">
              <h2 className="text-2xl font-black text-white mb-6 text-center font-display tracking-tight uppercase">
                Update Results
              </h2>
            </div>
            <div className="px-6 md:px-8 pb-8 modal-content">
              <form onSubmit={handleUpdate} className="space-y-10">
                <div className="flex items-center justify-between gap-6">
                  <div className="text-center flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 mx-auto mb-4 border border-slate-700 flex items-center justify-center font-black text-slate-500 uppercase text-lg">
                      {teams
                        .find((t) => t.id === currentMatch.team_a_id)
                        ?.name.charAt(0)}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 line-clamp-1">
                      {teams.find((t) => t.id === currentMatch.team_a_id)?.name}
                    </p>
                    <input
                      type="number"
                      className="input text-center text-4xl font-black h-16 bg-slate-950 rounded-2xl"
                      value={currentMatch.score_a ?? 0}
                      onChange={(e) =>
                        setCurrentMatch({
                          ...currentMatch,
                          score_a: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="text-3xl font-black text-slate-700 mt-14">
                    :
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 mx-auto mb-4 border border-slate-700 flex items-center justify-center font-black text-slate-500 uppercase text-lg">
                      {teams
                        .find((t) => t.id === currentMatch.team_b_id)
                        ?.name.charAt(0)}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 line-clamp-1">
                      {teams.find((t) => t.id === currentMatch.team_b_id)?.name}
                    </p>
                    <input
                      type="number"
                      className="input text-center text-4xl font-black h-16 bg-slate-950 rounded-2xl"
                      value={currentMatch.score_b ?? 0}
                      onChange={(e) =>
                        setCurrentMatch({
                          ...currentMatch,
                          score_b: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="label uppercase tracking-widest text-[10px] mb-3">
                    Live Status Phase
                  </label>
                  <select
                    className="input h-14 appearance-none font-bold"
                    value={currentMatch.status}
                    onChange={(e) =>
                      setCurrentMatch({
                        ...currentMatch,
                        status: e.target.value as MatchStatus,
                      })
                    }
                  >
                    <option value="scheduled">Scheduled / Upcoming</option>
                    <option value="live">Live In-Game</option>
                    <option value="finished">Full Time (Finished)</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1 h-14"
                  >
                    Discard
                  </button>
                  <button type="submit" className="btn btn-primary flex-1 h-14">
                    Sync Match
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
