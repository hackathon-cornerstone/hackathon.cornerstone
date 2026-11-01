
"use client";

import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BriefcaseBusiness,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  UserRound,
} from "lucide-react";

type Person = {
  id: string;
  person_type: "student" | "staff";
  full_name: string;
  email: string;
  phone: string | null;
  student_id: string | null;
  student_class: string | null;
  section: string | null;
  employee_id: string | null;
  designation: string | null;
  department: string | null;
  status: "active" | "inactive";
};

const emptyForm = {
  person_type: "student" as "student" | "staff",
  full_name: "",
  email: "",
  phone: "",
  student_id: "",
  student_class: "",
  section: "",
  employee_id: "",
  designation: "",
  department: "",
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadPeople() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/people");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load people.");
      setPeople(result.people || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load people.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeople();
  }, []);

  function openAddForm(type: "student" | "staff") {
    setEditingId(null);
    setForm({ ...emptyForm, person_type: type });
    setError("");
    setShowForm(true);
  }

  function openEditForm(person: Person) {
    setEditingId(person.id);
    setForm({
      person_type: person.person_type,
      full_name: person.full_name,
      email: person.email,
      phone: person.phone || "",
      student_id: person.student_id || "",
      student_class: person.student_class || "",
      section: person.section || "",
      employee_id: person.employee_id || "",
      designation: person.designation || "",
      department: person.department || "",
    });
    setError("");
    setShowForm(true);
  }

  async function savePerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/people", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...form } : form
        ),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save record.");

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadPeople();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save record.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePerson(person: Person) {
    if (!window.confirm(`Delete ${person.full_name}? This cannot be undone.`)) return;

    try {
      const response = await fetch("/api/admin/people", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: person.id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete record.");

      await loadPeople();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete record.");
    }
  }

  const students = people.filter((person) => person.person_type === "student");
  const staff = people.filter((person) => person.person_type === "staff");

  const filteredPeople = people.filter((person) => {
    const matchesFilter = filter === "all" || person.person_type === filter;
    const term = search.toLowerCase();
    const matchesSearch =
      person.full_name.toLowerCase().includes(term) ||
      person.email.toLowerCase().includes(term) ||
      (person.student_id || "").toLowerCase().includes(term) ||
      (person.employee_id || "").toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#080d18] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              KRIYALAYA / ADMINISTRATION
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              People Directory
            </h1>
            <p className="mt-2 text-sm text-[#81796E]">
              Manage your institution&apos;s students and staff in one place.
            </p>
          </div>

          <button
            onClick={loadPeople}
            className="flex items-center gap-2 rounded-xl border border-[#E5DEC9] bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Total People" value={people.length} icon={<Users />} />
          <StatCard title="Students" value={students.length} icon={<GraduationCap />} />
          <StatCard title="Staff Members" value={staff.length} icon={<BriefcaseBusiness />} />
        </div>

        <section className="rounded-2xl border border-[#E5DEC9] bg-[#111a2b] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Directory</h2>
              <p className="mt-1 text-sm text-[#81796E]">
                Add, search, edit and manage institution records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openAddForm("student")}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                <Plus size={16} /> Add Student
              </button>
              <button
                onClick={() => openAddForm("staff")}
                className="flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20"
              >
                <Plus size={16} /> Add Staff
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email or ID..."
                className="w-full rounded-xl border border-[#E5DEC9] bg-[#080d18] py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-400"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-[#E5DEC9] bg-[#080d18] px-4 py-3 text-sm outline-none focus:border-cyan-400"
            >
              <option value="all">All People</option>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5DEC9] text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-4">Person</th>
                  <th className="px-3 py-4">ID</th>
                  <th className="px-3 py-4">Type</th>
                  <th className="px-3 py-4">Class / Department</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-[#81796E]">Loading people...</td></tr>
                ) : filteredPeople.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-[#81796E]">No records found. Add your first student or staff member.</td></tr>
                ) : (
                  filteredPeople.map((person) => (
                    <tr key={person.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-3 py-4">
                        <div className="font-medium">{person.full_name}</div>
                        <div className="mt-1 text-xs text-slate-500">{person.email}</div>
                      </td>
                      <td className="px-3 py-4 text-[#2B1E1F]">
                        {person.person_type === "student" ? person.student_id : person.employee_id}
                      </td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs ${person.person_type === "student" ? "bg-cyan-400/10 text-cyan-300" : "bg-violet-400/10 text-violet-300"}`}>
                          {person.person_type}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-[#2B1E1F]">
                        {person.person_type === "student"
                          ? `${person.student_class || "—"} ${person.section || ""}`
                          : person.department || person.designation || "—"}
                      </td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs ${person.status === "active" ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-500/20 text-[#81796E]"}`}>
                          {person.status}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditForm(person)} title="Edit" className="rounded-lg border border-[#E5DEC9] p-2 hover:bg-white/10">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deletePerson(person)} title="Delete" className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-400/10">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {error && !showForm && (
          <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4">
          <form onSubmit={savePerson} className="my-auto w-full max-w-2xl space-y-5 rounded-3xl border border-cyan-400/20 bg-[#111a2b] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">KRIYALAYA PEOPLE</p>
                <h2 className="mt-1 text-2xl font-bold">{editingId ? "Edit Record" : `Add ${form.person_type === "student" ? "Student" : "Staff"}`}</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-[#81796E] hover:bg-white/10"><X /></button>
            </div>

            {error && <p className="rounded-lg bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
              <Field label="Email Address" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <Field label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              {form.person_type === "student" ? (
                <>
                  <Field label="Student ID" value={form.student_id} onChange={(v) => setForm({ ...form, student_id: v })} required />
                  <Field label="Class / Grade" value={form.student_class} onChange={(v) => setForm({ ...form, student_class: v })} />
                  <Field label="Section" value={form.section} onChange={(v) => setForm({ ...form, section: v })} />
                </>
              ) : (
                <>
                  <Field label="Employee ID" value={form.employee_id} onChange={(v) => setForm({ ...form, employee_id: v })} required />
                  <Field label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
                  <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
                </>
              )}
              <Field label="Department (optional)" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-[#E5DEC9] pt-5">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[#E5DEC9] px-5 py-3 text-sm">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Person"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E5DEC9] bg-[#111a2b] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#81796E]">{title}</p>
        <span className="text-cyan-400">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-[#2B1E1F]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-xl border border-[#E5DEC9] bg-[#080d18] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}
