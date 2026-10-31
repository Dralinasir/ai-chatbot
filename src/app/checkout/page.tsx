
"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import {
  ShoppingBag,
  ArrowLeft,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    postalCode: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);

  const formatPrice = (price: number) =>
    `Rs. ${price.toLocaleString("en-PK")}`;

  const shipping = subtotal >= 10000 || subtotal === 0 ? 0 : 250;
  const total = subtotal + shipping;

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your shopping bag is empty.");
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.city ||
      !form.address.trim()
    ) {
      setError("Please complete all required delivery details.");
      return;
    }

    if (paymentMethod !== "cod") {
      setError("Only Cash on Delivery is currently available.");
      return;
    }

    if (items.some((item) => !item.size?.trim())) {
      setError("Please select a size for every product.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({
            id: String(item.id),
            size: item.size,
            quantity: Number(item.quantity),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to place your order.");
      }

      if (
        !data.success ||
        !data.orderNumber ||
        !Number.isFinite(Number(data.total))
      ) {
        throw new Error("The server returned an invalid order response.");
      }

      setConfirmedTotal(Number(data.total));
      setOrderNumber(data.orderNumber);
      clearCart();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderNumber) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle size={45} />
        </div>

        <h1 className="mt-7 text-3xl font-bold">
          Order Placed Successfully!
        </h1>

        <p className="mt-3 max-w-md text-sm leading-7 text-gray-500">
          Thank you for shopping with FashionAI. Your Cash on Delivery
          order has been saved successfully.
        </p>

        <div className="mt-8 w-full max-w-md border border-gray-200 p-6">
          <p className="text-xs font-semibold tracking-widest text-gray-500">
            YOUR ORDER NUMBER
          </p>

          <p className="mt-3 text-xl font-bold">{orderNumber}</p>

          <p className="mt-4 text-sm text-gray-500">
            Total: {formatPrice(confirmedTotal ?? 0)}
          </p>
        </div>

        <Link
          href="/products"
          className="mt-8 bg-black px-8 py-4 text-xs font-bold tracking-widest text-white hover:bg-gray-800"
        >
          CONTINUE SHOPPING
        </Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
        <ShoppingBag size={55} strokeWidth={1.2} />

        <h1 className="mt-6 text-3xl font-bold">
          Your bag is empty
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          Add some products before proceeding to checkout.
        </p>

        <Link
          href="/products"
          className="mt-8 bg-black px-8 py-4 text-xs font-bold tracking-widest text-white"
        >
          CONTINUE SHOPPING
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-4 py-12 text-black sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-black"
          >
            <ArrowLeft size={15} />
            BACK TO CART
          </Link>

          <h1 className="mt-6 text-4xl font-bold">Checkout</h1>

          <p className="mt-3 text-sm text-gray-500">
            Complete your delivery details to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
            <div className="space-y-8">
              <section className="bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center bg-gray-100">
                    <MapPin size={19} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      Delivery Information
                    </h2>

                    <p className="text-xs text-gray-500">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold">
                      Full Name *
                    </label>

                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                      className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      Phone Number *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="03XXXXXXXXX"
                      className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      City *
                    </label>

                    <select
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                    >
                      <option value="">Select your city</option>
                      <option value="Sargodha">Sargodha</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Multan">Multan</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Gujranwala">Gujranwala</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      Postal Code
                    </label>

                    <input
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      placeholder="Postal code"
                      className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold">
                      Complete Delivery Address *
                    </label>

                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="House number, street, area, landmark..."
                      className="w-full resize-none border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold">
                      Additional Notes
                    </label>

                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Any special delivery instructions?"
                      className="w-full resize-none border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-bold">Payment Method</h2>

                <p className="mt-2 text-xs text-gray-500">
                  Select your preferred payment option.
                </p>

                <label className="mt-6 flex cursor-pointer items-center gap-4 border border-black p-5">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 accent-black"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-bold">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Pay when your order arrives.
                    </p>
                  </div>

                  <Truck size={23} />
                </label>
              </section>
            </div>

            <aside className="h-fit bg-white p-6 shadow-sm sm:p-8">
              <h2 className="border-b border-gray-200 pb-5 text-lg font-bold">
                Your Order
              </h2>

              <div className="max-h-[400px] space-y-5 overflow-y-auto py-6">
                {items.map((item) => (
                  <div key={item.cartKey} className="flex gap-4">
                    <div className="relative h-20 w-16 flex-shrink-0 bg-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />

                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-white">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">
                        {item.name}
                      </h3>

                      <p className="mt-2 text-xs text-gray-500">
                        {item.category}
                      </p>

                      <p className="mt-2 text-xs text-gray-600">
                        Size: <span className="font-semibold text-black">{item.size}</span>
                      </p>

                      <p className="mt-2 text-sm font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-gray-200 py-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <div className="flex justify-between">
                    <span className="font-bold">TOTAL</span>
                    <span className="text-xl font-bold">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-5 border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black px-6 py-5 text-xs font-bold tracking-[0.2em] text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "PLACING YOUR ORDER..."
                  : "CONTINUE TO PLACE ORDER"}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={16} />
                Your information is handled securely.
              </div>
            </aside>
          </div>
        </form>

        <div className="mt-10 text-center text-xs text-gray-400">
          FASHIONAI · SHOP WITH CONFIDENCE
        </div>
      </div>
    </main>
  );
}
