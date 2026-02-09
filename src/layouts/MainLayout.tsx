import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiLogOut,
  FiMenu,
  FiHome,
  FiAward,
  FiUsers,
  FiUser,
  FiTarget,
  FiBarChart2,
} from "react-icons/fi";

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const menuItems = [
    { icon: FiHome, label: "Dashboard", path: "/" },
    { icon: FiAward, label: "Tournaments", path: "/tournaments" },
    { icon: FiUsers, label: "Teams", path: "/teams" },
    { icon: FiUser, label: "Players", path: "/players" },
    { icon: FiTarget, label: "Matches", path: "/matches" },
    { icon: FiBarChart2, label: "Standings", path: "/standings" },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] font-body text-slate-200">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-20"
        } bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 transition-all duration-500 flex flex-col z-20`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic">
                GU
              </div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase font-display">
                GoalUp!
              </h1>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <FiMenu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {sidebarOpen && (
                <span className="font-semibold tracking-wide">
                  {item.label}
                </span>
              )}
              {!sidebarOpen && (
                <div className="absolute left-20 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-slate-800/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
              {user?.full_name?.charAt(0) || "A"}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate leading-none mb-1">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-widest">
                  {user?.is_superuser ? "Super Admin" : "Editor"}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 font-bold text-sm"
          >
            <FiLogOut size={18} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#0f172a] relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] pointer-events-none" />

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
