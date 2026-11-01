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

// GET: Fetch messages for a community
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
    .from("community_messages")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ messages: data || [] });
}

// POST: Create a new message
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
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!communityId || typeof communityId !== "string") {
      return NextResponse.json(
        { error: "Community ID is required." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message cannot exceed 5000 characters." },
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
      .from("community_messages")
      .insert({
        community_id: communityId,
        message,
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
      { message: data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// PATCH: Edit a message
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
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (
      !id ||
      typeof id !== "string" ||
      !community_id ||
      typeof community_id !== "string"
    ) {
      return NextResponse.json(
        { error: "Message ID and community ID are required." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message cannot exceed 5000 characters." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("community_messages")
      .update({
        message,
        updated_at: new Date().toISOString(),
      })
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
        { error: "Message not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// DELETE: Delete a message
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
      !id ||
      typeof id !== "string" ||
      !community_id ||
      typeof community_id !== "string"
    ) {
      return NextResponse.json(
        { error: "Message ID and community ID are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("community_messages")
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
        { error: "Message not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}