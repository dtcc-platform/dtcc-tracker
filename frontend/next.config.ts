import { NextConfig } from 'next';
import path from 'path';
import dotenv from 'dotenv';

// Load the .env file from the repo root (tracker/.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config: NextConfig = {
  // Make sure to prefix any variable that needs to be exposed to the client with NEXT_PUBLIC_
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  // Other Next.js config options can go here...
  eslint: {
    ignoreDuringBuilds: true,
  }
};
// next.config.js
module.exports = {
  basePath: '/tracker',
  assetPrefix: '/tracker',
  trailingSlash: true,
}

export default config;
