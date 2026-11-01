
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Loader2, ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  title: string;
  category: string;
  activity_date: string;
  venue: string;
  capacity: number;
  registration_deadline: string | null;
};

type ActivityQuestion = {
  id: string;
  question_label: string;
  field_type: "text" | "number" | "dropdown" | "checkbox" | "textarea";
  options: string[];
  is_required: boolean;
  sort_order: number;
};

export default function RegistrationPage() {
  const params = useParams();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [questions, setQuestions] = useState<ActivityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [student, setStudent] = useState({
    name: "",
    email: "",
    phone: "",
    studentId: "",
    studentClass: "",
    section: "",
    department: "",
  });

  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    async function loadRegistrationData() {
      setLoading(true);
      setError("");

      const { data: activityData, error: activityError } = await supabase
        .from("activities")
        .select("id, title, category, activity_date, venue, capacity, registration_deadline")
        .eq("id", activityId)
        .single();

      if (activityError) {
        setError("Unable to load this activity. Please check the activity link.");
        setLoading(false);
        return;
      }

      setActivity(activityData as Activity);

      const { data: questionData, error: questionError } = await supabase
        .from("activity_questions")
        .select("*")
        .eq("activity_id", activityId)
        .order("sort_order", { ascending: true });

      if (questionError) {
        setError("Unable to load registration questions: " + questionError.message);
        setLoading(false);
        return;
      }

      setQuestions((questionData || []) as ActivityQuestion[]);
      setLoading(false);
    }

    if (activityId) {
      loadRegistrationData();
    }
  }, [activityId]);

  function updateStudent(field: string, value: string) {
    setStudent((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateAnswer(questionId: string, value: string | boolean) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activity) return;

    setSubmitting(true);
    setError("");
    setSuccess(false);

    const { error: insertError } = await supabase
      .from("registrations")
      .insert({
        activity_id: activity.id,
        student_name: student.name.trim(),
        student_email: student.email.trim().toLowerCase(),
        student_phone: student.phone.trim() || null,
        student_id: student.studentId.trim(),
        student_class: student.studentClass.trim(),
        student_section: student.section.trim(),
        department: student.department.trim(),
        custom_answers: answers,
      });

    if (insertError) {
  if (insertError.code === "23505") {
    setError("You have already registered for this activity using this email address.");
  } else if (insertError.message.includes("REGISTRATION_CLOSED")) {
    setError("Registration is closed. The deadline has passed.");
  } else if (insertError.message.includes("ACTIVITY_FULL")) {
    setError("Sorry! This activity has reached its participant capacity.");
  } else if (insertError.message.includes("ACTIVITY_NOT_FOUND")) {
    setError("This activity could not be found.");
  } else {
    setError("Registration failed: " + insertError.message);
  }

  setSubmitting(false);
  return;
}

    setSuccess(true);
    setStudent({
      name: "",
      email: "",
      phone: "",
      studentId: "",
      studentClass: "",
      section: "",
      department: "",
    });
    setAnswers({});
    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080B14] text-white">
        <Loader2 size={28} className="animate-spin text-cyan-400" />
        <span className="ml-3 text-[#81796E]">Loading registration form...</span>
      </main>
    );
  }

  if (!activity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080B14] px-6 text-white">
        <div className="max-w-lg rounded-2xl border border-red-400/20 bg-[#101827] p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-400" size={32} />
          <h1 className="text-xl font-bold">Activity unavailable</h1>
          <p className="mt-3 text-sm text-[#81796E]">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080B14] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">

        <header className="mb-8 border-b border-[#E5DEC9] pb-6">
          <p className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
            KRIYALAYA FLOW
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Student Registration
          </h1>
          <p className="mt-3 text-sm text-[#81796E]">
            Complete your details to register for this campus activity.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-cyan-400/20 bg-[#101827] p-6">
          <p className="text-xs tracking-widest text-cyan-300">
            SELECTED ACTIVITY
          </p>
          <h2 className="mt-3 text-xl font-bold">{activity.title}</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#81796E]">
            <span>{activity.category}</span>
            <span>•</span>
            <span>{activity.activity_date}</span>
            <span>•</span>
            <span>{activity.venue}</span>
          </div>
        </section>

        {success ? (
          <section className="rounded-2xl border border-emerald-400/20 bg-[#101827] p-8 text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
            <h2 className="mt-5 text-2xl font-bold">
              Registration Submitted!
            </h2>
            <p className="mt-3 text-sm text-[#81796E]">
              Your registration for {activity.title} has been received.
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-[#07111f]"
            >
              Register Another Student
            </button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            <section className="rounded-2xl border border-[#E5DEC9] bg-[#101827] p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <ClipboardList className="text-cyan-300" size={23} />
                <h2 className="text-lg font-semibold">
                  Personal Information
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Full Name *
                  </label>
                  <input
                    required
                    maxLength={120}
                    value={student.name}
                    onChange={(e) => updateStudent("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Student ID *
                  </label>
                  <input
                    required
                    maxLength={50}
                    value={student.studentId}
                    onChange={(e) => updateStudent("studentId", e.target.value)}
                    placeholder="Enter student ID"
                    className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    maxLength={254}
                    value={student.email}
                    onChange={(e) => updateStudent("email", e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    maxLength={20}
                    value={student.phone}
                    onChange={(e) => updateStudent("phone", e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Class *
                  </label>
                  <input
                    required
                    maxLength={50}
                    value={student.studentClass}
                    onChange={(e) => updateStudent("studentClass", e.target.value)}
                    placeholder="Example: Grade 10"
                    className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Section *
                  </label>
                  <input
                    required
                    maxLength={30}
                    value={student.section}
                    onChange={(e) => updateStudent("section", e.target.value)}
                    placeholder="Example: A"
                    className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm text-[#2B1E1F]">
                    Department *
                  </label>
                  <input
                    required
                    maxLength={100}
                    value={student.department}
                    onChange={(e) => updateStudent("department", e.target.value)}
                    placeholder="Enter department"
                    className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>

              </div>
            </section>

            {questions.length > 0 && (
              <section className="rounded-2xl border border-[#E5DEC9] bg-[#101827] p-6 sm:p-8">
                <h2 className="mb-6 text-lg font-semibold">
                  Activity-Specific Questions
                </h2>

                <div className="space-y-5">
                  {questions.map((question) => (
                    <div key={question.id}>
                      <label className="mb-2 block text-sm text-[#2B1E1F]">
                        {question.question_label}
                        {question.is_required ? " *" : ""}
                      </label>

                      {question.field_type === "textarea" ? (
                        <textarea
                          required={question.is_required}
                          rows={3}
                          value={String(answers[question.id] ?? "")}
                          onChange={(e) => updateAnswer(question.id, e.target.value)}
                          className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                        />
                      ) : question.field_type === "dropdown" ? (
                        <select
                          required={question.is_required}
                          value={String(answers[question.id] ?? "")}
                          onChange={(e) => updateAnswer(question.id, e.target.value)}
                          className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                        >
                          <option value="">Select an option</option>
                          {(question.options || []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : question.field_type === "checkbox" ? (
                        <label className="flex items-center gap-3 rounded-xl border border-[#E5DEC9] bg-[#0b1220] p-4">
                          <input
                            type="checkbox"
                            required={question.is_required}
                            checked={answers[question.id] === true}
                            onChange={(e) => updateAnswer(question.id, e.target.checked)}
                            className="h-4 w-4 accent-cyan-400"
                          />
                          <span className="text-sm text-[#2B1E1F]">
                            Yes
                          </span>
                        </label>
                      ) : (
                        <input
                          type={question.field_type === "number" ? "number" : "text"}
                          required={question.is_required}
                          value={String(answers[question.id] ?? "")}
                          onChange={(e) => updateAnswer(question.id, e.target.value)}
                          className="w-full rounded-xl border border-[#E5DEC9] bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 font-bold text-[#07111f] transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                "Submit Registration"
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              KRIYALAYA — Omnia Fluentia. Connect. Coordinate. Create.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
