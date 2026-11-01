
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  Save,
  X,
  Clock,
  MapPin,
  Users,
  ClipboardList,
  Loader2,
  Trash2,
  Sparkles,
  AlertCircle,
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

export default function ActivityDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const activityId = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
const [editing, setEditing] = useState(false);
const [saving, setSaving] = useState(false);
const [formError, setFormError] = useState("");

const [form, setForm] = useState({
  title: "",
  description: "",
  category: "",
  activity_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  capacity: "",
  registration_deadline: "",
});

  useEffect(() => {
    async function loadActivity() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", activityId)
        .single();

      if (error) {
        setError(error.message);
        setActivity(null);
      } else {
  const loadedActivity = data as Activity;

  setActivity(loadedActivity);

  setForm({
    title: loadedActivity.title,
    description: loadedActivity.description || "",
    category: loadedActivity.category,
    activity_date: loadedActivity.activity_date,
    start_time: loadedActivity.start_time || "",
    end_time: loadedActivity.end_time || "",
    venue: loadedActivity.venue,
    capacity: String(loadedActivity.capacity),
    registration_deadline:
      loadedActivity.registration_deadline || "",
  });
}

      setLoading(false);
    }

    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  function formatDate(date: string) {
    if (!date) return "Not specified";

    return new Date(date + "T00:00:00").toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  async function updateActivity(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!activity) return;

  const capacity = Number(form.capacity);

  if (!Number.isInteger(capacity) || capacity < 1) {
    setFormError("Please enter a valid participant capacity.");
    return;
  }

  if (
    form.registration_deadline &&
    form.registration_deadline > form.activity_date
  ) {
    setFormError("Registration deadline cannot be after activity date.");
    return;
  }

  if (
    form.start_time &&
    form.end_time &&
    form.end_time <= form.start_time
  ) {
    setFormError("End time must be later than start time.");
    return;
  }

  setSaving(true);
  setFormError("");

  const { data, error: updateError } = await supabase
    .from("activities")
    .update({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      activity_date: form.activity_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      venue: form.venue.trim(),
      capacity,
      registration_deadline: form.registration_deadline || null,
    })
    .eq("id", activity.id)
    .select()
    .single();

  if (updateError) {
    setFormError(updateError.message);
    setSaving(false);
    return;
  }

  setActivity(data as Activity);
  setEditing(false);
  setSaving(false);
}

async function deleteActivity() {
    if (!activity) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${activity.title}"?`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", activity.id);

    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080B14] text-white">
        <div className="flex items-center gap-3 text-[#81796E]">
          <Loader2 className="animate-spin" size={22} />
          Loading activity details...
        </div>
      </main>
    );
  }

  if (!activity) {
    return (
      <main className="min-h-screen bg-[#080B14] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5DEC9] bg-[#101827] p-8">
          <AlertCircle className="mb-4 text-red-400" size={32} />

          <h1 className="text-2xl font-bold">
            Activity not found
          </h1>

          <p className="mt-3 text-sm text-[#81796E]">
            {error || "This activity may have been deleted."}
          </p>

          <Link
            href="/dashboard"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080B14] px-5 py-8 text-white sm:px-8 lg:px-12">

      <div className="mx-auto max-w-6xl">

        {/* TOP NAVIGATION */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DEC9] pb-6">

          <div>
            <p className="text-xs tracking-[0.2em] text-slate-500">
              KRIYALAYA / ACTIVITIES
            </p>

            <p className="mt-2 text-sm font-semibold">
              Activity Details
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-[#E5DEC9] px-4 py-3 text-sm text-[#2B1E1F] transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

        </div>

        {/* PAGE HEADING */}
        <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-cyan-300">
              <Sparkles size={15} />
              KRIYALAYA ACTIVITY ENGINE
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {activity.title}
              <span className="text-cyan-400">.</span>
            </h1>

            <p className="mt-3 text-sm text-[#81796E]">
              Manage and monitor your campus activity.
            </p>
          </div>

          <span className="w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold tracking-wider text-cyan-300">
            {activity.status.toUpperCase()}
          </span>

        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}


                {/* EDIT ACTIVITY FORM */}
        {editing && (
          <section className="fixed inset-4 z-50 mx-auto max-w-4xl overflow-y-auto rounded-3xl border border-cyan-400/30 bg-[#101827] p-6 shadow-2xl sm:p-9">
            <div className="mb-6 flex items-center gap-3">
              <Pencil size={22} className="text-cyan-300" />
              <h2 className="text-xl font-semibold">Edit Activity</h2>
            </div>

            <form
              onSubmit={updateActivity}
              className="grid gap-5 sm:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm text-gray-300">Activity Name</label>
                <input
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">Category</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {["Sports", "Academic", "Cultural", "Environmental", "Competition", "Other"].map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-gray-300">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">Venue</label>
                <input
                  required
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">Activity Date</label>
                <input
                  required
                  type="date"
                  value={form.activity_date}
                  onChange={(e) => setForm({ ...form, activity_date: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">Start Time</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">End Time</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">Participant Capacity</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">Registration Deadline</label>
                <input
                  type="date"
                  value={form.registration_deadline}
                  onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </div>

              {formError && (
                <p className="sm:col-span-2 text-sm text-red-400">{formError}</p>
              )}

              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#07111f] transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormError("");
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ACTIVITY OVERVIEW */}
        <section className="mt-10 rounded-3xl border border-[#E5DEC9] bg-[#101827] p-6 sm:p-9">

          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <ClipboardList size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Activity Overview
              </h2>

              <p className="text-xs text-slate-500">
                Basic activity information
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">
              DESCRIPTION
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#2B1E1F]">
              {activity.description || "No description has been added."}
            </p>
          </div>

          <div className="mt-8 grid gap-5 border-t border-[#E5DEC9] pt-8 sm:grid-cols-2">

            <div>
              <p className="text-xs tracking-widest text-slate-500">
                CATEGORY
              </p>
              <p className="mt-2 font-medium">
                {activity.category}
              </p>
            </div>

            <div>
              <p className="text-xs tracking-widest text-slate-500">
                ACTIVITY STATUS
              </p>
              <p className="mt-2 font-medium capitalize">
                {activity.status}
              </p>
            </div>

          </div>
        </section>

        {/* SCHEDULE AND VENUE */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <section className="rounded-2xl border border-[#E5DEC9] bg-[#101827] p-6">

            <div className="flex items-center gap-3">
              <CalendarDays className="text-cyan-300" size={21} />
              <h2 className="font-semibold">
                Schedule
              </h2>
            </div>

            <div className="mt-7">
              <p className="text-xs tracking-widest text-slate-500">
                ACTIVITY DATE
              </p>

              <p className="mt-2 text-lg font-semibold">
                {formatDate(activity.activity_date)}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-xs tracking-widest text-slate-500">
                TIMING
              </p>

              <div className="mt-2 flex items-center gap-2 text-sm text-[#2B1E1F]">
                <Clock size={17} className="text-cyan-300" />

                {activity.start_time
                  ? activity.start_time.slice(0, 5)
                  : "Not specified"}

                {activity.end_time
                  ? ` – ${activity.end_time.slice(0, 5)}`
                  : ""}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs tracking-widest text-slate-500">
                REGISTRATION DEADLINE
              </p>

              <p className="mt-2 text-sm text-[#2B1E1F]">
                {activity.registration_deadline
                  ? formatDate(activity.registration_deadline)
                  : "Not specified"}
              </p>
            </div>

          </section>

          <section className="rounded-2xl border border-[#E5DEC9] bg-[#101827] p-6">

            <div className="flex items-center gap-3">
              <MapPin className="text-cyan-300" size={21} />
              <h2 className="font-semibold">
                Venue & Capacity
              </h2>
            </div>

            <div className="mt-7">
              <p className="text-xs tracking-widest text-slate-500">
                LOCATION
              </p>

              <p className="mt-2 text-lg font-semibold">
                {activity.venue}
              </p>
            </div>

            <div className="mt-7">
              <p className="text-xs tracking-widest text-slate-500">
                PARTICIPANT CAPACITY
              </p>

              <div className="mt-2 flex items-center gap-3">
                <Users size={21} className="text-cyan-300" />

                <span className="text-2xl font-bold">
                  {activity.capacity.toLocaleString("en-IN")}
                </span>

                <span className="text-sm text-slate-500">
                  participants
                </span>
              </div>
            </div>

          </section>

        </div>

        {/* ACTIONS */}
        <section className="mt-6 rounded-2xl border border-[#E5DEC9] bg-[#101827] p-6">

          <h2 className="font-semibold">
            Activity Actions
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Manage this activity from your KRIYALAYA workspace.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
  <button
    type="button"
    onClick={() => {
      setForm({
        title: activity.title,
        description: activity.description || "",
        category: activity.category,
        activity_date: activity.activity_date,
        start_time: activity.start_time || "",
        end_time: activity.end_time || "",
        venue: activity.venue,
        capacity: String(activity.capacity),
        registration_deadline: activity.registration_deadline || "",
      });
      setEditing(true);
      setFormError("");
    }}
    className="flex items-center gap-2 rounded-xl border border-cyan-400/30 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
  >
    <Pencil size={16} />
    Edit Activity
  </button>

            <button
              onClick={deleteActivity}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl border border-red-400/30 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Trash2 size={17} />
              )}

              {deleting ? "Deleting..." : "Delete Activity"}
            </button>

          </div>

        </section>

        {/* FOOTER */}
        <footer className="mt-12 border-t border-[#E5DEC9] py-7 text-xs text-slate-600">
          KRIYALAYA — Omnia Fluentia. Connect. Coordinate. Create.
        </footer>

      </div>
    </main>
  );
}
