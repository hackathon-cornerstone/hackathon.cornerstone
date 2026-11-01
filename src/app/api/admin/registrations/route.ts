import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexora_admin_session")?.value;

  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) return false;

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }

  try {
    const { data: registrations, error } = await supabaseAdmin
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const activityIds = [
      ...new Set(
        (registrations || []).map((item) => item.activity_id)
      ),
    ];

    let activities: { id: string; title: string }[] = [];

    if (activityIds.length > 0) {
      const { data, error: activityError } = await supabaseAdmin
        .from("activities")
        .select("id, title")
        .in("id", activityIds);

      if (activityError) {
        return NextResponse.json(
          { error: activityError.message },
          { status: 500 }
        );
      }

      activities = data || [];
    }

    const activityMap = new Map(
      activities.map((activity) => [activity.id, activity.title])
    );

    const result = (registrations || []).map((registration) => ({
      ...registration,
      activity_title:
        activityMap.get(registration.activity_id) || "Unknown Activity",
    }));

    return NextResponse.json({ registrations: result });
  } catch {
    return NextResponse.json(
      { error: "Unable to load registrations" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid registration ID or status" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("registrations")
      .update({ registration_status: status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Registration ${status} successfully`,
      registration: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to update registration" },
      { status: 500 }
    );
  }
}
