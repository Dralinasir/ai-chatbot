
"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Send } from "lucide-react";
import { useState } from "react";

export default function AssistantPage() {
  const [message, setMessage] = useState("");

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to FashionAI
        </Link>

        <div className="mt-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-black">
            <Sparkles size={30} />
          </div>

          <h1 className="mt-6 text-4xl font-bold">
            Meet Your AI Stylist
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Tell us what you're looking for. Get fashion inspiration
            and outfit suggestions tailored to your style.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-4 text-sm text-gray-400">
            What would you like help with?
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              "Suggest a casual outfit",
              "Help me find a party look",
              "What should I wear with black jeans?",
              "Suggest a minimalist style",
            ].map((item) => (
              <button
                key={item}
                onClick={() => setMessage(item)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white hover:text-black"
              >
                {item}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!message.trim()) return;
              alert(
                "AI Stylist chat backend abhi connect nahi hua. Agle step mein isay functional banayenge."
              );
            }}
            className="mt-6 flex gap-2"
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your style..."
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black px-4 py-3 text-sm outline-none focus:border-white"
            />

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              <Send size={17} />
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
