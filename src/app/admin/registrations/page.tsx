
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Search,
  Users,
  RefreshCw,
} from "lucide-react";

type Registration = {
  id: string;
  activity_id: string;
  activity_title: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  student_id: string;
  student_class: string;
  student_section: string;
  department: string;
  registration_status: string;
  created_at: string;
};

export default function RegistrationManagement() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadRegistrations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/registrations", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load registrations");
      }

      setRegistrations(result.registrations || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, []);
    async function updateStatus(id: string, status: "approved" | "rejected") {
    const confirmed = window.confirm(
      `Are you sure you want to ${status} this registration?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/registrations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Status update failed");
      }

      await loadRegistrations();
      alert(`Registration ${status} successfully!`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  const activities = useMemo(
    () => [...new Set(registrations.map((item) => item.activity_title))],
    [registrations]
  );

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        item.student_name?.toLowerCase().includes(searchText) ||
        item.student_email?.toLowerCase().includes(searchText) ||
        item.student_id?.toLowerCase().includes(searchText);

      const matchesActivity =
        activityFilter === "all" ||
        item.activity_title === activityFilter;

      const matchesStatus =
        statusFilter === "all" ||
        item.registration_status === statusFilter;

      return matchesSearch && matchesActivity && matchesStatus;
    });
  }, [registrations, search, activityFilter, statusFilter]);

  function exportCSV() {
    const headers = [
      "Student Name",
      "Email",
      "Phone",
      "Student ID",
      "Class",
      "Section",
      "Department",
      "Activity",
      "Status",
      "Registration Date",
    ];

    const rows = filteredRegistrations.map((item) => [
      item.student_name,
      item.student_email,
      item.student_phone,
      item.student_id,
      item.student_class,
      item.student_section,
      item.department,
      item.activity_title,
      item.registration_status,
      new Date(item.created_at).toLocaleDateString(),
    ]);

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kriyalaya-registrations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const cardClass =
    "rounded-2xl border border-[#E5DEC9] bg-[#111c2d] p-5";

  return (
    <main className="min-h-screen bg-[#080e19] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft size={16} />
              Back to Admin Portal
            </Link>

            <h1 className="text-3xl font-bold">
              Registration Management
            </h1>

            <p className="mt-2 text-sm text-[#81796E]">
              Manage and monitor student activity registrations.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadRegistrations}
              className="flex items-center gap-2 rounded-xl border border-[#E5DEC9] px-4 py-3 text-sm hover:bg-white/5"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredRegistrations.length === 0}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className={cardClass}>
            <Users className="mb-3 text-cyan-400" />
            <p className="text-sm text-[#81796E]">Total Registrations</p>
            <p className="mt-2 text-3xl font-bold">
              {registrations.length}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-[#81796E]">Filtered Results</p>
            <p className="mt-2 text-3xl font-bold">
              {filteredRegistrations.length}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-[#81796E]">Activities</p>
            <p className="mt-2 text-3xl font-bold">
              {activities.length}
            </p>
          </div>
        </div>

        <section className={cardClass}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-[#81796E]"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email or student ID"
                className="w-full rounded-xl border border-[#E5DEC9] bg-[#080e19] py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-400"
              />
            </div>

            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="rounded-xl border border-[#E5DEC9] bg-[#080e19] px-3 py-3 text-sm outline-none"
            >
              <option value="all">All Activities</option>
              {activities.map((activity) => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E5DEC9] bg-[#080e19] px-3 py-3 text-sm outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </section>

        <section className={`${cardClass} overflow-hidden`}>
          <h2 className="mb-5 text-xl font-semibold">
            Student Registrations
          </h2>

          {loading ? (
            <p className="py-12 text-center text-[#81796E]">
              Loading registrations...
            </p>
          ) : error ? (
            <div className="py-10 text-center text-red-400">
              {error}
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <p className="py-12 text-center text-[#81796E]">
              No registrations found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5DEC9] text-[#81796E]">
                    <th className="p-3">Student</th>
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Activity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRegistrations.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 hover:bg-white/[0.03]"
                    >
                      <td className="p-3">
                        <Link
  href={`/admin/registrations/${item.id}`}
  className="font-medium text-cyan-400 hover:text-cyan-300"
>
  {item.student_name}
</Link>
                        <p className="mt-1 text-xs text-[#81796E]">
                          {item.student_email}
                        </p>
                      </td>

                      <td className="p-3">{item.student_id || "—"}</td>

                      <td className="p-3">
                        {item.student_class || "—"} / {item.student_section || "—"}
                      </td>

                      <td className="p-3">{item.department || "—"}</td>

                      <td className="p-3">{item.activity_title}</td>

                      <td className="p-3">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                          {item.registration_status}
                        </span>
                      </td>

                      <td className="p-3 text-[#81796E]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
  <div className="flex gap-2">
    <button
      onClick={() => updateStatus(item.id, "approved")}
      disabled={item.registration_status === "approved"}
      className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40"
    >
      Approve
    </button>

    <button
      onClick={() => updateStatus(item.id, "rejected")}
      disabled={item.registration_status === "rejected"}
      className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400 hover:bg-red-500/25 disabled:opacity-40"
    >
      Reject
    </button>
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
