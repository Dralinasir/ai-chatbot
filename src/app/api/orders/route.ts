
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/admin-auth";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderRequest = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  postalCode?: string;
  notes?: string;
  items: OrderItem[];
};

// GET: Only authenticated admin can fetch customer orders
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

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
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Fetch orders API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to fetch orders." },
      { status: 500 }
    );
  }
}

// POST: Create a new customer order
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequest;

    const {
      fullName,
      email,
      phone,
      city,
      address,
      postalCode,
      notes,
      items,
    } = body;

    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !city?.trim() ||
      !address?.trim()
    ) {
      return NextResponse.json(
        { error: "Please complete all required customer details." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { error: "Your cart is empty or invalid." },
        { status: 400 }
      );
    }

    const validatedItems = items.map((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 100 ||
        !Number.isFinite(price) ||
        price < 0 ||
        price > 100000000
      ) {
        throw new Error("Invalid product information.");
      }

      return {
        id: item.id,
        name: item.name.trim(),
        price,
        quantity,
        lineTotal: price * quantity,
      };
    });

    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    const shipping = subtotal >= 10000 ? 0 : 250;
    const total = subtotal + shipping;

    const orderNumber = `FA-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    const result = await sql`
      INSERT INTO orders (
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
        total
      )
      VALUES (
        ${orderNumber},
        ${fullName.trim()},
        ${email.trim()},
        ${phone.trim()},
        ${city.trim()},
        ${address.trim()},
        ${postalCode?.trim() || null},
        ${notes?.trim() || null},
        'COD',
        ${subtotal},
        ${shipping},
        ${total}
      )
      RETURNING id, order_number
    `;

    const order = result[0];

    if (!order) {
      throw new Error("Order could not be created.");
    }

    for (const item of validatedItems) {
      await sql`
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          line_total
        )
        VALUES (
          ${order.id},
          ${item.id},
          ${item.name},
          ${item.quantity},
          ${item.price},
          ${item.lineTotal}
        )
      `;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully.",
        orderNumber: order.order_number,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      { error: "Unable to place your order. Please try again." },
      { status: 500 }
    );
  }
}
