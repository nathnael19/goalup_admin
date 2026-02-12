import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAward,
  FiUsers,
  FiUser,
  FiTarget,
  FiPlus,
  FiActivity,
  FiZap,
  FiFileText,
  FiTrendingUp,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";
import { tournamentService } from "../services/tournamentService";
import { teamService } from "../services/teamService";
import { playerService } from "../services/playerService";
import { matchService } from "../services/matchService";
import { newsService } from "../services/newsService";
import { auditLogService, type AuditLog } from "../services/auditLogService";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { useAuth } from "../context/AuthContext";
import { UserRoles } from "../types";
import type { Match, News, Tournament, Team, Player } from "../types";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tournaments: 0,
    teams: 0,
    players: 0,
    matches: 0,
    liveMatchesCount: 0,
    myTeamPlayers: 0,
    myTeamMatches: 0,
    myTeamGoals: 0,
    assignedMatches: 0,
    myArticles: 0,
    totalNews: 0,
  });
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [latestNews, setLatestNews] = useState<News[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        tournamentsData,
        teamsData,
        playersData,
        matchesData,
        newsData,
        auditData,
      ] = await Promise.all([
        tournamentService.getAll(),
        teamService.getAll(),
        playerService.getAll(),
        matchService.getAll(),
        newsService.getAll(),
        auditLogService.getLogs(6),
      ]);

      setAuditLogs(auditData);

      setAllMatches(matchesData);
      setTeams(teamsData);
      setLiveMatches(matchesData.filter((m: Match) => m.status === "live"));

      const sortedNews = [...newsData].sort(
        (a: News, b: News) =>
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime(),
      );
      setLatestNews(sortedNews.slice(0, 4));

      // Active tournaments (simply taking first 2 for spotlight)
      setActiveTournaments(tournamentsData.slice(0, 2));

      // Role-specific data resolution
      let myTeamContext: Team | null = null;
      let coachPlayerCount = 0;
      let coachMatchCount = 0;
      let coachGoals = 0;

      if (user?.role === UserRoles.COACH && user.team_id) {
        myTeamContext =
          teamsData.find(
            (t: Team) => t.id.toString() === user.team_id?.toString(),
          ) || null;
        setMyTeam(myTeamContext);

        const myPlayers = playersData.filter(
          (p: Player) => p.team_id.toString() === user.team_id?.toString(),
        );
        coachPlayerCount = myPlayers.length;
        coachGoals = myPlayers.reduce(
          (acc: number, p: Player) => acc + (p.goals || 0),
          0,
        );

        coachMatchCount = matchesData.filter(
          (m: Match) =>
            m.team_a_id.toString() === user.team_id?.toString() ||
            m.team_b_id.toString() === user.team_id?.toString(),
        ).length;
      }
      setStats({
        tournaments: tournamentsData.length,
        teams: teamsData.length,
        players: playersData.length,
        matches: matchesData.length,
        liveMatchesCount: matchesData.filter((m: Match) => m.status === "live")
          .length,
        myTeamPlayers: coachPlayerCount,
        myTeamMatches: coachMatchCount,
        myTeamGoals: coachGoals,
        assignedMatches:
          user?.role === UserRoles.REFEREE
            ? matchesData.filter(
                (m: Match) => m.referee_id?.toString() === user.id?.toString(),
              ).length
            : 0,
        myArticles:
          user?.role === UserRoles.NEWS_REPORTER
            ? newsData.filter((n: News) => n.author_id === user.id).length
            : 0,
        totalNews: newsData.length,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTournamentProgress = (tournamentId: string) => {
    const tournamentMatches = allMatches.filter(
      (m: Match) => m.tournament_id === tournamentId,
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
          value: allMatches.filter(
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
              {user?.role === UserRoles.COACH ? myTeam?.name : "Overview"}
            </span>
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            {user?.role === UserRoles.COACH
              ? `Manage your squad and track team performance.`
              : `A snapshot of your ${user?.role === UserRoles.REFEREE ? "officiating schedule" : "football ecosystem performance"}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Role Access
            </span>
            <span className="text-xs font-bold text-blue-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {user?.role?.replace("_", " ") || "Member"}
            </span>
          </div>
          <button
            onClick={fetchStats}
            className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all group"
          >
            <FiZap className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Live Match Pulse - COOL SURPRISE #1 */}
      {!loading && liveMatches.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="p-1.5 rounded-lg bg-red-600/10 text-red-500">
              <FiActivity size={16} className="animate-pulse" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
              Match Pulse
            </h2>
            <div className="h-px flex-1 bg-linear-to-r from-red-500/20 to-transparent" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {liveMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => navigate(`/matches/${match.id}`)}
                className="flex-none w-72 card card-hover p-4 bg-linear-to-br from-slate-900/60 to-slate-800/40 border-red-500/20 border-l-2 border-l-red-500 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span className="text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />{" "}
                    Live
                  </span>
                  <span>{match.total_time}'</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black">
                      {teams
                        .find((t) => t.id === match.team_a_id)
                        ?.name.charAt(0) || "?"}
                    </div>
                    <span className="text-xs font-black truncate w-full text-center">
                      {teams.find((t) => t.id === match.team_a_id)?.name ||
                        "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
                    <span className="text-xl font-black text-white">
                      {match.score_a}
                    </span>
                    <span className="text-slate-600">-</span>
                    <span className="text-xl font-black text-white">
                      {match.score_b}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black">
                      {teams
                        .find((t) => t.id === match.team_b_id)
                        ?.name.charAt(0) || "?"}
                    </div>
                    <span className="text-xs font-black truncate w-full text-center">
                      {teams.find((t) => t.id === match.team_b_id)?.name ||
                        "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : getStatCards().map((stat, i) => (
              <div
                key={i}
                className={`card card-hover hover:border-${stat.text.split("-")[1]}-500/30 transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${i + 1}`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center shadow-inner`}
                    >
                      <stat.icon size={24} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      Active
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-tight mb-1">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-white font-display">
                      {stat.value}
                    </h3>
                  </div>
                </div>
                <div
                  className={`h-1.5 w-full bg-linear-to-r ${stat.color} opacity-20`}
                />
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: News Highlights - COOL SURPRISE #2 */}
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
                <div
                  key={article.id}
                  onClick={() => navigate("/news")}
                  className={`group relative card overflow-hidden bg-slate-900 border-white/5 card-hover cursor-pointer animate-in fade-in zoom-in-95 duration-700 animate-stagger-${i + 1}`}
                >
                  <div className="aspect-video w-full overflow-hidden relative">
                    {article.image_url ? (
                      <img
                        src={
                          article.image_url.startsWith("http")
                            ? article.image_url
                            : `http://localhost:8000${article.image_url}`
                        }
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                        alt={article.title}
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <FiFileText size={40} className="text-slate-700" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 relative">
                    <h4 className="text-lg font-black text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {article.content}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
                      <FiClock />{" "}
                      {new Date(article.created_at || "").toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Column: Spotlight & Actions */}
        <div className="xl:col-span-4 space-y-8">
          {/* Coach Specific: Next Match Spotlight */}
          {user?.role === UserRoles.COACH && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/2 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white font-display flex items-center gap-3 uppercase tracking-tight">
                  <FiClock className="text-blue-500" /> Your Next Challenge
                </h2>
              </div>
              {(() => {
                const nextMatch = allMatches
                  .filter(
                    (m) =>
                      m.status === "scheduled" &&
                      (m.team_a_id.toString() === user.team_id?.toString() ||
                        m.team_b_id.toString() === user.team_id?.toString()),
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

                const isTeamA =
                  nextMatch.team_a_id.toString() === user.team_id?.toString();
                const opponent = isTeamA ? nextMatch.team_b : nextMatch.team_a;

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
                          {myTeam?.name.charAt(0)}
                        </div>
                        <span className="text-xs font-black text-white">
                          {myTeam?.name}
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

          {/* Referee Specific: Upcoming Assignments */}
          {user?.role === UserRoles.REFEREE && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/2 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white font-display flex items-center gap-3 uppercase tracking-tight">
                  <FiClock className="text-orange-500" /> My Assignments
                </h2>
              </div>
              <div className="card p-6 space-y-4 bg-slate-900/40 border-white/5">
                {!loading &&
                  allMatches
                    .filter(
                      (m) => m.referee_id?.toString() === user.id?.toString(),
                    )
                    .slice(0, 3)
                    .map((match) => (
                      <div
                        key={match.id}
                        onClick={() => navigate(`/matches/${match.id}`)}
                        className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                            {match.status === "live" ? "Live Now" : "Upcoming"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {new Date(match.start_time).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white">
                            {match.team_a?.name} vs {match.team_b?.name}
                          </span>
                        </div>
                      </div>
                    ))}
                {allMatches.filter(
                  (m) => m.referee_id?.toString() === user.id?.toString(),
                ).length === 0 && (
                  <p className="text-center text-xs text-slate-500 py-4">
                    No matches assigned to you yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* News Reporter Specific: Media Hub Status */}
          {user?.role === UserRoles.NEWS_REPORTER && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/2 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white font-display flex items-center gap-3 uppercase tracking-tight">
                  <FiZap className="text-indigo-500" /> Media Hub
                </h2>
              </div>
              <div className="card p-6 bg-slate-900/40 border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-white">
                      {stats.myArticles}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Your Articles
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <FiFileText size={24} />
                  </div>
                </div>
                <button
                  onClick={() => navigate("/news")}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Create New News Article
                </button>
              </div>
            </div>
          )}

          {/* Tournament Progress spotlight - Mostly for Admins */}
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
                {activeTournaments.length === 0 && (
                  <p className="text-center text-xs text-slate-500 py-4">
                    No active tournaments spotlighted.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Live Pulse - Global overview for Admins and Coaches */}
          {(user?.role === UserRoles.SUPER_ADMIN ||
            user?.role === UserRoles.TOURNAMENT_ADMIN ||
            user?.role === UserRoles.COACH) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/2 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white font-display flex items-center gap-3 uppercase tracking-tight">
                  <FiActivity className="text-red-500" /> Live Pulse
                </h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {liveMatches.length} Matches Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.length > 0 ? (
                  liveMatches.map((match) => (
                    <div
                      key={match.id}
                      onClick={() => navigate(`/matches/${match.id}`)}
                      className="card p-5 bg-linear-to-br from-red-600/10 to-transparent border-red-500/20 group cursor-pointer hover:border-red-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Live
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {match.tournament?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black">
                            {match.team_a?.name.charAt(0)}
                          </div>
                          <span className="text-[10px] font-black text-white text-center line-clamp-1">
                            {match.team_a?.name}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xl font-black text-white font-mono tracking-tighter">
                            {match.score_a} - {match.score_b}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black">
                            {match.team_b?.name.charAt(0)}
                          </div>
                          <span className="text-[10px] font-black text-white text-center line-clamp-1">
                            {match.team_b?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full card p-10 flex flex-col items-center justify-center gap-3 bg-slate-900/40 border-white/5 border-dashed">
                    <FiActivity className="text-slate-800" size={32} />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      No matches currently in progress
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions Re-styled */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                Management Console
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {user?.role === UserRoles.COACH ? (
                <>
                  <Link
                    to="/players"
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiPlus />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      New Player
                    </span>
                  </Link>
                  <Link
                    to="/matches"
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all group text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiActivity />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Set Lineup
                    </span>
                  </Link>
                </>
              ) : user?.role === UserRoles.REFEREE ? (
                <>
                  <Link
                    to="/matches"
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-red-600/10 hover:border-red-500/30 transition-all group text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiActivity />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Live Desk
                    </span>
                  </Link>
                  <Link
                    to="/matches"
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiTarget />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Schedule
                    </span>
                  </Link>
                </>
              ) : user?.role === UserRoles.NEWS_REPORTER ? (
                <>
                  <Link
                    to="/news"
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all group text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiPlus />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      New Article
                    </span>
                  </Link>
                  <Link
                    to="/matches"
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-red-600/10 hover:border-red-500/30 transition-all group text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiActivity />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Match Pulse
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/tournaments"
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiPlus />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      New Event
                    </span>
                  </Link>
                  <Link
                    to="/matches"
                    className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-red-600/10 hover:border-red-500/30 transition-all group text-center flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiActivity />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Live Desk
                    </span>
                  </Link>
                </>
              )}
              <Link
                to={user?.role === UserRoles.COACH ? "/matches" : "/players"}
                className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all group text-center flex flex-col items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {user?.role === UserRoles.COACH ? <FiTarget /> : <FiUsers />}
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {user?.role === UserRoles.COACH ? "Schedule" : "Roster"}
                </span>
              </Link>
              <Link
                to="/news"
                className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all group text-center flex flex-col items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiFileText />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  Media
                </span>
              </Link>
            </div>
          </div>

          {/* Audit Log / Intelligence Feed - Restricted to Admin */}
          {(user?.role === UserRoles.SUPER_ADMIN ||
            user?.role === UserRoles.TOURNAMENT_ADMIN) && (
            <div className="card divide-y divide-white/5 bg-slate-900/40 border-white/5 overflow-hidden">
              <div className="p-4 bg-white/2 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FiActivity size={10} className="text-blue-500" />{" "}
                  Administrative Trail
                </div>
                {auditLogs.length > 0 && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10">
                    Live
                  </span>
                )}
              </div>
              {loading ? (
                <div className="p-10 flex flex-col items-center justify-center gap-3">
                  <FiZap className="text-slate-700 animate-pulse" size={20} />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Analyzing logs...
                  </span>
                </div>
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log) => {
                  const isDelete = log.action.includes("DELETE");
                  const isCreate =
                    log.action.includes("CREATE") || log.action.includes("ADD");
                  const isUpdate =
                    log.action.includes("UPDATE") || log.action.includes("SET");

                  return (
                    <div
                      key={log.id}
                      className="p-5 flex gap-4 hover:bg-white/2 transition-all group"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          isDelete
                            ? "bg-red-500"
                            : isCreate
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                        } ${isCreate || isUpdate ? "animate-pulse" : ""}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p
                            className={`text-xs font-black uppercase tracking-tight truncate ${
                              isDelete ? "text-red-400" : "text-white"
                            }`}
                          >
                            {log.action.replace("_", " ")}
                          </p>
                          <span className="text-[9px] font-bold text-slate-500 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 group-hover:text-slate-400 transition-colors">
                          {log.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    No activity recorded yet
                  </p>
                </div>
              )}
              {auditLogs.length > 0 && (
                <button
                  onClick={fetchStats}
                  className="w-full py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-white/2 transition-all flex items-center justify-center gap-2"
                >
                  <FiZap size={10} /> Refresh Feed
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
