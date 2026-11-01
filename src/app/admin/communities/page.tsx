
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  X,
  Loader2,
  ArrowLeft,
  MessageCircle,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

type Activity = {
  id: string;
  title: string;
};

type Community = {
  id: string;
  activity_id: string | null;
  community_name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  activity?: { title: string } | null;
};

const emptyForm = {
  community_name: "",
  description: "",
  activity_id: "",
};

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [communityResponse, activityResponse] = await Promise.all([
        fetch("/api/admin/communities", { cache: "no-store" }),
        fetch("/api/admin/activities", { cache: "no-store" }),
      ]);

      const communityData = await communityResponse.json();

      if (!communityResponse.ok) {
        throw new Error(communityData.error || "Unable to load communities.");
      }

      setCommunities(communityData.communities || []);

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivities(activityData.activities || []);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function openEdit(community: Community) {
    setEditing(community.id);
    setForm({
      community_name: community.community_name,
      description: community.description || "",
      activity_id: community.activity_id || "",
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  async function saveCommunity(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/communities", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? {
                id: editing,
                community_name: form.community_name,
                description: form.description,
              }
            : {
                community_name: form.community_name,
                description: form.description,
                activity_id: form.activity_id || null,
              }
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save community.");
      }

      setModalOpen(false);
      setNotice(editing ? "Community updated successfully." : "Community created successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save community.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(community: Community) {
    const newStatus =
      community.status === "active" ? "archived" : "active";

    const response = await fetch("/api/admin/communities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: community.id, status: newStatus }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Unable to update community.");
      return;
    }

    setNotice(
      newStatus === "archived"
        ? "Community archived."
        : "Community restored."
    );
    await loadData();
  }

  async function deleteCommunity(community: Community) {
    const confirmed = window.confirm(
      `Permanently delete "${community.community_name}"? Its members, announcements, messages, resources and polls will also be deleted. This cannot be undone.`
    );

    if (!confirmed) return;

    const response = await fetch("/api/admin/communities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: community.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Unable to delete community.");
      return;
    }

    setNotice("Community permanently deleted.");
    await loadData();
  }

  const filtered = communities.filter((community) => {
    const matchesSearch = community.community_name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" || community.status === filter;

    return matchesSearch && matchesFilter;
  });

  const activeCount = communities.filter(
    (c) => c.status === "active"
  ).length;

  const archivedCount = communities.filter(
    (c) => c.status === "archived"
  ).length;

  return (
    <main className="min-h-screen bg-[#080B14] p-5 text-white md:p-9">
      <div className="mx-auto max-w-7xl space-y-8">

        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <Link
              href="/admin"
              className="mb-5 inline-flex items-center gap-2 text-sm text-[#81796E] hover:text-cyan-400"
            >
              <ArrowLeft size={16} /> Admin Dashboard
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              KRIYALAYA / ADMINISTRATION
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Community <span className="text-cyan-400">Management</span>
            </h1>

            <p className="mt-2 text-sm text-[#81796E]">
              Create, organize and manage every KRIYALAYA community.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <Plus size={19} /> Create Community
          </button>
        </header>

        {notice && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            {notice}
          </div>
        )}

        {error && !modalOpen && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Communities", value: communities.length, icon: Users },
            { label: "Active Communities", value: activeCount, icon: ShieldCheck },
            { label: "Archived Communities", value: archivedCount, icon: Archive },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#E5DEC9] bg-white/[0.035] p-5"
            >
              <div className="flex justify-between text-[#81796E]">
                <span className="text-sm">{item.label}</span>
                <item.icon size={20} className="text-cyan-400" />
              </div>
              <p className="mt-4 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#E5DEC9] bg-white/[0.035] p-5 md:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <div>
              <h2 className="text-xl font-semibold">All Communities</h2>
              <p className="mt-1 text-sm text-[#81796E]">
                Manage activity-linked and independent communities.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search communities..."
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0B1020] py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-400 sm:w-64"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-[#E5DEC9] bg-[#0B1020] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="all">All Communities</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center gap-3 py-20 text-[#81796E]">
              <Loader2 size={20} className="animate-spin" />
              Loading communities...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={40} className="mx-auto text-slate-600" />
              <p className="mt-4 font-semibold">No communities found</p>
              <p className="mt-2 text-sm text-slate-500">
                Create your first community to get started.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((community) => (
                <article
                  key={community.id}
                  className="rounded-2xl border border-[#E5DEC9] bg-[#0B1020] p-5 transition hover:border-cyan-400/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
                      <Users size={22} />
                    </div>

                    <span className={`rounded-full px-3 py-1 text-xs ${
                      community.status === "active"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-amber-400/10 text-amber-300"
                    }`}>
                      {community.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {community.community_name}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm text-[#81796E]">
                    {community.description || "No description added."}
                  </p>

                  <div className="mt-4 border-t border-[#E5DEC9] pt-4 text-xs text-slate-500">
                    {community.activity?.title ? (
                      <p>Linked activity: {community.activity.title}</p>
                    ) : (
                      <p>Independent community</p>
                    )}
                    <p className="mt-2">
                      Created: {new Date(community.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openEdit(community)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-[#E5DEC9] bg-white/5 px-2 py-2 text-xs hover:bg-white/10"
                    >
                      <Pencil size={14} /> Edit
                    </button>

                    <button
                      onClick={() => updateStatus(community)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-[#E5DEC9] bg-white/5 px-2 py-2 text-xs hover:bg-white/10"
                    >
                      {community.status === "active" ? (
                        <><Archive size={14} /> Archive</>
                      ) : (
                        <><RotateCcw size={14} /> Restore</>
                      )}
                    </button>

                    <button
                      onClick={() => deleteCommunity(community)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-2 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>

                  <Link
                    href={`/dashboard/connect/${community.id}`}
                    className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 py-2.5 text-sm text-cyan-300 hover:bg-cyan-400/20"
                  >
                    <MessageCircle size={15} /> Open Community
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-[#E5DEC9] bg-[#101626] p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {editing ? "Edit Community" : "Create Community"}
                  </h2>
                  <p className="mt-1 text-sm text-[#81796E]">
                    Configure your community details.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-2 text-[#81796E] hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveCommunity} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Community Name *
                  </label>
                  <input
                    required
                    maxLength={100}
                    value={form.community_name}
                    onChange={(e) =>
                      setForm({ ...form, community_name: e.target.value })
                    }
                    placeholder="e.g. Science Club"
                    className="w-full rounded-xl border border-[#E5DEC9] bg-[#080B14] px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="What is this community about?"
                    className="w-full resize-none rounded-xl border border-[#E5DEC9] bg-[#080B14] px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </div>

                {!editing && (
                  <div>
                    <label className="mb-2 block text-sm text-[#2B1E1F]">
                      Link to Activity (Optional)
                    </label>
                    <select
                      value={form.activity_id}
                      onChange={(e) =>
                        setForm({ ...form, activity_id: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#E5DEC9] bg-[#080B14] px-4 py-3 text-sm outline-none focus:border-cyan-400"
                    >
                      <option value="">Independent Community</option>
                      {activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.title}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">
                      Leave blank for clubs, councils and ongoing groups.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-xl border border-[#E5DEC9] py-3 text-sm text-[#2B1E1F] hover:bg-white/5"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Save Changes"
                        : "Create Community"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
