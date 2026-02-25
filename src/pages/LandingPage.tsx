import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiAward,
  FiUsers,
  FiCalendar,
  FiArrowRight,
  FiZap,
  FiBarChart2,
} from "react-icons/fi";

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <FiAward className="text-xl" />
            </div>
            <span className="text-2xl font-bold tracking-tight">GoalUP</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95"
            >
              Launch Tournament
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
            <FiZap /> Smart University Tournament System
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8">
            Organize. Schedule. <br />
            <span className="text-blue-500">Dominate Matchday.</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            A complete football tournament management platform built for
            universities and competitive leagues. From automated fixtures to
            real-time standings — everything in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-blue-600/40 flex items-center gap-2"
            >
              Get Started <FiArrowRight />
            </Link>

            <button className="px-8 py-4 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-2xl font-bold text-lg transition-all backdrop-blur-xl">
              View Live Demo
            </button>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="mt-20 bg-[#0f172a] border border-white/5 rounded-3xl p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <p className="text-slate-500 text-sm">Active Tournament</p>
                <h3 className="text-lg font-semibold">ASTU Inter-Dept Cup</h3>
              </div>
              <div>
                <p className="text-slate-500 text-sm">Next Match</p>
                <h3 className="text-lg font-semibold">CSE vs ME - 3:00 PM</h3>
              </div>
              <div>
                <p className="text-slate-500 text-sm">Total Teams</p>
                <h3 className="text-lg font-semibold">16 Registered</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FiCalendar />}
            title="Automated Fixture Scheduling"
            desc="Generate league or knockout fixtures instantly with smart pairing logic."
          />

          <FeatureCard
            icon={<FiUsers />}
            title="Team & Player Management"
            desc="Register teams, manage rosters, and track player statistics easily."
          />

          <FeatureCard
            icon={<FiBarChart2 />}
            title="Live Standings & Analytics"
            desc="Real-time leaderboard updates, goal tracking, and match reports."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-y border-white/5 bg-white/1 px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">How It Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Three simple steps to launch and manage your tournament.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <Step
            number="01"
            title="Create Tournament"
            desc="Define format, teams, and match rules."
          />
          <Step
            number="02"
            title="Generate Fixtures"
            desc="Automatic scheduling with conflict-free logic."
          />
          <Step
            number="03"
            title="Track & Analyze"
            desc="Update results and view standings instantly."
          />
        </div>
      </section>

      {/* CTA */}
      <footer className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-8">
            Ready to run your next tournament?
          </h2>
          <Link
            to="/login"
            className="px-12 py-5 bg-white text-black rounded-2xl font-bold text-xl hover:bg-slate-200 transition-all"
          >
            Start Managing Now
          </Link>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-all">
    <div className="text-blue-500 text-3xl mb-6">{icon}</div>
    <h3 className="text-xl font-bold mb-4">{title}</h3>
    <p className="text-slate-400">{desc}</p>
  </div>
);

const Step = ({ number, title, desc }: any) => (
  <div className="text-center">
    <div className="text-blue-500 text-sm font-bold mb-4">{number}</div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-slate-400">{desc}</p>
  </div>
);
