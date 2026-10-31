import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerToken,
} from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Please login to view your orders." },
        { status: 401 }
      );
    }

    const customerId = await verifyCustomerToken(token);

    if (!customerId || !/^\d+$/.test(customerId)) {
      return NextResponse.json(
        { success: false, message: "Your session is invalid. Please login again." },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT
        id,
        order_number,
        subtotal,
        shipping,
        total,
        status,
        created_at
      FROM orders
      WHERE customer_id = ${customerId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(
      {
        success: true,
        orders: result,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Customer orders error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load your orders." },
      { status: 500 }
    );
  }
}