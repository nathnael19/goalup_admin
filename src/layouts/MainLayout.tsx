import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(
    window.innerWidth > 1024,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { icon: FiHome, label: "Dashboard", path: "/" },
    { icon: FiAward, label: "Tournaments", path: "/tournaments" },
    { icon: FiUsers, label: "Teams", path: "/teams" },
    { icon: FiUser, label: "Players", path: "/players" },
    { icon: FiTarget, label: "Matches", path: "/matches" },
    { icon: FiBarChart2, label: "Standings", path: "/standings" },
  ];

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-[#0f172a] font-body text-slate-200 overflow-hidden">
      {/* Mobile Toggle & Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#020617]/80 backdrop-blur-xl border-b border-white/8 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic">
            GU
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter uppercase font-display">
            GoalUp!
          </h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <FiMenu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 lg:static transform ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${
          sidebarOpen ? "lg:w-72" : "lg:w-20"
        } w-72 bg-[#020617]/95 lg:bg-[#020617]/80 backdrop-blur-3xl border-r border-white/8 transition-all duration-500 flex flex-col z-50 lg:z-20 shadow-[8px_0_32px_rgba(0,0,0,0.5)]`}
      >
        <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
        {/* Logo */}
        <div className="h-20 hidden lg:flex items-center justify-between px-6 border-b border-slate-800">
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
        <nav className="flex-1 p-4 mt-16 lg:mt-0 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-500 group relative overflow-hidden ${
                  isActive
                    ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon size={20} className="shrink-0" />
              <span
                className={`font-semibold tracking-wide ${!sidebarOpen && "lg:hidden"}`}
              >
                {item.label}
              </span>
              {!sidebarOpen && (
                <div className="hidden lg:block absolute left-20 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
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
            <div className={`flex-1 min-w-0 ${!sidebarOpen && "lg:hidden"}`}>
              <p className="text-sm font-bold text-white truncate leading-none mb-1">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-widest">
                {user?.is_superuser ? "Super Admin" : "Editor"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-500 font-bold text-sm border border-red-500/20"
          >
            <FiLogOut size={18} />
            <span className={!sidebarOpen ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#020617] relative pt-16 lg:pt-0">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 blur-[150px] animate-pulse" />
        </div>

        <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
