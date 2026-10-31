
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerToken,
} from "@/lib/customer-auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        customer: null,
      });
    }

    const customerId = await verifyCustomerToken(token);

    if (!customerId || !/^\d+$/.test(customerId)) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        customer: null,
      });
    }

    const customers = await sql`
      SELECT id, full_name, email
      FROM customers
      WHERE id = ${customerId}
      LIMIT 1
    `;

    const customer = customers[0];

    if (!customer) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        customer: null,
      });
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        customer: {
          id: customer.id,
          fullName: customer.full_name,
          email: customer.email,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Customer session error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to check customer session." },
      { status: 500 }
    );
  }
}
