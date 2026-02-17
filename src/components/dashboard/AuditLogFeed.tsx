import React from "react";
import { FiActivity, FiZap } from "react-icons/fi";
import type { AuditLog } from "../../services/auditLogService";

interface AuditLogFeedProps {
  logs: AuditLog[];
  loading: boolean;
  onRefresh: () => void;
}

export const AuditLogFeed: React.FC<AuditLogFeedProps> = ({
  logs,
  loading,
  onRefresh,
}) => {
  return (
    <div className="card divide-y divide-white/5 bg-slate-900/40 border-white/5 overflow-hidden">
      <div className="p-4 bg-white/2 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FiActivity size={10} className="text-blue-500" /> Administrative
          Trail
        </div>
        {logs.length > 0 && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10">
            Live
          </span>
        )}
      </div>
      {loading ? (
        <div className="p-10 flex flex-col items-center justify-center gap-3">
          <FiZap className="text-slate-700 animate-pulse" size={20} />
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
            Analyzing logs...
          </span>
        </div>
      ) : logs.length > 0 ? (
        logs.map((log) => {
          const isDelete = log.action.includes("DELETE");
          const isCreate =
            log.action.includes("CREATE") || log.action.includes("ADD");
          const isUpdate =
            log.action.includes("UPDATE") || log.action.includes("SET");

          return (
            <div
              key={log.id}
              className="p-5 flex gap-4 hover:bg-white/2 transition-all group"
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  isDelete
                    ? "bg-red-500"
                    : isCreate
                      ? "bg-emerald-500"
                      : "bg-blue-500"
                } ${isCreate || isUpdate ? "animate-pulse" : ""}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p
                    className={`text-xs font-black uppercase tracking-tight truncate ${isDelete ? "text-red-400" : "text-white"}`}
                  >
                    {log.action.replace("_", " ")}
                  </p>
                  <span className="text-[9px] font-bold text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 group-hover:text-slate-400 transition-colors">
                  {log.description}
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-10 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            No activity recorded yet
          </p>
        </div>
      )}
      {logs.length > 0 && (
        <button
          onClick={onRefresh}
          className="w-full py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-white/2 transition-all flex items-center justify-center gap-2"
        >
          <FiZap size={10} /> Refresh Feed
        </button>
      )}
    </div>
  );
};
