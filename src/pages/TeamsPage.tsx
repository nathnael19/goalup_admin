import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiSearch,
  FiAward,
  FiActivity,
} from "react-icons/fi";
import { teamService } from "../services/teamService";
import {
  useTeams,
  useTournaments,
  useCompetitions,
  queryKeys,
} from "../hooks/useData";
import { ImageUpload } from "../components/ImageUpload";
import {
  type Team,
  type CreateTeamDto,
  type Competition,
  UserRoles,
} from "../types";
import { useAuth } from "../context/AuthContext";
import { ConfirmationModal } from "../components/common/ConfirmationModal";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { getFullImageUrl } from "../utils/url";

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const { data: tournaments = [], isLoading: loadingTournaments } =
    useTournaments();
  const { data: competitions = [], isLoading: loadingCompetitions } =
    useCompetitions();

  const loading = loadingTeams || loadingTournaments || loadingCompetitions;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({});

  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);

  // For modal selection
  const [modalCompetitionId, setModalCompetitionId] = useState<string>("");
  const [filterSeasonId, setFilterSeasonId] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");

  // Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Mutations
  const saveTeamMutation = useMutation({
    mutationFn: async ({
      isEditing,
      team,
    }: {
      isEditing: boolean;
      team: Partial<Team>;
    }) => {
      if (isEditing && team.id) {
        return teamService.update(team.id.toString(), team as CreateTeamDto);
      } else {
        return teamService.create(team as CreateTeamDto);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
      setShowModal(false);
      setCurrentTeam({});
    },
    onError: (err: {
      response?: { data?: { detail?: string } };
      message: string;
    }) => {
      console.error("Failed to save team", err);
      alert(
        `Failed to save team: ${err.response?.data?.detail || err.message}`,
      );
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
      setShowDeleteModal(false);
      setItemToDelete(null);
    },
    onError: (err) => {
      console.error("Failed to delete team", err);
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    saveTeamMutation.mutate({ isEditing, team: currentTeam });
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    deleteTeamMutation.mutate(itemToDelete);
  };

  useEffect(() => {
    if (selectedCompetition) {
      const compSeasons = tournaments.filter(
        (t) => t.competition_id === selectedCompetition.id,
      );
      if (compSeasons.length > 0) {
        // Default to latest season by year
        const latest = [...compSeasons].sort((a, b) => b.year - a.year)[0];
        setFilterSeasonId(latest.id);
      } else {
        setFilterSeasonId("");
      }
    } else {
      setFilterSeasonId("");
    }
  }, [selectedCompetition, tournaments]);

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  // Helper: get team count for a competition
  const getCompTeamCount = (compId: string) => {
    const tourIds = tournaments
      .filter((t) => t.competition_id === compId)
      .map((t) => t.id);
    return teams.filter((t) => tourIds.includes(t.tournament_id)).length;
  };

  // ============ VIEW 1: COMPETITION CARDS ============
  if (!selectedCompetition) {
    const filteredComps = competitions.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white font-display tracking-tight">
              Club Management
            </h1>
            <p className="text-slate-400 font-medium font-body mt-1">
              Select a competition to manage its registered clubs.
            </p>
          </div>
          {user?.role === UserRoles.TOURNAMENT_ADMIN && (
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentTeam({ name: "", tournament_id: "" });
                setModalCompetitionId("");
                setShowModal(true);
              }}
              className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <FiPlus /> Add Team
            </button>
          )}
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="relative group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Filter competitions..."
                className="input pl-12 h-14 bg-slate-800/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card flex items-center justify-between p-4 px-6 border-slate-800 bg-slate-800/20">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Total Teams
              </p>
              <p className="text-2xl font-black text-white font-display leading-none">
                {teams.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500">
              <FiUsers size={20} />
            </div>
          </div>
        </div>

        {/* Competition Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredComps.length === 0 ? (
          <div className="card p-12 text-center">
            <FiAward className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 font-bold">No competitions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComps.map((comp, i) => {
              const teamCount = getCompTeamCount(comp.id);
              const seasonCount = tournaments.filter(
                (t) => t.competition_id === comp.id,
              ).length;
              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompetition(comp);
                    setSearchTerm("");
                  }}
                  className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                    (i % 4) + 1
                  } relative overflow-hidden cursor-pointer`}
                >
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/50 flex items-center justify-center text-blue-400 mb-6 border border-slate-700/50 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                      {comp.image_url ? (
                        <img
                          src={getFullImageUrl(comp.image_url)}
                          alt={comp.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiAward size={28} />
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 font-display tracking-tight">
                      {comp.name}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-6">
                      {comp.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span className="bg-slate-800 px-2 py-1 rounded-md">
                        {seasonCount} Season{seasonCount !== 1 ? "s" : ""}
                      </span>
                      <span className="bg-indigo-600/10 text-indigo-400 px-2 py-1 rounded-md border border-indigo-600/20">
                        {teamCount} Team{teamCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-indigo-600/10 group-hover:bg-indigo-600/40 transition-colors" />
                </div>
              );
            })}
          </div>
        )}

        {renderTeamModal()}

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Delete Team"
          message="Are you sure you want to delete this team? This action cannot be undone."
          isLoading={deleteTeamMutation.isPending}
        />
      </div>
    );
  }

  // ============ VIEW 2: COMPETITION DASHBOARD (TEAMS) ============
  const compSeasons = tournaments.filter(
    (t) => t.competition_id === selectedCompetition.id,
  );

  const currentFilterSeason = tournaments.find((s) => s.id === filterSeasonId);
  const seasonTeams = teams.filter((t) => t.tournament_id === filterSeasonId);
  const filteredTeams = seasonTeams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button
        onClick={() => {
          setSelectedCompetition(null);
          setFilterSeasonId("");
          setSearchTerm("");
        }}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        ← Back to Competitions
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700 overflow-hidden">
            {selectedCompetition.image_url ? (
              <img
                src={getFullImageUrl(selectedCompetition.image_url)}
                alt={selectedCompetition.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiAward size={32} />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white font-display tracking-tight">
              {selectedCompetition.name}
            </h1>
            <p className="text-slate-400 font-medium font-body mt-1">
              Manage clubs and list registrations for this competition.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {compSeasons.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                Teams for:
              </span>
              <select
                className="bg-slate-800 border-none rounded-lg text-sm font-bold text-white px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 transition-all min-w-[140px]"
                value={filterSeasonId}
                onChange={(e) => setFilterSeasonId(e.target.value)}
              >
                {compSeasons
                  .sort((a, b) => b.year - a.year)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.year})
                    </option>
                  ))}
              </select>
            </div>
          )}
          {user?.role === UserRoles.TOURNAMENT_ADMIN && (
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentTeam({
                  name: "",
                  tournament_id: filterSeasonId || "",
                });
                setModalCompetitionId(selectedCompetition.id);
                setShowModal(true);
              }}
              className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <FiPlus /> Add Team
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          {/* Search Box */}
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={`Search ${currentFilterSeason?.name || "teams"}...`}
              className="input pl-12 h-14 bg-slate-800/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeams.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <p className="text-slate-500 font-medium">
                  {filterSeasonId
                    ? "No teams found for this season."
                    : "Please select/create a season first."}
                </p>
              </div>
            ) : (
              filteredTeams.map((team, i) => (
                <div
                  key={team.id}
                  className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                    (i % 4) + 1
                  } relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/teams/${team.id}`)}
                        className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                        title="View Dashboard"
                      >
                        <FiActivity size={14} />
                      </button>
                      {user?.role === UserRoles.TOURNAMENT_ADMIN && (
                        <>
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setCurrentTeam(team);
                              setModalCompetitionId(selectedCompetition.id);
                              setShowModal(true);
                            }}
                            className="p-2.5 bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => confirmDelete(team.id)}
                            className="p-2.5 bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-8 flex items-center gap-6 relative">
                    <div
                      className="w-20 h-20 rounded-2xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 flex items-center justify-center text-blue-500 font-black text-2xl shadow-2xl group-hover:scale-110 transition-transform cursor-pointer overflow-hidden relative shrink-0"
                      onClick={() => navigate(`/teams/${team.id}`)}
                    >
                      <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                      {team.logo_url ? (
                        <img
                          src={getFullImageUrl(team.logo_url)}
                          alt={team.name}
                          className="w-full h-full object-cover relative z-10"
                        />
                      ) : (
                        <span className="relative z-10">
                          {team.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xl font-black text-white mb-1 font-display tracking-tight truncate cursor-pointer hover:text-blue-400 transition-colors"
                        onClick={() => navigate(`/teams/${team.id}`)}
                      >
                        {team.name}
                      </h3>
                      {team.stadium && (
                        <p className="text-slate-500 text-sm font-medium truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                          {team.stadium}
                        </p>
                      )}
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-3 font-mono">
                        ID: {team.id.toString().slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-blue-600/10 group-hover:bg-blue-600/40 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 border-blue-500/10 bg-blue-600/5">
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">
              Competition Summary
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400 font-medium">
                  Total Seasons
                </span>
                <span className="text-lg font-black text-white">
                  {compSeasons.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400 font-medium">
                  Active Teams
                </span>
                <span className="text-lg font-black text-white">
                  {getCompTeamCount(selectedCompetition.id)}
                </span>
              </div>
              {filterSeasonId && (
                <div className="pt-4 border-t border-blue-500/10 flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-medium">
                    Teams in Season
                  </span>
                  <span className="text-lg font-black text-blue-400">
                    {seasonTeams.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderTeamModal()}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Team"
        message="Are you sure you want to delete this team? This action cannot be undone."
        isLoading={deleteTeamMutation.isPending}
      />
    </div>
  );

  function renderTeamModal() {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setShowModal(false)}
        />
        <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
          <div className="p-8 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center">
                <FiPlus size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white font-display tracking-tight">
                  {isEditing ? "Modify Team" : "Add Club"}
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Registry registration
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="label">Legal Name</label>
                <input
                  required
                  type="text"
                  className="input h-12"
                  value={currentTeam.name || ""}
                  onChange={(e) =>
                    setCurrentTeam({ ...currentTeam, name: e.target.value })
                  }
                  placeholder="e.g. Red Warriors FC"
                />
              </div>
              <div>
                <label className="label">Home Stadium</label>
                <input
                  type="text"
                  className="input h-12"
                  value={currentTeam.stadium || ""}
                  onChange={(e) =>
                    setCurrentTeam({ ...currentTeam, stadium: e.target.value })
                  }
                  placeholder="e.g. Old Trafford"
                />
              </div>
              <div>
                <label className="label">League / Competition</label>
                <select
                  required
                  className="input h-12 appearance-none mb-4"
                  value={modalCompetitionId}
                  onChange={(e) => {
                    setModalCompetitionId(e.target.value);
                    setCurrentTeam({ ...currentTeam, tournament_id: "" });
                  }}
                >
                  <option value="" disabled>
                    Select a competition
                  </option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <label className="label">Season</label>
                <select
                  required
                  className="input h-12 appearance-none"
                  value={currentTeam.tournament_id || ""}
                  onChange={(e) =>
                    setCurrentTeam({
                      ...currentTeam,
                      tournament_id: e.target.value,
                    })
                  }
                  disabled={!modalCompetitionId}
                >
                  <option value="" disabled>
                    {modalCompetitionId
                      ? "Select a season"
                      : "Select a competition first"}
                  </option>
                  {tournaments
                    .filter((t) => t.competition_id === modalCompetitionId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.year})
                      </option>
                    ))}
                </select>
              </div>

              <ImageUpload
                label="Team Emblem"
                value={currentTeam.logo_url}
                onChange={(url) =>
                  setCurrentTeam({ ...currentTeam, logo_url: url })
                }
              />

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1 h-12"
                >
                  Discard
                </button>
                <button type="submit" className="btn btn-primary flex-1 h-12">
                  {isEditing ? "Update" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
};
