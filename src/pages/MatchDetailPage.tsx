import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiTrash2,
} from "react-icons/fi";
import { matchService } from "../services/matchService";
import type { Match, MatchStatus } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMatch(id);
    }
  }, [id]);

  const fetchMatch = async (matchId: string) => {
    try {
      setLoading(true);
      const data = await matchService.getById(matchId);
      setMatch(data);
    } catch (err) {
      console.error("Failed to fetch match details", err);
      // improved error handling could go here (e.g. redirect or toast)
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

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case "finished":
        return (
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest border border-slate-700">
            Finished
          </span>
        );
      case "live":
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
            Live
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
          <button
            onClick={handleDelete}
            className="btn btn-secondary text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          >
            <FiTrash2 className="mr-2" /> Delete
          </button>
          {/* Edit functionality could be added here or via the modal on MatchesPage. 
                For now, linking back to MatchesPage to edit is easiest, or we re-implement the modal here.
                Let's stick to simple display first. */}
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
                  <FiClock />
                  {new Date(match.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div>{getStatusBadge(match.status)}</div>
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
                <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-2xl">
                  {match.score_a}
                </span>
                <span className="text-4xl text-slate-700 font-black">:</span>
                <span className="text-6xl md:text-8xl font-black text-white font-display tracking-tighter tabular-nums drop-shadow-2xl">
                  {match.score_b}
                </span>
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

      {/* Additional Stats/Info (Placeholder for now) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <FiMapPin className="text-blue-500" /> Venue Information
          </h3>
          <p className="text-slate-400">
            Venue information is not yet available for this match.
            {/* Future: Add venue to Match model */}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-black text-white mb-4">Match Events</h3>
          <p className="text-slate-400">
            Live commentary and match events coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};
