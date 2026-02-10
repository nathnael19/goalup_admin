import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiTrash2,
  FiEdit2,
  FiSave,
  FiX,
  FiPlay,
  FiCheckCircle,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import { matchService } from "../services/matchService";
import { goalService } from "../services/goalService";
import { teamService } from "../services/teamService";
import type { Match, Goal, TeamDetail } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<Partial<Match>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [teamADetail, setTeamADetail] = useState<TeamDetail | null>(null);
  const [teamBDetail, setTeamBDetail] = useState<TeamDetail | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState<{
    team_id: string;
    player_id: string;
    minute: number;
    is_own_goal: boolean;
  }>({
    team_id: "",
    player_id: "",
    minute: 1,
    is_own_goal: false,
  });

  useEffect(() => {
    if (id) {
      fetchMatch(id);
    }
  }, [id]);

  const fetchMatch = async (matchId: string) => {
    try {
      setLoading(true);
      const [matchData, goalsData] = await Promise.all([
        matchService.getById(matchId),
        goalService.getByMatchId(matchId),
      ]);
      setMatch(matchData);
      setEditedMatch(matchData);
      setGoals(goalsData);

      // Fetch team details for roster
      if (matchData.team_a_id && matchData.team_b_id) {
        const [a, b] = await Promise.all([
          teamService.getById(matchData.team_a_id),
          teamService.getById(matchData.team_b_id),
        ]);
        setTeamADetail(a as TeamDetail);
        setTeamBDetail(b as TeamDetail);
      }
    } catch (err) {
      console.error("Failed to fetch match details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !match ||
      !window.confirm("Are you sure you want to delete this match?")
    )
      return;
    try {
      await matchService.delete(match.id);
      navigate("/matches");
    } catch (err) {
      console.error("Failed to delete match", err);
    }
  };

  const handleSave = async () => {
    if (!match) return;
    try {
      await matchService.update(match.id, {
        score_a: editedMatch.score_a,
        score_b: editedMatch.score_b,
        status: editedMatch.status,
        additional_time_first_half: editedMatch.additional_time_first_half,
        additional_time_second_half: editedMatch.additional_time_second_half,
        total_time: editedMatch.total_time,
        is_halftime: editedMatch.is_halftime,
      });
      await fetchMatch(match.id);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update match", err);
    }
  };

  const handleStartMatch = async () => {
    if (!match) return;
    try {
      await matchService.update(match.id, { status: "live" });
      await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to start match", err);
    }
  };

  const handleFinishMatch = async () => {
    if (!match) return;
    try {
      await matchService.update(match.id, { status: "finished" });
      await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to finish match", err);
    }
  };

  const calculateMatchTime = (m: Match) => {
    if (m.status !== "live") return null;
    if (m.is_halftime) return "HT";

    const start = new Date(m.start_time).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - start) / 60000);

    if (diffInMinutes > 45 && diffInMinutes < 46) return "45'";
    if (diffInMinutes >= 90) return "90'";

    return `${Math.max(1, diffInMinutes)}'`;
  };

  const updateScore = (team: "a" | "b", delta: number) => {
    const key = team === "a" ? "score_a" : "score_b";
    const currentScore = editedMatch[key] ?? 0;
    const newScore = Math.max(0, currentScore + delta);
    setEditedMatch({ ...editedMatch, [key]: newScore });
  };

  const toggleHalftime = async () => {
    if (!match) return;
    try {
      const newHalftime = !match.is_halftime;
      await matchService.update(match.id, { is_halftime: newHalftime });
      await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to toggle halftime", err);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    try {
      await goalService.create({
        match_id: match.id,
        team_id: goalData.team_id,
        player_id: goalData.player_id || undefined,
        minute: goalData.minute,
        is_own_goal: goalData.is_own_goal,
      });
      setShowGoalModal(false);
      await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to add goal", err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await goalService.delete(goalId);
      if (match) await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  const getStatusBadge = (m: Match) => {
    switch (m.status) {
      case "finished":
        return (
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest border border-slate-700">
            FT
          </span>
        );
      case "live":
        const timeDisplay = calculateMatchTime(m);
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
            {timeDisplay || "Live"}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-black uppercase tracking-widest border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            Scheduled
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-slate-800/50 animate-pulse" />
          <div className="h-8 w-48 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
        <p className="text-xl font-bold">Match not found</p>
        <button
          onClick={() => navigate("/matches")}
          className="mt-4 btn btn-secondary"
        >
          Back to Matches
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header / Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/matches")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <FiArrowLeft />
          </div>
          <span className="font-bold">Back to Matches</span>
        </button>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedMatch(match);
                }}
                className="btn btn-secondary"
              >
                <FiX className="mr-2" /> Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                <FiSave className="mr-2" /> Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                <FiEdit2 className="mr-2" /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-secondary text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              >
                <FiTrash2 className="mr-2" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-4xl bg-slate-900/50 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-blue-600/5" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-8 md:p-12">
          {/* Tournament & Status */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-blue-500 font-black uppercase tracking-[0.2em] text-sm mb-2">
                {match.tournament?.name || "Tournament Match"}
              </h2>
              <div className="flex items-center gap-4 text-slate-400 text-sm font-bold justify-center md:justify-start">
                <span className="flex items-center gap-2">
                  <FiCalendar />
                  {new Date(match.start_time).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="flex items-center gap-2">
                  {new Date(match.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="flex items-center gap-2">
                  <FiClock className="text-blue-400" />
                  <span>{match.total_time || 90} Min Game</span>
                </span>
              </div>
            </div>
            <div>{getStatusBadge(match)}</div>
          </div>

          {/* Scoreboard */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Home */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-linear-to-br from-slate-800 to-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center text-4xl font-black text-white relative">
                {match.team_a?.logo_url ? (
                  <img
                    src={match.team_a.logo_url}
                    alt={match.team_a.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span>{match.team_a?.name.charAt(0)}</span>
                )}
                <span className="absolute -bottom-3 px-3 py-1 bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-700 text-slate-400">
                  Home
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white text-center max-w-[200px] leading-tight">
                {match.team_a?.name}
              </h1>
            </div>

            {/* VS / Score */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-6 md:gap-12">
                {isEditing ? (
                  <>
                    {/* Team A Score Controls */}
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => updateScore("a", 1)}
                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        <FiPlus size={20} />
                      </button>
                      <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-2xl">
                        {editedMatch.score_a ?? 0}
                      </span>
                      <button
                        onClick={() => updateScore("a", -1)}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                      >
                        <FiMinus size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-2xl">
                    {match.score_a}
                  </span>
                )}

                <span className="text-4xl text-slate-700 font-black">:</span>

                {isEditing ? (
                  <>
                    {/* Team B Score Controls */}
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => updateScore("b", 1)}
                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        <FiPlus size={20} />
                      </button>
                      <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-2xl">
                        {editedMatch.score_b ?? 0}
                      </span>
                      <button
                        onClick={() => updateScore("b", -1)}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                      >
                        <FiMinus size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-2xl">
                    {match.score_b}
                  </span>
                )}
              </div>
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-linear-to-br from-slate-800 to-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center text-4xl font-black text-white relative">
                {match.team_b?.logo_url ? (
                  <img
                    src={match.team_b.logo_url}
                    alt={match.team_b.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span>{match.team_b?.name.charAt(0)}</span>
                )}
                <span className="absolute -bottom-3 px-3 py-1 bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-700 text-slate-400">
                  Away
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white text-center max-w-[200px] leading-tight">
                {match.team_b?.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Match Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Controls */}
        <div className="card p-6">
          <h3 className="text-lg font-black text-white mb-4">Match Status</h3>
          <div className="flex flex-col gap-3">
            {match.status === "scheduled" && (
              <button
                onClick={handleStartMatch}
                className="btn btn-primary w-full"
              >
                <FiPlay className="mr-2" /> Start Match
              </button>
            )}
            {match.status === "live" && (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setGoalData({
                        ...goalData,
                        team_id: match.team_a_id,
                        minute: calculateMatchTime(match)?.replace("'", "")
                          ? parseInt(
                              calculateMatchTime(match)!.replace("'", ""),
                            )
                          : 1,
                      });
                      setShowGoalModal(true);
                    }}
                    className="btn btn-secondary flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  >
                    <FiPlus className="mr-2" /> Goal {match.team_a?.name}
                  </button>
                  <button
                    onClick={() => {
                      setGoalData({
                        ...goalData,
                        team_id: match.team_b_id,
                        minute: calculateMatchTime(match)?.replace("'", "")
                          ? parseInt(
                              calculateMatchTime(match)!.replace("'", ""),
                            )
                          : 1,
                      });
                      setShowGoalModal(true);
                    }}
                    className="btn btn-secondary flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  >
                    <FiPlus className="mr-2" /> Goal {match.team_b?.name}
                  </button>
                </div>
                <button
                  onClick={toggleHalftime}
                  className={`btn w-full ${match.is_halftime ? "btn-primary bg-amber-600 hover:bg-amber-500" : "btn-secondary"}`}
                >
                  <FiClock className="mr-2" />{" "}
                  {match.is_halftime ? "End Half-Time" : "Set Half-Time (HT)"}
                </button>
                <button
                  onClick={handleFinishMatch}
                  className="btn btn-primary w-full bg-green-600 hover:bg-green-500"
                >
                  <FiCheckCircle className="mr-2" /> Finish Match
                </button>
              </>
            )}
            {match.status === "finished" && (
              <div className="text-center py-4 text-slate-400">
                Match has ended
              </div>
            )}
          </div>
        </div>

        {/* Additional Time */}
        <div className="card p-6">
          <h3 className="text-lg font-black text-white mb-4">
            Additional Time
          </h3>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="label">First Half (+45')</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={editedMatch.additional_time_first_half ?? 0}
                  onChange={(e) =>
                    setEditedMatch({
                      ...editedMatch,
                      additional_time_first_half: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Minutes"
                />
              </div>
              <div>
                <label className="label">Second Half (+90')</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={editedMatch.additional_time_second_half ?? 0}
                  onChange={(e) =>
                    setEditedMatch({
                      ...editedMatch,
                      additional_time_second_half:
                        parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Minutes"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">First Half:</span>
                <span className="text-white font-black text-lg">
                  +{match.additional_time_first_half || 0} min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">Second Half:</span>
                <span className="text-white font-black text-lg">
                  +{match.additional_time_second_half || 0} min
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Match Settings (Duration) */}
        <div className="card p-6">
          <h3 className="text-lg font-black text-white mb-4">Match Settings</h3>
          {isEditing ? (
            <div>
              <label className="label">Total Duration (minutes)</label>
              <input
                type="number"
                min="1"
                max="240"
                className="input"
                value={editedMatch.total_time ?? 90}
                onChange={(e) =>
                  setEditedMatch({
                    ...editedMatch,
                    total_time: parseInt(e.target.value) || 90,
                  })
                }
                placeholder="Minutes"
              />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold">
                Planned Duration:
              </span>
              <span className="text-white font-black text-lg">
                {match.total_time || 90} minutes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats/Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <FiMapPin className="text-blue-500" /> Venue Information
          </h3>
          <p className="text-slate-400">
            Venue information is not yet available for this match.
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-black text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">Match Events</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Timeline
            </span>
          </h3>
          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-slate-500 text-sm italic">
                No goals recorded yet.
              </p>
            ) : (
              <div className="relative border-l-2 border-slate-800 ml-3 pl-6 space-y-6">
                {goals.map((g) => (
                  <div key={g.id} className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-900 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-500 font-black text-sm">
                            {g.minute}'
                          </span>
                          <span className="text-white font-black">GOAL!</span>
                          {g.is_own_goal && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-black uppercase">
                              OG
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-300">
                          {g.player?.name || "Unknown Player"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          {g.team_id === match.team_a_id
                            ? match.team_a?.name
                            : match.team_b?.name}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowGoalModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">
                Record Goal
              </h2>
              <form onSubmit={handleAddGoal} className="space-y-6">
                <div>
                  <label className="label">
                    Scorer (
                    {goalData.team_id === match.team_a_id
                      ? match.team_a?.name
                      : match.team_b?.name}
                    )
                  </label>
                  <select
                    className="input h-12 appearance-none"
                    value={goalData.player_id}
                    onChange={(e) =>
                      setGoalData({ ...goalData, player_id: e.target.value })
                    }
                  >
                    <option value="">Select Scorer (Optional)</option>
                    {(goalData.team_id === match.team_a_id
                      ? teamADetail
                      : teamBDetail
                    )?.roster.goalkeepers
                      .concat(
                        (goalData.team_id === match.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.defenders || [],
                        (goalData.team_id === match.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.midfielders || [],
                        (goalData.team_id === match.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.forwards || [],
                      )
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.jersey_number}. {p.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Minute</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="input h-12"
                      value={goalData.minute}
                      onChange={(e) =>
                        setGoalData({
                          ...goalData,
                          minute: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-700 bg-slate-800/50 w-full hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900"
                        checked={goalData.is_own_goal}
                        onChange={(e) =>
                          setGoalData({
                            ...goalData,
                            is_own_goal: e.target.checked,
                          })
                        }
                      />
                      <span className="text-xs font-black text-slate-300 uppercase tracking-widest leading-none">
                        Own Goal
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Record Goal
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
