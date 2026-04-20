const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy /api/* to Strapi backend (avoids CORS).
    // Local-only dev (localhost Strapi) doesn't need the rewrite.
    if (STRAPI_URL === 'http://localhost:1337') return [];
    return [
      {
        source: '/api/:path*',
        destination: `${STRAPI_URL}/api/:path*`,
      },
    ];
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
