import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiLock,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi";
import { apiClient } from "../services/api";

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from URL hash or query params
    // Supabase usually puts it in the hash like #access_token=...&type=recovery
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token") || params.get("code");
    
    if (accessToken) {
      setToken(accessToken);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/auth/reset-password", {
        token: token,
        new_password: password
      });
      setSuccess(true);
      localStorage.removeItem("access_token");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to reset password. The link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token && !success) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="glass-panel max-w-md w-full p-10 text-center border border-white/10">
          <FiAlertCircle className="mx-auto text-red-500 mb-6" size={48} />
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
            Access Restricted
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            This security channel is missing a valid verification token. Please
            request a new reset link from the recovery portal.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="btn btn-primary w-full h-12 text-xs font-black uppercase tracking-widest"
          >
            Go to Recovery
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="glass-panel max-w-md w-full p-10 text-center animate-in fade-in zoom-in duration-500 border border-white/10">
          <FiCheckCircle className="mx-auto text-green-500 mb-6" size={48} />
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
            Protocol Restored
          </h2>
          <p className="text-slate-400 text-sm mb-10 leading-relaxed">
            Your secure access credentials have been successfully updated. You
            may now re-establish a system session.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn btn-primary w-full h-12 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
          >
            Sign In Now <FiArrowRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-2 font-display tracking-tighter uppercase">
            GoalUP <span className="text-blue-500">Admin</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">
            Credential Reset
          </p>
        </div>

        <div className="glass-panel p-10 bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />

          <h2 className="text-xl font-black text-white mb-8 border-b border-white/10 pb-4 tracking-tight relative z-10">
            Set New Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs flex items-start gap-3">
                <FiAlertCircle className="mt-0.5 shrink-0" />
                <span className="font-bold">{error}</span>
              </div>
            )}

            <div>
              <label className="label">New Security Token</label>
              <div className="relative group">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
                <input
                  required
                  type="password"
                  className="input pl-12 h-14"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Confirm Token</label>
              <div className="relative group">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
                <input
                  required
                  type="password"
                  className="input pl-12 h-14"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-14 text-sm font-black uppercase tracking-widest shadow-lg transition-all"
            >
              {loading ? "Updating..." : "Confirm New Password"}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
              >
                Abort & Return to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
