import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiAward } from "react-icons/fi";
import { competitionService } from "../services/competitionService";
import type { Competition, CreateCompetitionDto } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../context/ToastContext";

export const CompetitionsPage: React.FC = () => {
  const { showToast } = useToast();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Competition | null>(null);
  const [form, setForm] = useState<CreateCompetitionDto>({
    name: "",
    country: "",
    level: "",
  } as any);

  const load = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getAll();
      setCompetitions(data);
    } catch (e) {
      console.error(e);
      showToast("Failed to load competitions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setIsEditing(false);
    setSelected(null);
    setForm({ name: "", country: "", level: "" } as any);
    setShowModal(true);
  };

  const openEdit = (c: Competition) => {
    setIsEditing(true);
    setSelected(c);
    setForm({
      name: c.name,
      country: (c as any).country || "",
      level: (c as any).level || "",
    } as any);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selected) {
        await competitionService.update(selected.id, form);
        showToast("Competition updated", "success");
      } else {
        await competitionService.create(form);
        showToast("Competition created", "success");
      }
      setShowModal(false);
      load();
    } catch (err) {
      console.error(err);
      showToast("Failed to save competition", "error");
    }
  };

  const handleDelete = async (c: Competition) => {
    if (!window.confirm(`Delete competition "${c.name}"?`)) return;
    try {
      await competitionService.delete(c.id);
      showToast("Competition deleted", "success");
      load();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete competition", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/40">
              <FiAward />
            </span>
            Competitions
          </h1>
          <p className="text-slate-400 font-medium font-body mt-1">
            Manage top-level competitions that group tournaments and seasons.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus />
          <span>Create Competition</span>
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {competitions.map((c) => (
            <div
              key={c.id}
              className="glass-panel p-6 border border-white/5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">{c.name}</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-[0.3em] mt-1">
                    {(c as any).country || "Competition"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="icon-button text-blue-400 hover:text-blue-300"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="icon-button text-red-400 hover:text-red-300"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {competitions.length === 0 && (
            <div className="text-slate-500 text-sm">
              No competitions yet. Create the first one to start organizing
              tournaments.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="glass-panel p-6 w-full max-w-md">
            <h2 className="text-xl font-black text-white mb-4">
              {isEditing ? "Edit Competition" : "Create Competition"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Country</label>
                  <input
                    className="input"
                    value={(form as any).country || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...(f as any), country: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Level</label>
                  <input
                    className="input"
                    value={(form as any).level || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...(f as any), level: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

