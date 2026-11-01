
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

// GET: Retrieve resources for one community
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");

    let query = supabaseAdmin
      .from("community_resources")
      .select(`
        id,
        community_id,
        uploaded_by,
        title:resource_name,
        description:resource_description,
        file_path,
        file_type,
        file_size,
        created_at
      `);

    if (communityId) {
      query = query.eq("community_id", communityId);
    }

    const { data, error } = await query.order(
      "created_at",
      { ascending: false }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ resources: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

// POST: Upload a new resource to a community
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let uploadedFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const communityId = formData.get("communityId");
    const title = formData.get("title");
    const description = formData.get("description");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "A valid file is required" },
        { status: 400 }
      );
    }

    if (
      typeof communityId !== "string" ||
      !communityId.trim()
    ) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    if (title !== null && typeof title !== "string") {
      return NextResponse.json(
        { error: "Invalid resource title" },
        { status: 400 }
      );
    }

    if (
      description !== null &&
      typeof description !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid resource description" },
        { status: 400 }
      );
    }

    // Verify that the community exists
    const { data: community, error: communityError } =
      await supabaseAdmin
        .from("activity_communities")
        .select("id")
        .eq("id", communityId)
        .single();

    if (communityError || !community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Maximum file size: 10 MB
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    // Generate a unique storage filename
    const originalExtension =
      file.name.split(".").pop() || "bin";

    const fileExt = originalExtension
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const fileName =
      `${communityId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    uploadedFilePath = fileName;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("community-resources")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Insert using the actual Supabase database column names
    const { data, error: dbError } = await supabaseAdmin
      .from("community_resources")
      .insert({
        community_id: communityId,
        resource_name: title?.trim() || file.name,
        resource_description: description?.trim() || null,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: null,
      })
      .select(`
        id,
        community_id,
        uploaded_by,
        title:resource_name,
        description:resource_description,
        file_path,
        file_type,
        file_size,
        created_at
      `)
      .single();

    if (dbError) {
      // Clean up storage file if database insertion fails
      await supabaseAdmin.storage
        .from("community-resources")
        .remove([fileName]);

      uploadedFilePath = null;

      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    uploadedFilePath = null;

    return NextResponse.json(
      { resource: data },
      { status: 201 }
    );
  } catch {
    // Clean up uploaded file after an unexpected error
    if (uploadedFilePath) {
      await supabaseAdmin.storage
        .from("community-resources")
        .remove([uploadedFilePath]);
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

// DELETE: Remove a resource from a community
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
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the resource file path
    const { data: resource, error: resourceError } =
      await supabaseAdmin
        .from("community_resources")
        .select("file_path")
        .eq("id", id)
        .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Remove file from Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("community-resources")
      .remove([resource.file_path]);

    if (storageError) {
      return NextResponse.json(
        { error: storageError.message },
        { status: 500 }
      );
    }

    // Delete database record
    const { error: dbError } = await supabaseAdmin
      .from("community_resources")
      .delete()
      .eq("id", id);

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
