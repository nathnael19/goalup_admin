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
import type { Player, CreatePlayerDto, Team } from "../types";

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

  const handleDelete = async (id: number) => {
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
    const matchesFilter =
      filterTeam === "all" || player.team_id.toString() === filterTeam;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            Players
          </h1>
          <p className="text-slate-400">
            Manage player profiles, stats and team assignments.
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
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Player
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search players..."
              className="input pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="input pl-10 h-11 appearance-none"
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
        <div className="card flex items-center justify-between p-3">
          <div>
            <p className="text-xs text-slate-400">Active Players</p>
            <p className="text-lg font-bold text-white">{players.length}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FiActivity />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 font-bold overflow-hidden">
                            {player.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                            {player.jersey_number}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {player.name}
                          </div>
                          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                            {player.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 font-medium">
                        {teams.find((t) => t.id === player.team_id)?.name ||
                          "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 uppercase">
                            Goals
                          </span>
                          <span className="text-blue-400 font-bold text-sm">
                            {player.goals}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-slate-700" />
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 uppercase">
                            Yellow
                          </span>
                          <span className="text-yellow-400 font-bold text-sm">
                            {player.yellow_cards}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-slate-700" />
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 uppercase">Red</span>
                          <span className="text-red-400 font-bold text-sm">
                            {player.red_cards}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setCurrentPlayer(player);
                            setShowModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(player.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                {isEditing ? "Edit Player Profile" : "Add New Player"}
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Full Name</label>
                    <input
                      required
                      type="text"
                      className="input"
                      value={currentPlayer.name || ""}
                      onChange={(e) =>
                        setCurrentPlayer({
                          ...currentPlayer,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Lionel Messi"
                    />
                  </div>
                  <div>
                    <label className="label">Team</label>
                    <select
                      required
                      className="input"
                      value={currentPlayer.team_id || ""}
                      onChange={(e) =>
                        setCurrentPlayer({
                          ...currentPlayer,
                          team_id: parseInt(e.target.value),
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
                    <label className="label">Jersey Number</label>
                    <input
                      required
                      type="number"
                      className="input"
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
                    <label className="label">Position</label>
                    <select
                      className="input"
                      value={currentPlayer.position || "ST"}
                      onChange={(e) =>
                        setCurrentPlayer({
                          ...currentPlayer,
                          position: e.target.value,
                        })
                      }
                    >
                      <optgroup label="Goalkeeper">
                        <option value="GK">Goalkeeper (GK)</option>
                      </optgroup>
                      <optgroup label="Defenders">
                        <option value="CB">Center Back (CB)</option>
                        <option value="RB">Right Back (RB)</option>
                        <option value="LB">Left Back (LB)</option>
                      </optgroup>
                      <optgroup label="Midfielders">
                        <option value="CDM">Defensive Mid (CDM)</option>
                        <option value="CM">Central Mid (CM)</option>
                        <option value="CAM">Attacking Mid (CAM)</option>
                      </optgroup>
                      <optgroup label="Forwards">
                        <option value="ST">Striker (ST)</option>
                        <option value="LW">Left Wing (LW)</option>
                        <option value="RW">Right Wing (RW)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-4 border-t border-slate-700">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Player Stats
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">
                          Goals
                        </label>
                        <input
                          type="number"
                          className="input h-10"
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
                        <label className="text-xs text-slate-400 mb-1 block">
                          Yellow
                        </label>
                        <input
                          type="number"
                          className="input h-10"
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
                        <label className="text-xs text-slate-400 mb-1 block">
                          Red
                        </label>
                        <input
                          type="number"
                          className="input h-10"
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
                    {isEditing ? "Update Player" : "Create Player"}
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
