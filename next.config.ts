import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cukcxhvfgzaayjypykny.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'shblzjrzulnrsarfxptv.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.daraz.com.np',
      },
      {
        protocol: 'https',
        hostname: '**.daraz.com',
      },
      {
        protocol: 'http',
        hostname: '**.daraz.com.np',
      },
      {
        protocol: 'http',
        hostname: '**.daraz.com',
      },
      {
        protocol: 'https',
        hostname: '**.slatic.net',
      },
      {
        protocol: 'http',
        hostname: '**.slatic.net',
      },
      {
        protocol: 'https',
        hostname: '**.alicdn.com',
      },
      {
        protocol: 'http',
        hostname: '**.alicdn.com',
      }
    ],
  },
};

export default nextConfig;
