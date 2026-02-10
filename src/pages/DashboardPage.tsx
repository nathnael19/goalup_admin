import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiAward,
  FiUsers,
  FiUser,
  FiTarget,
  FiPlus,
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiBarChart2,
} from "react-icons/fi";
import { tournamentService } from "../services/tournamentService";
import { teamService } from "../services/teamService";
import { playerService } from "../services/playerService";
import { matchService } from "../services/matchService";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    tournaments: 0,
    teams: 0,
    players: 0,
    matches: 0,
    liveMatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [tournaments, teams, players, matches] = await Promise.all([
        tournamentService.getAll(),
        teamService.getAll(),
        playerService.getAll(),
        matchService.getAll(),
      ]);

      setStats({
        tournaments: tournaments.length,
        teams: teams.length,
        players: players.length,
        matches: matches.length,
        liveMatches: matches.filter((m) => m.status === "live").length,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight font-display mb-2">
            Admin{" "}
            <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">
              Overview
            </span>
          </h1>
          <p className="text-slate-400 font-medium">
            Manage your football ecosystem with real-time analytics.
          </p>
        </div>
        {stats.liveMatches > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 font-bold text-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {stats.liveMatches} Match{stats.liveMatches > 1 ? "es" : ""} Live
            Now
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map((stat, i) => (
              <div
                key={i}
                className={`card card-hover animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                  i + 1
                }`}
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
                    <span className="text-xs text-green-500 font-bold">
                      +0%
                    </span>
                  </div>
                </div>
                <div
                  className={`h-1.5 w-full bg-linear-to-r ${stat.color} opacity-20`}
                />
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between bg-slate-800/20 p-4 rounded-2xl border border-slate-700/30">
            <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
              <FiActivity className="text-blue-500" /> Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/tournaments"
              className="card card-hover p-6 group animate-in fade-in slide-in-from-right-4 duration-700 animate-stagger-1"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  <FiPlus size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-0.5">
                    Start New Tournament
                  </h4>
                  <p className="text-xs text-slate-500">
                    Configure rounds, groups and rules.
                  </p>
                </div>
                <FiArrowRight className="text-slate-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/matches"
              className="card card-hover p-6 group animate-in fade-in slide-in-from-right-4 duration-700 animate-stagger-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-600/10 text-green-500 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-inner">
                  <FiActivity size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-0.5">
                    Live Match Center
                  </h4>
                  <p className="text-xs text-slate-500">
                    Update scores and manage match events.
                  </p>
                </div>
                <FiArrowRight className="text-slate-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/players"
              className="card card-hover p-6 group animate-in fade-in slide-in-from-right-4 duration-700 animate-stagger-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600/10 text-purple-500 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner">
                  <FiUsers size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-0.5">
                    Roster Management
                  </h4>
                  <p className="text-xs text-slate-500">
                    Add players and assign team roles.
                  </p>
                </div>
                <FiArrowRight className="text-slate-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/standings"
              className="card card-hover p-6 group animate-in fade-in slide-in-from-right-4 duration-700 animate-stagger-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-600/10 text-slate-400 flex items-center justify-center group-hover:bg-slate-600 group-hover:text-white transition-all shadow-inner">
                  <FiBarChart2 size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-0.5">Data Insights</h4>
                  <p className="text-xs text-slate-500">
                    View rankings and performance metrics.
                  </p>
                </div>
                <FiArrowRight className="text-slate-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* System Status / Recent Activity Placeholder */}
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-800/20 p-4 rounded-2xl border border-slate-700/30">
            <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
              <FiCalendar className="text-orange-500" /> Notifications
            </h2>
          </div>
          <div className="card divide-y divide-slate-700/50">
            <div className="p-4 flex gap-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">System Ready</p>
                <p className="text-xs text-slate-500">
                  All backend services are operational.
                </p>
                <span className="text-[10px] text-slate-600 font-bold uppercase mt-1 block">
                  Just Now
                </span>
              </div>
            </div>
            <div className="p-4 flex gap-4 opacity-50">
              <div className="w-2 h-2 rounded-full bg-slate-600 mt-2 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Backup Completed</p>
                <p className="text-xs text-slate-500">
                  Daily database snapshot successful.
                </p>
                <span className="text-[10px] text-slate-600 font-bold uppercase mt-1 block">
                  2 hours ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
