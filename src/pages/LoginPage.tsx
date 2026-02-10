import React, { useState } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";

const loginSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>("");

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        setError("");
        await login(values.email, values.password);
        navigate("/");
      } catch (err: unknown) {
        let errorMsg = "Login failed. Please check your credentials.";
        if (err instanceof AxiosError && err.response?.data?.detail) {
          errorMsg = err.response.data.detail;
        }
        setError(errorMsg);
      }
    },
  });

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-400/5 blur-[100px] rounded-full" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <img
            src="/logo.png"
            alt="GoalUP Logo"
            className="h-20 mx-auto mb-6"
          />
          <h1 className="text-4xl font-black text-white mb-2 font-display tracking-tighter uppercase">
            GoalUP <span className="text-blue-500">Admin</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">
            Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-10 bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-[0_32px_128px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
          <h2 className="text-xl font-black text-white mb-8 border-b border-white/10 pb-4 tracking-tight relative z-10">
            System Access
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <FiAlertCircle
                className="text-red-500 mt-0.5 shrink-0"
                size={20}
              />
              <p className="text-red-400 text-xs font-bold leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="label">Operator Email</label>
              <div className="relative group">
                <FiMail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
                <input
                  id="email"
                  type="email"
                  {...formik.getFieldProps("email")}
                  className={`input pl-12 h-14 ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500/50 bg-red-500/5"
                      : ""
                  }`}
                  placeholder="admin@goalup.pro"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-2 text-[10px] font-black uppercase text-red-500 tracking-widest px-1">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="label">Security Token</label>
              <div className="relative group">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
                <input
                  id="password"
                  type="password"
                  {...formik.getFieldProps("password")}
                  className={`input pl-12 h-14 ${
                    formik.touched.password && formik.errors.password
                      ? "border-red-500/50 bg-red-500/5"
                      : ""
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-2 text-[10px] font-black uppercase text-red-500 tracking-widest px-1">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 relative z-10">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="btn btn-primary w-full h-14 text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
              >
                {formik.isSubmitting
                  ? "Authenticating..."
                  : "Establish Session"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
            GoalUp Platform / v1.0.4-stable
          </p>
        </div>
      </div>
    </div>
  );
};
