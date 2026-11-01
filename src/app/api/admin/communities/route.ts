
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Verify administrator session
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

// GET: Retrieve all communities
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("activity_communities")
    .select(`
      id,
      activity_id,
      community_name,
      description,
      status,
      created_at,
      updated_at,
      activity:activities (
        title,
        category,
        activity_date,
        venue
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    communities: data || [],
  });
}

// POST: Create a new community
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const name =
      typeof body.community_name === "string"
        ? body.community_name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const activityId = body.activity_id || null;

    if (!name) {
      return NextResponse.json(
        { error: "Community name is required." },
        { status: 400 }
      );
    }

    if (
      activityId !== null &&
      (typeof activityId !== "string" || !activityId.trim())
    ) {
      return NextResponse.json(
        { error: "Invalid activity ID." },
        { status: 400 }
      );
    }

    // Prevent duplicate communities for the same activity.
    if (activityId) {
      const { data: existing } = await supabaseAdmin
        .from("activity_communities")
        .select("id")
        .eq("activity_id", activityId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "A community already exists for this activity." },
          { status: 409 }
        );
      }
    }

    // Validate linked activity if supplied.
    if (activityId) {
      const { data: activity, error: activityError } =
        await supabaseAdmin
          .from("activities")
          .select("id")
          .eq("id", activityId)
          .maybeSingle();

      if (activityError || !activity) {
        return NextResponse.json(
          { error: "The selected activity was not found." },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("activity_communities")
      .insert({
        community_name: name,
        description: description || null,
        activity_id: activityId,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { community: data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// PATCH: Edit, archive or restore a community
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Community ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.community_name === "string") {
      const name = body.community_name.trim();

      if (!name) {
        return NextResponse.json(
          { error: "Community name cannot be empty." },
          { status: 400 }
        );
      }

      updates.community_name = name;
    }

    if (
      typeof body.description === "string" ||
      body.description === null
    ) {
      updates.description =
        typeof body.description === "string"
          ? body.description.trim() || null
          : null;
    }

    if (body.status !== undefined) {
      if (!["active", "archived"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid community status." },
          { status: 400 }
        );
      }

      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid changes provided." },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("activity_communities")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      community: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// DELETE: Permanently delete a community
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Community ID is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("activity_communities")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Community not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Community deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
