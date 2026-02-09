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
import type { Tournament, CreateTournamentDto } from "../types";

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

  const handleDelete = async (id: number) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            Tournaments
          </h1>
          <p className="text-slate-400">
            Manage all your football tournaments from here.
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
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus /> Create Tournament
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tournaments..."
              className="input pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="card flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-slate-400">Total</p>
            <p className="text-xl font-bold text-white">{tournaments.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FiAward />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="card group hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-blue-400">
                    <FiAward size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setCurrentTournament(tournament);
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tournament.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  {tournament.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="text-blue-400" /> {tournament.year}
                  </span>
                  <span className="capitalize px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    {tournament.type}
                  </span>
                </div>

                <div className="pt-6 border-t border-slate-700 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-800"
                      />
                    ))}
                  </div>
                  <button className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Manage <FiChevronRight />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                {isEditing ? "Edit Tournament" : "New Tournament"}
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="label">Tournament Name</label>
                  <input
                    required
                    type="text"
                    className="input"
                    value={currentTournament.name || ""}
                    onChange={(e) =>
                      setCurrentTournament({
                        ...currentTournament,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Summer League 2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Year</label>
                    <input
                      required
                      type="number"
                      className="input"
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
                    <label className="label">Type</label>
                    <select
                      className="input"
                      value={currentTournament.type || "league"}
                      onChange={(e) =>
                        setCurrentTournament({
                          ...currentTournament,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="league">League</option>
                      <option value="knockout">Knockout</option>
                      <option value="group_knockout">Group + Knockout</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors font-bold"
                  >
                    {isEditing ? "Save Changes" : "Create Tournament"}
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
