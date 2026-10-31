
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Package,
  ShoppingBag,
  RefreshCw,
  ArrowRight,
  Clock,
} from "lucide-react";

type Order = {
  id: number;
  order_number: string;
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
  status: string;
  created_at: string;
};

function formatPrice(value: number | string) {
  return `Rs. ${Number(value).toLocaleString("en-PK")}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/account/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/account";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load orders.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <main className="min-h-screen bg-white px-4 py-12 text-black sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/account"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back to account
        </Link>

        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Your account
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">My Orders</h1>
            <p className="mt-2 text-gray-500">
              View and track your LUXORA purchases.
            </p>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 p-12 text-center">
            <Package className="mx-auto mb-4 h-10 w-10 animate-pulse text-gray-400" />
            <p className="text-gray-500">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              onClick={loadOrders}
              className="mt-4 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 px-6 py-16 text-center">
            <ShoppingBag className="mx-auto mb-5 h-12 w-12 text-gray-300" />
            <h2 className="text-xl font-bold">No orders yet</h2>
            <p className="mt-2 text-gray-500">
              Your purchases will appear here after checkout.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-7 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Start shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-gray-200 p-5 sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Order number
                    </p>
                    <h2 className="mt-1 text-lg font-bold">
                      {order.order_number}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {new Date(order.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${
                      statusColors[order.status?.toLowerCase()] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Subtotal</p>
                    <p className="mt-1 font-semibold">
                      {formatPrice(order.subtotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Shipping</p>
                    <p className="mt-1 font-semibold">
                      {formatPrice(order.shipping)}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="mt-1 text-lg font-bold">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
