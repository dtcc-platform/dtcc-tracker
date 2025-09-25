import type { NextConfig } from 'next';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },

  eslint: {
    ignoreDuringBuilds: true, 
  },

  basePath: '/tracker',
  assetPrefix: '/tracker',
  trailingSlash: true,
};

export default nextConfig;
