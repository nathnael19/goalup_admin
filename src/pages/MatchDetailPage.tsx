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
  FiRepeat,
} from "react-icons/fi";
import { matchService } from "../services/matchService";
import { goalService } from "../services/goalService";
import { cardService } from "../services/cardService";
import { substitutionService } from "../services/substitutionService";
import { teamService } from "../services/teamService";
import type {
  Match,
  Goal,
  TeamDetail,
  CardEvent,
  CardType,
  Substitution,
  CreateGoalDto,
} from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<Partial<Match>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<CardEvent[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [teamADetail, setTeamADetail] = useState<TeamDetail | null>(null);
  const [teamBDetail, setTeamBDetail] = useState<TeamDetail | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState<CreateGoalDto>({
    match_id: "",
    team_id: "",
    player_id: "",
    assistant_id: "",
    minute: 1,
    is_own_goal: false,
  });
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardData, setCardData] = useState<{
    team_id: string;
    player_id: string;
    minute: number;
    type: CardType;
  }>({
    team_id: "",
    player_id: "",
    minute: 1,
    type: "yellow",
  });
  const [showSubModal, setShowSubModal] = useState(false);
  const [subData, setSubData] = useState<{
    team_id: string;
    player_in_id: string;
    player_out_id: string;
    minute: number;
  }>({
    team_id: "",
    player_in_id: "",
    player_out_id: "",
    minute: 1,
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (id) {
      fetchMatch(id);
    }

    // Refresh time every 10 seconds
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchMatch = async (matchId: string) => {
    try {
      setLoading(true);
      const [matchData, goalsData, cardsData, subData] = await Promise.all([
        matchService.getById(matchId),
        goalService.getByMatchId(matchId),
        cardService.getByMatchId(matchId),
        substitutionService.getByMatchId(matchId),
      ]);
      setMatch(matchData);
      setEditedMatch(matchData);
      setGoals(goalsData);
      setCards(cardsData);
      setSubstitutions(subData);

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
      await matchService.update(match.id, {
        status: "live",
        first_half_start: new Date().toISOString(),
      });
      await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to start match", err);
    }
  };

  const handleStartSecondHalf = async () => {
    if (!match) return;
    try {
      await matchService.update(match.id, {
        is_halftime: false,
        second_half_start: new Date().toISOString(),
      });
      await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to start second half", err);
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

  const calculateMatchTime = (m: Match, _tick?: number) => {
    if (m.status !== "live") return null;
    if (m.is_halftime) return "HT";

    // Second Half
    if (m.second_half_start) {
      const start = new Date(m.second_half_start).getTime();
      const now = new Date().getTime();
      const diffInMinutes = Math.floor((now - start) / 60000);
      return `${Math.min(90 + (m.additional_time_second_half || 0), 45 + diffInMinutes + 1)}'`;
    }

    // First Half
    if (m.first_half_start) {
      const start = new Date(m.first_half_start).getTime();
      const now = new Date().getTime();
      const diffInMinutes = Math.floor((now - start) / 60000);
      return `${Math.min(45 + (m.additional_time_first_half || 0), diffInMinutes + 1)}'`;
    }

    return "1'";
  };

  const isMatchLocked = (m: Match) => {
    if (m.status !== "finished" || !m.finished_at) return false;
    const finishTime = new Date(m.finished_at).getTime();
    const now = new Date().getTime();
    const oneHour = 60 * 60 * 1000;
    return now - finishTime > oneHour;
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
        assistant_id: goalData.assistant_id || undefined, // Added assistant_id
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

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    try {
      await cardService.create({
        match_id: match.id,
        team_id: cardData.team_id,
        player_id: cardData.player_id,
        minute: cardData.minute,
        type: cardData.type,
      });
      setShowCardModal(false);
      await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to add card", err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm("Delete this card?")) return;
    try {
      await cardService.delete(cardId);
      if (match) await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to delete card", err);
    }
  };

  const handleAddSubstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    try {
      await substitutionService.create({
        match_id: match.id,
        team_id: subData.team_id,
        player_in_id: subData.player_in_id,
        player_out_id: subData.player_out_id,
        minute: subData.minute,
      });
      setShowSubModal(false);
      await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to add substitution", err);
    }
  };

  const handleDeleteSubstitution = async (subId: string) => {
    if (!window.confirm("Delete this substitution?")) return;
    try {
      await substitutionService.delete(subId);
      if (match) await fetchMatch(match.id);
    } catch (err) {
      console.error("Failed to delete substitution", err);
    }
  };

  const getStatusBadge = (m: Match, _tick?: number) => {
    switch (m.status) {
      case "finished":
        return (
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest border border-slate-700">
            FT
          </span>
        );
      case "live":
        const timeDisplay = calculateMatchTime(m, _tick);
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
                disabled={isMatchLocked(match)}
              >
                <FiEdit2 className="mr-2" /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-secondary text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                disabled={isMatchLocked(match)}
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
                {match.team_a?.stadium && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="flex items-center gap-2">
                      <FiMapPin className="text-emerald-400" />
                      <span>{match.team_a.stadium}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
            <div>{getStatusBadge(match, tick)}</div>
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
                      const currentMinute = calculateMatchTime(match)?.replace(
                        "'",
                        "",
                      );
                      setGoalData({
                        match_id: match.id, // Ensure match_id is set
                        team_id: match.team_a_id,
                        player_id: "",
                        assistant_id: "", // Reset assistant_id
                        minute: currentMinute ? parseInt(currentMinute) : 1,
                        is_own_goal: false,
                      });
                      setShowGoalModal(true);
                    }}
                    className="btn btn-secondary flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  >
                    <FiPlus className="mr-2" /> Goal {match.team_a?.name}
                  </button>
                  <button
                    onClick={() => {
                      const currentMinute = calculateMatchTime(match)?.replace(
                        "'",
                        "",
                      );
                      setGoalData({
                        match_id: match.id, // Ensure match_id is set
                        team_id: match.team_b_id,
                        player_id: "",
                        assistant_id: "", // Reset assistant_id
                        minute: currentMinute ? parseInt(currentMinute) : 1,
                        is_own_goal: false,
                      });
                      setShowGoalModal(true);
                    }}
                    className="btn btn-secondary flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    disabled={isMatchLocked(match)}
                  >
                    <FiPlus className="mr-2" /> Goal {match.team_b?.name}
                  </button>
                </div>
                <button
                  onClick={
                    match.is_halftime ? handleStartSecondHalf : toggleHalftime
                  }
                  className={`btn w-full ${match.is_halftime ? "btn-primary bg-emerald-600 hover:bg-emerald-500" : "btn-secondary"}`}
                  disabled={isMatchLocked(match)}
                >
                  <FiClock className="mr-2" />{" "}
                  {match.is_halftime ? "Start 2nd Half" : "Set Half-Time (HT)"}
                </button>
                <button
                  onClick={handleFinishMatch}
                  className="btn btn-primary w-full bg-green-600 hover:bg-green-500"
                  disabled={isMatchLocked(match)}
                >
                  <FiCheckCircle className="mr-2" /> Finish Match
                </button>

                <div className="pt-2 flex flex-col gap-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                    Cards
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const currentMinute = calculateMatchTime(
                          match,
                        )?.replace("'", "");
                        setCardData({
                          ...cardData,
                          team_id: match.team_a_id,
                          minute: currentMinute ? parseInt(currentMinute) : 1,
                          type: "yellow",
                        });
                        setShowCardModal(true);
                      }}
                      className="btn btn-secondary border-amber-500/20 text-amber-500 hover:bg-amber-500/10 text-[10px] py-2 h-auto"
                      disabled={isMatchLocked(match)}
                    >
                      <div className="w-2 h-3 bg-amber-500 rounded-xs mr-2" />{" "}
                      {match.team_a?.name.split(" ")[0]}
                    </button>
                    <button
                      onClick={() => {
                        const currentMinute = calculateMatchTime(
                          match,
                        )?.replace("'", "");
                        setCardData({
                          ...cardData,
                          team_id: match.team_b_id,
                          minute: currentMinute ? parseInt(currentMinute) : 1,
                          type: "yellow",
                        });
                        setShowCardModal(true);
                      }}
                      className="btn btn-secondary border-amber-500/20 text-amber-500 hover:bg-amber-500/10 text-[10px] py-2 h-auto"
                      disabled={isMatchLocked(match)}
                    >
                      <div className="w-2 h-3 bg-amber-500 rounded-xs mr-2" />{" "}
                      {match.team_b?.name.split(" ")[0]}
                    </button>
                    <button
                      onClick={() => {
                        const currentMinute = calculateMatchTime(
                          match,
                        )?.replace("'", "");
                        setCardData({
                          ...cardData,
                          team_id: match.team_a_id,
                          minute: currentMinute ? parseInt(currentMinute) : 1,
                          type: "red",
                        });
                        setShowCardModal(true);
                      }}
                      className="btn btn-secondary border-red-500/20 text-red-500 hover:bg-red-500/10 text-[10px] py-2 h-auto"
                      disabled={isMatchLocked(match)}
                    >
                      <div className="w-2 h-3 bg-red-600 rounded-xs mr-2" />{" "}
                      {match.team_a?.name.split(" ")[0]}
                    </button>
                    <button
                      onClick={() => {
                        const currentMinute = calculateMatchTime(
                          match,
                        )?.replace("'", "");
                        setCardData({
                          ...cardData,
                          team_id: match.team_b_id,
                          minute: currentMinute ? parseInt(currentMinute) : 1,
                          type: "red",
                        });
                        setShowCardModal(true);
                      }}
                      className="btn btn-secondary border-red-500/20 text-red-500 hover:bg-red-500/10 text-[10px] py-2 h-auto"
                      disabled={isMatchLocked(match)}
                    >
                      <div className="w-2 h-3 bg-red-600 rounded-xs mr-2" />{" "}
                      {match.team_b?.name.split(" ")[0]}
                    </button>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Substitutions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const currentMinute = calculateMatchTime(
                            match,
                          )?.replace("'", "");
                          setSubData({
                            ...subData,
                            team_id: match.team_a_id,
                            player_in_id: "",
                            player_out_id: "",
                            minute: currentMinute ? parseInt(currentMinute) : 1,
                          });
                          setShowSubModal(true);
                        }}
                        className="btn btn-secondary border-blue-500/20 text-blue-500 hover:bg-blue-500/10 text-[10px] py-2 h-auto"
                        disabled={isMatchLocked(match)}
                      >
                        <FiRepeat className="mr-2" />{" "}
                        {match.team_a?.name.split(" ")[0]}
                      </button>
                      <button
                        onClick={() => {
                          const currentMinute = calculateMatchTime(
                            match,
                          )?.replace("'", "");
                          setSubData({
                            ...subData,
                            team_id: match.team_b_id,
                            player_in_id: "",
                            player_out_id: "",
                            minute: currentMinute ? parseInt(currentMinute) : 1,
                          });
                          setShowSubModal(true);
                        }}
                        className="btn btn-secondary border-blue-500/20 text-blue-500 hover:bg-blue-500/10 text-[10px] py-2 h-auto"
                        disabled={isMatchLocked(match)}
                      >
                        <FiRepeat className="mr-2" />{" "}
                        {match.team_b?.name.split(" ")[0]}
                      </button>
                    </div>
                  </div>
                </div>
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
            {match.team_a?.stadium ? (
              <span className="flex items-center gap-2">
                Hosted at{" "}
                <span className="text-white font-bold">
                  {match.team_a.stadium}
                </span>
              </span>
            ) : (
              "Venue information is not yet available for this match."
            )}
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
            {goals.length === 0 &&
            cards.length === 0 &&
            substitutions.length === 0 ? (
              <p className="text-slate-500 text-sm italic">
                No events recorded yet.
              </p>
            ) : (
              <div className="relative border-l-2 border-slate-800 ml-3 pl-6 space-y-6">
                {[
                  ...goals.map((g) => ({ ...g, event_type: "goal" as const })),
                  ...cards.map((c) => ({ ...c, event_type: "card" as const })),
                  ...substitutions.map((s) => ({
                    ...s,
                    event_type: "substitution" as const,
                  })),
                ]
                  .sort((a, b) => a.minute - b.minute)
                  .map((event) => (
                    <div key={event.id} className="relative">
                      <div
                        className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-slate-900 shadow-lg ${
                          event.event_type === "goal"
                            ? "bg-blue-600 shadow-blue-500/20"
                            : event.event_type === "card"
                              ? (event as CardEvent).type === "yellow"
                                ? "bg-amber-500 shadow-amber-500/20"
                                : "bg-red-600 shadow-red-500/20"
                              : "bg-emerald-500 shadow-emerald-500/20"
                        }`}
                      />
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-400 font-black text-xs">
                              {event.minute}'
                            </span>
                            {event.event_type === "goal" ? (
                              <>
                                <span className="text-white font-black text-sm uppercase">
                                  Goal
                                </span>
                                {(event as Goal).is_own_goal && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-black uppercase">
                                    OG
                                  </span>
                                )}
                              </>
                            ) : event.event_type === "card" ? (
                              <span
                                className={`font-black text-sm uppercase ${
                                  (event as CardEvent).type === "yellow"
                                    ? "text-amber-500"
                                    : "text-red-500"
                                }`}
                              >
                                {(event as CardEvent).type} Card
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-black text-sm uppercase">
                                Substitution
                              </span>
                            )}
                          </div>
                          {event.event_type === "goal" ? (
                            <p className="text-sm font-bold text-slate-200">
                              {(event as Goal).player?.name || "Unknown Player"}
                              {(event as Goal).assistant &&
                                !(event as Goal).is_own_goal && (
                                  <span className="text-xs font-normal text-slate-400 ml-2 italic">
                                    (Assist: {(event as Goal).assistant?.name})
                                  </span>
                                )}
                            </p>
                          ) : event.event_type === "card" ? (
                            <p className="text-sm font-bold text-slate-200">
                              {(event as CardEvent).player?.name ||
                                "Unknown Player"}
                            </p>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-emerald-500 uppercase">
                                  IN
                                </span>
                                <span className="text-sm font-bold text-emerald-400">
                                  {(event as Substitution).player_in?.name ||
                                    "Unknown"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-red-500 uppercase">
                                  OUT
                                </span>
                                <span className="text-sm font-bold text-red-400">
                                  {(event as Substitution).player_out?.name ||
                                    "Unknown"}
                                </span>
                              </div>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            {event.team_id === match.team_a_id
                              ? match.team_a?.name
                              : match.team_b?.name}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (event.event_type === "goal")
                              handleDeleteGoal(event.id);
                            else if (event.event_type === "card")
                              handleDeleteCard(event.id);
                            else handleDeleteSubstitution(event.id);
                          }}
                          className="p-2 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30"
                          disabled={isMatchLocked(match)}
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
                {!goalData.is_own_goal && (
                  <div>
                    <label className="label">Assisted By (Optional)</label>
                    <select
                      className="input h-12 appearance-none"
                      value={goalData.assistant_id}
                      onChange={(e) =>
                        setGoalData({
                          ...goalData,
                          assistant_id: e.target.value,
                        })
                      }
                    >
                      <option value="">No Assist</option>
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
                        .filter((p) => p.id !== goalData.player_id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.jersey_number}. {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Minute (Auto-calculated)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="input h-12 border-blue-500/30 focus:border-blue-500"
                      value={goalData.minute}
                      onChange={(e) =>
                        setGoalData({
                          ...goalData,
                          minute: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-[10px] text-blue-500/70 mt-1 font-bold">
                      Based on current match time
                    </p>
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

      {/* Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowCardModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                <div
                  className={`w-3 h-5 rounded-xs ${cardData.type === "yellow" ? "bg-amber-500" : "bg-red-600"}`}
                />
                Record {cardData.type} Card
              </h2>
              <form onSubmit={handleAddCard} className="space-y-6">
                <div>
                  <label className="label">
                    Player (
                    {cardData.team_id === match.team_a_id
                      ? match.team_a?.name
                      : match.team_b?.name}
                    )
                  </label>
                  <select
                    required
                    className="input h-12 appearance-none font-bold"
                    value={cardData.player_id}
                    onChange={(e) =>
                      setCardData({ ...cardData, player_id: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select Player
                    </option>
                    {(cardData.team_id === match.team_a_id
                      ? teamADetail
                      : teamBDetail
                    )?.roster.goalkeepers
                      .concat(
                        (cardData.team_id === match.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.defenders || [],
                        (cardData.team_id === match.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.midfielders || [],
                        (cardData.team_id === match.team_a_id
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
                      className="input h-12 border-blue-500/30 focus:border-blue-500"
                      value={cardData.minute}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          minute: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Card Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCardData({ ...cardData, type: "yellow" })
                        }
                        className={`h-12 rounded-xl border flex items-center justify-center transition-all ${cardData.type === "yellow" ? "bg-amber-500 border-amber-400 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.3)]" : "bg-slate-800 border-slate-700 text-slate-400 opacity-50"}`}
                      >
                        <div className="w-2 h-3 bg-current rounded-xs" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCardData({ ...cardData, type: "red" })
                        }
                        className={`h-12 rounded-xl border flex items-center justify-center transition-all ${cardData.type === "red" ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]" : "bg-slate-800 border-slate-700 text-slate-400 opacity-50"}`}
                      >
                        <div className="w-2 h-3 bg-current rounded-xs" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCardModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Record Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Substitution Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowSubModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                <FiRepeat className="text-emerald-400" />
                Record Substitution
              </h2>
              <form onSubmit={handleAddSubstitution} className="space-y-6">
                <div>
                  <label className="label">
                    Player Out (
                    {subData.team_id === match?.team_a_id
                      ? match?.team_a?.name
                      : match?.team_b?.name}
                    )
                  </label>
                  <select
                    required
                    className="input h-12 appearance-none font-bold"
                    value={subData.player_out_id}
                    onChange={(e) =>
                      setSubData({ ...subData, player_out_id: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select Player Going Off
                    </option>
                    {(subData.team_id === match?.team_a_id
                      ? teamADetail
                      : teamBDetail
                    )?.roster.goalkeepers
                      .concat(
                        (subData.team_id === match?.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.defenders || [],
                        (subData.team_id === match?.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.midfielders || [],
                        (subData.team_id === match?.team_a_id
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
                <div>
                  <label className="label">
                    Player In (
                    {subData.team_id === match?.team_a_id
                      ? match?.team_a?.name
                      : match?.team_b?.name}
                    )
                  </label>
                  <select
                    required
                    className="input h-12 appearance-none font-bold"
                    value={subData.player_in_id}
                    onChange={(e) =>
                      setSubData({ ...subData, player_in_id: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select Player Coming On
                    </option>
                    {(subData.team_id === match?.team_a_id
                      ? teamADetail
                      : teamBDetail
                    )?.roster.goalkeepers
                      .concat(
                        (subData.team_id === match?.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.defenders || [],
                        (subData.team_id === match?.team_a_id
                          ? teamADetail
                          : teamBDetail
                        )?.roster.midfielders || [],
                        (subData.team_id === match?.team_a_id
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
                <div>
                  <label className="label">Minute</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input h-12 border-blue-500/30 focus:border-blue-500"
                    value={subData.minute}
                    onChange={(e) =>
                      setSubData({
                        ...subData,
                        minute: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSubModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Record Substitution
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
