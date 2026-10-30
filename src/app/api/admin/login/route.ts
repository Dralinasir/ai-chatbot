
import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Admin login is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const submittedPassword = body?.password;

    if (
      typeof submittedPassword !== "string" ||
      submittedPassword.length > 200 ||
      submittedPassword !== password
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid password." },
        { status: 401 }
      );
    }

    const token = await createAdminToken();

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log in." },
      { status: 500 }
    );
  }
}
