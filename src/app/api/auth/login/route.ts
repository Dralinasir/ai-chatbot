
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { sql } from "@/lib/db";
import {
  createCustomerToken,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customer-auth";

export const runtime = "nodejs";

const scrypt = promisify(scryptCallback);

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, originalHash] = storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !salt ||
    !originalHash ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(originalHash)
  ) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const originalBuffer = Buffer.from(originalHash, "hex");

  return (
    derivedKey.length === originalBuffer.length &&
    timingSafeEqual(derivedKey, originalBuffer)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!email || !password || email.length > 254 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: "Please enter valid login details." },
        { status: 400 }
      );
    }

    const customers = await sql`
      SELECT id, full_name, email, password_hash
      FROM customers
      WHERE LOWER(email) = ${email}
      LIMIT 1
    `;

    const customer = customers[0];

    if (
      !customer ||
      typeof customer.password_hash !== "string" ||
      !(await verifyPassword(password, customer.password_hash))
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createCustomerToken(String(customer.id));

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      customer: {
        id: customer.id,
        fullName: customer.full_name,
        email: customer.email,
      },
    });

    response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Customer login error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to login. Please try again." },
      { status: 500 }
    );
  }
}
