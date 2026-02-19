import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['fs', 'path'],
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.shaitamam.com',
  },
};

export default nextConfig;
