import type { NextConfig } from "next";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy /api/* to Strapi backend (avoids CORS in both dev and production)
    if (process.env.NEXT_PUBLIC_API_MODE === 'live' && STRAPI_URL !== 'http://localhost:1337') {
      return [
        {
          source: '/api/:path*',
          destination: `${STRAPI_URL}/api/:path*`,
        },
      ];
    }
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
      },
    ],
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
