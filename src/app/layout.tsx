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
    default: "Bagmati Shop | Premium Online Store",
    template: "%s | Bagmati Shop"
  },
  description: "Shop the latest premium gadgets, fashion, and home essentials at Bagmati Shop. Experience seamless shopping with fast delivery, secure guest checkout, and 24/7 real-time support.",
  keywords: ["Bagmati Shop", "online shopping Nepal", "premium gadgets", "online shopping", "electronics", "fashion", "home essentials", "fast delivery", "secure payments"],
  authors: [{ name: "Bagmati Traders" }],
  creator: "Bagmati Shop Team",
  publisher: "Bagmati Traders",
  robots: "index, follow",
  openGraph: {
    title: "Bagmati Shop | Elevate Your Lifestyle",
    description: "Discover a curated collection of high-end products at Bagmati Shop. Experience the next generation of online shopping.",
    type: "website",
    locale: "en_US",
    siteName: "Bagmati Shop",
    url: "https://bagmati.shop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bagmati Shop | Premium Shopping",
    description: "Shop premium. Shop fast. Shop secure.",
    creator: "@bagmatishop",
  },
  icons: {
    icon: "/icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

import Footer from "@/components/layout/Footer";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q637T9HD97"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q637T9HD97');
          `}
        </Script>
      </head>
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
