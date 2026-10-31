
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  UserRound,
  Package,
  ArrowLeft,
  Mail,
  Lock,
  LogIn,
  Sparkles,
  LogOut,
  Loader2,
} from "lucide-react";

type Customer = {
  id: number;
  fullName: string;
  email: string;
};

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });

        const data = await response.json();

        if (response.ok && data.authenticated && data.customer) {
          setCustomer(data.customer);
        }
      } catch {
        setError("Could not check your account session. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      const body =
        mode === "login"
          ? { email: email.trim(), password }
          : {
              fullName: fullName.trim(),
              email: email.trim(),
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Authentication failed."
        );
      }

      if (!data.customer) {
        throw new Error("Account response was incomplete. Please try again.");
      }

      setCustomer(data.customer);
      setPassword("");
      setMessage(
        mode === "login"
          ? "You have successfully logged in."
          : "Your account has been created successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logout failed.");
      }

      setCustomer(null);
      setFullName("");
      setEmail("");
      setPassword("");
      setMode("login");
      setMessage("You have been logged out successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not log out."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Store
        </Link>

        <div className="mt-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-black">
            <UserRound size={30} />
          </div>

          <h1 className="mt-5 text-3xl font-bold">My Account</h1>
          <p className="mt-2 text-sm text-gray-400">
            Welcome to FashionAI. Manage your shopping account.
          </p>
        </div>

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-10 text-gray-400">
            <Loader2 className="animate-spin" size={20} />
            Checking your account...
          </div>
        ) : customer ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-black">
                <UserRound size={30} />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Welcome, {customer.fullName}
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                {customer.email}
              </p>

              <p className="mt-4 text-sm text-green-400">
                Your account is active.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={submitting}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-3 font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
                className={`rounded-lg py-3 text-sm font-medium ${
                  mode === "login"
                    ? "bg-white text-black"
                    : "text-gray-400"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                  setMessage("");
                }}
                className={`rounded-lg py-3 text-sm font-medium ${
                  mode === "register"
                    ? "bg-white text-black"
                    : "text-gray-400"
                }`}
              >
                Create Account
              </button>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={100}
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Email Address
                </label>
                <div className="flex items-center rounded-xl border border-white/10 bg-black px-4">
                  <Mail size={18} className="text-gray-500" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent px-3 py-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Password
                </label>
                <div className="flex items-center rounded-xl border border-white/10 bg-black px-4">
                  <Lock size={18} className="text-gray-500" />
                  <input
                    required
                    type="password"
                    minLength={8}
                    maxLength={128}
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-transparent px-3 py-3 outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-semibold text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                {submitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Create Account"}
              </button>
            </form>
          </div>
        )}

        {message && (
          <p className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-center text-sm text-green-400">
            {message}
          </p>
        )}

        {error && customer && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/orders"
            className="rounded-xl border border-white/10 p-4 text-center hover:bg-white/5"
          >
            <Package className="mx-auto mb-2" />
            <span className="text-sm">My Orders</span>
          </Link>

          <Link
            href="/assistant"
            className="rounded-xl border border-white/10 p-4 text-center hover:bg-white/5"
          >
            <Sparkles className="mx-auto mb-2" />
            <span className="text-sm">AI Stylist</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
