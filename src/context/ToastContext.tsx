import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { Toast } from "../components/Toast";

type ToastType = "success" | "error";

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// --- Global Event Emitter for outside React components ---
class ToastEventEmitter extends EventTarget {
  emit(message: string, type: ToastType = "success", durationMs = 4000) {
    this.dispatchEvent(new CustomEvent("show-toast", { 
      detail: { message, type, durationMs } 
    }));
  }
}
export const globalToast = new ToastEventEmitter();
// ---------------------------------------------------------

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    duration?: number;
  } | null>(null);

  const showToast = (
    message: string,
    type: ToastType = "success",
    durationMs = 4000,
  ) => {
    setToast({ message, type, duration: durationMs });
  };

  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      showToast(detail.message, detail.type, detail.durationMs);
    };

    globalToast.addEventListener("show-toast", handleGlobalToast);
    return () => {
      globalToast.removeEventListener("show-toast", handleGlobalToast);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
};
