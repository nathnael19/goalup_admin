import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiChevronRight,
  FiAward,
  FiZap,
  FiAlertTriangle,
} from "react-icons/fi";
import { tournamentService } from "../services/tournamentService";
import { competitionService } from "../services/competitionService";
import { matchService } from "../services/matchService";
import { ImageUpload } from "../components/ImageUpload";
import { KnockoutBracket } from "../components/KnockoutBracket";
import type {
  Tournament,
  CreateTournamentDto,
  Competition,
  Match,
} from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { ConfirmationModal } from "../components/common/ConfirmationModal";

export const TournamentsPage: React.FC = () => {
  // "Tournaments" in UI = Competitions in Backend
  // "Seasons" in UI = Tournaments in Backend

  const [seasons, setSeasons] = useState<Tournament[]>([]);
  const [tournaments, setTournaments] = useState<Competition[]>([]); // These are Competitions
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedTournament, setSelectedTournament] =
    useState<Competition | null>(null);
  const [activeSeason, setActiveSeason] = useState<Tournament | null>(null);
  const [seasonMatches, setSeasonMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Modals
  const [showTournamentModal, setShowTournamentModal] = useState(false); // Create Competition
  const [showSeasonModal, setShowSeasonModal] = useState(false); // Create Tournament

  const [isEditing, setIsEditing] = useState(false);

  // Forms
  const [newTournament, setNewTournament] = useState({
    name: "",
    description: "",
    image_url: "",
  });

  const [currentSeason, setCurrentSeason] = useState<Partial<Tournament>>({});

  const [searchTerm, setSearchTerm] = useState("");

  // Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"tournament" | "season" | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seasonsData, tournamentsData] = await Promise.all([
        tournamentService.getAll(),
        competitionService.getAll(),
      ]);
      setSeasons(seasonsData);
      setTournaments(tournamentsData);

      // Refresh active season if it exists
      if (activeSeason) {
        const updated = seasonsData.find((s) => s.id === activeSeason.id);
        if (updated) setActiveSeason(updated || null);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasonMatches = async (seasonId: string) => {
    try {
      setLoadingMatches(true);
      const data = await matchService.getAll({ tournament_id: seasonId });
      setSeasonMatches(data);
    } catch (err) {
      console.error("Failed to fetch matches", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (activeSeason) {
      fetchSeasonMatches(activeSeason.id);
    }
  }, [activeSeason]);

  // --- HANDLERS ---

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await competitionService.create(newTournament);
      setShowTournamentModal(false);
      setNewTournament({ name: "", description: "", image_url: "" });
      fetchData();
    } catch (err) {
      console.error("Failed to create tournament", err);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentSeason.id) {
        await tournamentService.update(
          currentSeason.id.toString(),
          currentSeason as CreateTournamentDto,
        );
      } else {
        await tournamentService.create(currentSeason as CreateTournamentDto);
      }
      setShowSeasonModal(false);
      fetchData();
      setCurrentSeason({});
    } catch (err) {
      console.error("Failed to save season", err);
    }
  };

  const confirmDelete = (id: string, type: "tournament" | "season") => {
    setItemToDelete(id);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    try {
      setIsDeleting(true);
      if (deleteType === "season") {
        await tournamentService.delete(itemToDelete);
      } else {
        await competitionService.delete(itemToDelete);
      }
      fetchData();
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType(null);
    } catch (err) {
      console.error("Failed to delete item", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSeasons = seasons.filter((s) => {
    if (selectedTournament) {
      return s.competition_id === selectedTournament.id;
    }
    return false;
  });

  // --- VIEWS ---

  if (!selectedTournament) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white font-display tracking-tight">
              Tournaments
            </h1>
            <p className="text-slate-400 font-medium font-body mt-1">
              Your main leagues and cup competitions.
            </p>
          </div>
          <button
            onClick={() => {
              setNewTournament({ name: "", description: "", image_url: "" });
              setShowTournamentModal(true);
            }}
            className="btn btn-primary h-12"
          >
            <FiPlus /> New Tournament
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="relative group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Filter tournaments..."
                className="input pl-12 h-14 bg-slate-800/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card flex items-center justify-between p-4 px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Active Leagues
              </p>
              <p className="text-2xl font-black text-white font-display leading-none">
                {tournaments.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-inner">
              <FiAward size={24} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament, i) => {
              const seasonCount = seasons.filter(
                (s) => s.competition_id === tournament.id,
              ).length;
              return (
                <div
                  key={tournament.id}
                  className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                    (i % 4) + 1
                  } relative overflow-hidden cursor-pointer`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(tournament.id, "tournament"); // Using 'tournament' to delete Competition as per TournamentsPage logic
                        }}
                        className="p-2.5 bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div
                    className="p-8"
                    onClick={() => setSelectedTournament(tournament)}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/50 flex items-center justify-center text-blue-400 mb-6 border border-slate-700/50 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                      {tournament.image_url ? (
                        <img
                          src={tournament.image_url}
                          alt={tournament.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiAward size={28} />
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 font-display tracking-tight">
                      {tournament.name}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-6">
                      {tournament.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span className="bg-slate-800 px-2 py-1 rounded-md">
                        {seasonCount} Seasons
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-blue-600/10 group-hover:bg-blue-600/40 transition-colors" />
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Delete Tournament"
          message="Are you sure you want to delete this tournament? All seasons and data within it will be permanently removed."
          isLoading={isDeleting}
        />

        {/* Create Tournament Modal */}
        {showTournamentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => setShowTournamentModal(false)}
            />
            <div className="relative glass-panel bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-500">
              <div className="p-8">
                <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">
                  New Tournament
                </h2>
                <form onSubmit={handleCreateTournament} className="space-y-6">
                  <div>
                    <label className="label">Tournament Name</label>
                    <input
                      required
                      type="text"
                      className="input h-12"
                      placeholder="e.g. Premier League"
                      value={newTournament.name}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Description (Optional)</label>
                    <textarea
                      className="input py-3 min-h-[100px]"
                      placeholder="Short summary..."
                      value={newTournament.description}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <ImageUpload
                    label="Logo (Optional)"
                    value={newTournament.image_url}
                    onChange={(url) =>
                      setNewTournament({
                        ...newTournament,
                        image_url: url,
                      })
                    }
                  />
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowTournamentModal(false)}
                      className="btn btn-secondary flex-1 h-12"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 h-12"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button
        onClick={() => {
          if (activeSeason) {
            setActiveSeason(null);
          } else {
            setSelectedTournament(null);
          }
        }}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        ← Back to {activeSeason ? "Seasons" : "Tournaments"}
      </button>

      {activeSeason ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20">
                <FiAward size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white font-display tracking-tight">
                  {activeSeason.name}
                </h1>
                <p className="text-slate-400 font-medium font-body mt-1">
                  Season Dashboard & Controls
                </p>
              </div>
            </div>
            {activeSeason.type === "knockout" && seasonMatches.length === 0 && (
              <button
                onClick={async () => {
                  try {
                    await tournamentService.generateKnockout(activeSeason.id, {
                      start_date: new Date().toISOString(),
                      matches_per_day: 2,
                      interval_days: 1,
                      total_time: 90,
                      stage_interval_days: 7,
                      generate_third_place: false,
                    });
                    fetchSeasonMatches(activeSeason.id);
                  } catch (err) {
                    console.error("Failed to generate bracket", err);
                  }
                }}
                className="btn btn-primary h-12 gap-2"
              >
                <FiZap /> Generate Bracket
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {activeSeason.type === "knockout" ? (
              <div className="card p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    Tournament Bracket
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
                    Elimination Format
                  </div>
                </div>
                {loadingMatches ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : seasonMatches.length > 0 ? (
                  <KnockoutBracket matches={seasonMatches} />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center opacity-50 border border-dashed border-white/10 rounded-3xl">
                    <FiAlertTriangle
                      size={48}
                      className="mb-4 text-amber-500"
                    />
                    <p className="text-white font-black uppercase tracking-widest text-sm">
                      No Bracket Generated
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Add teams to the tournament first, then generate the
                      bracket.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-20 text-center opacity-50">
                <p className="font-black uppercase tracking-[0.3em] text-slate-500">
                  League Standings View
                </p>
                <p className="text-xs mt-2 italic text-slate-600">
                  Coming soon in the unified season dashboard...
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
                {selectedTournament.image_url ? (
                  <img
                    src={selectedTournament.image_url}
                    alt={selectedTournament.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <FiAward size={32} />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-black text-white font-display tracking-tight">
                  {selectedTournament.name}
                </h1>
                <p className="text-slate-400 font-medium font-body mt-1">
                  Manage seasons and configurations.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentSeason({
                  name: "",
                  year: new Date().getFullYear(),
                  type: "league",
                  competition_id: selectedTournament.id,
                });
                setShowSeasonModal(true);
              }}
              className="btn btn-primary h-12"
            >
              <FiPlus /> New Season
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeasons.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <p className="text-slate-500 font-medium">
                  No seasons found for this tournament.
                </p>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentSeason({
                      name: "",
                      year: new Date().getFullYear(),
                      type: "league",
                      competition_id: selectedTournament.id,
                    });
                    setShowSeasonModal(true);
                  }}
                  className="text-blue-500 font-bold mt-2 hover:underline"
                >
                  Create the first Season
                </button>
              </div>
            ) : (
              filteredSeasons.map((season, i) => (
                <div
                  key={season.id}
                  className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                    (i % 4) + 1
                  } relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setCurrentSeason(season);
                          setShowSeasonModal(true);
                        }}
                        className="p-2.5 bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete(season.id, "season")}
                        className="p-2.5 bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

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

                    <div className="pt-6 border-t border-slate-700/50 flex items-center justify-between mt-auto">
                      <button
                        onClick={() => setActiveSeason(season)}
                        className="flex items-center gap-1.5 text-sm font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                      >
                        Dashboard <FiChevronRight />
                      </button>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-blue-600/10 group-hover:bg-blue-600/40 transition-colors" />
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Create/Edit Season Modal */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowSeasonModal(false)}
          />
          <div className="relative glass-panel bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden max-h-[95vh] flex flex-col">
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <div className="p-6 md:p-8 overflow-hidden flex flex-col">
              <div className="flex items-center gap-4 mb-6 shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center">
                  <FiPlus size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white font-display tracking-tight">
                    {isEditing ? "Edit Season" : "New Season"}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    {selectedTournament?.name}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateSeason}
                className="space-y-6 modal-content pr-2"
              >
                <div>
                  <label className="label">Season Name</label>
                  <input
                    required
                    type="text"
                    className="input h-12"
                    value={currentSeason.name || ""}
                    onChange={(e) =>
                      setCurrentSeason({
                        ...currentSeason,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. 2025/2026"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Year</label>
                    <input
                      required
                      type="number"
                      className="input h-12"
                      value={currentSeason.year || ""}
                      onChange={(e) =>
                        setCurrentSeason({
                          ...currentSeason,
                          year: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Format</label>
                    <select
                      className="input h-12 appearance-none"
                      value={currentSeason.type || "league"}
                      onChange={(e) =>
                        setCurrentSeason({
                          ...currentSeason,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="league">Pure League</option>
                      <option value="knockout">Direct Knockout</option>
                      <option value="group_knockout">Champions Format</option>
                    </select>
                  </div>
                </div>

                <ImageUpload
                  label="Season Poster (Optional)"
                  value={currentSeason.image_url}
                  onChange={(url) =>
                    setCurrentSeason({
                      ...currentSeason,
                      image_url: url,
                    })
                  }
                />

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowSeasonModal(false)}
                    className="btn btn-secondary flex-1 h-12"
                  >
                    Discard
                  </button>
                  <button type="submit" className="btn btn-primary flex-1 h-12">
                    {isEditing ? "Update" : "Launch Season"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};
