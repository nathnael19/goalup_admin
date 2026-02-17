import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FiAward,
  FiUsers,
  FiUser,
  FiTarget,
  FiActivity,
  FiZap,
  FiFileText,
  FiTrendingUp,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";

import {
  useNews,
  useMatches,
  usePlayers,
  useTeams,
  useTournaments,
} from "../hooks/useData";
import { auditLogService } from "../services/auditLogService";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { useAuth } from "../context/AuthContext";
import { UserRoles } from "../types";
import type { Match, News, Team, Player } from "../types";

// Sub-components
import { StatCard } from "../components/dashboard/StatCard";
import { AuditLogFeed } from "../components/dashboard/AuditLogFeed";
import { LiveMatchCard } from "../components/dashboard/LiveMatchCard";
import { NewsHighlight } from "../components/dashboard/NewsHighlight";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Queries
  const { data: tournaments = [], isLoading: loadingTournaments } =
    useTournaments();
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const { data: players = [], isLoading: loadingPlayers } = usePlayers();
  const { data: matches = [], isLoading: loadingMatches } = useMatches();
  const { data: news = [], isLoading: loadingNews } = useNews();

  const {
    data: auditLogs = [],
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => auditLogService.getLogs(6),
  });

  const loading =
    loadingTournaments ||
    loadingTeams ||
    loadingPlayers ||
    loadingMatches ||
    loadingNews ||
    loadingLogs;

  // Derived Statistics
  const stats = useMemo(() => {
    let coachPlayerCount = 0;
    let coachMatchCount = 0;
    let coachGoals = 0;
    let myTeam: Team | null = null;

    if (user?.role === UserRoles.COACH && user.team_id) {
      myTeam =
        teams.find((t: Team) => t.id.toString() === user.team_id?.toString()) ||
        null;

      const myPlayers = players.filter(
        (p: Player) => p.team_id.toString() === user.team_id?.toString(),
      );
      coachPlayerCount = myPlayers.length;
      coachGoals = myPlayers.reduce(
        (acc: number, p: Player) => acc + (p.goals || 0),
        0,
      );

      coachMatchCount = matches.filter(
        (m: Match) =>
          m.team_a_id.toString() === user.team_id?.toString() ||
          m.team_b_id.toString() === user.team_id?.toString(),
      ).length;
    }

    return {
      tournaments: tournaments.length,
      teams: teams.length,
      players: players.length,
      matches: matches.length,
      liveMatchesCount: matches.filter((m: Match) => m.status === "live")
        .length,
      myTeamPlayers: coachPlayerCount,
      myTeamMatches: coachMatchCount,
      myTeamGoals: coachGoals,
      myTeam,
      assignedMatches:
        user?.role === UserRoles.REFEREE
          ? matches.filter(
              (m: Match) => m.referee_id?.toString() === user.id?.toString(),
            ).length
          : 0,
      myArticles:
        user?.role === UserRoles.NEWS_REPORTER
          ? news.filter((n: News) => n.author_id === user.id).length
          : 0,
      totalNews: news.length,
    };
  }, [tournaments, teams, players, matches, news, user]);

  const liveMatches = useMemo(
    () => matches.filter((m: Match) => m.status === "live"),
    [matches],
  );

  const latestNews = useMemo(() => {
    return [...news]
      .sort(
        (a, b) =>
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime(),
      )
      .slice(0, 4);
  }, [news]);

  const activeTournaments = useMemo(
    () => tournaments.slice(0, 2),
    [tournaments],
  );

  const calculateTournamentProgress = (tournamentId: string) => {
    const tournamentMatches = matches.filter(
      (m) => m.tournament_id === tournamentId,
    );
    if (tournamentMatches.length === 0) return 0;
    const finishedMatches = tournamentMatches.filter(
      (m) => m.status === "finished",
    ).length;
    return Math.round((finishedMatches / tournamentMatches.length) * 100);
  };

  const getStatCards = () => {
    if (user?.role === UserRoles.COACH) {
      return [
        {
          label: "Squad Size",
          value: stats.myTeamPlayers,
          icon: FiUsers,
          color: "from-blue-500 to-blue-600",
          bg: "bg-blue-500/10",
          text: "text-blue-500",
        },
        {
          label: "Team Goals",
          value: stats.myTeamGoals,
          icon: FiTarget,
          color: "from-indigo-500 to-indigo-600",
          bg: "bg-indigo-500/10",
          text: "text-indigo-500",
        },
        {
          label: "Played Matches",
          value: stats.myTeamMatches,
          icon: FiActivity,
          color: "from-purple-500 to-purple-600",
          bg: "bg-purple-500/10",
          text: "text-purple-500",
        },
        {
          label: "Upcoming",
          value: matches.filter(
            (m) =>
              m.status === "scheduled" &&
              (m.team_a_id.toString() === user.team_id?.toString() ||
                m.team_b_id.toString() === user.team_id?.toString()),
          ).length,
          icon: FiClock,
          color: "from-slate-500 to-slate-600",
          bg: "bg-slate-500/10",
          text: "text-slate-400",
        },
      ];
    }
    if (user?.role === UserRoles.REFEREE) {
      return [
        {
          label: "Assignments",
          value: stats.assignedMatches,
          icon: FiTarget,
          color: "from-orange-500 to-orange-600",
          bg: "bg-orange-500/10",
          text: "text-orange-500",
        },
        {
          label: "Live Matches",
          value: stats.liveMatchesCount,
          icon: FiActivity,
          color: "from-red-500 to-red-600",
          bg: "bg-red-500/10",
          text: "text-red-500",
        },
      ];
    }
    if (user?.role === UserRoles.NEWS_REPORTER) {
      return [
        {
          label: "My Articles",
          value: stats.myArticles,
          icon: FiFileText,
          color: "from-indigo-500 to-indigo-600",
          bg: "bg-indigo-500/10",
          text: "text-indigo-500",
        },
        {
          label: "Global News",
          value: stats.totalNews,
          icon: FiZap,
          color: "from-blue-500 to-blue-600",
          bg: "bg-blue-500/10",
          text: "text-blue-500",
        },
      ];
    }
    return [
      {
        label: "Tournaments",
        value: stats.tournaments,
        icon: FiAward,
        color: "from-blue-500 to-blue-600",
        bg: "bg-blue-500/10",
        text: "text-blue-500",
      },
      {
        label: "Total Teams",
        value: stats.teams,
        icon: FiUsers,
        color: "from-indigo-500 to-indigo-600",
        bg: "bg-indigo-500/10",
        text: "text-indigo-500",
      },
      {
        label: "Registered Players",
        value: stats.players,
        icon: FiUser,
        color: "from-purple-500 to-purple-600",
        bg: "bg-purple-500/10",
        text: "text-purple-500",
      },
      {
        label: "Total Matches",
        value: stats.matches,
        icon: FiTarget,
        color: "from-slate-500 to-slate-600",
        bg: "bg-slate-500/10",
        text: "text-slate-400",
      },
    ];
  };

  const dashboardLabel = () => {
    if (user?.role === UserRoles.SUPER_ADMIN) return "League Command";
    if (user?.role === UserRoles.TOURNAMENT_ADMIN) return "Tournament Control";
    if (user?.role === UserRoles.COACH) return "Team HQ";
    if (user?.role === UserRoles.REFEREE) return "Official's Lounge";
    return "Member Dashboard";
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight font-display mb-2">
            {dashboardLabel()}{" "}
            <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">
              {user?.role === UserRoles.COACH ? stats.myTeam?.name : "Overview"}
            </span>
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            {user?.role === UserRoles.COACH
              ? `Manage your squad and track team performance.`
              : `A snapshot of your ${user?.role === UserRoles.REFEREE ? "officiating schedule" : "football ecosystem performance"}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchLogs()}
            className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all group"
          >
            <FiZap className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : getStatCards().map((stat, i) => (
              <StatCard key={i} {...stat} delay={i + 1} />
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        <div className="xl:col-span-8 space-y-8">
          <div className="flex items-center justify-between bg-white/2 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <h2 className="text-xl font-black text-white font-display flex items-center gap-3">
              <FiFileText className="text-blue-500" /> Latest Highlights
            </h2>
            <Link
              to="/news"
              className="text-xs font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group"
            >
              View All{" "}
              <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!loading &&
              latestNews.map((article, i) => (
                <NewsHighlight
                  key={article.id}
                  article={article}
                  index={i}
                  onClick={() => navigate("/news")}
                />
              ))}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-8">
          {/* Spotlight for Coach */}
          {user?.role === UserRoles.COACH && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/2 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white font-display flex items-center gap-3 uppercase tracking-tight">
                  <FiClock className="text-blue-500" /> Your Next Challenge
                </h2>
              </div>
              {(() => {
                const nextMatch = matches
                  .filter(
                    (m) =>
                      m.status === "scheduled" &&
                      (m.team_a_id === user.team_id ||
                        m.team_b_id === user.team_id),
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.start_time).getTime() -
                      new Date(b.start_time).getTime(),
                  )[0];

                if (!nextMatch)
                  return (
                    <div className="card p-8 text-center bg-slate-900/40 border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        No matches scheduled
                      </p>
                    </div>
                  );

                const opponent =
                  nextMatch.team_a_id === user.team_id
                    ? nextMatch.team_b
                    : nextMatch.team_a;
                return (
                  <div
                    onClick={() => navigate(`/matches/${nextMatch.id}`)}
                    className="card p-6 bg-linear-to-br from-blue-600/20 to-indigo-600/10 border-blue-500/30 cursor-pointer group hover:scale-[1.02] transition-transform"
                  >
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">
                      {new Date(nextMatch.start_time).toLocaleDateString(
                        undefined,
                        { weekday: "long", month: "short", day: "numeric" },
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black">
                          {stats.myTeam?.name.charAt(0)}
                        </div>
                        <span className="text-xs font-black text-white">
                          {stats.myTeam?.name}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-500 italic">
                        VS
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black">
                          {opponent?.name.charAt(0)}
                        </div>
                        <span className="text-xs font-black text-white">
                          {opponent?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Active Seasons Spotlight */}
          {(user?.role === UserRoles.SUPER_ADMIN ||
            user?.role === UserRoles.TOURNAMENT_ADMIN) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/2 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white font-display flex items-center gap-3 uppercase tracking-tight">
                  <FiTrendingUp className="text-purple-500" /> Active Seasons
                </h2>
              </div>
              <div className="card p-6 space-y-6 bg-slate-900/40 border-white/5">
                {!loading &&
                  activeTournaments.map((tour) => {
                    const progress = calculateTournamentProgress(tour.id);
                    return (
                      <div
                        key={tour.id}
                        className="space-y-3 group cursor-pointer"
                        onClick={() => navigate("/tournaments")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center text-xs font-black">
                              {tour.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                                {tour.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Season {tour.year}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-white">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-purple-600 to-indigo-500 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Live Pulse */}
          {(user?.role === UserRoles.SUPER_ADMIN ||
            user?.role === UserRoles.TOURNAMENT_ADMIN ||
            user?.role === UserRoles.COACH) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/2 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white font-display flex items-center gap-3 uppercase tracking-tight">
                  <FiActivity className="text-red-500" /> Live Pulse
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.length > 0 ? (
                  liveMatches.map((match) => (
                    <LiveMatchCard
                      key={match.id}
                      match={match}
                      onClick={() => navigate(`/matches/${match.id}`)}
                    />
                  ))
                ) : (
                  <div className="col-span-full card p-10 flex flex-col items-center justify-center gap-3 bg-slate-900/40 border-white/5 border-dashed">
                    <FiActivity className="text-slate-800" size={32} />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      No matches in progress
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <AuditLogFeed
            logs={auditLogs}
            loading={loadingLogs}
            onRefresh={refetchLogs}
          />
        </div>
      </div>
    </div>
  );
};
