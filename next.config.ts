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
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
export default nextConfig;

