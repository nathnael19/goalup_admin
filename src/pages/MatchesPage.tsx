import React, { useState, useEffect } from "react";
import { FiClock, FiCalendar } from "react-icons/fi";
import { matchService } from "../services/matchService";
import { teamService } from "../services/teamService";
import { tournamentService } from "../services/tournamentService";
import { useNavigate } from "react-router-dom";
import {
  type Match,
  type Team,
  type Tournament,
  type UpdateMatchScoreDto,
  type MatchStatus,
} from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { Toast } from "../components/Toast";

export const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Partial<Match>>({});
  const [filter, setFilter] = useState<
    "all" | "scheduled" | "live" | "finished"
  >("all");

  const [selectedTournamentId, setSelectedTournamentId] =
    useState<string>("all");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchData();

    // Live clock update every 10 seconds for smoothness
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
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

  const [mode, setMode] = useState<"create" | "update">("create");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "update" && currentMatch.id) {
        const updateData: UpdateMatchScoreDto = {
          score_a: currentMatch.score_a,
          score_b: currentMatch.score_b,
          status: currentMatch.status,
        };

        const existingMatch = matches.find((m) => m.id === currentMatch.id);
        if (
          currentMatch.status === "live" &&
          existingMatch?.status !== "live"
        ) {
          updateData.start_time = new Date().toISOString();
        }

        await matchService.update(currentMatch.id, updateData);
      } else if (mode === "create") {
        if (
          !currentMatch.tournament_id ||
          !currentMatch.team_a_id ||
          !currentMatch.team_b_id ||
          !currentMatch.start_time
        ) {
          // Basic validation (could be improved with toast)
          return;
        }
        await matchService.create({
          tournament_id: currentMatch.tournament_id,
          team_a_id: currentMatch.team_a_id,
          team_b_id: currentMatch.team_b_id,
          start_time: currentMatch.start_time,
          total_time: currentMatch.total_time || 90,
        });
      }
      setShowModal(false);
      fetchData();
      setToast({
        message: currentMatch.id
          ? "Match updated successfully!"
          : "Match created successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to save match", err);
      setToast({
        message: "Failed to save match. Please try again.",
        type: "error",
      });
    }
  };

  const calculateMatchTime = (match: Match, _tick?: number) => {
    if (match.status !== "live") return null;
    if (match.is_halftime) return "HT";

    const startTimeStr =
      match.start_time.includes("Z") || match.start_time.includes("+")
        ? match.start_time
        : `${match.start_time}Z`;
    const start = new Date(startTimeStr).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - start) / 60000);

    // If match started in the future (according to client clock), show 1'
    if (diffInMinutes < 0) return "1'";

    const totalTime = match.total_time || 90;
    if (diffInMinutes >= totalTime) return `${totalTime}'`;

    return `${diffInMinutes + 1}'`;
  };

  const getStatusBadge = (match: Match, _tick?: number) => {
    switch (match.status) {
      case "finished":
        return (
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-700">
            FT
          </span>
        );
      case "live":
        const timeDisplay = calculateMatchTime(match, _tick);
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
            {timeDisplay || "Live"}
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

  // Filter teams based on selected tournament during creation
  const availableTeams =
    mode === "create" && currentMatch.tournament_id
      ? teams.filter((t) => t.tournament_id === currentMatch.tournament_id)
      : teams;

  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    tournament_id: "",
    start_date: "",
    matches_per_day: 1,
    interval_days: 1,
    total_time: 90,
  });

  const handleAutoSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!scheduleConfig.tournament_id || !scheduleConfig.start_date) return;

      await tournamentService.schedule(scheduleConfig.tournament_id, {
        start_date: new Date(scheduleConfig.start_date).toISOString(),
        matches_per_day: scheduleConfig.matches_per_day,
        interval_days: scheduleConfig.interval_days,
        total_time: scheduleConfig.total_time,
      });

      setShowAutoScheduleModal(false);
      fetchData();
      setToast({
        message: "Fixtures generated successfully!",
        type: "success",
      });
    } catch (err: any) {
      console.error("Failed to generate schedule", err);
      const errorMessage =
        err?.response?.data?.detail ||
        "Failed to generate fixtures. Please try again.";
      setToast({ message: errorMessage, type: "error" });
    }
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight">
            Match Center
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            Coordinate schedules, update live scores and manage event statuses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setMode("create");
              setCurrentMatch({
                status: "scheduled" as MatchStatus,
                total_time: 90,
              });
              setShowModal(true);
            }}
            className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <FiClock className="mr-2" /> Schedule Match
          </button>
          <button
            onClick={() => {
              setShowAutoScheduleModal(true);
              setScheduleConfig({
                tournament_id: "",
                start_date: "",
                matches_per_day: 1,
                interval_days: 1,
                total_time: 90,
              });
            }}
            className="btn btn-secondary h-12 border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <FiCalendar className="mr-2" /> Auto Fixtures
          </button>

          <div className="flex items-center gap-3 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner">
            <select
              className="bg-transparent text-xs font-bold text-slate-300 appearance-none outline-none px-3 py-2 [&>option]:bg-slate-900"
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
            >
              <option value="all">All Tournaments</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => setFilter("all")}
              className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all duration-300 ${
                filter === "all"
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("scheduled")}
              className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all duration-300 ${
                filter === "scheduled"
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setFilter("live")}
              className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all duration-300 ${
                filter === "live"
                  ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter("finished")}
              className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all duration-300 ${
                filter === "finished"
                  ? "bg-slate-600 text-white shadow-[0_0_15px_rgba(71,85,105,0.4)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Finished
            </button>
          </div>
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
          {matches
            .filter((m) => {
              const statusMatch = filter === "all" ? true : m.status === filter;
              const tournamentMatch =
                selectedTournamentId === "all"
                  ? true
                  : m.tournament_id === selectedTournamentId;
              return statusMatch && tournamentMatch;
            })
            .map((match, i) => (
              <div
                key={match.id}
                onClick={(e) => {
                  // Prevent navigation if clicking on action buttons
                  if ((e.target as HTMLElement).closest("button")) return;
                  navigate(`/matches/${match.id}`);
                }}
                className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                  (i % 4) + 1
                } relative overflow-hidden cursor-pointer`}
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
                            {new Date(
                              match.start_time || "",
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-300 font-bold text-sm">
                          <FiClock className="text-slate-500" size={14} />
                          <span>
                            {new Date(
                              match.start_time || "",
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      {getStatusBadge(match, tick)}
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
                        {getStatusBadge(match, tick)}
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
                </div>
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600/0 group-hover:bg-blue-600 transition-all duration-300" />
              </div>
            ))}
        </div>
      )}

      {/* Auto Schedule Modal */}
      {showAutoScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowAutoScheduleModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden max-h-[95vh] flex flex-col">
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <div className="p-6 md:p-8 shrink-0">
              <h2 className="text-2xl font-black text-white mb-2 text-center font-display tracking-tight uppercase">
                Auto Schedule
              </h2>
              <p className="text-xs text-center text-slate-500 font-bold uppercase tracking-widest">
                Generate home & away fixtures
              </p>
            </div>
            <div className="px-6 md:px-8 pb-8 modal-content overflow-y-auto">
              <form onSubmit={handleAutoSchedule} className="space-y-6">
                {/* Tournament Selection */}
                <div>
                  <label className="label">Tournament context</label>
                  <select
                    required
                    className="input h-12 appearance-none"
                    value={scheduleConfig.tournament_id}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        tournament_id: e.target.value,
                      })
                    }
                  >
                    <option value="" disabled>
                      Select Tournament
                    </option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="label">Start Date</label>
                  <input
                    required
                    type="date"
                    className="input h-12"
                    value={scheduleConfig.start_date}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Matches / Day</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="input h-12"
                      value={scheduleConfig.matches_per_day}
                      onChange={(e) =>
                        setScheduleConfig({
                          ...scheduleConfig,
                          matches_per_day: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Day Interval</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="input h-12"
                      value={scheduleConfig.interval_days}
                      onChange={(e) =>
                        setScheduleConfig({
                          ...scheduleConfig,
                          interval_days: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* Match Duration */}
                <div>
                  <label className="label">Match Duration (minutes)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="240"
                    className="input h-12"
                    placeholder="e.g. 90"
                    value={scheduleConfig.total_time}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        total_time: parseInt(e.target.value) || 90,
                      })
                    }
                  />
                </div>

                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 leading-relaxed font-bold">
                    <span className="text-blue-400">Note:</span> This will
                    generate a full Double Round Robin schedule (Home & Away)
                    for all teams in the selected tournament.
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAutoScheduleModal(false)}
                    className="btn btn-secondary flex-1 h-12"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1 h-12">
                    Generate Fixtures
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manual Match Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden max-h-[95vh] flex flex-col">
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <div className="p-6 md:p-8 shrink-0">
              <h2 className="text-2xl font-black text-white mb-2 text-center font-display tracking-tight uppercase">
                {mode === "create" ? "Schedule Match" : "Update Results"}
              </h2>
              {mode === "create" && (
                <p className="text-xs text-center text-slate-500 font-bold uppercase tracking-widest">
                  Create a new fixture
                </p>
              )}
            </div>
            <div className="px-6 md:px-8 pb-8 modal-content overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === "create" ? (
                  <>
                    {/* Tournament Selection */}
                    <div>
                      <label className="label">Tournament</label>
                      <select
                        required
                        className="input h-12 appearance-none"
                        value={currentMatch.tournament_id || ""}
                        onChange={(e) =>
                          setCurrentMatch({
                            ...currentMatch,
                            tournament_id: e.target.value,
                          })
                        }
                      >
                        <option value="" disabled>
                          Select Tournament
                        </option>
                        {tournaments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Teams Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Home Team</label>
                        <select
                          required
                          className="input h-12 appearance-none"
                          value={currentMatch.team_a_id || ""}
                          onChange={(e) =>
                            setCurrentMatch({
                              ...currentMatch,
                              team_a_id: e.target.value,
                            })
                          }
                          disabled={!currentMatch.tournament_id}
                        >
                          <option value="" disabled>
                            Select Team
                          </option>
                          {availableTeams
                            .filter((t) => t.id !== currentMatch.team_b_id)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Away Team</label>
                        <select
                          required
                          className="input h-12 appearance-none"
                          value={currentMatch.team_b_id || ""}
                          onChange={(e) =>
                            setCurrentMatch({
                              ...currentMatch,
                              team_b_id: e.target.value,
                            })
                          }
                          disabled={!currentMatch.tournament_id}
                        >
                          <option value="" disabled>
                            Select Team
                          </option>
                          {availableTeams
                            .filter((t) => t.id !== currentMatch.team_a_id)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Match Duration */}
                    <div>
                      <label className="label">Match Duration (minutes)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="240"
                        className="input h-12"
                        placeholder="e.g. 90"
                        value={currentMatch.total_time || 90}
                        onChange={(e) =>
                          setCurrentMatch({
                            ...currentMatch,
                            total_time: parseInt(e.target.value) || 90,
                          })
                        }
                      />
                    </div>

                    {/* Date Time */}
                    <div>
                      <label className="label">Kick-off Time</label>
                      <input
                        required
                        type="datetime-local"
                        className="input h-12"
                        value={
                          currentMatch.start_time
                            ? new Date(currentMatch.start_time)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setCurrentMatch({
                            ...currentMatch,
                            start_time: new Date(e.target.value).toISOString(),
                          })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Update Score UI */}
                    <div className="flex items-center justify-between gap-6">
                      <div className="text-center flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 mx-auto mb-4 border border-slate-700 flex items-center justify-center font-black text-slate-500 uppercase text-lg">
                          {teams
                            .find((t) => t.id === currentMatch.team_a_id)
                            ?.name.charAt(0)}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 line-clamp-1">
                          {
                            teams.find((t) => t.id === currentMatch.team_a_id)
                              ?.name
                          }
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
                          {
                            teams.find((t) => t.id === currentMatch.team_b_id)
                              ?.name
                          }
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
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1 h-12"
                  >
                    Discard
                  </button>
                  <button type="submit" className="btn btn-primary flex-1 h-12">
                    {mode === "create" ? "Schedule Match" : "Sync Result"}
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
