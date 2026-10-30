
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/admin-auth";

const allowedGenders = ["Male", "Female", "Unisex"] as const;

// GET: Public active products; admin can also see inactive products.
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const isAdmin = token ? await verifyAdminToken(token) : false;

    const products = isAdmin
      ? await sql`
          SELECT *
          FROM products
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT *
          FROM products
          WHERE is_active = TRUE
          ORDER BY created_at DESC
        `;

    return NextResponse.json(
      { success: true, products },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Products GET error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to fetch products." },
      { status: 500 }
    );
  }
}

// POST: Only authenticated admin can add products.
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      name,
      slug,
      description,
      category,
      gender = "Unisex",
      price,
      compare_at_price,
      image_url,
      stock_quantity,
      is_active,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, valid slug and category are required.",
        },
        { status: 400 }
      );
    }

    if (!allowedGenders.includes(gender)) {
      return NextResponse.json(
        {
          success: false,
          error: "Gender must be Male, Female or Unisex.",
        },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock_quantity ?? 0);
    const parsedComparePrice =
      compare_at_price === "" || compare_at_price == null
        ? null
        : Number(compare_at_price);

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0 ||
      (parsedComparePrice !== null &&
        (!Number.isFinite(parsedComparePrice) ||
          parsedComparePrice < 0))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter valid price and stock values.",
        },
        { status: 400 }
      );
    }

    const products = await sql`
      INSERT INTO products (
        name,
        slug,
        description,
        category,
        gender,
        price,
        compare_at_price,
        image_url,
        stock_quantity,
        is_active
      )
      VALUES (
        ${name.trim()},
        ${slug},
        ${typeof description === "string" ? description.trim() : null},
        ${category.trim()},
        ${gender},
        ${parsedPrice},
        ${parsedComparePrice},
        ${typeof image_url === "string" ? image_url.trim() || null : null},
        ${parsedStock},
        ${typeof is_active === "boolean" ? is_active : true}
      )
      RETURNING *
    `;

    return NextResponse.json(
      { success: true, product: products[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Products POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create product. Check whether its slug already exists.",
      },
      { status: 500 }
    );
  }
}
