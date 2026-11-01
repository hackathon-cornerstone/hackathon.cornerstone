
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    const encodedHash = process.env.ADMIN_MASTER_PASSWORD_HASH_B64;

const passwordHash = encodedHash
  ? Buffer.from(encodedHash, "base64").toString("utf8")
  : undefined;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!passwordHash || !sessionSecret) {
      console.error("Admin authentication environment variables are missing.");

      return NextResponse.json(
        { error: "Admin authentication is not configured." },
        { status: 500 }
      );
    }

    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid administrator password." },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(sessionSecret);

    const token = await new SignJWT({
      role: "admin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Admin login successful.",
    });

    response.cookies.set("nexora_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { error: "Unable to process login request." },
      { status: 500 }
    );
  }
}
