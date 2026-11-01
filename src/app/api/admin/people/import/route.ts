
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

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const records = body.records;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No records provided." },
        { status: 400 }
      );
    }

    if (records.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 records per import." },
        { status: 400 }
      );
    }

    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const validRecords = [];
    const failedRecords = [];

    for (let index = 0; index < records.length; index++) {
      const person = records[index];
      const rowNumber = index + 2;

      if (
        !person ||
        !["student", "staff"].includes(person.person_type)
      ) {
        failedRecords.push({
          row: rowNumber,
          reason: "Invalid person type.",
        });
        continue;
      }

      const type = person.person_type;
      const name =
        typeof person.full_name === "string"
          ? person.full_name.trim()
          : "";
      const email =
        typeof person.email === "string"
          ? person.email.trim().toLowerCase()
          : "";

      const id =
        type === "student"
          ? typeof person.student_id === "string"
            ? person.student_id.trim()
            : ""
          : typeof person.employee_id === "string"
            ? person.employee_id.trim()
            : "";

      if (!name || !email || !id) {
        failedRecords.push({
          row: rowNumber,
          reason: "Name, email and the appropriate ID are required.",
        });
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        failedRecords.push({
          row: rowNumber,
          reason: "Invalid email address.",
        });
        continue;
      }

      const normalizedId = `${type}:${id.toLowerCase()}`;

      if (seenIds.has(normalizedId) || seenEmails.has(email)) {
        failedRecords.push({
          row: rowNumber,
          reason: "Duplicate ID or email in uploaded file.",
        });
        continue;
      }

      seenIds.add(normalizedId);
      seenEmails.add(email);

      validRecords.push({
        person_type: type,
        full_name: name,
        email,
        phone:
          typeof person.phone === "string" && person.phone.trim()
            ? person.phone.trim()
            : null,
        student_id: type === "student" ? id : null,
        student_class:
          type === "student" ? person.student_class || null : null,
        section: type === "student" ? person.section || null : null,
        employee_id: type === "staff" ? id : null,
        designation: type === "staff" ? person.designation || null : null,
        department: person.department || null,
      });
    }

    let imported = 0;

    for (let i = 0; i < validRecords.length; i += 100) {
      const batch = validRecords.slice(i, i + 100);

      const { data, error } = await supabaseAdmin
        .from("people")
        .insert(batch)
        .select("id");

      if (error) {
        batch.forEach((_, batchIndex) => {
          failedRecords.push({
            row: i + batchIndex + 2,
            reason: error.message,
          });
        });
      } else {
        imported += data?.length || 0;
      }
    }

    return NextResponse.json({
      imported,
      failed: failedRecords.length,
      failedRecords,
      total: records.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid import request." },
      { status: 400 }
    );
  }
}
