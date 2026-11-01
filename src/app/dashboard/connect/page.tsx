
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Megaphone,
  MessageCircle,
  FolderOpen,
  BarChart3,
  Search,
  Plus,
  CalendarDays,
  ArrowUpRight,
  Activity,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Community = {
  id: string;
  activity_id: string;
  community_name: string;
  description: string | null;
  status: string;
  created_at: string;
  activity?: {
    title: string;
    category: string;
    activity_date: string;
    venue: string;
  };
};

export default function ConnectPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  
  useEffect(() => {
    async function loadCommunities() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/communities", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load communities.");
        }

        setCommunities(result.communities || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading communities."
        );
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    }

    loadCommunities();
  }, []);


  const filteredCommunities = communities.filter((community) =>
    community.community_name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCommunities = communities.filter(
    (community) => community.status === "active"
  ).length;

  return (
    <main className="min-h-screen bg-[#080B14] p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              KRIYALAYA / COMMUNITY NETWORK
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              KRIYALAYA <span className="text-cyan-400">Connect</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#81796E]">
              Every activity has its own community. Bring participants,
              coordinators and staff together in one place.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#E5DEC9] bg-white/5 px-5 py-3 text-sm text-[#2B1E1F] transition hover:bg-white/10"
          >
            Back to Dashboard
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Communities",
              value: communities.length,
              icon: Users,
            },
            {
              label: "Active Communities",
              value: activeCommunities,
              icon: Activity,
            },
            {
              label: "Announcements",
              value: "—",
              icon: Megaphone,
            },
            {
              label: "Discussions",
              value: "—",
              icon: MessageCircle,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#E5DEC9] bg-white/[0.035] p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#81796E]">{stat.label}</p>
                <stat.icon size={19} className="text-cyan-400" />
              </div>
              <p className="mt-4 text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#E5DEC9] bg-white/[0.035] p-5 md:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold">Activity Communities</h2>
              <p className="mt-1 text-sm text-[#81796E]">
                A separate communication space for every published activity.
              </p>
            </div>

            <div className="relative w-full md:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search communities..."
                className="w-full rounded-xl border border-[#E5DEC9] bg-[#0B1020] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-[#81796E]">
              <Loader2 className="animate-spin" size={20} />
              Loading communities...
            </div>
          ) : error ? (
            <div className="mt-7 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">
              <AlertCircle size={20} />
              <div>
                <p className="font-semibold">Unable to load communities</p>
                <p className="mt-1 break-all text-red-300/80">{error}</p>
              </div>
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={38} className="mx-auto text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold">
                No communities found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Publish an activity to automatically create its community.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCommunities.map((community) => (
                <div
                  key={community.id}
                  className="group rounded-2xl border border-[#E5DEC9] bg-[#0B1020] p-5 transition hover:border-cyan-400/40 hover:bg-[#10182A]"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
                      <Users size={22} />
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      {community.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {community.community_name}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm text-[#81796E]">
                    {community.description ||
                      "Official community for this activity."}
                  </p>

                  <div className="mt-5 space-y-2 border-t border-[#E5DEC9] pt-4 text-xs text-slate-500">
                    {community.activity?.category && (
                      <p>{community.activity.category}</p>
                    )}
                    {community.activity?.activity_date && (
                      <p className="flex items-center gap-2">
                        <CalendarDays size={14} />
                        {new Date(
                          community.activity.activity_date
                        ).toLocaleDateString()}
                      </p>
                    )}
                    {community.activity?.venue && (
                      <p className="flex items-center gap-2">
                        <FolderOpen size={14} />
                        {community.activity.venue}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/connect/${community.id}`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20"
                  >
                    Open Community
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
