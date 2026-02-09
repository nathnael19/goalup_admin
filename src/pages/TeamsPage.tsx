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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white font-display tracking-tight">
            Club Management
          </h1>
          <p className="text-slate-400 font-medium">
            Register clubs, assign them to leagues, and manage identities.
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
          className="btn btn-primary h-12"
        >
          <FiPlus /> Add Team
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
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              className="input pl-12 h-12 appearance-none bg-slate-800/40 border-slate-800"
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
        <div className="card flex items-center justify-between p-4 px-6 border-slate-800 bg-slate-800/20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Registered
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card overflow-hidden border-slate-800/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Team Profile
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Active League
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                    Batch / Year
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTeams.map((team) => (
                  <tr
                    key={team.id}
                    className="hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700/50 flex items-center justify-center text-blue-500 font-black text-lg shadow-inner group-hover:scale-110 transition-transform">
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold text-white tracking-tight">
                            {team.name}
                          </span>
                          <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">
                            ID: {team.id.toString().slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-400 text-xs font-bold whitespace-nowrap">
                        <FiAward size={14} />
                        {tournaments.find((t) => t.id === team.tournament_id)
                          ?.name || "Not Assigned"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-300">
                          {team.batch}
                        </span>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          {team.year}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setCurrentTeam(team);
                            setShowModal(true);
                          }}
                          className="p-2.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
                          className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
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
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8">
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
                  <label className="label">Primary League</label>
                  <select
                    required
                    className="input h-12 appearance-none"
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
                    <label className="label">Batch Code</label>
                    <input
                      required
                      type="text"
                      className="input h-12"
                      value={currentTeam.batch || ""}
                      onChange={(e) =>
                        setCurrentTeam({
                          ...currentTeam,
                          batch: e.target.value,
                        })
                      }
                      placeholder="e.g. A-24"
                    />
                  </div>
                  <div>
                    <label className="label">Founder Year</label>
                    <input
                      required
                      type="number"
                      className="input h-12"
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
      )}
    </div>
  );
};
