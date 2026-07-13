import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Redirect non-www to www so Google treats www.bagmati.shop as the canonical domain
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'bagmati.shop',
          },
        ],
        destination: 'https://www.bagmati.shop/:path*',
        permanent: true, // 301 redirect — tells Google to update its index
      },
    ];
  },
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
