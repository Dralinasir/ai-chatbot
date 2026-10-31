
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/admin-auth";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerToken,
} from "@/lib/customer-auth";

type IncomingItem = {
  id: number | string;
  quantity: number;
  size: string;
};

type OrderRequest = {
  fullName: string;
  email?: string;
  phone: string;
  city: string;
  address: string;
  postalCode?: string;
  notes?: string;
  items: IncomingItem[];
};

// GET: Only authenticated admin can fetch all customer orders.
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
        created_at,
        customer_id
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

// POST: Create order and deduct stock from database.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderRequest;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid order request." },
        { status: 400 }
      );
    }

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
      typeof fullName !== "string" ||
      !fullName.trim() ||
      fullName.trim().length > 100 ||
      (typeof email !== "string" && email !== undefined) ||
      (email !== undefined && email.length > 254) ||
      typeof phone !== "string" ||
      !phone.trim() ||
      phone.trim().length > 30 ||
      typeof city !== "string" ||
      !city.trim() ||
      city.trim().length > 100 ||
      typeof address !== "string" ||
      !address.trim() ||
      address.trim().length > 500 ||
      (postalCode !== undefined && typeof postalCode !== "string") ||
      (notes !== undefined && typeof notes !== "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete all required customer details.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { success: false, error: "Your cart is empty or invalid." },
        { status: 400 }
      );
    }

    // Combine duplicate product + size combinations.
    const quantities = new Map<
      string,
      { productId: number; size: string; quantity: number }
    >();

    // Track total quantity per product across all sizes.
    const productTotals = new Map<number, number>();

    for (const item of items) {
      const productId = Number(item?.id);
      const quantity = Number(item?.quantity);
      const size =
        typeof item?.size === "string" ? item.size.trim() : "";

      if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 100 ||
        !size ||
        size.length > 30
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid product, size, or quantity.",
          },
          { status: 400 }
        );
      }

      const key = JSON.stringify([productId, size]);
      const combinedQuantity =
        (quantities.get(key)?.quantity ?? 0) + quantity;

      if (combinedQuantity > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum quantity per product size is 100.",
          },
          { status: 400 }
        );
      }

      quantities.set(key, {
        productId,
        size,
        quantity: combinedQuantity,
      });

      const totalForProduct =
        (productTotals.get(productId) ?? 0) + quantity;

      if (totalForProduct > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum quantity per product is 100.",
          },
          { status: 400 }
        );
      }

      productTotals.set(productId, totalForProduct);
    }

    // Fetch real product information and verify current stock.
    const productData = new Map<
      number,
      { id: string; name: string; price: number }
    >();

    for (const [productId, totalQuantity] of productTotals) {
      const products = await sql`
        SELECT id, name, price, stock_quantity, is_active
        FROM products
        WHERE id = ${productId}
        LIMIT 1
      `;

      const product = products[0];

      if (!product || product.is_active !== true) {
        return NextResponse.json(
          {
            success: false,
            error:
              "One of your products is no longer available. Please update your cart.",
          },
          { status: 409 }
        );
      }

      const price = Number(product.price);
      const stock = Number(product.stock_quantity);

      if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(stock) ||
        stock < totalQuantity
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${product.name}. Please update your cart.`,
          },
          { status: 409 }
        );
      }

      productData.set(productId, {
        id: String(product.id),
        name: String(product.name),
        price,
      });
    }

    // Prepare order items using database prices.
    const validatedItems: {
      id: string;
      name: string;
      size: string;
      price: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const item of quantities.values()) {
      const product = productData.get(item.productId);

      if (!product) {
        throw new Error("Product validation failed.");
      }

      validatedItems.push({
        id: product.id,
        name: product.name,
        size: item.size,
        price: product.price,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
      });
    }

    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    const shipping = subtotal >= 10000 ? 0 : 250;
    const total = subtotal + shipping;

    // Attach order to a logged-in customer, if available.
    let customerId: string | null = null;

    const customerToken = request.cookies.get(
      CUSTOMER_COOKIE_NAME
    )?.value;

    if (customerToken) {
      const verifiedId = await verifyCustomerToken(customerToken);

      if (verifiedId && /^\d+$/.test(verifiedId)) {
        customerId = verifiedId;
      }
    }

    const orderNumber = `FA-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Prepare JSON records for one atomic database statement.
    const stockRows = Array.from(productTotals.entries()).map(
      ([productId, quantity]) => ({
        product_id: productId,
        quantity,
      })
    );

    const orderItemRows = validatedItems.map((item) => ({
      product_id: Number(item.id),
      product_name: item.name,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.lineTotal,
    }));

    // Deduct all stock, create order and save order items together.
    // If stock is insufficient or item insertion fails,
    // the complete SQL statement does not create a partial order.
    const result = await sql`
      WITH requested AS MATERIALIZED (
        SELECT product_id, quantity
        FROM jsonb_to_recordset(${JSON.stringify(stockRows)}::jsonb)
          AS r(product_id integer, quantity integer)
      ),
      eligible AS MATERIALIZED (
        SELECT COUNT(*)::integer AS eligible_count
        FROM requested r
        INNER JOIN products p ON p.id = r.product_id
        WHERE p.is_active = TRUE
          AND p.stock_quantity >= r.quantity
      ),
      updated AS (
        UPDATE products p
        SET
          stock_quantity = p.stock_quantity - r.quantity,
          updated_at = NOW()
        FROM requested r, eligible e
        WHERE p.id = r.product_id
          AND p.is_active = TRUE
          AND p.stock_quantity >= r.quantity
          AND e.eligible_count = (
            SELECT COUNT(*) FROM requested
          )
        RETURNING p.id
      ),
      created_order AS (
        INSERT INTO orders (
          order_number,
          customer_id,
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
        SELECT
          ${orderNumber},
          ${customerId},
          ${fullName.trim()},
          ${email?.trim() || ""},
          ${phone.trim()},
          ${city.trim()},
          ${address.trim()},
          ${postalCode?.trim() || null},
          ${notes?.trim() || null},
          'COD',
          ${subtotal},
          ${shipping},
          ${total}
        WHERE (
          SELECT COUNT(*) FROM updated
        ) = (
          SELECT COUNT(*) FROM requested
        )
        RETURNING id, order_number
      ),
      inserted_items AS (
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          size,
          quantity,
          unit_price,
          line_total
        )
        SELECT
          o.id,
          i.product_id,
          i.product_name,
          i.size,
          i.quantity,
          i.unit_price,
          i.line_total
        FROM jsonb_to_recordset(${JSON.stringify(orderItemRows)}::jsonb)
          AS i(
            product_id integer,
            product_name text,
            size text,
            quantity integer,
            unit_price numeric,
            line_total numeric
          )
        CROSS JOIN created_order o
        RETURNING order_id
      )
      SELECT id, order_number
      FROM created_order
    `;

    const order = result[0];

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Insufficient stock or a product is no longer available. Please update your cart.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully. Stock updated.",
        orderNumber: order.order_number,
        subtotal,
        shipping,
        total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to place your order. Please try again.",
      },
      { status: 500 }
    );
  }
}
