/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimal untuk hosting Node.js / hPanel / VPS / Vercel
  devIndicators: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
    ],
  },
  // Allow large file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};
module.exports = nextConfig;
