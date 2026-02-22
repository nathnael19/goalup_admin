import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";
import axios from "axios";
import { API_BASE_URL } from "../services/api";

export const SetupPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await axios.post(`${API_BASE_URL}/auth/setup-password`, {
        token,
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to set password. The link may be expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 text-center">
          <FiAlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-black text-white mb-2">Invalid Link</h2>
          <p className="text-slate-400">
            This password setup link is invalid or missing a token.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-500">
          <FiCheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h2 className="text-2xl font-black text-white mb-2">Success!</h2>
          <p className="text-slate-400 mb-6">
            Your password has been set successfully. You can now log in.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn btn-primary w-full h-12 flex items-center justify-center gap-2"
          >
            Go to Login <FiArrowRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="card max-w-md w-full p-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4 border border-blue-500/20">
            <FiLock size={32} />
          </div>
          <h1 className="text-3xl font-black text-white font-display tracking-tight uppercase">
            Setup Password
          </h1>
          <p className="text-slate-400 mt-2">
            Set a secure password for your new account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-start gap-3">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label">New Password</label>
            <input
              required
              type="password"
              className="input h-12"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              required
              type="password"
              className="input h-12"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-12 font-black tracking-widest uppercase transition-all"
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
};
