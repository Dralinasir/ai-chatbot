
"use client";

import { useCart } from "@/components/cart/cart-provider";
import { useEffect, useState } from "react";

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

const collections = [
  {
    name: "Women's Collection",
    description: "Effortless style for every moment.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
    link: "/products",
  },
  {
    name: "Men's Collection",
    description: "Modern essentials, timeless looks.",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200",
    link: "/products",
  },
];

const fallbackImage =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900";

export default function Home() {
  const { addToCart, cartCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

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

        if (isMounted) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading products."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleAddToCart(product: Product) {
    addToCart({
      id: Number(product.id),
      name: product.name,
      category: product.category,
      price: Number(product.price),
      image: product.image_url || fallbackImage,
    });
  }

  function renderProductSection(
    title: string,
    subtitle: string,
    sectionProducts: Product[]
  ) {
    return (
      <section className="bg-[#f7f7f7] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-gray-500">
                EXPLORE THE COLLECTION
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-wider md:text-4xl">
                {title}
              </h2>

              <p className="mt-3 text-sm text-gray-500">
                {subtitle}
              </p>
            </div>

            <a
              href="/products"
              className="w-fit border-b border-black pb-2 text-xs font-bold tracking-widest"
            >
              VIEW ALL PRODUCTS →
            </a>
          </div>

          {loading && (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading products...
            </div>
          )}

          {!loading && !error && sectionProducts.length === 0 && (
            <div className="bg-white px-5 py-16 text-center">
              <h3 className="text-lg font-semibold">
                No products in this collection yet
              </h3>
              <p className="mt-3 text-sm text-gray-500">
                Add products from the admin dashboard to display them here.
              </p>
            </div>
          )}

          {!loading && !error && sectionProducts.length > 0 && (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {sectionProducts.slice(0, 8).map((product) => {
                const price = Number(product.price);
                const oldPrice = Number(product.compare_at_price || 0);

                return (
                  <div key={product.id} className="group">
                    <div className="relative h-[350px] overflow-hidden bg-gray-200">
                      <a href={`/products/${product.slug}`}>
                        <img
                          src={product.image_url || fallbackImage}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      </a>

                      <span className="absolute left-4 top-4 bg-white px-3 py-2 text-[10px] font-bold tracking-widest">
                        NEW ARRIVAL
                      </span>
                    </div>

                    <div className="pt-5">
                      <p className="text-[10px] font-semibold tracking-widest text-gray-500">
                        {product.category}
                      </p>

                      <h3 className="mt-2 text-sm font-semibold">
                        {product.name}
                      </h3>

                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-sm font-bold">
                          Rs. {price.toLocaleString("en-PK")}
                        </span>

                        {oldPrice > price && (
                          <span className="text-xs text-gray-400 line-through">
                            Rs. {oldPrice.toLocaleString("en-PK")}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_quantity <= 0}
                        className="mt-5 w-full bg-black px-5 py-4 text-xs font-bold tracking-[0.2em] text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {product.stock_quantity <= 0
                          ? "OUT OF STOCK"
                          : "ADD TO BAG"}
                      </button>

                      <a
                        href={`/products/${product.slug}`}
                        className="mt-4 block text-center text-[10px] font-bold tracking-widest text-gray-600 transition hover:text-black"
                      >
                        VIEW PRODUCT ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  }

  const maleProducts = products.filter(
    (product) => (product.gender || "Unisex") === "Male" ||
      (product.gender || "Unisex") === "Unisex"
  );

  const femaleProducts = products.filter(
    (product) => (product.gender || "Unisex") === "Female" ||
      (product.gender || "Unisex") === "Unisex"
  );

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Announcement Bar */}
      <div className="bg-black px-4 py-3 text-center text-xs tracking-[0.2em] text-white">
        FREE DELIVERY ON ORDERS ABOVE RS. 10,000
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <a href="/" className="text-3xl font-black tracking-[0.2em]">
            FASHIONAI
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="/" className="transition hover:text-gray-500">HOME</a>
            <a href="/products" className="transition hover:text-gray-500">SHOP</a>
            <a href="/products" className="transition hover:text-gray-500">COLLECTIONS</a>
            <a href="/cart" className="transition hover:text-gray-500">CART</a>
          </nav>

          <div className="flex items-center gap-5">
            <a href="/products" className="hidden text-xs font-semibold tracking-widest sm:block">
              SEARCH
            </a>
            <a href="/cart" className="text-xs font-bold tracking-widest">
              BAG ({cartCount})
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[600px] overflow-hidden bg-[#eae8e4]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=2000"
            alt="Fashion collection"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>

        <div className="relative mx-auto flex min-h-[600px] max-w-7xl items-center px-6">
          <div className="max-w-xl text-white">
            <p className="mb-5 text-xs font-semibold tracking-[0.4em]">
              THE FUTURE OF FASHION
            </p>

            <h1 className="text-5xl font-bold leading-tight md:text-7xl">
              STYLE
              <br />
              MEETS
              <br />
              INTELLIGENCE.
            </h1>

            <p className="mt-7 max-w-md text-sm leading-7 text-white/90 md:text-base">
              Discover your personal style with thoughtfully selected
              fashion essentials and a smarter shopping experience.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a href="/products" className="bg-white px-8 py-4 text-xs font-bold tracking-widest text-black transition hover:bg-gray-200">
                EXPLORE COLLECTION
              </a>
              <a href="/products" className="border border-white px-8 py-4 text-xs font-bold tracking-widest text-white transition hover:bg-white hover:text-black">
                SHOP NOW
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-b border-gray-200">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 text-center md:grid-cols-4">
          <div>
            <h3 className="text-sm font-bold tracking-wider">PREMIUM QUALITY</h3>
            <p className="mt-2 text-xs text-gray-500">Carefully selected products</p>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider">SECURE SHOPPING</h3>
            <p className="mt-2 text-xs text-gray-500">A safer shopping experience</p>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider">FAST DELIVERY</h3>
            <p className="mt-2 text-xs text-gray-500">Delivered to your doorstep</p>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider">AI STYLE ASSISTANT</h3>
            <p className="mt-2 text-xs text-gray-500">Discover your personal style</p>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-gray-500">
            EXPLORE OUR WORLD
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-wider md:text-4xl">
            SHOP BY COLLECTION
          </h2>
          <p className="mt-4 text-sm text-gray-500">
            Find the pieces that define your style.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {collections.map((collection) => (
            <a
              href={collection.link}
              key={collection.name}
              className="group relative h-[450px] overflow-hidden bg-gray-100"
            >
              <img
                src={collection.image}
                alt={collection.name}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/40" />
              <div className="absolute bottom-10 left-8 text-white">
                <h3 className="text-3xl font-bold">{collection.name}</h3>
                <p className="mt-2 text-sm">{collection.description}</p>
                <span className="mt-6 inline-block border-b border-white pb-2 text-xs font-bold tracking-widest">
                  EXPLORE NOW →
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Error Message */}
      {!loading && error && (
        <div className="bg-white px-6 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 bg-black px-6 py-3 text-xs font-bold tracking-widest text-white"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Men's Collection */}
      {renderProductSection(
        "MEN'S COLLECTION",
        "Modern essentials and timeless looks for him.",
        maleProducts
      )}

      {/* Women's Collection */}
      {renderProductSection(
        "WOMEN'S COLLECTION",
        "Effortless fashion and everyday essentials for her.",
        femaleProducts
      )}

      {/* AI Assistant Section */}
      <section className="bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold tracking-[0.4em] text-gray-400">
            YOUR PERSONAL FASHION ASSISTANT
          </p>
          <h2 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            NOT SURE WHAT
            <br />
            LOOKS GOOD ON YOU?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-gray-400">
            Explore fashion products and discover styles that match
            your preferences with our FashionAI shopping experience.
          </p>
          <a href="/products" className="mt-9 inline-block bg-white px-10 py-4 text-xs font-bold tracking-widest text-black transition hover:bg-gray-200">
            EXPLORE FASHIONAI
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
          <div>
            <h2 className="text-2xl font-black tracking-[0.2em]">FASHIONAI</h2>
            <p className="mt-5 max-w-xs text-sm leading-7 text-gray-500">
              A smarter way to discover fashion, explore collections,
              and express your personal style.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest">SHOP</h3>
            <div className="mt-5 flex flex-col gap-4 text-sm text-gray-500">
              <a href="/products">All Products</a>
              <a href="/products">Women</a>
              <a href="/products">Men</a>
              <a href="/products">Accessories</a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest">CUSTOMER CARE</h3>
            <div className="mt-5 flex flex-col gap-4 text-sm text-gray-500">
              <a href="/cart">Shopping Bag</a>
              <a href="/products">Explore Products</a>
              <a href="/account">My Account</a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest">FOLLOW US</h3>
            <p className="mt-5 text-sm leading-7 text-gray-500">
              Stay connected for new collections, fashion inspiration,
              and updates.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-7xl border-t border-gray-200 pt-7 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} FASHIONAI. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </main>
  );
}
