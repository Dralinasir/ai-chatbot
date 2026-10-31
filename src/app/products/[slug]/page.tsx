
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import {
  ShoppingBag,
  ArrowLeft,
  Check,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  gender?: "Male" | "Female" | "Unisex";
  price: number | string;
  compare_at_price: number | string | null;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
};

const clothingSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const shoeSizes = ["39", "40", "41", "42", "43", "44", "45"];

function getProductSizes(product: Product) {
  const category = product.category.toLowerCase();

  if (category.includes("shoe") || category.includes("footwear")) {
    return shoeSizes;
  }

  if (
    category.includes("accessor") ||
    category.includes("bag") ||
    category.includes("watch") ||
    category.includes("jewelry")
  ) {
    return ["One Size"];
  }

  return clothingSizes;
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/products/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Product not found.");
        }

        if (active) {
          setProduct(data.product);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this product."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      fetchProduct();
    }

    return () => {
      active = false;
    };
  }, [slug]);

  function handleAddToCart() {
    if (!product || !selectedSize || product.stock_quantity <= 0) {
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      image: product.image_url || "",
      size: selectedSize,
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin" />
        <span className="ml-3">Loading product...</span>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center px-5 text-center">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-gray-500">
          {error || "This product is unavailable."}
        </p>
        <Link
          href="/products"
          className="mt-6 bg-black text-white px-6 py-3 rounded-lg"
        >
          Browse Products
        </Link>
      </main>
    );
  }

  const sizes = getProductSizes(product);
  const price = Number(product.price);
  const comparePrice =
    product.compare_at_price === null
      ? null
      : Number(product.compare_at_price);

  const inStock = product.stock_quantity > 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-14">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8"
      >
        <ArrowLeft size={17} />
        Back to products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
        <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-[4/5] flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag className="w-20 h-20 text-gray-300" />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            {product.category}
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mt-5">
            <span className="text-2xl font-bold">
              Rs. {price.toLocaleString("en-PK")}
            </span>

            {comparePrice !== null &&
              Number.isFinite(comparePrice) &&
              comparePrice > price && (
                <span className="text-gray-400 line-through">
                  Rs. {comparePrice.toLocaleString("en-PK")}
                </span>
              )}
          </div>

          {product.description && (
            <p className="text-gray-600 leading-7 mt-6 whitespace-pre-line">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Select Size</h2>
              <span className="text-xs text-gray-500">
                {product.category.toLowerCase().includes("shoe") ||
                product.category.toLowerCase().includes("footwear")
                  ? "EU sizes"
                  : "Available sizes"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-12 h-12 px-3 border rounded-lg font-medium transition ${
                    selectedSize === size
                      ? "bg-black text-white border-black"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {inStock ? (
              <p className="text-sm text-green-700">
                In stock ({product.stock_quantity} available)
              </p>
            ) : (
              <p className="text-sm text-red-600">
                Currently out of stock
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedSize || !inStock}
            className="mt-6 w-full bg-black text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {added ? (
              <>
                <Check size={20} />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingBag size={20} />
                {inStock
                  ? selectedSize
                    ? "Add to Cart"
                    : "Select a Size"
                  : "Out of Stock"}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Secure checkout · Cash on Delivery
          </p>
        </div>
      </div>
    </main>
  );
}
