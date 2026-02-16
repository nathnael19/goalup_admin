import React, { useState, useRef } from "react";
import { FiX, FiImage } from "react-icons/fi";
import { apiClient } from "../services/api";
import { getFullImageUrl } from "../utils/url";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/uploads", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // response.data.url is a temporary signed URL for preview
      // response.data.path is the raw path to store in the database
      setPreviewUrl(response.data.url);
      onChange(response.data.path);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    onChange("");
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentImageUrl = previewUrl || getFullImageUrl(value);

  return (
    <div className="space-y-2">
      <label className="label uppercase tracking-widest text-[10px]">
        {label}
      </label>

      <div className="relative group">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {value ? (
          <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-inner group">
            <img
              src={currentImageUrl}
              alt="Preview"
              className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              title="Remove image"
            >
              <FiX size={16} />
            </button>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-white text-xs font-black uppercase tracking-widest bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/10">
                Change Image
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-40 rounded-2xl border-2 border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-600/10 transition-all">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiImage size={24} />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-white uppercase tracking-tight">
                {uploading ? "Uploading..." : "Click to select"}
              </p>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                SVG, PNG, JPG (MAX. 800X400PX)
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
