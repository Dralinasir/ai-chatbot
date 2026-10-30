
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedGenders = ["Male", "Female", "Unisex"] as const;

async function authorizeAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return Boolean(token && (await verifyAdminToken(token)));
}

// PATCH: Update product details.
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    if (!(await authorizeAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID." },
        { status: 400 }
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
      !category.trim() ||
      typeof is_active !== "boolean" ||
      !allowedGenders.includes(gender)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid product information." },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock_quantity);
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
        { success: false, error: "Invalid price or stock quantity." },
        { status: 400 }
      );
    }

    const updatedProducts = await sql`
      UPDATE products
      SET
        name = ${name.trim()},
        slug = ${slug},
        description = ${
          typeof description === "string" ? description.trim() : null
        },
        category = ${category.trim()},
        gender = ${gender},
        price = ${parsedPrice},
        compare_at_price = ${parsedComparePrice},
        image_url = ${
          typeof image_url === "string" ? image_url.trim() || null : null
        },
        stock_quantity = ${parsedStock},
        is_active = ${is_active},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (updatedProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: updatedProducts[0],
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Product PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update product. Check whether its slug already exists.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Archive product instead of permanently deleting it.
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    if (!(await authorizeAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID." },
        { status: 400 }
      );
    }

    const archivedProducts = await sql`
      UPDATE products
      SET
        is_active = FALSE,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, is_active
    `;

    if (archivedProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: archivedProducts[0],
      message: "Product archived successfully.",
    });
  } catch (error) {
    console.error("Product DELETE error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to archive product." },
      { status: 500 }
    );
  }
}
