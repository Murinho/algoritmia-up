import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'flagcdn.com'},
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/event_banners/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/avatars/**',
      },
      {
        protocol: "https",
        hostname: "pub-39d0e5e5c0744c638a8637d82f24b5de.r2.dev",
        pathname: "/**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
export default nextConfig;

