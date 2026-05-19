import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FloatingChat from "@/components/ui/FloatingChat";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EcoMmerce | Premium Lifestyle Store",
    template: "%s | EcoMmerce"
  },
  description: "Shop the latest premium gadgets, fashion, and home essentials. Experience seamless shopping with fast delivery, secure guest checkout, and 24/7 real-time support.",
  keywords: ["ecommerce", "premium gadgets", "online shopping", "electronics", "fashion", "home essentials", "fast delivery", "secure payments"],
  authors: [{ name: "Bagmati Traders" }],
  creator: "EcoMmerce Team",
  publisher: "Bagmati Traders",
  robots: "index, follow",
  openGraph: {
    title: "EcoMmerce | Elevate Your Lifestyle",
    description: "Discover a curated collection of high-end products. Experience the next generation of online shopping.",
    type: "website",
    locale: "en_US",
    siteName: "EcoMmerce",
    url: "https://ecommerce-web.vercel.app", // Placeholder
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoMmerce | Premium Shopping",
    description: "Shop premium. Shop fast. Shop secure.",
    creator: "@ecommerce",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import Footer from "@/components/layout/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
        <FloatingChat />
      </body>
    </html>
  );
}
