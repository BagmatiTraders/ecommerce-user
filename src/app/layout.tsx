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
    default: "Bagmati Shop | Online Shopping at Best Price in Nepal",
    template: "%s | Bagmati Shop"
  },
  description: "Shop online at Bagmati Shop — Nepal's trusted online store. Buy gadgets, electronics, fashion, and home essentials at best price with fast delivery and cash on delivery across Nepal.",
  keywords: [
    "online shopping Nepal",
    "buy online Nepal",
    "online store Nepal",
    "ecommerce Nepal",
    "best price Nepal",
    "cash on delivery Nepal",
    "Bagmati Shop",
    "Bagmati Traders",
    "electronics Nepal",
    "gadgets Nepal",
    "fast delivery Nepal",
    "online shopping Kathmandu",
  ],
  authors: [{ name: "Bagmati Traders" }],
  creator: "Bagmati Shop Team",
  publisher: "Bagmati Traders",
  robots: "index, follow",
  alternates: {
    canonical: "https://www.bagmati.shop",
  },
  openGraph: {
    title: "Bagmati Shop | Online Shopping at Best Price in Nepal",
    description: "Nepal's trusted online store. Buy gadgets, electronics, fashion, and home essentials at best price with fast delivery and cash on delivery.",
    type: "website",
    locale: "en_US",
    siteName: "Bagmati Shop",
    url: "https://www.bagmati.shop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bagmati Shop | Online Shopping in Nepal",
    description: "Best price. Fast delivery. Cash on delivery across Nepal.",
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

        {/* WebSite Schema — enables Google Sitelinks Search Box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              'name': 'Bagmati Shop',
              'alternateName': 'Bagmati Traders Online Store',
              'url': 'https://www.bagmati.shop',
              'potentialAction': {
                '@type': 'SearchAction',
                'target': {
                  '@type': 'EntryPoint',
                  'urlTemplate': 'https://www.bagmati.shop/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* Organization Schema — helps Google show your business in Knowledge Panel */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              'name': 'Bagmati Shop',
              'alternateName': 'Bagmati Traders',
              'url': 'https://www.bagmati.shop',
              'logo': 'https://www.bagmati.shop/icon.png',
              'contactPoint': {
                '@type': 'ContactPoint',
                'contactType': 'customer service',
                'areaServed': 'NP',
                'availableLanguage': ['English', 'Nepali'],
              },
              'areaServed': {
                '@type': 'Country',
                'name': 'Nepal',
              },
              'sameAs': [
                'https://www.facebook.com/bagmatishop',
              ],
            }),
          }}
        />
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
