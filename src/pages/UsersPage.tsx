import React, { useState, useEffect, useMemo } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUser,
  FiShield,
  FiMail,
  FiKey,
  FiHash,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";
import { userService } from "../services/userService";
import { teamService } from "../services/teamService";
import { tournamentService } from "../services/tournamentService";
import { competitionService } from "../services/competitionService";
import { UserRoles } from "../types";
import type {
  User,
  Team,
  Tournament,
  UserCreateDto,
  UserUpdateDto,
  UserRole,
  Competition,
} from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { ConfirmationModal } from "../components/common/ConfirmationModal";

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState<UserCreateDto & { id?: number }>({
    email: "",
    full_name: "",
    password: "",
    role: UserRoles.VIEWER,
    team_id: "",
    tournament_id: "",
    competition_id: "",
  });

  // Filter State
  const [filters, setFilters] = useState({
    role: "" as UserRole | "",
    competition_id: "",
    tournament_id: "",
    team_id: "",
  });

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, teamsData, tournamentsData, competitionsData] =
        await Promise.all([
          userService.getAll(),
          teamService.getAll(),
          tournamentService.getAll(),
          competitionService.getAll(),
        ]);
      setUsers(usersData);
      setTeams(teamsData);
      setTournaments(tournamentsData);
      setCompetitions(competitionsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = useMemo(() => {
    if (!formData.competition_id) return [];
    return tournaments.filter(
      (t) => t.competition_id === formData.competition_id,
    );
  }, [formData.competition_id, tournaments]);

  const filteredTeams = useMemo(() => {
    if (!formData.tournament_id) return [];
    return teams.filter((t) => t.tournament_id === formData.tournament_id);
  }, [formData.tournament_id, teams]);

  // Filters Dropdowns Data
  const filterTournaments = useMemo(() => {
    if (!filters.competition_id) return tournaments;
    return tournaments.filter(
      (t) => t.competition_id === filters.competition_id,
    );
  }, [filters.competition_id, tournaments]);

  const filterTeams = useMemo(() => {
    if (!filters.tournament_id) return teams;
    return teams.filter((t) => t.tournament_id === filters.tournament_id);
  }, [filters.tournament_id, teams]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.team_id === "") delete data.team_id;
      if (data.tournament_id === "") delete data.tournament_id;
      if (data.competition_id === "") delete data.competition_id;

      if (isEditing && selectedUser) {
        const updateData: UserUpdateDto = {
          email: data.email,
          full_name: data.full_name,
          role: data.role as UserRole,
          team_id: data.team_id,
          tournament_id: data.tournament_id,
          competition_id: data.competition_id,
        };
        if (data.password) updateData.password = data.password;
        await userService.update(selectedUser.id, updateData);
      } else {
        await userService.create(data as UserCreateDto);
      }
      setShowUserModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save user", err);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await userService.delete(userToDelete);
      fetchData();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Failed to delete user", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: "", // Don't show password
      role: user.role as UserRole,
      team_id: user.team_id || "",
      tournament_id: user.tournament_id || "",
      competition_id: user.competition_id || "",
    });
    setShowUserModal(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !filters.role || u.role === filters.role;
    const matchesCompetition =
      !filters.competition_id || u.competition_id === filters.competition_id;
    const matchesTournament =
      !filters.tournament_id || u.tournament_id === filters.tournament_id;
    const matchesTeam = !filters.team_id || u.team_id === filters.team_id;

    return (
      matchesSearch &&
      matchesRole &&
      matchesCompetition &&
      matchesTournament &&
      matchesTeam
    );
  });

  const getRoleBadge = (role: string) => {
    const roles: Record<string, string> = {
      SUPER_ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
      TOURNAMENT_ADMIN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      COACH: "bg-green-500/10 text-green-500 border-green-500/20",
      REFEREE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      NEWS_REPORTER: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      VIEWER: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
          roles[role] || roles.VIEWER
        }`}
      >
        {role.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight">
            User Management
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            Create and manage administrative accounts and roles.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setFormData({
              email: "",
              full_name: "",
              password: "",
              role: UserRoles.VIEWER,
              team_id: "",
              tournament_id: "",
              competition_id: "",
            });
            setShowUserModal(true);
          }}
          className="btn btn-primary h-12"
        >
          <FiPlus /> New User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="input pl-12 h-14 bg-slate-800/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <select
                  className="input h-10 text-xs appearance-none pl-3"
                  value={filters.role}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      role: e.target.value as UserRole | "",
                    })
                  }
                >
                  <option value="">All Roles</option>
                  {Object.values(UserRoles).map((role) => (
                    <option key={role} value={role}>
                      {role.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  className="input h-10 text-xs appearance-none pl-3"
                  value={filters.competition_id}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      competition_id: e.target.value,
                      tournament_id: "",
                      team_id: "",
                    })
                  }
                >
                  <option value="">All Competitions</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  className="input h-10 text-xs appearance-none pl-3"
                  value={filters.tournament_id}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      tournament_id: e.target.value,
                      team_id: "",
                    })
                  }
                >
                  <option value="">All Seasons</option>
                  {filterTournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  className="input h-10 text-xs appearance-none pl-3"
                  value={filters.team_id}
                  onChange={(e) =>
                    setFilters({ ...filters, team_id: e.target.value })
                  }
                >
                  <option value="">All Teams</option>
                  {filterTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  setFilters({
                    role: "",
                    competition_id: "",
                    tournament_id: "",
                    team_id: "",
                  })
                }
                className="btn btn-ghost h-10 text-xs text-slate-400 hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        <div className="card flex items-center justify-between p-4 px-6 h-fit self-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Total Users
            </p>
            <p className="text-2xl font-black text-white font-display leading-none">
              {users.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-inner">
            <FiUsers size={24} />
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
          {filteredUsers.map((user, i) => (
            <div
              key={user.id}
              className={`card card-hover group animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${
                (i % 4) + 1
              } relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-2.5 bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  {!user.is_superuser && (
                    <button
                      onClick={() => {
                        setUserToDelete(user.id);
                        setShowDeleteModal(true);
                      }}
                      className="p-2.5 bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/50 transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-500 font-bold text-xl">
                    {user.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white font-display tracking-tight leading-none mb-1">
                      {user.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Role
                    </span>
                    {getRoleBadge(user.role)}
                  </div>

                  {(user.role === "COACH" || user.team_id) && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Team
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {teams.find((t) => t.id === user.team_id)?.name ||
                          "N/A"}
                      </span>
                    </div>
                  )}

                  {user.competition_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Competition
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {competitions.find((c) => c.id === user.competition_id)
                          ?.name || "N/A"}
                      </span>
                    </div>
                  )}

                  {user.tournament_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Season
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {tournaments.find((t) => t.id === user.tournament_id)
                          ?.name || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`h-1 w-full ${
                  user.is_superuser ? "bg-red-600/40" : "bg-blue-600/10"
                } group-hover:bg-blue-600/40 transition-colors`}
              />
            </div>
          ))}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            onClick={() => setShowUserModal(false)}
          />
          <div className="relative glass-panel bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden max-h-[95vh] flex flex-col">
            <div className="p-8 overflow-y-auto">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight font-display">
                {isEditing ? "Edit User" : "New User"}
              </h2>
              <form onSubmit={handleCreateOrUpdate} className="space-y-5">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      required
                      type="text"
                      className="input pl-12 h-12"
                      placeholder="John Doe"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      required
                      type="email"
                      className="input pl-12 h-12"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="label">
                    {isEditing
                      ? "New Password (Leave blank to keep current)"
                      : "Password"}
                  </label>
                  <div className="relative">
                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      required={!isEditing}
                      type="password"
                      className="input pl-12 h-12"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Role</label>
                  <div className="relative">
                    <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      className="input pl-12 h-12 appearance-none"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as UserRole,
                          team_id: "",
                          tournament_id: "",
                          competition_id: "",
                        })
                      }
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="TOURNAMENT_ADMIN">Tournament Admin</option>
                      <option value="COACH">Coach</option>
                      <option value="REFEREE">Referee</option>
                      <option value="NEWS_REPORTER">News Reporter</option>
                    </select>
                  </div>
                </div>

                {(formData.role === "TOURNAMENT_ADMIN" ||
                  formData.role === "REFEREE" ||
                  formData.role === "COACH") && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="label">Assigned Competition</label>
                    <div className="relative">
                      <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        required
                        className="input pl-12 h-12 appearance-none"
                        value={formData.competition_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            competition_id: e.target.value,
                            tournament_id: "",
                            team_id: "",
                          })
                        }
                      >
                        <option value="">Select a competition...</option>
                        {competitions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {(formData.role === "TOURNAMENT_ADMIN" ||
                  formData.role === "REFEREE" ||
                  formData.role === "COACH") &&
                  formData.competition_id && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="label">
                        Assigned Season (Tournament)
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select
                          required
                          className="input pl-12 h-12 appearance-none"
                          value={formData.tournament_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tournament_id: e.target.value,
                              team_id: "",
                            })
                          }
                        >
                          <option value="">Select a season...</option>
                          {filteredTournaments.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.year})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                {formData.role === "COACH" && formData.tournament_id && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="label">Assigned Team</label>
                    <div className="relative">
                      <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        required
                        className="input pl-12 h-12 appearance-none"
                        value={formData.team_id}
                        onChange={(e) =>
                          setFormData({ ...formData, team_id: e.target.value })
                        }
                      >
                        <option value="">Select a team...</option>
                        {filteredTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="btn btn-secondary flex-1 h-12"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1 h-12">
                    {isEditing ? "Update" : "Create"}
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
          setUserToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};
