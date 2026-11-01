
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.redirect(
    new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );

  response.cookies.set("nexora_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
