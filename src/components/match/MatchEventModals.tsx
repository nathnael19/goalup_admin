import React from "react";
import { FiPlus, FiRepeat, FiAlertTriangle, FiX } from "react-icons/fi";
import type { Match, TeamDetail, CreateGoalDto, CardType } from "../../types";

// --- Goal Modal ---
interface GoalModalProps {
  match: Match;
  goalData: Omit<CreateGoalDto, "match_id">;
  setGoalData: (data: Omit<CreateGoalDto, "match_id">) => void;
  teamADetail?: TeamDetail;
  teamBDetail?: TeamDetail;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  match,
  goalData,
  setGoalData,
  teamADetail,
  teamBDetail,
  onClose,
  onSubmit,
}) => {
  const activeTeam =
    goalData.team_id === match.team_a_id ? match.team_a : match.team_b;
  const activeDetail =
    goalData.team_id === match.team_a_id ? teamADetail : teamBDetail;
  const players = activeDetail
    ? [
        ...activeDetail.roster.goalkeepers,
        ...activeDetail.roster.defenders,
        ...activeDetail.roster.midfielders,
        ...activeDetail.roster.forwards,
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center overflow-hidden p-1.5 shadow-lg">
              {activeTeam?.logo_url ? (
                <img
                  src={activeTeam.logo_url}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  className={`w-3 h-3 rounded-full ${goalData.team_id === match.team_a_id ? "bg-blue-500" : "bg-red-500"}`}
                />
              )}
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Record Goal
            </h2>
          </div>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="label">Scorer ({activeTeam?.name})</label>
              <select
                className="input h-12 appearance-none"
                value={goalData.player_id}
                onChange={(e) =>
                  setGoalData({ ...goalData, player_id: e.target.value })
                }
              >
                <option value="">Select Scorer (Optional)</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.jersey_number}. {p.name}
                  </option>
                ))}
              </select>
            </div>
            {!goalData.is_own_goal && (
              <div>
                <label className="label">Assisted By (Optional)</label>
                <select
                  className="input h-12 appearance-none"
                  value={goalData.assistant_id}
                  onChange={(e) =>
                    setGoalData({ ...goalData, assistant_id: e.target.value })
                  }
                >
                  <option value="">No Assist</option>
                  {players
                    .filter((p) => p.id !== goalData.player_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.jersey_number}. {p.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Minute</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input h-12 border-blue-500/30 focus:border-blue-500"
                  value={goalData.minute}
                  onChange={(e) =>
                    setGoalData({
                      ...goalData,
                      minute: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-700 bg-slate-800/50 w-full hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900"
                    checked={goalData.is_own_goal}
                    onChange={(e) =>
                      setGoalData({
                        ...goalData,
                        is_own_goal: e.target.checked,
                      })
                    }
                  />
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest leading-none">
                    Own Goal
                  </span>
                </label>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Record Goal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Card Modal ---
interface CardModalProps {
  match: Match;
  cardData: {
    team_id: string;
    player_id: string;
    minute: number;
    type: CardType;
  };
  setCardData: (data: any) => void;
  teamADetail?: TeamDetail;
  teamBDetail?: TeamDetail;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  match,
  cardData,
  setCardData,
  teamADetail,
  teamBDetail,
  onClose,
  onSubmit,
}) => {
  const activeTeam =
    cardData.team_id === match.team_a_id ? match.team_a : match.team_b;
  const activeDetail =
    cardData.team_id === match.team_a_id ? teamADetail : teamBDetail;
  const players = activeDetail
    ? [
        ...activeDetail.roster.goalkeepers,
        ...activeDetail.roster.defenders,
        ...activeDetail.roster.midfielders,
        ...activeDetail.roster.forwards,
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <div
                className={`w-3 h-5 rounded-xs ${cardData.type === "yellow" ? "bg-amber-500" : "bg-red-600"}`}
              />
              Record {cardData.type} Card
            </h2>
          </div>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="label">Player ({activeTeam?.name})</label>
              <select
                required
                className="input h-12 appearance-none font-bold"
                value={cardData.player_id}
                onChange={(e) =>
                  setCardData({ ...cardData, player_id: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Player
                </option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.jersey_number}. {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Minute</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input h-12 border-blue-500/30 focus:border-blue-500"
                  value={cardData.minute}
                  onChange={(e) =>
                    setCardData({
                      ...cardData,
                      minute: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Card Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardData({ ...cardData, type: "yellow" })}
                    className={`h-12 rounded-xl border flex items-center justify-center transition-all ${cardData.type === "yellow" ? "bg-amber-500 border-amber-400 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.3)]" : "bg-slate-800 border-slate-700 text-slate-400 opacity-50"}`}
                  >
                    <div className="w-2 h-3 bg-current rounded-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardData({ ...cardData, type: "red" })}
                    className={`h-12 rounded-xl border flex items-center justify-center transition-all ${cardData.type === "red" ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]" : "bg-slate-800 border-slate-700 text-slate-400 opacity-50"}`}
                  >
                    <div className="w-2 h-3 bg-current rounded-xs" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Record Card
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Substitution Modal ---
interface SubstitutionModalProps {
  match: Match;
  subData: {
    team_id: string;
    player_in_id: string;
    player_out_id: string;
    minute: number;
  };
  setSubData: (data: any) => void;
  teamADetail?: TeamDetail;
  teamBDetail?: TeamDetail;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  match,
  subData,
  setSubData,
  teamADetail,
  teamBDetail,
  onClose,
  onSubmit,
}) => {
  const activeTeam =
    subData.team_id === match.team_a_id ? match.team_a : match.team_b;
  const activeDetail =
    subData.team_id === match.team_a_id ? teamADetail : teamBDetail;
  const players = activeDetail
    ? [
        ...activeDetail.roster.goalkeepers,
        ...activeDetail.roster.defenders,
        ...activeDetail.roster.midfielders,
        ...activeDetail.roster.forwards,
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <FiRepeat className="text-emerald-400" /> Record Substitution
            </h2>
          </div>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="label">Player Out ({activeTeam?.name})</label>
              <select
                required
                className="input h-12 appearance-none font-bold"
                value={subData.player_out_id}
                onChange={(e) =>
                  setSubData({ ...subData, player_out_id: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Player Off
                </option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.jersey_number}. {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Player In ({activeTeam?.name})</label>
              <select
                required
                className="input h-12 appearance-none font-bold"
                value={subData.player_in_id}
                onChange={(e) =>
                  setSubData({ ...subData, player_in_id: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Player On
                </option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.jersey_number}. {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Minute</label>
              <input
                type="number"
                required
                min="1"
                className="input h-12 border-blue-500/30 focus:border-blue-500"
                value={subData.minute}
                onChange={(e) =>
                  setSubData({
                    ...subData,
                    minute: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Record Substitution
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Logic Error Modal ---
export const LineupErrorModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => (
  <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
      onClick={onClose}
    />
    <div className="relative bg-slate-900 border border-white/10 rounded-4xl w-full max-w-sm p-8 shadow-2xl overflow-hidden">
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <FiAlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tight">
          Incomplete Lineup
        </h3>
        <p className="text-slate-400 text-sm font-medium">
          Both teams must have exactly 11 starting players to begin an official
          match.
        </p>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
        >
          Understood
        </button>
      </div>
    </div>
  </div>
);

// --- Slot Selection Modal (for pitch) ---
interface SlotModalProps {
  slot: {
    teamId: string;
    position: string;
    teamKey: "A" | "B";
    replaceId?: string;
    slot_index: number;
  };
  teamDetail?: TeamDetail;
  onClose: () => void;
  onSelect: (playerId: string) => void;
  selectedLineup: Record<number, string>;
  selectedBench: string[];
}

export const SlotModal: React.FC<SlotModalProps> = ({
  slot,
  teamDetail,
  onClose,
  onSelect,
  selectedLineup,
  selectedBench,
}) => {
  const players = teamDetail
    ? [
        ...teamDetail.roster.goalkeepers,
        ...teamDetail.roster.defenders,
        ...teamDetail.roster.midfielders,
        ...teamDetail.roster.forwards,
      ]
    : [];

  const available = players.filter(
    (p) =>
      !Object.values(selectedLineup).includes(p.id) &&
      !selectedBench.includes(p.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Select player for {slot.position}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors"
            >
              <FiX />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {available.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 cursor-pointer flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-500/10">
                    #{p.jersey_number}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">
                      {p.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {p.position}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <FiPlus />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
