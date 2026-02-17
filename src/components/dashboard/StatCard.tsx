import React from "react";
import type { IconType } from "react-icons";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: IconType;
  color: string;
  bg: string;
  text: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  bg,
  text,
  delay = 1,
}) => {
  return (
    <div
      className={`card card-hover transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${delay}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-2xl ${bg} ${text} flex items-center justify-center shadow-inner`}
          >
            <Icon size={24} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
            Active
          </div>
        </div>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-tight mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-white font-display">
            {value}
          </h3>
        </div>
      </div>
      <div className={`h-1.5 w-full bg-linear-to-r ${color} opacity-20`} />
    </div>
  );
};
