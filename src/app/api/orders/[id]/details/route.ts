
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID." },
        { status: 400 }
      );
    }

    // Fetch order information
    const orders = await sql`
      SELECT
        id,
        order_number,
        customer_name,
        email,
        phone,
        city,
        address,
        postal_code,
        notes,
        payment_method,
        subtotal,
        shipping,
        total,
        status,
        created_at
      FROM orders
      WHERE id = ${id}
      LIMIT 1
    `;

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // Fetch purchased products
    const items = await sql`
      SELECT
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        line_total
      FROM order_items
      WHERE order_id = ${id}
      ORDER BY id ASC
    `;

    return NextResponse.json(
      {
        success: true,
        order: orders[0],
        items,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Order details API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to fetch order details." },
      { status: 500 }
    );
  }
}
