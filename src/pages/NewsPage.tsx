import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiX,
  FiFileText,
  FiClock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { newsService } from "../services/newsService";
import { teamService } from "../services/teamService";
import { playerService } from "../services/playerService";
import type { News, NewsCategory, CreateNewsDto, Team, Player } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

const CATEGORY_CONFIG: Record<
  NewsCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  transfer: {
    label: "Transfer",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  injury: {
    label: "Injury",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  general: {
    label: "General",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  match_report: {
    label: "Match Report",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

export const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<NewsCategory | "">("");
  const [filterTeam, setFilterTeam] = useState<string>("");
  const [filterPlayer, setFilterPlayer] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState<CreateNewsDto>({
    title: "",
    content: "",
    category: "general",
    image_url: "",
    team_id: "",
    player_id: "",
    is_published: true,
  });

  useEffect(() => {
    fetchNews();
    fetchTeams();
    fetchPlayers();
  }, [filterCategory, filterTeam, filterPlayer]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await newsService.getAll(
        filterCategory ? (filterCategory as NewsCategory) : undefined,
        filterTeam || undefined,
        filterPlayer || undefined,
      );
      setNews(data);
    } catch (err) {
      console.error("Failed to fetch news", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await teamService.getAll();
      setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams", err);
    }
  };

  const fetchPlayers = async () => {
    try {
      const data = await playerService.getAll();
      setPlayers(data);
    } catch (err) {
      console.error("Failed to fetch players", err);
    }
  };

  const openCreateModal = () => {
    setEditingNews(null);
    setFormData({
      title: "",
      content: "",
      category: "general",
      image_url: "",
      team_id: "",
      player_id: "",
      is_published: true,
    });
    setShowModal(true);
  };

  const openEditModal = (article: News) => {
    setEditingNews(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      image_url: article.image_url || "",
      team_id: article.team_id || "",
      player_id: article.player_id || "",
      is_published: article.is_published,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        team_id: formData.team_id || undefined,
        player_id: formData.player_id || undefined,
        image_url: formData.image_url || undefined,
      };

      if (editingNews) {
        await newsService.update(editingNews.id, payload);
      } else {
        await newsService.create(payload as CreateNewsDto);
      }
      setShowModal(false);
      await fetchNews();
    } catch (err) {
      console.error("Failed to save news", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this news article?")) return;
    try {
      await newsService.delete(id);
      await fetchNews();
    } catch (err) {
      console.error("Failed to delete news", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && news.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            News
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <FiFileText className="text-blue-500" />
            News
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {news.length} article{news.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <FiPlus className="mr-2" /> New Article
        </button>
      </div>

      {/* Featured / Hero Section */}
      {!loading &&
        news.length > 0 &&
        !filterCategory &&
        !filterTeam &&
        !filterPlayer && (
          <div
            onClick={() => navigate(`/news`)}
            className="group relative h-[400px] rounded-4xl overflow-hidden cursor-pointer shadow-2xl border border-white/5 animate-in fade-in zoom-in-95 duration-700"
          >
            {news[0].image_url ? (
              <img
                src={
                  news[0].image_url.startsWith("http")
                    ? news[0].image_url
                    : `http://localhost:8000${news[0].image_url}`
                }
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                alt={news[0].title}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-slate-900 via-slate-800 to-blue-900/20" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl ${CATEGORY_CONFIG[news[0].category].bg} ${CATEGORY_CONFIG[news[0].category].color} border ${CATEGORY_CONFIG[news[0].category].border}`}
                >
                  Featured: {CATEGORY_CONFIG[news[0].category].label}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-4 border-l border-white/20">
                  {formatDate(news[0].created_at)}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white font-display mb-6 leading-tight drop-shadow-2xl">
                {news[0].title}
              </h2>
              <p className="text-slate-300 font-medium text-lg line-clamp-2 mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                {news[0].content}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(news[0]);
                  }}
                  className="btn btn-secondary bg-white/5 border-white/10 backdrop-blur-md"
                >
                  <FiEdit2 className="mr-2" /> Edit Headline
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Advanced Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white/2 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="flex flex-wrap gap-2 flex-1">
          <button
            onClick={() => setFilterCategory("")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
              filterCategory === ""
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                : "bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800"
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_CONFIG) as NewsCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                filterCategory === cat
                  ? `${CATEGORY_CONFIG[cat].bg} ${CATEGORY_CONFIG[cat].color} ${CATEGORY_CONFIG[cat].border} shadow-lg`
                  : "bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800"
              }`}
            >
              {CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-4">
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="bg-transparent text-xs font-black text-slate-400 uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-white transition-colors"
          >
            <option value="" className="bg-slate-900">
              All Teams
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900">
                {t.name}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-white/10" />
          <select
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
            className="bg-transparent text-xs font-black text-slate-400 uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-white transition-colors"
          >
            <option value="" className="bg-slate-900">
              All Players
            </option>
            {players.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* News List */}
      {news.length === 0 ? (
        <div className="card p-20 text-center border-dashed border-white/5 opacity-50">
          <FiFileText className="mx-auto text-slate-700 mb-6" size={64} />
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            No Headlines Found
          </h3>
          <p className="text-slate-500 font-medium">
            Clear filters or publish a new article to fill the feed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news
            .filter(
              (_, idx) =>
                filterCategory || filterTeam || filterPlayer || idx !== 0,
            )
            .map((article, i) => {
              const cfg = CATEGORY_CONFIG[article.category];
              return (
                <div
                  key={article.id}
                  className={`group card card-hover relative overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-${(i % 4) + 1}`}
                >
                  {/* Image Header */}
                  <div className="aspect-video w-full overflow-hidden relative">
                    {article.image_url ? (
                      <img
                        src={
                          article.image_url.startsWith("http")
                            ? article.image_url
                            : `http://localhost:8000${article.image_url}`
                        }
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <FiFileText
                          size={40}
                          className="text-slate-700 group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {!article.is_published && (
                        <span className="px-2 py-1 rounded-md bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest shadow-xl">
                          Draft
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-md shadow-xl text-[8px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FiClock className="text-blue-500" />
                        {formatDate(article.created_at)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-3 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-slate-400 text-sm font-medium line-clamp-3 mb-6 flex-1 leading-relaxed">
                      {article.content}
                    </p>

                    <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {article.team && (
                          <div
                            className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-blue-400 overflow-hidden"
                            title={`Team: ${article.team.name}`}
                          >
                            {article.team.logo_url ? (
                              <img
                                src={article.team.logo_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              article.team.name.charAt(0)
                            )}
                          </div>
                        )}
                        {article.player && (
                          <div
                            className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-emerald-400 overflow-hidden"
                            title={`Player: ${article.player.name}`}
                          >
                            {article.player.image_url ? (
                              <img
                                src={article.player.image_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              article.player.name.charAt(0)
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(article)}
                          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all shadow-inner"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all shadow-inner"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/0 group-hover:bg-blue-600 transition-all duration-300" />
                </div>
              );
            })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-panel bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-4xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {editingNews ? "Edit Article" : "New Article"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">Title</label>
                  <input
                    type="text"
                    required
                    className="input h-12"
                    placeholder="Article title..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="label">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(CATEGORY_CONFIG) as NewsCategory[]).map(
                      (cat) => {
                        const cfg = CATEGORY_CONFIG[cat];
                        const isActive = formData.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, category: cat })
                            }
                            className={`px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                              isActive
                                ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-lg`
                                : "bg-slate-800/50 text-slate-500 border-slate-700 hover:bg-slate-800"
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Content</label>
                  <textarea
                    required
                    className="input min-h-[120px] py-3"
                    placeholder="Write your article content..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={5}
                  />
                </div>

                <div>
                  <label className="label">Image URL (optional)</label>
                  <input
                    type="url"
                    className="input h-12"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Associated Team (optional)</label>
                    <select
                      className="input h-12 appearance-none"
                      value={formData.team_id || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, team_id: e.target.value })
                      }
                    >
                      <option value="">No team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      Associated Player (optional)
                    </label>
                    <select
                      className="input h-12 appearance-none"
                      value={formData.player_id || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, player_id: e.target.value })
                      }
                    >
                      <option value="">No player</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} (
                          {teams.find((t) => t.id === player.team_id)?.name ||
                            "FA"}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_published: !formData.is_published,
                      })
                    }
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                      formData.is_published
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {formData.is_published ? (
                      <>
                        <FiEye size={14} /> Published
                      </>
                    ) : (
                      <>
                        <FiEyeOff size={14} /> Draft
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingNews ? "Save Changes" : "Publish Article"}
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
