import React, { useState, useRef } from "react";
import {
  FiUser,
  FiMail,
  FiKey,
  FiSave,
  FiCamera,
  FiCheck,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { Toast } from "../components/Toast";
import { getFullImageUrl } from "../utils/url";
import { apiClient } from "../services/api";

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    profile_image_url: user?.profile_image_url || "",
    password: "",
    current_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await apiClient.post("/uploads", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update local state with the new image path
      setFormData((prev) => ({
        ...prev,
        profile_image_url: response.data.path,
      }));
      setPreviewUrl(response.data.url);
      setToast({
        message: "Photo uploaded. Save changes to finalize.",
        type: "success",
      });
    } catch (err) {
      console.error("Upload failed", err);
      setToast({
        message: "Failed to upload image. Please try again.",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation
    if (formData.password) {
      if (!formData.current_password) {
        setToast({
          message: "Current password is required to set a new one",
          type: "error",
        });
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setToast({ message: "New passwords do not match", type: "error" });
        return;
      }
      if (formData.password.length < 8) {
        setToast({
          message: "New password must be at least 8 characters",
          type: "error",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        profile_image_url: formData.profile_image_url,
      };

      if (formData.password) {
        updateData.password = formData.password;
        updateData.current_password = formData.current_password;
      }

      const updatedUser = await authService.updateProfile(updateData);
      setUser(updatedUser);
      setToast({ message: "Profile updated successfully!", type: "success" });
      setFormData((prev) => ({
        ...prev,
        password: "",
        current_password: "",
        confirm_password: "",
      }));
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

  const profileImageUrl =
    previewUrl || getFullImageUrl(formData.profile_image_url);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Unified Hero & Avatar Section */}
      <div className="relative mb-8 p-10 rounded-[3rem] overflow-hidden group bg-slate-900/40 border border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-indigo-600/5 to-transparent" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-center gap-10">
          {/* Integrated Avatar Edit */}
          <div className="relative">
            <div className="w-44 h-44 rounded-4xl bg-linear-to-br from-blue-500 to-indigo-600 p-1 shadow-2xl transition-all duration-500 hover:scale-105 group/avatar">
              <div className="w-full h-full rounded-[2.1rem] bg-slate-950 overflow-hidden flex items-center justify-center relative">
                {formData.profile_image_url ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className={`w-full h-full object-cover transition-all duration-700 ${uploading ? "opacity-40 blur-sm scale-110" : "group-hover/avatar:scale-110"}`}
                  />
                ) : (
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-linear-to-br from-white to-slate-500">
                    {user?.full_name?.charAt(0) || "A"}
                  </span>
                )}

                {/* Upload Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <FiCamera size={32} className="text-white animate-bounce" />
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                    Change Photo
                  </span>
                </button>

                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Role Badge inside header */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border-4 border-slate-950 whitespace-nowrap">
              {user?.role?.replace("_", " ")}
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight mb-3">
              {user?.full_name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <p className="text-slate-400 text-sm font-medium font-body flex items-center gap-2">
                <FiMail className="text-blue-400" /> {user?.email}
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <p className="text-slate-500 text-sm font-medium font-body">
                Since{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "recently"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Identity & Security Card */}
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="glass-panel p-8 lg:p-12 relative overflow-hidden shadow-2xl border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-48 -mt-48 blur-3xl" />

          <form onSubmit={handleSubmit} className="space-y-12 relative">
            {/* Identity Group */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] shrink-0">
                  Identity Settings
                </h3>
                <div className="h-px bg-slate-800 w-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] ml-1">
                    Display Name
                  </label>
                  <div className="relative group">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      required
                      type="text"
                      className="input pl-12 h-14 bg-slate-950/40 border-white/5 focus:bg-slate-950/70 focus:ring-blue-500/20"
                      placeholder="Your Full Name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] ml-1">
                    Communication Email
                  </label>
                  <div className="relative group">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      required
                      type="email"
                      className="input pl-12 h-14 bg-slate-950/40 border-white/5 focus:bg-slate-950/70 focus:ring-blue-500/20"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Group */}
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] shrink-0">
                    Security Panel
                  </h3>
                  <div className="h-px bg-slate-800 w-full" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20">
                  <div className="w-1 h-1 rounded-full bg-red-500" />
                  <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">
                    Protected
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] ml-1">
                    Current Password
                  </label>
                  <div className="relative group">
                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      className="input pl-12 h-14 bg-slate-950/40 border-white/5 focus:bg-slate-950/70 focus:ring-blue-500/20"
                      placeholder="••••••••••••"
                      value={formData.current_password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          current_password: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] ml-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      className="input pl-12 h-14 bg-slate-950/40 border-white/5 focus:bg-slate-950/70 focus:ring-blue-500/20"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] ml-1">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      className="input pl-12 h-14 bg-slate-950/40 border-white/5 focus:bg-slate-950/70 focus:ring-blue-500/20"
                      placeholder="••••••••••••"
                      value={formData.confirm_password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirm_password: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium ml-1 leading-relaxed">
                To update your password, you must provide your current
                credentials and confirm the new one. Leave blank to maintain
                current settings.
              </p>
            </div>

            {/* Save Action */}
            <div className="pt-6">
              <button
                disabled={loading || uploading}
                type="submit"
                className="btn btn-primary w-full h-16 text-sm tracking-[0.4em] uppercase font-black overflow-hidden relative group rounded-2xl shadow-blue-500/20 shadow-2xl"
              >
                <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-700 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative flex items-center justify-center gap-4">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSave
                        size={20}
                        className="group-hover:rotate-12 transition-transform duration-300"
                      />
                      Commit Updates
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Floating Contextual Info */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-10">
          <div className="flex items-center gap-6">
            <div className="text-center sm:text-left">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Account Version
              </p>
              <p className="text-xs font-bold text-white tracking-widest">
                2.4.0-PRIME
              </p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div className="text-center sm:text-left">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Status
              </p>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <FiCheck className="text-green-500" size={12} />
                <p className="text-xs font-bold text-green-500 tracking-widest">
                  VERIFIED
                </p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 font-medium max-w-[240px] text-center sm:text-right leading-relaxed">
            All configuration changes are logged and audited via our secure
            backend systems.
          </p>
        </div>
      </div>
    </div>
  );
};
