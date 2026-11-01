
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  MapPin,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  capacity: number;
  registration_deadline: string | null;
  status: "draft" | "published" | "completed" | "cancelled";
  created_at: string;
};

const navigation = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Activities", icon: CalendarDays, href: "/dashboard/activities" },
  { label: "Connect", icon: MessageSquare, href: "/dashboard/connect" },
  { label: "Registration", icon: ClipboardList, href: "/admin/registrations" },
  { label: "People", icon: Users, href: "/admin/people" },
  { label: "Insights", icon: BarChart3, href: "/dashboard/insights" },
];


const emptyForm = {
  title: "",
  description: "",
  category: "",
  activity_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  capacity: "",
  registration_deadline: "",
};


export default function Dashboard() {
  const router = useRouter();
const pathname = usePathname();

const active =
  navigation.find((item) => item.href === pathname)?.label ?? "Overview";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadActivities() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("activity_date", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setActivities((data ?? []) as Activity[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadActivities();
  }, []);

  function updateField(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function createActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const capacity = Number(form.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Please enter a valid participant capacity.");
      setSaving(false);
      return;
    }

    if (
      form.registration_deadline &&
      form.registration_deadline > form.activity_date
    ) {
      setError("Registration deadline cannot be after the activity date.");
      setSaving(false);
      return;
    }

    if (
      form.start_time &&
      form.end_time &&
      form.end_time <= form.start_time
    ) {
      setError("End time must be later than start time.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("activities")
      .insert([
        {
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category,
          activity_date: form.activity_date,
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          venue: form.venue.trim(),
          capacity,
          registration_deadline:
            form.registration_deadline || null,
          status: "published",
        },
      ])
      .select()
      .single();

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setActivities((previous) =>
      [...previous, data as Activity].sort((a, b) =>
        a.activity_date.localeCompare(b.activity_date)
      )
    );

    setForm(emptyForm);
    setShowForm(false);
    setSuccess("Activity published and saved successfully!");
    setSaving(false);
  }

  async function deleteActivity(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this activity?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setActivities((previous) =>
      previous.filter((activity) => activity.id !== id)
    );

    setSuccess("Activity deleted successfully.");
  }

  const publishedCount = activities.filter(
    (activity) => activity.status === "published"
  ).length;

  const totalCapacity = activities.reduce(
    (total, activity) => total + activity.capacity,
    0
  );

  function formatDate(date: string) {
    return new Date(date + "T00:00:00").toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <main className="min-h-screen bg-[#080B14] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#E5DEC9] bg-[#0C1220] p-6 transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="logo-mark">K</div>
              <div>
                <h1 className="font-bold tracking-[0.2em]">KRIYALAYA</h1>
                <p className="text-[9px] tracking-[0.2em] text-slate-500">
                  COMMAND CENTER
                </p>
              </div>
            </div>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-12">
            <p className="mb-4 text-[10px] font-semibold tracking-[0.2em] text-slate-500">
              WORKSPACE
            </p>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const selected = active === item.label;

                return (
                  <button
                    key={item.label}
                    onClick={() => {
  router.push(item.href);
  setSidebarOpen(false);
}}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                      selected
                        ? "border border-blue-400/20 bg-blue-500/15 text-cyan-300"
                        : "text-[#81796E] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                    {selected && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-[#E5DEC9] pt-5">
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#81796E] hover:bg-white/5">
              <Settings size={18} />
              Settings
            </button>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#E5DEC9] bg-white/[0.03] p-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-bold">
                A
              </div>
              <div>
                <p className="text-sm font-medium">Administrator</p>
                <p className="text-xs text-slate-500">Campus Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E5DEC9] bg-[#080B14]/90 px-5 backdrop-blur-xl lg:px-10">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu />
              </button>
              <div>
                <p className="text-xs text-slate-500">
                  KRIYALAYA / WORKSPACE
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {active}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-[#E5DEC9] bg-white/[0.03] px-4 py-2 sm:flex">
                <Search size={16} className="text-slate-500" />
                <input
                  placeholder="Search anything..."
                  className="w-36 bg-transparent text-xs outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                aria-label="Notifications"
                className="relative rounded-xl border border-[#E5DEC9] p-2.5 text-[#81796E] hover:text-white"
              >
                <Bell size={18} />
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold">
                A
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl p-5 lg:p-10">

            {/* WELCOME */}
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs text-cyan-300">
                  <Sparkles size={14} />
                  YOUR CAMPUS, CONNECTED
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Command Center<span className="text-cyan-400">.</span>
                </h2>
                <p className="mt-3 text-sm text-[#81796E]">
                  Monitor activities, people and experiences across your institution.
                </p>
              </div>

              <button
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowForm(true);
                }}
                className="primary-button w-fit"
              >
                <Plus size={17} />
                Create Activity
              </button>
            </div>

            {/* FEEDBACK */}
            {success && (
              <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-300">
                {success}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* STATISTICS */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total Activities",
                  value: String(activities.length),
                  icon: CalendarDays,
                },
                {
                  label: "Published Activities",
                  value: String(publishedCount),
                  icon: ClipboardList,
                },
                {
                  label: "Total Capacity",
                  value: totalCapacity.toLocaleString("en-IN"),
                  icon: Users,
                },
                {
                  label: "Activities Completed",
                  value: String(
                    activities.filter(
                      (activity) => activity.status === "completed"
                    ).length
                  ),
                  icon: BarChart3,
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[#E5DEC9] bg-[#101827] p-5 transition hover:border-blue-400/40"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#81796E]">
                        {stat.label}
                      </p>
                      <Icon size={19} className="text-cyan-300" />
                    </div>
                    <p className="mt-5 text-3xl font-semibold">
                      {loading ? "..." : stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ACTIVITY LIST */}
            <div className="mt-10 rounded-2xl border border-[#E5DEC9] bg-[#101827] p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    Activities
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Activities saved in your KRIYALAYA database
                  </p>
                </div>

                <button
                  onClick={loadActivities}
                  disabled={loading}
                  className="flex items-center gap-2 text-xs text-cyan-300 disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Refresh activities
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#81796E]">
                  <Loader2 className="animate-spin" size={20} />
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                <div className="py-16 text-center">
                  <CalendarDays
                    size={36}
                    className="mx-auto text-slate-600"
                  />
                  <h4 className="mt-4 font-medium">
                    No activities yet
                  </h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Create your first campus activity to get started.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="primary-button mt-6"
                  >
                    <Plus size={16} />
                    Create your first activity
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-xl border border-[#E5DEC9] bg-white/[0.025] p-5 transition hover:border-blue-400/30"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex gap-3">
                          <div className="h-12 w-1 shrink-0 rounded-full bg-cyan-400" />
                          <div>
                            <h4 className="font-semibold">
                              {activity.title}
                            </h4>
                            <p className="mt-2 text-[10px] tracking-widest text-slate-500">
                              {activity.category.toUpperCase()}
                            </p>
                            {activity.description && (
                              <p className="mt-2 text-sm leading-6 text-[#81796E]">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] text-cyan-300">
    {activity.status.toUpperCase()}
  </span>

  <Link
    href={`/dashboard/activities/${activity.id}`}
    className="rounded-lg border border-cyan-400/30 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/10"
  >
    View Details
  </Link>

  <button
    onClick={() => deleteActivity(activity.id)}
    title="Delete activity"
    aria-label={`Delete ${activity.title}`}
    className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-400/10"
  >
    <Trash2 size={15} />
  </button>
</div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#E5DEC9] pt-4 text-xs text-[#81796E]">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={14} />
                          {formatDate(activity.activity_date)}
                        </span>

                        {activity.start_time && (
                          <span className="flex items-center gap-2">
                            <Clock size={14} />
                            {activity.start_time.slice(0, 5)}
                            {activity.end_time
                              ? ` – ${activity.end_time.slice(0, 5)}`
                              : ""}
                          </span>
                        )}

                        <span className="flex items-center gap-2">
                          <MapPin size={14} />
                          {activity.venue}
                        </span>

                        <span className="flex items-center gap-2">
                          <Users size={14} />
                          Capacity: {activity.capacity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer className="mt-10 border-t border-[#E5DEC9] pt-6 text-xs text-slate-600">
              KRIYALAYA — Omnia Fluentia. Connect. Coordinate. Create.
            </footer>
          </div>
        </section>
      </div>

      
      {/* CREATE ACTIVITY MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
          <div className="my-auto w-full max-w-5xl rounded-3xl border border-slate-700/70 bg-[#101827] p-6 shadow-2xl shadow-blue-950/30 sm:p-10">

            {/* Header */}
            <div className="mb-9 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 text-sm font-semibold tracking-wide text-cyan-300">
                  <Sparkles size={20} />
                  KRIYALAYA ACTIVITY ENGINE
                </div>

                <h3 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Create Activity
                </h3>

                <p className="mt-3 text-base text-[#81796E]">
                  Add an activity to your institution&apos;s calendar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="rounded-xl border border-slate-700 p-3 text-[#81796E] transition hover:border-cyan-400 hover:text-white"
              >
                <X size={23} />
              </button>
            </div>

            <form onSubmit={createActivity} className="space-y-6">

              {/* Activity name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Activity name *
                </label>

                <input
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="----------------------------------------"
                  className="w-full rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Description
                </label>

                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="------------------------------------------------------------"
                  className="w-full resize-y rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              {/* Two-column fields */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Category *
                  </label>

                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      updateField("category", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="">--------------------</option>
                    <option value="Sports">Sports</option>
                    <option value="Academic">Academic</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Environmental">Environmental</option>
                    <option value="Competition">Competition</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Venue */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Venue *
                  </label>

                  <input
                    required
                    maxLength={150}
                    value={form.venue}
                    onChange={(e) => updateField("venue", e.target.value)}
                    placeholder="------------------------------"
                    className="w-full rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                  />
                </div>

                {/* Activity date */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Activity date *
                  </label>

                  <input
                    required
                    type="date"
                    value={form.activity_date}
                    onChange={(e) =>
                      updateField("activity_date", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none [color-scheme:dark] focus:border-cyan-400"
                  />
                </div>

                {/* Registration deadline */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Registration deadline
                  </label>

                  <input
                    type="date"
                    value={form.registration_deadline}
                    onChange={(e) =>
                      updateField("registration_deadline", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none [color-scheme:dark] focus:border-cyan-400"
                  />
                </div>

                {/* Start time */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Start time
                  </label>

                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) =>
                      updateField("start_time", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none [color-scheme:dark] focus:border-cyan-400"
                  />
                </div>

                {/* End time */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    End time
                  </label>

                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      updateField("end_time", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none [color-scheme:dark] focus:border-cyan-400"
                  />
                </div>

                {/* Capacity */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Participant capacity *
                  </label>

                  <input
                    required
                    type="number"
                    min="1"
                    max="100000"
                    value={form.capacity}
                    onChange={(e) =>
                      updateField("capacity", e.target.value)
                    }
                    placeholder="--------------------"
                    className="w-full rounded-xl border border-slate-700 bg-[#0b1423] px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-700/70 pt-6 sm:flex-row">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-600 px-7 py-4 font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-4 font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Publish Activity
                    </>
                  )}
                </button>

                    </div>
    </form>
  </div>
</div>
)}
</main>
);
}
