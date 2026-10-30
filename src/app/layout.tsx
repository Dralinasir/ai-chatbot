import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";

export const metadata: Metadata = {
  title: "FashionAI | AI Fashion Shopping Assistant",
  description:
    "Discover your personal style with FashionAI. Explore modern fashion, everyday essentials, and your AI styling assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}