import React, { useEffect, useState } from "react";
import { FiWifiOff, FiWifi } from "react-icons/fi";

export const ConnectionStatus: React.FC = () => {
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) {
    return (
      <div className="fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 backdrop-blur">
        <FiWifi size={14} />
        <span>Online</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2 backdrop-blur">
      <FiWifiOff size={14} />
      <span>Offline – changes may not sync</span>
    </div>
  );
};

