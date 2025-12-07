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
};

module.exports = nextConfig;

