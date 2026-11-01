import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexora_admin_session")?.value;

  if (!token) return false;

  try {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) return false;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return payload.role === "admin";
  } catch {
    return false;
  }
}

// GET: Retrieve student and staff records
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("people")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ people: data });
}

// POST: Add a student or staff member
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const {
      person_type,
      full_name,
      email,
      phone,
      student_id,
      student_class,
      section,
      employee_id,
      designation,
      department,
    } = body;

    if (!["student", "staff"].includes(person_type)) {
      return NextResponse.json(
        { error: "Invalid person type." },
        { status: 400 }
      );
    }

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    if (
      person_type === "student" &&
      (typeof student_id !== "string" || !student_id.trim())
    ) {
      return NextResponse.json(
        { error: "Student ID is required." },
        { status: 400 }
      );
    }

    if (
      person_type === "staff" &&
      (typeof employee_id !== "string" || !employee_id.trim())
    ) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("people")
      .insert({
        person_type,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        student_id: person_type === "student" ? student_id.trim() : null,
        student_class: person_type === "student" ? student_class || null : null,
        section: person_type === "student" ? section || null : null,
        employee_id: person_type === "staff" ? employee_id.trim() : null,
        designation: person_type === "staff" ? designation || null : null,
        department: department || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ person: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
// PUT: Update a student or staff member
export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Record ID is required." },
        { status: 400 }
      );
    }

    const allowedFields = [
      "full_name",
      "email",
      "phone",
      "student_id",
      "student_class",
      "section",
      "employee_id",
      "designation",
      "department",
      "status",
    ];

    const safeUpdates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in updates) {
        safeUpdates[field] =
          field === "email" && typeof updates[field] === "string"
            ? updates[field].trim().toLowerCase()
            : updates[field];
      }
    }

    safeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("people")
      .update(safeUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ person: data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// DELETE: Remove a student or staff member
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Record ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("people")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}