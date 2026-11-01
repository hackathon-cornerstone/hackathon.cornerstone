
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

// GET: Retrieve announcements for one community
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const communityId = request.nextUrl.searchParams.get("community_id");

  if (!communityId) {
    return NextResponse.json(
      { error: "Community ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("community_announcements")
    .select(`
      id,
      community_id,
      author_person_id,
      title,
      content,
      is_pinned,
      created_at,
      updated_at
    `)
    .eq("community_id", communityId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    announcements: data || [],
  });
}

// POST: Publish a new announcement
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const communityId = body.community_id;
    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (
      typeof communityId !== "string" ||
      !communityId.trim() ||
      !title ||
      !content
    ) {
      return NextResponse.json(
        { error: "Community, title and content are required." },
        { status: 400 }
      );
    }

    if (title.length > 200 || content.length > 10000) {
      return NextResponse.json(
        { error: "Title or content exceeds the allowed length." },
        { status: 400 }
      );
    }

    const { data: community, error: communityError } =
      await supabaseAdmin
        .from("activity_communities")
        .select("id")
        .eq("id", communityId)
        .maybeSingle();

    if (communityError || !community) {
      return NextResponse.json(
        { error: "Community not found." },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("community_announcements")
      .insert({
        community_id: communityId,
        title,
        content,
        is_pinned: false,
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
      { announcement: data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// PATCH: Edit or pin/unpin an announcement
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, community_id } = body;

    if (
      typeof id !== "string" ||
      typeof community_id !== "string"
    ) {
      return NextResponse.json(
        { error: "Announcement ID and community ID are required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim() ||
        body.title.trim().length > 200
      ) {
        return NextResponse.json(
          { error: "A valid announcement title is required." },
          { status: 400 }
        );
      }

      updates.title = body.title.trim();
    }

    if (body.content !== undefined) {
      if (
        typeof body.content !== "string" ||
        !body.content.trim() ||
        body.content.trim().length > 10000
      ) {
        return NextResponse.json(
          { error: "Valid announcement content is required." },
          { status: 400 }
        );
      }

      updates.content = body.content.trim();
    }

    if (body.is_pinned !== undefined) {
      if (typeof body.is_pinned !== "boolean") {
        return NextResponse.json(
          { error: "Invalid pin value." },
          { status: 400 }
        );
      }

      updates.is_pinned = body.is_pinned;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No changes provided." },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("community_announcements")
      .update(updates)
      .eq("id", id)
      .eq("community_id", community_id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Announcement not found in this community." },
        { status: 404 }
      );
    }

    return NextResponse.json({ announcement: data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// DELETE: Delete an announcement from its own community
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, community_id } = body;

    if (
      typeof id !== "string" ||
      typeof community_id !== "string"
    ) {
      return NextResponse.json(
        { error: "Announcement ID and community ID are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("community_announcements")
      .delete()
      .eq("id", id)
      .eq("community_id", community_id)
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
        { error: "Announcement not found in this community." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
