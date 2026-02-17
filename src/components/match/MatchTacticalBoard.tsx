import React from "react";
import { FiSave, FiUsers, FiX, FiPlus } from "react-icons/fi";
import type { Match, TeamDetail, UserRole } from "../../types";
import { UserRoles } from "../../types";
import { getFullImageUrl } from "../../utils/url";

interface MatchTacticalBoardProps {
  match: Match;
  viewTeam: "A" | "B";
  setViewTeam: (team: "A" | "B") => void;
  formationA: string;
  setFormationA: (f: string) => void;
  formationB: string;
  setFormationB: (f: string) => void;
  selectedLineupA: Record<number, string>;
  selectedLineupB: Record<number, string>;
  selectedBenchA: string[];
  setSelectedBenchA: (ids: string[]) => void;
  selectedBenchB: string[];
  setSelectedBenchB: (ids: string[]) => void;
  teamADetail?: TeamDetail;
  teamBDetail?: TeamDetail;
  userRole?: UserRole;
  userTeamId?: string;
  onSaveLineups: () => void;
  isSaving: boolean;
  isLocked: boolean;
  onOpenSlotModal: (data: {
    teamId: string;
    position: string;
    teamKey: "A" | "B";
    replaceId?: string;
    slot_index: number;
  }) => void;
}

