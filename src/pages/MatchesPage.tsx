import React, { useState, useEffect } from "react";
import { FiClock, FiCalendar, FiSearch, FiAward, FiPlus } from "react-icons/fi";
import { matchService } from "../services/matchService";
import { teamService } from "../services/teamService";
import { tournamentService } from "../services/tournamentService";
import { competitionService } from "../services/competitionService";
import { useNavigate } from "react-router-dom";
import {
  type Match,
  type Team,
  type Tournament,
  type Competition,
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
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down selection
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | "all">("all");

  const [showModal, setShowModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Partial<Match>>({});
  const [filter, setFilter] = useState<
    "all" | "scheduled" | "live" | "finished"
  >("all");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [tick, setTick] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

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
      const [matchesData, teamsData, tournamentsData, competitionsData] =
        await Promise.all([
          matchService.getAll(),
          teamService.getAll(),
          tournamentService.getAll(),
          competitionService.getAll(),
        ]);
      setMatches(matchesData);
      setTeams(teamsData);
      setTournaments(tournamentsData);
      setCompetitions(competitionsData);
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

  // Helper counts
  const getCompMatchCount = (compId: string) => {
    const tourIds = tournaments
      .filter((t) => t.competition_id === compId)
      .map((t) => t.id);
    return matches.filter((m) => tourIds.includes(m.tournament_id)).length;
  };

  const getTourMatchCount = (tourId: string) => {
    return matches.filter((m) => m.tournament_id === tourId).length;
  };

  // ============ VIEW 1: COMPETITION CARDS ============
  if (!selectedCompetition) {
    const filteredComps = competitions.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
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
              Select a competition to manage its fixtures and results.
            </p>
          </div>
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
            <p className="text-slate-500 font-bold">No competitions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComps.map((comp, i) => {
              const matchCount = getCompMatchCount(comp.id);
              const seasonCount = tournaments.filter(
                (t) => t.competition_id === comp.id,
              ).length;
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
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
                      <span className="bg-slate-800 px-2 py-1 rounded-md">
                        {seasonCount} Seasons
                      </span>
                      <span className="bg-blue-600/10 text-blue-400 px-2 py-1 rounded-md border border-blue-600/20">
                        {matchCount} Matches
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                Select a season to view its match schedule.
              </p>
            </div>
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
            filteredSeasons.map((season, i) => {
              const matchCount = getTourMatchCount(season.id);
              return (
                <div
                  key={season.id}
                  onClick={() => {
                    setSelectedTournament(season);
                    setSearchTerm("");
                    setFilter("all");
                    setSelectedRound("all");
                  }}
                  className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${(i % 4) + 1} relative overflow-hidden cursor-pointer`}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-600/20 text-xs font-black uppercase tracking-widest">
                        {season.year}
                      </div>
                      <div className="text-xs font-bold text-slate-500 capitalize">
                        {season.type.replace("_", " ")}
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 font-display tracking-tight">
                      {season.name}
                    </h3>
                    <div className="mt-4">
                      <span className="bg-blue-600/10 text-blue-400 px-2 py-1 rounded-md border border-blue-600/20 text-xs font-bold uppercase tracking-widest">
                        {matchCount} Matches
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-blue-600/10 group-hover:bg-blue-600/40 transition-colors" />
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ============ VIEW 3: MATCH LIST ============
  const filteredMatches = matches.filter((m) => {
    const isThisSeason = m.tournament_id === selectedTournament.id;
    const statusMatch = filter === "all" ? true : m.status === filter;
    const roundMatch =
      selectedRound === "all" ? true : m.match_day === selectedRound;
    return isThisSeason && statusMatch && roundMatch;
  });

  // Unique rounds for filtering
  const availableRounds = Array.from(
    new Set(
      matches
        .filter((m) => m.tournament_id === selectedTournament.id)
        .map((m) => m.match_day)
        .filter((r) => r !== undefined && r !== null),
    ),
  ).sort((a, b) => (a as number) - (b as number)) as number[];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <button
        onClick={() => {
          setSelectedTournament(null);
          setSearchTerm("");
        }}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        ← Back to {selectedCompetition.name}
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
            <FiClock size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white font-display tracking-tight">
              {selectedTournament.name}
            </h1>
            <p className="text-slate-400 font-medium font-body mt-1">
              {selectedCompetition.name} • {selectedTournament.year}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setMode("create");
              setCurrentMatch({
                status: "scheduled" as MatchStatus,
                tournament_id: selectedTournament.id,
                total_time: 90,
              });
              setShowModal(true);
            }}
            className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <FiPlus className="mr-2" /> Schedule Match
          </button>
          <button
            onClick={() => {
              setShowAutoScheduleModal(true);
              setScheduleConfig({
                tournament_id: selectedTournament.id,
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
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-3 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner w-fit">
          {["all", "scheduled", "live", "finished"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all duration-300 capitalize ${
                filter === f
                  ? f === "live"
                    ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Round Filter */}
        {availableRounds.length > 0 && (
          <div className="flex items-center gap-3 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner w-fit ml-auto">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-3 pr-1">
              Round
            </span>
            <select
              value={selectedRound}
              onChange={(e) =>
                setSelectedRound(
                  e.target.value === "all" ? "all" : parseInt(e.target.value),
                )
              }
              className="bg-transparent text-white text-xs font-bold border-none focus:ring-0 cursor-pointer pr-8"
            >
              <option value="all" className="bg-slate-900">
                All Rounds
              </option>
              {availableRounds.map((r) => (
                <option key={r} value={r} className="bg-slate-900">
                  Round {r}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-12">
        {availableRounds
          .filter((r) => selectedRound === "all" || r === selectedRound)
          .map((round) => {
            const roundMatches = filteredMatches.filter(
              (m) => m.match_day === round,
            );
            if (roundMatches.length === 0) return null;

            return (
              <div key={round} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                    Match Day {round}
                  </h2>
                  <div className="h-px flex-1 bg-slate-800/50" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {roundMatches.map((match) => (
                    <div
                      key={match.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button")) return;
                        navigate(`/matches/${match.id}`);
                      }}
                      className={`card card-hover group relative overflow-hidden cursor-pointer`}
                    >
                      <div className="p-4 md:p-6 flex flex-col lg:flex-row items-center gap-8 text-white relative z-10">
                        {/* Meta Info */}
                        <div className="w-full lg:w-56 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-4 border-b lg:border-b-0 lg:border-r border-slate-800/50 pb-6 lg:pb-0 lg:pr-10">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2.5 text-slate-300 font-bold text-sm">
                              <FiCalendar
                                className="text-slate-500"
                                size={14}
                              />
                              <span>
                                {new Date(match.start_time).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-300 font-bold text-sm">
                              <FiClock className="text-slate-500" size={14} />
                              <span>
                                {new Date(match.start_time).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="hidden lg:block">
                            {getStatusBadge(match, tick)}
                          </div>
                        </div>

                        {/* Scoreboard */}
                        <div className="flex-1 flex items-center justify-between w-full max-w-2xl mx-auto">
                          <div className="flex flex-col items-center gap-4 text-center w-32 md:w-44">
                            <div className="w-14 h-14 md:w-20 md:h-20 rounded-4xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-2xl relative overflow-hidden">
                              <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                              <span className="relative z-10">
                                {teams
                                  .find((t) => t.id === match.team_a_id)
                                  ?.name.charAt(0)}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white font-display tracking-tight leading-none mb-1 line-clamp-1">
                              {
                                teams.find((t) => t.id === match.team_a_id)
                                  ?.name
                              }
                            </h4>
                          </div>

                          <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-6 md:gap-10">
                              <span className="text-3xl md:text-5xl font-black text-white font-display tracking-tighter tabular-nums">
                                {match.score_a}
                              </span>
                              <span className="text-slate-700 font-black text-lg">
                                :
                              </span>
                              <span className="text-3xl md:text-5xl font-black text-white font-display tracking-tighter tabular-nums">
                                {match.score_b}
                              </span>
                            </div>
                            <div className="lg:hidden">
                              {getStatusBadge(match, tick)}
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-4 text-center w-32 md:w-44">
                            <div className="w-14 h-14 md:w-20 md:h-20 rounded-4xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-2xl relative overflow-hidden">
                              <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                              <span className="relative z-10">
                                {teams
                                  .find((t) => t.id === match.team_b_id)
                                  ?.name.charAt(0)}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white font-display tracking-tight leading-none mb-1 line-clamp-1">
                              {
                                teams.find((t) => t.id === match.team_b_id)
                                  ?.name
                              }
                            </h4>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 left-0 w-2 h-full bg-blue-600/0 group-hover:bg-blue-600 transition-all duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        {filteredMatches.length === 0 && (
          <div className="card p-12 text-center">
            <FiClock className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 font-medium">
              No {filter !== "all" ? filter : ""} matches found this season.
            </p>
          </div>
        )}
      </div>

      {/* Auto Schedule Modal */}
      {showAutoScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowAutoScheduleModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden flex flex-col">
            <div className="p-8">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight text-center font-display">
                Auto Schedule
              </h2>
              <form onSubmit={handleAutoSchedule} className="space-y-6">
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
                    <label className="label">Interval (Days)</label>
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
                <div>
                  <label className="label">Duration (Min)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="input h-12"
                    value={scheduleConfig.total_time}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        total_time: parseInt(e.target.value) || 90,
                      })
                    }
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAutoScheduleModal(false)}
                    className="btn btn-secondary flex-1 h-12"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1 h-12">
                    Generate
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
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden flex flex-col">
            <div className="p-8">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight text-center font-display">
                Schedule Match
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {teams
                        .filter(
                          (t) =>
                            t.tournament_id === selectedTournament.id &&
                            t.id !== currentMatch.team_b_id,
                        )
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
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {teams
                        .filter(
                          (t) =>
                            t.tournament_id === selectedTournament.id &&
                            t.id !== currentMatch.team_a_id,
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Kick-off</label>
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
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1 h-12"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1 h-12">
                    Schedule
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
