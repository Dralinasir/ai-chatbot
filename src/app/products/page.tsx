
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import {
  ShoppingBag,
  Search,
  Heart,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
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

const fallbackImage =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900";

const genderOptions = ["All", "Male", "Female", "Unisex"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeGender, setActiveGender] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [favorites, setFavorites] = useState<number[]>([]);

  const { addToCart, cartCount } = useCart();

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load products.");
      }

      setProducts(
        Array.isArray(data.products)
          ? data.products.filter(
              (product: Product) => product.is_active
            )
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(products.map((product) => product.category))),
  ];

  const filteredProducts = products
    .filter((product) => {
      const productGender = product.gender || "Unisex";

      const matchesGender =
        activeGender === "All" ||
        (activeGender === "Male" &&
          (productGender === "Male" || productGender === "Unisex")) ||
        (activeGender === "Female" &&
          (productGender === "Female" || productGender === "Unisex")) ||
        (activeGender === "Unisex" && productGender === "Unisex");

      const matchesCategory =
        activeCategory === "All" ||
        product.category === activeCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase());

      return matchesGender && matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sort === "low") return Number(a.price) - Number(b.price);
      if (sort === "high") return Number(b.price) - Number(a.price);
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(b.id) - Number(a.id);
    });

  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function handleAddToCart(product: Product) {
    addToCart({
      id: Number(product.id),
      name: product.name,
      category: product.category,
      price: Number(product.price),
      image: product.image_url || fallbackImage,
    });
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-neutral-900">
      <div className="bg-neutral-950 px-4 py-2.5 text-center text-xs tracking-[0.15em] text-white">
        COMPLIMENTARY SHIPPING ON ORDERS OVER RS. 8,000
      </div>

      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-[#faf9f6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link href="/" className="text-2xl font-black tracking-[0.2em]">
            FASHION<span className="font-light">AI</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <Link href="/" className="transition hover:text-neutral-500">
              Home
            </Link>
            <Link
              href="/products"
              className="font-semibold underline underline-offset-8"
            >
              Shop All
            </Link>
            <Link
              href="/#collections"
              className="transition hover:text-neutral-500"
            >
              Collections
            </Link>
            <Link
              href="/assistant"
              className="transition hover:text-neutral-500"
            >
              AI Stylist
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-neutral-500 sm:inline">
              {cartCount} items in cart
            </span>

            <Link
              href="/cart"
              aria-label={`Shopping cart with ${cartCount} items`}
              className="relative rounded-full border border-neutral-300 p-2.5 transition hover:bg-neutral-900 hover:text-white"
            >
              <ShoppingBag size={19} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-950 px-1 text-[10px] text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-8 pt-12 md:px-8 md:pt-16">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
          <Link href="/">Home</Link>
          <span>/</span>
          <span className="text-neutral-900">Shop All</span>
        </div>

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              <Sparkles size={15} />
              The FashionAI Edit
            </p>

            <h1 className="text-4xl font-light tracking-tight md:text-6xl">
              Find your{" "}
              <span className="font-semibold">everyday style.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 md:text-base">
              Discover thoughtfully selected essentials, modern classics, and
              pieces that make your personal style your own.
            </p>
          </div>

          <div className="text-sm text-neutral-500">
            {loading ? "Loading..." : `${filteredProducts.length} products`}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
        <div className="mb-8 space-y-5 border-y border-neutral-200 py-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Shop by gender
            </p>

            <div className="flex flex-wrap gap-2">
              {genderOptions.map((gender) => (
                <button
                  key={gender}
                  onClick={() => setActiveGender(gender)}
                  className={`rounded-full border px-5 py-2.5 text-sm transition ${
                    activeGender === gender
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 hover:border-neutral-950"
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Shop by category
            </p>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-5 py-2.5 text-sm transition ${
                    activeCategory === category
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 hover:border-neutral-950"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2.5">
              <Search size={17} className="text-neutral-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm outline-none sm:w-44"
              />
            </label>

            <label className="flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2.5">
              <SlidersHorizontal size={16} />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="bg-transparent text-sm outline-none"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>
        </div>

        {loading && (
          <div className="py-20 text-center text-sm text-neutral-500">
            Loading products from database...
          </div>
        )}

        {!loading && error && (
          <div className="py-20 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadProducts}
              className="mt-5 bg-neutral-950 px-6 py-3 text-sm text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const price = Number(product.price);
              const oldPrice = Number(product.compare_at_price || 0);

              return (
                <article key={product.id} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                    <Link href={`/products/${product.slug}`}>
                      <img
                        src={product.image_url || fallbackImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    </Link>

                    <span className="absolute left-3 top-3 bg-white px-3 py-1.5 text-[10px] font-semibold tracking-[0.15em]">
                      {oldPrice > price ? "SALE" : "NEW ARRIVAL"}
                    </span>

                    <button
                      onClick={() => toggleFavorite(Number(product.id))}
                      aria-label={
                        favorites.includes(Number(product.id))
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      className="absolute right-3 top-3 rounded-full bg-white p-2.5 transition hover:bg-neutral-900 hover:text-white"
                    >
                      <Heart
                        size={17}
                        fill={
                          favorites.includes(Number(product.id))
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity <= 0}
                      className="absolute bottom-3 left-3 right-3 bg-white py-3 text-sm font-medium shadow-sm transition hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      {product.stock_quantity <= 0
                        ? "OUT OF STOCK"
                        : "+ Quick Add"}
                    </button>
                  </div>

                  <div className="pt-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.15em] text-neutral-500">
                      {product.category} · {product.gender || "Unisex"}
                    </p>

                    <Link href={`/products/${product.slug}`}>
                      <h2 className="font-medium transition hover:text-neutral-500">
                        {product.name}
                      </h2>
                    </Link>

                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="font-semibold">
                        Rs. {price.toLocaleString("en-PK")}
                      </span>

                      {oldPrice > price && (
                        <span className="text-neutral-400 line-through">
                          Rs. {oldPrice.toLocaleString("en-PK")}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity <= 0}
                      className="mt-4 flex w-full items-center justify-center gap-2 border border-neutral-300 py-3 text-sm transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingBag size={16} />
                      Add to Cart
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-xl">No products found</p>
            <p className="mt-2 text-sm text-neutral-500">
              There are no matching database products. Try another filter or
              add products from your admin dashboard.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
                setActiveGender("All");
              }}
              className="mt-5 underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="mt-16 border-t border-neutral-200 pt-8 text-center">
          <p className="text-sm text-neutral-500">
            Looking for something that suits you?
          </p>

          <Link
            href="/assistant"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
          >
            Ask our AI Stylist <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="bg-neutral-950 px-5 py-10 text-center text-white">
        <Link href="/" className="text-xl font-black tracking-[0.2em]">
          FASHION<span className="font-light">AI</span>
        </Link>

        <p className="mt-3 text-xs text-neutral-400">
          Personal style, made simpler.
        </p>

        <p className="mt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} FashionAI. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
