import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiActivity,
  FiAward,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import { playerService } from "../services/playerService";
import { teamService } from "../services/teamService";
import { tournamentService } from "../services/tournamentService";
import { competitionService } from "../services/competitionService";
import { ImageUpload } from "../components/ImageUpload";
import { useAuth } from "../context/AuthContext";
import { UserRoles } from "../types";
import type {
  Player,
  CreatePlayerDto,
  Team,
  Tournament,
  Competition,
} from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { ConfirmationModal } from "../components/common/ConfirmationModal";
import { getFullImageUrl } from "../utils/url";

export const PlayersPage: React.FC = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Partial<Player>>({});

  // Drill-down selection
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  // Modal selection state
  const [selectedCompetitionId, setSelectedCompetitionId] =
    useState<string>("");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterTeamId, setFilterTeamId] = useState<string>("all");

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
      const [playersData, teamsData, tournamentsData, competitionsData] =
        await Promise.all([
          playerService.getAll(),
          teamService.getAll(),
          tournamentService.getAll(),
          competitionService.getAll(),
        ]);
      setPlayers(playersData);
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
      if (isEditing && currentPlayer.id) {
        await playerService.update(
          currentPlayer.id.toString(),
          currentPlayer as CreatePlayerDto,
        );
      } else {
        await playerService.create(currentPlayer as CreatePlayerDto);
      }
      setShowModal(false);
      fetchData();
      setCurrentPlayer({});
    } catch (err) {
      console.error("Failed to save player", err);
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
      await playerService.delete(itemToDelete.toString());
      fetchData();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Failed to delete player", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper: get player count for a competition
  const getCompPlayerCount = (compId: string) => {
    const tourIds = tournaments
      .filter((t) => t.competition_id === compId)
      .map((t) => t.id);
    const teamIds = teams
      .filter((t) => tourIds.includes(t.tournament_id))
      .map((t) => t.id);
    return players.filter((p) => teamIds.includes(p.team_id)).length;
  };

  // Helper: get player count for a tournament
  const getTourPlayerCount = (tourId: string) => {
    const teamIds = teams
      .filter((t) => t.tournament_id === tourId)
      .map((t) => t.id);
    return players.filter((p) => teamIds.includes(p.team_id)).length;
  };

  // Helper: get coach's team context
  const getCoachTeamContext = () => {
    if (user?.role !== UserRoles.COACH || !user.team_id) return null;
    const coachTeamId = user.team_id.toString();
    const team = teams.find((t) => t.id.toString() === coachTeamId);
    if (!team) return null;

    const tour = tournaments.find(
      (t) => t.id.toString() === team.tournament_id.toString(),
    );
    if (!tour) return null;

    return {
      competitionId: (tour.competition_id || "").toString(),
      tournamentId: tour.id.toString(),
      teamId: coachTeamId,
    };
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
              Roster Management
            </h1>
            <p className="text-slate-400 font-medium font-body mt-1">
              Select a competition to manage its player roster.
            </p>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              const context = getCoachTeamContext();
              setCurrentPlayer({
                name: "",
                team_id: context?.teamId || "",
                position: "ST" as any,
                jersey_number: 10,
              });
              setSelectedCompetitionId(context?.competitionId || "");
              setSelectedTournamentId(context?.tournamentId || "");
              setShowModal(true);
            }}
            className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <FiPlus /> New Player
          </button>
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
          <div className="card flex items-center justify-between p-4 px-6 bg-purple-600/5 border-purple-600/10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Total Players
              </p>
              <p className="text-2xl font-black text-white font-display leading-none">
                {players.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-500">
              <FiActivity size={20} />
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
            <p className="text-slate-600 text-sm mt-1">
              Create a competition in the Tournaments page first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComps.map((comp, i) => {
              const playerCount = getCompPlayerCount(comp.id);
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
                      <span className="bg-purple-600/10 text-purple-400 px-2 py-1 rounded-md border border-purple-600/20">
                        {playerCount} Player{playerCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-purple-600/10 group-hover:bg-purple-600/40 transition-colors" />
                </div>
              );
            })}
          </div>
        )}

        {/* Player Modal (accessible from any view) */}
        {renderPlayerModal()}

        {/* Delete Confirmation */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Delete Player"
          message="Are you sure you want to delete this player? This action cannot be undone."
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // ============ VIEW 2: SEASON CARDS ============
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
                Select a season to view its roster.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              const context = getCoachTeamContext();
              setCurrentPlayer({
                name: "",
                team_id: context?.teamId || "",
                position: "ST" as any,
                jersey_number: 10,
              });
              setSelectedCompetitionId(
                context?.competitionId || selectedCompetition.id,
              );
              setSelectedTournamentId(context?.tournamentId || "");
              setShowModal(true);
            }}
            className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <FiPlus /> New Player
          </button>
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
              const playerCount = getTourPlayerCount(season.id);
              const teamCount = teams.filter(
                (t) => t.tournament_id === season.id,
              ).length;
              return (
                <div
                  key={season.id}
                  onClick={() => {
                    setSelectedTournament(season);
                    setSearchTerm("");
                    setFilterPosition("all");
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
                      <span className="bg-slate-800 px-2 py-1 rounded-md">
                        {teamCount} Team{teamCount !== 1 ? "s" : ""}
                      </span>
                      <span className="bg-purple-600/10 text-purple-400 px-2 py-1 rounded-md border border-purple-600/20">
                        {playerCount} Player{playerCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-purple-600/10 group-hover:bg-purple-600/40 transition-colors" />
                </div>
              );
            })}
          </div>
        )}

        {renderPlayerModal()}

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Delete Player"
          message="Are you sure you want to delete this player? This action cannot be undone."
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // ============ VIEW 3: PLAYER CARDS ============
  const seasonTeams = teams.filter(
    (t) => t.tournament_id === selectedTournament.id,
  );
  const seasonTeamIds = seasonTeams.map((t) => t.id);
  const seasonPlayers = players.filter((p) =>
    seasonTeamIds.includes(p.team_id),
  );

  const filteredPlayers = seasonPlayers.filter((player) => {
    const matchesSearch = player.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesTeam =
      filterTeamId === "all" || player.team_id.toString() === filterTeamId;

    if (!matchesSearch || !matchesTeam) return false;

    if (filterPosition === "all") return true;

    const pos = (player.position || "").toLowerCase();
    if (filterPosition === "GK") return pos === "gk";
    if (filterPosition === "DF") return ["cb", "rb", "lb"].includes(pos);
    if (filterPosition === "MF") return ["cm", "cdm", "cam"].includes(pos);
    if (filterPosition === "FW") return ["st", "lw", "rw"].includes(pos);

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button
        onClick={() => {
          setSelectedTournament(null);
          setSearchTerm("");
          setFilterPosition("all");
          setFilterTeamId("all");
        }}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        ← Back to {selectedCompetition.name}
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-purple-500 border border-slate-700">
            <FiCalendar size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white font-display tracking-tight">
              {selectedTournament.name}
            </h1>
            <p className="text-slate-400 font-medium font-body mt-1">
              {selectedCompetition.name} • {selectedTournament.year}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            const context = getCoachTeamContext();
            setCurrentPlayer({
              name: "",
              team_id: context?.teamId || "",
              position: "ST" as any,
              jersey_number: 10,
            });
            setSelectedCompetitionId(
              context?.competitionId || selectedCompetition.id,
            );
            setSelectedTournamentId(
              context?.tournamentId || selectedTournament.id,
            );
            setShowModal(true);
          }}
          className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          <FiPlus /> New Player
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="md:col-span-2">
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
        <div className="relative">
          <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            className="input pl-12 h-12 appearance-none bg-slate-800/40 border-slate-800 w-full"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
          >
            <option value="all">All Positions</option>
            <option value="GK">Goalkeepers</option>
            <option value="DF">Defenders</option>
            <option value="MF">Midfielders</option>
            <option value="FW">Forwards</option>
          </select>
        </div>
        <div className="relative">
          <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            className="input pl-12 h-12 appearance-none bg-slate-800/40 border-slate-800 w-full"
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
          >
            <option value="all">All Teams</option>
            {seasonTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="card flex items-center justify-between p-4 px-6 bg-purple-600/5 border-purple-600/10 h-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight">
              Players
            </p>
            <p className="text-xl font-black text-white font-display leading-tight">
              {filteredPlayers.length} / {seasonPlayers.length}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-purple-500">
            <FiActivity size={16} />
          </div>
        </div>
      </div>

      {/* Player Cards */}
      {filteredPlayers.length === 0 ? (
        <div className="card p-12 text-center">
          <FiActivity className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-500 font-bold">No players found.</p>
          <p className="text-slate-600 text-sm mt-1">
            Try adjusting your filters or add a new player.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player, i) => (
            <div
              key={player.id}
              className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                (i % 4) + 1
              } relative overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 flex items-center justify-center text-blue-400 font-black text-2xl shadow-xl group-hover:scale-110 transition-transform overflow-hidden relative">
                      <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                      {player.image_url ? (
                        <img
                          src={getFullImageUrl(player.image_url)}
                          alt={player.name}
                          className="w-full h-full object-cover relative z-10"
                        />
                      ) : (
                        <span className="relative z-10">
                          {player.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-xs text-white font-black shadow-lg">
                      #{player.jersey_number}
                    </div>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setCurrentPlayer(player);
                        setSelectedCompetitionId(selectedCompetition.id);
                        setSelectedTournamentId(selectedTournament.id);
                        setShowModal(true);
                      }}
                      className="p-2.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => confirmDelete(player.id)}
                      className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-black text-white font-display mb-1 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                    {player.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                      {player.position}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      • {teams.find((t) => t.id === player.team_id)?.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-700/50">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">
                      Goals
                    </p>
                    <p className="text-lg font-black text-white">
                      {player.goals}
                    </p>
                  </div>
                  <div className="text-center border-x border-slate-700/50">
                    <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">
                      Yellow
                    </p>
                    <p className="text-lg font-black text-yellow-500">
                      {player.yellow_cards}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">
                      Red
                    </p>
                    <p className="text-lg font-black text-red-500">
                      {player.red_cards}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-purple-600/5 group-hover:bg-purple-600/40 transition-colors" />
            </div>
          ))}
        </div>
      )}

      {renderPlayerModal()}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Player"
        message="Are you sure you want to delete this player? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );

  // ============ SHARED MODAL ============
  function renderPlayerModal() {
    if (!showModal) return null;

    // Determine available tournaments based on selected competition in modal
    const modalTournaments = selectedCompetitionId
      ? tournaments.filter((t) => t.competition_id === selectedCompetitionId)
      : [];

    // Determine available teams based on selected tournament in modal
    const modalTeams = selectedTournamentId
      ? teams.filter((t) => t.tournament_id === selectedTournamentId)
      : [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setShowModal(false)}
        />
        <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden max-h-[95vh] flex flex-col">
          <div className="absolute inset-0 bg-purple-600/5 pointer-events-none" />

          {/* Modal Header */}
          <div className="p-6 md:p-8 shrink-0 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-500 flex items-center justify-center">
                <FiPlus size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white font-display tracking-tight">
                  {isEditing ? "Modify Stats" : "Add Player"}
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Athlete registration
                </p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="px-6 md:px-8 py-8 modal-content flex-1">
            <form onSubmit={handleCreate} className="space-y-6">
              <ImageUpload
                label="Profile Picture"
                value={currentPlayer.image_url}
                onChange={(url) =>
                  setCurrentPlayer({ ...currentPlayer, image_url: url })
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="label">Full Name</label>
                  <input
                    required
                    type="text"
                    className="input h-12"
                    value={currentPlayer.name || ""}
                    onChange={(e) =>
                      setCurrentPlayer({
                        ...currentPlayer,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Kylian Mbappé"
                  />
                </div>
                {user?.role !== UserRoles.COACH && (
                  <>
                    <div className="md:col-span-2 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">League / Tournament</label>
                          <select
                            className="input h-12 appearance-none"
                            value={selectedCompetitionId}
                            onChange={(e) => {
                              setSelectedCompetitionId(e.target.value);
                              setSelectedTournamentId("");
                              setCurrentPlayer({
                                ...currentPlayer,
                                team_id: "",
                              });
                            }}
                          >
                            <option value="" disabled>
                              Select a tournament
                            </option>
                            {competitions.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="label">Season</label>
                          <select
                            className="input h-12 appearance-none"
                            value={selectedTournamentId}
                            onChange={(e) => {
                              setSelectedTournamentId(e.target.value);
                              setCurrentPlayer({
                                ...currentPlayer,
                                team_id: "",
                              });
                            }}
                            disabled={!selectedCompetitionId}
                          >
                            <option value="" disabled>
                              {selectedCompetitionId
                                ? "Select a season"
                                : "Select a league first"}
                            </option>
                            {modalTournaments.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.year})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="label">Team</label>
                        <select
                          required
                          className="input h-12 appearance-none"
                          value={currentPlayer.team_id || ""}
                          onChange={(e) =>
                            setCurrentPlayer({
                              ...currentPlayer,
                              team_id: e.target.value,
                            })
                          }
                          disabled={!selectedTournamentId}
                        >
                          <option value="" disabled>
                            {selectedTournamentId
                              ? "Select Team"
                              : "Select a season first"}
                          </option>
                          {modalTeams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="label">Squad Number</label>
                  <input
                    required
                    type="number"
                    className="input h-12"
                    value={currentPlayer.jersey_number || ""}
                    onChange={(e) =>
                      setCurrentPlayer({
                        ...currentPlayer,
                        jersey_number: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">On-Field Position</label>
                  <select
                    className="input h-12 appearance-none"
                    value={currentPlayer.position || "ST"}
                    onChange={(e) =>
                      setCurrentPlayer({
                        ...currentPlayer,
                        position: e.target.value as any,
                      })
                    }
                  >
                    <optgroup label="Core Skills">
                      <option value="GK">Goalkeeper (GK)</option>
                      <option value="CB">Center Back (CB)</option>
                      <option value="CM">Central Mid (CM)</option>
                      <option value="ST">Striker (ST)</option>
                    </optgroup>
                    <optgroup label="Wide / Support">
                      <option value="LB">Left Back (LB)</option>
                      <option value="RB">Right Back (RB)</option>
                      <option value="LW">Left Wing (LW)</option>
                      <option value="RW">Right Wing (RW)</option>
                      <option value="CAM">Playmaker (CAM)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="pt-6 border-t border-slate-700/50">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    Live Performance Stats
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">
                        Goals
                      </label>
                      <input
                        type="number"
                        className="input h-12 text-center text-lg font-black"
                        value={currentPlayer.goals || 0}
                        disabled={user?.role === UserRoles.COACH}
                        onChange={(e) =>
                          setCurrentPlayer({
                            ...currentPlayer,
                            goals: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">
                        Yellow
                      </label>
                      <input
                        type="number"
                        className="input h-12 text-center text-lg font-black text-yellow-500"
                        value={currentPlayer.yellow_cards || 0}
                        disabled={user?.role === UserRoles.COACH}
                        onChange={(e) =>
                          setCurrentPlayer({
                            ...currentPlayer,
                            yellow_cards: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">
                        Red
                      </label>
                      <input
                        type="number"
                        className="input h-12 text-center text-lg font-black text-red-500"
                        value={currentPlayer.red_cards || 0}
                        disabled={user?.role === UserRoles.COACH}
                        onChange={(e) =>
                          setCurrentPlayer({
                            ...currentPlayer,
                            red_cards: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1 h-12"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 h-12">
                  {isEditing ? "Sync Data" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
};
