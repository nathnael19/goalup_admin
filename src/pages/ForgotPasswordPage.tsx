import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { authService } from "../services/authService";

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Could not process request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-2 font-display tracking-tighter uppercase">
            GoalUP <span className="text-blue-500">Admin</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">
            Identity Recovery
          </p>
        </div>

        <div className="glass-panel p-10 bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />

          <h2 className="text-xl font-black text-white mb-6 border-b border-white/10 pb-4 tracking-tight relative z-10">
            Forgot Password
          </h2>

          {success ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto border border-green-500/20">
                <FiCheckCircle size={40} />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                We've sent a password reset link to{" "}
                <span className="text-white font-bold">{email}</span>. Please
                check your inbox.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary w-full h-12 text-xs font-black uppercase tracking-widest"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Enter your registered administrator email address and we'll send
                you a secure link to reset your account credentials.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <FiAlertCircle className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-400 text-xs font-bold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="label">Registered Email</label>
                  <div className="relative group">
                    <FiMail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
                      size={18}
                    />
                    <input
                      required
                      type="email"
                      className="input pl-12 h-14"
                      placeholder="admin@goalup.pro"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full h-14 text-sm font-black uppercase tracking-widest shadow-lg"
                >
                  {loading ? "Processing..." : "Send Reset Link"}
                </button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    <FiArrowLeft /> Back to login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
