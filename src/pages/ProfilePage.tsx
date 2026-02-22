import React, { useState } from "react";
import { FiUser, FiMail, FiKey, FiSave } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { Toast } from "../components/Toast";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await authService.updateProfile(updateData);
      setToast({ message: "Profile updated successfully!", type: "success" });
      setFormData({ ...formData, password: "" }); // Clear password after update
    } catch (err: any) {
      console.error(err);
      setToast({
        message: err.response?.data?.detail || "Failed to update profile",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-12">
        <h1 className="text-4xl font-black text-white font-display tracking-tight">
          My Profile
        </h1>
        <p className="text-slate-400 font-medium font-body mt-1">
          Manage your personal information and security.
        </p>
      </div>

      <div className="card p-8 bg-slate-800/40 backdrop-blur-md border-slate-700/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="label text-slate-300 font-bold uppercase tracking-wider text-xs">
              Full Name
            </label>
            <div className="relative group">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                required
                type="text"
                className="input pl-12 h-14 bg-slate-900/50"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="label text-slate-300 font-bold uppercase tracking-wider text-xs">
              Email Address
            </label>
            <div className="relative group">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                required
                type="email"
                className="input pl-12 h-14 bg-slate-900/50"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-700/50">
            <label className="label text-slate-300 font-bold uppercase tracking-wider text-xs flex justify-between">
              <span>Security</span>
              <span className="text-slate-500 normal-case font-medium">
                Leave blank to keep current password
              </span>
            </label>
            <div className="relative group">
              <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                className="input pl-12 h-14 bg-slate-900/50"
                placeholder="New Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={loading}
              type="submit"
              className="btn btn-primary w-full h-14 text-lg gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave size={20} />
                  Update Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
