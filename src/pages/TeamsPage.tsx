import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiSearch,
  FiAward,
  FiFilter,
} from "react-icons/fi";
import { teamService } from "../services/teamService";
import { tournamentService } from "../services/tournamentService";
import type { Team, CreateTeamDto, Tournament } from "../types";

export const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTournament, setFilterTournament] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, tournamentsData] = await Promise.all([
        teamService.getAll(),
        tournamentService.getAll(),
      ]);
      setTeams(teamsData);
      setTournaments(tournamentsData);
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
    } catch (err) {
      console.error("Failed to save team", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await teamService.delete(id.toString());
        fetchData();
      } catch (err) {
        console.error("Failed to delete team", err);
      }
    }
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterTournament === "all" ||
      team.tournament_id.toString() === filterTournament;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Teams</h1>
          <p className="text-slate-400">
            Manage teams and assign them to tournaments.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setCurrentTeam({
              name: "",
              year: new Date().getFullYear(),
              batch: "",
              tournament_id: tournaments[0]?.id,
            });
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams..."
              className="input pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="input pl-10 h-11 appearance-none"
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
            >
              <option value="all">All Tournaments</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id.toString()}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="card flex items-center justify-between p-3">
          <div>
            <p className="text-xs text-slate-400">Total Teams</p>
            <p className="text-lg font-bold text-white">{teams.length}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FiUsers />
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
                    Team Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tournament
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredTeams.map((team) => (
                  <tr
                    key={team.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 font-bold">
                          {team.name.charAt(0)}
                        </div>
                        <span className="font-medium text-white">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                        <FiAward size={12} />
                        {tournaments.find((t) => t.id === team.tournament_id)
                          ?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{team.batch}</td>
                    <td className="px-6 py-4 text-slate-300">{team.year}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setCurrentTeam(team);
                            setShowModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
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
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                {isEditing ? "Edit Team" : "Add New Team"}
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="label">Team Name</label>
                  <input
                    required
                    type="text"
                    className="input"
                    value={currentTeam.name || ""}
                    onChange={(e) =>
                      setCurrentTeam({ ...currentTeam, name: e.target.value })
                    }
                    placeholder="e.g. Red Warriors"
                  />
                </div>
                <div>
                  <label className="label">Tournament</label>
                  <select
                    required
                    className="input"
                    value={currentTeam.tournament_id || ""}
                    onChange={(e) =>
                      setCurrentTeam({
                        ...currentTeam,
                        tournament_id: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="" disabled>
                      Select a tournament
                    </option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Batch</label>
                    <input
                      required
                      type="text"
                      className="input"
                      value={currentTeam.batch || ""}
                      onChange={(e) =>
                        setCurrentTeam({
                          ...currentTeam,
                          batch: e.target.value,
                        })
                      }
                      placeholder="e.g. 2024"
                    />
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <input
                      required
                      type="number"
                      className="input"
                      value={currentTeam.year || ""}
                      onChange={(e) =>
                        setCurrentTeam({
                          ...currentTeam,
                          year: parseInt(e.target.value),
                        })
                      }
                    />
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
                    {isEditing ? "Save Changes" : "Add Team"}
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
