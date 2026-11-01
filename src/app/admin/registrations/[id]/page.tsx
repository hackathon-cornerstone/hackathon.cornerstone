
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, GraduationCap, Calendar, ClipboardList } from "lucide-react";

type Registration = {
  id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  student_id: string;
  student_class: string;
  student_section: string;
  department: string;
  activity_title: string;
  activity_id: string;
  registration_status: string;
  created_at: string;
  custom_answers: Record<string, unknown>;
};

export default function RegistrationDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetails() {
      try {
        const response = await fetch("/api/admin/registrations", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load registration");
        }

        const found = (result.registrations || []).find(
          (item: Registration) => item.id === id
        );

        if (!found) {
          throw new Error("Registration not found");
        }

        setRegistration(found);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) loadDetails();
  }, [id]);

  const cardClass =
    "rounded-2xl border border-[#E5DEC9] bg-[#111c2d] p-6";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080e19] p-8 text-center text-[#81796E]">
        Loading student details...
      </main>
    );
  }

  if (error || !registration) {
    return (
      <main className="min-h-screen bg-[#080e19] p-8 text-white">
        <p className="text-red-400">{error || "Registration not found"}</p>
        <Link href="/admin/registrations" className="mt-5 inline-block text-cyan-400">
          Back to Registrations
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080e19] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-5xl space-y-7">

        <Link
          href="/admin/registrations"
          className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft size={17} />
          Back to Registrations
        </Link>

        <div>
          <p className="text-sm text-cyan-400">KRIYALAYA ADMIN</p>
          <h1 className="mt-2 text-3xl font-bold">
            Student Registration Details
          </h1>
          <p className="mt-2 text-sm text-[#81796E]">
            Complete registration information and activity responses.
          </p>
        </div>

        <section className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#81796E]">Student Name</p>
              <h2 className="mt-2 text-2xl font-bold">
                {registration.student_name}
              </h2>
              <p className="mt-1 text-sm text-[#81796E]">
                Student ID: {registration.student_id || "Not provided"}
              </p>
            </div>

            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              {registration.registration_status}
            </span>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <User className="text-cyan-400" />
            Personal Information
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#81796E]">
                <Mail className="mr-2 inline" size={16} />
                Email Address
              </p>
              <p className="mt-2">{registration.student_email || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-[#81796E]">
                <Phone className="mr-2 inline" size={16} />
                Phone Number
              </p>
              <p className="mt-2">{registration.student_phone || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-[#81796E]">
                <GraduationCap className="mr-2 inline" size={16} />
                Class
              </p>
              <p className="mt-2">{registration.student_class || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-[#81796E]">Section</p>
              <p className="mt-2">{registration.student_section || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-[#81796E]">Department</p>
              <p className="mt-2">{registration.department || "—"}</p>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <ClipboardList className="text-cyan-400" />
            Activity Information
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#81796E]">Activity Name</p>
              <p className="mt-2 font-medium">{registration.activity_title}</p>
            </div>

            <div>
              <p className="text-sm text-[#81796E]">Registration Status</p>
              <p className="mt-2">{registration.registration_status}</p>
            </div>

            <div>
              <p className="text-sm text-[#81796E]">
                <Calendar className="mr-2 inline" size={16} />
                Registration Date
              </p>
              <p className="mt-2">
                {new Date(registration.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="mb-5 text-xl font-semibold">
            Activity-Specific Answers
          </h2>

          {Object.keys(registration.custom_answers || {}).length === 0 ? (
            <p className="text-sm text-[#81796E]">
              No additional answers submitted.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(registration.custom_answers).map(
                ([question, answer]) => (
                  <div
                    key={question}
                    className="rounded-xl border border-[#E5DEC9] bg-[#080e19] p-4"
                  >
                    <p className="text-sm text-[#81796E]">{question}</p>
                    <p className="mt-2 break-words">
                      {typeof answer === "object"
                        ? JSON.stringify(answer)
                        : String(answer ?? "—")}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
