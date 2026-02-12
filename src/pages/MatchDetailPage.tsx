import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiTrash2,
  FiEdit2,
  FiSave,
  FiX,
  FiPlay,
  FiCheckCircle,
  FiPlus,
  FiMinus,
  FiRepeat,
  FiAlertTriangle,
  FiZap,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { UserRoles } from "../types";
import { matchService } from "../services/matchService";
import { goalService } from "../services/goalService";
import { cardService } from "../services/cardService";
import { substitutionService } from "../services/substitutionService";
import { teamService } from "../services/teamService";
import { lineupService } from "../services/lineupService";
import { SERVER_URL } from "../services/api";
import type {
  Match,
  Goal,
  TeamDetail,
  CardEvent,
  CardType,
  Substitution,
  CreateGoalDto,
  MatchLineupDto,
} from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const MatchDetailPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<Partial<Match>>({});
  const [otherLegMatch, setOtherLegMatch] = useState<Match | null>(null);
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

  const [selectedLineupA, setSelectedLineupA] = useState<string[]>([]);
  const [selectedLineupB, setSelectedLineupB] = useState<string[]>([]);
  const [selectedBenchA, setSelectedBenchA] = useState<string[]>([]);
  const [selectedBenchB, setSelectedBenchB] = useState<string[]>([]);
  const [savingLineups, setSavingLineups] = useState(false);
  const [showLineupErrorModal, setShowLineupErrorModal] = useState(false);
  const [tick, setTick] = useState(0);

  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

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

      if (matchData.lineups) {
        setSelectedLineupA(
          matchData.lineups
            .filter((l) => l.team_id === matchData.team_a_id && l.is_starting)
            .map((l) => l.player_id),
        );
        setSelectedLineupB(
          matchData.lineups
            .filter((l) => l.team_id === matchData.team_b_id && l.is_starting)
            .map((l) => l.player_id),
        );
        setSelectedBenchA(
          matchData.lineups
            .filter((l) => l.team_id === matchData.team_a_id && !l.is_starting)
            .map((l) => l.player_id),
        );
        setSelectedBenchB(
          matchData.lineups
            .filter((l) => l.team_id === matchData.team_b_id && !l.is_starting)
            .map((l) => l.player_id),
        );
      }

      // Fetch team details for roster
      if (matchData.team_a_id && matchData.team_b_id) {
        const [a, b] = await Promise.all([
          teamService.getById(matchData.team_a_id),
          teamService.getById(matchData.team_b_id),
        ]);
        setTeamADetail(a as TeamDetail);
        setTeamBDetail(b as TeamDetail);
      }

      // Fetch other leg if it's a 2-legged knockout
      if (matchData.stage && matchData.tournament?.knockout_legs === 2) {
        const allMatches = await matchService.getAll({
          tournament_id: matchData.tournament_id,
        });
        const otherLeg = allMatches.find(
          (m) =>
            m.id !== matchId &&
            m.stage === matchData.stage &&
            ((m.team_a_id === matchData.team_a_id &&
              m.team_b_id === matchData.team_b_id) ||
              (m.team_a_id === matchData.team_b_id &&
                m.team_b_id === matchData.team_a_id)),
        );
        if (otherLeg) setOtherLegMatch(otherLeg);
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

    // Lineup validation
    if (selectedLineupA.length < 11 || selectedLineupB.length < 11) {
      setShowLineupErrorModal(true);
      return;
    }

    try {
      await matchService.update(match.id, {
        status: "live",
        first_half_start: new Date().toISOString(),
      });
      await fetchMatch(match.id);
    } catch (err: any) {
      console.error("Failed to start match", err);
      alert(err.response?.data?.detail || "Failed to start match");
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
    const currentScore = (editedMatch as any)[key] ?? 0;
    const newScore = Math.max(0, currentScore + delta);
    setEditedMatch({ ...editedMatch, [key]: newScore });
  };

  const handleSaveLineups = async () => {
    if (!match || !teamADetail || !teamBDetail) return;
    try {
      setSavingLineups(true);
      const payload: MatchLineupDto[] = [];

      if (user?.role !== UserRoles.COACH || user.team_id === match.team_a_id) {
        const lineupA: MatchLineupDto[] = teamADetail.roster.goalkeepers
          .concat(
            teamADetail.roster.defenders,
            teamADetail.roster.midfielders,
            teamADetail.roster.forwards,
          )
          .filter(
            (p) =>
              selectedLineupA.includes(p.id) || selectedBenchA.includes(p.id),
          )
          .map((p) => ({
            match_id: match.id,
            team_id: match.team_a_id,
            player_id: p.id,
            is_starting: selectedLineupA.includes(p.id),
          }));
        payload.push(...lineupA);
      }

      if (user?.role !== UserRoles.COACH || user.team_id === match.team_b_id) {
        const lineupB: MatchLineupDto[] = teamBDetail.roster.goalkeepers
          .concat(
            teamBDetail.roster.defenders,
            teamBDetail.roster.midfielders,
            teamBDetail.roster.forwards,
          )
          .filter(
            (p) =>
              selectedLineupB.includes(p.id) || selectedBenchB.includes(p.id),
          )
          .map((p) => ({
            match_id: match.id,
            team_id: match.team_b_id,
            player_id: p.id,
            is_starting: selectedLineupB.includes(p.id),
          }));
        payload.push(...lineupB);
      }

      await lineupService.setLineups(match.id, payload);
      await fetchMatch(match.id);
      alert("Lineups saved successfully!");
    } catch (err) {
      console.error("Failed to save lineups", err);
    } finally {
      setSavingLineups(false);
    }
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
            user?.role !== UserRoles.COACH && (
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
            )
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900/40 border border-white/5 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-700">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/20 to-slate-950/60" />
        </div>

        <div className="relative z-10 p-6 md:p-10">
          {/* Tournament & Status */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-blue-500/20">
                  {match.tournament?.name || "Tournament Match"}
                </span>
                {match.stage && (
                  <span className="px-3 py-1 bg-amber-600/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-amber-500/20">
                    {match.stage}
                  </span>
                )}
                <span className="px-3 py-1 bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-white/10">
                  Round {match.match_day}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-slate-400 text-xs font-bold justify-center md:justify-start opacity-70">
                <span className="flex items-center gap-2.5">
                  <FiCalendar className="text-blue-500" />
                  {new Date(match.start_time).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <span className="flex items-center gap-2.5">
                  <FiClock className="text-blue-500" />
                  {new Date(match.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {match.team_a?.stadium && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    <span className="text-slate-400">
                      {match.team_a.stadium}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="scale-110 drop-shadow-2xl">
              {getStatusBadge(match, tick)}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-8 group">
              <div className="relative">
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-slate-800/50 backdrop-blur-md p-1 border-4 border-white/5 shadow-2xl relative transition-transform duration-700 group-hover:scale-105"
                  style={{
                    boxShadow: `0 0 50px ${match.team_a?.color || "#3b82f6"}1a`,
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-3xl font-black text-white p-4">
                    {match.team_a?.logo_url ? (
                      <img
                        src={match.team_a.logo_url}
                        alt={match.team_a.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span>{match.team_a?.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-xl z-20"
                  style={{
                    backgroundColor: `${match.team_a?.color || "#3b82f6"}`,
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                  }}
                >
                  HOME
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl md:text-2xl font-black text-white font-display mb-2 drop-shadow-xl">
                  {match.team_a?.name}
                </h1>
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-white/10 rounded-full overflow-hidden"
                    >
                      <div className="w-full h-1/2 bg-blue-500/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LIVE SCORE */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-8 md:gap-14 bg-slate-950/40 px-6 py-4 rounded-[2.5rem] border border-white/10 shadow-inner">
                {isEditing ? (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => updateScore("a", 1)}
                      className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all hover:scale-110 shadow-lg shadow-blue-500/20"
                    >
                      <FiPlus size={24} />
                    </button>
                    <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                      {editedMatch.score_a ?? 0}
                    </span>
                    <button
                      onClick={() => updateScore("a", -1)}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all hover:scale-110"
                    >
                      <FiMinus size={24} />
                    </button>
                  </div>
                ) : (
                  <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {match.score_a}
                  </span>
                )}

                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl md:text-4xl text-slate-800 font-black animate-pulse">
                    :
                  </span>
                  {otherLegMatch && (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">
                        Agg:{" "}
                        {match.score_a +
                          (otherLegMatch.team_a_id === match.team_a_id
                            ? otherLegMatch.score_a
                            : otherLegMatch.score_b)}{" "}
                        -{" "}
                        {match.score_b +
                          (otherLegMatch.team_b_id === match.team_b_id
                            ? otherLegMatch.score_b
                            : otherLegMatch.score_a)}
                      </span>
                    </div>
                  )}
                  {(match.status === "live" || match.is_halftime) && (
                    <div className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-lg animate-pulse">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                        LIVE
                      </span>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => updateScore("b", 1)}
                      className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all hover:scale-110 shadow-lg shadow-blue-500/20"
                    >
                      <FiPlus size={24} />
                    </button>
                    <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                      {editedMatch.score_b ?? 0}
                    </span>
                    <button
                      onClick={() => updateScore("b", -1)}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all hover:scale-110"
                    >
                      <FiMinus size={24} />
                    </button>
                  </div>
                ) : (
                  <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {match.score_b}
                  </span>
                )}
              </div>

              {/* Halftime/FT info */}
              {!isEditing && match.status !== "scheduled" && (
                <div className="mt-6 flex flex-col items-center gap-1 opacity-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    {match.status === "finished"
                      ? "Full Time"
                      : match.is_halftime
                        ? "Halftime"
                        : "Match in Progress"}
                  </span>
                  {((match.penalty_score_a ?? 0) > 0 ||
                    (match.penalty_score_b ?? 0) > 0) && (
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest mt-2">
                      ({match.penalty_score_a} - {match.penalty_score_b} Pens)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-8 group">
              <div className="relative">
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-slate-800/50 backdrop-blur-md p-1 border-4 border-white/5 shadow-2xl relative transition-transform duration-700 group-hover:scale-105"
                  style={{
                    boxShadow: `0 0 50px ${match.team_b?.color || "#ef4444"}1a`,
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-3xl font-black text-white p-4">
                    {match.team_b?.logo_url ? (
                      <img
                        src={match.team_b.logo_url}
                        alt={match.team_b.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span>{match.team_b?.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-xl z-20"
                  style={{
                    backgroundColor: `${match.team_b?.color || "#ef4444"}`,
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                  }}
                >
                  AWAY
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl md:text-2xl font-black text-white font-display mb-2 drop-shadow-xl">
                  {match.team_b?.name}
                </h1>
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-white/10 rounded-full overflow-hidden"
                    >
                      <div className="w-full h-1/2 bg-red-500/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Management Center */}
      {user?.role !== UserRoles.COACH && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Controls Panel */}
          <div className="lg:col-span-2 card p-8 border-blue-500/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FiPlay size={120} className="rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    Match Command
                  </h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                    Surgical Live Operations
                  </p>
                </div>
                {match.status === "live" && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                    <FiClock className="text-blue-500 animate-spin-slow" />
                    <span className="text-xl font-black text-white tabular-nums">
                      {calculateMatchTime(match, tick)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {match.status === "scheduled" &&
                  user?.role !== UserRoles.COACH && (
                    <button
                      onClick={handleStartMatch}
                      className="w-full h-14 rounded-4xl bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <FiPlay size={24} /> Start Official Match
                    </button>
                  )}

                {match.status === "live" && user?.role !== UserRoles.COACH && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Goal Buttons */}
                    <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-3xl border border-white/5">
                      <button
                        onClick={() => {
                          const currentMinute = calculateMatchTime(
                            match,
                          )?.replace("'", "");
                          setGoalData({
                            match_id: match.id,
                            team_id: match.team_a_id,
                            player_id: "",
                            assistant_id: "",
                            minute: currentMinute ? parseInt(currentMinute) : 1,
                            is_own_goal: false,
                          });
                          setShowGoalModal(true);
                        }}
                        className="h-20 rounded-2xl bg-slate-800 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 flex flex-col items-center justify-center gap-2 transition-all group/btn"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center overflow-hidden border border-white/10 group-hover/btn:border-blue-500/50 transition-colors p-1.5">
                          {match.team_a?.logo_url ? (
                            <img
                              src={match.team_a.logo_url}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FiPlus
                              size={20}
                              className="text-blue-400 group-hover/btn:text-white"
                            />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Goal {match.team_a?.name.split(" ")[0]}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          const currentMinute = calculateMatchTime(
                            match,
                          )?.replace("'", "");
                          setGoalData({
                            match_id: match.id,
                            team_id: match.team_b_id,
                            player_id: "",
                            assistant_id: "",
                            minute: currentMinute ? parseInt(currentMinute) : 1,
                            is_own_goal: false,
                          });
                          setShowGoalModal(true);
                        }}
                        className="h-20 rounded-2xl bg-slate-800 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 flex flex-col items-center justify-center gap-2 transition-all group/btn"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center overflow-hidden border border-white/10 group-hover/btn:border-blue-500/50 transition-colors p-1.5">
                          {match.team_b?.logo_url ? (
                            <img
                              src={match.team_b.logo_url}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FiPlus
                              size={20}
                              className="text-blue-400 group-hover/btn:text-white"
                            />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Goal {match.team_b?.name.split(" ")[0]}
                        </span>
                      </button>
                    </div>

                    {/* Status & Secondary Actions */}
                    {user?.role !== UserRoles.COACH && (
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={
                            match.is_halftime
                              ? handleStartSecondHalf
                              : toggleHalftime
                          }
                          className={`h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${match.is_halftime ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"}`}
                        >
                          <FiClock size={18} />{" "}
                          {match.is_halftime
                            ? "Start 2nd Half"
                            : "Set Halftime (HT)"}
                        </button>
                        <button
                          onClick={handleFinishMatch}
                          className="h-14 rounded-2xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-red-500/20"
                        >
                          <FiCheckCircle size={18} /> Finish Match (FT)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Penalty Shootout Controls (Knockout only) */}
                {(match.status === "finished" || match.status === "live") &&
                  match.stage && (
                    <div className="p-6 bg-amber-600/5 rounded-3xl border border-amber-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest">
                          <FiZap /> Penalty Shootout
                        </div>
                        {isEditing && (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              className="w-12 h-8 bg-slate-900 border border-white/10 rounded-lg text-center text-xs font-black"
                              value={editedMatch.penalty_score_a || 0}
                              onChange={(e) =>
                                setEditedMatch({
                                  ...editedMatch,
                                  penalty_score_a:
                                    parseInt(e.target.value) || 0,
                                })
                              }
                            />
                            <span className="text-slate-500">-</span>
                            <input
                              type="number"
                              className="w-12 h-8 bg-slate-900 border border-white/10 rounded-lg text-center text-xs font-black"
                              value={editedMatch.penalty_score_b || 0}
                              onChange={(e) =>
                                setEditedMatch({
                                  ...editedMatch,
                                  penalty_score_b:
                                    parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="text-center text-lg font-black text-white">
                          {match.penalty_score_a} - {match.penalty_score_b}
                        </div>
                      )}
                    </div>
                  )}

                {/* Cards & Subs Row */}
                {match.status === "live" && user?.role !== UserRoles.COACH && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                    {[
                      {
                        teamId: match.team_a_id,
                        teamName: match.team_a?.name,
                        type: "yellow",
                        color: "amber",
                      },
                      {
                        teamId: match.team_b_id,
                        teamName: match.team_b?.name,
                        type: "yellow",
                        color: "amber",
                      },
                      {
                        teamId: match.team_a_id,
                        teamName: match.team_a?.name,
                        type: "red",
                        color: "red",
                      },
                      {
                        teamId: match.team_b_id,
                        teamName: match.team_b?.name,
                        type: "red",
                        color: "red",
                      },
                    ].map((card, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const currentMinute = calculateMatchTime(
                            match,
                          )?.replace("'", "");
                          setCardData({
                            ...cardData,
                            team_id: card.teamId,
                            minute: currentMinute ? parseInt(currentMinute) : 1,
                            type: card.type as CardType,
                          });
                          setShowCardModal(true);
                        }}
                        className={`h-12 rounded-xl flex items-center justify-center gap-2 border transition-all text-[10px] font-black uppercase tracking-widest ${card.color === "amber" ? "bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white" : "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"}`}
                      >
                        <div
                          className={`w-2 h-3 rounded-xs ${card.color === "amber" ? "bg-amber-500" : "bg-red-600"} group-hover:bg-white`}
                        />
                        {card.teamName?.split(" ")[0]}
                      </button>
                    ))}
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
                      className="col-span-1 md:col-span-2 h-12 rounded-xl bg-blue-600/5 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <FiRepeat size={14} /> Sub{" "}
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
                      className="col-span-1 md:col-span-2 h-12 rounded-xl bg-blue-600/5 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <FiRepeat size={14} /> Sub{" "}
                      {match.team_b?.name.split(" ")[0]}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
            {/* Match Settings Card */}
            <div className="card p-6 border-white/5 bg-slate-900/40 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Regulations
                </h3>
                <FiEdit2
                  size={14}
                  className="text-slate-500 cursor-pointer hover:text-white transition-colors"
                  onClick={() => setIsEditing(true)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Game Time
                  </span>
                  <span className="text-sm font-black text-white">
                    {match.total_time || 90} Min
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Added (1H)
                  </span>
                  <span className="text-sm font-black text-emerald-500">
                    +{match.additional_time_first_half || 0}m
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Added (2H)
                  </span>
                  <span className="text-sm font-black text-emerald-500">
                    +{match.additional_time_second_half || 0}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Interactive Match Timeline */}
        <div className="card p-8 border-white/5 bg-slate-900/40 backdrop-blur-xl group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Interactive Timeline
              </h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                Live Match Events
              </p>
            </div>
            {(match.status === "live" || match.status === "finished") && (
              <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  {match.status === "finished" ? "Final Log" : "Live Feed"}
                </span>
              </div>
            )}
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-4 bottom-4 w-px bg-linear-to-b from-blue-600/20 via-slate-700 to-blue-600/20" />

            <div className="space-y-8 relative z-10">
              {/* Start of Match Marker */}
              {match.status !== "scheduled" && (
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
                    <FiPlay size={16} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Match Kickoff
                  </span>
                </div>
              )}

              {/* Event Log */}
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
                  <div
                    key={event.id}
                    className="flex items-center gap-6 group/event"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover/event:scale-110 ${
                        event.event_type === "goal"
                          ? "bg-blue-600 text-white shadow-blue-500/20"
                          : event.event_type === "card"
                            ? (event as CardEvent).type === "yellow"
                              ? "bg-amber-500 text-slate-950 shadow-amber-500/20"
                              : "bg-red-600 text-white shadow-red-500/20"
                            : "bg-emerald-600 text-white shadow-emerald-500/20"
                      }`}
                    >
                      {event.event_type === "goal" ? (
                        <div className="font-black text-xs">
                          {event.minute}'
                        </div>
                      ) : event.event_type === "card" ? (
                        <div className="w-3 h-4 bg-current rounded-xs" />
                      ) : (
                        <FiRepeat size={18} />
                      )}
                    </div>

                    <div className="flex-1 p-5 rounded-4xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group-hover/event:border-white/10">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-5 h-5 rounded-md bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden p-0.5">
                              {event.team_id === match.team_a_id ? (
                                match.team_a?.logo_url ? (
                                  <img
                                    src={match.team_a.logo_url}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                )
                              ) : match.team_b?.logo_url ? (
                                <img
                                  src={match.team_b.logo_url}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                              )}
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/event:text-slate-300 transition-colors">
                              {event.event_type === "goal"
                                ? "Goal Scored"
                                : event.event_type === "card"
                                  ? `${(event as CardEvent).type.toUpperCase()} CARD`
                                  : "Tactical Change"}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <span className="text-xs font-black text-blue-500">
                              {event.minute}'
                            </span>
                          </div>

                          {event.event_type === "goal" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-white hover:text-blue-400 transition-colors cursor-pointer">
                                {(event as Goal).player?.name ||
                                  "Unknown Player"}
                              </span>
                              {(event as Goal).is_own_goal && (
                                <span className="px-2 py-0.5 bg-red-600/20 text-red-500 text-[8px] font-black uppercase rounded-lg border border-red-500/20">
                                  Own Goal
                                </span>
                              )}
                            </div>
                          ) : event.event_type === "card" ? (
                            <span className="text-lg font-black text-white">
                              {(event as CardEvent).player?.name}
                            </span>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-emerald-400">
                                {(event as Substitution).player_in?.name}
                              </span>
                              <FiArrowLeft
                                size={14}
                                className="text-slate-700 rotate-180"
                              />
                              <span className="text-lg font-black text-red-400/50">
                                {(event as Substitution).player_out?.name}
                              </span>
                            </div>
                          )}

                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
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
                          className="w-10 h-10 rounded-xl bg-red-600/5 text-red-500/30 hover:text-red-500 hover:bg-red-600/10 flex items-center justify-center transition-all opacity-0 group-hover/event:opacity-100"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* End of Match Marker */}
              {match.status === "finished" && (
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
                    <FiCheckCircle size={16} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Full Time whistle
                  </span>
                </div>
              )}

              {/* Empty State */}
              {goals.length === 0 &&
                cards.length === 0 &&
                substitutions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/2 border border-white/5 flex items-center justify-center text-slate-700 mb-4 scale-110">
                      <FiClock size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      No Events Recorded Yet
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      The timeline will update as match events occur
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Lineups View */}
      <div className="card p-8 md:p-12 border-white/5 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
              Tactical Analysis
            </h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              {user?.role === UserRoles.COACH
                ? "Manage Your Team's Starting XI"
                : "Starting XI Distribution"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveLineups}
              disabled={savingLineups || isMatchLocked(match!)}
              className="px-6 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-blue-500/20 disabled:opacity-30 transition-all active:scale-95"
            >
              {savingLineups ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSave size={16} />
              )}
              {savingLineups ? "Saving..." : "Save Decisions"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Pitch Visualization */}
          <div className="relative aspect-2/3 md:aspect-2/3 lg:aspect-2/3 bg-emerald-900/20 rounded-4xl border-4 border-white/5 overflow-hidden group shadow-2xl">
            {/* The Field */}
            <div className="absolute inset-0">
              {/* Grass Pattern */}
              <div className="absolute inset-0 grid grid-cols-6 border-x border-white/10">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${i % 2 === 0 ? "bg-emerald-500/5" : "bg-transparent"}`}
                  />
                ))}
              </div>
              {/* Field Markings */}
              <div className="absolute inset-[5%] border-2 border-white/20 rounded-lg">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-b-2 border-white/20" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-t-2 border-white/20" />
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
              </div>
            </div>

            {/* Players Overlay */}
            <div className="absolute inset-0 p-8 flex flex-col">
              {/* Away Team (Top Half Only) */}
              <div className="flex-1 flex flex-col justify-between pb-8">
                {/* GK */}
                <div className="flex justify-center">
                  {selectedLineupB
                    .map((pid) =>
                      [
                        ...(teamBDetail?.roster.goalkeepers || []),
                        ...(teamBDetail?.roster.defenders || []),
                        ...(teamBDetail?.roster.midfielders || []),
                        ...(teamBDetail?.roster.forwards || []),
                      ].find((p) => p.id === pid),
                    )
                    .filter((p) => p?.position === "gk")
                    .slice(0, 1)
                    .map((p) => (
                      <div
                        key={p?.id}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-12 h-12 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center overflow-hidden">
                          {p?.image_url ? (
                            <img
                              src={getImageUrl(p.image_url)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-black text-white">
                              {p?.jersey_number || "GK"}
                            </span>
                          )}
                        </div>
                        <span className="text-[7px] font-black text-white uppercase whitespace-nowrap bg-black/40 px-2 py-0.5 rounded-xs">
                          {p?.name.split(" ").pop()}
                        </span>
                      </div>
                    ))}
                </div>
                {/* DEF */}
                <div className="flex justify-around px-2">
                  {selectedLineupB
                    .map((pid) =>
                      [
                        ...(teamBDetail?.roster.goalkeepers || []),
                        ...(teamBDetail?.roster.defenders || []),
                        ...(teamBDetail?.roster.midfielders || []),
                        ...(teamBDetail?.roster.forwards || []),
                      ].find((p) => p.id === pid),
                    )
                    .filter((p) =>
                      ["cb", "lb", "rb", "def"].includes(p?.position || ""),
                    )
                    .map((p) => (
                      <div
                        key={p?.id}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-500 border-2 border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
                          {p?.image_url ? (
                            <img
                              src={getImageUrl(p.image_url)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black text-white">
                              {p?.jersey_number}
                            </span>
                          )}
                        </div>
                        <span className="text-[6px] font-black text-white uppercase whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-xs">
                          {p?.name.split(" ").pop()}
                        </span>
                      </div>
                    ))}
                </div>
                {/* MID */}
                <div className="flex justify-around px-8">
                  {selectedLineupB
                    .map((pid) =>
                      [
                        ...(teamBDetail?.roster.goalkeepers || []),
                        ...(teamBDetail?.roster.defenders || []),
                        ...(teamBDetail?.roster.midfielders || []),
                        ...(teamBDetail?.roster.forwards || []),
                      ].find((p) => p.id === pid),
                    )
                    .filter((p) =>
                      ["mid", "cm", "cdm", "cam", "lm", "rm"].includes(
                        p?.position || "",
                      ),
                    )
                    .map((p) => (
                      <div
                        key={p?.id}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-500/80 border-2 border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
                          {p?.image_url ? (
                            <img
                              src={getImageUrl(p.image_url)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black text-white">
                              {p?.jersey_number}
                            </span>
                          )}
                        </div>
                        <span className="text-[6px] font-black text-white uppercase whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-xs">
                          {p?.name.split(" ").pop()}
                        </span>
                      </div>
                    ))}
                </div>
                {/* FWD */}
                <div className="flex justify-center gap-6">
                  {selectedLineupB
                    .map((pid) =>
                      [
                        ...(teamBDetail?.roster.goalkeepers || []),
                        ...(teamBDetail?.roster.defenders || []),
                        ...(teamBDetail?.roster.midfielders || []),
                        ...(teamBDetail?.roster.forwards || []),
                      ].find((p) => p.id === pid),
                    )
                    .filter((p) =>
                      ["fwd", "st", "lw", "rw", "cf"].includes(
                        p?.position || "",
                      ),
                    )
                    .map((p) => (
                      <div
                        key={p?.id}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-400 border-2 border-white/40 shadow-xl flex items-center justify-center overflow-hidden">
                          {p?.image_url ? (
                            <img
                              src={getImageUrl(p.image_url)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[11px] font-black text-white">
                              {p?.jersey_number}
                            </span>
                          )}
                        </div>
                        <span className="text-[7px] font-black text-white uppercase whitespace-nowrap bg-black/40 px-2 py-0.5 rounded-xs">
                          {p?.name.split(" ").pop()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Home Team (Bottom Half Only) */}
              <div className="flex-1 flex flex-col-reverse justify-between pt-8">
                {/* GK */}
                <div className="flex justify-center">
                  {selectedLineupA
                    .map((pid) =>
                      [
                        ...(teamADetail?.roster.goalkeepers || []),
                        ...(teamADetail?.roster.defenders || []),
                        ...(teamADetail?.roster.midfielders || []),
                        ...(teamADetail?.roster.forwards || []),
                      ].find((p) => p.id === pid),
                    )
                    .filter((p) => p?.position === "gk")
                    .slice(0, 1)
                    .map((p) => (
                      <div
                        key={p?.id}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center overflow-hidden">
                          {p?.image_url ? (
                            <img
                              src={getImageUrl(p.image_url)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-black text-white">
                              {p?.jersey_number || "GK"}
                            </span>
                          )}
                        </div>
                        <span className="text-[7px] font-black text-white uppercase whitespace-nowrap bg-black/40 px-2 py-0.5 rounded-xs">
                          {p?.name.split(" ").pop()}
                        </span>
                      </div>
                    ))}
                </div>
                {/* DEF */}
                <div className="flex justify-around px-2">
                  {selectedLineupA
                    .map((pid) =>
                      [
                        ...(teamADetail?.roster.goalkeepers || []),
                        ...(teamADetail?.roster.defenders || []),
                        ...(teamADetail?.roster.midfielders || []),
                        ...(teamADetail?.roster.forwards || []),
                      ].find((p) => p.id === pid),
                    )
                    .filter((p) =>
                      ["cb", "lb", "rb", "def"].includes(p?.position || ""),
                    )
                    .map((p) => (
                      <div
                        key={p?.id}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
                          {p?.image_url ? (
                            <img
                              src={getImageUrl(p.image_url)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black text-white">
                              {p?.jersey_number}
                            </span>
                          )}
                        </div>
                        <span className="text-[6px] font-black text-white uppercase whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-xs">
                          {p?.name.split(" ").pop()}
                        </span>
                      </div>
                    ))}
                </div>
                {/* MID */}
                <div className="flex justify-around px-8">
                  {selectedLineupA
                    .map((pid) =>
                      [
                        ...(teamADetail?.roster.goalkeepers || []),
                        ...(teamADetail?.roster.defenders || []),
                        ...(teamADetail?.roster.midfielders || []),
                        ...(teamADetail?.roster.forwards || []),
                      ].find((p) => p.id === pid),
                    )
                    .filter((p) =>
                      ["mid", "cm", "cdm", "cam", "lm", "rm"].includes(
                        p?.position || "",
                      ),
                    )
                    .map((p) => (
                      <div
                        key={p?.id}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/80 border-2 border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
                          {p?.image_url ? (
                            <img
                              src={p.image_url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black text-white">
                              {p?.jersey_number}
                            </span>
                          )}
                        </div>
                        <span className="text-[6px] font-black text-white uppercase whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-xs">
                          {p?.name.split(" ").pop()}
                        </span>
                      </div>
                    ))}
                </div>
                {/* FWD */}
                <div className="flex justify-center gap-6">
                  {selectedLineupA
                    .map((pid) =>
                      [
                        ...(teamADetail?.roster.goalkeepers || []),
                        ...(teamADetail?.roster.defenders || []),
                        ...(teamADetail?.roster.midfielders || []),
                        ...(teamADetail?.roster.forwards || []),
                      ].find((p) => p.id === pid),
                    )
                    .filter((p) =>
                      ["fwd", "st", "lw", "rw", "cf"].includes(
                        p?.position || "",
                      ),
                    )
                    .map((p) => (
                      <div
                        key={p?.id}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-white/40 shadow-xl flex items-center justify-center overflow-hidden">
                          {p?.image_url ? (
                            <img
                              src={p.image_url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[11px] font-black text-white">
                              {p?.jersey_number}
                            </span>
                          )}
                        </div>
                        <span className="text-[7px] font-black text-white uppercase whitespace-nowrap bg-black/40 px-2 py-0.5 rounded-xs">
                          {p?.name.split(" ").pop()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                Live Tactical Visualization
              </p>
            </div>
          </div>

          {/* Lineup Management Lists */}
          <div className="space-y-12">
            {[
              {
                team: match.team_a,
                selected: selectedLineupA,
                setSelected: setSelectedLineupA,
                bench: selectedBenchA,
                setBench: setSelectedBenchA,
                detail: teamADetail,
                color: "blue",
              },
              {
                team: match.team_b,
                selected: selectedLineupB,
                setSelected: setSelectedLineupB,
                bench: selectedBenchB,
                setBench: setSelectedBenchB,
                detail: teamBDetail,
                color: "red",
              },
            ].map((cfg, i) => (
              <div key={i} className="space-y-6">
                {(user?.role !== UserRoles.COACH ||
                  user.team_id === cfg.team?.id) && (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 overflow-hidden p-1 flex items-center justify-center">
                          {cfg.team?.logo_url ? (
                            <img
                              src={getImageUrl(cfg.team.logo_url)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div
                              className={`w-2 h-2 rounded-full ${cfg.color === "blue" ? "bg-blue-600" : "bg-red-600"}`}
                            />
                          )}
                        </div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">
                          {cfg.team?.name} XI
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-extra-black uppercase tracking-widest px-3 py-1 rounded-lg ${cfg.selected.length >= 11 ? "bg-emerald-600/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-600/10 text-amber-500 border border-amber-500/20"}`}
                      >
                        {cfg.selected.length}/11 Selected
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "GK", key: "goalkeepers" },
                        { label: "DEF", key: "defenders" },
                        { label: "MID", key: "midfielders" },
                        { label: "FWD", key: "forwards" },
                      ].map((pos) => (
                        <div
                          key={pos.key}
                          className="p-4 rounded-3xl bg-white/2 border border-white/5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {pos.label}
                            </span>
                          </div>
                          <select
                            className="w-full bg-transparent text-xs font-bold text-white outline-hidden cursor-pointer hover:text-blue-400 transition-colors"
                            onChange={(e) => {
                              const player = cfg.detail?.roster[
                                pos.key as keyof typeof cfg.detail.roster
                              ].find((p) => p.id === e.target.value);
                              if (player)
                                cfg.setSelected([...cfg.selected, player.id]);
                              e.target.value = "";
                            }}
                          >
                            <option value="" className="bg-slate-900">
                              Add Player...
                            </option>
                            {cfg.detail?.roster[
                              pos.key as keyof typeof cfg.detail.roster
                            ]
                              .filter(
                                (p) =>
                                  !cfg.selected.includes(p.id) &&
                                  !cfg.bench.includes(p.id),
                              )
                              .map((p) => (
                                <option
                                  key={p.id}
                                  value={p.id}
                                  className="bg-slate-900"
                                >
                                  #{p.jersey_number} {p.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Selected Pills */}
                    <div className="flex flex-wrap gap-2">
                      {cfg.selected.map((pid) => {
                        const p = [
                          ...(cfg.detail?.roster.goalkeepers || []),
                          ...(cfg.detail?.roster.defenders || []),
                          ...(cfg.detail?.roster.midfielders || []),
                          ...(cfg.detail?.roster.forwards || []),
                        ].find((player) => player.id === pid);
                        return (
                          <div
                            key={pid}
                            className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-slate-800 border border-white/5 rounded-xl hover:border-red-500/50 transition-all cursor-default shadow-lg group"
                          >
                            <span className="text-xs font-black text-white">
                              {p?.name.split(" ").pop()}
                            </span>
                            <button
                              onClick={() =>
                                cfg.setSelected(
                                  cfg.selected.filter((id) => id !== pid),
                                )
                              }
                              className="w-5 h-5 rounded-lg bg-red-600/10 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                            >
                              <FiX size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bench Selection */}
                    <div className="pt-8 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiUsers className="text-slate-500" size={14} />
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Substitutes (Bench)
                          </h5>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500">
                          {cfg.bench.length} Selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-3xl bg-white/2 border border-white/5 space-y-3">
                          <select
                            className="w-full bg-transparent text-xs font-bold text-white outline-hidden cursor-pointer hover:text-emerald-400 transition-colors"
                            onChange={(e) => {
                              const player = [
                                ...(cfg.detail?.roster.goalkeepers || []),
                                ...(cfg.detail?.roster.defenders || []),
                                ...(cfg.detail?.roster.midfielders || []),
                                ...(cfg.detail?.roster.forwards || []),
                              ].find((p) => p.id === e.target.value);
                              if (player)
                                cfg.setBench([...cfg.bench, player.id]);
                              e.target.value = "";
                            }}
                          >
                            <option value="" className="bg-slate-900">
                              Add Bench Player...
                            </option>
                            {[
                              ...(cfg.detail?.roster.goalkeepers || []),
                              ...(cfg.detail?.roster.defenders || []),
                              ...(cfg.detail?.roster.midfielders || []),
                              ...(cfg.detail?.roster.forwards || []),
                            ]
                              .filter(
                                (p) =>
                                  !cfg.selected.includes(p.id) &&
                                  !cfg.bench.includes(p.id),
                              )
                              .map((p) => (
                                <option
                                  key={p.id}
                                  value={p.id}
                                  className="bg-slate-900"
                                >
                                  #{p.jersey_number} {p.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {cfg.bench.map((pid) => {
                          const p = [
                            ...(cfg.detail?.roster.goalkeepers || []),
                            ...(cfg.detail?.roster.defenders || []),
                            ...(cfg.detail?.roster.midfielders || []),
                            ...(cfg.detail?.roster.forwards || []),
                          ].find((player) => player.id === pid);
                          return (
                            <div
                              key={pid}
                              className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded-xl hover:border-emerald-500/50 transition-all cursor-default shadow-lg group"
                            >
                              <span className="text-xs font-black text-emerald-500 uppercase tracking-tight">
                                {p?.name.split(" ").pop()}
                              </span>
                              <button
                                onClick={() =>
                                  cfg.setBench(
                                    cfg.bench.filter((id) => id !== pid),
                                  )
                                }
                                className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                              >
                                <FiX size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center overflow-hidden p-1.5 shadow-lg">
                  {(goalData.team_id === match.team_a_id
                    ? match.team_a
                    : match.team_b
                  )?.logo_url ? (
                    <img
                      src={
                        (goalData.team_id === match.team_a_id
                          ? match.team_a
                          : match.team_b
                        )?.logo_url
                      }
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full ${goalData.team_id === match.team_a_id ? "bg-blue-500" : "bg-red-500"}`}
                    />
                  )}
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Record Goal
                </h2>
              </div>
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <div
                    className={`w-3 h-5 rounded-xs ${cardData.type === "yellow" ? "bg-amber-500" : "bg-red-600"}`}
                  />
                  Record {cardData.type} Card
                </h2>
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden p-1.5 shadow-lg">
                  {(cardData.team_id === match.team_a_id
                    ? match.team_a
                    : match.team_b
                  )?.logo_url ? (
                    <img
                      src={
                        (cardData.team_id === match.team_a_id
                          ? match.team_a
                          : match.team_b
                        )?.logo_url
                      }
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full ${cardData.team_id === match.team_a_id ? "bg-blue-500" : "bg-red-500"}`}
                    />
                  )}
                </div>
              </div>
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <FiRepeat className="text-emerald-400" />
                  Record Substitution
                </h2>
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden p-1.5 shadow-lg">
                  {(subData.team_id === match?.team_a_id
                    ? match?.team_a
                    : match?.team_b
                  )?.logo_url ? (
                    <img
                      src={
                        (subData.team_id === match?.team_a_id
                          ? match?.team_a
                          : match?.team_b
                        )?.logo_url
                      }
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full ${subData.team_id === match?.team_a_id ? "bg-blue-500" : "bg-red-500"}`}
                    />
                  )}
                </div>
              </div>
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
      {/* Lineup Error Modal */}
      {showLineupErrorModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setShowLineupErrorModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/50 backdrop-blur-3xl border border-red-500/20 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-amber-500 to-red-600" />
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <FiAlertTriangle className="text-4xl text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                Incomplete Lineups
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Standard match regulations require both teams to have at least{" "}
                <span className="text-white font-bold">
                  11 starting players
                </span>{" "}
                before kickoff.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden p-1.5 shadow-lg">
                    {match?.team_a?.logo_url ? (
                      <img
                        src={match.team_a.logo_url}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      {match?.team_a?.name}
                    </p>
                    <p
                      className={`text-2xl font-black ${selectedLineupA.length < 11 ? "text-red-500" : "text-emerald-500"}`}
                    >
                      {selectedLineupA.length}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden p-1.5 shadow-lg">
                    {match?.team_b?.logo_url ? (
                      <img
                        src={match.team_b.logo_url}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      {match?.team_b?.name}
                    </p>
                    <p
                      className={`text-2xl font-black ${selectedLineupB.length < 11 ? "text-red-500" : "text-emerald-500"}`}
                    >
                      {selectedLineupB.length}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowLineupErrorModal(false)}
                className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
