import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiSearch,
  FiChevronRight,
  FiAward,
} from "react-icons/fi";
import { tournamentService } from "../services/tournamentService";
import { ImageUpload } from "../components/ImageUpload";
import type { Tournament, CreateTournamentDto } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTournament, setCurrentTournament] = useState<
    Partial<Tournament>
  >({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getAll();
      setTournaments(data);
    } catch (err) {
      console.error("Failed to fetch tournaments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentTournament.id) {
        await tournamentService.update(
          currentTournament.id.toString(),
          currentTournament as CreateTournamentDto,
        );
      } else {
        await tournamentService.create(
          currentTournament as CreateTournamentDto,
        );
      }
      setShowModal(false);
      fetchTournaments();
      setCurrentTournament({});
    } catch (err) {
      console.error("Failed to save tournament", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this tournament?")) {
      try {
        await tournamentService.delete(id.toString());
        fetchTournaments();
      } catch (err) {
        console.error("Failed to delete tournament", err);
      }
    }
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight">
            Tournaments
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            Create and manage your competitive football leagues.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setCurrentTournament({
              name: "",
              year: new Date().getFullYear(),
              type: "league",
            });
            setShowModal(true);
          }}
          className="btn btn-primary h-12"
        >
          <FiPlus /> New Tournament
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Filter by name..."
              className="input pl-12 h-14 bg-slate-800/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="card flex items-center justify-between p-4 px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Total Active
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

      {/* Main Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament, i) => (
            <div
              key={tournament.id}
              className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                (i % 4) + 1
              } relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setCurrentTournament(tournament);
                      setShowModal(true);
                    }}
                    className="p-2.5 bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(tournament.id)}
                    className="p-2.5 bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-900/50 flex items-center justify-center text-blue-400 mb-6 border border-slate-700/50 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                  {tournament.image_url ? (
                    <img
                      src={
                        tournament.image_url.startsWith("http")
                          ? tournament.image_url
                          : `http://localhost:8000${tournament.image_url}`
                      }
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
                <div className="flex items-center gap-4 text-xs font-bold mb-8">
                  <span className="flex items-center gap-1.5 text-slate-400 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800">
                    <FiCalendar className="text-blue-500" /> {tournament.year}
                  </span>
                  <span className="capitalize px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-600/20">
                    {tournament.type.replace("_", " ")}
                  </span>
                </div>

                <div className="pt-6 border-t border-slate-700/50 flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-xl bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400"
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <button className="flex items-center gap-1.5 text-sm font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">
                    Dashboard <FiChevronRight />
                  </button>
                </div>
              </div>
              <div className="h-1 w-full bg-blue-600/10 group-hover:bg-blue-600/40 transition-colors" />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowModal(false)}
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
                    {isEditing ? "Edit Config" : "New Tournament"}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Setup league parameters
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreate}
                className="space-y-6 modal-content pr-2"
              >
                <div>
                  <label className="label">Display Name</label>
                  <input
                    required
                    type="text"
                    className="input h-12"
                    value={currentTournament.name || ""}
                    onChange={(e) =>
                      setCurrentTournament({
                        ...currentTournament,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. AFC Champions League"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Season Year</label>
                    <input
                      required
                      type="number"
                      className="input h-12"
                      value={currentTournament.year || ""}
                      onChange={(e) =>
                        setCurrentTournament({
                          ...currentTournament,
                          year: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Format</label>
                    <select
                      className="input h-12 appearance-none"
                      value={currentTournament.type || "league"}
                      onChange={(e) =>
                        setCurrentTournament({
                          ...currentTournament,
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
                  label="Tournament Poster"
                  value={currentTournament.image_url}
                  onChange={(url) =>
                    setCurrentTournament({
                      ...currentTournament,
                      image_url: url,
                    })
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
                    {isEditing ? "Update" : "Launch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
