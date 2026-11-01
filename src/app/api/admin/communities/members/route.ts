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

// GET: Fetch members of a community
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
    .from("community_members")
    .select(`
      id,
      community_id,
      person_id,
      member_role,
      membership_status,
      invited_at,
      joined_at,
      created_at,
      person:people (
        id,
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
        status
      )
    `)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ members: data || [] });
}

// POST: Invite a student or staff member
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const { community_id, person_id } = body;
    const member_role = body.member_role || "student";

    if (
      !community_id ||
      typeof community_id !== "string" ||
      !person_id ||
      typeof person_id !== "string"
    ) {
      return NextResponse.json(
        { error: "Community ID and Person ID are required." },
        { status: 400 }
      );
    }

    if (!["student", "staff", "coordinator"].includes(member_role)) {
      return NextResponse.json(
        { error: "Invalid member role." },
        { status: 400 }
      );
    }

    const { data: community, error: communityError } =
      await supabaseAdmin
        .from("activity_communities")
        .select("id")
        .eq("id", community_id)
        .maybeSingle();

    if (communityError || !community) {
      return NextResponse.json(
        { error: "Community not found." },
        { status: 404 }
      );
    }

    const { data: person, error: personError } =
      await supabaseAdmin
        .from("people")
        .select("id, person_type, status")
        .eq("id", person_id)
        .maybeSingle();

    if (personError || !person) {
      return NextResponse.json(
        { error: "Person not found in the People directory." },
        { status: 404 }
      );
    }

    if (person.status !== "active") {
      return NextResponse.json(
        { error: "This person is inactive and cannot be invited." },
        { status: 400 }
      );
    }

    if (
      (member_role === "student" && person.person_type !== "student") ||
      (["staff", "coordinator"].includes(member_role) &&
        person.person_type !== "staff")
    ) {
      return NextResponse.json(
        { error: "The selected role does not match this person's type." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("community_members")
      .select("id, membership_status")
      .eq("community_id", community_id)
      .eq("person_id", person_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: `This person already has a membership record (${existing.membership_status}).`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("community_members")
      .insert({
        community_id,
        person_id,
        member_role,
        membership_status: "invited",
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
      {
        success: true,
        message: "Invitation created successfully.",
        member: data,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// PATCH: Update member role or invitation status
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
        { error: "Membership ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.member_role !== undefined) {
      if (!["student", "staff", "coordinator"].includes(body.member_role)) {
        return NextResponse.json(
          { error: "Invalid member role." },
          { status: 400 }
        );
      }

      updates.member_role = body.member_role;
    }

    if (body.membership_status !== undefined) {
      if (!["invited", "pending", "active", "declined", "removed"].includes(
        body.membership_status
      )) {
        return NextResponse.json(
          { error: "Invalid membership status." },
          { status: 400 }
        );
      }

      updates.membership_status = body.membership_status;

      if (body.membership_status === "active") {
        updates.joined_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid changes provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("community_members")
      .update(updates)
      .eq("id", id)
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
        { error: "Membership record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ member: data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// DELETE: Remove a member from a community
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
        { error: "Membership ID is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("community_members")
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
        { error: "Membership record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully.",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}