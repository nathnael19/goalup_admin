import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative glass-panel bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-3xl w-full max-w-sm shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-red-600/5 pointer-events-none" />
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 text-red-500 flex items-center justify-center mb-4">
            <FiAlertTriangle size={32} />
          </div>

          <h2 className="text-xl font-black text-white font-display tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-secondary flex-1 h-11"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="btn bg-red-600 hover:bg-red-500 text-white flex-1 h-11 border-none"
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
