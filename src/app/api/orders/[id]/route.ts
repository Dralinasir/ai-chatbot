
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/admin-auth";

const allowedStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof allowedStatuses)[number];

export async function PATCH(
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

    // Validate order ID
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID." },
        { status: 400 }
      );
    }

    // Validate requested status
    const body = await request.json().catch(() => null);
    const status = body?.status;

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status as OrderStatus)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid order status." },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${id}
      RETURNING id, order_number, status
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully.",
      order: result[0],
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update order status." },
      { status: 500 }
    );
  }
}
