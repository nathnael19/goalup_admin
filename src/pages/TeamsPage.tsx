import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiSearch,
  FiAward,
  FiActivity,
  FiCalendar,
} from "react-icons/fi";
import { teamService } from "../services/teamService";
import { tournamentService } from "../services/tournamentService";
import { competitionService } from "../services/competitionService";
import { ImageUpload } from "../components/ImageUpload";
import type { Team, CreateTeamDto, Tournament, Competition } from "../types";
import { UserRoles } from "../types";
import { useAuth } from "../context/AuthContext";
import { ConfirmationModal } from "../components/common/ConfirmationModal";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({});

  // Drill-down selection
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  // For modal selection
  const [modalCompetitionId, setModalCompetitionId] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");

  // Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, tournamentsData, competitionsData] = await Promise.all([
        teamService.getAll(),
        tournamentService.getAll(),
        competitionService.getAll(),
      ]);
      setTeams(teamsData);
      setTournaments(tournamentsData);
      setCompetitions(competitionsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentTeam.id) {
        await teamService.update(
          currentTeam.id.toString(),
          currentTeam as CreateTeamDto,
        );
      } else {
        await teamService.create(currentTeam as CreateTeamDto);
      }
      setShowModal(false);
      fetchData();
      setCurrentTeam({});
    } catch (err: any) {
      console.error("Failed to save team", err);
      alert(
        `Failed to save team: ${err.response?.data?.detail || err.message}`,
      );
    }
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await teamService.delete(itemToDelete.toString());
      fetchData();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Failed to delete team", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper: get team count for a competition
  const getCompTeamCount = (compId: string) => {
    const tourIds = tournaments
      .filter((t) => t.competition_id === compId)
      .map((t) => t.id);
    return teams.filter((t) => tourIds.includes(t.tournament_id)).length;
  };

  // Helper: get team count for a tournament
  const getTourTeamCount = (tourId: string) => {
    return teams.filter((t) => t.tournament_id === tourId).length;
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
          {(user?.role === UserRoles.SUPER_ADMIN ||
            user?.role === UserRoles.TOURNAMENT_ADMIN) && (
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
                          src={
                            comp.image_url.startsWith("http")
                              ? comp.image_url
                              : `http://localhost:8000${comp.image_url}`
                          }
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
          isLoading={isDeleting}
        />
      </div>
    );
  }

  if (!selectedTournament) {
    const compSeasons = tournaments.filter(
      (t) => t.competition_id === selectedCompetition.id,
    );
    const filteredSeasons = compSeasons.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <button
          onClick={() => {
            setSelectedCompetition(null);
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
                  src={
                    selectedCompetition.image_url.startsWith("http")
                      ? selectedCompetition.image_url
                      : `http://localhost:8000${selectedCompetition.image_url}`
                  }
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
                Select a season to manage its teams.
              </p>
            </div>
          </div>
          {(user?.role === UserRoles.SUPER_ADMIN ||
            user?.role === UserRoles.TOURNAMENT_ADMIN) && (
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentTeam({ name: "", tournament_id: "" });
                setModalCompetitionId(selectedCompetition.id);
                setShowModal(true);
              }}
              className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <FiPlus /> Add Team
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative group max-w-lg">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Filter seasons..."
            className="input pl-12 h-12 bg-slate-800/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Season Cards */}
        {filteredSeasons.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            <FiCalendar className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 font-medium">
              No seasons found for this competition.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeasons.map((season, i) => {
              const teamCount = getTourTeamCount(season.id);
              return (
                <div
                  key={season.id}
                  onClick={() => {
                    setSelectedTournament(season);
                    setSearchTerm("");
                  }}
                  className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                    (i % 4) + 1
                  } relative overflow-hidden cursor-pointer`}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-600/20 text-xs font-black uppercase tracking-widest">
                        {season.year}
                      </div>
                      <div className="text-xs font-bold text-slate-500 capitalize">
                        {season.type.replace("_", " ")}
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2 font-display tracking-tight">
                      {season.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
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
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // ============ VIEW 3: TEAMS TABLE ============
  const seasonTeams = teams.filter(
    (t) => t.tournament_id === selectedTournament.id,
  );
  const filteredTeams = seasonTeams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button
        onClick={() => {
          setSelectedTournament(null);
          setSearchTerm("");
        }}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        ← Back to {selectedCompetition.name}
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-500 border border-slate-700">
            <FiUsers size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white font-display tracking-tight">
              {selectedTournament.name}
            </h1>
            <p className="text-slate-400 font-medium font-body mt-1">
              Teams registered for the {selectedTournament.year} season.
            </p>
          </div>
        </div>
        {(user?.role === UserRoles.SUPER_ADMIN ||
          user?.role === UserRoles.TOURNAMENT_ADMIN) && (
          <button
            onClick={() => {
              setIsEditing(false);
              setCurrentTeam({
                name: "",
                tournament_id: selectedTournament.id,
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Filter by name..."
              className="input pl-12 h-12 bg-slate-800/40 border-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="card flex items-center justify-between p-4 px-6 border-slate-800 bg-slate-800/20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Registered
            </p>
            <p className="text-2xl font-black text-white font-display leading-none">
              {seasonTeams.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500">
            <FiUsers size={20} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden border-white/10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">
                  Team Profile
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">
                  ID
                </th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No teams found.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => (
                  <tr
                    key={team.id}
                    className="hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 flex items-center justify-center text-blue-500 font-black text-lg shadow-2xl group-hover:scale-110 transition-transform cursor-pointer overflow-hidden relative"
                          onClick={() => navigate(`/teams/${team.id}`)}
                        >
                          <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                          {team.logo_url ? (
                            <img
                              src={
                                team.logo_url.startsWith("http")
                                  ? team.logo_url
                                  : `http://localhost:8000${team.logo_url}`
                              }
                              alt={team.name}
                              className="w-full h-full object-cover relative z-10"
                            />
                          ) : (
                            <span className="relative z-10">
                              {team.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div
                          className="cursor-pointer"
                          onClick={() => navigate(`/teams/${team.id}`)}
                        >
                          <span className="block font-bold text-white tracking-tight hover:text-blue-400 transition-colors">
                            {team.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 uppercase tracking-tighter text-slate-500 text-xs font-mono">
                      {team.id.toString().slice(0, 12)}...
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/teams/${team.id}`)}
                          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
                          title="View Dashboard"
                        >
                          <FiActivity size={16} />
                        </button>
                        {(user?.role === UserRoles.SUPER_ADMIN ||
                          user?.role === UserRoles.TOURNAMENT_ADMIN) && (
                          <>
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setCurrentTeam(team);
                                setModalCompetitionId(selectedCompetition.id);
                                setShowModal(true);
                              }}
                              className="p-2.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => confirmDelete(team.id)}
                              className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
        isLoading={isDeleting}
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
