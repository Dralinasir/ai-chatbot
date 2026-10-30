"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import {
  ShoppingBag,
  Search,
  Heart,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "Classic Oversized Tee",
    category: "Clothing",
    price: 2499,
    oldPrice: 3200,
    color: "bg-stone-200",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=85",
    tag: "BESTSELLER",
  },
  {
    id: 2,
    name: "Minimal Everyday Sneakers",
    category: "Shoes",
    price: 6499,
    oldPrice: 7999,
    color: "bg-neutral-100",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=85",
    tag: "POPULAR",
  },
  {
    id: 3,
    name: "Premium Leather Bag",
    category: "Accessories",
    price: 4999,
    oldPrice: null,
    color: "bg-amber-100",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&q=85",
    tag: "NEW",
  },
  {
    id: 4,
    name: "Everyday Streetwear Hoodie",
    category: "Clothing",
    price: 4299,
    oldPrice: 5200,
    color: "bg-stone-200",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&q=85",
    tag: "SALE",
  },
  {
    id: 5,
    name: "Modern Wrist Watch",
    category: "Accessories",
    price: 5499,
    oldPrice: null,
    color: "bg-neutral-100",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85",
    tag: "TRENDING",
  },
  {
    id: 6,
    name: "Essential White Sneakers",
    category: "Shoes",
    price: 5999,
    oldPrice: null,
    color: "bg-stone-100",
    image:
      "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=700&q=85",
    tag: "POPULAR",
  },
  {
    id: 7,
    name: "Everyday Shoulder Bag",
    category: "Accessories",
    price: 3799,
    oldPrice: 4500,
    color: "bg-orange-50",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&q=85",
    tag: "SALE",
  },
  {
    id: 8,
    name: "Relaxed Fit Casual Shirt",
    category: "Clothing",
    price: 3299,
    oldPrice: null,
    color: "bg-stone-100",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&q=85",
    tag: "NEW",
  },
];

const categories = ["All", "Clothing", "Shoes", "Accessories"];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [favorites, setFavorites] = useState<number[]>([]);

  const { addToCart, cartCount } = useCart();

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        activeCategory === "All" ||
        product.category === activeCategory;

      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return a.id - b.id;
    });

  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function handleAddToCart(product: (typeof products)[number]) {
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
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
            {filteredProducts.length} products
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
        <div className="mb-8 flex flex-col gap-4 border-y border-neutral-200 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-5 py-2.5 text-sm transition ${
                  activeCategory === category
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 bg-transparent hover:border-neutral-950"
                }`}
              >
                {category}
              </button>
            ))}
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

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <article key={product.id} className="group">
                <div
                  className={`relative aspect-[4/5] overflow-hidden ${product.color}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  <span className="absolute left-3 top-3 bg-white px-3 py-1.5 text-[10px] font-semibold tracking-[0.15em]">
                    {product.tag}
                  </span>

                  <button
                    onClick={() => toggleFavorite(product.id)}
                    aria-label={
                      favorites.includes(product.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                    className="absolute right-3 top-3 rounded-full bg-white p-2.5 transition hover:bg-neutral-900 hover:text-white"
                  >
                    <Heart
                      size={17}
                      fill={
                        favorites.includes(product.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="absolute bottom-3 left-3 right-3 bg-white py-3 text-sm font-medium opacity-100 shadow-sm transition duration-300 hover:bg-neutral-900 hover:text-white"
                  >
                    + Quick Add
                  </button>
                </div>

                <div className="pt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-neutral-500">
                    {product.category}
                  </p>

                  <h2 className="font-medium">{product.name}</h2>

                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="font-semibold">
                      Rs. {product.price.toLocaleString("en-PK")}
                    </span>

                    {product.oldPrice && (
                      <span className="text-neutral-400 line-through">
                        Rs. {product.oldPrice.toLocaleString("en-PK")}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-4 flex w-full items-center justify-center gap-2 border border-neutral-300 py-3 text-sm transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                  >
                    <ShoppingBag size={16} />
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-xl">No products found</p>

            <p className="mt-2 text-sm text-neutral-500">
              Try another search or choose a different category.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
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
          © {new Date().getFullYear()} FashionAI. Portfolio project.
        </p>
      </footer>
    </main>
  );
}