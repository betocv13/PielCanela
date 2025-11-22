import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/providers/CartProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Piel Canela Coffee",
  description: "Order delicious coffee and matcha drinks from Piel Canela. A taste that feels like home.",
  keywords: ["coffee", "matcha", "piel canela", "local coffee", "order coffee"],
  authors: [{ name: "Piel Canela Coffee" }],
  openGraph: {
    title: "Piel Canela Coffee",
    description: "Order delicious coffee and matcha drinks from Piel Canela. A taste that feels like home.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-body antialiased min-h-screen`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
