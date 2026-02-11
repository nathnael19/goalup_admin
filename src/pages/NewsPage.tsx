import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiX,
  FiFileText,
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { newsService } from "../services/newsService";
import { teamService } from "../services/teamService";
import type { News, NewsCategory, CreateNewsDto, Team } from "../types";
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
  const [news, setNews] = useState<News[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<NewsCategory | "">("");
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
  }, [filterCategory]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await newsService.getAll(
        filterCategory ? (filterCategory as NewsCategory) : undefined,
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

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory("")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
            filterCategory === ""
              ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800"
          }`}
        >
          All
        </button>
        {(Object.keys(CATEGORY_CONFIG) as NewsCategory[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                filterCategory === cat
                  ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-lg`
                  : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* News List */}
      {news.length === 0 ? (
        <div className="card p-12 text-center">
          <FiFileText className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-500 font-bold">No news articles found.</p>
          <p className="text-slate-600 text-sm mt-1">
            Create your first article to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((article) => {
            const cfg = CATEGORY_CONFIG[article.category];
            const isExpanded = expandedId === article.id;
            return (
              <div
                key={article.id}
                className="card hover:border-white/10 transition-all duration-300"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                        {!article.is_published && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Draft
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                          {formatDate(article.created_at)}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mb-1 truncate">
                        {article.title}
                      </h3>
                      <p
                        className={`text-sm text-slate-400 ${isExpanded ? "" : "line-clamp-2"}`}
                      >
                        {article.content}
                      </p>
                      {article.content.length > 150 && (
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : article.id)
                          }
                          className="text-blue-500 text-xs font-bold mt-1 hover:underline flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Show less <FiArrowLeft size={10} />
                            </>
                          ) : (
                            <>
                              Read more <FiArrowRight size={10} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {article.image_url && (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-20 h-20 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      {article.team_id && (
                        <span>
                          Team:{" "}
                          {teams.find((t) => t.id === article.team_id)?.name ||
                            "—"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(article)}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
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

                <div>
                  <label className="label">Team (optional)</label>
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
