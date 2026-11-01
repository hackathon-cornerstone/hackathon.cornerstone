
"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Trash2,
} from "lucide-react";

type ImportPerson = {
  person_type: "student" | "staff";
  full_name: string;
  email: string;
  phone?: string;
  student_id?: string;
  student_class?: string;
  section?: string;
  employee_id?: string;
  designation?: string;
  department?: string;
};

export default function PeopleImportPage() {
  const [personType, setPersonType] = useState<"student" | "staff">("student");
  const [records, setRecords] = useState<ImportPerson[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrors([]);
    setMessage("");
    setRecords([]);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) throw new Error("The uploaded file has no worksheet.");

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const normalized = rows.map((row) => {
        const clean: Record<string, unknown> = {};

        Object.entries(row).forEach(([key, value]) => {
          clean[key.trim().toLowerCase().replace(/[\s-]+/g, "_")] = value;
        });

        return clean;
      });

      const imported: ImportPerson[] = normalized.map((row) => ({
        person_type: personType,
        full_name: String(row.full_name || row.name || "").trim(),
        email: String(row.email || "").trim().toLowerCase(),
        phone: String(row.phone || "").trim(),
        student_id: String(row.student_id || row.admission_number || "").trim(),
        student_class: String(row.student_class || row.class || row.grade || "").trim(),
        section: String(row.section || "").trim(),
        employee_id: String(row.employee_id || "").trim(),
        designation: String(row.designation || "").trim(),
        department: String(row.department || "").trim(),
      }));

      if (imported.length === 0) {
        throw new Error("No records found in the uploaded file.");
      }

      const validationErrors: string[] = [];
      const seenIds = new Set<string>();
      const seenEmails = new Set<string>();

      imported.forEach((person, index) => {
        const rowNumber = index + 2;

        if (!person.full_name) {
          validationErrors.push(`Row ${rowNumber}: Full name is missing.`);
        }

        if (!person.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) {
          validationErrors.push(`Row ${rowNumber}: A valid email is required.`);
        } else if (seenEmails.has(person.email)) {
          validationErrors.push(`Row ${rowNumber}: Duplicate email in uploaded file.`);
        } else {
          seenEmails.add(person.email);
        }

        const id = personType === "student" ? person.student_id : person.employee_id;

        if (!id) {
          validationErrors.push(
            `Row ${rowNumber}: ${personType === "student" ? "Student ID" : "Employee ID"} is missing.`
          );
        } else if (seenIds.has(id.toLowerCase())) {
          validationErrors.push(`Row ${rowNumber}: Duplicate ID in uploaded file.`);
        } else {
          seenIds.add(id.toLowerCase());
        }
      });

      setRecords(imported);
      setErrors(validationErrors);
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Unable to read the file.",
      ]);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function importRecords() {
    if (records.length === 0 || errors.length > 0) return;

    setImporting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/people/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed.");
      }

      setMessage(
        `Import completed: ${result.imported} records added, ${result.failed || 0} failed.`
      );

      setRecords([]);
      setErrors([]);
      setFileName("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Import failed."
      );
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const headers =
      personType === "student"
        ? [["full_name", "email", "phone", "student_id", "student_class", "section", "department"]]
        : [["full_name", "email", "phone", "employee_id", "designation", "department"]];

    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "People");
    XLSX.writeFile(workbook, `${personType}_import_template.xlsx`);
  }

  return (
    <main className="min-h-screen bg-[#080d18] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/admin/people"
          className="inline-flex items-center gap-2 text-sm text-[#81796E] hover:text-cyan-400"
        >
          <ArrowLeft size={16} /> Back to People Directory
        </Link>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            KRIYALAYA / PEOPLE
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Bulk Import
          </h1>
          <p className="mt-2 text-[#81796E]">
            Upload and validate student or staff records using Excel or CSV.
          </p>
        </div>

        <section className="rounded-2xl border border-[#E5DEC9] bg-[#111a2b] p-6">
          <h2 className="text-lg font-semibold">1. Select Record Type</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {(["student", "staff"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setPersonType(type);
                  setRecords([]);
                  setErrors([]);
                  setMessage("");
                  setFileName("");
                }}
                className={`rounded-xl px-5 py-3 text-sm font-semibold capitalize ${
                  personType === type
                    ? "bg-cyan-500 text-slate-950"
                    : "border border-[#E5DEC9] bg-white/5 text-[#2B1E1F]"
                }`}
              >
                {type === "student" ? "Students" : "Staff"}
              </button>
            ))}
          </div>

          <button
            onClick={downloadTemplate}
            className="mt-5 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            <Download size={16} /> Download {personType} Excel template
          </button>
        </section>

        <section className="rounded-2xl border border-[#E5DEC9] bg-[#111a2b] p-6">
          <h2 className="text-lg font-semibold">2. Upload File</h2>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400/30 bg-cyan-400/5 px-6 py-12 text-center hover:bg-cyan-400/10">
            <Upload size={34} className="text-cyan-400" />
            <span className="mt-4 font-semibold">
              Click to upload Excel or CSV
            </span>
            <span className="mt-2 text-sm text-slate-500">
              Supported formats: .xlsx, .xls, .csv
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
          </label>

          {fileName && (
            <p className="mt-4 flex items-center gap-2 text-sm text-[#2B1E1F]">
              <FileSpreadsheet size={17} className="text-emerald-400" />
              {fileName}
            </p>
          )}

          {loading && (
            <p className="mt-4 text-sm text-cyan-400">Reading and validating file...</p>
          )}
        </section>

        {errors.length > 0 && (
          <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-red-300">
              <AlertCircle size={19} /> Validation issues ({errors.length})
            </h2>
            <div className="mt-4 max-h-52 space-y-2 overflow-y-auto text-sm text-red-200">
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#81796E]">
              Correct the listed issues in your spreadsheet and upload it again.
              Import is disabled while validation errors remain.
            </p>
          </section>
        )}

        {records.length > 0 && (
          <section className="rounded-2xl border border-[#E5DEC9] bg-[#111a2b] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">3. Preview Records</h2>
                <p className="mt-1 text-sm text-[#81796E]">
                  {records.length} records found
                </p>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300">
                {personType}
              </span>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr className="border-b border-[#E5DEC9]">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">Class / Designation</th>
                    <th className="px-3 py-3">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 20).map((person, index) => (
                    <tr key={index} className="border-b border-white/5">
                      <td className="px-3 py-3">{person.full_name || "—"}</td>
                      <td className="px-3 py-3 text-[#81796E]">{person.email || "—"}</td>
                      <td className="px-3 py-3">
                        {personType === "student" ? person.student_id : person.employee_id}
                      </td>
                      <td className="px-3 py-3 text-[#81796E]">
                        {personType === "student" ? person.student_class : person.designation}
                      </td>
                      <td className="px-3 py-3 text-[#81796E]">{person.department || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {records.length > 20 && (
              <p className="mt-3 text-xs text-slate-500">
                Showing first 20 of {records.length} records.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DEC9] pt-5">
              <p className="text-sm text-[#81796E]">
                {errors.length > 0
                  ? "Fix validation errors before importing."
                  : "Records passed basic validation."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRecords([]);
                    setErrors([]);
                    setFileName("");
                    setMessage("");
                  }}
                  className="rounded-xl border border-[#E5DEC9] px-4 py-3 text-sm"
                >
                  <Trash2 size={15} className="mr-2 inline" /> Clear
                </button>
                <button
                  onClick={importRecords}
                  disabled={importing || errors.length > 0}
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {importing ? "Importing..." : "Import Records"}
                </button>
              </div>
            </div>
          </section>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 size={17} className="mr-2 inline" />
            {message}
          </div>
        )}

        <div className="flex items-start gap-3 rounded-xl border border-[#E5DEC9] bg-white/[0.03] p-4 text-sm text-[#81796E]">
          <Users size={19} className="mt-0.5 shrink-0 text-cyan-400" />
          <p>
            Upload a spreadsheet using the KRIYALAYA template. Required fields:
            full_name, email and student_id for students, or employee_id for staff.
            Existing database duplicates will also be checked during import.
          </p>
        </div>
      </div>
    </main>
  );
}
