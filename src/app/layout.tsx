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
  alternates: {
    canonical: "https://www.bagmati.shop",
  },
  openGraph: {
    title: "Bagmati Shop | Elevate Your Lifestyle",
    description: "Discover a curated collection of high-end products at Bagmati Shop. Experience the next generation of online shopping.",
    type: "website",
    locale: "en_US",
    siteName: "Bagmati Shop",
    url: "https://www.bagmati.shop",
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
import TrafficTracker from "@/components/layout/TrafficTracker";

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
            gtag('config', 'G-Q637T9HD97', {
              send_page_view: true
            });
          `}
        </Script>

        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || '2453397678476892'}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID || '2453397678476892'}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        {/* Microsoft Clarity Code */}
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script","${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");
            `}
          </Script>
        )}
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TrafficTracker />
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
        <FloatingChat />
      </body>
    </html>
  );
}
