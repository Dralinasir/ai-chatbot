
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  hashPassword,
  createCustomerToken,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customer-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const fullName =
      typeof body?.fullName === "string" ? body.fullName.trim() : "";

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    if (fullName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Name is too long." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: "Password must be 8 to 128 characters." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM customers
      WHERE LOWER(email) = ${email}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await sql`
      INSERT INTO customers (
        full_name,
        email,
        password_hash
      )
      VALUES (
        ${fullName},
        ${email},
        ${passwordHash}
      )
      RETURNING id, full_name, email
    `;

    const customer = result[0];

    if (!customer) {
      throw new Error("Customer account could not be created.");
    }

    const token = await createCustomerToken(String(customer.id));

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        customer: {
          id: customer.id,
          fullName: customer.full_name,
          email: customer.email,
        },
      },
      { status: 201 }
    );

    response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Customer registration error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to create account. Please try again." },
      { status: 500 }
    );
  }
}