export const MatchTacticalBoard: React.FC<MatchTacticalBoardProps> = ({
  match,
  viewTeam,
  setViewTeam,
  formationA,
  setFormationA,
  formationB,
  setFormationB,
  selectedLineupA,
  selectedLineupB,
  selectedBenchA,
  setSelectedBenchA,
  selectedBenchB,
  setSelectedBenchB,
  teamADetail,
  teamBDetail,
  userRole,
  userTeamId,
  onSaveLineups,
  isSaving,
  isLocked,
  onOpenSlotModal,
}) => {
  const isTeamA = viewTeam === "A";
  const currentFormation = isTeamA ? formationA : formationB;
  const activeTeamId = isTeamA ? match.team_a_id : match.team_b_id;
  const activeColor = isTeamA ? "blue" : "red";
  const activeLineup = isTeamA ? selectedLineupA : selectedLineupB;
  const activeDetail = isTeamA ? teamADetail : teamBDetail;

  const roster = activeDetail
    ? [
        ...activeDetail.roster.goalkeepers,
        ...activeDetail.roster.defenders,
        ...activeDetail.roster.midfielders,
        ...activeDetail.roster.forwards,
      ]
    : [];

  const getFormationRows = (formation: string, players: any[]) => {
    let layout: [number, string][] = [];
    if (formation === "4-3-3")
      layout = [
        [1, "gk"],
        [4, "def"],
        [3, "mid"],
        [3, "fwd"],
      ];
    else if (formation === "4-4-2")
      layout = [
        [1, "gk"],
        [4, "def"],
        [4, "mid"],
        [2, "fwd"],
      ];
    else if (formation === "4-2-3-1")
      layout = [
        [1, "gk"],
        [4, "def"],
        [2, "mid"],
        [3, "mid"],
        [1, "fwd"],
      ];
    else if (formation === "4-3-2-1")
      layout = [
        [1, "gk"],
        [4, "def"],
        [3, "mid"],
        [2, "mid"],
        [1, "fwd"],
      ];
    else if (formation === "3-5-2")
      layout = [
        [1, "gk"],
        [3, "def"],
        [5, "mid"],
        [2, "fwd"],
      ];
    else if (formation === "5-3-2")
      layout = [
        [1, "gk"],
        [5, "def"],
        [3, "mid"],
        [2, "fwd"],
      ];
    else if (formation === "4-5-1")
      layout = [
        [1, "gk"],
        [4, "def"],
        [5, "mid"],
        [1, "fwd"],
      ];
    else
      layout = [
        [1, "gk"],
        [4, "def"],
        [4, "mid"],
        [2, "fwd"],
      ];

    const result: any[][] = [];
    let currentSlotIndex = 0;

    layout.forEach(([count, category]) => {
      const row: any[] = [];
      for (let i = 0; i < count; i++) {
        const slotIdx = currentSlotIndex++;
        const p = players.find((player) => player.slot_index === slotIdx);
        row.push({ player: p || null, category, slot_index: slotIdx });
      }
      result.push(row);
    });
    return result;
  };

  const rows = getFormationRows(
    currentFormation,
    Object.entries(activeLineup)
      .map(([slotIdx, pid]) => {
        const p = roster.find((player) => player.id === pid);
        return p ? { ...p, slot_index: parseInt(slotIdx) } : null;
      })
      .filter(Boolean),
  );

  const canEdit =
    userRole === UserRoles.SUPER_ADMIN ||
    userRole === UserRoles.TOURNAMENT_ADMIN ||
    userRole === UserRoles.REFEREE ||
    (userRole === UserRoles.COACH &&
      userTeamId?.toString() === activeTeamId?.toString());

  return (
    <div className="card p-8 md:p-12 border-white/5 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">
            Tactical Analysis
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            {userRole === UserRoles.COACH
              ? "Manage Your Team's Starting XI"
              : "Starting XI Distribution"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 p-1 rounded-xl flex items-center border border-white/10">
            <button
              onClick={() => setViewTeam("A")}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewTeam === "A" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
            >
              {match?.team_a?.name || "Home"}
            </button>
            <button
              onClick={() => setViewTeam("B")}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewTeam === "B" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
            >
              {match?.team_b?.name || "Away"}
            </button>
          </div>

          <button
            onClick={onSaveLineups}
            disabled={isSaving || isLocked}
            className="px-6 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-blue-500/20 disabled:opacity-30 transition-all active:scale-95"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FiSave size={16} />
            )}
            {isSaving ? "Saving..." : "Save Decisions"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="relative min-h-[850px] lg:min-h-0 lg:aspect-3/4 bg-emerald-900/20 rounded-4xl border-4 border-white/5 overflow-hidden group shadow-2xl">
          <div className="absolute inset-0">
            <div className="absolute inset-0 grid grid-cols-6 border-x border-white/10">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-full ${i % 2 === 0 ? "bg-emerald-500/5" : "bg-transparent"}`}
                />
              ))}
            </div>
            <div className="absolute inset-[5%] border-2 border-white/20 rounded-lg">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-b-2 border-white/20" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-t-2 border-white/20" />
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
            </div>
          </div>

          <div className="absolute inset-0 p-4 py-8 flex flex-col-reverse justify-between">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="flex justify-around items-center w-full px-2"
                style={{ minHeight: "64px" }}
              >
                {row.map((slot, sIdx) => (
                  <div
                    key={sIdx}
                    className={`flex flex-col items-center gap-2 ${canEdit ? "cursor-pointer group/slot" : "cursor-default"}`}
                    onClick={() =>
                      canEdit &&
                      !isLocked &&
                      onOpenSlotModal({
                        teamId: activeTeamId,
                        position: slot.category,
                        teamKey: viewTeam,
                        replaceId: slot.player?.id,
                        slot_index: slot.slot_index,
                      })
                    }
                  >
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${slot.player ? (activeColor === "red" ? "bg-red-500 border-white/40" : "bg-blue-600 border-white/40") : "bg-white/5 border-dashed border-white/20 hover:border-white/40 hover:bg-white/10 hover:scale-110 active:scale-95"} ${!slot.player && canEdit ? "animate-pulse ring-4 ring-blue-500/20" : ""}`}
                    >
                      {slot.player ? (
                        slot.player.image_url ? (
                          <img
                            src={getFullImageUrl(slot.player.image_url)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-black text-white">
                            {slot.player.jersey_number ||
                              (slot.player.position === "gk" ? "GK" : "")}
                          </span>
                        )
                      ) : (
                        <FiPlus
                          className={`transition-colors duration-300 ${canEdit ? "text-blue-400 group-hover/slot:text-white" : "text-white/20"}`}
                          size={20}
                        />
                      )}
                    </div>
                    <span
                      className={`text-[6px] sm:text-[7px] font-black uppercase whitespace-nowrap px-1.5 py-0.5 rounded-xs transition-all ${slot.player ? "text-white bg-black/40" : "text-white/20 bg-transparent group-hover/slot:text-white/60"}`}
                    >
                      {slot.player
                        ? slot.player.name.split(" ").pop()
                        : slot.category}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {[
            {
              team: match.team_a,
              selected: selectedLineupA,
              bench: selectedBenchA,
              setBench: setSelectedBenchA,
              detail: teamADetail,
              color: "blue",
              formation: formationA,
              setFormation: setFormationA,
              key: "A" as const,
            },
            {
              team: match.team_b,
              selected: selectedLineupB,
              bench: selectedBenchB,
              setBench: setSelectedBenchB,
              detail: teamBDetail,
              color: "red",
              formation: formationB,
              setFormation: setFormationB,
              key: "B" as const,
            },
          ]
            .filter((cfg) => cfg.key === viewTeam)
            .map((cfg, i) => {
              const teamInfo = cfg.detail || cfg.team;
              return (
                <div key={i} className="space-y-6">
                  {(userRole === UserRoles.SUPER_ADMIN ||
                    userRole === UserRoles.TOURNAMENT_ADMIN ||
                    userRole === UserRoles.REFEREE ||
                    (userRole === UserRoles.COACH &&
                      userTeamId?.toString() === cfg.team?.id?.toString())) && (
                    <>
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 overflow-hidden p-1 flex items-center justify-center">
                            {teamInfo?.logo_url ? (
                              <img
                                src={getFullImageUrl(teamInfo.logo_url)}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div
                                className={`w-2 h-2 rounded-full ${cfg.color === "blue" ? "bg-blue-600" : "bg-red-600"}`}
                              />
                            )}
                          </div>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight">
                            {teamInfo?.name} XI
                          </h4>
                        </div>
                        <div className="flex items-center gap-4">
                          <select
                            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-wider outline-hidden cursor-pointer hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            value={cfg.formation}
                            disabled={isLocked}
                            onChange={(e) => cfg.setFormation(e.target.value)}
                          >
                            {[
                              "4-3-3",
                              "4-4-2",
                              "4-2-3-1",
                              "4-3-2-1",
                              "3-5-2",
                              "5-3-2",
                              "4-5-1",
                            ].map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                          <span
                            className={`text-[10px] font-extra-black uppercase tracking-widest px-3 py-1 rounded-lg ${Object.values(cfg.selected).length >= 11 ? "bg-emerald-600/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-600/10 text-amber-500 border border-amber-500/20"}`}
                          >
                            {Object.values(cfg.selected).length}/11 Selected
                          </span>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiUsers className="text-slate-500" size={14} />
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Substitutes (Bench)
                            </h5>
                          </div>
                          <span className="text-[9px] font-bold text-slate-500">
                            {cfg.bench.length} Selected
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-3xl bg-white/2 border border-white/5 space-y-3">
                            <select
                              className="w-full bg-transparent text-xs font-bold text-white outline-hidden cursor-pointer hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isLocked}
                              onChange={(e) => {
                                if (e.target.value) {
                                  cfg.setBench([...cfg.bench, e.target.value]);
                                  e.target.value = "";
                                }
                              }}
                            >
                              <option value="" className="bg-slate-900">
                                Add Bench Player...
                              </option>
                              {[
                                ...(cfg.detail?.roster.goalkeepers || []),
                                ...(cfg.detail?.roster.defenders || []),
                                ...(cfg.detail?.roster.midfielders || []),
                                ...(cfg.detail?.roster.forwards || []),
                              ]
                                .filter(
                                  (p) =>
                                    !Object.values(cfg.selected).includes(
                                      p.id,
                                    ) && !cfg.bench.includes(p.id),
                                )
                                .map((p) => (
                                  <option
                                    key={p.id}
                                    value={p.id}
                                    className="bg-slate-900"
                                  >
                                    #{p.jersey_number} {p.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {cfg.bench.map((pid) => {
                            const p = [
                              ...(cfg.detail?.roster.goalkeepers || []),
                              ...(cfg.detail?.roster.defenders || []),
                              ...(cfg.detail?.roster.midfielders || []),
                              ...(cfg.detail?.roster.forwards || []),
                            ].find((pl) => pl.id === pid);
                            return (
                              <div
                                key={pid}
                                className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded-xl hover:border-emerald-500/50 transition-all cursor-default shadow-lg group"
                              >
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-tight">
                                  {p?.name.split(" ").pop()}
                                </span>
                                <button
                                  onClick={() =>
                                    !isLocked &&
                                    cfg.setBench(
                                      cfg.bench.filter((id) => id !== pid),
                                    )
                                  }
                                  disabled={isLocked}
                                  className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                                >
                                  <FiX size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
