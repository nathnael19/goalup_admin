import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiShield,
  FiActivity,
} from "react-icons/fi";
import { playerService } from "../services/playerService";
import { teamService } from "../services/teamService";
import { ImageUpload } from "../components/ImageUpload";
import type { Player, CreatePlayerDto, Team } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

export const PlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Partial<Player>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [playersData, teamsData] = await Promise.all([
        playerService.getAll(),
        teamService.getAll(),
      ]);
      setPlayers(playersData);
      setTeams(teamsData);
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this player?")) {
      try {
        await playerService.delete(id.toString());
        fetchData();
      } catch (err) {
        console.error("Failed to delete player", err);
      }
    }
  };

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterTeam === "all" || player.team_id === filterTeam;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight">
            Roster Management
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            Add players, assign numbers, and track individual performance.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setCurrentPlayer({
              name: "",
              team_id: teams[0]?.id,
              position: "ST",
              jersey_number: 10,
            });
            setShowModal(true);
          }}
          className="btn btn-primary h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          <FiPlus /> New Player
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div>
          <div className="relative">
            <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              className="input pl-12 h-12 appearance-none bg-slate-800/40 border-slate-800"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id.toString()}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="card flex items-center justify-between p-4 px-6 bg-purple-600/5 border-purple-600/10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Active
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
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
                          src={
                            player.image_url.startsWith("http")
                              ? player.image_url
                              : `http://localhost:8000${player.image_url}`
                          }
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
                        setShowModal(true);
                      }}
                      className="p-2.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-purple-600/5 pointer-events-none" />
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
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
                  <div>
                    <label className="label">Current Team</label>
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
                    >
                      <option value="" disabled>
                        Select Team
                      </option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                          position: e.target.value,
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
      )}
    </div>
  );
};
