/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // enable standalone output for docker
  output: 'standalone',
  // transpile packages from monorepo
  transpilePackages: ['@gym-journal/database'],
  // image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  // silence "webpack config but no turbopack config" when PWA plugin adds webpack; dev uses Turbopack
  turbopack: {},
};

// PWA: enable only for production build to avoid dev issues
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

module.exports = withPWA(nextConfig);

