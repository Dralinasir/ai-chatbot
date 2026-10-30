
"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingCart,
  Lock,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    cartCount,
    subtotal,
  } = useCart();

  const formatPrice = (price: number) =>
    `Rs. ${price.toLocaleString("en-PK")}`;

  return (
    <main className="min-h-screen bg-white px-4 py-12 text-black sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 border-b border-gray-200 pb-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-gray-500">
            YOUR SHOPPING BAG
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Shopping Cart
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {cartCount} {cartCount === 1 ? "item" : "items"} in your bag
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag size={38} strokeWidth={1.3} />
            </div>
            <h2 className="text-2xl font-bold">Your bag is empty</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-500">
              You haven't added any products to your shopping bag yet.
              Explore our collection and find something you love.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-3 bg-black px-8 py-4 text-xs font-bold tracking-widest text-white transition hover:bg-gray-800"
            >
              <ShoppingCart size={16} />
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-widest">
                  CART ITEMS
                </h2>
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-red-600 hover:text-red-800"
                >
                  CLEAR CART
                </button>
              </div>

              <div className="divide-y divide-gray-200 border-y border-gray-200">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-5 py-7 sm:flex-row"
                  >
                    <div className="h-36 w-full flex-shrink-0 bg-gray-100 sm:w-32">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest text-gray-500">
                          {item.category}
                        </p>
                        <h3 className="mt-2 text-base font-semibold">
                          {item.name}
                        </h3>
                        <p className="mt-2 text-sm font-bold">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center border border-gray-300">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                            className="p-3 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-10 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            aria-label="Increase quantity"
                            className="p-3 transition hover:bg-gray-100"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-500 transition hover:text-red-600"
                        >
                          <Trash2 size={15} />
                          REMOVE
                        </button>
                      </div>
                    </div>

                    <div className="text-right sm:min-w-28">
                      <p className="text-sm font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/products"
                className="mt-7 inline-flex items-center gap-2 text-xs font-bold tracking-widest hover:text-gray-500"
              >
                <ArrowLeft size={15} />
                CONTINUE SHOPPING
              </Link>
            </section>

            <aside className="h-fit border border-gray-200 p-6">
              <h2 className="border-b border-gray-200 pb-5 text-sm font-bold tracking-widest">
                ORDER SUMMARY
              </h2>

              <div className="space-y-5 py-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Items ({cartCount})
                  </span>
                  <span className="font-semibold">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-xs font-semibold">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="flex justify-between border-t border-gray-200 py-6">
                <span className="text-sm font-bold">SUBTOTAL</span>
                <span className="text-lg font-bold">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="mb-6 text-xs leading-5 text-gray-500">
                Shipping charges and any applicable taxes will be
                calculated during checkout.
              </p>

              <Link
                href="/checkout"
                className="flex w-full items-center justify-center gap-2 bg-black px-6 py-4 text-xs font-bold tracking-widest text-white transition hover:bg-gray-800"
              >
                <Lock size={15} />
                PROCEED TO CHECKOUT
              </Link>

              <p className="mt-4 text-center text-[10px] text-gray-400">
                Secure shopping experience
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
